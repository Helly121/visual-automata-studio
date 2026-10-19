import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, StepForward, StepBack, Square, RotateCcw,
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

  const reset = useCallback(() => {
    clearPlayback();
    setPlaying(false);
    setResult(null);
    setStepIndex(-1);
    onSimEnd();
  }, [onSimEnd]);

  const goToStep = useCallback((idx: number) => {
    const r = resultRef.current;
    if (!r) return;
    const clamped = Math.max(0, Math.min(idx, r.trace.length - 1));
    setStepIndex(clamped);
    onSimStep(r.trace[clamped]);
  }, [onSimStep]);

  const stepForward = () => goToStep(stepIndex + 1);
  const stepBack = () => goToStep(stepIndex - 1);

  const togglePlay = () => {
    if (!result) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  const currentConfig = result && stepIndex >= 0 ? result.trace[stepIndex] : null;
  const atEnd = result !== null && stepIndex >= result.trace.length - 1;
  const atStart = stepIndex <= 0;

  const statusInfo = getStatusInfo(result, atEnd);

  return (
    <div className="flex flex-col gap-3 h-full">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
        Simulation
      </p>

      {/* Input field */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 flex flex-col gap-1.5">
        <label className="text-[10px] text-gray-400 dark:text-gray-500">Input string</label>
        <input
          type="text"
          value={inputString}
          onChange={(e) => { setInputString(e.target.value); reset(); }}
          placeholder='e.g. 0110101'
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          Alphabet: <span className="font-mono">{machine.alphabet.join(', ') || '—'}</span>
        </p>
      </div>

      {/* Status badge */}
      {result && (
        <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold', statusInfo.cls)}>
          {statusInfo.icon}
          {statusInfo.label}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-2">
        <button
          onClick={runSimulation}
          disabled={!inputString && machine.alphabet.length > 0}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
          Run
        </button>

        {result && (
          <>
            <div className="flex items-center gap-1">
              <CtrlBtn onClick={stepBack} disabled={atStart} title="Previous step">
                <StepBack className="w-3.5 h-3.5" />
              </CtrlBtn>
              <CtrlBtn onClick={togglePlay} disabled={!result} title={playing ? 'Pause' : 'Play'}>
                {playing
                  ? <Pause className="w-3.5 h-3.5" />
                  : <Play className="w-3.5 h-3.5" />}
              </CtrlBtn>
              <CtrlBtn onClick={stepForward} disabled={atEnd} title="Next step">
                <StepForward className="w-3.5 h-3.5" />
              </CtrlBtn>
              <CtrlBtn onClick={reset} title="Reset">
                <Square className="w-3.5 h-3.5 text-red-500" />
              </CtrlBtn>
            </div>

            {/* Speed slider */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">Speed</span>
              <input
                type="range" min={0.25} max={4} step={0.25}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="flex-1 h-1 accent-primary-600"
              />
              <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 w-8">{speed}×</span>
            </div>

            {/* Step counter */}
            <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
              Step {stepIndex + 1} / {result.trace.length}
            </div>
          </>
        )}

        {!result && (
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 w-full px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Current step info */}
      {currentConfig && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-xl p-2.5 flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Current step</p>
          <p className="text-xs text-blue-800 dark:text-blue-200 font-mono">
            Active: <strong>{currentConfig.activeStateIds.join(', ') || '∅'}</strong>
          </p>
          {currentConfig.consumedSymbol !== undefined && (
            <p className="text-xs text-blue-800 dark:text-blue-200 font-mono">
              Read: <strong>"{currentConfig.consumedSymbol}"</strong>
            </p>
          )}
          <p className="text-xs text-blue-800 dark:text-blue-200 font-mono">
            Remaining: <strong>"{currentConfig.remaining}"</strong>
          </p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed mt-1">
            {currentConfig.explanation}
          </p>
        </div>
      )}

      {/* Execution trace */}
      {result && result.trace.length > 0 && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1 mb-2">
            Execution trace
          </p>
          <div className="flex flex-col gap-1">
            {result.trace.map((cfg, i) => (
              <button
                key={i}
                onClick={() => goToStep(i)}
                className={cn(
                  'w-full text-left px-2.5 py-2 rounded-lg text-[10px] font-mono transition-colors',
                  i === stepIndex
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                )}
              >
                <span className="font-semibold">S{cfg.step}</span>
                {' '}
                {cfg.consumedSymbol !== undefined ? `"${cfg.consumedSymbol}"` : 'start'}
                {' → '}
                {cfg.activeStateIds.join(',') || '∅'}
              </button>
            ))}
          </div>
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
}: { children: React.ReactNode; onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex-1 flex items-center justify-center py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
