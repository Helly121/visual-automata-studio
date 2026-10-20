import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cpu, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui';
import { cn } from '@/utils';

// ─── Validation ───────────────────────────────────────────────────────────────

function validateName(name: string): string | null {
  if (!name.trim()) return 'Name is required.';
  if (name.trim().length < 2) return 'Name must be at least 2 characters.';
  return null;
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  return null;
}

function validateConfirm(password: string, confirm: string): string | null {
  if (!confirm) return 'Please confirm your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}

// ─── Password strength indicator ─────────────────────────────────────────────

function passwordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string } {
  if (!pw) return { level: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: 'Weak' };
  if (score === 2) return { level: 2, label: 'Fair' };
  return { level: 3, label: 'Strong' };
}

const strengthColor = {
  0: '',
  1: 'bg-red-400',
  2: 'bg-yellow-400',
  3: 'bg-green-500',
};
const strengthTextColor = {
  0: '',
  1: 'text-red-500',
  2: 'text-yellow-600',
  3: 'text-green-600',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SignUpPage() {
  const { signUp, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string; email?: string; password?: string; confirm?: string; form?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const strength = passwordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmErr = validateConfirm(password, confirm);

    if (nameErr || emailErr || passwordErr || confirmErr) {
      setErrors({
        name: nameErr ?? undefined,
        email: emailErr ?? undefined,
        password: passwordErr ?? undefined,
        confirm: confirmErr ?? undefined,
      });
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    const { error } = await signUp({ name, email, password });
    setIsSubmitting(false);

    if (error) {
      setErrors({ form: error });
    } else {
      // Supabase may require email confirmation depending on project settings.
      // We show a success message and redirect to login after a short delay.
      setSuccessMessage(
        'Account created! Check your email for a confirmation link, then sign in.',
      );
      setTimeout(() => navigate('/login'), 4000);
    }
  };

  if (successMessage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-14 h-14 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">You&apos;re almost in!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{successMessage}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Redirecting to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Visual Automata</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Studio</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card p-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Create account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Join VIT Pune&apos;s Automata Theory platform.
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
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-describedby={errors.name ? 'name-error' : undefined}
                aria-invalid={Boolean(errors.name)}
                className={cn(
                  'w-full px-3 py-2 text-sm rounded-xl border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white',
                  'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all',
                  errors.name ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-700',
                )}
                placeholder="Aarav Sharma"
              />
              {errors.name && (
                <p id="name-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

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
                  errors.email ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-700',
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby={errors.password ? 'password-error' : 'password-hint'}
                  aria-invalid={Boolean(errors.password)}
                  className={cn(
                    'w-full px-3 py-2 pr-10 text-sm rounded-xl border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white',
                    'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all',
                    errors.password ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-700',
                  )}
                  placeholder="At least 8 chars, 1 uppercase, 1 number"
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

              {/* Strength meter */}
              {password && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((lvl) => (
                      <div
                        key={lvl}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-colors',
                          strength.level >= lvl ? strengthColor[strength.level] : 'bg-gray-200 dark:bg-gray-700',
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn('text-[11px] font-medium', strengthTextColor[strength.level])}>
                    {strength.label}
                  </p>
                </div>
              )}

              {errors.password ? (
                <p id="password-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              ) : (
                <p id="password-hint" className="mt-1 text-[11px] text-gray-400">
                  Min 8 characters, 1 uppercase letter, 1 number
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirm" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-describedby={errors.confirm ? 'confirm-error' : undefined}
                aria-invalid={Boolean(errors.confirm)}
                className={cn(
                  'w-full px-3 py-2 text-sm rounded-xl border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white',
                  'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all',
                  errors.confirm ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-700',
                )}
                placeholder="••••••••"
              />
              {errors.confirm && (
                <p id="confirm-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.confirm}
                </p>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isSubmitting}
              leftIcon={<UserPlus className="w-4 h-4" />}
              disabled={!isConfigured}
            >
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
