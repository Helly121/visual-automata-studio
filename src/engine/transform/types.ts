import type { FiniteAutomaton, FATransition } from '../types.ts';

export type TransformationType =
  | 'nfa-to-dfa'
  | 'enfa-to-dfa'
  | 'enfa-to-nfa'
  | 'dfa-minimization'
  | 'epsilon-closure';

export type TransformationPhase =
  | 'init'
  | 'prune-unreachable'
  | 'complete-transitions'
  | 'epsilon-closure'
  | 'base-distinguish'
  | 'inductive-step'
  | 'partition'
  | 'subset-expand'
  | 'finalize'
  | 'error';

/** Represents a row in the NFA->DFA subset construction table. */
export interface SubsetTableRow {
  dfaStateId: string;
  dfaLabel: string;
  nfaStateIds: string[];
  isInitial: boolean;
  isAccepting: boolean;
  isNew: boolean;
  transitions: Record<
    string,
    {
      targetDfaId: string;
      targetLabel: string;
      targetNfaIds: string[];
      isNewSubset: boolean;
      isEmpty: boolean;
    }
  >;
}

/** Represents a cell in the DFA minimization table-filling matrix. */
export interface TableFillingCell {
  state1: string; // row state id
  state2: string; // col state id (col < row)
  marked: boolean;
  witness?: string;
  distinguishedBySymbol?: string;
  pass?: number;
  reason?: string;
  isEquivalent?: boolean;
}

/** Represents an equivalence class of merged states in DFA minimization. */
export interface EquivalenceClass {
  id: string;
  label: string;
  memberStateIds: string[];
  isInitial: boolean;
  isAccepting: boolean;
}

/** Step in computing epsilon closure. */
export interface EpsilonClosureStep {
  fromStateId: string;
  toStateId: string;
  transitionId: string;
  isCycle: boolean;
  discoveredClosure: string[];
  explanation: string;
}

/** Detailed trace for a specific state's epsilon closure. */
export interface StateEpsilonTrace {
  stateId: string;
  closureStateIds: string[];
  steps: EpsilonClosureStep[];
  hasCycle: boolean;
}

/** A single discrete step in the transformation timeline. */
export interface TransformationStep {
  stepIndex: number;
  totalSteps?: number;
  phase: TransformationPhase;
  title: string;
  description: string;
  ruleExplanation: string;
  
  // Highlight hooks for the visualizations
  highlightSourceStates: string[];
  highlightSourceTransitions: string[];
  highlightDestStates: string[];
  highlightDestTransitions: string[];

  // Intermediate snapshot of the output automaton
  intermediateMachine: FiniteAutomaton;

  // Contextual data for tables and side panels
  subsetContext?: {
    currentSubsetId?: string;
    currentSubsetNfaIds?: string[];
    currentSymbol?: string;
    targetSubsetNfaIds?: string[];
    targetDfaId?: string;
    isNewSubset?: boolean;
    isEmptySubset?: boolean;
    tableRows: SubsetTableRow[];
  };

  minimizationContext?: {
    unreachableStateIds?: string[];
    addedTrapStateId?: string;
    tableCells: TableFillingCell[];
    activePair?: [string, string];
    activeSymbol?: string;
    currentPass?: number;
    classes?: EquivalenceClass[];
  };

  epsilonContext?: {
    analyzedStateId?: string;
    currentClosureStateIds?: string[];
    allTraces?: Record<string, StateEpsilonTrace>;
    directTransitionsAdded?: FATransition[];
  };
}

/** Summary statistics and info for the transformation. */
export interface TransformationSummary {
  operation: TransformationType;
  initialStatesCount: number;
  finalStatesCount: number;
  initialTransitionsCount: number;
  finalTransitionsCount: number;
  ratioNotes: string;
  keyInsights: string[];
}

/** String testing record for verifying language preservation. */
export interface VerificationSample {
  input: string;
  displayInput: string;
  sourceAccepted: boolean;
  targetAccepted: boolean;
  matches: boolean;
}

export interface VerificationResult {
  allMatch: boolean;
  samples: VerificationSample[];
  summaryMessage: string;
}

/** Complete result of running an automaton transformation. */
export interface TransformationResult {
  type: TransformationType;
  sourceMachine: FiniteAutomaton;
  targetMachine: FiniteAutomaton;
  steps: TransformationStep[];
  summary: TransformationSummary;
  verification: VerificationResult;
}
