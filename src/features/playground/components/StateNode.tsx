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
 * - Hover handles for drag-to-connect
 */
export const StateNode = memo(function StateNode({
  id,
  data,
  selected,
}: NodeProps & { data: StateNodeData }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  const [prevLabel, setPrevLabel] = useState(data.label);
  if (prevLabel !== data.label && !editing) {
    setPrevLabel(data.label);
    setDraft(data.label);
  }

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== data.label) {
      window.dispatchEvent(
        new CustomEvent('state-rename', {
          detail: { id, label: trimmed },
          bubbles: true,
        }),
      );
    }
    setDraft(data.label);
  };

  const isActive = data.isActive;
  const isAccepting = data.isAccepting;
  const isInitial = data.isInitial;

  return (
    <div className="relative group flex items-center justify-center">
      {/* Initial state entry arrow */}
      {isInitial && (
        <div className="absolute -left-9 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <div className="w-6 h-0.5 bg-primary-600 dark:bg-primary-400" />
          <div
            className="w-0 h-0"
            style={{
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderLeft: '8px solid #2563eb',
            }}
          />
        </div>
      )}

      {/* Outer concentric ring for accepting states */}
      {isAccepting && (
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 pointer-events-none transition-colors duration-150',
            isActive
              ? 'border-blue-500 ring-2 ring-blue-300 ring-offset-1'
              : selected
                ? 'border-primary-600'
                : 'border-gray-500 dark:border-gray-400',
          )}
          style={{ margin: '-6px' }}
        />
      )}

      {/* Main circle */}
      <div
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className={cn(
          'w-14 h-14 rounded-full border-2 flex items-center justify-center',
          'cursor-pointer select-none transition-all duration-150 shadow-sm',
          isActive
            ? 'bg-blue-500 border-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900 scale-110'
            : selected
              ? 'bg-primary-50 border-primary-600 text-primary-700 dark:bg-primary-950 dark:border-primary-400 dark:text-primary-300 ring-2 ring-primary-300 ring-offset-1'
              : 'bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200 hover:border-primary-500 dark:hover:border-primary-400',
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
              if (e.key === 'Escape') {
                setEditing(false);
                setDraft(data.label);
              }
            }}
            className="w-11 text-center text-sm font-semibold bg-transparent outline-none border-b border-primary-500"
            maxLength={10}
            autoFocus
          />
        ) : (
          <span className="text-sm font-semibold font-mono tracking-tight">{data.label}</span>
        )}
      </div>

      {/* React Flow handles (discoverable on hover) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!w-2.5 !h-2.5 !bg-primary-500 !border-2 !border-white dark:!border-gray-900 opacity-0 group-hover:opacity-75 hover:!opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!w-2.5 !h-2.5 !bg-primary-500 !border-2 !border-white dark:!border-gray-900 opacity-0 group-hover:opacity-75 hover:!opacity-100 transition-opacity"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!w-2.5 !h-2.5 !bg-primary-500 !border-2 !border-white dark:!border-gray-900 opacity-0 group-hover:opacity-75 hover:!opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!w-2.5 !h-2.5 !bg-primary-500 !border-2 !border-white dark:!border-gray-900 opacity-0 group-hover:opacity-75 hover:!opacity-100 transition-opacity"
      />
    </div>
  );
});
