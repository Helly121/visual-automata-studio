import { EPSILON, type FiniteAutomaton, type FAState, type FATransition } from '../types.ts';
import type {
  SubsetTableRow,
  TransformationResult,
  TransformationStep,
} from './types.ts';
import { getEpsilonClosure } from './epsilon-closure.ts';
import { verifyLanguageEquivalence } from './equivalence.ts';

/**
 * Generate a canonical key for a subset of state IDs.
 */
function makeSubsetKey(stateIds: Set<string> | string[]): string {
  const arr = Array.from(stateIds).sort();
  if (arr.length === 0) return '__EMPTY__';
  return arr.join(',');
}

/**
 * Human-readable label for a subset of NFA states.
 * e.g. "{q₀, q₁}" or "∅"
 */
function makeSubsetDisplay(fa: FiniteAutomaton, stateIds: Set<string> | string[]): string {
  const arr = Array.from(stateIds).sort();
  if (arr.length === 0) return '∅';
  const labelMap = new Map(fa.states.map((s) => [s.id, s.label]));
  const names = arr.map((id) => labelMap.get(id) ?? id);
  return `{${names.join(', ')}}`;
}

/**
 * State label letter generator: A, B, C, ..., Z, AA, AB, ...
 */
function getLetterName(index: number): string {
  let name = '';
  let i = index;
  while (i >= 0) {
    name = String.fromCharCode(65 + (i % 26)) + name;
    i = Math.floor(i / 26) - 1;
  }
  return name;
}

/**
 * Run NFA-to-DFA (or ε-NFA to DFA) Subset Construction.
 * Produces an exact, fully deterministic DFA with step-by-step trace and table.
 */
export function runSubsetConstruction(fa: FiniteAutomaton): TransformationResult {
  if (!fa.initialStateId) {
    throw new Error('Cannot run subset construction: Source machine has no initial state defined.');
  }

  const isEnfa = fa.type === 'enfa' || fa.transitions.some((t) => t.symbol === EPSILON);
  const alphabet = fa.alphabet.filter((s) => s !== EPSILON);

  const stateLabelMap = new Map(fa.states.map((s) => [s.id, s.label]));
  const acceptingSet = new Set(fa.acceptingStateIds);

  const steps: TransformationStep[] = [];
  const tableRows: SubsetTableRow[] = [];

  // ─── Step 1: Compute Initial DFA State ──────────────────────────────────────
  // Initial subset is ε-closure(q0) if ε-transitions exist, or {q0}
  const initialClosure = isEnfa
    ? getEpsilonClosure(fa, [fa.initialStateId])
    : new Set([fa.initialStateId]);

  const initialKey = makeSubsetKey(initialClosure);
  const initialNfaIds = Array.from(initialClosure).sort();
  const initialIsAccepting = initialNfaIds.some((id) => acceptingSet.has(id));

  // Map of subsetKey -> DFAState
  const discoveredSubsets = new Map<
    string,
    {
      dfaId: string;
      labelLetter: string;
      dfaLabel: string;
      nfaIds: string[];
      isAccepting: boolean;
      isInitial: boolean;
      isEmpty: boolean;
    }
  >();

  let stateCounter = 0;
  const initialLetter = getLetterName(stateCounter++);
  const initialDisplay = makeSubsetDisplay(fa, initialNfaIds);
  const initialDfaLabel = `${initialLetter} ${initialDisplay}`;
  const initialDfaId = `dfa_state_${initialLetter.toLowerCase()}`;

  discoveredSubsets.set(initialKey, {
    dfaId: initialDfaId,
    labelLetter: initialLetter,
    dfaLabel: initialDfaLabel,
    nfaIds: initialNfaIds,
    isAccepting: initialIsAccepting,
    isInitial: true,
    isEmpty: false,
  });

  const initialTableRow: SubsetTableRow = {
    dfaStateId: initialDfaId,
    dfaLabel: initialDfaLabel,
    nfaStateIds: initialNfaIds,
    isInitial: true,
    isAccepting: initialIsAccepting,
    isNew: true,
    transitions: {},
  };
  tableRows.push(initialTableRow);

  const dfaStates: FAState[] = [
    {
      id: initialDfaId,
      label: initialDfaLabel,
      isInitial: true,
      isAccepting: initialIsAccepting,
    },
  ];

  const dfaTransitions: FATransition[] = [];
  let transCounter = 0;

  // Initial step snapshot
  steps.push({
    stepIndex: 0,
    phase: 'init',
    title: `Initialize DFA Start State ${initialLetter}`,
    description: isEnfa
      ? `The DFA start state is the ε-closure of initial state ${stateLabelMap.get(fa.initialStateId)}: ε-closure({${stateLabelMap.get(fa.initialStateId)}}) = ${initialDisplay}.`
      : `The DFA start state corresponds to the singleton set containing the NFA start state: ${initialDisplay}.`,
    ruleExplanation:
      'Axiom 1: In subset construction, the DFA start state tracks all NFA states the machine can reside in before reading any input symbols.',
    highlightSourceStates: initialNfaIds,
    highlightSourceTransitions: [],
    highlightDestStates: [initialDfaId],
    highlightDestTransitions: [],
    intermediateMachine: {
      type: 'dfa',
      states: [...dfaStates],
      alphabet,
      transitions: [],
      initialStateId: initialDfaId,
      acceptingStateIds: initialIsAccepting ? [initialDfaId] : [],
    },
    subsetContext: {
      currentSubsetId: initialDfaId,
      currentSubsetNfaIds: initialNfaIds,
      isNewSubset: true,
      tableRows: JSON.parse(JSON.stringify(tableRows)),
    },
  });

  // ─── Step 2: Worklist expansion ─────────────────────────────────────────────
  // Queue stores subset keys pending expansion
  const worklist: string[] = [initialKey];

  while (worklist.length > 0) {
    const currentKey = worklist.shift()!;
    const currentInfo = discoveredSubsets.get(currentKey)!;

    // Special handling for dead/trap state (∅)
    if (currentInfo.isEmpty) {
      // ∅ self-loops on all symbols
      for (const sym of alphabet) {
        const tId = `dt_${transCounter++}`;
        const trans: FATransition = {
          id: tId,
          from: currentInfo.dfaId,
          to: currentInfo.dfaId,
          symbol: sym,
        };
        dfaTransitions.push(trans);

        const row = tableRows.find((r) => r.dfaStateId === currentInfo.dfaId);
        if (row) {
          row.transitions[sym] = {
            targetDfaId: currentInfo.dfaId,
            targetLabel: currentInfo.dfaLabel,
            targetNfaIds: [],
            isNewSubset: false,
            isEmpty: true,
          };
        }

        steps.push({
          stepIndex: steps.length,
          phase: 'subset-expand',
          title: `Dead State ∅ on "${sym}" Self-Loops`,
          description: `The empty subset ∅ has no active computational branches. Reading symbol "${sym}" remains in ∅.`,
          ruleExplanation:
            'A DFA must have a total transition function. The empty set ∅ acts as an explicit non-accepting sink (trap) state with self-loops on all alphabet symbols.',
          highlightSourceStates: [],
          highlightSourceTransitions: [],
          highlightDestStates: [currentInfo.dfaId],
          highlightDestTransitions: [tId],
          intermediateMachine: {
            type: 'dfa',
            states: [...dfaStates],
            alphabet,
            transitions: [...dfaTransitions],
            initialStateId: initialDfaId,
            acceptingStateIds: dfaStates.filter((s) => s.isAccepting).map((s) => s.id),
          },
          subsetContext: {
            currentSubsetId: currentInfo.dfaId,
            currentSubsetNfaIds: [],
            currentSymbol: sym,
            targetSubsetNfaIds: [],
            targetDfaId: currentInfo.dfaId,
            isNewSubset: false,
            isEmptySubset: true,
            tableRows: JSON.parse(JSON.stringify(tableRows)),
          },
        });
      }
      continue;
    }

    // Expand current subset on each alphabet symbol
    for (const sym of alphabet) {
      // 1. Find all reachable NFA states from any state in currentInfo.nfaIds on symbol 'sym'
      const directlyReachable = new Set<string>();
      const sourceTransIds: string[] = [];

      for (const nfaId of currentInfo.nfaIds) {
        for (const t of fa.transitions) {
          if (t.from === nfaId && t.symbol === sym) {
            directlyReachable.add(t.to);
            sourceTransIds.push(t.id);
          }
        }
      }

      // 2. If ε-transitions are supported, take ε-closure
      const targetClosure = isEnfa
        ? getEpsilonClosure(fa, directlyReachable)
        : directlyReachable;

      const targetNfaIds = Array.from(targetClosure).sort();
      const targetKey = makeSubsetKey(targetNfaIds);
      const isEmpty = targetNfaIds.length === 0;

      // 3. Check if target subset already exists
      const isNew = !discoveredSubsets.has(targetKey);
      let targetInfo = discoveredSubsets.get(targetKey);

      if (isNew) {
        let newLabel = '';
        let newLetter = '';
        let newDfaId = '';

        if (isEmpty) {
          newLetter = 'Trap';
          newLabel = '∅ (Trap)';
          newDfaId = 'dfa_state_trap';
        } else {
          newLetter = getLetterName(stateCounter++);
          const display = makeSubsetDisplay(fa, targetNfaIds);
          newLabel = `${newLetter} ${display}`;
          newDfaId = `dfa_state_${newLetter.toLowerCase()}`;
        }

        const isAcc = targetNfaIds.some((id) => acceptingSet.has(id));

        targetInfo = {
          dfaId: newDfaId,
          labelLetter: newLetter,
          dfaLabel: newLabel,
          nfaIds: targetNfaIds,
          isAccepting: isAcc,
          isInitial: false,
          isEmpty,
        };

        discoveredSubsets.set(targetKey, targetInfo);
        worklist.push(targetKey);

        dfaStates.push({
          id: newDfaId,
          label: newLabel,
          isInitial: false,
          isAccepting: isAcc,
        });

        tableRows.push({
          dfaStateId: newDfaId,
          dfaLabel: newLabel,
          nfaStateIds: targetNfaIds,
          isInitial: false,
          isAccepting: isAcc,
          isNew: true,
          transitions: {},
        });
      }

      // 4. Add transition from current state to target state
      const tId = `dt_${transCounter++}`;
      const newDfaTrans: FATransition = {
        id: tId,
        from: currentInfo.dfaId,
        to: targetInfo!.dfaId,
        symbol: sym,
      };
      dfaTransitions.push(newDfaTrans);

      // Update table row
      const currentRow = tableRows.find((r) => r.dfaStateId === currentInfo.dfaId);
      if (currentRow) {
        currentRow.transitions[sym] = {
          targetDfaId: targetInfo!.dfaId,
          targetLabel: targetInfo!.dfaLabel,
          targetNfaIds,
          isNewSubset: isNew,
          isEmpty,
        };
      }

      // Generate explanatory text
      const targetDisplay = isEmpty ? '∅ (Empty Set)' : makeSubsetDisplay(fa, targetNfaIds);
      const accReason = isEmpty
        ? 'Dead state ∅ contains no states, so it is non-accepting.'
        : targetInfo!.isAccepting
          ? `Contains at least one accepting state from {${Array.from(acceptingSet).map((id) => stateLabelMap.get(id) ?? id).join(', ')}}, so it is an ACCEPTING state ✓.`
          : 'Contains no accepting states of the NFA, so it is non-accepting ✗.';

      const description = `From DFA state ${currentInfo.labelLetter} ${makeSubsetDisplay(fa, currentInfo.nfaIds)}, reading "${sym}" leads to ${targetDisplay}. ${
        isNew
          ? `Discovered NEW DFA state ${targetInfo!.labelLetter}! ${accReason}`
          : `Reuses EXISTING DFA state ${targetInfo!.labelLetter}.`
      }`;

      steps.push({
        stepIndex: steps.length,
        phase: 'subset-expand',
        title: `Transition: ${currentInfo.labelLetter} on "${sym}" → ${targetInfo!.labelLetter}`,
        description,
        ruleExplanation:
          'Formula: δ_D(S, a) = ε-closure( ⋃_{p ∈ S} δ_N(p, a) ). A DFA state is accepting iff S ∩ F_N ≠ ∅.',
        highlightSourceStates: [...currentInfo.nfaIds, ...targetNfaIds],
        highlightSourceTransitions: sourceTransIds,
        highlightDestStates: [currentInfo.dfaId, targetInfo!.dfaId],
        highlightDestTransitions: [tId],
        intermediateMachine: {
          type: 'dfa',
          states: [...dfaStates],
          alphabet,
          transitions: [...dfaTransitions],
          initialStateId: initialDfaId,
          acceptingStateIds: dfaStates.filter((s) => s.isAccepting).map((s) => s.id),
        },
        subsetContext: {
          currentSubsetId: currentInfo.dfaId,
          currentSubsetNfaIds: currentInfo.nfaIds,
          currentSymbol: sym,
          targetSubsetNfaIds: targetNfaIds,
          targetDfaId: targetInfo!.dfaId,
          isNewSubset: isNew,
          isEmptySubset: isEmpty,
          tableRows: JSON.parse(JSON.stringify(tableRows)),
        },
      });
    }
  }

  // Final Target DFA
  const targetMachine: FiniteAutomaton = {
    type: 'dfa',
    states: dfaStates,
    alphabet,
    transitions: dfaTransitions,
    initialStateId: initialDfaId,
    acceptingStateIds: dfaStates.filter((s) => s.isAccepting).map((s) => s.id),
  };

  steps.push({
    stepIndex: steps.length,
    phase: 'finalize',
    title: 'Subset Construction Complete',
    description: `All discovered subsets are closed under the alphabet. Generated an equivalent DFA with ${dfaStates.length} states (from original ${fa.states.length} NFA states).`,
    ruleExplanation:
      'Theorem (Rabin-Scott): Every NFA can be converted to an equivalent DFA with at most 2^n states. Only reachable subsets were constructed.',
    highlightSourceStates: [],
    highlightSourceTransitions: [],
    highlightDestStates: dfaStates.map((s) => s.id),
    highlightDestTransitions: dfaTransitions.map((t) => t.id),
    intermediateMachine: targetMachine,
    subsetContext: {
      tableRows: JSON.parse(JSON.stringify(tableRows)),
    },
  });

  // Verify language equivalence
  const verification = verifyLanguageEquivalence(fa, targetMachine);

  return {
    type: isEnfa ? 'enfa-to-dfa' : 'nfa-to-dfa',
    sourceMachine: fa,
    targetMachine,
    steps,
    summary: {
      operation: isEnfa ? 'enfa-to-dfa' : 'nfa-to-dfa',
      initialStatesCount: fa.states.length,
      finalStatesCount: targetMachine.states.length,
      initialTransitionsCount: fa.transitions.length,
      finalTransitionsCount: targetMachine.transitions.length,
      ratioNotes: `Constructed ${targetMachine.states.length} DFA states (theoretical max: 2^${fa.states.length} = ${Math.pow(2, fa.states.length)}).`,
      keyInsights: [
        `DFA start state: ${initialDfaLabel}.`,
        `${targetMachine.acceptingStateIds.length} accepting states identified based on intersection with original final states.`,
        discoveredSubsets.has('__EMPTY__')
          ? 'Explicit dead/trap state ∅ added to maintain a total transition function.'
          : 'All state transitions lead to non-empty active state sets.',
      ],
    },
    verification,
  };
}
