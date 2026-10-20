import { AlertCircle, AlertTriangle, CheckCircle2, Locate } from 'lucide-react';
import type { FiniteAutomaton, MachineType, ValidationError } from '@/engine/types';
import { validateAutomaton } from '@/engine/validate';

interface PlaygroundValidationProps {
  machine: FiniteAutomaton;
  machineType: MachineType;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
}

export function PlaygroundValidation({
  machine,
  machineType,
  onSelectNode,
  onSelectEdge,
}: PlaygroundValidationProps) {
  if (machine.states.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
          <Locate className="w-4 h-4" />
        </div>
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          Canvas is empty
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 max-w-xs">
          Start building your automaton by adding states and transitions. Real-time validation checks will appear here.
        </p>
      </div>
    );
  }

  const result = validateAutomaton(machine);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Automaton Validation
        </h3>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          Verifying correctness against {machineType.toUpperCase()} rules
        </p>
      </div>

      {result.valid && result.warnings.length === 0 && (
        <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/80 rounded-xl p-3 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-semibold text-green-800 dark:text-green-300">
              Valid {machineType.toUpperCase()} Machine
            </p>
            <p className="text-[11px] text-green-700 dark:text-green-400">
              All states, alphabet symbols, and transitions satisfy formal {machineType.toUpperCase()} criteria.
            </p>
          </div>
        </div>
      )}

      {result.errors.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
            Errors ({result.errors.length}) — Must Fix
          </p>
          <div className="flex flex-col gap-1.5">
            {result.errors.map((err, i) => (
              <ValidationIssueItem
                key={i}
                issue={err}
                type="error"
                machine={machine}
                onSelectNode={onSelectNode}
                onSelectEdge={onSelectEdge}
              />
            ))}
          </div>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            Warnings ({result.warnings.length}) — Advisory
          </p>
          <div className="flex flex-col gap-1.5">
            {result.warnings.map((warn, i) => (
              <ValidationIssueItem
                key={i}
                issue={warn}
                type="warning"
                machine={machine}
                onSelectNode={onSelectNode}
                onSelectEdge={onSelectEdge}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ValidationIssueItem({
  issue,
  type,
  machine,
  onSelectNode,
  onSelectEdge,
}: {
  issue: ValidationError;
  type: 'error' | 'warning';
  machine: FiniteAutomaton;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
}) {
  const isError = type === 'error';
  const state = issue.stateId ? machine.states.find((s) => s.id === issue.stateId) : null;
  const targetEdgeId = issue.transitionId ? issue.transitionId.split('_')[0] : null;

  return (
    <div
      className={
        isError
          ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl p-2.5 flex flex-col gap-1.5'
          : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-2.5 flex flex-col gap-1.5'
      }
    >
      <div className="flex items-start gap-2">
        {isError ? (
          <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        )}
        <p
          className={
            isError
              ? 'text-xs text-red-800 dark:text-red-200 font-medium leading-relaxed'
              : 'text-xs text-amber-800 dark:text-amber-200 font-medium leading-relaxed'
          }
        >
          {issue.message}
        </p>
      </div>

      {(issue.stateId || targetEdgeId) && (
        <div className="flex items-center gap-2 pl-5">
          {issue.stateId && (
            <button
              onClick={() => onSelectNode(issue.stateId!)}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-600 dark:text-primary-400 bg-white dark:bg-gray-900 border border-primary-200 dark:border-primary-800 rounded px-1.5 py-0.5 hover:bg-primary-50 transition-colors"
            >
              <Locate className="w-2.5 h-2.5" />
              Focus State {state?.label ?? issue.stateId}
            </button>
          )}
          {targetEdgeId && (
            <button
              onClick={() => onSelectEdge(targetEdgeId)}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-600 dark:text-primary-400 bg-white dark:bg-gray-900 border border-primary-200 dark:border-primary-800 rounded px-1.5 py-0.5 hover:bg-primary-50 transition-colors"
            >
              <Locate className="w-2.5 h-2.5" />
              Focus Transition
            </button>
          )}
        </div>
      )}
    </div>
  );
}
