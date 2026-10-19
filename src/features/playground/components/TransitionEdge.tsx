import { memo } from 'react';
import {
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  type EdgeProps,
} from '@xyflow/react';
import { cn } from '@/utils';
import type { TransitionEdgeData } from '@/engine/types';

export const TransitionEdge = memo(function TransitionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
  style,
}: EdgeProps & { data?: TransitionEdgeData }) {
  const isActive = data?.isActive ?? false;
  const symbol = data?.symbol ?? '';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeColor = isActive
    ? '#3b82f6'
    : selected
      ? '#2563eb'
      : '#9ca3af';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: edgeColor,
          strokeWidth: isActive ? 2.5 : selected ? 2 : 1.5,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />
      <EdgeLabelRenderer>
        <div
          className={cn(
            'absolute px-1.5 py-0.5 rounded-md text-xs font-mono font-semibold pointer-events-all',
            'border shadow-sm select-none',
            isActive
              ? 'bg-blue-500 text-white border-blue-600'
              : selected
                ? 'bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-950 dark:text-primary-300 dark:border-primary-700'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
          )}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {symbol === 'ε' ? 'ε' : symbol}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
