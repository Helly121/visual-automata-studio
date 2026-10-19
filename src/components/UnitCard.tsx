import { useNavigate } from 'react-router-dom';
import {
  Workflow, Hash, GitBranch, Layers, Cpu, BarChart2, Lock, ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils';
import { ProgressBar, StatusBadge } from '@/components/ui';
import type { Unit } from '@/types';

const iconMap: Record<string, React.ElementType> = {
  Workflow,
  Regex: Hash,
  GitBranch,
  Layers,
  Cpu,
  BarChart2,
};

const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
  blue:    { bg: 'bg-blue-50 dark:bg-blue-950',    icon: 'text-blue-600 dark:text-blue-400',    ring: 'ring-blue-100 dark:ring-blue-900' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-950', icon: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-100 dark:ring-violet-900' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950', icon: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-100 dark:ring-emerald-900' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-950', icon: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-100 dark:ring-orange-900' },
  pink:    { bg: 'bg-pink-50 dark:bg-pink-950',    icon: 'text-pink-600 dark:text-pink-400',    ring: 'ring-pink-100 dark:ring-pink-900' },
  red:     { bg: 'bg-red-50 dark:bg-red-950',      icon: 'text-red-600 dark:text-red-400',      ring: 'ring-red-100 dark:ring-red-900' },
};

interface UnitCardProps {
  unit: Unit;
  compact?: boolean;
}

export function UnitCard({ unit, compact = false }: UnitCardProps) {
  const navigate = useNavigate();
  const Icon = iconMap[unit.icon] ?? Cpu;
  const colors = colorMap[unit.color] ?? colorMap.blue;
  const pct = unit.totalLessons > 0 ? Math.round((unit.completedLessons / unit.totalLessons) * 100) : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/learn/${unit.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/learn/${unit.id}`)}
      className={cn(
        'group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl',
        'shadow-card hover:shadow-card-hover hover:border-gray-200 dark:hover:border-gray-700',
        'cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        compact ? 'p-4' : 'p-5',
      )}
    >
      <div className={cn('flex items-start gap-4', compact && 'gap-3')}>
        {/* Icon */}
        <div className={cn(
          'flex-shrink-0 rounded-xl flex items-center justify-center ring-1',
          colors.bg, colors.ring,
          compact ? 'w-9 h-9' : 'w-11 h-11',
        )}>
          <Icon className={cn(colors.icon, compact ? 'w-4 h-4' : 'w-5 h-5')} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
                Unit {unit.number}
              </p>
              <h3 className={cn(
                'font-semibold text-gray-900 dark:text-white leading-snug',
                compact ? 'text-sm' : 'text-base',
              )}>
                {unit.shortTitle}
              </h3>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 flex-shrink-0 mt-0.5 transition-colors" />
          </div>

          {!compact && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {unit.description}
            </p>
          )}

          {/* Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                {unit.completedLessons}/{unit.totalLessons} lessons
              </span>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{pct}%</span>
            </div>
            <ProgressBar value={unit.completedLessons} max={unit.totalLessons} />
          </div>
        </div>
      </div>

      {/* Status */}
      {!compact && (
        <div className="mt-4 flex items-center justify-between">
          <StatusBadge status={unit.status === 'available' ? 'available' : unit.status === 'in-progress' ? 'in-progress' : 'completed'} />
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{unit.estimatedHours}h estimated</span>
        </div>
      )}

      {/* Locked overlay */}
      {unit.status === 'coming-soon' && (
        <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 rounded-2xl flex items-center justify-center">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <Lock className="w-3.5 h-3.5" /> Coming Soon
          </div>
        </div>
      )}
    </div>
  );
}
