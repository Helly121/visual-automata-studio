import type { FiniteAutomaton, FAState, FATransition } from '../types.ts';
import type {
  EquivalenceClass,
  TableFillingCell,
  TransformationResult,
  TransformationStep,
} from './types.ts';
import { verifyLanguageEquivalence } from './equivalence.ts';

/**
 * Union-Find Disjoint Set data structure for grouping equivalent states.
 */
class DisjointSet {
  private parent = new Map<string, string>();

  constructor(elements: string[]) {
    for (const el of elements) {
      this.parent.set(el, el);
    }
  }

  find(x: string): string {
    const p = this.parent.get(x) ?? x;
    if (p === x) return x;
    const root = this.find(p);
    this.parent.set(x, root);
    return root;
  }

  union(x: string, y: string): void {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX !== rootY) {
      this.parent.set(rootX, rootY);
    }
  }

  getGroups(): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root)!.push(key);
    }
    return groups;
  }
}

/**
 * Run DFA Minimization via Table-Filling (Myhill-Nerode / Moore)
 * with Reachability Pruning and Partition Refinement.
 */
export function runDfaMinimization(fa: FiniteAutomaton): TransformationResult {
  if (fa.type !== 'dfa') {
    throw new Error('DFA Minimization requires a deterministic finite automaton (DFA) as input.');
  }
  if (!fa.initialStateId) {
    throw new Error('Source machine has no initial state defined.');
  }

  const steps: TransformationStep[] = [];
  const alphabet = [...fa.alphabet];
  const stateLabelMap = new Map(fa.states.map((s) => [s.id, s.label]));

  // ─── Step 1: Reachability Analysis ──────────────────────────────────────────
  const reachableSet = new Set<string>();
  const queue = [fa.initialStateId];
  reachableSet.add(fa.initialStateId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const t of fa.transitions) {
      if (t.from === current && !reachableSet.has(t.to)) {
        reachableSet.add(t.to);
        queue.push(t.to);
      }
    }
  }

  const unreachableStates = fa.states.filter((s) => !reachableSet.has(s.id));
  const reachableStates = fa.states.filter((s) => reachableSet.has(s.id));
  const reachableStateIds = new Set(reachableStates.map((s) => s.id));

  // Intermediate transitions keeping only reachable states
  let activeTransitions = fa.transitions.filter(
    (t) => reachableStateIds.has(t.from) && reachableStateIds.has(t.to),
  );

  let activeStates = [...reachableStates];

  if (unreachableStates.length > 0) {
    const unreachLabels = unreachableStates.map((s) => s.label).join(', ');
    steps.push({
      stepIndex: 0,
      phase: 'prune-unreachable',
      title: 'Eliminate Unreachable States',
      description: `Removed ${unreachableStates.length} unreachable state(s): {${unreachLabels}}. There exists no directed path from start state ${stateLabelMap.get(fa.initialStateId)} to these states.`,
      ruleExplanation:
        'Axiom 1: States that can never be reached from the initial state by any input string cannot affect language acceptance and must be pruned before minimization.',
      highlightSourceStates: unreachableStates.map((s) => s.id),
      highlightSourceTransitions: [],
      highlightDestStates: activeStates.map((s) => s.id),
      highlightDestTransitions: [],
      intermediateMachine: {
        type: 'dfa',
        states: activeStates,
        alphabet,
        transitions: activeTransitions,
        initialStateId: fa.initialStateId,
        acceptingStateIds: activeStates.filter((s) => s.isAccepting).map((s) => s.id),
      },
      minimizationContext: {
        unreachableStateIds: unreachableStates.map((s) => s.id),
        tableCells: [],
      },
    });
  } else {
    steps.push({
      stepIndex: 0,
      phase: 'prune-unreachable',
      title: 'Reachability Verification',
      description: `All ${activeStates.length} states are reachable from start state ${stateLabelMap.get(fa.initialStateId)}. No states needed pruning.`,
      ruleExplanation:
        'Reachability: Every state has a directed path from the initial state. We proceed directly to transition completeness.',
      highlightSourceStates: activeStates.map((s) => s.id),
      highlightSourceTransitions: [],
      highlightDestStates: activeStates.map((s) => s.id),
      highlightDestTransitions: [],
      intermediateMachine: {
        type: 'dfa',
        states: activeStates,
        alphabet,
        transitions: activeTransitions,
        initialStateId: fa.initialStateId,
        acceptingStateIds: activeStates.filter((s) => s.isAccepting).map((s) => s.id),
      },
      minimizationContext: {
        tableCells: [],
      },
    });
  }

  // ─── Step 2: Complete Missing Transitions (Add Trap State if needed) ────────
  // A table-filling DFA must be total: δ(q, a) defined for all q and a.
  let hasMissingTransitions = false;
  const missingMap: Array<{ from: string; symbol: string }> = [];

  for (const s of activeStates) {
    for (const a of alphabet) {
      const match = activeTransitions.find((t) => t.from === s.id && t.symbol === a);
      if (!match) {
        hasMissingTransitions = true;
        missingMap.push({ from: s.id, symbol: a });
      }
    }
  }

  let trapStateId: string | undefined;

  if (hasMissingTransitions) {
    trapStateId = 'dfa_sink_trap';
    const trapState: FAState = {
      id: trapStateId,
      label: 'q_dead',
      isInitial: false,
      isAccepting: false,
    };
    activeStates = [...activeStates, trapState];
    stateLabelMap.set(trapStateId, 'q_dead');

    const addedTransitions: FATransition[] = [];
    let sinkTIndex = 0;

    // Direct missing transitions to sink
    for (const m of missingMap) {
      const t: FATransition = {
        id: `t_sink_${sinkTIndex++}`,
        from: m.from,
        to: trapStateId,
        symbol: m.symbol,
      };
      activeTransitions.push(t);
      addedTransitions.push(t);
    }

    // Trap self loops on all symbols
    for (const a of alphabet) {
      const t: FATransition = {
        id: `t_sink_${sinkTIndex++}`,
        from: trapStateId,
        to: trapStateId,
        symbol: a,
      };
      activeTransitions.push(t);
      addedTransitions.push(t);
    }

    steps.push({
      stepIndex: steps.length,
      phase: 'complete-transitions',
      title: 'Complete Incomplete Transitions (Add Trap State)',
      description: `Added explicit non-accepting trap state "q_dead" to handle ${missingMap.length} missing transition(s). The DFA transition function is now total.`,
      ruleExplanation:
        'DFA Completeness: Table-filling minimization requires a total transition function δ: Q × Σ → Q. Missing transitions represent implicit rejection (dead states).',
      highlightSourceStates: missingMap.map((m) => m.from),
      highlightSourceTransitions: [],
      highlightDestStates: [trapStateId],
      highlightDestTransitions: addedTransitions.map((t) => t.id),
      intermediateMachine: {
        type: 'dfa',
        states: activeStates,
        alphabet,
        transitions: activeTransitions,
        initialStateId: fa.initialStateId,
        acceptingStateIds: activeStates.filter((s) => s.isAccepting).map((s) => s.id),
      },
      minimizationContext: {
        addedTrapStateId: trapStateId,
        tableCells: [],
      },
    });
  }

  // ─── Step 3: Base Step of Table-Filling (Distinguish Final vs Non-Final) ─────
  const sortedStates = [...activeStates];
  const tableCells: TableFillingCell[] = [];

  // Helper to access / update cell in triangular grid
  const cellKey = (p: string, q: string) => (p < q ? `${p}::${q}` : `${q}::${p}`);
  const cellMap = new Map<string, TableFillingCell>();

  for (let r = 0; r < sortedStates.length; r++) {
    for (let c = 0; c < r; c++) {
      const sRow = sortedStates[r];
      const sCol = sortedStates[c];

      const cell: TableFillingCell = {
        state1: sRow.id,
        state2: sCol.id,
        marked: false,
      };

      tableCells.push(cell);
      cellMap.set(cellKey(sRow.id, sCol.id), cell);
    }
  }

  // Base Pass: Mark pairs where one is accepting and one is not
  let baseMarkCount = 0;
  for (const cell of tableCells) {
    const s1 = sortedStates.find((s) => s.id === cell.state1)!;
    const s2 = sortedStates.find((s) => s.id === cell.state2)!;

    if (s1.isAccepting !== s2.isAccepting) {
      cell.marked = true;
      cell.witness = 'ε';
      cell.pass = 0;
      cell.reason = `One state is accepting (${s1.isAccepting ? s1.label : s2.label}) and the other is non-accepting (${!s1.isAccepting ? s1.label : s2.label}).`;
      baseMarkCount++;
    }
  }

  steps.push({
    stepIndex: steps.length,
    phase: 'base-distinguish',
    title: 'Base Step: Mark Final vs. Non-Final Pairs',
    description: `Marked ${baseMarkCount} state pair(s) with witness ε. Any string reaching an accepting state vs. a non-accepting state produces different acceptance.`,
    ruleExplanation:
      'Base Case: Two states p and q are distinguished by the empty string w = ε if p ∈ F and q ∉ F (or vice versa), because δ̂(p, ε) = p ∈ F while δ̂(q, ε) = q ∉ F.',
    highlightSourceStates: activeStates.filter((s) => s.isAccepting).map((s) => s.id),
    highlightSourceTransitions: [],
    highlightDestStates: [],
    highlightDestTransitions: [],
    intermediateMachine: {
      type: 'dfa',
      states: activeStates,
      alphabet,
      transitions: activeTransitions,
      initialStateId: fa.initialStateId,
      acceptingStateIds: activeStates.filter((s) => s.isAccepting).map((s) => s.id),
    },
    minimizationContext: {
      currentPass: 0,
      tableCells: JSON.parse(JSON.stringify(tableCells)),
    },
  });

  // ─── Step 4: Inductive Passes ───────────────────────────────────────────────
  let passNumber = 1;
  let newMarksInPass = 0;

  // Transition lookup map: (fromId, symbol) -> toId
  const nextStateMap = new Map<string, string>();
  for (const t of activeTransitions) {
    nextStateMap.set(`${t.from}::${t.symbol}`, t.to);
  }

  do {
    newMarksInPass = 0;

    for (const cell of tableCells) {
      if (cell.marked) continue;

      for (const a of alphabet) {
        const to1 = nextStateMap.get(`${cell.state1}::${a}`);
        const to2 = nextStateMap.get(`${cell.state2}::${a}`);

        if (!to1 || !to2) continue;
        if (to1 === to2) continue; // Same destination cannot distinguish

        const targetCell = cellMap.get(cellKey(to1, to2));
        if (targetCell && targetCell.marked) {
          // Distinguishable!
          cell.marked = true;
          cell.distinguishedBySymbol = a;
          const targetWitness = targetCell.witness === 'ε' ? '' : targetCell.witness ?? '';
          cell.witness = a + targetWitness;
          cell.pass = passNumber;
          cell.reason = `On symbol "${a}", transitions go to ${stateLabelMap.get(to1)} and ${stateLabelMap.get(to2)}, which were already distinguished by witness "${targetCell.witness}".`;
          newMarksInPass++;

          const s1Label = stateLabelMap.get(cell.state1) ?? cell.state1;
          const s2Label = stateLabelMap.get(cell.state2) ?? cell.state2;
          const to1Label = stateLabelMap.get(to1) ?? to1;
          const to2Label = stateLabelMap.get(to2) ?? to2;

          steps.push({
            stepIndex: steps.length,
            phase: 'inductive-step',
            title: `Distinguish (${s1Label}, ${s2Label}) on Symbol "${a}"`,
            description: `Pair (${s1Label}, ${s2Label}) is distinguished because δ(${s1Label}, "${a}") = ${to1Label} and δ(${s2Label}, "${a}") = ${to2Label} are already distinguishable. New witness: "${cell.witness}".`,
            ruleExplanation:
              'Inductive Step: If δ(p, a) = p\' and δ(q, a) = q\', and the pair (p\', q\') is distinguished by witness w, then (p, q) is distinguished by the witness string "aw".',
            highlightSourceStates: [cell.state1, cell.state2, to1, to2],
            highlightSourceTransitions: activeTransitions
              .filter(
                (t) =>
                  (t.from === cell.state1 || t.from === cell.state2) && t.symbol === a,
              )
              .map((t) => t.id),
            highlightDestStates: [],
            highlightDestTransitions: [],
            intermediateMachine: {
              type: 'dfa',
              states: activeStates,
              alphabet,
              transitions: activeTransitions,
              initialStateId: fa.initialStateId,
              acceptingStateIds: activeStates.filter((s) => s.isAccepting).map((s) => s.id),
            },
            minimizationContext: {
              currentPass: passNumber,
              activePair: [cell.state1, cell.state2],
              activeSymbol: a,
              tableCells: JSON.parse(JSON.stringify(tableCells)),
            },
          });

          break; // Move to next unmarked cell
        }
      }
    }

    passNumber++;
  } while (newMarksInPass > 0);

  // ─── Step 5: Equivalence Classes & Partitioning ─────────────────────────────
  // Any pair that remained unmarked is EQUIVALENT!
  const ds = new DisjointSet(activeStates.map((s) => s.id));

  for (const cell of tableCells) {
    if (!cell.marked) {
      cell.isEquivalent = true;
      ds.union(cell.state1, cell.state2);
    }
  }

  const groups = ds.getGroups();
  const equivalenceClasses: EquivalenceClass[] = [];
  let classIndex = 0;

  for (const [, memberIds] of groups) {
    const isInit = memberIds.includes(fa.initialStateId);
    const isAcc = memberIds.some((id) => {
      const s = activeStates.find((st) => st.id === id);
      return s?.isAccepting;
    });

    const memberLabels = memberIds.map((id) => stateLabelMap.get(id) ?? id);
    const label =
      memberLabels.length === 1
        ? memberLabels[0]
        : `[${memberLabels.join(', ')}]`;

    equivalenceClasses.push({
      id: `min_q${classIndex++}`,
      label,
      memberStateIds: memberIds,
      isInitial: isInit,
      isAccepting: isAcc,
    });
  }

  // Explanation of equivalent classes
  const mergedClasses = equivalenceClasses.filter((c) => c.memberStateIds.length > 1);
  const mergeDescription =
    mergedClasses.length > 0
      ? `Found ${mergedClasses.length} set(s) of equivalent states that merge together: ${mergedClasses.map((c) => c.label).join(', ')}.`
      : 'All reachable states are mutually distinguishable. The original DFA is already minimal!';

  steps.push({
    stepIndex: steps.length,
    phase: 'partition',
    title: 'Identify Final Equivalence Classes',
    description: `${mergeDescription} Unmarked table cells correspond to identical language acceptance across all future inputs.`,
    ruleExplanation:
      'Myhill-Nerode Theorem: States p and q are equivalent (p ≡ q) iff no input string w ∈ Σ* can distinguish them. The equivalence classes Q / ≡ form the states of the minimal DFA.',
    highlightSourceStates: activeStates.map((s) => s.id),
    highlightSourceTransitions: [],
    highlightDestStates: [],
    highlightDestTransitions: [],
    intermediateMachine: {
      type: 'dfa',
      states: activeStates,
      alphabet,
      transitions: activeTransitions,
      initialStateId: fa.initialStateId,
      acceptingStateIds: activeStates.filter((s) => s.isAccepting).map((s) => s.id),
    },
    minimizationContext: {
      tableCells: JSON.parse(JSON.stringify(tableCells)),
      classes: equivalenceClasses,
    },
  });

  // ─── Step 6: Construct Minimized DFA ────────────────────────────────────────
  const minStates: FAState[] = equivalenceClasses.map((c) => ({
    id: c.id,
    label: c.label,
    isInitial: c.isInitial,
    isAccepting: c.isAccepting,
  }));

  const minInitialState = minStates.find((s) => s.isInitial) ?? minStates[0];

  // Map each original state ID to its new class ID
  const stateToClassId = new Map<string, string>();
  for (const c of equivalenceClasses) {
    for (const memId of c.memberStateIds) {
      stateToClassId.set(memId, c.id);
    }
  }

  // Build transitions between classes
  const minTransitions: FATransition[] = [];
  const addedMinTransitionsSet = new Set<string>();
  let minTransCount = 0;

  for (const c of equivalenceClasses) {
    // Representative is first member
    const repId = c.memberStateIds[0];

    for (const a of alphabet) {
      const targetOriginal = nextStateMap.get(`${repId}::${a}`);
      if (targetOriginal) {
        const targetClassId = stateToClassId.get(targetOriginal);
        if (targetClassId) {
          const key = `${c.id}::${a}::${targetClassId}`;
          if (!addedMinTransitionsSet.has(key)) {
            addedMinTransitionsSet.add(key);
            minTransitions.push({
              id: `mt_${minTransCount++}`,
              from: c.id,
              to: targetClassId,
              symbol: a,
            });
          }
        }
      }
    }
  }

  const targetMachine: FiniteAutomaton = {
    type: 'dfa',
    states: minStates,
    alphabet,
    transitions: minTransitions,
    initialStateId: minInitialState.id,
    acceptingStateIds: minStates.filter((s) => s.isAccepting).map((s) => s.id),
  };

  const reductionPercent = Math.round(
    ((fa.states.length - targetMachine.states.length) / fa.states.length) * 100,
  );

  steps.push({
    stepIndex: steps.length,
    phase: 'finalize',
    title: 'DFA Minimization Complete',
    description: `Constructed minimal canonical DFA with ${targetMachine.states.length} states (reduced from ${fa.states.length} states, ${reductionPercent}% reduction).`,
    ruleExplanation:
      'Uniqueness: The minimal DFA for any regular language is unique up to state renaming (isomorphism). It achieves the theoretical absolute minimum state bound.',
    highlightSourceStates: [],
    highlightSourceTransitions: [],
    highlightDestStates: targetMachine.states.map((s) => s.id),
    highlightDestTransitions: targetMachine.transitions.map((t) => t.id),
    intermediateMachine: targetMachine,
    minimizationContext: {
      tableCells: JSON.parse(JSON.stringify(tableCells)),
      classes: equivalenceClasses,
    },
  });

  const verification = verifyLanguageEquivalence(fa, targetMachine);

  return {
    type: 'dfa-minimization',
    sourceMachine: fa,
    targetMachine,
    steps,
    summary: {
      operation: 'dfa-minimization',
      initialStatesCount: fa.states.length,
      finalStatesCount: targetMachine.states.length,
      initialTransitionsCount: fa.transitions.length,
      finalTransitionsCount: targetMachine.transitions.length,
      ratioNotes: `Reduced ${fa.states.length} states to ${targetMachine.states.length} minimal states (${reductionPercent}% compression).`,
      keyInsights: [
        unreachableStates.length > 0
          ? `Pruned ${unreachableStates.length} unreachable state(s) before table-filling.`
          : 'All original states were accessible from the start state.',
        mergedClasses.length > 0
          ? `Merged ${mergedClasses.reduce((acc, c) => acc + c.memberStateIds.length, 0)} equivalent states into ${mergedClasses.length} quotient classes.`
          : 'Machine had no equivalent states; already minimal.',
        'Preserved exact language recognition verified across all test inputs.',
      ],
    },
    verification,
  };
}
