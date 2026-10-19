import { type Node, type Edge } from '@xyflow/react';
import { Trash2, Star, ChevronRight } from 'lucide-react';
import { EPSILON } from '@/engine/types';
import type { StateNodeData, TransitionEdgeData } from '@/engine/types';
import { cn } from '@/utils';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  machineType: 'dfa' | 'nfa' | 'enfa';
  onUpdateNodeLabel: (nodeId: string, label: string) => void;
  onToggleInitial: (nodeId: string) => void;
  onToggleAccepting: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateEdgeSymbol: (edgeId: string, symbol: string) => void;
  onDeleteEdge: (edgeId: string) => void;
}

export function PropertiesPanel({
  selectedNode,
  selectedEdge,
  machineType,
  onUpdateNodeLabel,
  onToggleInitial,
  onToggleAccepting,
  onDeleteNode,
  onUpdateEdgeSymbol,
  onDeleteEdge,
}: PropertiesPanelProps) {
  const nodeData = selectedNode?.data as StateNodeData | undefined;
  const edgeData = selectedEdge?.data as TransitionEdgeData | undefined;

  // ── State properties ────────────────────────────────────────────────────────
  if (selectedNode && nodeData) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
          State Properties
        </p>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 flex flex-col gap-2">
          <label className="text-[10px] text-gray-400 dark:text-gray-500">Label</label>
          <input
            type="text"
            value={nodeData.label}
            onChange={(e) => onUpdateNodeLabel(selectedNode.id, e.target.value)}
            maxLength={8}
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <ToggleRow
            label="Initial state"
            description="Entry arrow"
            checked={nodeData.isInitial}
            onChange={() => onToggleInitial(selectedNode.id)}
          />
          <ToggleRow
            label="Accepting state"
            description="Double border"
            checked={nodeData.isAccepting}
            onChange={() => onToggleAccepting(selectedNode.id)}
          />
        </div>

        <button
          onClick={() => onDeleteNode(selectedNode.id)}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 rounded-xl bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete state
        </button>
      </div>
    );
  }

  // ── Transition properties ───────────────────────────────────────────────────
  if (selectedEdge && edgeData) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
          Transition Properties
        </p>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 flex flex-col gap-2">
          <label className="text-[10px] text-gray-400 dark:text-gray-500">Symbol</label>
          <input
            type="text"
            value={edgeData.symbol}
            onChange={(e) => onUpdateEdgeSymbol(selectedEdge.id, e.target.value.slice(-1) || '0')}
            maxLength={1}
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {machineType === 'enfa' && (
            <button
              onClick={() => onUpdateEdgeSymbol(selectedEdge.id, EPSILON)}
              className="text-[10px] text-primary-600 dark:text-primary-400 hover:underline text-left"
            >
              Set as ε (epsilon)
            </button>
          )}
        </div>

        <button
          onClick={() => onDeleteEdge(selectedEdge.id)}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 rounded-xl bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete transition
        </button>
      </div>
    );
  }

  // ── Nothing selected ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
        Properties
      </p>
      <div className="flex flex-col gap-2 text-xs text-gray-400 dark:text-gray-500">
        <Hint icon={<ChevronRight className="w-3 h-3 flex-shrink-0" />} text="Double-click canvas to add a state" />
        <Hint icon={<ChevronRight className="w-3 h-3 flex-shrink-0" />} text="Drag from state edge to connect" />
        <Hint icon={<ChevronRight className="w-3 h-3 flex-shrink-0" />} text="Click state or transition to edit" />
        <Hint icon={<Star className="w-3 h-3 flex-shrink-0 text-amber-400" />} text="Double-click state label to rename" />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: { label: string; description: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        'flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors',
        checked
          ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-200 dark:hover:border-gray-700',
      )}
    >
      <span>{label}</span>
      <span className="text-[10px] text-gray-400 dark:text-gray-500">{checked ? `✓ ${description}` : description}</span>
    </button>
  );
}

function Hint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-1.5">
      {icon}
      <span>{text}</span>
    </div>
  );
}
