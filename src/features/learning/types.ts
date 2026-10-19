export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer';

export interface KnowledgeCheckOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface KnowledgeCheckQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: KnowledgeCheckOption[]; // for multiple-choice and true-false
  correctAnswer?: string | string[]; // for short-answer: accepted answers or regex patterns
  acceptedAliases?: string[]; // alternative equivalent representations (e.g., ['eps', 'lambda', 'ε'])
  explanation: string;
  hints?: string[];
  points?: number;
}

export interface StepWorkedExample {
  id: string;
  title: string;
  problemStatement: string;
  steps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    formulaOrCode?: string;
    explanation: string;
  }>;
  conclusion: string;
}

export interface ChallengeSubmission {
  challengeId: string;
  input: string;
  isCorrect: boolean;
  timestamp: string;
  feedback: string;
}

export interface LearningState {
  version: number;
  completedLessons: Record<string, { completedAt: string; score: number }>;
  completedChallenges: Record<string, { completedAt: string; attempts: number; xpAwarded: number }>;
  challengeAttempts: Record<string, { attemptsCount: number; history: ChallengeSubmission[] }>;
  rewardedIds: string[]; // Strict ledger of IDs for which XP was awarded to prevent duplicate rewards
  totalXP: number;
  streak: number;
  lastActiveDate: string;
}
