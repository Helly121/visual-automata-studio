import { EPSILON, type FATransition, type FiniteAutomaton, type SimConfig, type SimResult } from './types.ts';

// ─── helpers ──────────────────────────────────────────────────────────────────

function getTransitionsFrom(fa: FiniteAutomaton, stateId: string, symbol: string): FATransition[] {
  return fa.transitions.filter((t) => t.from === stateId && t.symbol === symbol);
}

/**
 * Compute the epsilon-closure of a set of state IDs.
 * Handles cycles correctly via a visited set.
 */
export function epsilonClosure(fa: FiniteAutomaton, stateIds: Set<string>): Set<string> {
  const closure = new Set<string>(stateIds);
  const stack = [...stateIds];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const t of fa.transitions) {
      if (t.from === current && t.symbol === EPSILON && !closure.has(t.to)) {
        closure.add(t.to);
        stack.push(t.to);
      }
    }
  }
  return closure;
}

function stateLabel(fa: FiniteAutomaton, id: string): string {
  return fa.states.find((s) => s.id === id)?.label ?? id;
}

function setLabel(fa: FiniteAutomaton, ids: Set<string> | string[]): string {
  const arr = [...ids];
  if (arr.length === 0) return '∅';
  if (arr.length === 1) return stateLabel(fa, arr[0]);
  return `{${arr.map((id) => stateLabel(fa, id)).join(', ')}}`;
}

// ─── DFA simulation ───────────────────────────────────────────────────────────

export function simulateDFA(fa: FiniteAutomaton, input: string): SimResult {
  if (!fa.initialStateId) {
    return {
      status: 'invalid_machine',
      accepted: false,
      trace: [],
      errorMessage: 'No initial state defined.',
    };
  }

  // Validate input symbols
  const symbolSet = new Set(fa.alphabet);
  for (const ch of input) {
    if (!symbolSet.has(ch)) {
      return {
        status: 'invalid_input',
        accepted: false,
        trace: [],
        errorMessage: `Input symbol "${ch}" is not in the alphabet {${fa.alphabet.join(', ')}}.`,
      };
    }
  }

  const trace: SimConfig[] = [];
  let currentId = fa.initialStateId;

  trace.push({
    step: 0,
    activeStateIds: [currentId],
    remaining: input,
    traversedTransitionIds: [],
    explanation: `Start in state ${stateLabel(fa, currentId)}. Input: "${input}".`,
  });

  for (let i = 0; i < input.length; i++) {
    const sym = input[i];
    const matches = getTransitionsFrom(fa, currentId, sym);

    if (matches.length === 0) {
      // Implicit rejection (missing transition)
      trace.push({
        step: i + 1,
        activeStateIds: [],
        consumedSymbol: sym,
        remaining: input.slice(i + 1),
        traversedTransitionIds: [],
        explanation: `No transition from ${stateLabel(fa, currentId)} on "${sym}". Machine rejects.`,
      });
      return { status: 'rejected', accepted: false, trace };
    }

    // For DFA we use the first (and should be only) transition
    const t = matches[0];
    currentId = t.to;

    trace.push({
      step: i + 1,
      activeStateIds: [currentId],
      consumedSymbol: sym,
      remaining: input.slice(i + 1),
      traversedTransitionIds: [t.id],
      explanation: `Read "${sym}" → move to ${stateLabel(fa, currentId)}. Remaining: "${input.slice(i + 1)}".`,
    });
  }

  const currentState = fa.states.find((s) => s.id === currentId);
  const accepted = currentState?.isAccepting ?? false;

  // Annotate final step
  const finalConfig = trace[trace.length - 1];
  trace[trace.length - 1] = {
    ...finalConfig,
    explanation: accepted
      ? `All input consumed. ${stateLabel(fa, currentId)} is an accepting state. String ACCEPTED ✓`
      : `All input consumed. ${stateLabel(fa, currentId)} is not an accepting state. String REJECTED ✗`,
  };

  return { status: accepted ? 'accepted' : 'rejected', accepted, trace };
}

// ─── NFA simulation ───────────────────────────────────────────────────────────

export function simulateNFA(fa: FiniteAutomaton, input: string): SimResult {
  if (!fa.initialStateId) {
    return { status: 'invalid_machine', accepted: false, trace: [], errorMessage: 'No initial state defined.' };
  }

  const symbolSet = new Set(fa.alphabet);
  for (const ch of input) {
    if (!symbolSet.has(ch)) {
      return {
        status: 'invalid_input',
        accepted: false,
        trace: [],
        errorMessage: `Input symbol "${ch}" is not in the alphabet {${fa.alphabet.join(', ')}}.`,
      };
    }
  }

  const trace: SimConfig[] = [];
  let activeIds = new Set<string>([fa.initialStateId]);

  trace.push({
    step: 0,
    activeStateIds: [...activeIds],
    remaining: input,
    traversedTransitionIds: [],
    explanation: `Start in ${setLabel(fa, activeIds)}. Input: "${input}".`,
  });

  for (let i = 0; i < input.length; i++) {
    const sym = input[i];
    const nextIds = new Set<string>();
    const traversedIds: string[] = [];

    for (const stateId of activeIds) {
      for (const t of getTransitionsFrom(fa, stateId, sym)) {
        nextIds.add(t.to);
        traversedIds.push(t.id);
      }
    }

    activeIds = nextIds;

    const remaining = input.slice(i + 1);
    if (activeIds.size === 0) {
      trace.push({
        step: i + 1,
        activeStateIds: [],
        consumedSymbol: sym,
        remaining,
        traversedTransitionIds: [],
        explanation: `Read "${sym}". No reachable states. Machine rejects.`,
      });
      return { status: 'rejected', accepted: false, trace };
    }

    trace.push({
      step: i + 1,
      activeStateIds: [...activeIds],
      consumedSymbol: sym,
      remaining,
      traversedTransitionIds: traversedIds,
      explanation: `Read "${sym}" → active states: ${setLabel(fa, activeIds)}. Remaining: "${remaining}".`,
    });
  }

  const acceptingIds = new Set(fa.acceptingStateIds);
  const accepted = [...activeIds].some((id) => acceptingIds.has(id));

  const finalConfig = trace[trace.length - 1];
  trace[trace.length - 1] = {
    ...finalConfig,
    explanation: accepted
      ? `Input consumed. Active states: ${setLabel(fa, activeIds)}. At least one is accepting. String ACCEPTED ✓`
      : `Input consumed. Active states: ${setLabel(fa, activeIds)}. None is accepting. String REJECTED ✗`,
  };

  return { status: accepted ? 'accepted' : 'rejected', accepted, trace };
}

// ─── ε-NFA simulation ─────────────────────────────────────────────────────────

export function simulateENFA(fa: FiniteAutomaton, input: string): SimResult {
  if (!fa.initialStateId) {
    return { status: 'invalid_machine', accepted: false, trace: [], errorMessage: 'No initial state defined.' };
  }

  const symbolSet = new Set(fa.alphabet);
  for (const ch of input) {
    if (!symbolSet.has(ch)) {
      return {
        status: 'invalid_input',
        accepted: false,
        trace: [],
        errorMessage: `Input symbol "${ch}" is not in the alphabet {${fa.alphabet.join(', ')}}.`,
      };
    }
  }

  const trace: SimConfig[] = [];
  // Step 1: epsilon-closure of the initial state
  let activeIds = epsilonClosure(fa, new Set([fa.initialStateId]));

  trace.push({
    step: 0,
    activeStateIds: [...activeIds],
    remaining: input,
    traversedTransitionIds: [],
    explanation: `ε-closure({${stateLabel(fa, fa.initialStateId)}}) = ${setLabel(fa, activeIds)}. Input: "${input}".`,
  });

  for (let i = 0; i < input.length; i++) {
    const sym = input[i];

    // Step 2: consume symbol from all active states
    const afterSymbol = new Set<string>();
    const traversedIds: string[] = [];

    for (const stateId of activeIds) {
      for (const t of getTransitionsFrom(fa, stateId, sym)) {
        afterSymbol.add(t.to);
        traversedIds.push(t.id);
      }
    }

    // Step 3: epsilon-closure of resulting states
    activeIds = epsilonClosure(fa, afterSymbol);

    const remaining = input.slice(i + 1);

    if (activeIds.size === 0) {
      trace.push({
        step: i + 1,
        activeStateIds: [],
        consumedSymbol: sym,
        remaining,
        traversedTransitionIds: [],
        explanation: `Read "${sym}". ε-closure is ∅. Machine rejects.`,
      });
      return { status: 'rejected', accepted: false, trace };
    }

    trace.push({
      step: i + 1,
      activeStateIds: [...activeIds],
      consumedSymbol: sym,
      remaining,
      traversedTransitionIds: traversedIds,
      explanation: `Read "${sym}" → ε-closure = ${setLabel(fa, activeIds)}. Remaining: "${remaining}".`,
    });
  }

  const acceptingSet = new Set(fa.acceptingStateIds);
  const accepted = [...activeIds].some((id) => acceptingSet.has(id));

  const finalConfig = trace[trace.length - 1];
  trace[trace.length - 1] = {
    ...finalConfig,
    explanation: accepted
      ? `Input consumed. Active: ${setLabel(fa, activeIds)}. At least one is accepting. String ACCEPTED ✓`
      : `Input consumed. Active: ${setLabel(fa, activeIds)}. None is accepting. String REJECTED ✗`,
  };

  return { status: accepted ? 'accepted' : 'rejected', accepted, trace };
}

// ─── Unified entry point ──────────────────────────────────────────────────────

export function simulate(fa: FiniteAutomaton, input: string): SimResult {
  switch (fa.type) {
    case 'dfa':
      return simulateDFA(fa, input);
    case 'nfa':
      return simulateNFA(fa, input);
    case 'enfa':
      return simulateENFA(fa, input);
    default:
      return {
        status: 'invalid_machine',
        accepted: false,
        trace: [],
        errorMessage: `Unknown machine type.`,
      };
  }
}
