import { useState, useCallback, useMemo, useEffect } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Node, Edge } from '@xyflow/react';
import { Save, Check } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { GitCompare } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui';
import { cn } from '@/utils';

import { PlaygroundCanvas } from '@/features/playground/components/PlaygroundCanvas';
import { PlaygroundToolbar } from '@/features/playground/components/PlaygroundToolbar';
import { PropertiesPanel } from '@/features/playground/components/PropertiesPanel';
import { SimulationPanel } from '@/features/playground/components/SimulationPanel';
import { PlaygroundTransitionTable } from '@/features/playground/components/PlaygroundTransitionTable';
import { PlaygroundValidation } from '@/features/playground/components/PlaygroundValidation';
import { SavedProjectsModal } from '@/features/playground/components/SavedProjectsModal';
import { useAutomataEditor } from '@/features/playground/hooks/useAutomataEditor';
import type { MachineType, SimConfig } from '@/engine/types';
import { serializeProject } from '@/engine/persistence';
import { validateAutomaton } from '@/engine/validate';

type RightPanelTab = 'properties' | 'simulation' | 'table' | 'validation';

/** Inner content — must live inside <ReactFlowProvider>. */
function PlaygroundInner() {
  const {
    nodes, edges, machineType, alphabet, projectName, setProjectName,
    editorMode, pendingConnectSource, setEditorMode, setPendingConnectSource,
    onNodesChange, onEdgesChange, onConnect, connectStates, addState, onCanvasDoubleClick,
    setMachineType, setAlphabet,
    updateNodeLabel, toggleInitial, toggleAccepting, deleteNode,
    updateEdgeSymbol, deleteEdge, setTransitionsForStateAndSymbol,
    loadExample, clearCanvas,
    highlightSimStep, clearHighlights,
    machine,
    canUndo, canRedo, undo, redo,
  } = useAutomataEditor();

  const { getNodes } = useReactFlow();

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanelTab>('properties');
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showExamplesDropdown, setShowExamplesDropdown] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Derive node positions from RF for save
  const nodePositions = useMemo(() => {
    const result: Record<string, { x: number; y: number }> = {};
    getNodes().forEach((n) => { result[n.id] = n.position; });
    return result;
  }, [getNodes, nodes]); // eslint-disable-line react-hooks/exhaustive-deps

  const validation = validateAutomaton(machine);

  // Sync selectedNode / selectedEdge with latest state
  const currentSelectedNode = useMemo(() => {
    if (!selectedNode) return null;
    return nodes.find((n) => n.id === selectedNode.id) ?? null;
  }, [nodes, selectedNode]);

  const currentSelectedEdge = useMemo(() => {
    if (!selectedEdge) return null;
    return edges.find((e) => e.id === selectedEdge.id) ?? null;
  }, [edges, selectedEdge]);

  const handleNodeSelect = useCallback(
    (node: Node | null) => {
      setSelectedNode(node);
      if (node) {
        setSelectedEdge(null);
        if (rightPanel !== 'table' && rightPanel !== 'simulation') {
          setRightPanel('properties');
        }
      }
    },
    [rightPanel],
  );

  const handleEdgeSelect = useCallback(
    (edge: Edge | null) => {
      setSelectedEdge(edge);
      if (edge) {
        setSelectedNode(null);
        if (rightPanel !== 'table' && rightPanel !== 'simulation') {
          setRightPanel('properties');
        }
      }
    },
    [rightPanel],
  );

  const handleStateNodeClick = useCallback(
    (node: Node) => {
      if (editorMode === 'connect') {
        if (!pendingConnectSource) {
          setPendingConnectSource(node.id);
        } else {
          // Connect pending source to clicked node (supports self loops if same)
          const edgeId = connectStates(pendingConnectSource, node.id);
          setPendingConnectSource(null);
          setEditorMode('select');
          const created = edges.find((e) => e.id === edgeId);
          if (created) setSelectedEdge(created);
        }
      } else {
        handleNodeSelect(node);
      }
    },
    [editorMode, pendingConnectSource, connectStates, setPendingConnectSource, setEditorMode, edges, handleNodeSelect],
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

  const navigate = useNavigate();

  const handleGoToTransform = () => {
    localStorage.setItem('vas-playground-machine', JSON.stringify(machine));
    navigate('/transform?source=playground');
  };

  const handleSaveProject = () => {
    const positions: Record<string, { x: number; y: number }> = {};
    getNodes().forEach((n) => { positions[n.id] = n.position; });
    const json = serializeProject(machine, projectName, '', positions);
    const key = `vas-project-${Date.now()}`;
    localStorage.setItem(key, json);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
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
    setEditorMode('select');
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
    setEditorMode('select');
  };

  const handleDeleteSelected = useCallback(() => {
    if (selectedNode) {
      deleteNode(selectedNode.id);
      setSelectedNode(null);
    } else if (selectedEdge) {
      deleteEdge(selectedEdge.id);
      setSelectedEdge(null);
    }
  }, [selectedNode, selectedEdge, deleteNode, deleteEdge]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === 'v' || e.key === 'V') {
        setEditorMode('select');
        setPendingConnectSource(null);
      } else if (e.key === 'a' || e.key === 'A') {
        setEditorMode('add-state');
        setPendingConnectSource(null);
      } else if (e.key === 'c' || e.key === 'C') {
        setEditorMode('connect');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if (e.key === 'Escape') {
        setEditorMode('select');
        setPendingConnectSource(null);
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setEditorMode, setPendingConnectSource, handleDeleteSelected]);

  return (
    <div className="animate-fade-in flex flex-col gap-3 h-[calc(100vh-72px)]">
      {/* Page header */}
      <PageHeader
        title="Playground"
        description="Design, simulate, and explore finite automata interactively from scratch."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToTransform}
              disabled={nodes.length === 0}
              leftIcon={<GitCompare className="w-3.5 h-3.5" />}
            >
              Transform
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveProject}
              disabled={nodes.length === 0}
              className="flex items-center gap-1.5"
            >
              {savedToast ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Save className="w-3.5 h-3.5" />}
              {savedToast ? 'Saved!' : 'Save Machine'}
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
        editorMode={editorMode}
        canUndo={canUndo}
        canRedo={canRedo}
        nodes={nodes}
        edges={edges}
        nodePositions={nodePositions}
        hasSelection={Boolean(selectedNode || selectedEdge)}
        showExamplesDropdown={showExamplesDropdown}
        onSetEditorMode={setEditorMode}
        onAddState={() => {
          const newNode = addState();
          setSelectedNode(newNode);
          setSelectedEdge(null);
        }}
        onDeleteSelected={handleDeleteSelected}
        onSetMachineType={setMachineType}
        onSetAlphabet={setAlphabet}
        onSetProjectName={setProjectName}
        onUndo={undo}
        onRedo={redo}
        onClear={() => {
          clearCanvas();
          setSelectedNode(null);
          setSelectedEdge(null);
          clearHighlights();
          setEditorMode('select');
        }}
        onLoadExample={handleLoadExample}
        onImportProject={handleImportProject}
        onToggleExamples={() => setShowExamplesDropdown((v) => !v)}
        onOpenValidation={() => setRightPanel('validation')}
        onOpenSavedProjects={() => setShowSavedModal(true)}
      />

      {/* Main workspace */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Central interactive canvas */}
        <div className="flex-1 min-w-0 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden relative">
          <PlaygroundCanvas
            nodes={nodes}
            edges={edges}
            editorMode={editorMode}
            pendingConnectSource={pendingConnectSource}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onCanvasDoubleClick={onCanvasDoubleClick}
            onCanvasClick={(pos) => {
              const newNode = addState(pos);
              setSelectedNode(newNode);
              setSelectedEdge(null);
            }}
            onNodeSelect={handleNodeSelect}
            onEdgeSelect={handleEdgeSelect}
            onStateNodeClick={handleStateNodeClick}
            onUpdateNodeLabel={updateNodeLabel}
            onAddFirstState={() => {
              const newNode = addState({ x: 180, y: 180 });
              setSelectedNode(newNode);
            }}
            onOpenExamples={() => setShowExamplesDropdown(true)}
            onCancelMode={() => {
              setEditorMode('select');
              setPendingConnectSource(null);
            }}
          />
        </div>

        {/* Right workspace panel (Properties, Simulate, Table, Validation) */}
        <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col gap-2 hidden lg:flex">
          {/* Panel tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1 shadow-xs">
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
            <PanelTab
              label="Table"
              active={rightPanel === 'table'}
              onClick={() => setRightPanel('table')}
            />
            <PanelTab
              label={
                validation.errors.length > 0 && nodes.length > 0
                  ? `Checks (${validation.errors.length})`
                  : 'Checks'
              }
              active={rightPanel === 'validation'}
              onClick={() => setRightPanel('validation')}
              badgeColor={validation.errors.length > 0 && nodes.length > 0 ? 'red' : undefined}
            />
          </div>

          {/* Panel body */}
          <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-3 overflow-y-auto min-h-0">
            {rightPanel === 'properties' && (
              <PropertiesPanel
                selectedNode={currentSelectedNode}
                selectedEdge={currentSelectedEdge}
                machineType={machineType}
                alphabet={alphabet}
                nodes={nodes}
                edges={edges}
                onUpdateNodeLabel={updateNodeLabel}
                onToggleInitial={toggleInitial}
                onToggleAccepting={toggleAccepting}
                onDeleteNode={(id) => {
                  deleteNode(id);
                  setSelectedNode(null);
                }}
                onUpdateEdgeSymbol={updateEdgeSymbol}
                onDeleteEdge={(id) => {
                  deleteEdge(id);
                  setSelectedEdge(null);
                }}
                onSelectNode={(id) => {
                  const node = nodes.find((n) => n.id === id);
                  if (node) handleNodeSelect(node);
                }}
              />
            )}

            {rightPanel === 'simulation' && (
              <SimulationPanel
                key={`${machine.type}-${machine.states.length}-${machine.transitions.length}-${machine.initialStateId}-${machine.acceptingStateIds.join(',')}-${machine.alphabet.join(',')}`}
                machine={machine}
                onSimStep={handleSimStep}
                onSimEnd={handleSimEnd}
              />
            )}

            {rightPanel === 'table' && (
              <PlaygroundTransitionTable
                machine={machine}
                alphabet={alphabet}
                machineType={machineType}
                selectedNodeId={selectedNode?.id ?? null}
                onAddState={() => {
                  const n = addState();
                  setSelectedNode(n);
                }}
                onUpdateNodeLabel={updateNodeLabel}
                onToggleInitial={toggleInitial}
                onToggleAccepting={toggleAccepting}
                onDeleteNode={(id) => {
                  deleteNode(id);
                  if (selectedNode?.id === id) setSelectedNode(null);
                }}
                onSetTransitions={setTransitionsForStateAndSymbol}
                onSelectNode={(id) => {
                  const node = nodes.find((n) => n.id === id);
                  if (node) handleNodeSelect(node);
                }}
              />
            )}

            {rightPanel === 'validation' && (
              <PlaygroundValidation
                machine={machine}
                machineType={machineType}
                onSelectNode={(nodeId) => {
                  const n = nodes.find((node) => node.id === nodeId);
                  if (n) {
                    setSelectedNode(n);
                    setSelectedEdge(null);
                    setRightPanel('properties');
                  }
                }}
                onSelectEdge={(edgeId) => {
                  const e = edges.find((edge) => edge.id === edgeId || edge.id === edgeId.split('_')[0]);
                  if (e) {
                    setSelectedEdge(e);
                    setSelectedNode(null);
                    setRightPanel('properties');
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile panels below canvas */}
      <div className="lg:hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-3">
        <SimulationPanel
          key={`mobile-${machine.type}-${machine.states.length}-${machine.transitions.length}-${machine.initialStateId}-${machine.acceptingStateIds.join(',')}-${machine.alphabet.join(',')}`}
          machine={machine}
          onSimStep={handleSimStep}
          onSimEnd={handleSimEnd}
        />
      </div>

      {/* Saved Projects Modal */}
      <SavedProjectsModal
        isOpen={showSavedModal}
        onClose={() => setShowSavedModal(false)}
        onLoadProject={handleImportProject}
      />
    </div>
  );
}

function PanelTab({
  label,
  active,
  onClick,
  badgeColor,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  badgeColor?: 'red' | 'yellow';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 text-xs font-semibold py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1',
        active
          ? 'bg-primary-600 text-white shadow-xs'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800',
        badgeColor === 'red' && !active && 'text-red-600 dark:text-red-400',
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
