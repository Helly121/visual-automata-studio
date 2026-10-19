import type { KnowledgeCheckQuestion } from './types';

/**
 * Normalizes text strings for comparison:
 * - Trims whitespace
 * - Converts to lowercase
 * - Normalizes Greek letters and common automata notation (ε, lambda, q_0 -> q0, empty set ∅ -> {})
 */
export function normalizeAnswer(text: string): string {
  if (!text) return '';
  let str = text.trim().toLowerCase();

  // Normalize epsilon representations
  str = str.replace(/\\epsilon|\\lambda|epsilon|eps|lambda|&epsilon;|&lambda;/g, 'ε');

  // Normalize state subscripts: q_0 -> q0, q_1 -> q1, etc.
  str = str.replace(/q_([0-9a-z]+)/g, 'q$1');

  // Normalize set delimiters and spacing
  str = str.replace(/\s+/g, ' ');
  str = str.replace(/\{\s*/g, '{').replace(/\s*\}/g, '}');

  // Normalize empty set
  if (str === '∅' || str === '\\emptyset' || str === '{}' || str === 'phi' || str === 'null') {
    return '∅';
  }

  return str;
}

export interface ValidationResult {
  isCorrect: boolean;
  feedback: string;
}

/**
 * Validates a knowledge check question response.
 */
export function validateQuestionAnswer(
  question: KnowledgeCheckQuestion,
  userAnswer: string,
): ValidationResult {
  switch (question.type) {
    case 'multiple-choice':
    case 'true-false': {
      if (!question.options) {
        return { isCorrect: false, feedback: 'Question options missing.' };
      }
      const selected = question.options.find((opt) => opt.id === userAnswer);
      if (!selected) {
        return { isCorrect: false, feedback: 'Please select an option.' };
      }
      return {
        isCorrect: selected.isCorrect,
        feedback: selected.explanation || question.explanation,
      };
    }

    case 'short-answer': {
      const normalizedUser = normalizeAnswer(userAnswer);
      if (!normalizedUser) {
        return { isCorrect: false, feedback: 'Please enter an answer.' };
      }

      const acceptableAnswers = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer ?? ''];

      const allAccepted = [
        ...acceptableAnswers,
        ...(question.acceptedAliases ?? []),
      ].map(normalizeAnswer);

      const isCorrect = allAccepted.includes(normalizedUser);

      return {
        isCorrect,
        feedback: isCorrect
          ? `Correct! ${question.explanation}`
          : `Incorrect. Expected: ${acceptableAnswers[0]}. ${question.explanation}`,
      };
    }

    default:
      return { isCorrect: false, feedback: 'Unknown question type.' };
  }
}
