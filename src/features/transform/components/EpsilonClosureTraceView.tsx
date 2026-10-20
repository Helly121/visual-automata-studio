import { RefreshCw, CheckCircle2, Cpu } from 'lucide-react';
import type { StateEpsilonTrace } from '@/engine/transform/types';
import type { FAState } from '@/engine/types';
import { cn } from '@/utils';

interface EpsilonClosureTraceViewProps {
  states: FAState[];
  traces?: Record<string, StateEpsilonTrace>;
  activeStateId?: string;
  className?: string;
}

export function EpsilonClosureTraceView({
  states,
  traces = {},
  activeStateId,
  className,
}: EpsilonClosureTraceViewProps) {
  const stateLabels = new Map(states.map((s) => [s.id, s.label]));

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card p-4 flex flex-col gap-3',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            Epsilon-Closure Mapping
          </h4>
        </div>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          ε-closure(q) = {'{'} p | q --ε*--&gt; p {'}'}
        </span>
      </div>

      {/* Grid of states and their calculated closures */}
      <div className="space-y-2">
        {states.map((s) => {
          const trace = traces[s.id];
          const isActive = activeStateId === s.id;
          const closureLabels = trace
            ? trace.closureStateIds.map((id) => stateLabels.get(id) ?? id).join(', ')
            : '—';

          return (
            <div
              key={s.id}
              className={cn(
                'p-2.5 rounded-xl border text-xs font-mono transition-all flex items-center justify-between gap-3',
                isActive
                  ? 'bg-primary-50/70 dark:bg-primary-950/40 border-primary-300 dark:border-primary-700 ring-1 ring-primary-500'
                  : 'bg-gray-50/60 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary-700 dark:text-primary-300 w-12">
                  ε({s.label}) =
                </span>
                <span className="text-gray-800 dark:text-gray-200 font-semibold">
                  {'{ '}
                  {closureLabels}
                  {' }'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-sans">
                {trace?.hasCycle && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                    <RefreshCw className="w-2.5 h-2.5" /> Cycle detected
                  </span>
                )}
                {trace && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Resolved
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
