import { useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { StateNode } from '@/features/playground/components/StateNode';
import { TransitionEdge } from '@/features/playground/components/TransitionEdge';
import { layoutAutomatonGraph } from '@/engine/transform/layout';
import type { FiniteAutomaton, StateNodeData, TransitionEdgeData } from '@/engine/types';
import { cn } from '@/utils';

const nodeTypes = { stateNode: StateNode };
const edgeTypes = { transitionEdge: TransitionEdge };

interface AutomatonGraphViewerProps {
  machine: FiniteAutomaton;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  highlightStateIds?: string[];
  highlightTransitionIds?: string[];
  customPositions?: Record<string, { x: number; y: number }>;
  emptyMessage?: string;
  className?: string;
}

function InnerGraphViewer({
  machine,
  title,
  subtitle,
  badge,
  highlightStateIds = [],
  highlightTransitionIds = [],
  customPositions,
  emptyMessage = 'No states to display',
  className,
}: AutomatonGraphViewerProps) {
  const { fitView } = useReactFlow();
  const highlightStateSet = useMemo(() => new Set(highlightStateIds), [highlightStateIds]);
  const highlightTransitionSet = useMemo(
    () => new Set(highlightTransitionIds),
    [highlightTransitionIds],
  );

  // Compute node positions using layout algorithm if not provided
  const positions = useMemo(() => {
    return customPositions ?? layoutAutomatonGraph(machine);
  }, [machine, customPositions]);

  // Convert FA states to React Flow nodes
  const nodes: Node<StateNodeData>[] = useMemo(() => {
    return machine.states.map((s) => {
      const pos = positions[s.id] ?? { x: 100, y: 100 };
      const isActive = highlightStateSet.has(s.id);

      return {
        id: s.id,
        type: 'stateNode',
        position: pos,
        data: {
          label: s.label,
          isInitial: s.isInitial,
          isAccepting: s.isAccepting,
          isActive,
          isTraversed: false,
        },
      };
    });
  }, [machine.states, positions, highlightStateSet]);

  // Convert FA transitions to React Flow edges, grouping multi-symbol edges
  const edges: Edge<TransitionEdgeData>[] = useMemo(() => {
    // Group transitions by from -> to
    const grouped = new Map<
      string,
      { id: string; from: string; to: string; symbols: string[]; isActive: boolean }
    >();

    machine.transitions.forEach((t) => {
      const key = `${t.from}->${t.to}`;
      const isAct = highlightTransitionSet.has(t.id);

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: t.id,
          from: t.from,
          to: t.to,
          symbols: [t.symbol],
          isActive: isAct,
        });
      } else {
        const item = grouped.get(key)!;
        if (!item.symbols.includes(t.symbol)) {
          item.symbols.push(t.symbol);
        }
        if (isAct) item.isActive = true;
      }
    });

    return Array.from(grouped.values()).map((g) => ({
      id: g.id,
      source: g.from,
      target: g.to,
      type: 'transitionEdge',
      data: {
        symbol: g.symbols.join(', '),
        isActive: g.isActive,
      },
    }));
  }, [machine.transitions, highlightTransitionSet]);

  // Refit view on machine change
  const initialFitDone = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.3, duration: 400 });
      initialFitDone.current = true;
    }, 50);
    return () => clearTimeout(timer);
  }, [machine.states.length, fitView]);

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden relative',
        className,
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 shrink-0 z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
            |Q| = {machine.states.length} · |δ| = {machine.transitions.length}
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-[260px] relative">
        {machine.states.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            fitView
            fitViewOptions={{ padding: 0.35, maxZoom: 1.5 }}
            minZoom={0.2}
            maxZoom={2.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#cbd5e1"
              className="dark:!bg-gray-950"
              style={{ backgroundColor: '#fcfcfd' }}
            />
            <Controls
              showInteractive={false}
              className="!shadow-sm !rounded-lg !border-gray-100 dark:!border-gray-800"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}

export function AutomatonGraphViewer(props: AutomatonGraphViewerProps) {
  return (
    <ReactFlowProvider>
      <InnerGraphViewer {...props} />
    </ReactFlowProvider>
  );
}
