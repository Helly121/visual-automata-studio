import { cn } from '@/utils';

type BadgeVariant = 'blue' | 'purple' | 'green' | 'red' | 'yellow' | 'gray' | 'orange' | 'pink' | 'emerald' | 'violet';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  green: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  yellow: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  pink: 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
};

const dotColors: Record<BadgeVariant, string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  violet: 'bg-violet-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  gray: 'bg-gray-400',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
};

export function Badge({ variant = 'gray', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full',
        variantStyles[variant],
        className,
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: 'completed' | 'in-progress' | 'available' | 'locked' | 'coming-soon' }) {
  const map = {
    completed: { label: 'Completed', variant: 'green' as BadgeVariant, dot: true },
    'in-progress': { label: 'In Progress', variant: 'blue' as BadgeVariant, dot: true },
    available: { label: 'Available', variant: 'gray' as BadgeVariant, dot: false },
    locked: { label: 'Locked', variant: 'gray' as BadgeVariant, dot: false },
    'coming-soon': { label: 'Coming Soon', variant: 'purple' as BadgeVariant, dot: false },
  };
  const { label, variant, dot } = map[status];
  return <Badge variant={variant} dot={dot}>{label}</Badge>;
}
