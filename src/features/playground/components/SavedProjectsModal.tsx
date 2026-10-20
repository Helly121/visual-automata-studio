import { useState } from 'react';
import { FolderOpen, Trash2, Download, Play, X } from 'lucide-react';
import { deserializeProject, downloadProject } from '@/engine/persistence';
import type { Node, Edge } from '@xyflow/react';
import type { MachineType, StateNodeData, TransitionEdgeData } from '@/engine/types';

interface SavedProjectEntry {
  key: string;
  name: string;
  savedAt: string;
  type: MachineType;
  stateCount: number;
  transitionCount: number;
  rawJson: string;
}

interface SavedProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (
    nodes: Node[],
    edges: Edge[],
    type: MachineType,
    alphabet: string[],
    name: string,
  ) => void;
}

function getSavedProjects(): SavedProjectEntry[] {
  const list: SavedProjectEntry[] = [];
  if (typeof window === 'undefined') return list;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('vas-project-')) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = deserializeProject(raw);
        list.push({
          key,
          name: parsed.name,
          savedAt: parsed.savedAt,
          type: parsed.machine.type,
          stateCount: parsed.machine.states.length,
          transitionCount: parsed.machine.transitions.length,
          rawJson: raw,
        });
      } catch {
        // ignore corrupted keys
      }
    }
  }
  list.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  return list;
}

export function SavedProjectsModal({ isOpen, onClose, onLoadProject }: SavedProjectsModalProps) {
  const [projects, setProjects] = useState<SavedProjectEntry[]>(getSavedProjects);

  if (!isOpen) return null;

  const handleDelete = (key: string) => {
    localStorage.removeItem(key);
    setProjects((prev) => prev.filter((p) => p.key !== key));
  };

  const handleOpen = (item: SavedProjectEntry) => {
    try {
      const parsed = deserializeProject(item.rawJson);
      const importedNodes: Node<StateNodeData>[] = parsed.machine.states.map((s) => ({
        id: s.id,
        type: 'stateNode',
        position: parsed.nodePositions?.[s.id] ?? { x: 100 + Math.random() * 200, y: 150 },
        data: {
          label: s.label,
          isInitial: s.isInitial,
          isAccepting: s.isAccepting,
          isActive: false,
          isTraversed: false,
        },
      }));
      const importedEdges: Edge<TransitionEdgeData>[] = parsed.machine.transitions.map((t) => ({
        id: t.id,
        source: t.from,
        target: t.to,
        type: 'transitionEdge',
        data: { symbol: t.symbol, isActive: false },
      }));
      onLoadProject(
        importedNodes as Node[],
        importedEdges as Edge[],
        parsed.machine.type,
        parsed.machine.alphabet,
        parsed.name,
      );
      onClose();
    } catch (e) {
      alert(`Could not load project: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
              Saved Machines in Browser
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2">
          {projects.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center gap-2 text-gray-400">
              <FolderOpen className="w-8 h-8 opacity-40" />
              <p className="text-xs">No saved automata found in local storage.</p>
              <p className="text-[11px] text-gray-500">
                Click "Save" on the top right of the Playground to save your working machines here!
              </p>
            </div>
          ) : (
            projects.map((proj) => (
              <div
                key={proj.key}
                className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">
                      {proj.name}
                    </span>
                    <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.2 bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 rounded">
                      {proj.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {proj.stateCount} states • {proj.transitionCount} transitions •{' '}
                    {new Date(proj.savedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleOpen(proj)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                    title="Load this automaton onto canvas"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Load
                  </button>
                  <button
                    onClick={() => downloadProject(proj.rawJson, proj.name)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Export JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(proj.key)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Delete saved automaton"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
