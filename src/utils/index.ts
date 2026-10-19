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
