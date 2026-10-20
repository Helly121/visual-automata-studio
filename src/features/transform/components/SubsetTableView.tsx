import { CheckCircle2, Layers } from 'lucide-react';
import type { SubsetTableRow } from '@/engine/transform/types';
import { cn } from '@/utils';

interface SubsetTableViewProps {
  rows: SubsetTableRow[];
  alphabet: string[];
  activeSubsetId?: string;
  activeSymbol?: string;
  className?: string;
}

export function SubsetTableView({
  rows,
  alphabet,
  activeSubsetId,
  activeSymbol,
  className,
}: SubsetTableViewProps) {
  if (rows.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">
        Subset construction table will populate as steps progress.
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card p-4 overflow-hidden flex flex-col',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            Subset Construction Table
          </h4>
        </div>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          {rows.length} DFA {rows.length === 1 ? 'state' : 'states'} discovered
        </span>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
              <th className="py-2 px-3">DFA State</th>
              <th className="py-2 px-3">NFA Subset</th>
              <th className="py-2 px-3 text-center">Accepting?</th>
              {alphabet.map((sym) => (
                <th
                  key={sym}
                  className={cn(
                    'py-2 px-3 text-center transition-colors',
                    activeSymbol === sym &&
                      'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-bold',
                  )}
                >
                  δ(S, {sym})
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => {
              const isActiveRow = activeSubsetId === row.dfaStateId;

              return (
                <tr
                  key={row.dfaStateId}
                  className={cn(
                    'transition-colors',
                    isActiveRow
                      ? 'bg-primary-50/60 dark:bg-primary-950/30'
                      : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30',
                  )}
                >
                  {/* DFA State */}
                  <td className="py-2 px-3 font-bold text-primary-700 dark:text-primary-300 whitespace-nowrap">
                    {row.dfaLabel.split(' ')[0]}
                    {row.isInitial && (
                      <span className="ml-1 text-[10px] text-gray-400 font-normal">
                        (start)
                      </span>
                    )}
                  </td>

                  {/* NFA Subset */}
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {row.dfaLabel.includes('{')
                      ? row.dfaLabel.substring(row.dfaLabel.indexOf('{'))
                      : row.dfaLabel}
                  </td>

                  {/* Accepting? */}
                  <td className="py-2 px-3 text-center whitespace-nowrap">
                    {row.isAccepting ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Yes
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">No</span>
                    )}
                  </td>

                  {/* Transitions */}
                  {alphabet.map((sym) => {
                    const trans = row.transitions[sym];
                    const isCellActive = isActiveRow && activeSymbol === sym;

                    if (!trans) {
                      return (
                        <td
                          key={sym}
                          className={cn(
                            'py-2 px-3 text-center text-gray-300 dark:text-gray-600',
                            isCellActive && 'bg-primary-100/50 dark:bg-primary-900/50',
                          )}
                        >
                          —
                        </td>
                      );
                    }

                    return (
                      <td
                        key={sym}
                        className={cn(
                          'py-2 px-3 text-center font-mono whitespace-nowrap text-[11px]',
                          isCellActive &&
                            'bg-primary-100/60 dark:bg-primary-900/60 text-primary-800 dark:text-primary-200 font-bold',
                        )}
                      >
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded',
                            trans.isEmpty
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                              : 'text-primary-700 dark:text-primary-300',
                          )}
                        >
                          {trans.targetLabel.split(' ')[0]}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
