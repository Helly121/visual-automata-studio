import { NavLink, useNavigate } from 'react-router-dom';
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
  User,
  LogOut,
  LogIn,
  ChevronDown,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/features/auth/AuthContext';

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

// ─── User account menu ────────────────────────────────────────────────────────

function UserAccountMenu({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    onClose?.();
    await logout();
    navigate('/login', { replace: true });
  };

  const handleProfile = () => {
    setOpen(false);
    onClose?.();
    navigate('/profile');
  };

  if (!user) {
    return (
      <NavLink
        to="/login"
        onClick={onClose}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors duration-150"
      >
        <LogIn className="w-4 h-4 flex-shrink-0" />
        Sign in
      </NavLink>
    );
  }

  const initials = user.displayName[0].toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
      >
        <div className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-950 flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-bold text-primary-700 dark:text-primary-300">{initials}</span>
        </div>
        <span className="flex-1 text-left truncate text-xs">{user.displayName}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-card-hover py-1 z-50 animate-fade-in"
        >
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user.displayName}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
          </div>
          <button
            role="menuitem"
            onClick={handleProfile}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <User className="w-3.5 h-3.5" /> Profile &amp; Settings
          </button>
          <button
            role="menuitem"
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      )}
    </div>
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
        <UserAccountMenu />
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
              <UserAccountMenu onClose={() => setOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
