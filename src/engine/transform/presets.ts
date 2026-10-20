import type { FiniteAutomaton } from '../types.ts';
import type { TransformationType } from './types.ts';

export interface TransformationPreset {
  id: string;
  name: string;
  description: string;
  category: TransformationType[];
  machine: FiniteAutomaton;
  suggestedOperation: TransformationType;
  testStrings: string[];
}

export const TRANSFORMATION_PRESETS: TransformationPreset[] = [
  // ─── NFA Presets ───────────────────────────────────────────────────────────
  {
    id: 'preset-nfa-contains-01',
    name: 'NFA: Contains Substring "01"',
    description: 'A 3-state NFA demonstrating non-deterministic choice on guessing the start of "01". Converts to a clean 3-state DFA.',
    category: ['nfa-to-dfa'],
    suggestedOperation: 'nfa-to-dfa',
    testStrings: ['01', '001', '101', '0101', '111', '', '0', '1', '10'],
    machine: {
      type: 'nfa',
      alphabet: ['0', '1'],
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
        { id: 'q1', label: 'q₁', isInitial: false, isAccepting: false },
        { id: 'q2', label: 'q₂', isInitial: false, isAccepting: true },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q0', symbol: '0' },
        { id: 't1', from: 'q0', to: 'q0', symbol: '1' },
        { id: 't2', from: 'q0', to: 'q1', symbol: '0' },
        { id: 't3', from: 'q1', to: 'q2', symbol: '1' },
        { id: 't4', from: 'q2', to: 'q2', symbol: '0' },
        { id: 't5', from: 'q2', to: 'q2', symbol: '1' },
      ],
      initialStateId: 'q0',
      acceptingStateIds: ['q2'],
    },
  },
  {
    id: 'preset-nfa-ends-01',
    name: 'NFA: Ends with "01"',
    description: 'A classic 3-state NFA that accepts strings ending with "01". Demonstrates subset creation A {q₀}, B {q₀, q₁}, C {q₀, q₂}.',
    category: ['nfa-to-dfa'],
    suggestedOperation: 'nfa-to-dfa',
    testStrings: ['01', '001', '101', '0101', '0', '1', '10', '00'],
    machine: {
      type: 'nfa',
      alphabet: ['0', '1'],
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
        { id: 'q1', label: 'q₁', isInitial: false, isAccepting: false },
        { id: 'q2', label: 'q₂', isInitial: false, isAccepting: true },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q0', symbol: '0' },
        { id: 't1', from: 'q0', to: 'q0', symbol: '1' },
        { id: 't2', from: 'q0', to: 'q1', symbol: '0' },
        { id: 't3', from: 'q1', to: 'q2', symbol: '1' },
      ],
      initialStateId: 'q0',
      acceptingStateIds: ['q2'],
    },
  },
  {
    id: 'preset-nfa-second-from-end-1',
    name: 'NFA: Second Symbol from End is 1',
    description: 'A 3-state NFA recognizing binary strings where the second symbol from the end is 1. Converts to a 4-state DFA.',
    category: ['nfa-to-dfa'],
    suggestedOperation: 'nfa-to-dfa',
    testStrings: ['10', '11', '010', '011', '110', '111', '0', '1', '00', '01'],
    machine: {
      type: 'nfa',
      alphabet: ['0', '1'],
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
        { id: 'q1', label: 'q₁', isInitial: false, isAccepting: false },
        { id: 'q2', label: 'q₂', isInitial: false, isAccepting: true },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q0', symbol: '0' },
        { id: 't1', from: 'q0', to: 'q0', symbol: '1' },
        { id: 't2', from: 'q0', to: 'q1', symbol: '1' },
        { id: 't3', from: 'q1', to: 'q2', symbol: '0' },
        { id: 't4', from: 'q1', to: 'q2', symbol: '1' },
      ],
      initialStateId: 'q0',
      acceptingStateIds: ['q2'],
    },
  },
  {
    id: 'preset-nfa-dead-state',
    name: 'NFA with Dying Path (Dead State Demo)',
    description: 'An NFA where input "b" from q0 has no outgoing transitions. Demonstrates the creation and self-looping behavior of the dead/trap state ∅.',
    category: ['nfa-to-dfa'],
    suggestedOperation: 'nfa-to-dfa',
    testStrings: ['a', 'aa', 'b', 'ab', 'ba'],
    machine: {
      type: 'nfa',
      alphabet: ['a', 'b'],
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
        { id: 'q1', label: 'q₁', isInitial: false, isAccepting: true },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: 'a' },
        { id: 't1', from: 'q1', to: 'q1', symbol: 'a' },
      ],
      initialStateId: 'q0',
      acceptingStateIds: ['q1'],
    },
  },

  // ─── ε-NFA Presets ─────────────────────────────────────────────────────────
  {
    id: 'preset-enfa-a-star-cycle',
    name: 'ε-NFA: Language a* (with Epsilon Cycle)',
    description: 'An ε-NFA containing a bidirectional epsilon cycle (q₀ ⇄ q₁). Demonstrates cycle safety and empty string acceptance via closure.',
    category: ['enfa-to-dfa', 'enfa-to-nfa', 'epsilon-closure'],
    suggestedOperation: 'enfa-to-dfa',
    testStrings: ['', 'a', 'aa', 'aaa', 'b', 'ab'],
    machine: {
      type: 'enfa',
      alphabet: ['a'],
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
        { id: 'q1', label: 'q₁', isInitial: false, isAccepting: true },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: 'ε' },
        { id: 't1', from: 'q0', to: 'q0', symbol: 'a' },
        { id: 't2', from: 'q1', to: 'q0', symbol: 'ε' },
      ],
      initialStateId: 'q0',
      acceptingStateIds: ['q1'],
    },
  },
  {
    id: 'preset-enfa-thompson-or',
    name: 'ε-NFA: Union (a | b) via Epsilon Branches',
    description: 'A 4-state Thompson-style ε-NFA with initial ε-branching into two parallel paths for "a" and "b".',
    category: ['enfa-to-dfa', 'enfa-to-nfa', 'epsilon-closure'],
    suggestedOperation: 'enfa-to-nfa',
    testStrings: ['a', 'b', '', 'ab', 'ba', 'aa'],
    machine: {
      type: 'enfa',
      alphabet: ['a', 'b'],
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
        { id: 'q1', label: 'q₁', isInitial: false, isAccepting: false },
        { id: 'q2', label: 'q₂', isInitial: false, isAccepting: false },
        { id: 'q3', label: 'q₃', isInitial: false, isAccepting: true },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: 'ε' },
        { id: 't1', from: 'q0', to: 'q2', symbol: 'ε' },
        { id: 't2', from: 'q1', to: 'q3', symbol: 'a' },
        { id: 't3', from: 'q2', to: 'q3', symbol: 'b' },
      ],
      initialStateId: 'q0',
      acceptingStateIds: ['q3'],
    },
  },

  // ─── DFA Minimization Presets ──────────────────────────────────────────────
  {
    id: 'preset-dfa-redundant-5-state',
    name: 'DFA: 5-State Redundant (FA-06 Lesson Example)',
    description: 'The textbook 5-state DFA from Lesson FA-06. States q₁ ≡ q₂ and q₃ ≡ q₄ merge, reducing 5 states down to 3 minimal states.',
    category: ['dfa-minimization'],
    suggestedOperation: 'dfa-minimization',
    testStrings: ['0', '1', '00', '01', '10', '11', '001', '011'],
    machine: {
      type: 'dfa',
      alphabet: ['0', '1'],
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
        { id: 'q1', label: 'q₁', isInitial: false, isAccepting: true },
        { id: 'q2', label: 'q₂', isInitial: false, isAccepting: true },
        { id: 'q3', label: 'q₃', isInitial: false, isAccepting: false },
        { id: 'q4', label: 'q₄', isInitial: false, isAccepting: false },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: '0' },
        { id: 't1', from: 'q0', to: 'q2', symbol: '1' },
        { id: 't2', from: 'q1', to: 'q1', symbol: '0' },
        { id: 't3', from: 'q1', to: 'q3', symbol: '1' },
        { id: 't4', from: 'q2', to: 'q2', symbol: '0' },
        { id: 't5', from: 'q2', to: 'q3', symbol: '1' },
        { id: 't6', from: 'q3', to: 'q4', symbol: '0' },
        { id: 't7', from: 'q3', to: 'q4', symbol: '1' },
        { id: 't8', from: 'q4', to: 'q4', symbol: '0' },
        { id: 't9', from: 'q4', to: 'q4', symbol: '1' },
      ],
      initialStateId: 'q0',
      acceptingStateIds: ['q1', 'q2'],
    },
  },
  {
    id: 'preset-dfa-with-unreachable',
    name: 'DFA with Unreachable States',
    description: 'A 4-state DFA containing isolated state q3 and unreachable accepting state q2. Demonstrates reachability pruning prior to table-filling.',
    category: ['dfa-minimization'],
    suggestedOperation: 'dfa-minimization',
    testStrings: ['a', 'aa', 'aaa', ''],
    machine: {
      type: 'dfa',
      alphabet: ['a'],
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
        { id: 'q1', label: 'q₁', isInitial: false, isAccepting: true },
        { id: 'q2', label: 'q₂', isInitial: false, isAccepting: true },
        { id: 'q3', label: 'q₃', isInitial: false, isAccepting: false },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: 'a' },
        { id: 't1', from: 'q1', to: 'q1', symbol: 'a' },
        { id: 't2', from: 'q2', to: 'q3', symbol: 'a' },
        { id: 't3', from: 'q3', to: 'q2', symbol: 'a' },
      ],
      initialStateId: 'q0',
      acceptingStateIds: ['q1', 'q2'],
    },
  },
  {
    id: 'preset-dfa-even-ones-duplicate',
    name: 'DFA: Even 1s with Duplicated States',
    description: 'A 4-state DFA recognizing even numbers of 1s with two identical even-parity states and two odd-parity states. Minimizes to 2 states.',
    category: ['dfa-minimization'],
    suggestedOperation: 'dfa-minimization',
    testStrings: ['', '0', '00', '11', '011', '1', '01', '10', '111'],
    machine: {
      type: 'dfa',
      alphabet: ['0', '1'],
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isAccepting: true },
        { id: 'q1', label: 'q₁', isInitial: false, isAccepting: false },
        { id: 'q2', label: 'q₂', isInitial: false, isAccepting: true },
        { id: 'q3', label: 'q₃', isInitial: false, isAccepting: false },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q2', symbol: '0' },
        { id: 't1', from: 'q0', to: 'q1', symbol: '1' },
        { id: 't2', from: 'q1', to: 'q3', symbol: '0' },
        { id: 't3', from: 'q1', to: 'q0', symbol: '1' },
        { id: 't4', from: 'q2', to: 'q0', symbol: '0' },
        { id: 't5', from: 'q2', to: 'q3', symbol: '1' },
        { id: 't6', from: 'q3', to: 'q1', symbol: '0' },
        { id: 't7', from: 'q3', to: 'q2', symbol: '1' },
      ],
      initialStateId: 'q0',
      acceptingStateIds: ['q0', 'q2'],
    },
  },
];
