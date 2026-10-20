import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Cpu, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui';
import { cn } from '@/utils';

// ─── Validation ───────────────────────────────────────────────────────────────

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginPage() {
  const { login, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    if (emailErr || passwordErr) {
      setErrors({ email: emailErr ?? undefined, password: passwordErr ?? undefined });
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    const { error } = await login({ email, password });
    setIsSubmitting(false);

    if (error) {
      setErrors({ form: error });
    } else {
      navigate(nextPath, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
            <Cpu className="w-4.5 h-4.5 text-white w-5 h-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Visual Automata</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Studio</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card p-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Welcome back — your progress is waiting.
          </p>

          {/* Supabase not configured banner */}
          {!isConfigured && (
            <div className="flex items-start gap-2.5 p-3 mb-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Supabase is not configured. Copy <code className="font-mono">.env.example</code> to{' '}
                <code className="font-mono">.env</code> and add your credentials to enable authentication.
              </span>
            </div>
          )}

          {/* Form-level error */}
          {errors.form && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errors.form}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={Boolean(errors.email)}
                className={cn(
                  'w-full px-3 py-2 text-sm rounded-xl border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white',
                  'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all',
                  errors.email
                    ? 'border-red-400 dark:border-red-600'
                    : 'border-gray-200 dark:border-gray-700',
                )}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p id="email-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  aria-invalid={Boolean(errors.password)}
                  className={cn(
                    'w-full px-3 py-2 pr-10 text-sm rounded-xl border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white',
                    'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all',
                    errors.password
                      ? 'border-red-400 dark:border-red-600'
                      : 'border-gray-200 dark:border-gray-700',
                  )}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isSubmitting}
              leftIcon={<LogIn className="w-4 h-4" />}
              disabled={!isConfigured}
            >
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
