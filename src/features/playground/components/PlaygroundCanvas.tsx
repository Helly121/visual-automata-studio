import { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, BookOpen, GitFork } from 'lucide-react';
import { StateNode } from './StateNode';
import { TransitionEdge } from './TransitionEdge';
import type { EditorMode } from '../hooks/useAutomataEditor';
import type { StateNodeData } from '@/engine/types';

const nodeTypes = { stateNode: StateNode };
const edgeTypes = { transitionEdge: TransitionEdge };

interface PlaygroundCanvasProps {
  nodes: Node[];
  edges: Edge[];
  editorMode: EditorMode;
  pendingConnectSource: string | null;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onCanvasDoubleClick: (event: React.MouseEvent, position: { x: number; y: number }) => void;
  onCanvasClick: (position: { x: number; y: number }) => void;
  onNodeSelect: (node: Node | null) => void;
  onEdgeSelect: (edge: Edge | null) => void;
  onStateNodeClick: (node: Node) => void;
  onUpdateNodeLabel: (nodeId: string, label: string) => void;
  onAddFirstState: () => void;
  onOpenExamples: () => void;
  onCancelMode: () => void;
}

export function PlaygroundCanvas({
  nodes,
  edges,
  editorMode,
  pendingConnectSource,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onCanvasDoubleClick,
  onCanvasClick,
  onNodeSelect,
  onEdgeSelect,
  onStateNodeClick,
  onUpdateNodeLabel,
  onAddFirstState,
  onOpenExamples,
  onCancelMode,
}: PlaygroundCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();
  const paneRef = useRef<HTMLDivElement>(null);

  // Listen for inline state-rename events
  useEffect(() => {
    const handleRename = (e: Event) => {
      const ce = e as CustomEvent<{ id: string; label: string }>;
      if (ce.detail) {
        onUpdateNodeLabel(ce.detail.id, ce.detail.label);
      }
    };
    window.addEventListener('state-rename', handleRename);
    return () => window.removeEventListener('state-rename', handleRename);
  }, [onUpdateNodeLabel]);

  const handlePaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      onCanvasDoubleClick(event, position);
    },
    [screenToFlowPosition, onCanvasDoubleClick],
  );

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      if (editorMode === 'add-state') {
        onCanvasClick(position);
      } else {
        onNodeSelect(null);
        onEdgeSelect(null);
        if (editorMode === 'connect') {
          onCancelMode();
        }
      }
    },
    [editorMode, screenToFlowPosition, onCanvasClick, onNodeSelect, onEdgeSelect, onCancelMode],
  );

  const pendingSourceNode = nodes.find((n) => n.id === pendingConnectSource);
  const pendingSourceLabel = (pendingSourceNode?.data as StateNodeData)?.label ?? pendingConnectSource;

  return (
    <div
      ref={paneRef}
      onDoubleClick={handlePaneDoubleClick}
      className="w-full h-full relative"
      style={{
        cursor: editorMode === 'add-state' ? 'crosshair' : undefined,
      }}
    >
      {/* Active mode banner */}
      {editorMode === 'add-state' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-primary-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 pointer-events-auto">
          <span>Click canvas to place a state</span>
          <button
            onClick={onCancelMode}
            className="bg-primary-700 hover:bg-primary-800 text-[10px] px-2 py-0.5 rounded-full font-normal transition-colors"
          >
            Esc to finish
          </button>
        </div>
      )}

      {editorMode === 'connect' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-primary-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 pointer-events-auto">
          {!pendingConnectSource ? (
            <span>Click source state to begin transition</span>
          ) : (
            <span>
              Connecting from <strong className="font-mono">{pendingSourceLabel}</strong> → Click target state (or same for self-loop)
            </span>
          )}
          <button
            onClick={onCancelMode}
            className="bg-primary-700 hover:bg-primary-800 text-[10px] px-2 py-0.5 rounded-full font-normal transition-colors"
          >
            Esc
          </button>
        </div>
      )}

      {/* Blank Canvas Welcoming Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 pointer-events-none">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-6 shadow-xl text-center max-w-sm pointer-events-auto">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-950/80 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <GitFork className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1">
              Start Building Your Automaton
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              Add states from scratch using the canvas tools, or load a classic automaton template to explore.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={onAddFirstState}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First State
              </button>
              <button
                onClick={onOpenExamples}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Load Template
              </button>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400 dark:text-gray-500">
              Tip: Double-click anywhere or press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono text-[10px]">A</kbd> to add states.
            </div>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
        onNodeClick={(_, node) => {
          onStateNodeClick(node);
        }}
        onEdgeClick={(_, edge) => {
          onEdgeSelect(edge);
          onNodeSelect(null);
        }}
        defaultEdgeOptions={{ type: 'transitionEdge', animated: false }}
        connectionLineStyle={{ stroke: '#2563eb', strokeWidth: 2 }}
        fitView
        fitViewOptions={{ padding: 0.4, maxZoom: 1.5 }}
        minZoom={0.2}
        maxZoom={3.5}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#cbd5e1"
          className="dark:!bg-gray-950"
          style={{ backgroundColor: '#f8fafc' }}
        />
        <Controls className="!shadow-card !rounded-xl !border-gray-200 dark:!border-gray-800" />
        <MiniMap
          nodeColor={(node) => {
            const d = node.data as { isActive?: boolean; isAccepting?: boolean; isInitial?: boolean };
            if (d.isActive) return '#3b82f6';
            if (d.isAccepting) return '#8b5cf6';
            if (d.isInitial) return '#2563eb';
            return '#9ca3af';
          }}
          className="!rounded-xl !border-gray-200 dark:!border-gray-800 !shadow-card"
          maskColor="rgba(0,0,0,0.04)"
        />
      </ReactFlow>
    </div>
  );
}
