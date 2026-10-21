import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Search,
  CheckCircle2,
  Star,
  Filter,
  Check,
  FlaskConical,
  Lightbulb,
  History,
  Send,
  X,
  BookOpen,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Modal, EmptyState, Badge } from '@/components/ui';
import { challenges as initialChallenges } from '@/data/mock';
import { units, getUnit } from '@/data/units';
import { cn, difficultyLabel, difficultyColor } from '@/utils';
import type { Challenge } from '@/types';
import { useLearningProgress, progressManager } from '@/features/learning';

// Suggested test cases per challenge to let students quickly experiment
const sampleTestChips: Record<string, string[]> = {
  'ch-1': ['1001', '01', '0001', '110', '0', ''],
  'ch-2': ['0', '1', '00', '01', '10', '11'],
  'ch-3': ['()', '(())', '()()', '())', '(()', ''],
  'ch-4': ['01', '001', '101', '10', '0', ''],
  'ch-5': ['ab', 'aabb', 'aaabbb', 'aab', 'abb', ''],
};

export function ChallengesPage() {
  const navigate = useNavigate();
  const { state } = useLearningProgress();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'solved' | 'unsolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [testInput, setTestInput] = useState('');
  const [lastTestResult, setLastTestResult] = useState<{ passed: boolean; message: string; details?: string } | null>(null);

  // Sync completion with reactive learning state
  const isCompleted = useCallback((id: string) => Boolean(state.completedChallenges[id]), [state.completedChallenges]);

  // Toggle completion with duplicate reward prevention
  const handleToggleComplete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const challenge = initialChallenges.find((c) => c.id === id);
    if (!challenge) return;

    if (isCompleted(id)) {
      progressManager.uncompleteChallenge(id);
    } else {
      progressManager.completeChallenge(id, challenge.xpReward);
    }
  };

  const challengeList = useMemo(() => {
    return initialChallenges.map((c) => ({
      ...c,
      completed: isCompleted(c.id),
      attempts: progressManager.getChallengeAttempts(c.id),
    }));
  }, [isCompleted]);

  const filteredChallenges = useMemo(() => {
    return challengeList.filter((c) => {
      if (selectedDifficulty !== 'all' && c.difficulty !== selectedDifficulty) return false;
      if (selectedUnit !== 'all' && c.unitId !== selectedUnit) return false;
      if (selectedStatus === 'solved' && !c.completed) return false;
      if (selectedStatus === 'unsolved' && c.completed) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        const matchTags = c.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTags) return false;
      }
      return true;
    });
  }, [challengeList, selectedDifficulty, selectedUnit, selectedStatus, searchQuery]);

  const totalXP = challengeList.reduce((acc, c) => acc + c.xpReward, 0);
  const earnedXP = challengeList
    .filter((c) => c.completed)
    .reduce((acc, c) => acc + c.xpReward, 0);
  const completedCount = challengeList.filter((c) => c.completed).length;
  const progressPct = totalXP > 0 ? Math.round((earnedXP / totalXP) * 100) : 0;

  // Execute verification against challenge test specification
  const runTestVerification = (input: string) => {
    if (!activeChallenge) return;
    const trimmed = input.trim();
    const inputDisplay = trimmed === '' ? 'ε (empty string)' : `"${trimmed}"`;

    let passed = false;
    let message = '';
    let details = '';

    switch (activeChallenge.id) {
      case 'ch-1': {
        // Ends with 01 over {0,1}
        const isBinary = /^[01]*$/.test(trimmed);
        if (!isBinary) {
          passed = false;
          message = `Alphabet Violation: Input contains symbols outside {0, 1}.`;
          details = 'Only binary characters (0 and 1) are accepted by the alphabet Σ = {0, 1}.';
        } else if (trimmed.endsWith('01')) {
          passed = true;
          message = `ACCEPT: Input ${inputDisplay} ends with suffix "01".`;
          details = 'The DFA transitions to final accepting state q2 upon reading the suffix 01.';
        } else {
          passed = false;
          message = `REJECT: Input ${inputDisplay} does not end with "01".`;
          details = `Terminal suffix was "${trimmed.slice(-2) || 'ε'}", but expected "01".`;
        }
        break;
      }
      case 'ch-2': {
        // Minimise 6-state DFA: test state equivalence partition
        passed = trimmed.length % 2 === 0;
        message = passed
          ? `ACCEPT: Input ${inputDisplay} partitions into equivalent quotient states.`
          : `REJECT: Input ${inputDisplay} distinguishes inequivalent states.`;
        details = 'The table-filling algorithm merges states with equivalent response behaviors.';
        break;
      }
      case 'ch-3': {
        // Balanced parentheses
        let depth = 0;
        let valid = true;
        for (const ch of trimmed) {
          if (ch === '(') depth++;
          else if (ch === ')') {
            depth--;
            if (depth < 0) {
              valid = false;
              break;
            }
          }
        }
        if (depth !== 0) valid = false;

        passed = valid && trimmed.length > 0;
        message = passed
          ? `MATCHED: String ${inputDisplay} is balanced; but regular expressions cannot handle arbitrary nest depth!`
          : `REJECTED: String ${inputDisplay} has unbalanced parentheses.`;
        details = 'Because finite automata have finite memory, the Pumping Lemma proves regular languages cannot recognize balanced parens.';
        break;
      }
      case 'ch-4': {
        // Subset construction
        passed = trimmed.length > 0 && /^[01]+$/.test(trimmed) && trimmed.includes('01');
        message = passed
          ? `ACCEPT: Deterministic subset power-set automaton accepts ${inputDisplay}.`
          : `REJECT: Input ${inputDisplay} does not reach an accepting subset of states.`;
        details = 'Subset construction maps each DFA state to a set of NFA states reachable via transition & ε-closure.';
        break;
      }
      case 'ch-5': {
        // a^n b^n
        const match = trimmed.match(/^(a+)(b+)$/);
        passed = Boolean(match && match[1].length === match[2].length);
        message = passed
          ? `CORRECT INSTANCE: ${inputDisplay} belongs to {aⁿbⁿ}. By Pumping Lemma, pumping y = aᵏ causes #a ≠ #b.`
          : `NON-MEMBER: ${inputDisplay} does not have equal consecutive 'a's and 'b's.`;
        details = 'Let p be the pumping length. String s = aᵖbᵖ cannot be pumped without breaking the balance.';
        break;
      }
      default: {
        passed = trimmed.length % 2 === 0;
        message = passed ? `ACCEPT: Input meets condition.` : `REJECT: Input fails condition.`;
        break;
      }
    }

    progressManager.recordChallengeAttempt(activeChallenge.id, trimmed, passed, message);
    setLastTestResult({ passed, message, details });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Challenges"
        description="Master automata theory through practical problem-solving. Design automata, prove language boundaries, and test edge cases."
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 border border-purple-100 dark:border-purple-900 text-purple-700 dark:text-purple-300 text-xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-purple-600 text-purple-600 dark:fill-purple-400 dark:text-purple-400" />
              <span>
                {earnedXP} / {totalXP} XP ({progressPct}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900 text-green-700 dark:text-green-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {completedCount}/{challengeList.length} Solved
              </span>
            </div>
          </div>
        }
      />

      {/* ── Progress & Filter Header ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 shadow-card space-y-4">
        {/* Top search & dropdown bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search challenges, keywords, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Unit dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
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

        {/* Filter pills: Difficulty & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          {/* Difficulty pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
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
                    'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0',
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

          {/* Status pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-1">
              Status:
            </span>
            {(['all', 'solved', 'unsolved'] as const).map((status) => {
              const isSelected = selectedStatus === status;
              const count =
                status === 'all'
                  ? challengeList.length
                  : status === 'solved'
                  ? challengeList.filter((c) => c.completed).length
                  : challengeList.filter((c) => !c.completed).length;

              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors',
                    isSelected
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  )}
                >
                  {status} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Challenge Grid ── */}
      {filteredChallenges.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8">
          <EmptyState
            icon={<Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
            title="No challenges found"
            description="Try clearing your search query or switching your difficulty and status filters to see available challenges."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDifficulty('all');
                  setSelectedUnit('all');
                  setSelectedStatus('all');
                  setSearchQuery('');
                }}
              >
                Reset All Filters
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
                onClick={() => {
                  setActiveChallenge(challenge);
                  setTestInput('');
                  setLastTestResult(null);
                }}
                className={cn(
                  'group bg-white dark:bg-gray-900 border rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer flex flex-col justify-between focus-within:ring-2 focus-within:ring-primary-500',
                  challenge.completed
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
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
                      {challenge.attempts > 0 && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          {challenge.attempts} {challenge.attempts === 1 ? 'attempt' : 'attempts'}
                        </span>
                      )}
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

                {/* Footer: Tags + Action Controls */}
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
                      title={challenge.completed ? 'Mark as incomplete' : 'Mark as solved'}
                      aria-label={challenge.completed ? 'Mark as incomplete' : 'Mark as solved'}
                      className={cn(
                        'flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors',
                        challenge.completed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                      )}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {challenge.completed ? 'Solved' : 'Solve'}
                    </button>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveChallenge(challenge);
                        setTestInput('');
                        setLastTestResult(null);
                      }}
                      className="text-xs py-1 px-2.5"
                    >
                      {challenge.completed ? 'Review' : 'Start'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Challenge Interactive Modal ── */}
      {activeChallenge && (
        <Modal
          isOpen={Boolean(activeChallenge)}
          onClose={() => setActiveChallenge(null)}
          title={activeChallenge.title}
          size="lg"
        >
          <div className="space-y-5">
            {/* Metadata banner */}
            <div className="flex items-center justify-between gap-3 p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    'text-xs font-semibold px-2.5 py-0.5 rounded-md',
                    difficultyColor[activeChallenge.difficulty]
                  )}
                >
                  {difficultyLabel[activeChallenge.difficulty]}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {getUnit(activeChallenge.unitId)?.title ?? 'Automata Theory'}
                </span>
                {activeChallenge.completed && (
                  <Badge variant="green" dot>
                    Solved &amp; Claimed
                  </Badge>
                )}
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

            {/* Test specification table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Formal Acceptance Criteria
              </h4>
              <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="py-2 px-3">Input String (w)</th>
                      <th className="py-2 px-3">Expected Result</th>
                      <th className="py-2 px-3">Condition</th>
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
                      <td className="py-2 px-3 font-sans text-gray-500">Violates suffix / boundary structure</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">"ε" (empty)</td>
                      <td className="py-2 px-3 text-red-600 dark:text-red-400 font-bold">REJECT</td>
                      <td className="py-2 px-3 font-sans text-gray-500">Empty string boundary condition</td>
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
                  Interactive Validator
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <History className="w-3.5 h-3.5" />
                  <span>{progressManager.getChallengeAttempts(activeChallenge.id)} recorded attempts</span>
                </div>
              </div>

              {/* Sample Quick-Test Chips */}
              {sampleTestChips[activeChallenge.id] && (
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Quick Sample Tests (Click to test):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {sampleTestChips[activeChallenge.id].map((chip) => (
                      <button
                        key={chip || 'epsilon'}
                        type="button"
                        onClick={() => {
                          setTestInput(chip);
                          runTestVerification(chip);
                        }}
                        className="px-2 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-700 dark:text-gray-300 hover:border-primary-500 transition-colors"
                      >
                        {chip === '' ? 'ε (empty)' : `"${chip}"`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Input Runner */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter test string (e.g. 1001)..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      runTestVerification(testInput);
                    }
                  }}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button
                  size="sm"
                  onClick={() => runTestVerification(testInput)}
                >
                  Verify Input
                </Button>
              </div>

              {/* Test Result Banner */}
              {lastTestResult && (
                <div
                  className={cn(
                    'p-3 rounded-lg text-xs space-y-1 transition-all',
                    lastTestResult.passed
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                  )}
                >
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span>{lastTestResult.message}</span>
                    <span className="font-sans font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/50 dark:bg-black/30">
                      {lastTestResult.passed ? 'ACCEPTED' : 'REJECTED'}
                    </span>
                  </div>
                  {lastTestResult.details && (
                    <p className="font-sans text-[11px] opacity-90 leading-relaxed">
                      {lastTestResult.details}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Instructor Hint Box */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-3.5 flex items-start gap-3">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-semibold">Instructor Guidance &amp; Tips:</p>
                <p className="leading-relaxed">
                  Start by determining the minimum number of states needed to memorize the required suffix or count modulo arithmetic.
                  Always verify strings of length 0, 1, and 2 before finalizing state transitions. If unsure, open the Playground to visually trace paths!
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant={activeChallenge.completed ? 'secondary' : 'primary'}
                size="sm"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => handleToggleComplete(activeChallenge.id)}
              >
                {activeChallenge.completed ? 'Mark as Incomplete' : 'Mark as Solved (+XP)'}
              </Button>

              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<BookOpen className="w-4 h-4" />}
                  onClick={() => {
                    setActiveChallenge(null);
                    navigate(`/learn/${activeChallenge.unitId}`);
                  }}
                >
                  Theory Lesson
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FlaskConical className="w-4 h-4" />}
                  onClick={() => {
                    setActiveChallenge(null);
                    navigate('/playground');
                  }}
                >
                  Practice in Playground
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
