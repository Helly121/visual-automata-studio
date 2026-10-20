import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, StepForward, StepBack, RotateCcw,
  CheckCircle2, XCircle, AlertTriangle, Info,
} from 'lucide-react';
import { cn } from '@/utils';
import { simulate } from '@/engine/simulate';
import type { FiniteAutomaton, SimConfig, SimResult } from '@/engine/types';

interface SimulationPanelProps {
  machine: FiniteAutomaton;
  onSimStep: (config: SimConfig | null) => void;
  onSimEnd: () => void;
}

export function SimulationPanel({ machine, onSimStep, onSimEnd }: SimulationPanelProps) {
  const [inputString, setInputString] = useState('');
  const [result, setResult] = useState<SimResult | null>(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // steps per second
  const playbackRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultRef = useRef<SimResult | null>(null);
  const stepRef = useRef(-1);

  // Keep refs in sync
  useEffect(() => { resultRef.current = result; }, [result]);
  useEffect(() => { stepRef.current = stepIndex; }, [stepIndex]);

  const clearPlayback = () => {
    if (playbackRef.current !== null) {
      clearInterval(playbackRef.current);
      playbackRef.current = null;
    }
  };

  const reset = useCallback(() => {
    clearPlayback();
    setPlaying(false);
    setResult(null);
    setStepIndex(-1);
    onSimEnd();
  }, [onSimEnd]);

  // Cleanup on unmount
  useEffect(() => () => clearPlayback(), []);

  const runSimulation = () => {
    clearPlayback();
    setPlaying(false);
    const r = simulate(machine, inputString);
    setResult(r);
    setStepIndex(0);
    onSimStep(r.trace[0] ?? null);
  };

  const goToStep = useCallback((idx: number) => {
    const r = resultRef.current;
    if (!r || r.trace.length === 0) return;
    const clamped = Math.max(0, Math.min(idx, r.trace.length - 1));
    setStepIndex(clamped);
    onSimStep(r.trace[clamped]);
  }, [onSimStep]);

  const stepForward = () => goToStep(stepIndex + 1);
  const stepBack = () => goToStep(stepIndex - 1);

  const togglePlay = () => {
    if (!result || result.trace.length === 0) return;
    if (playing) {
      clearPlayback();
      setPlaying(false);
      return;
    }

    // If at the end, restart from beginning
    let idx = stepRef.current;
    if (idx >= result.trace.length - 1) {
      idx = 0;
      setStepIndex(0);
      onSimStep(result.trace[0]);
    }

    setPlaying(true);
    const intervalMs = Math.round(1000 / speed);
    playbackRef.current = setInterval(() => {
      const cur = stepRef.current;
      const r = resultRef.current;
      if (!r || cur >= r.trace.length - 1) {
        clearPlayback();
        setPlaying(false);
        return;
      }
      const next = cur + 1;
      stepRef.current = next;
      setStepIndex(next);
      onSimStep(r.trace[next]);
    }, intervalMs);
  };

  // Restart playback when speed changes while playing
  useEffect(() => {
    if (!playing) return;
    clearPlayback();
    const intervalMs = Math.round(1000 / speed);
    playbackRef.current = setInterval(() => {
      const cur = stepRef.current;
      const r = resultRef.current;
      if (!r || cur >= r.trace.length - 1) {
        clearPlayback();
        setPlaying(false);
        return;
      }
      const next = cur + 1;
      stepRef.current = next;
      setStepIndex(next);
      onSimStep(r.trace[next]);
    }, intervalMs);
  }, [speed, playing, onSimStep]);

  const currentConfig = result && stepIndex >= 0 ? result.trace[stepIndex] : null;
  const atEnd = result !== null && stepIndex >= result.trace.length - 1;
  const atStart = stepIndex <= 0;

  const statusInfo = getStatusInfo(result, atEnd);

  // Active read index on the tape
  const tapeIndex = stepIndex > 0 ? stepIndex - 1 : -1;

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Simulation
        </p>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
          {machine.type.toUpperCase()}
        </span>
      </div>

      {/* Input string input */}
      <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-2.5 flex flex-col gap-1.5 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
            Input string
          </label>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
            Σ = {'{'}{machine.alphabet.join(', ')}{'}'}
          </span>
        </div>
        <input
          type="text"
          value={inputString}
          onChange={(e) => {
            setInputString(e.target.value);
            reset();
          }}
          placeholder="e.g. 0110 (or empty for ε)"
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 pt-0.5">
          <span>{inputString.length === 0 ? 'Empty string (ε)' : `${inputString.length} symbol${inputString.length > 1 ? 's' : ''}`}</span>
          {inputString.length > 0 && (
            <button
              onClick={() => {
                setInputString('');
                reset();
              }}
              className="hover:text-primary-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Visual String Tape */}
      {result && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-2.5 flex flex-col gap-1.5 shadow-xs">
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Input Tape
          </span>
          <div className="flex items-center gap-1 overflow-x-auto py-1 px-0.5">
            {inputString.length === 0 ? (
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold border transition-colors',
                  atEnd
                    ? 'bg-blue-100 text-blue-700 border-blue-400 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400',
                )}
              >
                ε
              </div>
            ) : (
              inputString.split('').map((char, i) => {
                const isConsumed = i < tapeIndex;
                const isCurrent = i === tapeIndex;
                return (
                  <div key={i} className="flex flex-col items-center">
                    <span
                      className={cn(
                        'text-[8px] transition-opacity leading-none mb-0.5',
                        isCurrent ? 'text-blue-600 dark:text-blue-400 font-bold opacity-100' : 'opacity-0',
                      )}
                    >
                      ▼
                    </span>
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-semibold border transition-all duration-150',
                        isCurrent
                          ? 'bg-blue-500 text-white border-blue-600 scale-105 shadow-sm'
                          : isConsumed
                            ? 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800/60 dark:text-gray-500 dark:border-gray-800 line-through'
                            : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700',
                      )}
                    >
                      {char}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Status result banner */}
      {result && (
        <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold', statusInfo.cls)}>
          {statusInfo.icon}
          {statusInfo.label}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-2">
        {!result ? (
          <button
            onClick={runSimulation}
            disabled={machine.states.length === 0}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            Run Simulation
          </button>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <CtrlBtn onClick={stepBack} disabled={atStart} title="Previous step">
                <StepBack className="w-3.5 h-3.5" />
              </CtrlBtn>
              <CtrlBtn onClick={togglePlay} disabled={result.trace.length <= 1} title={playing ? 'Pause' : 'Play'}>
                {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </CtrlBtn>
              <CtrlBtn onClick={stepForward} disabled={atEnd} title="Next step">
                <StepForward className="w-3.5 h-3.5" />
              </CtrlBtn>
              <CtrlBtn onClick={reset} title="Reset simulation">
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
              </CtrlBtn>
            </div>

            {/* Speed slider */}
            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">Speed</span>
              <input
                type="range"
                min={0.5}
                max={4}
                step={0.5}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="flex-1 h-1 accent-primary-600 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 w-8">{speed}×</span>
            </div>

            {/* Step indicator */}
            <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center font-mono">
              Step {stepIndex + 1} / {result.trace.length}
            </div>
          </>
        )}
      </div>

      {/* Current step explanation */}
      {currentConfig && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl p-2.5 flex flex-col gap-1.5 shadow-xs">
          <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
            Current Step
          </p>
          <div className="text-xs text-blue-900 dark:text-blue-100 font-mono flex flex-col gap-0.5">
            <p>
              Active States:{' '}
              <span className="font-bold">
                {currentConfig.activeStateIds.map((id) => {
                  const st = machine.states.find((s) => s.id === id);
                  return st?.label ?? id;
                }).join(', ') || '∅'}
              </span>
            </p>
            {currentConfig.consumedSymbol !== undefined && (
              <p>
                Read: <span className="font-bold">"{currentConfig.consumedSymbol}"</span>
              </p>
            )}
            <p>
              Remaining:{' '}
              <span className="font-bold">
                {currentConfig.remaining ? `"${currentConfig.remaining}"` : 'ε (none)'}
              </span>
            </p>
          </div>
          <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed mt-1">
            {currentConfig.explanation}
          </p>
        </div>
      )}

      {/* Trace steps */}
      {result && result.trace.length > 0 && (
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-1 pr-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1 mb-1">
            Trace Steps
          </p>
          {result.trace.map((cfg, i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              className={cn(
                'w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-colors flex items-center justify-between',
                i === stepIndex
                  ? 'bg-blue-100 dark:bg-blue-900/80 text-blue-900 dark:text-blue-100 font-semibold border border-blue-200 dark:border-blue-800'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60',
              )}
            >
              <span>
                S{cfg.step}: {cfg.consumedSymbol !== undefined ? `read '${cfg.consumedSymbol}'` : 'start'}
              </span>
              <span>
                → {cfg.activeStateIds.map((id) => machine.states.find((s) => s.id === id)?.label ?? id).join(',') || '∅'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CtrlBtn({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex-1 flex items-center justify-center py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
    >
      {children}
    </button>
  );
}

function getStatusInfo(
  result: SimResult | null,
  atEnd: boolean,
): { label: string; icon: React.ReactNode; cls: string } {
  if (!result) return { label: '', icon: null, cls: '' };
  if (!atEnd)
    return {
      label: 'Simulating…',
      icon: <Info className="w-3.5 h-3.5" />,
      cls: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    };
  switch (result.status) {
    case 'accepted':
      return {
        label: 'ACCEPTED ✓',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        cls: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
      };
    case 'rejected':
      return {
        label: 'REJECTED ✗',
        icon: <XCircle className="w-3.5 h-3.5" />,
        cls: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
      };
    case 'invalid_input':
      return {
        label: 'INVALID INPUT',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        cls: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
      };
    case 'invalid_machine':
      return {
        label: 'INVALID MACHINE',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        cls: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
      };
    default:
      return { label: '', icon: null, cls: '' };
  }
}
