// ─── Machine Types ────────────────────────────────────────────────────────────

export type MachineType = 'dfa' | 'nfa' | 'enfa';

/** The special epsilon symbol — never a real input symbol. */
export const EPSILON = 'ε';

// ─── Core Mathematical Structures ────────────────────────────────────────────

/**
 * A state in the automaton.
 * `id` is the unique identifier; `label` is what is displayed.
 */
export interface FAState {
  id: string;
  label: string;
  isInitial: boolean;
  isAccepting: boolean;
}

/**
 * A single transition.
 * For ε-NFA, `symbol` may equal EPSILON.
 * For NFA/DFA, `symbol` must be a member of the alphabet.
 */
export interface FATransition {
  id: string;
  from: string;   // FAState.id
  to: string;     // FAState.id
  symbol: string; // alphabet symbol or EPSILON
}

/** Complete description of a finite automaton. */
export interface FiniteAutomaton {
  type: MachineType;
  states: FAState[];
  alphabet: string[]; // must not include EPSILON
  transitions: FATransition[];
  initialStateId: string | null;
  acceptingStateIds: string[];
}

// ─── Validation ───────────────────────────────────────────────────────────────

export type ValidationErrorKind =
  | 'NO_INITIAL_STATE'
  | 'MULTIPLE_INITIAL_STATES'
  | 'MISSING_TRANSITION'
  | 'NONDETERMINISM'
  | 'INVALID_SYMBOL'
  | 'DUPLICATE_STATE_ID'
  | 'EMPTY_ALPHABET';

export interface ValidationError {
  kind: ValidationErrorKind;
  message: string;
  stateId?: string;
  symbol?: string;
  transitionId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ─── Simulation ───────────────────────────────────────────────────────────────

/**
 * One snapshot in the execution trace.
 * For DFA: `activeStateIds` has exactly one element.
 * For NFA / ε-NFA: may have multiple or zero.
 */
export interface SimConfig {
  step: number;
  activeStateIds: string[];
  consumedSymbol?: string;
  remaining: string;
  traversedTransitionIds: string[];
  explanation: string;
}

export type SimStatus =
  | 'idle'
  | 'running'
  | 'accepted'
  | 'rejected'
  | 'invalid_input'
  | 'invalid_machine';

export interface SimResult {
  status: SimStatus;
  accepted: boolean;
  trace: SimConfig[];
  errorMessage?: string;
}

// ─── Editor Graph Node/Edge data payloads ────────────────────────────────────

export interface StateNodeData extends Record<string, unknown> {
  label: string;
  isInitial: boolean;
  isAccepting: boolean;
  isActive: boolean;
  isTraversed: boolean;
}

export interface TransitionEdgeData extends Record<string, unknown> {
  symbol: string;
  isActive: boolean;
}

// ─── Project Persistence ─────────────────────────────────────────────────────

export const PROJECT_FORMAT_VERSION = 1;

export interface SavedProject {
  formatVersion: number;
  savedAt: string;
  name: string;
  description: string;
  machine: FiniteAutomaton;
  nodePositions: Record<string, { x: number; y: number }>;
}
