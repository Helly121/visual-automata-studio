import { useNavigate, NavLink } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
      {/* Automata Trap State Graphic */}
      <div className="relative mb-6">
        <svg
          viewBox="0 0 240 120"
          className="w-64 h-32 text-gray-800 dark:text-gray-100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Start arrow */}
          <path d="M 20 60 L 50 60" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 3" />
          <polygon points="50,60 42,56 42,64" fill="#94A3B8" />

          {/* State q0 */}
          <circle cx="75" cy="60" r="24" fill="#F1F5F9" className="dark:fill-gray-800" stroke="#2563EB" strokeWidth="2.5" />
          <text x="75" y="65" textAnchor="middle" fontSize="13" fontWeight="bold" fill="currentColor">
            q₀
          </text>

          {/* Transition arrow to trap */}
          <path d="M 100 60 L 160 60" stroke="#EF4444" strokeWidth="2.5" />
          <polygon points="160,60 152,56 152,64" fill="#EF4444" />
          <text x="130" y="52" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#EF4444">
            404 / ε
          </text>

          {/* Trap State q_trap (Dead State) */}
          <circle cx="185" cy="60" r="24" fill="#FEF2F2" className="dark:fill-red-950/40" stroke="#EF4444" strokeWidth="2.5" />
          {/* Dead state self-loop */}
          <path d="M 175 37 C 170 12, 200 12, 195 37" stroke="#EF4444" strokeWidth="2" fill="none" />
          <polygon points="195,37 197,29 191,32" fill="#EF4444" />
          <text x="185" y="10" textAnchor="middle" fontSize="10" fill="#EF4444">
            Σ
          </text>

          <text x="185" y="65" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#EF4444">
            q_trap
          </text>
        </svg>
      </div>

      <div className="inline-block px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-mono font-bold mb-3">
        &delta;(q_current, URL) = q_dead
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
        Non-Accepting State Reached
      </h1>

      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
        The requested path does not belong to the regular language of Visual Automata Studio.
        The machine has halted in a non-accepting dead state.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          leftIcon={<Home className="w-4 h-4" />}
          onClick={() => navigate('/')}
        >
          Return to Dashboard
        </Button>
        <Button
          variant="outline"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </div>

      {/* Helpful links */}
      <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
        <NavLink to="/learn" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          Browse Syllabus
        </NavLink>
        <span>&bull;</span>
        <NavLink to="/playground" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          Open Playground
        </NavLink>
        <span>&bull;</span>
        <NavLink to="/challenges" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          Try Challenges
        </NavLink>
      </div>
    </div>
  );
}
