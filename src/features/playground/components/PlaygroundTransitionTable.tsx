import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { cn } from '@/utils';
import { EPSILON, type FiniteAutomaton, type MachineType } from '@/engine/types';

interface PlaygroundTransitionTableProps {
  machine: FiniteAutomaton;
  alphabet: string[];
  machineType: MachineType;
  selectedNodeId: string | null;
  onAddState: () => void;
  onUpdateNodeLabel: (nodeId: string, label: string) => void;
  onToggleInitial: (nodeId: string) => void;
  onToggleAccepting: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onSetTransitions: (fromId: string, symbol: string, toIds: string[]) => void;
  onSelectNode: (nodeId: string) => void;
}

export function PlaygroundTransitionTable({
  machine,
  alphabet,
  machineType,
  selectedNodeId,
  onAddState,
  onUpdateNodeLabel,
  onToggleInitial,
  onToggleAccepting,
  onDeleteNode,
  onSetTransitions,
  onSelectNode,
}: PlaygroundTransitionTableProps) {
  const symbols = machineType === 'enfa' ? [...alphabet, EPSILON] : alphabet;

  if (machine.states.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
          <ArrowRight className="w-5 h-5" />
        </div>
        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
          No states defined yet
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 max-w-xs">
          Add states using the canvas toolbar or click the button below to start building your transition table.
        </p>
        <button
          onClick={onAddState}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add State
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Transition Table (δ)
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            Bidirectional live sync with canvas
          </p>
        </div>
        <button
          onClick={onAddState}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 hover:bg-primary-100 dark:hover:bg-primary-900/60 border border-primary-200 dark:border-primary-800 rounded-lg transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add State
        </button>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-800 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
              <th className="py-2 px-2.5 w-10 text-center" title="Initial State">
                →
              </th>
              <th className="py-2 px-2.5 w-10 text-center" title="Accepting State">
                ∗
              </th>
              <th className="py-2 px-3 min-w-[70px]">State</th>
              {symbols.map((sym) => (
                <th key={sym} className="py-2 px-3 font-mono text-center min-w-[90px]">
                  {sym === EPSILON ? 'ε' : sym}
                </th>
              ))}
              <th className="py-2 px-2 w-8 text-center" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {machine.states.map((st) => {
              const isSelected = selectedNodeId === st.id;
              return (
                <tr
                  key={st.id}
                  onClick={() => onSelectNode(st.id)}
                  className={cn(
                    'transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-primary-50/60 dark:bg-primary-950/30'
                      : 'hover:bg-gray-50/70 dark:hover:bg-gray-800/40',
                  )}
                >
                  {/* Initial state radio */}
                  <td
                    className="py-2 px-2 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleInitial(st.id);
                    }}
                  >
                    <input
                      type="radio"
                      name="initial-state"
                      checked={st.isInitial}
                      onChange={() => onToggleInitial(st.id)}
                      title="Set as initial state"
                      className="accent-primary-600 cursor-pointer"
                    />
                  </td>

                  {/* Accepting state checkbox */}
                  <td
                    className="py-2 px-2 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleAccepting(st.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={st.isAccepting}
                      onChange={() => onToggleAccepting(st.id)}
                      title="Toggle accepting state"
                      className="accent-primary-600 rounded cursor-pointer"
                    />
                  </td>

                  {/* State label input */}
                  <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={st.label}
                      onChange={(e) => onUpdateNodeLabel(st.id, e.target.value)}
                      maxLength={8}
                      className="w-16 px-1.5 py-0.5 font-mono font-semibold text-xs rounded bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:bg-white dark:focus:bg-gray-900 focus:border-primary-500 focus:outline-none"
                    />
                  </td>

                  {/* Transition cells for each symbol */}
                  {symbols.map((sym) => {
                    const targets = machine.transitions
                      .filter((t) => t.from === st.id && t.symbol === sym)
                      .map((t) => t.to);

                    if (machineType === 'dfa') {
                      const currentTarget = targets[0] ?? '';
                      return (
                        <td
                          key={sym}
                          className="py-1.5 px-2 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={currentTarget}
                            onChange={(e) => {
                              const val = e.target.value;
                              onSetTransitions(st.id, sym, val ? [val] : []);
                            }}
                            className={cn(
                              'w-full text-xs font-mono py-1 px-1.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white dark:bg-gray-900',
                              currentTarget
                                ? 'border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 font-semibold'
                                : 'border-gray-200 dark:border-gray-700 text-gray-400',
                            )}
                          >
                            <option value="">— (none)</option>
                            {machine.states.map((dest) => (
                              <option key={dest.id} value={dest.id}>
                                {dest.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    }

                    // NFA & ε-NFA: multi-state toggle pills
                    return (
                      <td
                        key={sym}
                        className="py-1.5 px-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-wrap gap-1 items-center justify-center min-h-[28px]">
                          {machine.states.map((dest) => {
                            const isPresent = targets.includes(dest.id);
                            return (
                              <button
                                key={dest.id}
                                type="button"
                                onClick={() => {
                                  const nextTargets = isPresent
                                    ? targets.filter((id) => id !== dest.id)
                                    : [...targets, dest.id];
                                  onSetTransitions(st.id, sym, nextTargets);
                                }}
                                className={cn(
                                  'text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors',
                                  isPresent
                                    ? 'bg-primary-600 text-white font-semibold shadow-xs'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                                )}
                              >
                                {dest.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}

                  {/* Delete state */}
                  <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onDeleteNode(st.id)}
                      title="Delete state"
                      className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 px-1">
        <span>→: Initial state</span>
        <span>•</span>
        <span>∗: Accepting state</span>
        <span>•</span>
        <span>Click any row to select state on graph</span>
      </div>
    </div>
  );
}
