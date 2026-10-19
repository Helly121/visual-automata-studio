import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/utils';
import type { StateNodeData } from '@/engine/types';

/**
 * Custom React Flow node for a finite automaton state.
 * - Double-bordered circle when accepting
 * - Entry arrow indicator when initial
 * - Blue highlight when active during simulation
 * - Double-click to rename inline
 */
export const StateNode = memo(function StateNode({
  data,
  selected,
}: NodeProps & { data: StateNodeData }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(data.label);
  }, [data.label]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    // Parent handles label change via onNodesChange / updateNodeData
    if (draft.trim() && draft !== data.label) {
      // Dispatch custom event — PlaygroundCanvas listens for this
      const event = new CustomEvent('state-rename', {
        detail: { draft: draft.trim() },
        bubbles: true,
      });
      inputRef.current?.dispatchEvent(event);
    }
    setDraft(data.label);
  };

  const isActive = data.isActive;
  const isAccepting = data.isAccepting;
  const isInitial = data.isInitial;

  return (
    <div className="relative flex items-center justify-center">
      {/* Initial state arrow */}
      {isInitial && (
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex items-center">
          <div className="w-6 h-px bg-gray-400 dark:bg-gray-500" />
          <div
            className="w-0 h-0"
            style={{
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderLeft: '8px solid #9ca3af',
            }}
          />
        </div>
      )}

      {/* Outer ring for accepting states */}
      {isAccepting && (
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2',
            isActive
              ? 'border-blue-500'
              : selected
                ? 'border-primary-600'
                : 'border-gray-400 dark:border-gray-500',
          )}
          style={{ margin: '-6px' }}
        />
      )}

      {/* Main circle */}
      <div
        onDoubleClick={() => setEditing(true)}
        className={cn(
          'w-14 h-14 rounded-full border-2 flex items-center justify-center',
          'cursor-pointer select-none transition-all duration-150',
          isActive
            ? 'bg-blue-500 border-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900 scale-110'
            : selected
              ? 'bg-primary-50 border-primary-600 text-primary-700 dark:bg-primary-950 dark:border-primary-400 dark:text-primary-300'
              : 'bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200 hover:border-gray-600 dark:hover:border-gray-400',
        )}
      >
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setEditing(false); setDraft(data.label); }
            }}
            className="w-10 text-center text-sm font-semibold bg-transparent outline-none"
            maxLength={8}
          />
        ) : (
          <span className="text-sm font-semibold font-mono">{data.label}</span>
        )}
      </div>

      {/* React Flow handles (invisible connection points) */}
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
      <Handle type="target" position={Position.Top} id="top-target" className="opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="opacity-0" />
      <Handle type="target" position={Position.Right} id="right-target" className="opacity-0" />
      <Handle type="source" position={Position.Left} id="left-source" className="opacity-0" />
    </div>
  );
});
