import { useCallback, useRef } from 'react';
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
import { StateNode } from './StateNode';
import { TransitionEdge } from './TransitionEdge';

const nodeTypes = { stateNode: StateNode };
const edgeTypes = { transitionEdge: TransitionEdge };

interface PlaygroundCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onCanvasDoubleClick: (event: React.MouseEvent, position: { x: number; y: number }) => void;
  onNodeSelect: (node: Node | null) => void;
  onEdgeSelect: (edge: Edge | null) => void;
}

export function PlaygroundCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onCanvasDoubleClick,
  onNodeSelect,
  onEdgeSelect,
}: PlaygroundCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();
  const paneRef = useRef<HTMLDivElement>(null);

  const handlePaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      onCanvasDoubleClick(event, position);
    },
    [screenToFlowPosition, onCanvasDoubleClick],
  );

  return (
    <div ref={paneRef} onDoubleClick={handlePaneDoubleClick} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={() => { onNodeSelect(null); onEdgeSelect(null); }}
        onNodeClick={(_, node) => { onNodeSelect(node); onEdgeSelect(null); }}
        onEdgeClick={(_, edge) => { onEdgeSelect(edge); onNodeSelect(null); }}
        defaultEdgeOptions={{ type: 'transitionEdge', animated: false }}
        connectionLineStyle={{ stroke: '#9ca3af', strokeWidth: 1.5 }}
        fitView
        fitViewOptions={{ padding: 0.5, maxZoom: 1.5 }}
        minZoom={0.2}
        maxZoom={4}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#e5e7eb"
          className="dark:!bg-gray-950"
          style={{ backgroundColor: '#f9fafb' }}
        />
        <Controls className="!shadow-card !rounded-xl !border-gray-100 dark:!border-gray-800" />
        <MiniMap
          nodeColor={(node) => {
            const d = node.data as { isActive?: boolean; isAccepting?: boolean; isInitial?: boolean };
            if (d.isActive) return '#3b82f6';
            if (d.isAccepting) return '#8b5cf6';
            if (d.isInitial) return '#2563eb';
            return '#9ca3af';
          }}
          className="!rounded-xl !border-gray-100 dark:!border-gray-800 !shadow-card"
          maskColor="rgba(0,0,0,0.04)"
        />
      </ReactFlow>
    </div>
  );
}
