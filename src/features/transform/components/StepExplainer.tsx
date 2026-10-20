import { Sparkles } from 'lucide-react';
import type { TransformationStep } from '@/engine/transform/types';
import { Badge } from '@/components/ui';

interface StepExplainerProps {
  step: TransformationStep;
  currentStepIndex: number;
  totalSteps: number;
}

const phaseBadgeColors: Record<
  string,
  'blue' | 'purple' | 'green' | 'orange' | 'red' | 'gray'
> = {
  init: 'blue',
  'subset-expand': 'purple',
  'prune-unreachable': 'orange',
  'complete-transitions': 'gray',
  'base-distinguish': 'red',
  'inductive-step': 'purple',
  partition: 'blue',
  'epsilon-closure': 'purple',
  finalize: 'green',
};

export function StepExplainer({
  step,
  currentStepIndex,
  totalSteps,
}: StepExplainerProps) {
  const badgeVariant = phaseBadgeColors[step.phase] ?? 'blue';

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-card flex flex-col gap-3">
      {/* Top row: step title & progress badge */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xs shrink-0">
            {currentStepIndex + 1}
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              {step.title}
            </h4>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
          </div>
        </div>

        <Badge variant={badgeVariant}>
          {step.phase.replace('-', ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Main explanation text */}
      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-normal bg-gray-50/60 dark:bg-gray-800/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
        {step.description}
      </p>

      {/* Formal theory / theorem rule block */}
      {step.ruleExplanation && (
        <div className="flex items-start gap-2 text-[11px] text-primary-800 dark:text-primary-200 bg-primary-50/60 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900 rounded-xl px-3 py-2">
          <Sparkles className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-semibold text-primary-900 dark:text-primary-100 mr-1">
              Theoretical Rule:
            </span>
            {step.ruleExplanation}
          </div>
        </div>
      )}
    </div>
  );
}
