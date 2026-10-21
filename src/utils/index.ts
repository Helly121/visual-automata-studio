import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getProgressPercentage(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export const projectTypeLabel: Record<string, string> = {
  dfa: 'DFA',
  nfa: 'NFA',
  pda: 'PDA',
  tm: 'Turing Machine',
  cfg: 'CFG',
  re: 'Regex',
};

export const difficultyLabel: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export const difficultyColor: Record<string, string> = {
  easy: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950',
  medium: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950',
  hard: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950',
};

export interface RankInfo {
  level: number;
  title: string;
  nextLevelXP: number;
  currentLevelBaseXP: number;
  progressPercent: number;
}

export function getRankInfo(xp: number): RankInfo {
  const levels = [
    { level: 1, title: 'Novice Learner', baseXP: 0, nextXP: 100 },
    { level: 2, title: 'Automaton Apprentice', baseXP: 100, nextXP: 300 },
    { level: 3, title: 'State Explorer', baseXP: 300, nextXP: 600 },
    { level: 4, title: 'Grammar Craftsman', baseXP: 600, nextXP: 1000 },
    { level: 5, title: 'Turing Pioneer', baseXP: 1000, nextXP: 1500 },
    { level: 6, title: 'Master of Computation', baseXP: 1500, nextXP: 2500 },
  ];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].baseXP) {
      const cur = levels[i];
      const range = cur.nextXP - cur.baseXP;
      const progressInLevel = Math.max(0, xp - cur.baseXP);
      const progressPercent = Math.min(100, Math.round((progressInLevel / range) * 100));
      return {
        level: cur.level,
        title: cur.title,
        nextLevelXP: cur.nextXP,
        currentLevelBaseXP: cur.baseXP,
        progressPercent,
      };
    }
  }

  return {
    level: 1,
    title: 'Novice Learner',
    nextLevelXP: 100,
    currentLevelBaseXP: 0,
    progressPercent: 0,
  };
}

