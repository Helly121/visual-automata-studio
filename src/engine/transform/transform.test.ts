import { describe, it, expect } from 'vitest';
import {
  computeDetailedClosure,
  getEpsilonClosure,
  runEpsilonClosureAnalysis,
  convertENFAToNFA,
} from './epsilon-closure.ts';
import { runSubsetConstruction } from './subset-construction.ts';
import { runDfaMinimization } from './minimization.ts';
import { verifyLanguageEquivalence } from './equivalence.ts';
import { TRANSFORMATION_PRESETS } from './presets.ts';
import type { FiniteAutomaton } from '../types.ts';
import { simulate } from '../simulate.ts';

describe('Transform Engine: Epsilon Closure', () => {
  it('includes starting state in closure by definition (identity)', () => {
    const fa: FiniteAutomaton = {
      type: 'enfa',
      alphabet: ['a'],
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
        { id: 'q1', label: 'q₁', isInitial: false, isAccepting: true },
      ],
      transitions: [],
      initialStateId: 'q0',
      acceptingStateIds: ['q1'],
    };

    const closure = getEpsilonClosure(fa, ['q0']);
    expect(closure.has('q0')).toBe(true);
    expect(closure.size).toBe(1);
  });

  it('handles epsilon cycles without infinite loops and detects cycle', () => {
    const fa: FiniteAutomaton = {
      type: 'enfa',
      alphabet: ['a'],
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
        { id: 'q1', label: 'q₁', isInitial: false, isAccepting: false },
        { id: 'q2', label: 'q₂', isInitial: false, isAccepting: true },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: 'ε' },
        { id: 't1', from: 'q1', to: 'q2', symbol: 'ε' },
        { id: 't2', from: 'q2', to: 'q0', symbol: 'ε' }, // Cycle back to q0
      ],
      initialStateId: 'q0',
      acceptingStateIds: ['q2'],
    };

    const { closure, hasCycle } = computeDetailedClosure(fa, ['q0']);
    expect(hasCycle).toBe(true);
    expect(closure.has('q0')).toBe(true);
    expect(closure.has('q1')).toBe(true);
    expect(closure.has('q2')).toBe(true);
    expect(closure.size).toBe(3);
  });

  it('computes closure over a set of states', () => {
    const fa: FiniteAutomaton = {
      type: 'enfa',
      alphabet: ['a', 'b'],
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
        { id: 'q1', label: 'q₁', isInitial: false, isAccepting: false },
        { id: 'q2', label: 'q₂', isInitial: false, isAccepting: true },
        { id: 'q3', label: 'q₃', isInitial: false, isAccepting: false },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: 'ε' },
        { id: 't1', from: 'q2', to: 'q3', symbol: 'ε' },
      ],
      initialStateId: 'q0',
      acceptingStateIds: ['q2'],
    };

    const closure = getEpsilonClosure(fa, ['q0', 'q2']);
    expect(closure.has('q0')).toBe(true);
    expect(closure.has('q1')).toBe(true);
    expect(closure.has('q2')).toBe(true);
    expect(closure.has('q3')).toBe(true);
    expect(closure.size).toBe(4);
  });

  it('runs step-by-step epsilon closure analysis with full trace', () => {
    const preset = TRANSFORMATION_PRESETS.find((p) => p.id === 'preset-enfa-a-star-cycle')!;
    const result = runEpsilonClosureAnalysis(preset.machine);
    expect(result.steps.length).toBeGreaterThan(1);
    expect(result.summary.initialStatesCount).toBe(preset.machine.states.length);
  });
});

describe('Transform Engine: Epsilon-Removal (ε-NFA to NFA)', () => {
  it('converts ε-NFA to pure NFA without any ε-transitions and preserves language', () => {
    const preset = TRANSFORMATION_PRESETS.find((p) => p.id === 'preset-enfa-thompson-or')!;
    const res = convertENFAToNFA(preset.machine);

    // No epsilon transitions in resulting machine
    expect(res.targetMachine.transitions.some((t) => t.symbol === 'ε')).toBe(false);

    // Language equivalence verified
    expect(res.verification.allMatch).toBe(true);

    // Tests specific strings
    expect(simulate(res.targetMachine, 'a').accepted).toBe(true);
    expect(simulate(res.targetMachine, 'b').accepted).toBe(true);
    expect(simulate(res.targetMachine, 'ab').accepted).toBe(false);
  });
});

describe('Transform Engine: NFA to DFA Subset Construction', () => {
  const contains01Preset = TRANSFORMATION_PRESETS.find((p) => p.id === 'preset-nfa-contains-01')!;

  it('correctly discovers subsets and avoids duplicate states', () => {
    const res = runSubsetConstruction(contains01Preset.machine);

    // Deterministic state IDs and no duplicates
    const stateIds = res.targetMachine.states.map((s) => s.id);
    const uniqueIds = new Set(stateIds);
    expect(stateIds.length).toBe(uniqueIds.size);

    // Target is a valid DFA
    expect(res.targetMachine.type).toBe('dfa');
    expect(res.targetMachine.initialStateId).toBeDefined();

    // Check language equivalence
    expect(res.verification.allMatch).toBe(true);
  });

  it('correctly sets initial DFA state as epsilon closure of NFA initial state', () => {
    const enfaPreset = TRANSFORMATION_PRESETS.find((p) => p.id === 'preset-enfa-a-star-cycle')!;
    const res = runSubsetConstruction(enfaPreset.machine);

    expect(res.targetMachine.initialStateId).toBeDefined();
    // Since q0 --ε--> q1 and q1 is accepting, the DFA start state must be accepting!
    const startState = res.targetMachine.states.find(
      (s) => s.id === res.targetMachine.initialStateId,
    );
    expect(startState?.isAccepting).toBe(true);
  });

  it('marks DFA state accepting when subset contains at least one accepting NFA state', () => {
    const endsWith01Preset = TRANSFORMATION_PRESETS.find((p) => p.id === 'preset-nfa-ends-01')!;
    const res = runSubsetConstruction(endsWith01Preset.machine);

    // DFA must accept '01' and '101' and reject '10' and ''
    expect(simulate(res.targetMachine, '01').accepted).toBe(true);
    expect(simulate(res.targetMachine, '101').accepted).toBe(true);
    expect(simulate(res.targetMachine, '10').accepted).toBe(false);
    expect(simulate(res.targetMachine, '').accepted).toBe(false);
    expect(res.verification.allMatch).toBe(true);
  });

  it('handles empty subsets with explicit dead/sink state', () => {
    const deadPathPreset = TRANSFORMATION_PRESETS.find((p) => p.id === 'preset-nfa-dead-state')!;
    const res = runSubsetConstruction(deadPathPreset.machine);

    // Must have a trap state representing empty set
    const trapState = res.targetMachine.states.find((s) => s.label.includes('∅'));
    expect(trapState).toBeDefined();
    expect(trapState?.isAccepting).toBe(false);

    // Language equivalence preserved
    expect(res.verification.allMatch).toBe(true);
  });

  it('produces intermediate machines at each step without mutating previous snapshots', () => {
    const res = runSubsetConstruction(contains01Preset.machine);

    expect(res.steps.length).toBeGreaterThan(3);

    // Initial step has 1 state and 0 transitions
    expect(res.steps[0].intermediateMachine.states.length).toBe(1);
    expect(res.steps[0].intermediateMachine.transitions.length).toBe(0);

    // Step state counts monotonically non-decreasing
    for (let i = 1; i < res.steps.length; i++) {
      expect(res.steps[i].intermediateMachine.states.length).toBeGreaterThanOrEqual(
        res.steps[i - 1].intermediateMachine.states.length,
      );
    }
  });
});

describe('Transform Engine: DFA Minimization', () => {
  it('correctly merges equivalent states in textbook 5-state DFA (from Lesson FA06)', () => {
    const preset = TRANSFORMATION_PRESETS.find((p) => p.id === 'preset-dfa-redundant-5-state')!;
    const res = runDfaMinimization(preset.machine);

    // Original machine has 5 states: q0, q1, q2, q3, q4
    expect(res.sourceMachine.states.length).toBe(5);

    // Minimized DFA must have exactly 3 states: [q0], [q1, q2], [q3, q4]
    expect(res.targetMachine.states.length).toBe(3);

    // Language equivalence must strictly hold
    expect(res.verification.allMatch).toBe(true);

    // Acceptance checks
    expect(simulate(res.targetMachine, '0').accepted).toBe(true);
    expect(simulate(res.targetMachine, '1').accepted).toBe(true);
    expect(simulate(res.targetMachine, '01').accepted).toBe(false);
    expect(simulate(res.targetMachine, '11').accepted).toBe(false);
  });

  it('prunes unreachable states prior to table-filling', () => {
    const preset = TRANSFORMATION_PRESETS.find((p) => p.id === 'preset-dfa-with-unreachable')!;
    const res = runDfaMinimization(preset.machine);

    // States q2 and q3 were unreachable
    expect(res.sourceMachine.states.length).toBe(4);
    // Minimized machine should only contain reachable equivalent classes
    expect(res.targetMachine.states.length).toBeLessThanOrEqual(2);
    expect(res.verification.allMatch).toBe(true);

    // Step 0 must record the reachability pruning
    expect(res.steps[0].phase).toBe('prune-unreachable');
  });

  it('does not merge distinguishable states', () => {
    const preset = TRANSFORMATION_PRESETS.find((p) => p.id === 'preset-dfa-even-ones-duplicate')!;
    const res = runDfaMinimization(preset.machine);

    // Accepts even 1s
    expect(simulate(res.targetMachine, '').accepted).toBe(true);
    expect(simulate(res.targetMachine, '11').accepted).toBe(true);
    expect(simulate(res.targetMachine, '1').accepted).toBe(false);
    expect(simulate(res.targetMachine, '111').accepted).toBe(false);

    // Even states (q0, q2) merge, odd states (q1, q3) merge -> exactly 2 states!
    expect(res.targetMachine.states.length).toBe(2);
    expect(res.verification.allMatch).toBe(true);
  });

  it('completes missing transitions with a sink state before minimizing', () => {
    const incompleteFa: FiniteAutomaton = {
      type: 'dfa',
      alphabet: ['0', '1'],
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isAccepting: true },
        { id: 'q1', label: 'q₁', isInitial: false, isAccepting: false },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: '0' },
        // Missing transition on 1 from q0
        // Missing transitions from q1
      ],
      initialStateId: 'q0',
      acceptingStateIds: ['q0'],
    };

    const res = runDfaMinimization(incompleteFa);
    expect(res.targetMachine).toBeDefined();
    expect(res.verification.allMatch).toBe(true);
  });
});

describe('Transform Engine: Language Equivalence Verifier', () => {
  it('detects equivalence accurately', () => {
    const preset = TRANSFORMATION_PRESETS[0];
    const check = verifyLanguageEquivalence(preset.machine, preset.machine);
    expect(check.allMatch).toBe(true);
    expect(check.samples.length).toBeGreaterThan(10);
  });

  it('detects discrepancy if machines differ', () => {
    const dfa1 = TRANSFORMATION_PRESETS.find((p) => p.id === 'preset-dfa-redundant-5-state')!.machine;
    const dfa2 = TRANSFORMATION_PRESETS.find((p) => p.id === 'preset-dfa-with-unreachable')!.machine;
    const check = verifyLanguageEquivalence(dfa1, dfa2);
    expect(check.allMatch).toBe(false);
  });
});
