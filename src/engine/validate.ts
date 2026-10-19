import { EPSILON, type FiniteAutomaton, type ValidationError, type ValidationResult } from './types.ts';

/**
 * Validate a finite automaton definition.
 * Returns errors (must fix) and warnings (advisory).
 */
export function validateAutomaton(fa: FiniteAutomaton): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const stateIds = new Set<string>();
  const symbolSet = new Set<string>(fa.alphabet);

  // ── Duplicate state IDs ──────────────────────────────────────────────────
  for (const s of fa.states) {
    if (stateIds.has(s.id)) {
      errors.push({
        kind: 'DUPLICATE_STATE_ID',
        message: `Duplicate state id "${s.id}".`,
        stateId: s.id,
      });
    }
    stateIds.add(s.id);
  }

  // ── Empty alphabet ────────────────────────────────────────────────────────
  if (fa.alphabet.length === 0) {
    errors.push({ kind: 'EMPTY_ALPHABET', message: 'The alphabet must not be empty.' });
  }

  // ── Initial state ─────────────────────────────────────────────────────────
  const initialStates = fa.states.filter((s) => s.isInitial);
  if (initialStates.length === 0) {
    errors.push({ kind: 'NO_INITIAL_STATE', message: 'The automaton must have exactly one initial state.' });
  } else if (initialStates.length > 1) {
    errors.push({
      kind: 'MULTIPLE_INITIAL_STATES',
      message: `Multiple initial states: ${initialStates.map((s) => s.label).join(', ')}.`,
    });
  }

  // ── Transition symbol validity ────────────────────────────────────────────
  for (const t of fa.transitions) {
    if (t.symbol !== EPSILON && !symbolSet.has(t.symbol)) {
      errors.push({
        kind: 'INVALID_SYMBOL',
        message: `Transition "${t.id}" uses symbol "${t.symbol}" which is not in the alphabet.`,
        symbol: t.symbol,
        transitionId: t.id,
      });
    }
    // ε-transitions are only valid in ε-NFA
    if (t.symbol === EPSILON && fa.type !== 'enfa') {
      errors.push({
        kind: 'INVALID_SYMBOL',
        message: `Epsilon transition "${t.id}" is not allowed in a ${fa.type.toUpperCase()}.`,
        symbol: EPSILON,
        transitionId: t.id,
      });
    }
  }

  // ── DFA-specific: completeness + determinism ──────────────────────────────
  if (fa.type === 'dfa' && stateIds.size > 0 && fa.alphabet.length > 0) {
    for (const stateId of stateIds) {
      for (const sym of fa.alphabet) {
        const matches = fa.transitions.filter(
          (t) => t.from === stateId && t.symbol === sym,
        );
        if (matches.length === 0) {
          warnings.push({
            kind: 'MISSING_TRANSITION',
            message: `State "${fa.states.find((s) => s.id === stateId)?.label ?? stateId}" has no transition on "${sym}".`,
            stateId,
            symbol: sym,
          });
        } else if (matches.length > 1) {
          errors.push({
            kind: 'NONDETERMINISM',
            message: `State "${fa.states.find((s) => s.id === stateId)?.label ?? stateId}" has ${matches.length} transitions on "${sym}" (DFA must have at most one).`,
            stateId,
            symbol: sym,
          });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
