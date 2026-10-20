import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FastForward,
  Play,
  Pause,
  Upload,
  FlaskConical,
  BookOpen,
  FileCode,
  Download,
} from 'lucide-react';
import type { TransformationType } from '@/engine/transform/types';
import { TRANSFORMATION_PRESETS, type TransformationPreset } from '@/engine/transform/presets';
import type { FiniteAutomaton } from '@/engine/types';
import { deserializeProject, downloadProject, serializeProject } from '@/engine/persistence';
import { Button } from '@/components/ui';
import { cn } from '@/utils';

interface TransformationToolbarProps {
  currentOperation: TransformationType;
  onSelectOperation: (op: TransformationType) => void;
  selectedPresetId: string;
  onSelectPreset: (preset: TransformationPreset) => void;
  onLoadCustomMachine: (machine: FiniteAutomaton, name: string) => void;
  // Step controls
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onSetPlaybackSpeed: (speed: number) => void;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
  onFinal: () => void;
  // Inspection & Playground
  onOpenInPlayground: () => void;
  onInspectSource: () => void;
  onInspectTarget: () => void;
  targetMachine: FiniteAutomaton;
}

const operations: { id: TransformationType; label: string; desc: string }[] = [
  {
    id: 'nfa-to-dfa',
    label: 'NFA → DFA',
    desc: 'Subset Construction (Power-set method)',
  },
  {
    id: 'enfa-to-dfa',
    label: 'ε-NFA → DFA',
    desc: 'Subset Construction with ε-Closure',
  },
  {
    id: 'enfa-to-nfa',
    label: 'ε-Removal',
    desc: 'Convert ε-NFA to Standard NFA',
  },
  {
    id: 'dfa-minimization',
    label: 'DFA Minimization',
    desc: 'Table-Filling & Equivalence Partitioning',
  },
  {
    id: 'epsilon-closure',
    label: 'ε-Closure Explorer',
    desc: 'State-by-state closure & cycle tracing',
  },
];

export function TransformationToolbar({
  currentOperation,
  onSelectOperation,
  selectedPresetId,
  onSelectPreset,
  onLoadCustomMachine,
  currentStepIndex,
  totalSteps,
  isPlaying,
  playbackSpeed,
  onSetPlaybackSpeed,
  onPlayPause,
  onPrevious,
  onNext,
  onReset,
  onFinal,
  onOpenInPlayground,
  onInspectSource,
  onInspectTarget,
  targetMachine,
}: TransformationToolbarProps) {
  const [fileError, setFileError] = useState<string | null>(null);

  // Filter presets compatible with current operation
  const relevantPresets = TRANSFORMATION_PRESETS.filter((p) =>
    p.category.includes(currentOperation),
  );

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const project = deserializeProject(text);
        onLoadCustomMachine(project.machine, project.name);
        setFileError(null);
      } catch (err: unknown) {
        setFileError(err instanceof Error ? err.message : 'Invalid JSON file');
      }
    };
    input.click();
  };

  const handleLoadFromPlayground = () => {
    const raw = localStorage.getItem('vas-playground-machine');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.states && parsed.transitions) {
          onLoadCustomMachine(parsed, 'Playground Machine');
          setFileError(null);
          return;
        }
      } catch {
        // ignore
      }
    }
    // Check saved projects
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('vas-project-')) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const proj = deserializeProject(item);
            onLoadCustomMachine(proj.machine, proj.name);
            setFileError(null);
            return;
          } catch {
            // ignore
          }
        }
      }
    }
    setFileError('No machine found in Playground. Load a preset or design one in the Playground.');
  };

  const handleExportTarget = () => {
    const json = serializeProject(
      targetMachine,
      `Transformed_${currentOperation}`,
      'Exported from Transformation Studio',
      {},
    );
    downloadProject(json, `transformed-${currentOperation}`);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Top Bar: Operation choice and source machine picker */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 shadow-card">
        {/* Operations Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {operations.map((op) => (
            <button
              key={op.id}
              onClick={() => onSelectOperation(op.id)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150',
                currentOperation === op.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
              )}
            >
              {op.label}
            </button>
          ))}
        </div>

        {/* Source Machine Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedPresetId}
            onChange={(e) => {
              const preset = TRANSFORMATION_PRESETS.find((p) => p.id === e.target.value);
              if (preset) onSelectPreset(preset);
            }}
            className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-gray-800 dark:text-gray-200 font-medium outline-none focus:ring-1 focus:ring-primary-500"
          >
            <optgroup label="Compatible Presets">
              {relevantPresets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="All Presets">
              {TRANSFORMATION_PRESETS.filter((p) => !relevantPresets.includes(p)).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={handleLoadFromPlayground}
            leftIcon={<FlaskConical className="w-3.5 h-3.5" />}
            title="Import current machine from the Playground"
          >
            Playground Input
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleFileUpload}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
            title="Upload custom machine JSON"
          >
            Upload
          </Button>
        </div>
      </div>

      {fileError && (
        <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
          {fileError}
        </div>
      )}

      {/* Stepping Toolbar: Prev, Next, Play/Pause, Progress, Reset, Final */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 shadow-card">
        {/* Step Navigation Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            disabled={currentStepIndex === 0}
            leftIcon={<RotateCcw className="w-3 h-3" />}
            title="Reset to Step 0 (Home)"
          >
            Reset
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onPrevious}
            disabled={currentStepIndex <= 0}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
            title="Previous Step (Left Arrow)"
          >
            Prev
          </Button>

          <Button
            size="sm"
            variant={isPlaying ? 'primary' : 'outline'}
            onClick={onPlayPause}
            leftIcon={
              isPlaying ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )
            }
            title="Play / Pause Auto-step (Space)"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={onNext}
            disabled={currentStepIndex >= totalSteps - 1}
            rightIcon={<ChevronRight className="w-4 h-4" />}
            title="Next Step (Right Arrow)"
          >
            Next
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onFinal}
            disabled={currentStepIndex >= totalSteps - 1}
            rightIcon={<FastForward className="w-3 h-3" />}
            title="Jump to Final Output (End)"
          >
            Final
          </Button>

          {/* Speed selector */}
          <select
            value={playbackSpeed}
            onChange={(e) => onSetPlaybackSpeed(Number(e.target.value))}
            className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-300 outline-none ml-1"
            title="Auto-play speed"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1.0x</option>
            <option value={2}>2.0x</option>
          </select>
        </div>

        {/* Center Progress Indicator */}
        <div className="flex items-center gap-3 flex-1 max-w-xs px-2">
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary-600 h-full transition-all duration-200 rounded-full"
              style={{
                width: `${totalSteps > 1 ? (currentStepIndex / (totalSteps - 1)) * 100 : 100}%`,
              }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {currentStepIndex + 1} / {totalSteps}
          </span>
        </div>

        {/* Actions: Open in Playground & Inspect */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={onInspectSource}
            leftIcon={<BookOpen className="w-3 h-3" />}
            title="Inspect 5-tuple of source machine"
          >
            Source
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onInspectTarget}
            leftIcon={<FileCode className="w-3 h-3" />}
            title="Inspect 5-tuple of transformed output"
          >
            Output
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportTarget}
            leftIcon={<Download className="w-3 h-3" />}
            title="Download target machine as JSON"
          >
            Export
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={onOpenInPlayground}
            leftIcon={<FlaskConical className="w-3 h-3" />}
            title="Open the generated machine in the Playground editor"
          >
            Open in Playground
          </Button>
        </div>
      </div>
    </div>
  );
}
