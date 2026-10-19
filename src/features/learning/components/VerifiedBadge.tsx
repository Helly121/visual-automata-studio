import { CheckCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/utils';

interface VerifiedBadgeProps {
  curriculum?: string;
  source?: string;
  className?: string;
}

export function VerifiedBadge({
  curriculum = 'VIT Pune Syllabus AY 2026–27',
  source = 'Verified Curriculum Content',
  className,
}: VerifiedBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs font-medium shadow-xs',
        className
      )}
      title="This content conforms strictly to the approved academic syllabus."
    >
      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      <span className="font-semibold">{curriculum}</span>
      <span className="text-blue-400 dark:text-blue-600">·</span>
      <span className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400">
        <CheckCircle className="w-3 h-3" />
        {source}
      </span>
    </div>
  );
}
