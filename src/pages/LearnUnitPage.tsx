import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { ChevronLeft, Clock, CheckCircle2, Lock, Play, ChevronRight } from 'lucide-react';
import { getUnit } from '@/data/units';
import { Button, Badge, ProgressBar, StatusBadge } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn, formatDuration } from '@/utils';
import { useLearningProgress } from '@/features/learning';

export function LearnUnitPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const unit = getUnit(unitId ?? '');
  const { isLessonCompleted } = useLearningProgress();

  if (!unit) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 dark:text-gray-500 mb-4">Unit not found.</p>
        <Button variant="outline" onClick={() => navigate('/learn')}>Back to Learn</Button>
      </div>
    );
  }

  const completedCount = unit.lessons.filter((l) => isLessonCompleted(l.id)).length;
  const totalCount = unit.lessons.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const unitStatus = pct === 100 ? 'completed' : pct > 0 ? 'in-progress' : unit.status;

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-5" aria-label="Breadcrumb">
        <NavLink to="/learn" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Learn</NavLink>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600 dark:text-gray-300">{unit.title}</span>
      </nav>

      <PageHeader
        title={unit.title}
        description={unit.longDescription}
        actions={
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ChevronLeft className="w-4 h-4" />}
            onClick={() => navigate('/learn')}
          >
            All Units
          </Button>
        }
      />

      {/* Unit meta */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-card mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={unitStatus === 'available' ? 'available' : unitStatus === 'in-progress' ? 'in-progress' : 'completed'} />
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> ~{unit.estimatedHours}h estimated
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {totalCount} lessons
            </span>
          </div>
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{pct}%</span>
        </div>
        <ProgressBar value={completedCount} max={totalCount} />

        {/* Topics */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {unit.topics.map((topic) => (
            <Badge key={topic} variant="gray" className="text-[10px]">{topic}</Badge>
          ))}
        </div>
      </div>

      {/* Lessons list */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Lessons · {completedCount}/{totalCount} complete
          </h2>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
          {unit.lessons.map((lesson) => {
            const isCompleted = isLessonCompleted(lesson.id);
            const isAccessible = lesson.status !== 'locked';
            return (
              <div
                key={lesson.id}
                className={cn(
                  'flex items-center gap-4 px-5 py-4 transition-colors',
                  isAccessible
                    ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 group'
                    : 'opacity-50',
                )}
                role={isAccessible ? 'button' : undefined}
                tabIndex={isAccessible ? 0 : undefined}
                onClick={() => isAccessible && navigate(`/learn/${unit.id}/${lesson.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && isAccessible && navigate(`/learn/${unit.id}/${lesson.id}`)}
              >
                {/* Status icon */}
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                  isCompleted && 'bg-green-50 dark:bg-green-950',
                  !isCompleted && isAccessible && 'bg-primary-50 dark:bg-primary-950',
                  !isAccessible && 'bg-gray-50 dark:bg-gray-800',
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : !isAccessible ? (
                    <Lock className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                  ) : (
                    <Play className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                      {lesson.order}.
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {lesson.title}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{lesson.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {lesson.topics.slice(0, 3).map((t) => (
                      <span key={t} className="text-[9px] text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3 h-3" /> {formatDuration(lesson.duration)}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
