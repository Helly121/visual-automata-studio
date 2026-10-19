// ─── Unit / Module ───────────────────────────────────────────────────────────

export type UnitStatus = 'available' | 'in-progress' | 'completed' | 'coming-soon';

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  description: string;
  duration: number; // minutes
  order: number;
  status: 'available' | 'locked' | 'completed';
  topics: string[];
}

export interface Unit {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  longDescription: string;
  icon: string; // lucide icon name
  color: string; // tailwind color token
  accentColor: string;
  status: UnitStatus;
  lessons: Lesson[];
  totalLessons: number;
  completedLessons: number;
  estimatedHours: number;
  topics: string[];
}

// ─── Projects ────────────────────────────────────────────────────────────────

export type ProjectType = 'dfa' | 'nfa' | 'pda' | 'tm' | 'cfg' | 're';

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  unitId: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  stateCount?: number;
  transitionCount?: number;
}

// ─── Progress ────────────────────────────────────────────────────────────────

export interface UnitProgress {
  unitId: string;
  completedLessons: string[];
  lastAccessedAt: string;
  score?: number;
}

export interface UserProgress {
  userId: string;
  units: UnitProgress[];
  totalXP: number;
  streak: number;
  lastActiveAt: string;
}

// ─── Challenges ──────────────────────────────────────────────────────────────

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  unitId: string;
  difficulty: ChallengeDifficulty;
  xpReward: number;
  completed: boolean;
  tags: string[];
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  to: string;
  icon: string;
  end?: boolean;
}

// ─── Example Automata ────────────────────────────────────────────────────────

export interface ExampleAutomaton {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  unitId: string;
  language: string;
}
