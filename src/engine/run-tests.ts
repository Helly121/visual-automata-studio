import assert from 'node:assert';
import { simulateDFA, simulateNFA, simulateENFA, epsilonClosure } from './simulate.ts';
import { validateAutomaton } from './validate.ts';
import { serializeProject, deserializeProject } from './persistence.ts';
import {
  exampleDFAEndingIn01,
  exampleDFAEvenOnes,
  exampleNFAContains01,
  exampleENFAaStar,
} from './examples.ts';
import type { FiniteAutomaton } from './types.ts';

console.log('--- RUNNING PHASE 2 AUTOMATA ENGINE SUITE ---');

let passedCount = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passedCount++;
  } catch (err) {
    console.error(`FAIL: ${name}`);
    throw err;
  }
}

// 1. DFA Ending in 01
const faEnding01 = exampleDFAEndingIn01;
['01', '001', '101', '0101', '11101'].forEach((s) => {
  test(`DFA ending01 accepts "${s}"`, () => {
    assert.strictEqual(simulateDFA(faEnding01, s).accepted, true);
  });
});
['', '0', '1', '10', '11', '010'].forEach((s) => {
  test(`DFA ending01 rejects "${s}"`, () => {
    assert.strictEqual(simulateDFA(faEnding01, s).accepted, false);
  });
});
test('DFA ending01 trace length', () => {
  const r = simulateDFA(faEnding01, '01');
  assert.strictEqual(r.trace.length, 3);
  assert.strictEqual(r.status, 'accepted');
});
test('DFA ending01 invalid symbol', () => {
  const r = simulateDFA(faEnding01, '02');
  assert.strictEqual(r.status, 'invalid_input');
});

// 2. DFA Even 1s
const faEvenOnes = exampleDFAEvenOnes;
['', '0', '00', '11', '011', '110', '1111'].forEach((s) => {
  test(`DFA even1s accepts "${s}"`, () => {
    assert.strictEqual(simulateDFA(faEvenOnes, s).accepted, true);
  });
});
['1', '01', '10', '001', '111'].forEach((s) => {
  test(`DFA even1s rejects "${s}"`, () => {
    assert.strictEqual(simulateDFA(faEvenOnes, s).accepted, false);
  });
});
test('DFA even1s accepts empty string', () => {
  assert.strictEqual(simulateDFA(faEvenOnes, '').accepted, true);
});

// 3. DFA Validation: missing transitions
const incomplete: FiniteAutomaton = {
  type: 'dfa',
  states: [{ id: 'q0', label: 'q₀', isInitial: true, isAccepting: false }],
  alphabet: ['0', '1'],
  transitions: [{ id: 't0', from: 'q0', to: 'q0', symbol: '0' }],
  initialStateId: 'q0',
  acceptingStateIds: [],
};
test('reports MISSING_TRANSITION warning and valid: true', () => {
  const res = validateAutomaton(incomplete);
  assert(res.warnings.some((w) => w.kind === 'MISSING_TRANSITION'));
  assert.strictEqual(res.valid, true);
});

// 4. DFA Validation: nondeterminism
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
    { id: 't1', from: 'q0', to: 'q2', symbol: '0' },
  ],
  initialStateId: 'q0',
  acceptingStateIds: ['q1'],
};
test('reports NONDETERMINISM error and valid: false', () => {
  const res = validateAutomaton(nondeterministic);
  assert(res.errors.some((e) => e.kind === 'NONDETERMINISM'));
  assert.strictEqual(res.valid, false);
});

// 5. DFA Validation: no initial state
const noInit: FiniteAutomaton = {
  type: 'dfa',
  states: [{ id: 'q0', label: 'q₀', isInitial: false, isAccepting: true }],
  alphabet: ['a'],
  transitions: [],
  initialStateId: null,
  acceptingStateIds: ['q0'],
};
test('reports NO_INITIAL_STATE error', () => {
  const res = validateAutomaton(noInit);
  assert(res.errors.some((e) => e.kind === 'NO_INITIAL_STATE'));
  assert.strictEqual(simulateDFA(noInit, 'a').status, 'invalid_machine');
});

// 6. NFA contains 01
const faContains01 = exampleNFAContains01;
['01', '001', '101', '0101', '1011'].forEach((s) => {
  test(`NFA contains01 accepts "${s}"`, () => {
    assert.strictEqual(simulateNFA(faContains01, s).accepted, true);
  });
});
['', '0', '1', '10', '11', '00'].forEach((s) => {
  test(`NFA contains01 rejects "${s}"`, () => {
    assert.strictEqual(simulateNFA(faContains01, s).accepted, false);
  });
});
test('NFA contains01 trace activeStateIds and length', () => {
  const r = simulateNFA(faContains01, '01');
  assert(r.trace[0].activeStateIds.includes('q0'));
  assert.strictEqual(r.trace.length, 3);
  assert.strictEqual(r.accepted, true);
});
test('NFA contains01 invalid symbol', () => {
  const r = simulateNFA(faContains01, '2');
  assert.strictEqual(r.status, 'invalid_input');
});

// 7. ε-NFA a*
const faEps = exampleENFAaStar;
['', 'a', 'aa', 'aaa', 'aaaa'].forEach((s) => {
  test(`ε-NFA a* accepts "${s}"`, () => {
    assert.strictEqual(simulateENFA(faEps, s).accepted, true);
  });
});
['b', 'ab', 'ba'].forEach((s) => {
  test(`ε-NFA a* rejects "${s}"`, () => {
    assert.strictEqual(simulateENFA(faEps, s).status, 'invalid_input');
  });
});
test('ε-NFA a* accepts empty string via closure', () => {
  assert.strictEqual(simulateENFA(faEps, '').accepted, true);
});

// 8. Epsilon closure
test('epsilonClosure handles cycle', () => {
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
  assert(closure.has('q0'));
  assert(closure.has('q1'));
  assert.strictEqual(closure.size, 2);
});
test('epsilonClosure identity when no eps transitions', () => {
  const closure = epsilonClosure(faEnding01, new Set(['q0', 'q1']));
  assert.deepStrictEqual([...closure].sort(), ['q0', 'q1']);
});

// 9. Project Serialization & Deserialization
test('Project serialization round-trips correctly', () => {
  const json = serializeProject(exampleDFAEndingIn01, 'Test', 'desc', {
    q0: { x: 0, y: 0 }, q1: { x: 100, y: 0 }, q2: { x: 200, y: 0 },
  });
  const project = deserializeProject(json);
  assert.strictEqual(project.name, 'Test');
  assert.strictEqual(project.machine.type, 'dfa');
  assert.strictEqual(project.machine.states.length, 3);
});
test('deserializeProject error handling', () => {
  assert.throws(() => deserializeProject('not json'), /valid JSON/);
  assert.throws(() => deserializeProject(JSON.stringify({ formatVersion: 99, name: 'x', machine: { type: 'dfa', states: [], alphabet: [], transitions: [] } })), /format version/);
  assert.throws(() => deserializeProject(JSON.stringify({ formatVersion: 1, name: 'x' })), /"machine"/);
});

// 10. Trace correctness
test('Execution trace step numbers and symbols', () => {
  const r = simulateDFA(exampleDFAEndingIn01, '101');
  assert.strictEqual(r.trace[0].step, 0);
  assert.strictEqual(r.trace[1].step, 1);
  assert.strictEqual(r.trace[3].step, 3);

  const r2 = simulateDFA(exampleDFAEndingIn01, '01');
  assert.strictEqual(r2.trace[1].consumedSymbol, '0');
  assert.strictEqual(r2.trace[2].consumedSymbol, '1');

  const r3 = simulateNFA(exampleNFAContains01, '0');
  assert.strictEqual(r3.trace[0].consumedSymbol, undefined);
});

console.log(`ALL ${passedCount} PHASE 2 AUTOMATA ENGINE TESTS PASSED! 🎉`);
