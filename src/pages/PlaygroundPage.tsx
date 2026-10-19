import { useState, useCallback, useMemo } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Node, Edge } from '@xyflow/react';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui';
import { cn } from '@/utils';

import { PlaygroundCanvas } from '@/features/playground/components/PlaygroundCanvas';
import { PlaygroundToolbar } from '@/features/playground/components/PlaygroundToolbar';
import { PropertiesPanel } from '@/features/playground/components/PropertiesPanel';
import { SimulationPanel } from '@/features/playground/components/SimulationPanel';
import { useAutomataEditor } from '@/features/playground/hooks/useAutomataEditor';
import type { MachineType, SimConfig } from '@/engine/types';
import { serializeProject } from '@/engine/persistence';

/** Inner content — must live inside <ReactFlowProvider>. */
function PlaygroundInner() {
  const {
    nodes, edges, machineType, alphabet, projectName, setProjectName,
    onNodesChange, onEdgesChange, onConnect, onCanvasDoubleClick,
    setMachineType, setAlphabet,
    updateNodeLabel, toggleInitial, toggleAccepting, deleteNode,
    updateEdgeSymbol, deleteEdge,
    loadExample, clearCanvas,
    highlightSimStep, clearHighlights,
    machine,
    canUndo, canRedo, undo, redo,
  } = useAutomataEditor();

  const { getNodes } = useReactFlow();

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [rightPanel, setRightPanel] = useState<'properties' | 'simulation'>('properties');

  // Derive node positions from RF for save
  const nodePositions = useMemo(() => {
    const result: Record<string, { x: number; y: number }> = {};
    getNodes().forEach((n) => { result[n.id] = n.position; });
    return result;
  }, [getNodes, nodes]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNodeSelect = useCallback(
    (node: Node | null) => {
      setSelectedNode(node);
      if (node) setRightPanel('properties');
    },
    [],
  );

  const handleEdgeSelect = useCallback(
    (edge: Edge | null) => {
      setSelectedEdge(edge);
      if (edge) setRightPanel('properties');
    },
    [],
  );

  const handleSimStep = useCallback(
    (config: SimConfig | null) => {
      if (config) {
        highlightSimStep(config.activeStateIds, config.traversedTransitionIds);
      } else {
        clearHighlights();
      }
    },
    [highlightSimStep, clearHighlights],
  );

  const handleSimEnd = useCallback(() => {
    clearHighlights();
  }, [clearHighlights]);

  const handleSaveProject = () => {
    const positions: Record<string, { x: number; y: number }> = {};
    getNodes().forEach((n) => { positions[n.id] = n.position; });
    const json = serializeProject(machine, projectName, '', positions);
    const key = `vas-project-${Date.now()}`;
    localStorage.setItem(key, json);
    alert(`Saved to localStorage as "${projectName}"`);
  };

  const handleLoadExample = (
    exNodes: Node[],
    exEdges: Edge[],
    type: MachineType,
    alpha: string[],
    name?: string,
  ) => {
    clearHighlights();
    loadExample(exNodes, exEdges, type, alpha, name);
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const handleImportProject = (
    importedNodes: Node[],
    importedEdges: Edge[],
    type: MachineType,
    alpha: string[],
    name: string,
  ) => {
    loadExample(importedNodes, importedEdges, type, alpha, name);
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-3 h-[calc(100vh-72px)]">
      {/* Page header */}
      <PageHeader
        title="Playground"
        description="Design, simulate, and explore finite automata interactively."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveProject} disabled={nodes.length === 0}>
              Save
            </Button>
          </div>
        }
      />

      {/* Toolbar */}
      <PlaygroundToolbar
        machine={machine}
        machineType={machineType}
        alphabet={alphabet}
        projectName={projectName}
        canUndo={canUndo}
        canRedo={canRedo}
        nodes={nodes}
        edges={edges}
        nodePositions={nodePositions}
        onSetMachineType={setMachineType}
        onSetAlphabet={setAlphabet}
        onSetProjectName={setProjectName}
        onUndo={undo}
        onRedo={redo}
        onClear={() => { clearCanvas(); setSelectedNode(null); setSelectedEdge(null); clearHighlights(); }}
        onLoadExample={handleLoadExample}
        onImportProject={handleImportProject}
      />

      {/* Main workspace */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Central canvas */}
        <div className="flex-1 min-w-0 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden relative">
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 pointer-events-none">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-8 py-6 shadow-card-hover text-center max-w-xs">
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">⊙</span>
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Empty canvas
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                  Double-click anywhere to add a state, or load an example from the toolbar above.
                </p>
              </div>
            </div>
          )}
          <PlaygroundCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onCanvasDoubleClick={onCanvasDoubleClick}
            onNodeSelect={handleNodeSelect}
            onEdgeSelect={handleEdgeSelect}
          />
        </div>

        {/* Right panel */}
        <div className="w-56 xl:w-64 flex-shrink-0 flex flex-col gap-2 hidden lg:flex">
          {/* Panel tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-2 py-1.5 shadow-card">
            <PanelTab
              label="Properties"
              active={rightPanel === 'properties'}
              onClick={() => setRightPanel('properties')}
            />
            <PanelTab
              label="Simulate"
              active={rightPanel === 'simulation'}
              onClick={() => setRightPanel('simulation')}
            />
          </div>

          {/* Panel body */}
          <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card p-3 overflow-y-auto min-h-0">
            {rightPanel === 'properties' ? (
              <PropertiesPanel
                selectedNode={selectedNode}
                selectedEdge={selectedEdge}
                machineType={machineType}
                onUpdateNodeLabel={updateNodeLabel}
                onToggleInitial={toggleInitial}
                onToggleAccepting={toggleAccepting}
                onDeleteNode={(id) => { deleteNode(id); setSelectedNode(null); }}
                onUpdateEdgeSymbol={updateEdgeSymbol}
                onDeleteEdge={(id) => { deleteEdge(id); setSelectedEdge(null); }}
              />
            ) : (
              <SimulationPanel
                machine={machine}
                onSimStep={handleSimStep}
                onSimEnd={handleSimEnd}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile sim panel (below canvas) */}
      <div className="lg:hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card p-3">
        <SimulationPanel
          machine={machine}
          onSimStep={handleSimStep}
          onSimEnd={handleSimEnd}
        />
      </div>
    </div>
  );
}

function PanelTab({
  label,
  active,
  onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 text-xs font-medium py-1 rounded-lg transition-colors',
        active
          ? 'bg-primary-600 text-white'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
      )}
    >
      {label}
    </button>
  );
}

/** Wrap with ReactFlowProvider so useReactFlow works inside. */
export function PlaygroundPage() {
  return (
    <ReactFlowProvider>
      <PlaygroundInner />
    </ReactFlowProvider>
  );
}
