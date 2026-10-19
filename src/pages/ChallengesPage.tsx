import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Search,
  CheckCircle2,
  Star,
  ArrowRight,
  Filter,
  Check,
  FlaskConical,
  Lightbulb,
  History,
  Send,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Modal, EmptyState } from '@/components/ui';
import { challenges as initialChallenges } from '@/data/mock';
import { units, getUnit } from '@/data/units';
import { cn, difficultyLabel, difficultyColor } from '@/utils';
import type { Challenge } from '@/types';
import { useLearningProgress, progressManager } from '@/features/learning';

export function ChallengesPage() {
  const navigate = useNavigate();
  const { state } = useLearningProgress();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [testInput, setTestInput] = useState('');
  const [lastTestResult, setLastTestResult] = useState<{ passed: boolean; message: string } | null>(null);

  // Sync completion with reactive learning state
  const isCompleted = (id: string) => Boolean(state.completedChallenges[id]);

  // Toggle completion with duplicate reward prevention
  const handleToggleComplete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const challenge = initialChallenges.find((c) => c.id === id);
    if (!challenge) return;

    if (isCompleted(id)) {
      // Toggle off
      progressManager.uncompleteChallenge(id);
    } else {
      // Complete with duplicate reward protection
      progressManager.completeChallenge(id, challenge.xpReward);
    }
  };

  const challengeList = initialChallenges.map((c) => ({
    ...c,
    completed: isCompleted(c.id),
  }));

  const filteredChallenges = challengeList.filter((c) => {
    if (selectedDifficulty !== 'all' && c.difficulty !== selectedDifficulty) return false;
    if (selectedUnit !== 'all' && c.unitId !== selectedUnit) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchTags = c.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  const totalXP = challengeList.reduce((acc, c) => acc + c.xpReward, 0);
  const earnedXP = challengeList
    .filter((c) => c.completed)
    .reduce((acc, c) => acc + c.xpReward, 0);
  const completedCount = challengeList.filter((c) => c.completed).length;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Challenges"
        description="Master automata theory through practical problem-solving. Design automata, prove language boundaries, and test edge cases."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 border border-purple-100 dark:border-purple-900 text-purple-700 dark:text-purple-300 text-xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-purple-600 text-purple-600 dark:fill-purple-400 dark:text-purple-400" />
              <span>{earnedXP} / {totalXP} XP</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900 text-green-700 dark:text-green-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{completedCount}/{challengeList.length} Solved</span>
            </div>
          </div>
        }
      />

      {/* Filters and search */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search challenges, keywords, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>

          {/* Unit dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              aria-label="Filter by Syllabus Unit"
              className="text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Syllabus Units</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  Unit {u.number}: {u.shortTitle}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Difficulty pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 overflow-x-auto">
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-1">
            Difficulty:
          </span>
          {[
            { id: 'all', label: 'All Levels' },
            { id: 'easy', label: 'Easy' },
            { id: 'medium', label: 'Medium' },
            { id: 'hard', label: 'Hard' },
          ].map(({ id, label }) => {
            const count =
              id === 'all'
                ? challengeList.length
                : challengeList.filter((c) => c.difficulty === id).length;
            const isSelected = selectedDifficulty === id;
            return (
              <button
                key={id}
                onClick={() => setSelectedDifficulty(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                  isSelected
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                <span>{label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full',
                    isSelected
                      ? 'bg-primary-700 text-primary-100'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Challenge Grid */}
      {filteredChallenges.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8">
          <EmptyState
            icon={<Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
            title="No challenges found"
            description="Try clearing your search query or switching your difficulty and unit filters."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDifficulty('all');
                  setSelectedUnit('all');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredChallenges.map((challenge) => {
            const unit = getUnit(challenge.unitId);
            return (
              <div
                key={challenge.id}
                onClick={() => setActiveChallenge(challenge)}
                className={cn(
                  'group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer flex flex-col justify-between',
                  challenge.completed && 'border-green-200 dark:border-green-900/60 bg-green-50/20 dark:bg-green-950/10'
                )}
              >
                <div>
                  {/* Top row: Unit + Difficulty + XP */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/80 px-2 py-0.5 rounded-md">
                        {unit ? `Unit ${unit.number}` : 'Theory'}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-2 py-0.5 rounded-md',
                          difficultyColor[challenge.difficulty]
                        )}
                      >
                        {difficultyLabel[challenge.difficulty]}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                      <Star className="w-3.5 h-3.5 fill-purple-600 dark:fill-purple-400" />
                      +{challenge.xpReward} XP
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-1.5">
                    {challenge.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4 line-clamp-2">
                    {challenge.description}
                  </p>
                </div>

                {/* Footer: Tags + Completed status + Button */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {challenge.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleComplete(challenge.id, e)}
                      title={challenge.completed ? 'Mark as incomplete' : 'Mark as completed'}
                      aria-label={challenge.completed ? 'Mark as incomplete' : 'Mark as completed'}
                      className={cn(
                        'flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors',
                        challenge.completed
                          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {challenge.completed ? 'Solved' : 'Solve'}
                    </button>
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Details <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Challenge Detail Modal */}
      {activeChallenge && (
        <Modal
          isOpen={Boolean(activeChallenge)}
          onClose={() => setActiveChallenge(null)}
          title={activeChallenge.title}
          size="lg"
        >
          <div className="space-y-5">
            {/* Metadata banner */}
            <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl flex-wrap">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs font-semibold px-2.5 py-0.5 rounded-md',
                    difficultyColor[activeChallenge.difficulty]
                  )}
                >
                  {difficultyLabel[activeChallenge.difficulty]}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {getUnit(activeChallenge.unitId)?.title ?? 'Automata Theory'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                <Star className="w-4 h-4 fill-purple-600 dark:fill-purple-400" />
                Reward: {activeChallenge.xpReward} XP
              </div>
            </div>

            {/* Problem Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                Problem Description
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {activeChallenge.description}
              </p>
            </div>

            {/* Test cases / specification */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Sample Test Specification
              </h4>
              <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="py-2 px-3">Input String (w)</th>
                      <th className="py-2 px-3">Expected Result</th>
                      <th className="py-2 px-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-gray-700 dark:text-gray-300">
                    <tr>
                      <td className="py-2 px-3">"1001"</td>
                      <td className="py-2 px-3 text-green-600 dark:text-green-400 font-bold">ACCEPT</td>
                      <td className="py-2 px-3 font-sans text-gray-500">Matches pattern criteria</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">"010"</td>
                      <td className="py-2 px-3 text-red-600 dark:text-red-400 font-bold">REJECT</td>
                      <td className="py-2 px-3 font-sans text-gray-500">Violates suffix/structure</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">"ε" (empty string)</td>
                      <td className="py-2 px-3 text-red-600 dark:text-red-400 font-bold">REJECT</td>
                      <td className="py-2 px-3 font-sans text-gray-500">Base boundary case</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Interactive Attempt & Test Verification */}
            <div className="space-y-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                  Validate Input Against Criteria
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <History className="w-3.5 h-3.5" />
                  <span>{progressManager.getChallengeAttempts(activeChallenge.id)} Attempts</span>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 1001 or 01"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && testInput.trim()) {
                      // Run validation
                      const isEnding01 = testInput.endsWith('01');
                      const pass = activeChallenge.id === 'ch-1' ? isEnding01 : testInput.length % 2 === 0;
                      const msg = pass
                        ? `Input "${testInput}" passes formal constraints!`
                        : `Input "${testInput}" rejected: does not satisfy challenge criteria.`;
                      progressManager.recordChallengeAttempt(activeChallenge.id, testInput, pass, msg);
                      setLastTestResult({ passed: pass, message: msg });
                      setTestInput('');
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!testInput.trim()) return;
                    const isEnding01 = testInput.endsWith('01');
                    const pass = activeChallenge.id === 'ch-1' ? isEnding01 : testInput.length % 2 === 0;
                    const msg = pass
                      ? `Input "${testInput}" passes formal constraints!`
                      : `Input "${testInput}" rejected: does not satisfy challenge criteria.`;
                    progressManager.recordChallengeAttempt(activeChallenge.id, testInput, pass, msg);
                    setLastTestResult({ passed: pass, message: msg });
                    setTestInput('');
                  }}
                >
                  Test
                </Button>
              </div>

              {lastTestResult && (
                <div
                  className={cn(
                    'p-2.5 rounded-lg text-xs font-mono flex items-center justify-between',
                    lastTestResult.passed
                      ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                  )}
                >
                  <span>{lastTestResult.message}</span>
                  <span className="font-sans font-semibold text-[10px] uppercase">
                    {lastTestResult.passed ? 'ACCEPTED' : 'REJECTED'}
                  </span>
                </div>
              )}
            </div>

            {/* Hints Box */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-3.5 flex items-start gap-3">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-semibold">Instructor Hint:</p>
                <p className="leading-relaxed">
                  Start by determining the minimum number of states needed to memorize the required suffix or count modulo arithmetic.
                  Always test strings of length 0, 1, and 2 before finalizing state transitions.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant={activeChallenge.completed ? 'secondary' : 'outline'}
                size="sm"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => handleToggleComplete(activeChallenge.id)}
              >
                {activeChallenge.completed ? 'Mark Unsolved' : 'Mark as Solved'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveChallenge(null)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FlaskConical className="w-4 h-4" />}
                  onClick={() => {
                    setActiveChallenge(null);
                    navigate('/playground');
                  }}
                >
                  Open in Playground
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
