import { describe, it, expect } from 'vitest';
import {
  simulateDFA, simulateNFA, simulateENFA, epsilonClosure,
  validateAutomaton,
  serializeProject, deserializeProject,
  exampleDFAEndingIn01, exampleDFAEvenOnes, exampleNFAContains01, exampleENFAaStar,
} from './index';
import type { FiniteAutomaton } from './types';

// ─── DFA: Strings ending in "01" ─────────────────────────────────────────────
describe('DFA: strings ending in "01"', () => {
  const fa = exampleDFAEndingIn01;
  it.each(['01', '001', '101', '0101', '11101'])('accepts "%s"', (s) => {
    expect(simulateDFA(fa, s).accepted).toBe(true);
  });
  it.each(['', '0', '1', '10', '11', '010'])('rejects "%s"', (s) => {
    expect(simulateDFA(fa, s).accepted).toBe(false);
  });
  it('trace length equals input length + 1', () => {
    const r = simulateDFA(fa, '01');
    expect(r.trace).toHaveLength(3); // initial + 2 steps
  });
  it('final step shows accepted status', () => {
    const r = simulateDFA(fa, '01');
    expect(r.status).toBe('accepted');
  });
  it('rejects invalid symbol', () => {
    const r = simulateDFA(fa, '02');
    expect(r.status).toBe('invalid_input');
  });
});

// ─── DFA: Even number of 1s ──────────────────────────────────────────────────
describe('DFA: even number of 1s', () => {
  const fa = exampleDFAEvenOnes;
  it.each(['', '0', '00', '11', '011', '110', '1111'])('accepts "%s"', (s) => {
    expect(simulateDFA(fa, s).accepted).toBe(true);
  });
  it.each(['1', '01', '10', '001', '111'])('rejects "%s"', (s) => {
    expect(simulateDFA(fa, s).accepted).toBe(false);
  });
  it('accepts empty string (0 ones is even)', () => {
    expect(simulateDFA(fa, '').accepted).toBe(true);
  });
});

// ─── DFA: missing transitions ─────────────────────────────────────────────────
describe('DFA validation: missing transitions', () => {
  const incomplete: FiniteAutomaton = {
    type: 'dfa',
    states: [
      { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
    ],
    alphabet: ['0', '1'],
    transitions: [
      { id: 't0', from: 'q0', to: 'q0', symbol: '0' },
      // Missing transition on '1'
    ],
    initialStateId: 'q0',
    acceptingStateIds: [],
  };
  it('reports MISSING_TRANSITION warning', () => {
    const result = validateAutomaton(incomplete);
    expect(result.warnings.some((w) => w.kind === 'MISSING_TRANSITION')).toBe(true);
  });
  it('still reports valid:true (missing transitions are warnings, not errors)', () => {
    const result = validateAutomaton(incomplete);
    expect(result.valid).toBe(true);
  });
});

// ─── DFA: nondeterminism error ────────────────────────────────────────────────
describe('DFA validation: nondeterminism', () => {
  const nondeterministic: FiniteAutomaton = {
    type: 'dfa',
    states: [
      { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
      { id: 'q1', label: 'q₁', isInitial: false, isAccepting: true },
      { id: 'q2', label: 'q₂', isInitial: false, isAccepting: false },
    ],
    alphabet: ['0'],
    transitions: [
      { id: 't0', from: 'q0', to: 'q1', symbol: '0' },
      { id: 't1', from: 'q0', to: 'q2', symbol: '0' }, // duplicate
    ],
    initialStateId: 'q0',
    acceptingStateIds: ['q1'],
  };
  it('reports NONDETERMINISM error', () => {
    const result = validateAutomaton(nondeterministic);
    expect(result.errors.some((e) => e.kind === 'NONDETERMINISM')).toBe(true);
    expect(result.valid).toBe(false);
  });
});

// ─── DFA: no initial state ────────────────────────────────────────────────────
describe('DFA validation: no initial state', () => {
  const noInit: FiniteAutomaton = {
    type: 'dfa',
    states: [{ id: 'q0', label: 'q₀', isInitial: false, isAccepting: true }],
    alphabet: ['a'],
    transitions: [],
    initialStateId: null,
    acceptingStateIds: ['q0'],
  };
  it('reports NO_INITIAL_STATE error', () => {
    const result = validateAutomaton(noInit);
    expect(result.errors.some((e) => e.kind === 'NO_INITIAL_STATE')).toBe(true);
  });
  it('simulation returns invalid_machine status', () => {
    const r = simulateDFA(noInit, 'a');
    expect(r.status).toBe('invalid_machine');
  });
});

// ─── NFA: contains "01" ───────────────────────────────────────────────────────
describe('NFA: strings containing "01"', () => {
  const fa = exampleNFAContains01;
  it.each(['01', '001', '101', '0101', '1011'])('accepts "%s"', (s) => {
    expect(simulateNFA(fa, s).accepted).toBe(true);
  });
  it.each(['', '0', '1', '10', '11', '00'])('rejects "%s"', (s) => {
    expect(simulateNFA(fa, s).accepted).toBe(false);
  });
  it('trace tracks all active state sets', () => {
    const r = simulateNFA(fa, '01');
    // step 0: {q0}, step 1 after reading 0: {q0, q1}, step 2 after 1: {q0, q2}
    expect(r.trace[0].activeStateIds).toContain('q0');
    expect(r.trace).toHaveLength(3);
    expect(r.accepted).toBe(true);
  });
  it('rejects invalid symbol', () => {
    const r = simulateNFA(fa, '2');
    expect(r.status).toBe('invalid_input');
  });
});

// ─── ε-NFA: a* ────────────────────────────────────────────────────────────────
describe('ε-NFA: language a*', () => {
  const fa = exampleENFAaStar;
  it.each(['', 'a', 'aa', 'aaa', 'aaaa'])('accepts "%s"', (s) => {
    expect(simulateENFA(fa, s).accepted).toBe(true);
  });
  it.each(['b', 'ab', 'ba'])('rejects "%s"', (s) => {
    expect(simulateENFA(fa, s).status).toBe('invalid_input');
  });
  it('accepts empty string via epsilon closure', () => {
    expect(simulateENFA(fa, '').accepted).toBe(true);
  });
});

// ─── epsilon closure correctness ──────────────────────────────────────────────
describe('epsilonClosure', () => {
  it('handles simple cycle (q0 --ε--> q1 --ε--> q0)', () => {
    const fa: FiniteAutomaton = {
      type: 'enfa',
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isAccepting: false },
        { id: 'q1', label: 'q₁', isInitial: false, isAccepting: true },
      ],
      alphabet: [],
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: 'ε' },
        { id: 't1', from: 'q1', to: 'q0', symbol: 'ε' },
      ],
      initialStateId: 'q0',
      acceptingStateIds: ['q1'],
    };
    const closure = epsilonClosure(fa, new Set(['q0']));
    expect(closure.has('q0')).toBe(true);
    expect(closure.has('q1')).toBe(true);
    expect(closure.size).toBe(2);
  });

  it('identity closure when no epsilon transitions', () => {
    const fa = exampleDFAEndingIn01;
    const closure = epsilonClosure(fa, new Set(['q0', 'q1']));
    expect([...closure].sort()).toEqual(['q0', 'q1']);
  });
});

// ─── Serialization / import validation ───────────────────────────────────────
describe('Project serialization', () => {
  it('round-trips correctly', () => {
    const json = serializeProject(exampleDFAEndingIn01, 'Test', 'desc', {
      q0: { x: 0, y: 0 }, q1: { x: 100, y: 0 }, q2: { x: 200, y: 0 },
    });
    const project = deserializeProject(json);
    expect(project.name).toBe('Test');
    expect(project.machine.type).toBe('dfa');
    expect(project.machine.states).toHaveLength(3);
  });

  it('throws on invalid JSON', () => {
    expect(() => deserializeProject('not json')).toThrow('valid JSON');
  });

  it('throws on wrong format version', () => {
    const bad = JSON.stringify({ formatVersion: 99, name: 'x', machine: { type: 'dfa', states: [], alphabet: [], transitions: [] } });
    expect(() => deserializeProject(bad)).toThrow('format version');
  });

  it('throws when machine is missing', () => {
    const bad = JSON.stringify({ formatVersion: 1, name: 'x' });
    expect(() => deserializeProject(bad)).toThrow('"machine"');
  });
});

// ─── Execution trace correctness ──────────────────────────────────────────────
describe('Execution trace structure', () => {
  it('DFA trace has correct step numbers', () => {
    const r = simulateDFA(exampleDFAEndingIn01, '101');
    expect(r.trace[0].step).toBe(0);
    expect(r.trace[1].step).toBe(1);
    expect(r.trace[3].step).toBe(3);
  });

  it('DFA trace consumed symbol is correct', () => {
    const r = simulateDFA(exampleDFAEndingIn01, '01');
    expect(r.trace[1].consumedSymbol).toBe('0');
    expect(r.trace[2].consumedSymbol).toBe('1');
  });

  it('NFA trace initial config has no consumedSymbol', () => {
    const r = simulateNFA(exampleNFAContains01, '0');
    expect(r.trace[0].consumedSymbol).toBeUndefined();
  });
});
