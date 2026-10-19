import { useState } from 'react';
import {
  Undo2, Redo2, Trash2, Download, Upload, GitFork, Circle, ChevronDown,
  BookOpen, Cpu,
} from 'lucide-react';
import { cn } from '@/utils';
import { validateAutomaton } from '@/engine/validate';
import { serializeProject, deserializeProject, downloadProject } from '@/engine/persistence';
import type { FiniteAutomaton, MachineType } from '@/engine/types';
import { EXAMPLE_GALLERY } from '@/engine/examples';
import type { Node, Edge } from '@xyflow/react';
import type { StateNodeData, TransitionEdgeData } from '@/engine/types';
import { Badge } from '@/components/ui';

const machineTypes: { id: MachineType; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { id: 'dfa', label: 'DFA', icon: Circle, desc: 'Deterministic Finite Automaton' },
  { id: 'nfa', label: 'NFA', icon: GitFork, desc: 'Nondeterministic Finite Automaton' },
  { id: 'enfa', label: 'ε-NFA', icon: Cpu, desc: 'Epsilon-NFA' },
];

interface PlaygroundToolbarProps {
  machine: FiniteAutomaton;
  machineType: MachineType;
  alphabet: string[];
  projectName: string;
  canUndo: boolean;
  canRedo: boolean;
  nodes: Node[];
  edges: Edge[];
  nodePositions: Record<string, { x: number; y: number }>;
  onSetMachineType: (t: MachineType) => void;
  onSetAlphabet: (a: string[]) => void;
  onSetProjectName: (n: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onLoadExample: (
    nodes: Node[],
    edges: Edge[],
    type: MachineType,
    alphabet: string[],
    name?: string,
  ) => void;
  onImportProject: (savedNodes: Node[], savedEdges: Edge[], type: MachineType, alpha: string[], name: string) => void;
}

export function PlaygroundToolbar({
  machine,
  machineType,
  alphabet,
  projectName,
  canUndo,
  canRedo,
  nodes,
  edges: _edges,
  nodePositions,
  onSetMachineType,
  onSetAlphabet,
  onSetProjectName,
  onUndo,
  onRedo,
  onClear,
  onLoadExample,
  onImportProject,
}: PlaygroundToolbarProps) {
  const [showExamples, setShowExamples] = useState(false);
  const [alphabetInput, setAlphabetInput] = useState(alphabet.join(','));
  const [importError, setImportError] = useState<string | null>(null);

  const validation = validateAutomaton(machine);

  const handleExportProject = () => {
    const json = serializeProject(machine, projectName, '', nodePositions);
    downloadProject(json, projectName);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const project = deserializeProject(text);
        // Reconstruct nodes and edges from saved machine
        const importedNodes: Node<StateNodeData>[] = project.machine.states.map((s) => ({
          id: s.id,
          type: 'stateNode',
          position: project.nodePositions?.[s.id] ?? { x: Math.random() * 400, y: 200 },
          data: {
            label: s.label,
            isInitial: s.isInitial,
            isAccepting: s.isAccepting,
            isActive: false,
            isTraversed: false,
          },
        }));
        const importedEdges: Edge<TransitionEdgeData>[] = project.machine.transitions.map((t) => ({
          id: t.id,
          source: t.from,
          target: t.to,
          type: 'transitionEdge',
          data: { symbol: t.symbol, isActive: false },
        }));
        onImportProject(
          importedNodes as Node[],
          importedEdges as Edge[],
          project.machine.type,
          project.machine.alphabet,
          project.name,
        );
        setImportError(null);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Import failed.');
      }
    };
    input.click();
  };

  const handleAlphabetBlur = () => {
    const parsed = alphabetInput
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const unique = [...new Set(parsed)];
    onSetAlphabet(unique);
    setAlphabetInput(unique.join(','));
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Main toolbar row */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2 shadow-card flex-wrap gap-y-2">
        {/* Project name */}
        <input
          value={projectName}
          onChange={(e) => onSetProjectName(e.target.value)}
          className="text-sm font-semibold text-gray-700 dark:text-gray-200 bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-primary-400 focus:outline-none w-40 truncate"
          maxLength={40}
        />

        {/* Divider */}
        <div className="w-px h-5 bg-gray-100 dark:bg-gray-800" />

        {/* Machine type */}
        <div className="flex items-center gap-1">
          {machineTypes.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => onSetMachineType(id)}
              title={desc}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                machineType === id
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-100 dark:bg-gray-800" />

        {/* Alphabet */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Σ:</span>
          <input
            value={alphabetInput}
            onChange={(e) => setAlphabetInput(e.target.value)}
            onBlur={handleAlphabetBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleAlphabetBlur()}
            placeholder="0,1"
            className="w-20 text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
          />
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-100 dark:bg-gray-800 hidden sm:block" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 hidden sm:flex">
          <TBtn onClick={onUndo} disabled={!canUndo} title="Undo">
            <Undo2 className="w-3.5 h-3.5" />
          </TBtn>
          <TBtn onClick={onRedo} disabled={!canRedo} title="Redo">
            <Redo2 className="w-3.5 h-3.5" />
          </TBtn>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-100 dark:bg-gray-800 hidden sm:block" />

        {/* Examples */}
        <TBtn
          onClick={() => setShowExamples((v) => !v)}
          title="Load example automata"
          active={showExamples}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="text-xs hidden sm:inline">Examples</span>
          <ChevronDown className={cn('w-3 h-3 transition-transform', showExamples && 'rotate-180')} />
        </TBtn>

        {/* Import / Export */}
        <TBtn onClick={handleImport} title="Import project JSON">
          <Upload className="w-3.5 h-3.5" />
          <span className="text-xs hidden sm:inline">Import</span>
        </TBtn>
        <TBtn onClick={handleExportProject} disabled={nodes.length === 0} title="Export project JSON">
          <Download className="w-3.5 h-3.5" />
          <span className="text-xs hidden sm:inline">Export</span>
        </TBtn>

        {/* Clear */}
        <TBtn onClick={onClear} title="Clear canvas" className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950">
          <Trash2 className="w-3.5 h-3.5" />
        </TBtn>

        {/* Validation status */}
        <div className="ml-auto">
          {!validation.valid ? (
            <Badge variant="red" className="text-[10px]">
              {validation.errors.length} error{validation.errors.length > 1 ? 's' : ''}
            </Badge>
          ) : validation.warnings.length > 0 ? (
            <Badge variant="yellow" className="text-[10px]">
              {validation.warnings.length} warning{validation.warnings.length > 1 ? 's' : ''}
            </Badge>
          ) : nodes.length > 0 ? (
            <Badge variant="green" className="text-[10px]">Valid ✓</Badge>
          ) : null}
        </div>
      </div>

      {/* Validation messages */}
      {!validation.valid && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 flex flex-col gap-1">
          {validation.errors.slice(0, 3).map((e, i) => (
            <p key={i} className="text-xs text-red-700 dark:text-red-300">⚠ {e.message}</p>
          ))}
        </div>
      )}

      {importError && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
          <p className="text-xs text-amber-700 dark:text-amber-300">Import error: {importError}</p>
        </div>
      )}

      {/* Examples panel */}
      {showExamples && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 shadow-card animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {EXAMPLE_GALLERY.map((ex) => (
              <button
                key={ex.id}
                onClick={() => {
                  // Build RF nodes and edges from example
                  const exNodes: Node<StateNodeData>[] = ex.machine.states.map((s) => ({
                    id: s.id,
                    type: 'stateNode',
                    position: ex.nodePositions[s.id] ?? { x: 0, y: 0 },
                    data: {
                      label: s.label,
                      isInitial: s.isInitial,
                      isAccepting: s.isAccepting,
                      isActive: false,
                      isTraversed: false,
                    },
                  }));
                  const exEdges: Edge<TransitionEdgeData>[] = ex.machine.transitions.map((t) => ({
                    id: t.id,
                    source: t.from,
                    target: t.to,
                    type: 'transitionEdge',
                    data: { symbol: t.symbol, isActive: false },
                  }));
                  onLoadExample(
                    exNodes as Node[],
                    exEdges as Edge[],
                    ex.machine.type,
                    ex.machine.alphabet,
                    ex.name,
                  );
                  setShowExamples(false);
                }}
                className="text-left p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-card-hover transition-all group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge variant="blue" className="text-[10px]">{ex.machine.type.toUpperCase()}</Badge>
                </div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 leading-tight mb-1">
                  {ex.name}
                </p>
                <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 truncate">
                  {ex.language}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {ex.accepted.slice(0, 3).map((s) => (
                    <span key={s} className="text-[9px] font-mono px-1 py-0.5 rounded bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                      "{s}"
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TBtn({
  children,
  onClick,
  disabled,
  title,
  active,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors',
        active
          ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
        'disabled:opacity-30 disabled:pointer-events-none',
        className,
      )}
    >
      {children}
    </button>
  );
}
