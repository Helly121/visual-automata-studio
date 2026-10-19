import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, Lock, CheckCircle2 } from 'lucide-react';
import { units } from '@/data/units';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProgressBar, Badge } from '@/components/ui';
import { cn, formatDuration } from '@/utils';
import type { Unit } from '@/types';

export function LearnPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Learn"
        description="Work through the complete Automata Theory syllabus for VIT Pune, AY 2026–27."
      />

      <div className="space-y-4">
        {units.map((unit, idx) => (
          <UnitRow key={unit.id} unit={unit} index={idx} />
        ))}
      </div>
    </div>
  );
}

function UnitRow({ unit, index }: { unit: Unit; index: number }) {
  const navigate = useNavigate();
  const pct = unit.totalLessons > 0 ? Math.round((unit.completedLessons / unit.totalLessons) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
      {/* Unit header */}
      <button
        onClick={() => navigate(`/learn/${unit.id}`)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
      >
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0',
          pct === 100 ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400'
            : pct > 0 ? 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
        )}>
          {pct === 100 ? <CheckCircle2 className="w-5 h-5" /> : `0${index + 1}`}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{unit.title}</h2>
            {unit.status === 'in-progress' && <Badge variant="blue" dot>In Progress</Badge>}
            {pct === 100 && <Badge variant="green" dot>Completed</Badge>}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{unit.description}</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <ProgressBar value={unit.completedLessons} max={unit.totalLessons} />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
              {unit.completedLessons}/{unit.totalLessons} · {unit.estimatedHours}h
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
      </button>

      {/* Lesson preview — first 3 */}
      <div className="border-t border-gray-50 dark:border-gray-800/50 divide-y divide-gray-50 dark:divide-gray-800/50">
        {unit.lessons.slice(0, 3).map((lesson) => (
          <button
            key={lesson.id}
            onClick={() =>
              lesson.status !== 'locked'
                ? navigate(`/learn/${unit.id}/${lesson.id}`)
                : undefined
            }
            disabled={lesson.status === 'locked'}
            className={cn(
              'w-full flex items-center gap-3 px-5 py-3 text-left transition-colors',
              lesson.status === 'locked'
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/40',
            )}
          >
            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0', {
              'bg-green-100 dark:bg-green-950': lesson.status === 'completed',
              'bg-primary-100 dark:bg-primary-950': lesson.status === 'available',
              'bg-gray-100 dark:bg-gray-800': lesson.status === 'locked',
            })}>
              {lesson.status === 'completed' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              ) : lesson.status === 'locked' ? (
                <Lock className="w-3 h-3 text-gray-400 dark:text-gray-600" />
              ) : (
                <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">{lesson.order}</span>
              )}
            </div>
            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{lesson.title}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3" /> {formatDuration(lesson.duration)}
            </span>
          </button>
        ))}
        {unit.lessons.length > 3 && (
          <button
            onClick={() => navigate(`/learn/${unit.id}`)}
            className="w-full px-5 py-2.5 text-left text-xs text-primary-600 dark:text-primary-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
          >
            +{unit.lessons.length - 3} more lessons →
          </button>
        )}
      </div>
    </div>
  );
}
