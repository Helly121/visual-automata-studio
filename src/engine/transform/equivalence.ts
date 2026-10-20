import { simulate } from '../simulate.ts';
import type { FiniteAutomaton } from '../types.ts';
import type { VerificationResult, VerificationSample } from './types.ts';

/**
 * Generate test strings over an alphabet up to maxLen (plus epsilon).
 */
function generateTestStrings(alphabet: string[], maxLen: number = 3): string[] {
  const cleanAlphabet = alphabet.filter((s) => s.length > 0 && s !== 'ε');
  if (cleanAlphabet.length === 0) return [''];

  const results: string[] = [''];
  let currentLevel: string[] = [''];

  for (let len = 1; len <= maxLen; len++) {
    const nextLevel: string[] = [];
    for (const prefix of currentLevel) {
      for (const char of cleanAlphabet) {
        const nextStr = prefix + char;
        nextLevel.push(nextStr);
        results.push(nextStr);
        if (results.length >= 60) return results; // Cap test set size
      }
    }
    currentLevel = nextLevel;
  }

  return results;
}

/**
 * Verify language equivalence between source and transformed machines
 * on representative input strings.
 */
export function verifyLanguageEquivalence(
  source: FiniteAutomaton,
  target: FiniteAutomaton,
  customStrings?: string[],
): VerificationResult {
  // Combine alphabet from both machines
  const combinedAlphabet = Array.from(
    new Set([...source.alphabet, ...target.alphabet].filter((s) => s !== 'ε')),
  );

  const testStringsSet = new Set<string>();
  testStringsSet.add(''); // Always test epsilon

  // Add generated strings
  for (const s of generateTestStrings(combinedAlphabet, 3)) {
    testStringsSet.add(s);
  }

  // Add custom sample strings if provided
  if (customStrings) {
    for (const s of customStrings) {
      testStringsSet.add(s);
    }
  }

  const samples: VerificationSample[] = [];
  let allMatch = true;

  for (const input of testStringsSet) {
    // Only test if input symbols are accepted by alphabet or string is empty
    const sourceSim = simulate(source, input);
    const targetSim = simulate(target, input);

    const sourceAccepted = sourceSim.accepted;
    const targetAccepted = targetSim.accepted;
    const matches = sourceAccepted === targetAccepted;

    if (!matches) {
      allMatch = false;
    }

    samples.push({
      input,
      displayInput: input === '' ? 'ε (empty string)' : `"${input}"`,
      sourceAccepted,
      targetAccepted,
      matches,
    });
  }

  const total = samples.length;
  const passed = samples.filter((s) => s.matches).length;

  const summaryMessage = allMatch
    ? `Language Equivalence Verified ✓ All ${total} sample strings produced identical acceptance behavior between the original and transformed automata.`
    : `Language Discrepancy Detected ✗ ${passed}/${total} test strings matched. Divergence found on one or more test inputs.`;

  return {
    allMatch,
    samples,
    summaryMessage,
  };
}
