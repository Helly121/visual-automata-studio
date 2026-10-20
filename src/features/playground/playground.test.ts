import { describe, it, expect } from 'vitest';
import {
  toMachine,
  makeNode,
  makeEdge,
  getNextStateId,
  getNextEdgeId,
} from './hooks/useAutomataEditor';
import { simulate, simulateDFA, simulateNFA, simulateENFA } from '@/engine/simulate';
import { validateAutomaton } from '@/engine/validate';
import { serializeProject, deserializeProject } from '@/engine/persistence';
import { EXAMPLE_GALLERY } from '@/engine/examples';
import { EPSILON } from '@/engine/types';
import type { Node, Edge } from '@xyflow/react';
import type { StateNodeData, TransitionEdgeData } from '@/engine/types';

describe('Playground Machine Builder — Model & State Operations', () => {
  it('creates stable state and edge IDs without collisions', () => {
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }),
      makeNode('q1', 'q1', { x: 100, y: 0 }),
    ];
    expect(getNextStateId(nodes)).toBe('q2');

    const edges: Edge<TransitionEdgeData>[] = [
      makeEdge('e0', 'q0', 'q1', '0'),
    ];
    expect(getNextEdgeId(edges)).toBe('e1');
  });

  it('converts nodes and edges to FiniteAutomaton model accurately', () => {
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'Start', { x: 0, y: 0 }, true, false),
      makeNode('q1', 'Accept', { x: 150, y: 0 }, false, true),
    ];
    const edges: Edge<TransitionEdgeData>[] = [
      makeEdge('e0', 'q0', 'q1', '1'),
      makeEdge('e1', 'q0', 'q0', '0'),
    ];

    const machine = toMachine(nodes, edges, ['0', '1'], 'dfa');

    expect(machine.type).toBe('dfa');
    expect(machine.initialStateId).toBe('q0');
    expect(machine.acceptingStateIds).toEqual(['q1']);
    expect(machine.states).toHaveLength(2);
    expect(machine.states[0]).toEqual({
      id: 'q0',
      label: 'Start',
      isInitial: true,
      isAccepting: false,
    });
    expect(machine.transitions).toHaveLength(2);
  });

  it('correctly splits multi-symbol edges (e.g. "0, 1") into discrete transitions', () => {
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }, true, false),
      makeNode('q1', 'q1', { x: 100, y: 0 }, false, true),
    ];
    const edges: Edge<TransitionEdgeData>[] = [
      makeEdge('e0', 'q0', 'q1', '0, 1'),
    ];

    const machine = toMachine(nodes, edges, ['0', '1'], 'dfa');

    expect(machine.transitions).toHaveLength(2);
    expect(machine.transitions[0]).toEqual({
      id: 'e0',
      from: 'q0',
      to: 'q1',
      symbol: '0',
    });
    expect(machine.transitions[1]).toEqual({
      id: 'e0_1',
      from: 'q0',
      to: 'q1',
      symbol: '1',
    });
  });

  it('updates state initial and accepting flags', () => {
    let nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }, true, false),
      makeNode('q1', 'q1', { x: 100, y: 0 }, false, false),
    ];

    // Toggle initial to q1
    nodes = nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        isInitial: n.id === 'q1',
      },
    }));

    // Toggle accepting on q1
    nodes = nodes.map((n) =>
      n.id === 'q1' ? { ...n, data: { ...n.data, isAccepting: true } } : n,
    );

    const machine = toMachine(nodes, [], ['0', '1'], 'dfa');
    expect(machine.initialStateId).toBe('q1');
    expect(machine.acceptingStateIds).toEqual(['q1']);
  });

  it('deleting a state removes its connected incoming and outgoing edges', () => {
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }),
      makeNode('q1', 'q1', { x: 100, y: 0 }),
      makeNode('q2', 'q2', { x: 200, y: 0 }),
    ];
    const edges: Edge<TransitionEdgeData>[] = [
      makeEdge('e0', 'q0', 'q1', '0'),
      makeEdge('e1', 'q1', 'q2', '1'),
      makeEdge('e2', 'q0', 'q2', '0'),
    ];

    // Delete q1
    const survivingNodes = nodes.filter((n) => n.id !== 'q1');
    const survivingEdges = edges.filter((e) => e.source !== 'q1' && e.target !== 'q1');

    expect(survivingNodes.map((n) => n.id)).toEqual(['q0', 'q2']);
    expect(survivingEdges.map((e) => e.id)).toEqual(['e2']);

    const machine = toMachine(survivingNodes, survivingEdges, ['0', '1'], 'dfa');
    expect(machine.states).toHaveLength(2);
    expect(machine.transitions).toHaveLength(1);
    expect(machine.transitions[0].from).toBe('q0');
    expect(machine.transitions[0].to).toBe('q2');
  });
});

describe('Playground Machine Builder — Transition Table Synchronization Logic', () => {
  it('updates edges when transition table sets a new transition destination', () => {
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }, true, false),
      makeNode('q1', 'q1', { x: 100, y: 0 }, false, false),
      makeNode('q2', 'q2', { x: 200, y: 0 }, false, true),
    ];
    let edges: Edge<TransitionEdgeData>[] = [
      makeEdge('e0', 'q0', 'q1', '0'),
    ];

    // Table change: from q0 on symbol '0', change destination from q1 to q2
    const fromId = 'q0';
    const symbol = '0';
    const toIds = ['q2'];

    let nextEdges: Edge<TransitionEdgeData>[] = [];
    for (const e of edges) {
      if (e.source === fromId) {
        const symbols = (e.data?.symbol ?? '').split(',').map((s) => s.trim()).filter(Boolean);
        const remaining = symbols.filter((s) => s !== symbol);
        if (toIds.includes(e.target)) {
          nextEdges.push(e);
        } else if (remaining.length > 0) {
          nextEdges.push({ ...e, data: { symbol: remaining.join(', '), isActive: false } });
        }
      } else {
        nextEdges.push(e);
      }
    }
    for (const targetId of toIds) {
      const exists = nextEdges.some((e) => e.source === fromId && e.target === targetId);
      if (!exists) {
        nextEdges.push(makeEdge('e1', fromId, targetId, symbol));
      }
    }
    edges = nextEdges;

    const machine = toMachine(nodes, edges, ['0', '1'], 'dfa');
    expect(machine.transitions).toHaveLength(1);
    expect(machine.transitions[0].from).toBe('q0');
    expect(machine.transitions[0].to).toBe('q2');
    expect(machine.transitions[0].symbol).toBe('0');
  });

  it('supports multi-destination transition table editing for NFAs', () => {
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }, true, false),
      makeNode('q1', 'q1', { x: 100, y: 0 }, false, false),
      makeNode('q2', 'q2', { x: 200, y: 0 }, false, true),
    ];

    // In NFA mode, q0 on '0' transitions to BOTH q0 and q1
    const edges: Edge<TransitionEdgeData>[] = [
      makeEdge('e0', 'q0', 'q0', '0'),
      makeEdge('e1', 'q0', 'q1', '0'),
    ];

    const machine = toMachine(nodes, edges, ['0', '1'], 'nfa');
    expect(machine.transitions).toHaveLength(2);
    expect(machine.transitions.filter((t) => t.from === 'q0' && t.symbol === '0')).toHaveLength(2);
  });
});

describe('Playground Machine Builder — Interactive Simulation on Custom Machines', () => {
  it('correctly executes a user-built DFA with accept and reject paths', () => {
    // DFA that accepts binary strings ending with '1'
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }, true, false),
      makeNode('q1', 'q1', { x: 150, y: 0 }, false, true),
    ];
    const edges: Edge<TransitionEdgeData>[] = [
      makeEdge('e0', 'q0', 'q0', '0'),
      makeEdge('e1', 'q0', 'q1', '1'),
      makeEdge('e2', 'q1', 'q0', '0'),
      makeEdge('e3', 'q1', 'q1', '1'),
    ];

    const machine = toMachine(nodes, edges, ['0', '1'], 'dfa');

    const resAccept = simulateDFA(machine, '0101');
    expect(resAccept.status).toBe('accepted');
    expect(resAccept.accepted).toBe(true);
    expect(resAccept.trace).toHaveLength(5); // step 0 (start) + 4 symbols

    const resReject = simulateDFA(machine, '1010');
    expect(resReject.status).toBe('rejected');
    expect(resReject.accepted).toBe(false);
  });

  it('correctly handles the empty string (epsilon) on DFA', () => {
    // Machine where initial state is accepting (accepts epsilon)
    const nodesAcceptingInitial: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }, true, true),
    ];
    const machine1 = toMachine(nodesAcceptingInitial, [], ['0', '1'], 'dfa');
    const res1 = simulate(machine1, '');
    expect(res1.status).toBe('accepted');
    expect(res1.accepted).toBe(true);

    // Machine where initial state is NOT accepting
    const nodesRejectingInitial: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }, true, false),
    ];
    const machine2 = toMachine(nodesRejectingInitial, [], ['0', '1'], 'dfa');
    const res2 = simulate(machine2, '');
    expect(res2.status).toBe('rejected');
    expect(res2.accepted).toBe(false);
  });

  it('correctly executes an NFA tracking active state sets across branches', () => {
    // NFA accepting strings ending with '01'
    // q0 on 0 -> q0, q1
    // q0 on 1 -> q0
    // q1 on 1 -> q2 (accepting)
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }, true, false),
      makeNode('q1', 'q1', { x: 100, y: 0 }, false, false),
      makeNode('q2', 'q2', { x: 200, y: 0 }, false, true),
    ];
    const edges: Edge<TransitionEdgeData>[] = [
      makeEdge('e0', 'q0', 'q0', '0, 1'),
      makeEdge('e1', 'q0', 'q1', '0'),
      makeEdge('e2', 'q1', 'q2', '1'),
    ];

    const machine = toMachine(nodes, edges, ['0', '1'], 'nfa');

    const res = simulateNFA(machine, '001');
    expect(res.status).toBe('accepted');
    expect(res.accepted).toBe(true);

    // Trace step 1 on '0': active states should be {q0, q1}
    expect(res.trace[1].activeStateIds).toContain('q0');
    expect(res.trace[1].activeStateIds).toContain('q1');

    const resReject = simulateNFA(machine, '010');
    expect(resReject.status).toBe('rejected');
    expect(resReject.accepted).toBe(false);
  });

  it('correctly executes an ε-NFA computing epsilon-closure on start and intermediate states', () => {
    // ε-NFA: q0 -ε-> q1, q1 -0-> q2 (accepting)
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }, true, false),
      makeNode('q1', 'q1', { x: 100, y: 0 }, false, false),
      makeNode('q2', 'q2', { x: 200, y: 0 }, false, true),
    ];
    const edges: Edge<TransitionEdgeData>[] = [
      makeEdge('e0', 'q0', 'q1', EPSILON),
      makeEdge('e1', 'q1', 'q2', '0'),
    ];

    const machine = toMachine(nodes, edges, ['0'], 'enfa');

    const res = simulateENFA(machine, '0');
    expect(res.status).toBe('accepted');
    expect(res.accepted).toBe(true);

    // Step 0 must have computed epsilon closure containing both q0 and q1
    expect(res.trace[0].activeStateIds).toContain('q0');
    expect(res.trace[0].activeStateIds).toContain('q1');
  });

  it('returns invalid_input when string contains symbols not in alphabet', () => {
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }, true, true),
    ];
    const machine = toMachine(nodes, [], ['0', '1'], 'dfa');

    const res = simulate(machine, '012');
    expect(res.status).toBe('invalid_input');
    expect(res.errorMessage).toContain('2');
  });

  it('returns invalid_machine when no initial state is defined', () => {
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }, false, true),
    ];
    const machine = toMachine(nodes, [], ['0', '1'], 'dfa');

    const res = simulate(machine, '0');
    expect(res.status).toBe('invalid_machine');
    expect(res.errorMessage).toContain('initial state');
  });
});

describe('Playground Machine Builder — Validation Engine Feedback', () => {
  it('detects missing initial state', () => {
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }, false, false),
    ];
    const machine = toMachine(nodes, [], ['0', '1'], 'dfa');
    const val = validateAutomaton(machine);

    expect(val.valid).toBe(false);
    expect(val.errors.some((e) => e.kind === 'NO_INITIAL_STATE')).toBe(true);
  });

  it('detects multiple initial states', () => {
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }, true, false),
      makeNode('q1', 'q1', { x: 100, y: 0 }, true, false),
    ];
    const machine = toMachine(nodes, [], ['0', '1'], 'dfa');
    const val = validateAutomaton(machine);

    expect(val.valid).toBe(false);
    expect(val.errors.some((e) => e.kind === 'MULTIPLE_INITIAL_STATES')).toBe(true);
  });

  it('detects transitions with symbols not in alphabet', () => {
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }, true, false),
    ];
    const edges: Edge<TransitionEdgeData>[] = [
      makeEdge('e0', 'q0', 'q0', 'x'),
    ];
    const machine = toMachine(nodes, edges, ['0', '1'], 'dfa');
    const val = validateAutomaton(machine);

    expect(val.valid).toBe(false);
    const symErr = val.errors.find((e) => e.kind === 'INVALID_SYMBOL');
    expect(symErr).toBeDefined();
    expect(symErr?.symbol).toBe('x');
    expect(symErr?.transitionId).toBe('e0');
  });

  it('flags epsilon transitions in DFA as invalid', () => {
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }, true, false),
      makeNode('q1', 'q1', { x: 100, y: 0 }, false, true),
    ];
    const edges: Edge<TransitionEdgeData>[] = [
      makeEdge('e0', 'q0', 'q1', EPSILON),
    ];
    const machine = toMachine(nodes, edges, ['0', '1'], 'dfa');
    const val = validateAutomaton(machine);

    expect(val.valid).toBe(false);
    expect(val.errors.some((e) => e.kind === 'INVALID_SYMBOL' && e.symbol === EPSILON)).toBe(true);
  });

  it('detects non-determinism in DFA with stateId and symbol attached', () => {
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'q0', { x: 0, y: 0 }, true, false),
      makeNode('q1', 'q1', { x: 100, y: 0 }, false, false),
      makeNode('q2', 'q2', { x: 200, y: 0 }, false, true),
    ];
    const edges: Edge<TransitionEdgeData>[] = [
      makeEdge('e0', 'q0', 'q1', '0'),
      makeEdge('e1', 'q0', 'q2', '0'), // duplicate on '0'
      makeEdge('e2', 'q0', 'q0', '1'),
      makeEdge('e3', 'q1', 'q1', '0, 1'),
      makeEdge('e4', 'q2', 'q2', '0, 1'),
    ];
    const machine = toMachine(nodes, edges, ['0', '1'], 'dfa');
    const val = validateAutomaton(machine);

    expect(val.valid).toBe(false);
    const nondetErr = val.errors.find((e) => e.kind === 'NONDETERMINISM');
    expect(nondetErr).toBeDefined();
    expect(nondetErr?.stateId).toBe('q0');
    expect(nondetErr?.symbol).toBe('0');
  });
});

describe('Playground Machine Builder — Save, Export, and Import Workflow', () => {
  it('serializes and deserializes a custom machine preserving structure and positions', () => {
    const nodes: Node<StateNodeData>[] = [
      makeNode('q0', 'StateA', { x: 50, y: 75 }, true, false),
      makeNode('q1', 'StateB', { x: 220, y: 130 }, false, true),
    ];
    const edges: Edge<TransitionEdgeData>[] = [
      makeEdge('e0', 'q0', 'q1', '0, 1'),
      makeEdge('e1', 'q1', 'q1', '0'),
    ];
    const machine = toMachine(nodes, edges, ['0', '1'], 'dfa');
    const positions: Record<string, { x: number; y: number }> = {
      q0: { x: 50, y: 75 },
      q1: { x: 220, y: 130 },
    };

    const json = serializeProject(machine, 'Custom Test Machine', 'A test automaton', positions);
    const parsed = deserializeProject(json);

    expect(parsed.name).toBe('Custom Test Machine');
    expect(parsed.machine.type).toBe('dfa');
    expect(parsed.machine.states).toHaveLength(2);
    expect(parsed.machine.initialStateId).toBe('q0');
    expect(parsed.machine.acceptingStateIds).toEqual(['q1']);
    expect(parsed.nodePositions?.['q0']).toEqual({ x: 50, y: 75 });
    expect(parsed.nodePositions?.['q1']).toEqual({ x: 220, y: 130 });
  });

  it('throws a helpful error when imported JSON is malformed or invalid', () => {
    expect(() => deserializeProject('{ invalid json ')).toThrow('not valid JSON');
    expect(() => deserializeProject('null')).toThrow('JSON object');
    expect(() => deserializeProject('{"formatVersion": 999}')).toThrow('Unknown project format version');
    expect(() => deserializeProject('{"formatVersion": 1, "name": "Test", "machine": { "type": "unknown" }}')).toThrow('Invalid machine type');
  });

  it('ensures all starter examples in gallery load and simulate cleanly', () => {
    expect(EXAMPLE_GALLERY.length).toBeGreaterThan(0);
    for (const ex of EXAMPLE_GALLERY) {
      expect(ex.machine.states.length).toBeGreaterThan(0);
      expect(ex.machine.alphabet.length).toBeGreaterThan(0);
      expect(ex.machine.initialStateId).toBeTruthy();

      // Test simulation with empty or first symbol
      const res = simulate(ex.machine, ex.machine.alphabet[0] ?? '');
      expect(['accepted', 'rejected']).toContain(res.status);
    }
  });
});
