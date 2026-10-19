import { type FiniteAutomaton } from './types.ts';

/**
 * EXAMPLE A: DFA accepting binary strings ending in "01"
 * Alphabet: {0, 1}
 * States: q0 (initial), q1, q2 (accepting)
 * Accepted: "01", "001", "101", "0101"
 * Rejected: "", "0", "1", "10", "11"
 */
export const exampleDFAEndingIn01: FiniteAutomaton = {
  type: 'dfa',
  states: [
    { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
    { id: 'q1', label: 'q₁', isInitial: false, isAccepting: false },
    { id: 'q2', label: 'q₂', isInitial: false, isAccepting: true },
  ],
  alphabet: ['0', '1'],
  transitions: [
    // From q0: read 0 → q1, read 1 → q0
    { id: 't0', from: 'q0', to: 'q1', symbol: '0' },
    { id: 't1', from: 'q0', to: 'q0', symbol: '1' },
    // From q1: read 0 → q1 (stay, last symbol is 0), read 1 → q2 (just read "01")
    { id: 't2', from: 'q1', to: 'q1', symbol: '0' },
    { id: 't3', from: 'q1', to: 'q2', symbol: '1' },
    // From q2: read 0 → q1 (new candidate for "01"), read 1 → q0 (reset)
    { id: 't4', from: 'q2', to: 'q1', symbol: '0' },
    { id: 't5', from: 'q2', to: 'q0', symbol: '1' },
  ],
  initialStateId: 'q0',
  acceptingStateIds: ['q2'],
};

/**
 * EXAMPLE B: DFA accepting binary strings with an even number of 1s
 * Alphabet: {0, 1}
 * States: q0 (initial, accepting — even 1s), q1 (odd 1s)
 * Accepted: "", "0", "00", "11", "011", "110"
 * Rejected: "1", "01", "10", "111"
 */
export const exampleDFAEvenOnes: FiniteAutomaton = {
  type: 'dfa',
  states: [
    { id: 'q0', label: 'q₀', isInitial: true, isAccepting: true },
    { id: 'q1', label: 'q₁', isInitial: false, isAccepting: false },
  ],
  alphabet: ['0', '1'],
  transitions: [
    // 0 doesn't change parity
    { id: 't0', from: 'q0', to: 'q0', symbol: '0' },
    { id: 't1', from: 'q1', to: 'q1', symbol: '0' },
    // 1 flips parity
    { id: 't2', from: 'q0', to: 'q1', symbol: '1' },
    { id: 't3', from: 'q1', to: 'q0', symbol: '1' },
  ],
  initialStateId: 'q0',
  acceptingStateIds: ['q0'],
};

/**
 * EXAMPLE C: NFA demonstrating nondeterministic branching
 * Accepts binary strings that contain "01" anywhere.
 * Alphabet: {0, 1}
 * States: q0 (initial), q1, q2 (accepting)
 */
export const exampleNFAContains01: FiniteAutomaton = {
  type: 'nfa',
  states: [
    { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
    { id: 'q1', label: 'q₁', isInitial: false, isAccepting: false },
    { id: 'q2', label: 'q₂', isInitial: false, isAccepting: true },
  ],
  alphabet: ['0', '1'],
  transitions: [
    // q0: stay on any symbol (guess we haven't started "01" yet)
    { id: 't0', from: 'q0', to: 'q0', symbol: '0' },
    { id: 't1', from: 'q0', to: 'q0', symbol: '1' },
    // q0: nondeterministically guess "0" starts the substring "01"
    { id: 't2', from: 'q0', to: 'q1', symbol: '0' },
    // q1: if we see "1" after "0", we've found "01"
    { id: 't3', from: 'q1', to: 'q2', symbol: '1' },
    // q2: stay in accepting state on any symbol
    { id: 't4', from: 'q2', to: 'q2', symbol: '0' },
    { id: 't5', from: 'q2', to: 'q2', symbol: '1' },
  ],
  initialStateId: 'q0',
  acceptingStateIds: ['q2'],
};

/**
 * EXAMPLE D: ε-NFA demonstrating epsilon closure and empty-string acceptance
 * Accepts: ε, a, aa, aaa, ... (zero or more 'a's) — language: a*
 * Alphabet: {a}
 * States: q0 (initial), q1 (accepting)
 * q0 --ε--> q1   (empty string accepted via closure)
 * q0 --a--> q0   (loop for more a's)
 * q1 --ε--> q0   (cycle — ε-closure handles this)
 */
export const exampleENFAaStar: FiniteAutomaton = {
  type: 'enfa',
  states: [
    { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
    { id: 'q1', label: 'q₁', isInitial: false, isAccepting: true },
  ],
  alphabet: ['a'],
  transitions: [
    { id: 't0', from: 'q0', to: 'q1', symbol: 'ε' },
    { id: 't1', from: 'q0', to: 'q0', symbol: 'a' },
    { id: 't2', from: 'q1', to: 'q0', symbol: 'ε' },
  ],
  initialStateId: 'q0',
  acceptingStateIds: ['q1'],
};

export interface ExampleEntry {
  id: string;
  name: string;
  description: string;
  language: string;
  machine: FiniteAutomaton;
  accepted: string[];
  rejected: string[];
  /** Suggested node positions for the React Flow canvas. */
  nodePositions: Record<string, { x: number; y: number }>;
}

export const EXAMPLE_GALLERY: ExampleEntry[] = [
  {
    id: 'ex-dfa-ending-01',
    name: 'DFA: Strings ending in "01"',
    description: 'A 3-state DFA over {0,1} that accepts exactly the binary strings whose last two symbols are 0 then 1.',
    language: '{ w ∈ {0,1}* | w ends with "01" }',
    machine: exampleDFAEndingIn01,
    accepted: ['01', '001', '101', '0101', '11101'],
    rejected: ['', '0', '1', '10', '11', '010'],
    nodePositions: { q0: { x: 80, y: 200 }, q1: { x: 300, y: 200 }, q2: { x: 520, y: 200 } },
  },
  {
    id: 'ex-dfa-even-ones',
    name: 'DFA: Even number of 1s',
    description: 'A 2-state DFA over {0,1} that accepts binary strings containing an even count of 1s (0 is even).',
    language: '{ w ∈ {0,1}* | #₁(w) is even }',
    machine: exampleDFAEvenOnes,
    accepted: ['', '0', '00', '11', '011', '110', '1111'],
    rejected: ['1', '01', '10', '001', '111'],
    nodePositions: { q0: { x: 160, y: 200 }, q1: { x: 440, y: 200 } },
  },
  {
    id: 'ex-nfa-contains-01',
    name: 'NFA: Contains substring "01"',
    description: 'A 3-state NFA over {0,1} showing nondeterministic branching — accepts strings that contain "01" anywhere.',
    language: '{ w ∈ {0,1}* | w contains "01" as a substring }',
    machine: exampleNFAContains01,
    accepted: ['01', '001', '101', '0101', '001', '1011'],
    rejected: ['', '0', '1', '10', '11', '00'],
    nodePositions: { q0: { x: 80, y: 200 }, q1: { x: 300, y: 200 }, q2: { x: 520, y: 200 } },
  },
  {
    id: 'ex-enfa-a-star',
    name: 'ε-NFA: Language a*',
    description: 'An ε-NFA with epsilon transitions demonstrating closure over cycles. Accepts the empty string and any number of "a"s.',
    language: '{ aⁿ | n ≥ 0 } = a*',
    machine: exampleENFAaStar,
    accepted: ['', 'a', 'aa', 'aaa', 'aaaa'],
    rejected: ['b', 'ab', 'ba', 'aba'],
    nodePositions: { q0: { x: 160, y: 200 }, q1: { x: 440, y: 200 } },
  },
];
