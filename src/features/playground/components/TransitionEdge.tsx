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
  source,
  target,
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

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  const isSelfLoop = source === target || (Math.abs(sourceX - targetX) < 2 && Math.abs(sourceY - targetY) < 2);

  if (isSelfLoop) {
    const cx = (sourceX + targetX) / 2;
    const cy = (sourceY + targetY) / 2;
    const startX = cx - 14;
    const startY = cy - 22;
    const endX = cx + 14;
    const endY = cy - 22;
    const c1X = cx - 36;
    const c1Y = cy - 66;
    const c2X = cx + 36;
    const c2Y = cy - 66;

    edgePath = `M ${startX} ${startY} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${endX} ${endY}`;
    labelX = cx;
    labelY = cy - 60;
  } else {
    const [path, lx, ly] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    edgePath = path;
    labelX = lx;
    labelY = ly;
  }

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
            'absolute px-1.5 py-0.5 rounded-md text-xs font-mono font-semibold pointer-events-auto',
            'border shadow-sm select-none transition-colors duration-150',
            isActive
              ? 'bg-blue-500 text-white border-blue-600 scale-110 shadow-md ring-2 ring-blue-300'
              : selected
                ? 'bg-primary-50 text-primary-700 border-primary-400 dark:bg-primary-950 dark:text-primary-300 dark:border-primary-600 ring-1 ring-primary-400'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400',
          )}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {symbol === 'ε' ? 'ε' : symbol || 'λ'}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
