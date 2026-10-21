import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  BookOpen,
  Trophy,
  ArrowRight,
  Flame,
  Star,
  Clock,
  Play,
  Zap,
  Sparkles,
  GitCompare,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { units } from '@/data/units';
import { recentProjects, exampleAutomata, challenges } from '@/data/mock';
import { UnitCard } from '@/components/UnitCard';
import { Button, ProgressBar, Badge } from '@/components/ui';
import { SectionHeader } from '@/components/layout/PageHeader';
import { formatDate, projectTypeLabel, formatDuration, getRankInfo } from '@/utils';
import { useLearningProgress, progressManager } from '@/features/learning';
import { useAuth } from '@/features/auth/AuthContext';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state, isLessonCompleted } = useLearningProgress();

  // Compute live stats from the progress manager
  const stats = progressManager.getProgressStats(units);
  const overallPct = stats.overallPercentage;
  const completedLessonsCount = stats.completedLessonsCount;
  const totalLessons = stats.totalLessons;

  // Challenge stats
  const completedChallengesCount = Object.keys(state.completedChallenges).length;
  const totalChallengesCount = challenges.length;

  // Rank / Level info
  const rankInfo = getRankInfo(state.totalXP);

  // Find the current unit and next incomplete lesson
  const currentUnit =
    units.find((u) => {
      const up = stats.unitProgress.find((p) => p.unitId === u.id);
      return up && up.percentage > 0 && up.percentage < 100;
    }) ??
    units.find((u) => {
      const up = stats.unitProgress.find((p) => p.unitId === u.id);
      return up && up.percentage === 0;
    }) ??
    units[0];

  const nextLesson =
    currentUnit?.lessons.find((l) => !isLessonCompleted(l.id)) ??
    currentUnit?.lessons[0];

  // Recommended challenge: find first unsolved challenge for the current unit or general
  const recommendedChallenge =
    challenges.find((c) => !state.completedChallenges[c.id] && c.unitId === currentUnit?.id) ??
    challenges.find((c) => !state.completedChallenges[c.id]) ??
    challenges[0];

  const isBrandNewUser = completedLessonsCount === 0;
  const isCurriculumFinished = completedLessonsCount === totalLessons && totalLessons > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-card">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary-500/10 dark:bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider bg-primary-50 dark:bg-primary-950/80 px-2.5 py-0.5 rounded-full border border-primary-200/50 dark:border-primary-800/50">
                  VIT Pune · AY 2026–27
                </span>
                <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-200/50 dark:border-purple-800/50">
                  Level {rankInfo.level} · {rankInfo.title}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
                {user?.displayName ? `Welcome back, ${user.displayName} 👋` : 'Welcome back to Visual Automata Studio 👋'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
                An interactive learning platform for Automata Theory. Build computational models, simulate execution in real time, and master formal language theory step by step.
              </p>
            </div>

            {/* Badges / Metrics */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div
                className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/80 px-3 py-1.5 rounded-xl border border-orange-200/60 dark:border-orange-900/60 shadow-xs"
                title={`${state.streak} consecutive days with learning activity`}
              >
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                <span>{state.streak}-day streak</span>
              </div>

              <div
                className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/80 px-3 py-1.5 rounded-xl border border-purple-200/60 dark:border-purple-900/60 shadow-xs"
                title={`${state.totalXP} total experience points earned`}
              >
                <Star className="w-4 h-4 fill-purple-600 text-purple-600 dark:fill-purple-400" />
                <span>{state.totalXP} XP</span>
              </div>

              <div
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/60 shadow-xs"
                title={`${completedChallengesCount} of ${totalChallengesCount} challenges solved`}
              >
                <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{completedChallengesCount}/{totalChallengesCount} Challenges</span>
              </div>
            </div>
          </div>

          {/* Overall Progress Meter */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Overall Progress · {completedLessonsCount} of {totalLessons} lessons complete
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:inline">
                  (Level {rankInfo.level}: {rankInfo.progressPercent}% toward Level {rankInfo.level + 1})
                </span>
              </div>
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{overallPct}%</span>
            </div>
            <ProgressBar value={overallPct} className="h-2" />
          </div>
        </div>
      </div>

      {/* ── Key Stats Overview (4 Cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total XP */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-card hover:border-gray-200 dark:hover:border-gray-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Total XP</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 fill-purple-600 text-purple-600 dark:fill-purple-400" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
            {state.totalXP}
          </div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium truncate">
            {rankInfo.title}
          </p>
        </div>

        {/* Day Streak */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-card hover:border-gray-200 dark:hover:border-gray-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Day Streak</span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
            {state.streak} {state.streak === 1 ? 'Day' : 'Days'}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
            {state.streak > 0 ? 'Daily momentum active' : 'Complete a lesson to start'}
          </p>
        </div>

        {/* Lessons Completed */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-card hover:border-gray-200 dark:hover:border-gray-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Lessons Completed</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
            {completedLessonsCount} / {totalLessons}
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium truncate">
            {overallPct}% curriculum covered
          </p>
        </div>

        {/* Challenges Solved */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-card hover:border-gray-200 dark:hover:border-gray-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Challenges Solved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
            {completedChallengesCount} / {totalChallengesCount}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
            {challenges.filter((c) => state.completedChallenges[c.id]).reduce((a, b) => a + b.xpReward, 0)} XP earned
          </p>
        </div>
      </div>

      {/* ── Continue Learning Section ── */}
      <section aria-labelledby="continue-learning-heading">
        <SectionHeader
          title="Continue Learning"
          action={
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => navigate('/learn')}
            >
              Learning Journey
            </Button>
          }
        />

        {isBrandNewUser ? (
          /* Empty state for fresh accounts */
          <div className="bg-gradient-to-br from-primary-50/60 via-white to-purple-50/40 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 border border-primary-100 dark:border-primary-900/50 rounded-2xl p-6 sm:p-8 shadow-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-950 px-2.5 py-0.5 rounded-md">
                    <Sparkles className="w-3.5 h-3.5 text-primary-600" /> Welcome Starter
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Unit 1: Finite Automata</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Begin with Lesson 1: Alphabets, Strings, and Languages
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  Start from the foundational principles of formal language theory. Learn how symbols assemble into strings, explore concatenation and the Kleene star, and earn your first 50 XP.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Button
                  leftIcon={<Play className="w-4 h-4 fill-white text-white" />}
                  onClick={() => navigate('/learn/finite-automata/fa-01-alphabets')}
                  className="shadow-sm"
                >
                  Start First Lesson
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/learn')}
                >
                  Browse Syllabus
                </Button>
              </div>
            </div>
          </div>
        ) : isCurriculumFinished ? (
          /* Celebratory banner if student finished all 38 lessons */
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-emerald-500 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Full Syllabus Completed!
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    You have completed all 38 lessons across 6 syllabus units. Put your knowledge to work in the Playground or solve challenges.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  leftIcon={<Trophy className="w-4 h-4 text-yellow-500" />}
                  onClick={() => navigate('/challenges')}
                >
                  Try Challenges
                </Button>
                <Button
                  leftIcon={<FlaskConical className="w-4 h-4" />}
                  onClick={() => navigate('/playground')}
                >
                  Open Playground
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* In-progress Active Next Lesson Card */
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-card hover:border-gray-200 dark:hover:border-gray-700 transition-all">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 px-2.5 py-0.5 rounded-md">
                    Unit 0{currentUnit.number}: {currentUnit.shortTitle}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {(() => {
                      const us = stats.unitProgress.find((up) => up.unitId === currentUnit.id);
                      return `${us?.completedLessons ?? 0} of ${us?.totalLessons ?? 0} lessons completed (${us?.percentage ?? 0}%)`;
                    })()}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1.5">
                  {nextLesson ? `${nextLesson.order}. ${nextLesson.title}` : currentUnit.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 max-w-2xl mb-4">
                  {nextLesson ? nextLesson.description : currentUnit.description}
                </p>

                {/* Next lesson meta pills & unit progress */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {nextLesson && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {formatDuration(nextLesson.duration)}
                      </span>
                    )}
                    {nextLesson?.topics.slice(0, 3).map((topic) => (
                      <span
                        key={topic}
                        className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/80 px-2 py-0.5 rounded-md"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>

                  <div className="w-full sm:w-48 flex items-center gap-2">
                    {(() => {
                      const us = stats.unitProgress.find((up) => up.unitId === currentUnit.id);
                      return (
                        <>
                          <div className="flex-1">
                            <ProgressBar value={us?.completedLessons ?? 0} max={us?.totalLessons ?? 1} />
                          </div>
                          <span className="text-xs font-semibold text-gray-500">{us?.percentage ?? 0}%</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <Button
                  leftIcon={<Play className="w-4 h-4 fill-white text-white" />}
                  onClick={() =>
                    nextLesson
                      ? navigate(`/learn/${currentUnit.id}/${nextLesson.id}`)
                      : navigate(`/learn/${currentUnit.id}`)
                  }
                  className="w-full sm:w-auto shadow-sm"
                >
                  Continue Lesson
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/learn/${currentUnit.id}`)}
                  className="w-full sm:w-auto"
                >
                  Unit Overview
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Automata Playground Visual Entry Point (Hero Showcase) ── */}
      <section aria-labelledby="playground-showcase-heading">
        <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-primary-950 to-gray-900 text-white rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl">
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #60a5fa 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" /> Interactive Sandbox
                </span>
                <span className="text-xs text-gray-400">
                  DFA · NFA · ε-NFA · PDA · Turing Machines
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Automata Playground &amp; Canvas Simulator
              </h2>

              <p className="text-sm text-gray-300 leading-relaxed">
                Design formal state machines on an infinite canvas. Add states, draw transition arcs, define accepting conditions, and execute step-by-step simulations with instant acceptance tracing.
              </p>

              {/* Feature Pills */}
              <div className="flex items-center gap-2 flex-wrap pt-1 text-xs text-gray-300">
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-sm flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-primary-400" /> State Graph Editor
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-sm flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-emerald-400" /> String Stepper
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-sm flex items-center gap-1.5">
                  <GitCompare className="w-3.5 h-3.5 text-purple-400" /> Transformation Studio
                </span>
              </div>
            </div>

            {/* CTA Controls */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
              <Button
                size="lg"
                leftIcon={<FlaskConical className="w-5 h-5" />}
                onClick={() => navigate('/playground')}
                className="bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-md w-full"
              >
                Launch Playground
              </Button>
              <Button
                variant="outline"
                size="md"
                leftIcon={<GitCompare className="w-4 h-4" />}
                onClick={() => navigate('/transform')}
                className="border-gray-700 bg-gray-800/80 text-gray-200 hover:bg-gray-800 hover:text-white w-full"
              >
                Transformation Studio
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Syllabus Units Grid ── */}
      <section aria-labelledby="syllabus-units-heading">
        <SectionHeader
          title="Syllabus Units"
          action={
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => navigate('/learn')}
            >
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

      {/* ── Recommended Next Steps & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recommended Actions */}
        <section className="lg:col-span-2 space-y-3">
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
                desc: recommendedChallenge
                  ? `Next: ${recommendedChallenge.title.slice(0, 32)}...`
                  : 'Test your understanding',
                to: '/challenges',
                bg: 'bg-yellow-50 dark:bg-yellow-950',
              },
              {
                icon: <GitCompare className="w-4 h-4 text-violet-600 dark:text-violet-400" />,
                label: 'Transformation Studio',
                desc: 'NFA to DFA & DFA Minimisation',
                to: '/transform',
                bg: 'bg-violet-50 dark:bg-violet-950',
              },
            ].map(({ icon, label, desc, to, bg }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="w-full flex items-center gap-3 p-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-card-hover transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            ))}
          </div>
        </section>

        {/* Recent Projects */}
        <section className="lg:col-span-3 space-y-3">
          <SectionHeader
            title="Recent Projects"
            action={
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => navigate('/projects')}
              >
                All projects
              </Button>
            }
          />
          <div className="space-y-2">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-3 p-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-card-hover transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                role="button"
                tabIndex={0}
                onClick={() => navigate('/playground')}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/playground')}
              >
                <div className="w-9 h-9 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-gray-700">
                  <Zap className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate transition-colors">
                      {project.name}
                    </p>
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
      <section aria-labelledby="featured-examples-heading">
        <SectionHeader title="Featured Examples" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {exampleAutomata.map((ex) => (
            <button
              key={ex.id}
              onClick={() => navigate('/playground')}
              className="text-left p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-card-hover transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="blue" className="text-[10px]">
                  {projectTypeLabel[ex.type]}
                </Badge>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate">
                  Unit 0{units.find((u) => u.id === ex.unitId)?.number ?? '1'}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 line-clamp-2 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {ex.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate bg-gray-50 dark:bg-gray-800/60 p-1 rounded">
                {ex.language}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
