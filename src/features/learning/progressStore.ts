import { useState, useEffect, useCallback } from 'react';
import type { LearningState, ChallengeSubmission } from './types.ts';
import { defaultStorage, MemoryStorageAdapter, type StorageAdapter } from './storageAdapter.ts';
import type { Unit } from '../../types/index.ts';

const STORAGE_KEY = 'vas_learning_progress_v1';

export const EMPTY_STATE: LearningState = {
  version: 1,
  completedLessons: {},
  completedChallenges: {},
  challengeAttempts: {},
  rewardedIds: [],
  totalXP: 0,
  streak: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
};

export const INITIAL_STATE: LearningState = {
  version: 1,
  completedLessons: {
    // Pre-populate initial syllabus baseline to preserve Phase 1 consistency
    'fa-01-alphabets': { completedAt: '2026-10-15T10:00:00Z', score: 100 },
    'fa-02-dfa': { completedAt: '2026-10-16T12:00:00Z', score: 100 },
    'fa-03-dfa-examples': { completedAt: '2026-10-17T14:00:00Z', score: 100 },
  },
  completedChallenges: {},
  challengeAttempts: {},
  rewardedIds: ['lesson:fa-01-alphabets', 'lesson:fa-02-dfa', 'lesson:fa-03-dfa-examples'],
  totalXP: 450,
  streak: 5,
  lastActiveDate: new Date().toISOString().split('T')[0],
};

export class ProgressManager {
  private adapter: StorageAdapter;
  private state: LearningState;
  private listeners: Set<() => void> = new Set();

  constructor(adapter: StorageAdapter = defaultStorage) {
    this.adapter = adapter;
    this.state = this.load();
  }

  public getState(): LearningState {
    return { ...this.state };
  }

  private getInitialState(): LearningState {
    if (this.adapter instanceof MemoryStorageAdapter) {
      return {
        ...EMPTY_STATE,
        completedLessons: {},
        completedChallenges: {},
        challengeAttempts: {},
        rewardedIds: [],
      };
    }
    return {
      ...INITIAL_STATE,
      completedLessons: { ...INITIAL_STATE.completedLessons },
      completedChallenges: { ...INITIAL_STATE.completedChallenges },
      challengeAttempts: { ...INITIAL_STATE.challengeAttempts },
      rewardedIds: [...INITIAL_STATE.rewardedIds],
    };
  }

  private load(): LearningState {
    try {
      const data = this.adapter.getItem(STORAGE_KEY);
      if (!data) return this.getInitialState();
      const parsed = JSON.parse(data) as LearningState;
      if (parsed.version !== 1) return this.getInitialState();
      return parsed;
    } catch {
      return this.getInitialState();
    }
  }

  private save(): void {
    try {
      this.adapter.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.notify();
    } catch (e) {
      console.warn('Error saving progress:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  /**
   * Completes a lesson and awards XP strictly once.
   * Duplicate completions will update the score if higher, but WILL NOT award duplicate XP.
   */
  public completeLesson(lessonId: string, _unitId?: string, score: number = 100): { isNewReward: boolean; xpAwarded: number } {
    const rewardKey = `lesson:${lessonId}`;
    const alreadyRewarded = this.state.rewardedIds.includes(rewardKey);
    const xpReward = alreadyRewarded ? 0 : 50;

    this.state.completedLessons[lessonId] = {
      completedAt: new Date().toISOString(),
      score: Math.max(score, this.state.completedLessons[lessonId]?.score ?? 0),
    };

    if (!alreadyRewarded) {
      this.state.rewardedIds.push(rewardKey);
      this.state.totalXP += xpReward;
    }

    this.updateStreak();
    this.save();
    return { isNewReward: !alreadyRewarded, xpAwarded: xpReward };
  }

  public isLessonCompleted(lessonId: string): boolean {
    return Boolean(this.state.completedLessons[lessonId]);
  }

  /**
   * Records an attempt on a challenge.
   */
  public recordChallengeAttempt(
    challengeId: string,
    input: string,
    isCorrect: boolean,
    feedback: string,
  ): void {
    const history = this.state.challengeAttempts[challengeId]?.history ?? [];
    const submission: ChallengeSubmission = {
      challengeId,
      input,
      isCorrect,
      timestamp: new Date().toISOString(),
      feedback,
    };

    const newAttemptsCount = (this.state.challengeAttempts[challengeId]?.attemptsCount ?? 0) + 1;
    this.state.challengeAttempts[challengeId] = {
      attemptsCount: newAttemptsCount,
      history: [submission, ...history].slice(0, 50), // keep recent 50
    };

    this.save();
  }

  /**
   * Completes a challenge.
   * Strictly prevents duplicate XP awards if already completed.
   */
  public completeChallenge(challengeId: string, xpReward: number): { isNewReward: boolean; xpAwarded: number } {
    const rewardKey = `challenge:${challengeId}`;
    const alreadyRewarded = this.state.rewardedIds.includes(rewardKey);
    const actualXP = alreadyRewarded ? 0 : xpReward;

    const attempts = this.state.challengeAttempts[challengeId]?.attemptsCount ?? 1;

    this.state.completedChallenges[challengeId] = {
      completedAt: new Date().toISOString(),
      attempts,
      xpAwarded: actualXP,
    };

    if (!alreadyRewarded) {
      this.state.rewardedIds.push(rewardKey);
      this.state.totalXP += actualXP;
    }

    this.updateStreak();
    this.save();
    return { isNewReward: !alreadyRewarded, xpAwarded: actualXP };
  }

  public isChallengeCompleted(challengeId: string): boolean {
    return Boolean(this.state.completedChallenges[challengeId]);
  }

  public uncompleteChallenge(challengeId: string): void {
    if (this.state.completedChallenges[challengeId]) {
      delete this.state.completedChallenges[challengeId];
      this.save();
    }
  }

  public getChallengeAttempts(challengeId: string): number {
    return this.state.challengeAttempts[challengeId]?.attemptsCount ?? 0;
  }

  private updateStreak(): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.state.lastActiveDate === today) return;

    const last = new Date(this.state.lastActiveDate);
    const current = new Date(today);
    const diffDays = Math.round((current.getTime() - last.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 1) {
      this.state.streak += 1;
    } else if (diffDays > 1) {
      this.state.streak = 1;
    }
    this.state.lastActiveDate = today;
  }

  /**
   * Computes reactive progress stats across units.
   */
  public getProgressStats(units: Unit[]) {
    let totalLessons = 0;
    let completedLessonsCount = 0;

    const unitProgress = units.map((u) => {
      const uTotal = u.lessons.length;
      totalLessons += uTotal;

      const uCompleted = u.lessons.filter((l) => this.isLessonCompleted(l.id)).length;
      completedLessonsCount += uCompleted;

      const pct = uTotal > 0 ? Math.round((uCompleted / uTotal) * 100) : 0;
      const status = pct === 100 ? 'completed' : pct > 0 ? 'in-progress' : u.status;

      return {
        unitId: u.id,
        totalLessons: uTotal,
        completedLessons: uCompleted,
        percentage: pct,
        status,
      };
    });

    const overallPercentage = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

    return {
      totalLessons,
      completedLessonsCount,
      overallPercentage,
      totalXP: this.state.totalXP,
      streak: this.state.streak,
      unitProgress,
    };
  }
}

export const progressManager = new ProgressManager(defaultStorage);

/**
 * React Hook for consuming and updating live learning progress.
 */
export function useLearningProgress() {
  const [state, setState] = useState<LearningState>(() => progressManager.getState());

  useEffect(() => {
    return progressManager.subscribe(() => {
      setState(progressManager.getState());
    });
  }, []);

  const completeLesson = useCallback((lessonId: string, unitId?: string, score?: number) => {
    return progressManager.completeLesson(lessonId, unitId, score);
  }, []);

  const completeChallenge = useCallback((challengeId: string, xpReward: number) => {
    return progressManager.completeChallenge(challengeId, xpReward);
  }, []);

  const recordChallengeAttempt = useCallback((
    challengeId: string,
    input: string,
    isCorrect: boolean,
    feedback: string,
  ) => {
    progressManager.recordChallengeAttempt(challengeId, input, isCorrect, feedback);
  }, []);

  const isLessonCompleted = useCallback((lessonId: string) => {
    return progressManager.isLessonCompleted(lessonId);
  }, []);

  const isChallengeCompleted = useCallback((challengeId: string) => {
    return progressManager.isChallengeCompleted(challengeId);
  }, []);

  const getChallengeAttempts = useCallback((challengeId: string) => {
    return progressManager.getChallengeAttempts(challengeId);
  }, []);

  const getProgressStats = useCallback((units: Unit[]) => {
    return progressManager.getProgressStats(units);
  }, []);

  return {
    state,
    completeLesson,
    completeChallenge,
    recordChallengeAttempt,
    isLessonCompleted,
    isChallengeCompleted,
    getChallengeAttempts,
    getProgressStats,
  };
}
