import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  BookOpen,
  Trophy,
  FolderOpen,
  Info,
  Sun,
  Moon,
  Cpu,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils';
import { useTheme } from '@/hooks/useTheme';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/playground', label: 'Playground', icon: FlaskConical },
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/challenges', label: 'Challenges', icon: Trophy },
  { to: '/projects', label: 'My Projects', icon: FolderOpen },
];

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  onClick,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
          isActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
        )
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
    </NavLink>
  );
}

export function Sidebar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 h-screen sticky top-0 overflow-y-auto">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Visual Automata</div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Studio</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} end={item.end} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800 space-y-0.5">
        <NavItem to="/about" label="About" icon={Info} />
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors duration-150"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </div>

      {/* VIT attribution */}
      <div className="px-5 pb-5 pt-1">
        <p className="text-[10px] text-gray-400 dark:text-gray-600 leading-relaxed">
          VIT Pune · AY 2026–27<br />Automata Theory Syllabus
        </p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Top bar */}
      <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
            <Cpu className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Visual Automata Studio</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-gray-950 z-50 shadow-xl flex flex-col animate-slide-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">Visual Automata Studio</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <NavItem key={item.to} {...item} end={item.end} onClick={() => setOpen(false)} />
              ))}
            </nav>
            <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800 space-y-0.5">
              <NavItem to="/about" label="About" icon={Info} onClick={() => setOpen(false)} />
              <button
                onClick={() => { toggleTheme(); setOpen(false); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
