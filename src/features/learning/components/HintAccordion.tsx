import { useState } from 'react';
import { Lightbulb, ChevronDown } from 'lucide-react';
import { cn } from '@/utils';

interface HintAccordionProps {
  hints?: string[];
  title?: string;
  className?: string;
}

export function HintAccordion({ hints, title = 'Need a hint?', className }: HintAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [revealedCount, setRevealedCount] = useState(1);

  if (!hints || hints.length === 0) return null;

  return (
    <div className={cn('rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 overflow-hidden text-xs', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-amber-800 dark:text-amber-300 font-semibold hover:bg-amber-100/50 dark:hover:bg-amber-900/40 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span>{title} ({hints.length} available)</span>
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-amber-600 dark:text-amber-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="p-3 pt-1 space-y-2.5 border-t border-amber-100 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
          {hints.slice(0, revealedCount).map((hint, idx) => (
            <div key={idx} className="bg-white/80 dark:bg-gray-900/70 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/40 leading-relaxed">
              <span className="font-semibold text-amber-700 dark:text-amber-400 block mb-0.5">
                Hint {idx + 1} of {hints.length}:
              </span>
              <span>{hint}</span>
            </div>
          ))}

          {revealedCount < hints.length && (
            <button
              type="button"
              onClick={() => setRevealedCount((c) => Math.min(c + 1, hints.length))}
              className="text-xs text-amber-700 dark:text-amber-400 font-medium hover:underline pt-1 block"
            >
              Reveal next hint ({hints.length - revealedCount} remaining) &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
