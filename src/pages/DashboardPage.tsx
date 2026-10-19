import { useNavigate } from 'react-router-dom';
import {
  FlaskConical, BookOpen, Trophy, ArrowRight, Flame, Star, Clock,
  Play, Zap,
} from 'lucide-react';
import { units } from '@/data/units';
import { recentProjects, exampleAutomata } from '@/data/mock';
import { UnitCard } from '@/components/UnitCard';
import { Button, ProgressBar, Badge } from '@/components/ui';
import { SectionHeader } from '@/components/layout/PageHeader';
import { formatDate, projectTypeLabel } from '@/utils';
import { useLearningProgress, progressManager } from '@/features/learning';

export function DashboardPage() {
  const navigate = useNavigate();
  const { state } = useLearningProgress();

  // Compute live stats from the progress manager
  const stats = progressManager.getProgressStats(units);
  const overallPct = stats.overallPercentage;
  const completedLessonsCount = stats.completedLessonsCount;
  const totalLessons = stats.totalLessons;

  // Find in-progress unit (first unit with any completed but not all completed lessons)
  const inProgressUnit = units.find((u) => {
    const unitStat = stats.unitProgress.find((up) => up.unitId === u.id);
    return unitStat && unitStat.percentage > 0 && unitStat.percentage < 100;
  }) ?? units.find((u) => u.status === 'in-progress');


  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Welcome banner ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
              VIT Pune · AY 2026–27
            </p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
              Welcome back to Visual Automata Studio
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
              An interactive learning platform for Automata Theory. Build computational models, simulate their
              execution, and master formal language theory — step by step.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 px-3 py-1.5 rounded-full">
              <Flame className="w-3.5 h-3.5" />
              {state.streak}-day streak
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-3 py-1.5 rounded-full">
              <Star className="w-3.5 h-3.5" />
              {state.totalXP} XP
            </div>
          </div>
        </div>

        {/* Overall progress */}
        <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Overall Progress · {completedLessonsCount} of {totalLessons} lessons complete
            </span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{overallPct}%</span>
          </div>
          <ProgressBar value={overallPct} />
        </div>
      </div>

      {/* ── Continue Learning ── */}
      {inProgressUnit && (
        <section>
          <SectionHeader title="Continue Learning" />
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5 font-medium uppercase tracking-wider">
                  {(() => { const us = stats.unitProgress.find(up => up.unitId === inProgressUnit.id); return `Unit ${inProgressUnit.number} · ${us?.completedLessons ?? 0}/${us?.totalLessons ?? 0} lessons`; })()}
                </p>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{inProgressUnit.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{inProgressUnit.description}</p>
                <div className="mt-3">
                  {(() => { const us = stats.unitProgress.find(up => up.unitId === inProgressUnit.id); return <ProgressBar value={us?.completedLessons ?? 0} max={us?.totalLessons ?? 1} />; })()}
                </div>
              </div>
              <Button
                leftIcon={<Play className="w-4 h-4" />}
                onClick={() => navigate(`/learn/${inProgressUnit.id}`)}
              >
                Resume
              </Button>
            </div>
            {/* Next lesson */}
            {(() => {
              const nextLesson = inProgressUnit.lessons.find((l) => l.status === 'available');
              if (!nextLesson) return null;
              return (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-50 dark:bg-primary-950 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Next lesson</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{nextLesson.title}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <Clock className="w-3 h-3" />
                    {nextLesson.duration} min
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ── Syllabus Units ── */}
      <section>
        <SectionHeader
          title="Syllabus Units"
          action={
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />} onClick={() => navigate('/learn')}>
              View all
            </Button>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {units.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>
      </section>

      {/* ── Quick Actions & Recent Projects ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Quick Actions */}
        <section className="lg:col-span-2">
          <SectionHeader title="Quick Actions" />
          <div className="space-y-2">
            {[
              {
                icon: <FlaskConical className="w-4 h-4 text-primary-600 dark:text-primary-400" />,
                label: 'Open Playground',
                desc: 'Build and simulate automata',
                to: '/playground',
                bg: 'bg-primary-50 dark:bg-primary-950',
              },
              {
                icon: <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
                label: 'Start Learning',
                desc: 'Pick up where you left off',
                to: '/learn',
                bg: 'bg-emerald-50 dark:bg-emerald-950',
              },
              {
                icon: <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />,
                label: 'Try a Challenge',
                desc: 'Test your understanding',
                to: '/challenges',
                bg: 'bg-yellow-50 dark:bg-yellow-950',
              },
            ].map(({ icon, label, desc, to, bg }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="w-full flex items-center gap-3 p-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-card-hover transition-all text-left"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        </section>

        {/* Recent Projects */}
        <section className="lg:col-span-3">
          <SectionHeader
            title="Recent Projects"
            action={
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />} onClick={() => navigate('/projects')}>
                All projects
              </Button>
            }
          />
          <div className="space-y-2">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-3 p-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-card-hover transition-all cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => navigate('/playground')}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/playground')}
              >
                <div className="w-9 h-9 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-gray-700">
                  <Zap className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{project.name}</p>
                    <Badge variant="gray" className="flex-shrink-0 text-[10px]">
                      {projectTypeLabel[project.type]}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{project.description}</p>
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                  {formatDate(project.updatedAt)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Featured Examples ── */}
      <section>
        <SectionHeader title="Featured Examples" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {exampleAutomata.map((ex) => (
            <button
              key={ex.id}
              onClick={() => navigate('/playground')}
              className="text-left p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="blue" className="text-[10px]">{projectTypeLabel[ex.type]}</Badge>
              </div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 line-clamp-2 leading-snug">{ex.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">{ex.language}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
