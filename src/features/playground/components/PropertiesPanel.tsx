import { type Node, type Edge } from '@xyflow/react';
import { Trash2, ChevronRight, CornerDownRight, RotateCw } from 'lucide-react';
import { EPSILON } from '@/engine/types';
import type { StateNodeData, TransitionEdgeData } from '@/engine/types';
import { cn } from '@/utils';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  machineType: 'dfa' | 'nfa' | 'enfa';
  alphabet: string[];
  nodes: Node[];
  edges: Edge[];
  onUpdateNodeLabel: (nodeId: string, label: string) => void;
  onToggleInitial: (nodeId: string) => void;
  onToggleAccepting: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateEdgeSymbol: (edgeId: string, symbol: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onSelectNode: (nodeId: string) => void;
}

export function PropertiesPanel({
  selectedNode,
  selectedEdge,
  machineType,
  alphabet,
  nodes,
  edges,
  onUpdateNodeLabel,
  onToggleInitial,
  onToggleAccepting,
  onDeleteNode,
  onUpdateEdgeSymbol,
  onDeleteEdge,
  onSelectNode,
}: PropertiesPanelProps) {
  const nodeData = selectedNode?.data as StateNodeData | undefined;
  const edgeData = selectedEdge?.data as TransitionEdgeData | undefined;

  // ── State properties ────────────────────────────────────────────────────────
  if (selectedNode && nodeData) {
    const outgoing = edges.filter((e) => e.source === selectedNode.id);
    const incoming = edges.filter((e) => e.target === selectedNode.id);

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            State Inspector
          </p>
          <span className="text-[10px] font-mono text-primary-600 dark:text-primary-400 font-bold">
            {nodeData.label}
          </span>
        </div>

        {/* State Label */}
        <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-2.5 flex flex-col gap-1.5 border border-gray-200/50 dark:border-gray-700/50">
          <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
            State Label / Identifier
          </label>
          <input
            type="text"
            value={nodeData.label}
            onChange={(e) => onUpdateNodeLabel(selectedNode.id, e.target.value)}
            maxLength={10}
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-sm font-mono font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Initial and Accepting toggles */}
        <div className="flex flex-col gap-2">
          <ToggleRow
            label="Initial State"
            description="Entry arrow →"
            checked={Boolean(nodeData.isInitial)}
            onChange={() => onToggleInitial(selectedNode.id)}
          />
          <ToggleRow
            label="Accepting State"
            description="Double border ⊚"
            checked={Boolean(nodeData.isAccepting)}
            onChange={() => onToggleAccepting(selectedNode.id)}
          />
        </div>

        {/* Connected transitions summary */}
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5 flex flex-col gap-2 border border-gray-200/50 dark:border-gray-700/50 text-xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Connected Transitions
          </p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
              <span>Outgoing:</span>
              <span className="font-mono font-semibold">{outgoing.length}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
              <span>Incoming:</span>
              <span className="font-mono font-semibold">{incoming.length}</span>
            </div>
          </div>
          {outgoing.length > 0 && (
            <div className="pt-1 flex flex-wrap gap-1 border-t border-gray-200 dark:border-gray-700">
              {outgoing.map((e) => {
                const targetNode = nodes.find((n) => n.id === e.target);
                const targetLabel = (targetNode?.data as StateNodeData)?.label ?? e.target;
                const d = e.data as TransitionEdgeData;
                return (
                  <span
                    key={e.id}
                    onClick={() => onSelectNode(e.target)}
                    className="cursor-pointer text-[10px] font-mono bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 text-gray-700 dark:text-gray-300 hover:border-primary-400 transition-colors"
                  >
                    --({d?.symbol})--&gt; {targetLabel}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={() => onDeleteNode(selectedNode.id)}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/40 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete State
        </button>
      </div>
    );
  }

  // ── Transition properties ───────────────────────────────────────────────────
  if (selectedEdge && edgeData) {
    const sourceNode = nodes.find((n) => n.id === selectedEdge.source);
    const targetNode = nodes.find((n) => n.id === selectedEdge.target);
    const sourceLabel = (sourceNode?.data as StateNodeData)?.label ?? selectedEdge.source;
    const targetLabel = (targetNode?.data as StateNodeData)?.label ?? selectedEdge.target;
    const isSelfLoop = selectedEdge.source === selectedEdge.target;

    const availableSymbols = machineType === 'enfa' ? [...alphabet, EPSILON] : alphabet;
    const currentSymbols = (edgeData.symbol ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const toggleSymbol = (sym: string) => {
      let updated: string[];
      if (currentSymbols.includes(sym)) {
        updated = currentSymbols.filter((s) => s !== sym);
      } else {
        updated = [...currentSymbols, sym];
      }
      onUpdateEdgeSymbol(selectedEdge.id, updated.join(', '));
    };

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Transition Inspector
          </p>
          <span className="text-[10px] font-mono text-primary-600 dark:text-primary-400 font-bold">
            {selectedEdge.id}
          </span>
        </div>

        {/* Source & Target Display */}
        <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-2.5 flex items-center justify-between border border-gray-200/50 dark:border-gray-700/50 text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="font-semibold text-gray-800 dark:text-gray-200">{sourceLabel}</span>
            {isSelfLoop ? (
              <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 text-[11px]">
                <RotateCw className="w-3 h-3" />
                (Self-loop)
              </span>
            ) : (
              <>
                <CornerDownRight className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-semibold text-gray-800 dark:text-gray-200">{targetLabel}</span>
              </>
            )}
          </div>
        </div>

        {/* Symbol Input */}
        <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-2.5 flex flex-col gap-2 border border-gray-200/50 dark:border-gray-700/50">
          <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
            Transition Symbol(s) (comma-separated)
          </label>
          <input
            type="text"
            value={edgeData.symbol}
            onChange={(e) => onUpdateEdgeSymbol(selectedEdge.id, e.target.value)}
            placeholder="e.g. 0, 1"
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-sm font-mono font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

          {/* Quick-toggle pills from alphabet */}
          <div className="flex flex-col gap-1 pt-1">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              Quick Toggle:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {availableSymbols.map((sym) => {
                const isSelected = currentSymbols.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymbol(sym)}
                    className={cn(
                      'px-2 py-1 rounded-lg text-xs font-mono font-semibold transition-colors',
                      isSelected
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                    )}
                  >
                    {sym === EPSILON ? 'ε' : sym}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDeleteEdge(selectedEdge.id)}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/40 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Transition
        </button>
      </div>
    );
  }

  // ── Nothing selected: Quick Reference & Shortcuts ──────────────────────────
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
        Editor Guide & Shortcuts
      </p>

      <div className="flex flex-col gap-2.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <Hint
          icon={<span className="font-mono font-bold text-primary-600 dark:text-primary-400">V</span>}
          text="Select & Move tool"
        />
        <Hint
          icon={<span className="font-mono font-bold text-primary-600 dark:text-primary-400">A</span>}
          text="Add State mode (click canvas)"
        />
        <Hint
          icon={<span className="font-mono font-bold text-primary-600 dark:text-primary-400">C</span>}
          text="Connect States mode"
        />
        <Hint
          icon={<span className="font-mono font-bold text-primary-600 dark:text-primary-400">Del</span>}
          text="Delete selected state or edge"
        />
      </div>

      <div className="flex flex-col gap-2 text-xs text-gray-500 dark:text-gray-400 px-1">
        <Hint
          icon={<ChevronRight className="w-3 h-3 flex-shrink-0 text-primary-500" />}
          text="Double-click canvas to create a state"
        />
        <Hint
          icon={<ChevronRight className="w-3 h-3 flex-shrink-0 text-primary-500" />}
          text="Drag handles or click in Connect mode to draw transitions"
        />
        <Hint
          icon={<ChevronRight className="w-3 h-3 flex-shrink-0 text-primary-500" />}
          text="Self-loops: connect a state to itself"
        />
        <Hint
          icon={<ChevronRight className="w-3 h-3 flex-shrink-0 text-primary-500" />}
          text="Multiple symbols: enter '0, 1' on an edge"
        />
        <Hint
          icon={<ChevronRight className="w-3 h-3 flex-shrink-0 text-primary-500" />}
          text="Check Transition Table tab for matrix view"
        />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors',
        checked
          ? 'bg-primary-50 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
          : 'bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-200 dark:hover:border-gray-700',
      )}
    >
      <span className="font-semibold">{label}</span>
      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
        {checked ? `✓ ${description}` : description}
      </span>
    </button>
  );
}

function Hint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 flex items-center justify-center flex-shrink-0">{icon}</div>
      <span>{text}</span>
    </div>
  );
}
