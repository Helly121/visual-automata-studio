import React, { useState } from 'react';
import {
  Undo2, Redo2, Trash2, Download, Upload, GitFork, Circle, ChevronDown,
  BookOpen, Cpu, Plus, MousePointer, PlusCircle, Link2, Maximize2,
  FolderOpen, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { cn } from '@/utils';
import { validateAutomaton } from '@/engine/validate';
import { serializeProject, deserializeProject, downloadProject } from '@/engine/persistence';
import type { FiniteAutomaton, MachineType } from '@/engine/types';
import { EXAMPLE_GALLERY } from '@/engine/examples';
import type { Node, Edge } from '@xyflow/react';
import type { StateNodeData, TransitionEdgeData } from '@/engine/types';
import { Badge } from '@/components/ui';
import type { EditorMode } from '../hooks/useAutomataEditor';

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
  editorMode: EditorMode;
  canUndo: boolean;
  canRedo: boolean;
  nodes: Node[];
  edges: Edge[];
  nodePositions: Record<string, { x: number; y: number }>;
  hasSelection: boolean;
  showExamplesDropdown: boolean;
  onSetEditorMode: (m: EditorMode) => void;
  onAddState: () => void;
  onDeleteSelected: () => void;
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
  onToggleExamples: () => void;
  onOpenValidation: () => void;
  onOpenSavedProjects: () => void;
}

export function PlaygroundToolbar({
  machine,
  machineType,
  alphabet,
  projectName,
  editorMode,
  canUndo,
  canRedo,
  nodes,
  edges: _edges,
  nodePositions,
  hasSelection,
  showExamplesDropdown,
  onSetEditorMode,
  onAddState,
  onDeleteSelected,
  onSetMachineType,
  onSetAlphabet,
  onSetProjectName,
  onUndo,
  onRedo,
  onClear,
  onLoadExample,
  onImportProject,
  onToggleExamples,
  onOpenValidation,
  onOpenSavedProjects,
}: PlaygroundToolbarProps) {
  const [alphabetInput, setAlphabetInput] = useState(alphabet.join(', '));
  const [importError, setImportError] = useState<string | null>(null);
  const { fitView } = useReactFlow();

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
        const importedNodes: Node<StateNodeData>[] = project.machine.states.map((s) => ({
          id: s.id,
          type: 'stateNode',
          position: project.nodePositions?.[s.id] ?? { x: 100 + Math.random() * 300, y: 150 },
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
        setImportError(err instanceof Error ? err.message : 'Import failed. Invalid project file.');
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
    if (unique.length > 0) {
      onSetAlphabet(unique);
      setAlphabetInput(unique.join(', '));
    } else {
      setAlphabetInput(alphabet.join(', '));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Main toolbar row */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-3 py-2 shadow-sm flex-wrap gap-y-2">
        {/* Project name input */}
        <input
          value={projectName}
          onChange={(e) => onSetProjectName(e.target.value)}
          className="text-xs font-bold text-gray-800 dark:text-gray-100 bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-700 focus:border-primary-500 focus:outline-none w-36 truncate transition-colors"
          maxLength={40}
          title="Rename machine project"
        />

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-800" />

        {/* Tool modes: Select, Add State, Connect */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl">
          <ToolModeBtn
            active={editorMode === 'select'}
            onClick={() => onSetEditorMode('select')}
            title="Select & Move tool (V)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden md:inline">Select</span>
          </ToolModeBtn>
          <ToolModeBtn
            active={editorMode === 'add-state'}
            onClick={() => onSetEditorMode('add-state')}
            title="Add State tool (A) — click canvas to drop states"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden md:inline">Add State</span>
          </ToolModeBtn>
          <ToolModeBtn
            active={editorMode === 'connect'}
            onClick={() => onSetEditorMode('connect')}
            title="Connect tool (C) — click source then target state"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden md:inline">Connect</span>
          </ToolModeBtn>
        </div>

        {/* Direct Action: + State button */}
        <TBtn onClick={onAddState} title="Add state immediately">
          <Plus className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 hidden sm:inline">
            + State
          </span>
        </TBtn>

        {/* Direct Action: Delete Selected */}
        <TBtn
          onClick={onDeleteSelected}
          disabled={!hasSelection}
          title="Delete selected state or transition (Delete/Backspace)"
          className={hasSelection ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40' : ''}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </TBtn>

        {/* Fit view */}
        <TBtn onClick={() => fitView({ duration: 300, padding: 0.4 })} title="Fit graph to view">
          <Maximize2 className="w-3.5 h-3.5" />
        </TBtn>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-800 hidden sm:block" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-1 hidden sm:flex">
          <TBtn onClick={onUndo} disabled={!canUndo} title="Undo edit (Ctrl+Z)">
            <Undo2 className="w-3.5 h-3.5" />
          </TBtn>
          <TBtn onClick={onRedo} disabled={!canRedo} title="Redo edit (Ctrl+Y)">
            <Redo2 className="w-3.5 h-3.5" />
          </TBtn>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-800" />

        {/* Machine Type Selection */}
        <div className="flex items-center gap-1">
          {machineTypes.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => onSetMachineType(id)}
              title={desc}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                machineType === id
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-800" />

        {/* Alphabet Σ */}
        <div className="flex items-center gap-1.5" title="Input alphabet symbols (comma-separated)">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">Σ:</span>
          <input
            value={alphabetInput}
            onChange={(e) => setAlphabetInput(e.target.value)}
            onBlur={handleAlphabetBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleAlphabetBlur()}
            placeholder="0, 1"
            className="w-18 text-xs font-mono font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-800 hidden lg:block" />

        {/* Examples dropdown toggle */}
        <div className="relative">
          <TBtn
            onClick={onToggleExamples}
            title="Load example templates"
            active={showExamplesDropdown}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-xs hidden sm:inline">Templates</span>
            <ChevronDown className={cn('w-3 h-3 transition-transform', showExamplesDropdown && 'rotate-180')} />
          </TBtn>

          {showExamplesDropdown && (
            <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-2 z-50 flex flex-col gap-1 max-h-80 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-2 py-1">
                Editable Starter Automata
              </p>
              {EXAMPLE_GALLERY.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    const exNodes: Node<StateNodeData>[] = ex.machine.states.map((s) => ({
                      id: s.id,
                      type: 'stateNode',
                      position: ex.nodePositions?.[s.id] ?? { x: 100, y: 150 },
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
                    onToggleExamples();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex flex-col"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{ex.name}</span>
                    <Badge variant="blue" className="text-[9px] uppercase">{ex.machine.type}</Badge>
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{ex.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Saved Projects modal trigger */}
        <TBtn onClick={onOpenSavedProjects} title="Open saved machines from browser storage">
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="text-xs hidden md:inline">Saved</span>
        </TBtn>

        {/* Import & Export */}
        <TBtn onClick={handleImport} title="Import JSON automaton">
          <Upload className="w-3.5 h-3.5" />
          <span className="text-xs hidden lg:inline">Import</span>
        </TBtn>
        <TBtn onClick={handleExportProject} disabled={nodes.length === 0} title="Export JSON automaton">
          <Download className="w-3.5 h-3.5" />
          <span className="text-xs hidden lg:inline">Export</span>
        </TBtn>

        {/* Clear Canvas */}
        <TBtn onClick={onClear} title="Clear canvas" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40">
          <Trash2 className="w-3.5 h-3.5" />
        </TBtn>

        {/* Validation Status Badge */}
        <div className="ml-auto flex items-center">
          {nodes.length === 0 ? (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
              Empty Canvas
            </span>
          ) : !validation.valid ? (
            <button
              onClick={onOpenValidation}
              className="flex items-center gap-1 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
              title="Click to view and locate validation errors"
            >
              <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
              {validation.errors.length} Error{validation.errors.length > 1 ? 's' : ''}
            </button>
          ) : validation.warnings.length > 0 ? (
            <button
              onClick={onOpenValidation}
              className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
              title="Click to view validation warnings"
            >
              <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              {validation.warnings.length} Warning{validation.warnings.length > 1 ? 's' : ''}
            </button>
          ) : (
            <button
              onClick={onOpenValidation}
              className="flex items-center gap-1 bg-green-50 dark:bg-green-950/50 hover:bg-green-100 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-lg px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
              title="Valid automaton. Click to inspect details."
            >
              <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
              Valid {machineType.toUpperCase()}
            </button>
          )}
        </div>
      </div>

      {importError && (
        <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>⚠ {importError}</span>
          <button onClick={() => setImportError(null)} className="font-bold ml-2">✕</button>
        </div>
      )}
    </div>
  );
}

function ToolModeBtn({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors',
        active
          ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-400 shadow-xs'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
      )}
    >
      {children}
    </button>
  );
}

function TBtn({
  children,
  onClick,
  disabled,
  active,
  title,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  title: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors',
        active
          ? 'bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
        disabled && 'opacity-30 pointer-events-none',
        className,
      )}
    >
      {children}
    </button>
  );
}
