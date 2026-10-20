import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Table as TableIcon,
  ShieldCheck,
  Info,
  Columns,
  Square,
  AlertCircle,
  BookOpen,
  FlaskConical,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Badge } from '@/components/ui';
import { AutomatonGraphViewer } from '@/features/transform/components/AutomatonGraphViewer';
import { TransformationToolbar } from '@/features/transform/components/TransformationToolbar';
import { StepExplainer } from '@/features/transform/components/StepExplainer';
import { SubsetTableView } from '@/features/transform/components/SubsetTableView';
import { DistinguishabilityGrid } from '@/features/transform/components/DistinguishabilityGrid';
import { EpsilonClosureTraceView } from '@/features/transform/components/EpsilonClosureTraceView';
import { EquivalenceTester } from '@/features/transform/components/EquivalenceTester';
import { FormalDefinitionModal } from '@/features/transform/components/FormalDefinitionModal';
import {
  TRANSFORMATION_PRESETS,
  type TransformationPreset,
} from '@/engine/transform/presets';
import { executeTransformation } from '@/engine/transform';
import type { TransformationType } from '@/engine/transform/types';
import type { FiniteAutomaton } from '@/engine/types';
import { serializeProject } from '@/engine/persistence';
import { cn } from '@/utils';

export function TransformStudioPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ─── 1. State: Selected Operation & Machine ─────────────────────────────────
  const [operation, setOperation] = useState<TransformationType>('nfa-to-dfa');
  const [preset, setPreset] = useState<TransformationPreset>(TRANSFORMATION_PRESETS[0]);
  const [customMachine, setCustomMachine] = useState<{
    machine: FiniteAutomaton;
    name: string;
  } | null>(null);

  // Check if routed with source=playground
  useEffect(() => {
    if (searchParams.get('source') === 'playground') {
      const raw = localStorage.getItem('vas-playground-machine');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.states && parsed.transitions) {
            setCustomMachine({ machine: parsed, name: 'Playground Machine' });
            if (parsed.type === 'dfa') setOperation('dfa-minimization');
            else if (parsed.type === 'enfa') setOperation('enfa-to-dfa');
            else setOperation('nfa-to-dfa');
          }
        } catch {
          // ignore
        }
      }
    }
  }, [searchParams]);

  // Current active source machine
  const activeSourceMachine = customMachine ? customMachine.machine : preset.machine;
  const activeMachineName = customMachine ? customMachine.name : preset.name;

  // ─── 2. Transformation Calculation ──────────────────────────────────────────
  const { result, transformError } = useMemo(() => {
    try {
      const res = executeTransformation(activeSourceMachine, operation);
      return { result: res, transformError: null };
    } catch (err: unknown) {
      return {
        result: null,
        transformError: err instanceof Error ? err.message : 'Transformation failed',
      };
    }
  }, [activeSourceMachine, operation]);

  // Step navigation state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Tab views
  const [graphLayout, setGraphLayout] = useState<'split' | 'source' | 'target'>('split');
  const [detailTab, setDetailTab] = useState<'table' | 'equivalence' | 'summary'>('table');

  // Modals for formal inspection
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  // Reset step index when machine or operation changes
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [preset.id, customMachine, operation]);

  const totalSteps = result?.steps.length ?? 1;
  const currentStep = result?.steps[currentStepIndex] ?? result?.steps[0];

  // ─── 3. Stepping Callbacks ──────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const handlePrevious = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, []);

  const handleFinal = useCallback(() => {
    setCurrentStepIndex(totalSteps - 1);
    setIsPlaying(false);
  }, [totalSteps]);

  const handlePlayPause = useCallback(() => {
    if (currentStepIndex >= totalSteps - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentStepIndex, totalSteps]);

  // ─── 4. Keyboard Shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === 'Home') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'End') {
        e.preventDefault();
        handleFinal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious, handlePlayPause, handleReset, handleFinal]);

  // ─── 5. Auto-Play Interval ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.round(1800 / playbackSpeed);
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, totalSteps]);

  // ─── 6. Operation / Preset Switchers ─────────────────────────────────────────
  const handleSelectOperation = (op: TransformationType) => {
    setOperation(op);
    setCustomMachine(null);
    // Find compatible preset
    const matching = TRANSFORMATION_PRESETS.find((p) => p.category.includes(op));
    if (matching) setPreset(matching);
  };

  const handleSelectPreset = (p: TransformationPreset) => {
    setPreset(p);
    setCustomMachine(null);
    if (!p.category.includes(operation)) {
      setOperation(p.suggestedOperation);
    }
  };

  const handleLoadCustomMachine = (machine: FiniteAutomaton, name: string) => {
    setCustomMachine({ machine, name });
    // Check if machine type fits current operation
    if (machine.type === 'dfa' && operation !== 'dfa-minimization') {
      setOperation('dfa-minimization');
    } else if (machine.type === 'enfa' && operation === 'dfa-minimization') {
      setOperation('enfa-to-dfa');
    }
  };

  const handleOpenInPlayground = () => {
    if (!result) return;
    const json = serializeProject(
      result.targetMachine,
      `Transformed_${activeMachineName}`,
      `Created via ${operation} in Transformation Studio`,
      {},
    );
    localStorage.setItem('vas-playground-machine', JSON.stringify(result.targetMachine));
    localStorage.setItem(`vas-project-${Date.now()}`, json);
    navigate('/playground');
  };

  return (
    <div className="animate-fade-in flex flex-col gap-4 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Automata Transformation Studio"
        description="Visualize how finite automata are converted and minimized step-by-step through rigorous theoretical algorithms."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSourceModalOpen(true)}
              leftIcon={<BookOpen className="w-3.5 h-3.5" />}
            >
              Source 5-Tuple
            </Button>
            {result && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenInPlayground}
                leftIcon={<FlaskConical className="w-3.5 h-3.5" />}
              >
                Open in Playground
              </Button>
            )}
          </div>
        }
      />

      {/* Main Transformation Toolbar */}
      <TransformationToolbar
        currentOperation={operation}
        onSelectOperation={handleSelectOperation}
        selectedPresetId={preset.id}
        onSelectPreset={handleSelectPreset}
        onLoadCustomMachine={handleLoadCustomMachine}
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        onSetPlaybackSpeed={setPlaybackSpeed}
        onPlayPause={handlePlayPause}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onReset={handleReset}
        onFinal={handleFinal}
        onOpenInPlayground={handleOpenInPlayground}
        onInspectSource={() => setIsSourceModalOpen(true)}
        onInspectTarget={() => setIsTargetModalOpen(true)}
        targetMachine={result ? result.targetMachine : activeSourceMachine}
      />

      {/* Error state if machine incompatible */}
      {transformError && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Transformation Error
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
              {transformError}
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">
              Tip: DFA Minimization requires a DFA input. If your machine is an NFA, first run
              "NFA → DFA" subset construction.
            </p>
          </div>
        </div>
      )}

      {/* Step Explainer Banner */}
      {currentStep && (
        <StepExplainer
          step={currentStep}
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
        />
      )}

      {/* Automata Visualizer Workspace */}
      <div className="flex flex-col gap-2">
        {/* Layout controls */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Columns className="w-3.5 h-3.5" />
            <span className="font-semibold">Canvas View:</span>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setGraphLayout('split')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1',
                graphLayout === 'split'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900',
              )}
            >
              <Columns className="w-3 h-3" /> Side-by-Side
            </button>
            <button
              onClick={() => setGraphLayout('source')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1',
                graphLayout === 'source'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900',
              )}
            >
              <Square className="w-3 h-3" /> Source Only
            </button>
            <button
              onClick={() => setGraphLayout('target')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1',
                graphLayout === 'target'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900',
              )}
            >
              <Square className="w-3 h-3" /> Transformed Only
            </button>
          </div>
        </div>

        {/* The Graph Canvas(es) */}
        <div
          className={cn(
            'grid gap-4 min-h-[420px]',
            graphLayout === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1',
          )}
        >
          {/* Source Automaton Viewer */}
          {(graphLayout === 'split' || graphLayout === 'source') && (
            <AutomatonGraphViewer
              machine={activeSourceMachine}
              title={`Source Machine: ${activeMachineName}`}
              subtitle={`Type: ${activeSourceMachine.type.toUpperCase()} · Alphabet: {${activeSourceMachine.alphabet.join(', ')}}`}
              badge={<Badge variant="blue">{activeSourceMachine.type.toUpperCase()}</Badge>}
              highlightStateIds={currentStep?.highlightSourceStates}
              highlightTransitionIds={currentStep?.highlightSourceTransitions}
              emptyMessage="No source machine loaded"
            />
          )}

          {/* Transformed Output Automaton Viewer */}
          {(graphLayout === 'split' || graphLayout === 'target') && result && (
            <AutomatonGraphViewer
              machine={currentStep ? currentStep.intermediateMachine : result.targetMachine}
              title={`Transformed Machine: Step ${currentStepIndex + 1}/${totalSteps}`}
              subtitle={`Phase: ${currentStep?.phase ?? 'Complete'} · Type: ${result.targetMachine.type.toUpperCase()}`}
              badge={<Badge variant="purple">{result.targetMachine.type.toUpperCase()}</Badge>}
              highlightStateIds={currentStep?.highlightDestStates}
              highlightTransitionIds={currentStep?.highlightDestTransitions}
              emptyMessage="Transformed automaton will generate as steps progress"
            />
          )}
        </div>
      </div>

      {/* Synchronized Data & Verification Tabs */}
      {result && (
        <div className="flex flex-col gap-3">
          {/* Tab Selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-1.5 shadow-card w-full sm:w-fit">
            <button
              onClick={() => setDetailTab('table')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5',
                detailTab === 'table'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
              )}
            >
              <TableIcon className="w-3.5 h-3.5" /> Synchronized State Table
            </button>
            <button
              onClick={() => setDetailTab('equivalence')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5',
                detailTab === 'equivalence'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Language Equivalence Check
            </button>
            <button
              onClick={() => setDetailTab('summary')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5',
                detailTab === 'summary'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
              )}
            >
              <Info className="w-3.5 h-3.5" /> Summary & Insights
            </button>
          </div>

          {/* Tab Content */}
          {detailTab === 'table' && (
            <div>
              {/* Subset Construction Table */}
              {(operation === 'nfa-to-dfa' || operation === 'enfa-to-dfa') &&
                currentStep?.subsetContext && (
                  <SubsetTableView
                    rows={currentStep.subsetContext.tableRows}
                    alphabet={result.targetMachine.alphabet}
                    activeSubsetId={currentStep.subsetContext.currentSubsetId}
                    activeSymbol={currentStep.subsetContext.currentSymbol}
                  />
                )}

              {/* DFA Minimization Triangular Grid */}
              {operation === 'dfa-minimization' && currentStep?.minimizationContext && (
                <DistinguishabilityGrid
                  states={activeSourceMachine.states}
                  cells={currentStep.minimizationContext.tableCells}
                  classes={currentStep.minimizationContext.classes}
                  activePair={currentStep.minimizationContext.activePair}
                />
              )}

              {/* Epsilon Closure Trace View */}
              {operation === 'epsilon-closure' && currentStep?.epsilonContext && (
                <EpsilonClosureTraceView
                  states={activeSourceMachine.states}
                  traces={currentStep.epsilonContext.allTraces}
                  activeStateId={currentStep.epsilonContext.analyzedStateId}
                />
              )}

              {/* Epsilon Removal View */}
              {operation === 'enfa-to-nfa' && (
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-card text-xs text-gray-700 dark:text-gray-300">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider text-[11px]">
                    Direct Shortcut Transition Generation
                  </h4>
                  <p className="leading-relaxed mb-3">
                    For every state q and alphabet symbol a, the new direct transition rule is:
                  </p>
                  <pre className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl font-mono text-[11px] overflow-x-auto text-primary-700 dark:text-primary-300">
                    δ'(q, a) = ε-closure( ⋃_{'{'}p ∈ ε-closure(q){'}'} δ(p, a) )
                  </pre>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                    Epsilon transitions are eliminated by computing all multi-hop paths of the form ε* → symbol → ε* directly into one edge.
                  </p>
                </div>
              )}
            </div>
          )}

          {detailTab === 'equivalence' && (
            <EquivalenceTester
              sourceMachine={activeSourceMachine}
              targetMachine={result.targetMachine}
              verification={result.verification}
            />
          )}

          {detailTab === 'summary' && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-card flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Transformation Summary: {result.summary.operation.toUpperCase()}
                </h4>
                <Badge variant="green">COMPLETED</Badge>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Source States
                  </span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                    {result.summary.initialStatesCount}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Output States
                  </span>
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400 font-mono">
                    {result.summary.finalStatesCount}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Source Transitions
                  </span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                    {result.summary.initialTransitionsCount}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Output Transitions
                  </span>
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400 font-mono">
                    {result.summary.finalTransitionsCount}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-primary-50/50 dark:bg-primary-950/30 rounded-xl border border-primary-100 dark:border-primary-900 text-xs text-primary-900 dark:text-primary-200">
                <strong>Ratio:</strong> {result.summary.ratioNotes}
              </div>

              {/* Key Insights List */}
              <div>
                <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Key Algorithmic Insights
                </h5>
                <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                  {result.summary.keyInsights.map((insight, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5-Tuple Inspection Modals */}
      <FormalDefinitionModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        machine={activeSourceMachine}
        title={`Source 5-Tuple: ${activeMachineName}`}
      />

      {result && (
        <FormalDefinitionModal
          isOpen={isTargetModalOpen}
          onClose={() => setIsTargetModalOpen(false)}
          machine={result.targetMachine}
          title={`Transformed 5-Tuple: Output of ${operation.toUpperCase()}`}
        />
      )}
    </div>
  );
}
