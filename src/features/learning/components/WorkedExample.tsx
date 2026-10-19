import { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2, ListOrdered, BookOpen } from 'lucide-react';
import type { StepWorkedExample } from '../types';
import { Button } from '@/components/ui';
import { cn } from '@/utils';

interface WorkedExampleProps {
  example: StepWorkedExample;
  className?: string;
}

export function WorkedExample({ example, className }: WorkedExampleProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);

  const totalSteps = example.steps.length;
  const currentStep = example.steps[currentStepIndex];

  return (
    <div className={cn('bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-card space-y-4 my-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
              Interactive Worked Example
            </span>
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {example.title}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setShowAllSteps(!showAllSteps)}
          className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
        >
          {showAllSteps ? <BookOpen className="w-3.5 h-3.5" /> : <ListOrdered className="w-3.5 h-3.5" />}
          {showAllSteps ? 'Step-by-step mode' : 'View all steps'}
        </button>
      </div>

      {/* Problem Statement */}
      <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-sm">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 block mb-1">
          Problem Statement
        </span>
        <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
          {example.problemStatement}
        </p>
      </div>

      {showAllSteps ? (
        /* All Steps Mode */
        <div className="space-y-4 pt-2">
          {example.steps.map((step) => (
            <div key={step.stepNumber} className="border-l-2 border-emerald-500 pl-4 py-1 space-y-1.5">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Step {step.stepNumber}: {step.title}
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {step.description}
              </p>
              {step.formulaOrCode && (
                <div className="bg-gray-900 text-emerald-300 font-mono text-xs px-3 py-2 rounded-lg overflow-x-auto">
                  {step.formulaOrCode}
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {step.explanation}
              </p>
            </div>
          ))}

          {/* Conclusion */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Conclusion:</span>
              <span>{example.conclusion}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Step-by-Step Mode */
        <div className="space-y-4 pt-1">
          {/* Step indicator bar */}
          <div className="flex items-center gap-1.5">
            {example.steps.map((s, idx) => (
              <button
                key={s.stepNumber}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={cn(
                  'h-1.5 rounded-full flex-1 transition-all',
                  idx === currentStepIndex
                    ? 'bg-emerald-500'
                    : idx < currentStepIndex
                    ? 'bg-emerald-200 dark:bg-emerald-900'
                    : 'bg-gray-200 dark:bg-gray-700'
                )}
                aria-label={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-900/50 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Step {currentStep.stepNumber} of {totalSteps}
              </span>
              <span>{currentStep.title}</span>
            </div>

            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-relaxed">
              {currentStep.description}
            </p>

            {currentStep.formulaOrCode && (
              <div className="bg-gray-900 text-emerald-300 font-mono text-xs px-3.5 py-2.5 rounded-xl overflow-x-auto shadow-inner">
                {currentStep.formulaOrCode}
              </div>
            )}

            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {currentStep.explanation}
            </p>
          </div>

          {/* Conclusion when at final step */}
          {currentStepIndex === totalSteps - 1 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Conclusion:</span>
                <span>{example.conclusion}</span>
              </div>
            </div>
          )}

          {/* Step Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
            >
              Previous Step
            </Button>

            {currentStepIndex < totalSteps - 1 ? (
              <Button
                size="sm"
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                onClick={() => setCurrentStepIndex((i) => Math.min(totalSteps - 1, i + 1))}
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentStepIndex(0)}
              >
                Replay Walkthrough
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
