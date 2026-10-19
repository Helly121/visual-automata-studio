import { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import type { KnowledgeCheckQuestion } from '../types';
import { validateQuestionAnswer } from '../evaluator';
import { HintAccordion } from './HintAccordion';
import { Button } from '@/components/ui';
import { cn } from '@/utils';

interface KnowledgeCheckProps {
  question: KnowledgeCheckQuestion;
  onPass?: (questionId: string) => void;
  className?: string;
}

export function KnowledgeCheck({ question, onPass, className }: KnowledgeCheckProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [shortAnswer, setShortAnswer] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const answer = question.type === 'short-answer' ? shortAnswer : selectedOption;
    if (!answer) return;

    const result = validateQuestionAnswer(question, answer);
    setIsSubmitted(true);
    setFeedback({
      isCorrect: result.isCorrect,
      message: result.feedback,
    });

    if (result.isCorrect && onPass) {
      onPass(question.id);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setFeedback(null);
    setSelectedOption('');
    setShortAnswer('');
  };

  return (
    <div className={cn('bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-card space-y-4 my-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xs">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 block">
              Knowledge Check · {question.type === 'short-answer' ? 'Short Answer' : question.type === 'true-false' ? 'True / False' : 'Multiple Choice'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {question.points ?? 10} XP available
            </span>
          </div>
        </div>

        {feedback?.isCorrect && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/60 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Passed
          </span>
        )}
      </div>

      {/* Prompt */}
      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-relaxed">
        {question.prompt}
      </p>

      {/* Question Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {(question.type === 'multiple-choice' || question.type === 'true-false') && question.options && (
          <div className="space-y-2">
            {question.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              let optionStyle = 'border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-800 bg-gray-50/50 dark:bg-gray-800/40 text-gray-800 dark:text-gray-200';

              if (isSubmitted) {
                if (opt.isCorrect) {
                  optionStyle = 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-200 font-medium';
                } else if (isSelected && !opt.isCorrect) {
                  optionStyle = 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200';
                } else {
                  optionStyle = 'opacity-50 border-gray-200 dark:border-gray-800 text-gray-400';
                }
              } else if (isSelected) {
                optionStyle = 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 font-medium ring-1 ring-primary-500';
              }

              return (
                <label
                  key={opt.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all duration-150',
                    optionStyle,
                    isSubmitted && 'cursor-default'
                  )}
                >
                  <input
                    type="radio"
                    name={`qc-${question.id}`}
                    value={opt.id}
                    checked={isSelected}
                    disabled={isSubmitted}
                    onChange={() => setSelectedOption(opt.id)}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="flex-1 leading-relaxed">{opt.text}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === 'short-answer' && (
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={shortAnswer}
                disabled={isSubmitted}
                onChange={(e) => setShortAnswer(e.target.value)}
                placeholder="Type your answer here (e.g., q0, ε, 010)..."
                className={cn(
                  'w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border transition-all focus:outline-none focus:ring-2',
                  isSubmitted
                    ? feedback?.isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-200'
                      : 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500'
                )}
              />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Notation tips: Standard equivalents like <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">eps</code> / <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">lambda</code> are automatically recognized.
            </p>
          </div>
        )}

        {/* Hints */}
        {question.hints && question.hints.length > 0 && !feedback?.isCorrect && (
          <HintAccordion hints={question.hints} />
        )}

        {/* Immediate Feedback Banner */}
        {feedback && (
          <div
            className={cn(
              'p-3.5 rounded-xl border text-xs flex items-start gap-3 animate-fade-in leading-relaxed',
              feedback.isCorrect
                ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-900 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
            )}
          >
            {feedback.isCorrect ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-bold block">
                {feedback.isCorrect ? 'Well done!' : 'Not quite right.'}
              </span>
              <p>{feedback.message}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          {!isSubmitted ? (
            <Button
              type="submit"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              disabled={question.type === 'short-answer' ? !shortAnswer.trim() : !selectedOption}
            >
              Check Answer
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              {!feedback?.isCorrect && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={handleReset}
                >
                  Try Again
                </Button>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
