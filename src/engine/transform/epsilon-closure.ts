import { EPSILON, type FiniteAutomaton, type FAState, type FATransition } from '../types.ts';
import type {
  EpsilonClosureStep,
  StateEpsilonTrace,
  TransformationResult,
  TransformationStep,
} from './types.ts';
import { verifyLanguageEquivalence } from './equivalence.ts';

/**
 * Compute the epsilon-closure of a set of state IDs, recording each traversal step,
 * transitions traversed, and detecting cycles safely.
 */
export function computeDetailedClosure(
  fa: FiniteAutomaton,
  startStateIds: Set<string> | string[],
): {
  closure: Set<string>;
  steps: EpsilonClosureStep[];
  hasCycle: boolean;
  cycleEdges: string[];
} {
  const closure = new Set<string>(startStateIds);
  const steps: EpsilonClosureStep[] = [];
  const cycleEdges: string[] = [];
  let hasCycle = false;

  // Track path from root to detect cycles
  const stack = [...startStateIds];
  const stateLabelMap = new Map<string, string>(fa.states.map((s) => [s.id, s.label]));

  while (stack.length > 0) {
    const current = stack.pop()!;
    const currentLabel = stateLabelMap.get(current) ?? current;

    for (const t of fa.transitions) {
      if (t.from === current && t.symbol === EPSILON) {
        const targetLabel = stateLabelMap.get(t.to) ?? t.to;

        if (closure.has(t.to)) {
          // Epsilon transition points to a state already in the closure -> Cycle detected!
          hasCycle = true;
          cycleEdges.push(t.id);
          steps.push({
            fromStateId: current,
            toStateId: t.to,
            transitionId: t.id,
            isCycle: true,
            discoveredClosure: Array.from(closure),
            explanation: `Transition ${currentLabel} --ε--> ${targetLabel} re-visits ${targetLabel} (already in closure). Cycle safely resolved without infinite looping.`,
          });
        } else {
          // New state discovered via epsilon
          closure.add(t.to);
          stack.push(t.to);
          steps.push({
            fromStateId: current,
            toStateId: t.to,
            transitionId: t.id,
            isCycle: false,
            discoveredClosure: Array.from(closure),
            explanation: `Traversed ${currentLabel} --ε--> ${targetLabel}. Added ${targetLabel} to ε-closure.`,
          });
        }
      }
    }
  }

  return { closure, steps, hasCycle, cycleEdges };
}

/**
 * Standard epsilon closure helper returning a set of state IDs.
 */
export function getEpsilonClosure(fa: FiniteAutomaton, stateIds: Set<string> | string[]): Set<string> {
  return computeDetailedClosure(fa, stateIds).closure;
}

/**
 * Build detailed epsilon closure trace for an individual state.
 */
export function traceStateEpsilonClosure(fa: FiniteAutomaton, stateId: string): StateEpsilonTrace {
  const { closure, steps, hasCycle } = computeDetailedClosure(fa, [stateId]);
  return {
    stateId,
    closureStateIds: Array.from(closure),
    steps,
    hasCycle,
  };
}

/**
 * Operation: Epsilon-Closure Explorer
 * Generates an interactive, step-by-step trace of how ε-closure is computed
 * for every state in the automaton.
 */
export function runEpsilonClosureAnalysis(fa: FiniteAutomaton): TransformationResult {
  const steps: TransformationStep[] = [];
  const stateLabelMap = new Map<string, string>(fa.states.map((s) => [s.id, s.label]));
  const allTraces: Record<string, StateEpsilonTrace> = {};

  // Step 0: Overview
  const epsTransitionCount = fa.transitions.filter((t) => t.symbol === EPSILON).length;
  steps.push({
    stepIndex: 0,
    phase: 'init',
    title: 'Initialize Epsilon Closure Analysis',
    description: `Analyzing ε-closure for all ${fa.states.length} states across ${epsTransitionCount} epsilon transitions.`,
    ruleExplanation:
      'The ε-closure of a state q (denoted ε-closure(q)) contains q itself and every state reachable by traversing zero or more ε-transitions.',
    highlightSourceStates: fa.initialStateId ? [fa.initialStateId] : [],
    highlightSourceTransitions: [],
    highlightDestStates: [],
    highlightDestTransitions: [],
    intermediateMachine: fa,
    epsilonContext: {
      allTraces: {},
    },
  });

  // Analyze each state
  for (const state of fa.states) {
    const trace = traceStateEpsilonClosure(fa, state.id);
    allTraces[state.id] = trace;

    const currentClosureLabels = trace.closureStateIds
      .map((id) => stateLabelMap.get(id) ?? id)
      .join(', ');

    if (trace.steps.length === 0) {
      // Identity closure
      steps.push({
        stepIndex: steps.length,
        phase: 'epsilon-closure',
        title: `ε-closure(${state.label}) = {${state.label}}`,
        description: `State ${state.label} has no outgoing ε-transitions. Its ε-closure is trivially itself.`,
        ruleExplanation:
          'Base Axiom: By definition, every state q is reachable from itself by traversing zero ε-transitions (path length 0). Therefore, q ∈ ε-closure(q).',
        highlightSourceStates: [state.id],
        highlightSourceTransitions: [],
        highlightDestStates: [state.id],
        highlightDestTransitions: [],
        intermediateMachine: fa,
        epsilonContext: {
          analyzedStateId: state.id,
          currentClosureStateIds: trace.closureStateIds,
          allTraces: { ...allTraces },
        },
      });
    } else {
      // Step through discovering states via epsilon transitions
      for (const subStep of trace.steps) {
        const fromLabel = stateLabelMap.get(subStep.fromStateId) ?? subStep.fromStateId;
        const toLabel = stateLabelMap.get(subStep.toStateId) ?? subStep.toStateId;

        steps.push({
          stepIndex: steps.length,
          phase: 'epsilon-closure',
          title: `Traverse ε from ${fromLabel} → ${toLabel}`,
          description: subStep.explanation,
          ruleExplanation: subStep.isCycle
            ? 'Cycle Prevention: If an ε-transition reaches a state already in the closure set, the algorithm skips it to prevent infinite recursion.'
            : 'Inductive Step: If p ∈ ε-closure(q) and p --ε--> r, then r ∈ ε-closure(q).',
          highlightSourceStates: [state.id, subStep.fromStateId, subStep.toStateId],
          highlightSourceTransitions: [subStep.transitionId],
          highlightDestStates: subStep.discoveredClosure,
          highlightDestTransitions: [],
          intermediateMachine: fa,
          epsilonContext: {
            analyzedStateId: state.id,
            currentClosureStateIds: subStep.discoveredClosure,
            allTraces: { ...allTraces },
          },
        });
      }

      // Conclude closure for this state
      steps.push({
        stepIndex: steps.length,
        phase: 'epsilon-closure',
        title: `Complete: ε-closure(${state.label}) = {${currentClosureLabels}}`,
        description: `Final closure for ${state.label} contains ${trace.closureStateIds.length} states: {${currentClosureLabels}}.${
          trace.hasCycle ? ' (Includes ε-cycle)' : ''
        }`,
        ruleExplanation:
          'All reachable states through chains of ε-transitions have been collected. This closure set can now be used for input symbol transitions.',
        highlightSourceStates: trace.closureStateIds,
        highlightSourceTransitions: trace.steps.map((s) => s.transitionId),
        highlightDestStates: trace.closureStateIds,
        highlightDestTransitions: [],
        intermediateMachine: fa,
        epsilonContext: {
          analyzedStateId: state.id,
          currentClosureStateIds: trace.closureStateIds,
          allTraces: { ...allTraces },
        },
      });
    }
  }

  // Final summary step
  steps.push({
    stepIndex: steps.length,
    phase: 'finalize',
    title: 'Epsilon Closure Analysis Complete',
    description: `All ${fa.states.length} states have been completely analyzed. Cycles were detected and safely handled.`,
    ruleExplanation:
      'The computed ε-closure table is the foundation for both ε-removal (ε-NFA → NFA) and the subset construction (ε-NFA → DFA).',
    highlightSourceStates: fa.states.map((s) => s.id),
    highlightSourceTransitions: [],
    highlightDestStates: [],
    highlightDestTransitions: [],
    intermediateMachine: fa,
    epsilonContext: {
      allTraces,
    },
  });

  const verification = verifyLanguageEquivalence(fa, fa);

  return {
    type: 'epsilon-closure',
    sourceMachine: fa,
    targetMachine: fa,
    steps,
    summary: {
      operation: 'epsilon-closure',
      initialStatesCount: fa.states.length,
      finalStatesCount: fa.states.length,
      initialTransitionsCount: fa.transitions.length,
      finalTransitionsCount: fa.transitions.length,
      ratioNotes: `Mapped ${fa.states.length} states to their respective ε-closures.`,
      keyInsights: [
        'Every state belongs to its own ε-closure by definition.',
        epsTransitionCount > 0
          ? `${epsTransitionCount} ε-transitions traversed across states.`
          : 'No ε-transitions found in machine; all closures are singletons.',
        Object.values(allTraces).some((t) => t.hasCycle)
          ? 'Epsilon cycles were detected and safely bounded.'
          : 'Acyclic epsilon paths throughout.',
      ],
    },
    verification,
  };
}

/**
 * Operation: Epsilon-Removal (Convert ε-NFA to Standard NFA without ε-transitions)
 *
 * Formal Construction:
 * Given ε-NFA N = (Q, Σ, δ, q0, F):
 * 1. Q' = Q
 * 2. Σ' = Σ \ {ε}
 * 3. Start state q0' = q0
 * 4. For each q ∈ Q and a ∈ Σ':
 *    δ'(q, a) = ε-closure( ⋃_{p ∈ ε-closure(q)} δ(p, a) )
 * 5. F' = { q ∈ Q | ε-closure(q) ∩ F ≠ ∅ }
 */
export function convertENFAToNFA(fa: FiniteAutomaton): TransformationResult {
  const steps: TransformationStep[] = [];
  const stateLabelMap = new Map<string, string>(fa.states.map((s) => [s.id, s.label]));
  const alphabet = fa.alphabet.filter((s) => s !== EPSILON);

  // Precompute epsilon closures for all states
  const closureMap = new Map<string, Set<string>>();
  for (const s of fa.states) {
    closureMap.set(s.id, getEpsilonClosure(fa, [s.id]));
  }

  // Determine accepting states in new NFA:
  // A state q is accepting if its epsilon closure contains any original accepting state!
  const originalAcceptingSet = new Set(fa.acceptingStateIds);
  const newAcceptingStateIds: string[] = [];

  const newStates: FAState[] = fa.states.map((s) => {
    const closure = closureMap.get(s.id)!;
    const isAcc = Array.from(closure).some((cid) => originalAcceptingSet.has(cid));
    if (isAcc) newAcceptingStateIds.push(s.id);

    return {
      id: s.id,
      label: s.label,
      isInitial: s.id === fa.initialStateId,
      isAccepting: isAcc,
    };
  });

  // Step 0: Initial state & accepting states derivation
  const intermediateMachine: FiniteAutomaton = {
    type: 'nfa',
    states: newStates,
    alphabet,
    transitions: [],
    initialStateId: fa.initialStateId,
    acceptingStateIds: newAcceptingStateIds,
  };

  steps.push({
    stepIndex: 0,
    phase: 'init',
    title: 'Initialize ε-NFA → NFA Transformation',
    description: `Eliminating all epsilon (${EPSILON}) transitions while preserving language equivalence. Computing new accepting states and direct transition rules.`,
    ruleExplanation:
      'Step 1: Compute ε-closure(q) for each state q. A state q becomes accepting in the new NFA if its ε-closure intersects the original accepting states (ε-closure(q) ∩ F ≠ ∅).',
    highlightSourceStates: newAcceptingStateIds,
    highlightSourceTransitions: [],
    highlightDestStates: newAcceptingStateIds,
    highlightDestTransitions: [],
    intermediateMachine: { ...intermediateMachine, transitions: [] },
  });

  // Build new transitions:
  const newTransitions: FATransition[] = [];
  let transCounter = 0;

  for (const state of fa.states) {
    const qClosure = closureMap.get(state.id)!;
    const qClosureLabels = Array.from(qClosure)
      .map((id) => stateLabelMap.get(id) ?? id)
      .join(', ');

    for (const sym of alphabet) {
      // 1. All states reachable from qClosure on symbol 'sym'
      const directlyReachableOnSym = new Set<string>();
      const sourceTransIds: string[] = [];

      for (const cid of qClosure) {
        for (const t of fa.transitions) {
          if (t.from === cid && t.symbol === sym) {
            directlyReachableOnSym.add(t.to);
            sourceTransIds.push(t.id);
          }
        }
      }

      // 2. Take epsilon-closure of those reachable states
      const fullReachable = getEpsilonClosure(fa, directlyReachableOnSym);

      if (fullReachable.size > 0) {
        const addedTransitionsThisStep: FATransition[] = [];

        for (const targetId of fullReachable) {
          const transId = `tn_${transCounter++}`;
          const trans: FATransition = {
            id: transId,
            from: state.id,
            to: targetId,
            symbol: sym,
          };
          newTransitions.push(trans);
          addedTransitionsThisStep.push(trans);
        }

        const targetLabels = Array.from(fullReachable)
          .map((id) => stateLabelMap.get(id) ?? id)
          .join(', ');

        steps.push({
          stepIndex: steps.length,
          phase: 'inductive-step',
          title: `Direct Transitions from ${state.label} on "${sym}"`,
          description: `From state ${state.label} (ε-closure = {${qClosureLabels}}), reading symbol "${sym}" reaches states {${targetLabels}} directly.`,
          ruleExplanation: `Rule: δ'(q, ${sym}) = ε-closure( ⋃_{p ∈ ε-closure(q)} δ(p, ${sym}) ). Epsilon transitions are bypassed with direct shortcut edges.`,
          highlightSourceStates: Array.from(qClosure),
          highlightSourceTransitions: sourceTransIds,
          highlightDestStates: [state.id, ...Array.from(fullReachable)],
          highlightDestTransitions: addedTransitionsThisStep.map((t) => t.id),
          intermediateMachine: {
            ...intermediateMachine,
            transitions: [...newTransitions],
          },
        });
      }
    }
  }

  // Final machine
  const targetMachine: FiniteAutomaton = {
    type: 'nfa',
    states: newStates,
    alphabet,
    transitions: newTransitions,
    initialStateId: fa.initialStateId,
    acceptingStateIds: newAcceptingStateIds,
  };

  steps.push({
    stepIndex: steps.length,
    phase: 'finalize',
    title: 'ε-Removal Complete (Standard NFA Created)',
    description: `Constructed standard NFA with ${newStates.length} states and ${newTransitions.length} transitions over alphabet {${alphabet.join(', ')}}. All ε-transitions have been eliminated.`,
    ruleExplanation:
      'The resulting NFA recognizes the exact same language as the original ε-NFA, but strictly adheres to standard NFA semantics (no empty-string jumps).',
    highlightSourceStates: [],
    highlightSourceTransitions: [],
    highlightDestStates: targetMachine.states.map((s) => s.id),
    highlightDestTransitions: targetMachine.transitions.map((t) => t.id),
    intermediateMachine: targetMachine,
  });

  const verification = verifyLanguageEquivalence(fa, targetMachine);

  return {
    type: 'enfa-to-nfa',
    sourceMachine: fa,
    targetMachine,
    steps,
    summary: {
      operation: 'enfa-to-nfa',
      initialStatesCount: fa.states.length,
      finalStatesCount: targetMachine.states.length,
      initialTransitionsCount: fa.transitions.length,
      finalTransitionsCount: targetMachine.transitions.length,
      ratioNotes: `Eliminated all ${fa.transitions.filter((t) => t.symbol === EPSILON).length} ε-transitions.`,
      keyInsights: [
        'Transformed all composite paths of the form ε* → symbol → ε* into direct transitions.',
        `Updated ${newAcceptingStateIds.length} states to accepting based on their ε-closures.`,
        'Resulting machine is a pure NFA suitable for direct subset construction.',
      ],
    },
    verification,
  };
}
