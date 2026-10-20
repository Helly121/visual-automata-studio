import { Table as TableIcon, GitMerge, CheckCircle2 } from 'lucide-react';
import type { TableFillingCell, EquivalenceClass } from '@/engine/transform/types';
import type { FAState } from '@/engine/types';
import { cn } from '@/utils';

interface DistinguishabilityGridProps {
  states: FAState[];
  cells: TableFillingCell[];
  classes?: EquivalenceClass[];
  activePair?: [string, string];
  className?: string;
}

export function DistinguishabilityGrid({
  states,
  cells,
  classes = [],
  activePair,
  className,
}: DistinguishabilityGridProps) {
  if (states.length <= 1 || cells.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">
        Distinguishability table will appear once minimization starts.
      </div>
    );
  }

  // Lookup map for fast cell retrieval: "sRow::sCol"
  const cellMap = new Map<string, TableFillingCell>();
  cells.forEach((c) => {
    cellMap.set(`${c.state1}::${c.state2}`, c);
    cellMap.set(`${c.state2}::${c.state1}`, c);
  });

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card p-4 flex flex-col gap-3',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TableIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            Triangular Distinguishability Matrix
          </h4>
        </div>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          Table-Filling (Myhill-Nerode)
        </span>
      </div>

      {/* Triangular Grid */}
      <div className="overflow-x-auto -mx-4 px-4 py-1">
        <table className="border-collapse text-xs font-mono">
          <thead>
            <tr>
              <th className="p-1 text-center font-bold text-gray-400 text-[10px] w-12 border-b border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                State
              </th>
              {states.slice(0, states.length - 1).map((s) => (
                <th
                  key={s.id}
                  className="p-1 text-center font-bold text-gray-700 dark:text-gray-300 min-w-16 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800"
                >
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {states.slice(1).map((sRow, rIdx) => {
              const rowIndex = rIdx + 1; // 1-indexed relative to states

              return (
                <tr key={sRow.id}>
                  {/* Row header */}
                  <th className="p-1.5 text-center font-bold text-gray-700 dark:text-gray-300 border-r border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 whitespace-nowrap">
                    {sRow.label}
                  </th>

                  {/* Columns */}
                  {states.slice(0, states.length - 1).map((sCol, colIndex) => {
                    if (colIndex >= rowIndex) {
                      // Diagonal / above diagonal is empty in triangular table
                      return (
                        <td
                          key={sCol.id}
                          className="p-1 border border-gray-100 dark:border-gray-800/40 bg-gray-100/30 dark:bg-gray-800/10"
                        />
                      );
                    }

                    const cell = cellMap.get(`${sRow.id}::${sCol.id}`);
                    const isActivePair =
                      activePair &&
                      ((activePair[0] === sRow.id && activePair[1] === sCol.id) ||
                        (activePair[0] === sCol.id && activePair[1] === sRow.id));

                    if (!cell) {
                      return (
                        <td
                          key={sCol.id}
                          className="p-1 text-center border border-gray-100 dark:border-gray-800 text-gray-300"
                        >
                          —
                        </td>
                      );
                    }

                    let cellBg = 'bg-white dark:bg-gray-900 text-gray-300';
                    let cellText = '—';

                    if (cell.isEquivalent) {
                      cellBg =
                        'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border-emerald-300';
                      cellText = '≡ EQUIV';
                    } else if (cell.marked) {
                      if (cell.pass === 0) {
                        cellBg =
                          'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold';
                        cellText = 'X₀ (ε)';
                      } else {
                        cellBg =
                          'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold';
                        cellText = `X${cell.pass ?? 1} (${cell.witness ?? ''})`;
                      }
                    }

                    return (
                      <td
                        key={sCol.id}
                        title={cell.reason ?? ''}
                        className={cn(
                          'p-1.5 text-center text-[10px] border border-gray-100 dark:border-gray-800 transition-all cursor-default select-none whitespace-nowrap',
                          cellBg,
                          isActivePair && 'ring-2 ring-primary-500 z-10 scale-105',
                        )}
                      >
                        {cellText}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Equivalence Classes Summary Card */}
      {classes.length > 0 && (
        <div className="mt-1 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5 mb-2">
            <GitMerge className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            <span className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Equivalence Classes (Quotient States)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {classes.map((cls) => {
              const isMerged = cls.memberStateIds.length > 1;

              return (
                <div
                  key={cls.id}
                  className={cn(
                    'px-2.5 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5',
                    isMerged
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
                  )}
                >
                  <span className="font-bold text-primary-600 dark:text-primary-400">
                    {cls.label}
                  </span>
                  {cls.isAccepting && (
                    <span className="text-[10px] text-emerald-600 font-sans font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> F
                    </span>
                  )}
                  {cls.isInitial && (
                    <span className="text-[10px] text-blue-600 font-sans font-semibold">
                      (start)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
