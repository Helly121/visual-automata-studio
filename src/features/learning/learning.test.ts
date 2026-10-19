/**
 * Phase 3 Learning Engine — Test Suite
 *
 * Tests:
 *  1. Answer normalization (epsilon variants, state subscripts, spacing)
 *  2. MCQ / True-False validation
 *  3. Short-answer validation with aliases
 *  4. Duplicate XP prevention for lessons and challenges
 *  5. Attempt counter increments
 *  6. Overall syllabus percentage and unit progress calculation
 *  7. Storage adapter persistence and corruption recovery
 */

import { describe, it, expect } from 'vitest';
import { normalizeAnswer, validateQuestionAnswer } from './evaluator';
import { ProgressManager } from './progressStore';
import { MemoryStorageAdapter } from './storageAdapter';
import type { KnowledgeCheckQuestion } from './types';
import type { Unit } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFreshManager(): ProgressManager {
  return new ProgressManager(new MemoryStorageAdapter());
}

const mockUnits: Unit[] = [
  {
    id: 'u1',
    number: 1,
    title: 'Unit 1',
    shortTitle: 'U1',
    description: '',
    longDescription: '',
    color: 'blue',
    accentColor: 'blue',
    icon: 'Workflow',
    status: 'in-progress',
    estimatedHours: 4,
    topics: [],
    completedLessons: 0,
    totalLessons: 3,
    lessons: [
      { id: 'l1', unitId: 'u1', order: 1, title: 'L1', description: '', duration: 10, topics: [], status: 'available' },
      { id: 'l2', unitId: 'u1', order: 2, title: 'L2', description: '', duration: 10, topics: [], status: 'available' },
      { id: 'l3', unitId: 'u1', order: 3, title: 'L3', description: '', duration: 10, topics: [], status: 'available' },
    ],
  },
  {
    id: 'u2',
    number: 2,
    title: 'Unit 2',
    shortTitle: 'U2',
    description: '',
    longDescription: '',
    color: 'violet',
    accentColor: 'violet',
    icon: 'GitBranch',
    status: 'available',
    estimatedHours: 4,
    topics: [],
    completedLessons: 0,
    totalLessons: 2,
    lessons: [
      { id: 'l4', unitId: 'u2', order: 1, title: 'L4', description: '', duration: 10, topics: [], status: 'available' },
      { id: 'l5', unitId: 'u2', order: 2, title: 'L5', description: '', duration: 10, topics: [], status: 'available' },
    ],
  },
];

// ─── 1. Answer Normalization ─────────────────────────────────────────────────

describe('normalizeAnswer', () => {
  it('trims whitespace', () => {
    expect(normalizeAnswer('  q0  ')).toBe('q0');
  });

  it('lowercases', () => {
    expect(normalizeAnswer('Q0')).toBe('q0');
  });

  it('normalizes epsilon representations', () => {
    expect(normalizeAnswer('eps')).toBe('ε');
    expect(normalizeAnswer('epsilon')).toBe('ε');
    expect(normalizeAnswer('lambda')).toBe('ε');
    expect(normalizeAnswer('\\epsilon')).toBe('ε');
  });

  it('normalizes state subscripts q_0 -> q0', () => {
    expect(normalizeAnswer('q_0')).toBe('q0');
    expect(normalizeAnswer('q_1')).toBe('q1');
    expect(normalizeAnswer('q_abc')).toBe('qabc');
  });

  it('normalizes empty set representations', () => {
    expect(normalizeAnswer('∅')).toBe('∅');
    expect(normalizeAnswer('\\emptyset')).toBe('∅');
    expect(normalizeAnswer('{}')).toBe('∅');
    expect(normalizeAnswer('phi')).toBe('∅');
    expect(normalizeAnswer('null')).toBe('∅');
  });

  it('normalizes set brackets and internal spacing', () => {
    expect(normalizeAnswer('{ q0, q1 }')).toBe('{q0, q1}');
    expect(normalizeAnswer('{  q0  }')).toBe('{q0}');
  });
});

// ─── 2. MCQ Validation ───────────────────────────────────────────────────────

const mcqQ: KnowledgeCheckQuestion = {
  id: 'mcq-test',
  type: 'multiple-choice',
  prompt: 'Test',
  options: [
    { id: 'a', text: 'A', isCorrect: true, explanation: 'A is correct.' },
    { id: 'b', text: 'B', isCorrect: false, explanation: 'B is wrong.' },
  ],
  explanation: 'General explanation.',
};

describe('validateQuestionAnswer – MCQ', () => {
  it('accepts the correct option', () => {
    const r = validateQuestionAnswer(mcqQ, 'a');
    expect(r.isCorrect).toBe(true);
    expect(r.feedback).toContain('A is correct');
  });

  it('rejects an incorrect option', () => {
    const r = validateQuestionAnswer(mcqQ, 'b');
    expect(r.isCorrect).toBe(false);
    expect(r.feedback).toContain('B is wrong');
  });

  it('rejects an empty answer', () => {
    const r = validateQuestionAnswer(mcqQ, '');
    expect(r.isCorrect).toBe(false);
  });
});

// ─── 3. Short-Answer Validation ──────────────────────────────────────────────

const saQ: KnowledgeCheckQuestion = {
  id: 'sa-test',
  type: 'short-answer',
  prompt: 'What is |ε|?',
  correctAnswer: '0',
  acceptedAliases: ['zero'],
  explanation: 'The empty string has length 0.',
};

describe('validateQuestionAnswer – Short Answer', () => {
  it('accepts exact numeric answer', () => {
    expect(validateQuestionAnswer(saQ, '0').isCorrect).toBe(true);
  });

  it('accepts alias "zero"', () => {
    expect(validateQuestionAnswer(saQ, 'zero').isCorrect).toBe(true);
  });

  it('rejects wrong answer', () => {
    expect(validateQuestionAnswer(saQ, '1').isCorrect).toBe(false);
  });

  it('accepts epsilon via normalized alias for epsilon question', () => {
    const epsilonQ: KnowledgeCheckQuestion = {
      id: 'sa-eps',
      type: 'short-answer',
      prompt: 'What symbol denotes the empty string?',
      correctAnswer: 'ε',
      acceptedAliases: ['eps', 'epsilon', 'lambda'],
      explanation: 'ε is the empty string.',
    };
    expect(validateQuestionAnswer(epsilonQ, 'eps').isCorrect).toBe(true);
    expect(validateQuestionAnswer(epsilonQ, 'lambda').isCorrect).toBe(true);
    expect(validateQuestionAnswer(epsilonQ, 'epsilon').isCorrect).toBe(true);
  });

  it('short-answer recognizes q_0 as q0', () => {
    const stateQ: KnowledgeCheckQuestion = {
      id: 'sa-state',
      type: 'short-answer',
      prompt: 'Start state?',
      correctAnswer: 'q0',
      explanation: 'q0 is the start state.',
    };
    expect(validateQuestionAnswer(stateQ, 'q_0').isCorrect).toBe(true);
    expect(validateQuestionAnswer(stateQ, 'Q_0').isCorrect).toBe(true); // case insensitive
  });
});

// ─── 4. Duplicate XP Prevention ──────────────────────────────────────────────

describe('ProgressManager – duplicate XP prevention', () => {
  it('awards XP exactly once for the same lesson', () => {
    const mgr = makeFreshManager();
    const r1 = mgr.completeLesson('lesson-1');
    const r2 = mgr.completeLesson('lesson-1');
    const r3 = mgr.completeLesson('lesson-1');

    expect(r1.isNewReward).toBe(true);
    expect(r1.xpAwarded).toBe(50);
    expect(r2.isNewReward).toBe(false);
    expect(r2.xpAwarded).toBe(0);
    expect(r3.xpAwarded).toBe(0);

    // Total XP = initial (0 for fresh MemoryAdapter) + 50 once
    expect(mgr.getState().totalXP).toBe(50);
  });

  it('awards XP exactly once for the same challenge', () => {
    const mgr = makeFreshManager();
    const r1 = mgr.completeChallenge('ch-1', 100);
    const r2 = mgr.completeChallenge('ch-1', 100);

    expect(r1.isNewReward).toBe(true);
    expect(r1.xpAwarded).toBe(100);
    expect(r2.isNewReward).toBe(false);
    expect(r2.xpAwarded).toBe(0);

    expect(mgr.getState().totalXP).toBe(100);
  });

  it('rewards different lessons independently', () => {
    const mgr = makeFreshManager();
    mgr.completeLesson('lesson-a');
    mgr.completeLesson('lesson-b');
    expect(mgr.getState().totalXP).toBe(100); // 50 + 50
  });
});

// ─── 5. Attempt Counter ───────────────────────────────────────────────────────

describe('ProgressManager – attempt tracking', () => {
  it('increments attempt count on each recordChallengeAttempt call', () => {
    const mgr = makeFreshManager();
    mgr.recordChallengeAttempt('ch-x', 'w=01', false, 'incorrect');
    mgr.recordChallengeAttempt('ch-x', 'w=00', false, 'incorrect again');
    mgr.recordChallengeAttempt('ch-x', 'w=11', true, 'correct!');

    expect(mgr.getChallengeAttempts('ch-x')).toBe(3);
  });

  it('keeps at most 50 entries in history', () => {
    const mgr = makeFreshManager();
    for (let i = 0; i < 55; i++) {
      mgr.recordChallengeAttempt('ch-overflow', `w${i}`, false, 'nope');
    }
    const history = mgr.getState().challengeAttempts['ch-overflow'].history;
    expect(history.length).toBe(50);
  });
});

// ─── 6. Progress Calculations ────────────────────────────────────────────────

describe('ProgressManager – progress stats', () => {
  it('returns 0% when no lessons are completed', () => {
    const mgr = makeFreshManager();
    const stats = mgr.getProgressStats(mockUnits);
    expect(stats.overallPercentage).toBe(0);
    expect(stats.completedLessonsCount).toBe(0);
  });

  it('calculates unit-level percentage correctly', () => {
    const mgr = makeFreshManager();
    mgr.completeLesson('l1');
    mgr.completeLesson('l2');
    // 2 of 3 in unit 1 = 67%
    const stats = mgr.getProgressStats(mockUnits);
    const u1 = stats.unitProgress.find((u) => u.unitId === 'u1')!;
    expect(u1.completedLessons).toBe(2);
    expect(u1.percentage).toBe(67);
  });

  it('calculates overall syllabus percentage across units', () => {
    const mgr = makeFreshManager();
    mgr.completeLesson('l1');
    mgr.completeLesson('l2');
    mgr.completeLesson('l3');
    mgr.completeLesson('l4');
    // 4 of 5 total = 80%
    const stats = mgr.getProgressStats(mockUnits);
    expect(stats.overallPercentage).toBe(80);
    expect(stats.totalLessons).toBe(5);
  });

  it('marks a unit as completed when all lessons are done', () => {
    const mgr = makeFreshManager();
    mgr.completeLesson('l4');
    mgr.completeLesson('l5');
    const stats = mgr.getProgressStats(mockUnits);
    const u2 = stats.unitProgress.find((u) => u.unitId === 'u2')!;
    expect(u2.status).toBe('completed');
  });
});

// ─── 7. Storage Adapter Persistence and Corruption Recovery ─────────────────

describe('MemoryStorageAdapter', () => {
  it('persists state between reads in the same session', () => {
    const adapter = new MemoryStorageAdapter();
    adapter.setItem('key', '{"value": 42}');
    expect(adapter.getItem('key')).toBe('{"value": 42}');
  });

  it('returns null for missing keys', () => {
    const adapter = new MemoryStorageAdapter();
    expect(adapter.getItem('nonexistent')).toBeNull();
  });

  it('ProgressManager recovers from corrupted storage (bad JSON)', () => {
    const adapter = new MemoryStorageAdapter();
    adapter.setItem('vas_learning_progress_v1', 'NOT_VALID_JSON{{{');
    const mgr = new ProgressManager(adapter);
    // Should fall back to INITIAL_STATE without throwing
    const s = mgr.getState();
    expect(s.version).toBe(1);
    expect(typeof s.totalXP).toBe('number');
  });

  it('ProgressManager recovers from wrong version', () => {
    const adapter = new MemoryStorageAdapter();
    adapter.setItem('vas_learning_progress_v1', JSON.stringify({ version: 99 }));
    const mgr = new ProgressManager(adapter);
    expect(mgr.getState().version).toBe(1);
  });
});
