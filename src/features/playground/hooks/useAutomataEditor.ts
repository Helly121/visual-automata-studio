import { useCallback, useState } from 'react';
import {
  type Node, type Edge,
  addEdge, applyNodeChanges, applyEdgeChanges,
  type NodeChange, type EdgeChange, type Connection,
  MarkerType,
} from '@xyflow/react';
import type {
  StateNodeData,
  TransitionEdgeData,
  FiniteAutomaton,
  FATransition,
  MachineType,
} from '@/engine/types';

export type EditorMode = 'select' | 'add-state' | 'connect';

export function getNextStateId(nodes: Node[]): string {
  const ids = new Set(nodes.map((n) => n.id));
  let i = 0;
  while (ids.has(`q${i}`)) {
    i++;
  }
  return `q${i}`;
}

export function getNextEdgeId(edges: Edge[]): string {
  const ids = new Set(edges.map((e) => e.id));
  let i = 0;
  while (ids.has(`e${i}`) || ids.has(`t${i}`)) {
    i++;
  }
  return `e${i}`;
}

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
      isInitial: Boolean(d.isInitial),
      isAccepting: Boolean(d.isAccepting),
    };
  });

  const initialState = states.find((s) => s.isInitial);
  const acceptingStateIds = states.filter((s) => s.isAccepting).map((s) => s.id);

  const transitions: FATransition[] = [];
  for (const e of edges) {
    const d = e.data as TransitionEdgeData;
    const raw = d?.symbol ?? '';
    // Support comma-separated or space-separated symbols (e.g. "0, 1" or "a, b")
    const parts = raw.includes(',')
      ? raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
      : [raw.trim()];

    if (parts.length === 0) {
      transitions.push({
        id: e.id,
        from: e.source,
        to: e.target,
        symbol: raw,
      });
    } else {
      parts.forEach((sym, idx) => {
        transitions.push({
          id: idx === 0 ? e.id : `${e.id}_${idx}`,
          from: e.source,
          to: e.target,
          symbol: sym,
        });
      });
    }
  }

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
export function makeNode(
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

export function makeEdge(
  id: string,
  source: string,
  target: string,
  symbol: string,
): Edge<TransitionEdgeData> {
  return {
    id,
    source,
    target,
    type: 'transitionEdge',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 14,
      height: 14,
    },
    data: { symbol, isActive: false },
  };
}

export interface UseAutomataEditorReturn {
  nodes: Node[];
  edges: Edge[];
  machineType: MachineType;
  alphabet: string[];
  projectName: string;
  editorMode: EditorMode;
  pendingConnectSource: string | null;
  setEditorMode: (mode: EditorMode) => void;
  setPendingConnectSource: (id: string | null) => void;
  setProjectName: (name: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  connectStates: (sourceId: string, targetId: string, symbol?: string) => string;
  addState: (position?: { x: number; y: number }, label?: string) => Node;
  onCanvasDoubleClick: (event: React.MouseEvent, position: { x: number; y: number }) => void;
  setMachineType: (t: MachineType) => void;
  setAlphabet: (a: string[]) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  toggleInitial: (nodeId: string) => void;
  toggleAccepting: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  updateEdgeSymbol: (edgeId: string, symbol: string) => void;
  deleteEdge: (edgeId: string) => void;
  setTransitionsForStateAndSymbol: (fromId: string, symbol: string, toIds: string[]) => void;
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
  const [editorMode, setEditorMode] = useState<EditorMode>('select');
  const [pendingConnectSource, setPendingConnectSource] = useState<string | null>(null);

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
    if (!connection.source || !connection.target) return;
    const defaultSymbol = alphabet[0] ?? '0';
    const newEdge = makeEdge(getNextEdgeId(edges), connection.source, connection.target, defaultSymbol);
    setEdges((prev) => {
      const next = addEdge({ ...newEdge, type: 'transitionEdge' } as Edge, prev);
      pushHistory(nodes, next);
      return next;
    });
  }, [alphabet, edges, nodes, pushHistory]);

  const connectStates = useCallback(
    (sourceId: string, targetId: string, symbol?: string): string => {
      const sym = symbol ?? alphabet[0] ?? '0';
      const existingEdge = edges.find((e) => e.source === sourceId && e.target === targetId);
      if (existingEdge) {
        const d = existingEdge.data as TransitionEdgeData | undefined;
        const existingSyms = (d?.symbol ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (!existingSyms.includes(sym)) {
          const nextSymbol = [...existingSyms, sym].join(', ');
          const nextEdges = edges.map((e) =>
            e.id === existingEdge.id ? { ...e, data: { ...e.data, symbol: nextSymbol } } : e,
          );
          setEdges(nextEdges);
          pushHistory(nodes, nextEdges);
        }
        return existingEdge.id;
      }
      const newEdge = makeEdge(getNextEdgeId(edges), sourceId, targetId, sym);
      setEdges((prev) => {
        const next = [...prev, newEdge];
        pushHistory(nodes, next);
        return next;
      });
      return newEdge.id;
    },
    [alphabet, edges, nodes, pushHistory],
  );

  const addState = useCallback(
    (position?: { x: number; y: number }, label?: string): Node => {
      const id = getNextStateId(nodes);
      const isFirst = nodes.length === 0;
      const pos = position ?? {
        x: 120 + (nodes.length % 5) * 110,
        y: 120 + Math.floor(nodes.length / 5) * 100,
      };
      const newNode = makeNode(id, label ?? id, pos, isFirst, false);
      setNodes((prev) => {
        const next = [...prev, newNode];
        pushHistory(next, edges);
        return next;
      });
      return newNode;
    },
    [nodes, edges, pushHistory],
  );

  const onCanvasDoubleClick = useCallback(
    (_event: React.MouseEvent, position: { x: number; y: number }) => {
      addState(position);
    },
    [addState],
  );

  const setAlphabet = useCallback((a: string[]) => {
    setAlphabetState(a);
  }, []);

  const updateNodeLabel = useCallback((nodeId: string, label: string) => {
    setNodes((prev) => {
      const next = prev.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, label } } : n,
      );
      pushHistory(next, edges);
      return next;
    });
  }, [edges, pushHistory]);

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
    setEdges((prev) => {
      const next = prev.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, symbol } } : e,
      );
      pushHistory(nodes, next);
      return next;
    });
  }, [nodes, pushHistory]);

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges((prev) => {
      const next = prev.filter((e) => e.id !== edgeId);
      pushHistory(nodes, next);
      return next;
    });
  }, [nodes, pushHistory]);

  const setTransitionsForStateAndSymbol = useCallback(
    (fromId: string, symbol: string, toIds: string[]) => {
      setEdges((prevEdges) => {
        let nextEdges: Edge[] = [];
        for (const e of prevEdges) {
          if (e.source === fromId) {
            const d = e.data as TransitionEdgeData;
            const symbols = (d?.symbol ?? '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            const remaining = symbols.filter((s) => s !== symbol);

            if (toIds.includes(e.target)) {
              // Ensure symbol is retained on target
              const merged = symbols.includes(symbol) ? symbols : [...symbols, symbol];
              nextEdges.push({
                ...e,
                data: { ...e.data, symbol: merged.join(', ') },
              });
            } else if (remaining.length > 0) {
              // Target is no longer in toIds, but edge had other symbols
              nextEdges.push({
                ...e,
                data: { ...e.data, symbol: remaining.join(', ') },
              });
            }
            // else: target no longer in toIds and symbol was only symbol -> omitted/deleted
          } else {
            nextEdges.push(e);
          }
        }

        // Add any missing edges for targets in toIds
        for (const targetId of toIds) {
          const exists = nextEdges.some((e) => e.source === fromId && e.target === targetId);
          if (!exists) {
            const newEdge = makeEdge(getNextEdgeId(nextEdges), fromId, targetId, symbol);
            nextEdges.push(newEdge);
          }
        }

        pushHistory(nodes, nextEdges);
        return nextEdges;
      });
    },
    [nodes, pushHistory],
  );

  const loadExample = useCallback(
    (
      exNodes: Node[],
      exEdges: Edge[],
      type: MachineType,
      alpha: string[],
      name?: string,
    ) => {
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
    setPendingConnectSource(null);
    pushHistory([], []);
  }, [pushHistory]);

  const highlightSimStep = useCallback(
    (activeStateIds: string[], traversedTransitionIds: string[]) => {
      const activeSet = new Set(activeStateIds);
      const traversedBaseIds = new Set(traversedTransitionIds.map((id) => id.split('_')[0]));
      setNodes((prev) =>
        prev.map((n) => ({ ...n, data: { ...n.data, isActive: activeSet.has(n.id) } })),
      );
      setEdges((prev) =>
        prev.map((e) => ({ ...e, data: { ...e.data, isActive: traversedBaseIds.has(e.id) } })),
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
    editorMode,
    pendingConnectSource,
    setEditorMode,
    setPendingConnectSource,
    setProjectName,
    onNodesChange,
    onEdgesChange,
    onConnect,
    connectStates,
    addState,
    onCanvasDoubleClick,
    setMachineType,
    setAlphabet,
    updateNodeLabel,
    toggleInitial,
    toggleAccepting,
    deleteNode,
    updateEdgeSymbol,
    deleteEdge,
    setTransitionsForStateAndSymbol,
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
