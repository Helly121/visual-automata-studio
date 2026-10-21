import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ChevronRight,
  Lock,
  CheckCircle2,
  Play,
  LayoutGrid,
  Route,
  ArrowRight,
  Star,
  Flame,
} from 'lucide-react';
import { units } from '@/data/units';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProgressBar, Badge, Button, StatusBadge } from '@/components/ui';
import { UnitCard } from '@/components/UnitCard';
import { cn, formatDuration } from '@/utils';
import { useLearningProgress, progressManager } from '@/features/learning';
import type { Unit, Lesson } from '@/types';

interface LearningStage {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  unitIds: string[];
}

const learningStages: LearningStage[] = [
  {
    id: 'stage-1',
    number: 1,
    title: 'Regular Languages & Finite Automata',
    subtitle: 'Foundations of Computation',
    description:
      'Master finite state computation, transition functions, non-determinism, subset construction algorithms, and regular expression equivalence.',
    unitIds: ['finite-automata', 'regular-expressions'],
  },
  {
    id: 'stage-2',
    number: 2,
    title: 'Context-Free Languages & Pushdown Models',
    subtitle: 'Grammars & Stack Memory',
    description:
      'Explore grammar production rules, parse trees, ambiguity, normal forms, and stack-based memory mechanisms for language recognition.',
    unitIds: ['context-free-grammars', 'pushdown-automata'],
  },
  {
    id: 'stage-3',
    number: 3,
    title: 'Universal Computation & Complexity Theory',
    subtitle: 'Limits of Computability',
    description:
      'Investigate unrestricted tape machines, universal computation, the Church-Turing thesis, the Halting Problem, and polynomial tractability (P vs NP).',
    unitIds: ['turing-machines', 'computability-complexity'],
  },
];

export function LearnPage() {
  const navigate = useNavigate();
  const { state, isLessonCompleted } = useLearningProgress();
  const [viewMode, setViewMode] = useState<'journey' | 'grid'>('journey');

  const stats = progressManager.getProgressStats(units);

  // Find next lesson to take
  let nextLessonUnit: Unit | null = null;
  let nextLessonToTake: Lesson | null = null;

  for (const unit of units) {
    for (const lesson of unit.lessons) {
      if (!isLessonCompleted(lesson.id)) {
        nextLessonUnit = unit;
        nextLessonToTake = lesson;
        break;
      }
    }
    if (nextLessonToTake) break;
  }

  // Helper to determine if a lesson is accessible
  const isLessonAccessible = (unit: Unit, lesson: Lesson, index: number): boolean => {
    if (isLessonCompleted(lesson.id)) return true;
    if (lesson.status !== 'locked') return true;
    if (index === 0) return true;
    // Accessible if previous lesson in the same unit is completed
    const prevLesson = unit.lessons[index - 1];
    return isLessonCompleted(prevLesson.id);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Learn"
        description="Work through the complete Automata Theory syllabus for VIT Pune, AY 2026–27."
        actions={
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center">
              <button
                onClick={() => setViewMode('journey')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  viewMode === 'journey'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                )}
                aria-label="Learning Journey view"
              >
                <Route className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Roadmap</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                )}
                aria-label="Unit Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Units Grid</span>
              </button>
            </div>
          </div>
        }
      />

      {/* ── Curriculum Progress Summary Banner ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Overall Syllabus Progress
              </span>
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                {stats.overallPercentage}%
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {stats.completedLessonsCount} of {stats.totalLessons} lessons completed across 6 units
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/80 px-3 py-1.5 rounded-xl border border-purple-100 dark:border-purple-900">
              <Star className="w-3.5 h-3.5 fill-purple-600 dark:fill-purple-400" />
              <span>{state.totalXP} XP</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/80 px-3 py-1.5 rounded-xl border border-orange-100 dark:border-orange-900">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              <span>{state.streak} Days</span>
            </div>

            {nextLessonToTake && nextLessonUnit && (
              <Button
                size="sm"
                leftIcon={<Play className="w-3.5 h-3.5 fill-white text-white" />}
                onClick={() => navigate(`/learn/${nextLessonUnit.id}/${nextLessonToTake.id}`)}
                className="shadow-xs ml-auto md:ml-0"
              >
                Resume: {nextLessonToTake.title.slice(0, 20)}...
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          <ProgressBar value={stats.overallPercentage} className="h-2" />
        </div>
      </div>

      {/* ── View 1: Visual Learning Journey Roadmap ── */}
      {viewMode === 'journey' ? (
        <div className="space-y-10">
          {learningStages.map((stage) => {
            const stageUnits = units.filter((u) => stage.unitIds.includes(u.id));
            const stageTotalLessons = stageUnits.reduce((acc, u) => acc + u.lessons.length, 0);
            const stageCompletedLessons = stageUnits.reduce(
              (acc, u) => acc + u.lessons.filter((l) => isLessonCompleted(l.id)).length,
              0
            );
            const stagePct = stageTotalLessons > 0 ? Math.round((stageCompletedLessons / stageTotalLessons) * 100) : 0;
            const isStageComplete = stagePct === 100;
            const isStageInProgress = stagePct > 0 && stagePct < 100;

            return (
              <section key={stage.id} className="relative">
                {/* Stage Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs',
                        isStageComplete
                          ? 'bg-emerald-500 text-white'
                          : isStageInProgress
                          ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-950'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {isStageComplete ? <CheckCircle2 className="w-5 h-5" /> : `0${stage.number}`}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded">
                          {stage.subtitle}
                        </span>
                        {isStageComplete && (
                          <Badge variant="green" dot>
                            Stage Mastered
                          </Badge>
                        )}
                        {isStageInProgress && (
                          <Badge variant="blue" dot>
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                        {stage.title}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:self-center">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {stageCompletedLessons}/{stageTotalLessons} Lessons ({stagePct}%)
                    </span>
                    <div className="w-24">
                      <ProgressBar value={stagePct} />
                    </div>
                  </div>
                </div>

                {/* Stage Description */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-2xl">
                  {stage.description}
                </p>

                {/* Units within this Stage */}
                <div className="space-y-6">
                  {stageUnits.map((unit) => {
                    const completedCount = unit.lessons.filter((l) => isLessonCompleted(l.id)).length;
                    const totalCount = unit.lessons.length;
                    const unitPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                    const isUnitCompleted = unitPct === 100;

                    return (
                      <div
                        key={unit.id}
                        className={cn(
                          'bg-white dark:bg-gray-900 border rounded-2xl p-5 sm:p-6 shadow-card transition-all',
                          isUnitCompleted
                            ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/10 dark:bg-emerald-950/10'
                            : 'border-gray-100 dark:border-gray-800'
                        )}
                      >
                        {/* Unit Card Top */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                          <div className="flex items-start gap-3.5">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0',
                                isUnitCompleted
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400'
                              )}
                            >
                              {isUnitCompleted ? <CheckCircle2 className="w-5 h-5" /> : `U${unit.number}`}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                  Unit 0{unit.number}
                                </span>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                  {unit.title}
                                </h3>
                                <StatusBadge
                                  status={
                                    unitPct === 100
                                      ? 'completed'
                                      : unitPct > 0
                                      ? 'in-progress'
                                      : unit.status
                                  }
                                />
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 max-w-xl">
                                {unit.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                            <div className="text-right">
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {completedCount}/{totalCount} Complete
                              </span>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                ~{unit.estimatedHours}h estimated
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                              onClick={() => navigate(`/learn/${unit.id}`)}
                            >
                              Unit Overview
                            </Button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-5">
                          <ProgressBar value={completedCount} max={totalCount} />
                        </div>

                        {/* ── Visual Connected Lesson Journey Roadmap ── */}
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                              Lesson Roadmap
                            </span>
                            <span className="text-[11px] text-gray-400">
                              Click any accessible lesson to begin
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            {unit.lessons.map((lesson, idx) => {
                              const isCompleted = isLessonCompleted(lesson.id);
                              const accessible = isLessonAccessible(unit, lesson, idx);
                              const isCurrent = !isCompleted && accessible;

                              return (
                                <button
                                  key={lesson.id}
                                  disabled={!accessible}
                                  onClick={() => accessible && navigate(`/learn/${unit.id}/${lesson.id}`)}
                                  className={cn(
                                    'text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                                    isCompleted
                                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                                      : isCurrent
                                      ? 'bg-primary-50/50 dark:bg-primary-950/30 border-primary-300 dark:border-primary-700 shadow-xs ring-2 ring-primary-400/20'
                                      : accessible
                                      ? 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                      : 'bg-gray-50/40 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800/60 opacity-50 cursor-not-allowed'
                                  )}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <div
                                          className={cn(
                                            'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                                            isCompleted
                                              ? 'bg-emerald-500 text-white'
                                              : isCurrent
                                              ? 'bg-primary-600 text-white animate-pulse-soft'
                                              : accessible
                                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                          )}
                                        >
                                          {isCompleted ? (
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                          ) : !accessible ? (
                                            <Lock className="w-3 h-3" />
                                          ) : (
                                            lesson.order
                                          )}
                                        </div>
                                        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                                          L{lesson.order}
                                        </span>
                                      </div>

                                      {isCompleted ? (
                                        <span className="text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                                          Done
                                        </span>
                                      ) : isCurrent ? (
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-950 px-1.5 py-0.2 rounded">
                                          Active
                                        </span>
                                      ) : !accessible ? (
                                        <span className="text-[9px] text-gray-400">Locked</span>
                                      ) : null}
                                    </div>

                                    <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                      {lesson.title}
                                    </h4>
                                  </div>

                                  <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800/80 text-[10px] text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatDuration(lesson.duration)}
                                    </span>
                                    {accessible && (
                                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* ── View 2: Structured Unit Grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>
      )}
    </div>
  );
}
