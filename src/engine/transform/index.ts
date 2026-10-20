export * from './types.ts';
export * from './equivalence.ts';
export * from './epsilon-closure.ts';
export * from './subset-construction.ts';
export * from './minimization.ts';
export * from './presets.ts';
export * from './layout.ts';

import type { FiniteAutomaton } from '../types.ts';
import type { TransformationResult, TransformationType } from './types.ts';
import { runSubsetConstruction } from './subset-construction.ts';
import { runDfaMinimization } from './minimization.ts';
import { convertENFAToNFA, runEpsilonClosureAnalysis } from './epsilon-closure.ts';

/**
 * Dispatcher to execute the specified transformation on a finite automaton.
 */
export function executeTransformation(
  fa: FiniteAutomaton,
  type: TransformationType,
): TransformationResult {
  switch (type) {
    case 'nfa-to-dfa':
    case 'enfa-to-dfa':
      return runSubsetConstruction(fa);
    case 'enfa-to-nfa':
      return convertENFAToNFA(fa);
    case 'dfa-minimization':
      return runDfaMinimization(fa);
    case 'epsilon-closure':
      return runEpsilonClosureAnalysis(fa);
    default:
      throw new Error(`Unsupported transformation type: ${type as string}`);
  }
}
