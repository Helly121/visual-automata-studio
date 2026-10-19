import assert from 'node:assert';
import { normalizeAnswer, validateQuestionAnswer } from './evaluator.ts';
import { ProgressManager } from './progressStore.ts';
import { MemoryStorageAdapter } from './storageAdapter.ts';
import type { KnowledgeCheckQuestion } from './types.ts';
import type { Unit } from '../../types/index.ts';

console.log('--- RUNNING PHASE 3 LEARNING SUITE ---');

// 1. Normalization
assert.strictEqual(normalizeAnswer('  q0  '), 'q0');
assert.strictEqual(normalizeAnswer('Q0'), 'q0');
assert.strictEqual(normalizeAnswer('eps'), 'ε');
assert.strictEqual(normalizeAnswer('epsilon'), 'ε');
assert.strictEqual(normalizeAnswer('lambda'), 'ε');
assert.strictEqual(normalizeAnswer('\\epsilon'), 'ε');
assert.strictEqual(normalizeAnswer('q_0'), 'q0');
assert.strictEqual(normalizeAnswer('q_1'), 'q1');
assert.strictEqual(normalizeAnswer('q_abc'), 'qabc');
assert.strictEqual(normalizeAnswer('{}'), '∅');
assert.strictEqual(normalizeAnswer('phi'), '∅');
assert.strictEqual(normalizeAnswer('{ q0, q1 }'), '{q0, q1}');
console.log('✓ Normalization suite passed');

// 2. MCQ Validation
const mcqQ: KnowledgeCheckQuestion = {
  id: 'mcq-1',
  type: 'multiple-choice',
  prompt: 'Test prompt',
  options: [
    { id: 'opt-a', text: 'Option A', isCorrect: true, explanation: 'A is correct.' },
    { id: 'opt-b', text: 'Option B', isCorrect: false, explanation: 'B is wrong.' },
  ],
  explanation: 'General explanation.',
};

const rGood = validateQuestionAnswer(mcqQ, 'opt-a');
assert.strictEqual(rGood.isCorrect, true);
assert(rGood.feedback.includes('A is correct'));

const rBad = validateQuestionAnswer(mcqQ, 'opt-b');
assert.strictEqual(rBad.isCorrect, false);
assert(rBad.feedback.includes('B is wrong'));
console.log('✓ MCQ Validation passed');

// 3. Short Answer Validation with Greek symbols & state subscripts
const saEps: KnowledgeCheckQuestion = {
  id: 'sa-eps',
  type: 'short-answer',
  prompt: 'Empty string symbol?',
  correctAnswer: 'ε',
  acceptedAliases: ['eps', 'epsilon', 'lambda'],
  explanation: 'ε is the standard symbol.',
};
assert.strictEqual(validateQuestionAnswer(saEps, 'eps').isCorrect, true);
assert.strictEqual(validateQuestionAnswer(saEps, 'lambda').isCorrect, true);
assert.strictEqual(validateQuestionAnswer(saEps, 'epsilon').isCorrect, true);
assert.strictEqual(validateQuestionAnswer(saEps, '0').isCorrect, false);

const saState: KnowledgeCheckQuestion = {
  id: 'sa-state',
  type: 'short-answer',
  prompt: 'Start state?',
  correctAnswer: 'q0',
  explanation: 'q0 is the start state.',
};
assert.strictEqual(validateQuestionAnswer(saState, 'q_0').isCorrect, true);
assert.strictEqual(validateQuestionAnswer(saState, 'Q_0').isCorrect, true);
assert.strictEqual(validateQuestionAnswer(saState, 'q1').isCorrect, false);
console.log('✓ Short Answer Validation passed');

// 4. Duplicate XP Prevention Ledger
const storage = new MemoryStorageAdapter();
const pm = new ProgressManager(storage);

const rew1 = pm.completeLesson('lesson-1', 50);
assert.strictEqual(rew1.isNewReward, true);
assert.strictEqual(rew1.xpAwarded, 50);
assert.strictEqual(pm.getState().totalXP, 50);

// Repeated completion must award ZERO additional XP
const rew2 = pm.completeLesson('lesson-1', 50);
assert.strictEqual(rew2.isNewReward, false);
assert.strictEqual(rew2.xpAwarded, 0);
assert.strictEqual(pm.getState().totalXP, 50);

// Repeated challenge completion must award ZERO additional XP
const chRew1 = pm.completeChallenge('ch-1', 100);
assert.strictEqual(chRew1.isNewReward, true);
assert.strictEqual(chRew1.xpAwarded, 100);
assert.strictEqual(pm.getState().totalXP, 150);

const chRew2 = pm.completeChallenge('ch-1', 100);
assert.strictEqual(chRew2.isNewReward, false);
assert.strictEqual(chRew2.xpAwarded, 0);
assert.strictEqual(pm.getState().totalXP, 150);
console.log('✓ Strict Duplicate Reward Prevention passed');

// 5. Challenge Attempt Tracking
pm.recordChallengeAttempt('ch-1', '1001', true, 'Valid');
pm.recordChallengeAttempt('ch-1', '010', false, 'Invalid');
assert.strictEqual(pm.getChallengeAttempts('ch-1'), 2);
console.log('✓ Challenge Attempt Tracking passed');

// 6. Progress Calculations Across Units
const testUnits: Unit[] = [
  {
    id: 'u1', number: 1, title: 'Unit 1', shortTitle: 'U1', description: '', longDescription: '',
    color: 'blue', accentColor: 'blue', icon: 'Workflow', status: 'in-progress',
    estimatedHours: 4, topics: [], completedLessons: 0, totalLessons: 2,
    lessons: [
      { id: 'lesson-1', unitId: 'u1', order: 1, title: 'L1', description: '', duration: 10, topics: [], status: 'available' },
      { id: 'lesson-2', unitId: 'u1', order: 2, title: 'L2', description: '', duration: 10, topics: [], status: 'available' },
    ],
  },
];

const stats = pm.getProgressStats(testUnits);
assert.strictEqual(stats.completedLessonsCount, 1);
assert.strictEqual(stats.totalLessons, 2);
assert.strictEqual(stats.overallPercentage, 50);
console.log('✓ Progress Calculations passed');

// 7. Persistence & Corruption Recovery
storage.setItem('vas_learning_progress_v1', 'corrupt_data{{{{');
const recoveredPm = new ProgressManager(storage);
assert.strictEqual(recoveredPm.getState().version, 1);
assert.strictEqual(typeof recoveredPm.getState().totalXP, 'number');
console.log('✓ Storage Resilience & Corruption Recovery passed');

console.log('ALL PHASE 3 LEARNING ENGINE TESTS PASSED SUCCESSFULLY! 🎉');
