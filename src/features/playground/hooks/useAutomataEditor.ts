import { useCallback, useState } from 'react';
import {
  type Node, type Edge,
  addEdge, applyNodeChanges, applyEdgeChanges,
  type NodeChange, type EdgeChange, type Connection,
} from '@xyflow/react';
import type { StateNodeData, TransitionEdgeData, FiniteAutomaton, MachineType } from '@/engine/types';

let nodeCounter = 0;
let edgeCounter = 0;

function newStateId() { return `q${nodeCounter++}`; }
function newEdgeId() { return `t${edgeCounter++}`; }

/** Convert React Flow nodes/edges to a FiniteAutomaton for the engine. */
export function toMachine(
  nodes: Node[],
  edges: Edge[],
  alphabet: string[],
  machineType: MachineType,
): FiniteAutomaton {
  const states = nodes.map((n) => {
    const d = n.data as StateNodeData;
    return {
      id: n.id,
      label: d.label,
      isInitial: d.isInitial,
      isAccepting: d.isAccepting,
    };
  });

  const initialState = states.find((s) => s.isInitial);
  const acceptingStateIds = states.filter((s) => s.isAccepting).map((s) => s.id);

  const transitions = edges.map((e) => {
    const d = e.data as TransitionEdgeData;
    return {
      id: e.id,
      from: e.source,
      to: e.target,
      symbol: d.symbol,
    };
  });

  return {
    type: machineType,
    states,
    alphabet,
    transitions,
    initialStateId: initialState?.id ?? null,
    acceptingStateIds,
  };
}

/** Create RF nodes from saved positions and state data. */
function makeNode(
  id: string,
  label: string,
  position: { x: number; y: number },
  isInitial = false,
  isAccepting = false,
): Node<StateNodeData> {
  return {
    id,
    type: 'stateNode',
    position,
    data: {
      label,
      isInitial,
      isAccepting,
      isActive: false,
      isTraversed: false,
    },
  };
}

function makeEdge(id: string, source: string, target: string, symbol: string): Edge<TransitionEdgeData> {
  return {
    id,
    source,
    target,
    type: 'transitionEdge',
    data: { symbol, isActive: false },
  };
}

export interface UseAutomataEditorReturn {
  nodes: Node[];
  edges: Edge[];
  machineType: MachineType;
  alphabet: string[];
  projectName: string;
  setProjectName: (name: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onCanvasDoubleClick: (event: React.MouseEvent, position: { x: number; y: number }) => void;
  setMachineType: (t: MachineType) => void;
  setAlphabet: (a: string[]) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  toggleInitial: (nodeId: string) => void;
  toggleAccepting: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  updateEdgeSymbol: (edgeId: string, symbol: string) => void;
  deleteEdge: (edgeId: string) => void;
  loadExample: (exNodes: Node[], exEdges: Edge[], type: MachineType, alpha: string[], name?: string) => void;
  clearCanvas: () => void;
  highlightSimStep: (activeStateIds: string[], traversedTransitionIds: string[]) => void;
  clearHighlights: () => void;
  machine: FiniteAutomaton;
  // undo/redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

type HistoryEntry = { nodes: Node[]; edges: Edge[] };

export function useAutomataEditor(): UseAutomataEditorReturn {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [machineType, setMachineType] = useState<MachineType>('dfa');
  const [alphabet, setAlphabetState] = useState<string[]>(['0', '1']);
  const [projectName, setProjectName] = useState('Untitled Automaton');

  // Undo/redo history (store snapshots of nodes + edges)
  const [history, setHistory] = useState<HistoryEntry[]>([{ nodes: [], edges: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = useCallback((ns: Node[], es: Edge[]) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, { nodes: ns, edges: es }].slice(-50); // cap at 50
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setHistoryIndex((i) => i - 1);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    setNodes(next.nodes);
    setEdges(next.edges);
    setHistoryIndex((i) => i + 1);
  }, [history, historyIndex]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((prev) => applyNodeChanges(changes, prev));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((prev) => applyEdgeChanges(changes, prev));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    const defaultSymbol = alphabet[0] ?? '0';
    const newEdge = makeEdge(newEdgeId(), connection.source, connection.target, defaultSymbol);
    setEdges((prev) => {
      const next = addEdge({ ...newEdge, type: 'transitionEdge' } as Edge, prev);
      pushHistory(nodes, next);
      return next;
    });
  }, [alphabet, nodes, pushHistory]);

  const onCanvasDoubleClick = useCallback(
    (_event: React.MouseEvent, position: { x: number; y: number }) => {
      const id = newStateId();
      const isFirst = nodes.length === 0;
      const newNode = makeNode(id, id, position, isFirst, false);
      setNodes((prev) => {
        const next = [...prev, newNode];
        pushHistory(next, edges);
        return next;
      });
    },
    [nodes, edges, pushHistory],
  );

  const setAlphabet = useCallback((a: string[]) => {
    setAlphabetState(a);
  }, []);

  const updateNodeLabel = useCallback((nodeId: string, label: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, label } } : n,
      ),
    );
  }, []);

  const toggleInitial = useCallback((nodeId: string) => {
    setNodes((prev) => {
      const next = prev.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isInitial: n.id === nodeId ? !(n.data as StateNodeData).isInitial : false,
        },
      }));
      pushHistory(next, edges);
      return next;
    });
  }, [edges, pushHistory]);

  const toggleAccepting = useCallback((nodeId: string) => {
    setNodes((prev) => {
      const next = prev.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, isAccepting: !(n.data as StateNodeData).isAccepting } }
          : n,
      );
      pushHistory(next, edges);
      return next;
    });
  }, [edges, pushHistory]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((prev) => {
      const nextNodes = prev.filter((n) => n.id !== nodeId);
      setEdges((prevEdges) => {
        const nextEdges = prevEdges.filter((e) => e.source !== nodeId && e.target !== nodeId);
        pushHistory(nextNodes, nextEdges);
        return nextEdges;
      });
      return nextNodes;
    });
  }, [pushHistory]);

  const updateEdgeSymbol = useCallback((edgeId: string, symbol: string) => {
    setEdges((prev) =>
      prev.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, symbol } } : e,
      ),
    );
  }, []);

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges((prev) => {
      const next = prev.filter((e) => e.id !== edgeId);
      pushHistory(nodes, next);
      return next;
    });
  }, [nodes, pushHistory]);

  const loadExample = useCallback(
    (
      exNodes: Node[],
      exEdges: Edge[],
      type: MachineType,
      alpha: string[],
      name?: string,
    ) => {
      // Reset counters so ids don't clash
      nodeCounter = exNodes.length;
      edgeCounter = exEdges.length;
      setNodes(exNodes);
      setEdges(exEdges);
      setMachineType(type);
      setAlphabetState(alpha);
      if (name) setProjectName(name);
      pushHistory(exNodes, exEdges);
    },
    [pushHistory],
  );

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    nodeCounter = 0;
    edgeCounter = 0;
    pushHistory([], []);
  }, [pushHistory]);

  const highlightSimStep = useCallback(
    (activeStateIds: string[], traversedTransitionIds: string[]) => {
      const activeSet = new Set(activeStateIds);
      const traversedSet = new Set(traversedTransitionIds);
      setNodes((prev) =>
        prev.map((n) => ({ ...n, data: { ...n.data, isActive: activeSet.has(n.id) } })),
      );
      setEdges((prev) =>
        prev.map((e) => ({ ...e, data: { ...e.data, isActive: traversedSet.has(e.id) } })),
      );
    },
    [],
  );

  const clearHighlights = useCallback(() => {
    setNodes((prev) => prev.map((n) => ({ ...n, data: { ...n.data, isActive: false } })));
    setEdges((prev) => prev.map((e) => ({ ...e, data: { ...e.data, isActive: false } })));
  }, []);

  const machine = toMachine(nodes, edges, alphabet, machineType);

  return {
    nodes,
    edges,
    machineType,
    alphabet,
    projectName,
    setProjectName,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onCanvasDoubleClick,
    setMachineType,
    setAlphabet,
    updateNodeLabel,
    toggleInitial,
    toggleAccepting,
    deleteNode,
    updateEdgeSymbol,
    deleteEdge,
    loadExample,
    clearCanvas,
    highlightSimStep,
    clearHighlights,
    machine,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    undo,
    redo,
  };
}
