import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Edit2, CheckCircle2, AlertCircle, LogOut, Flame, Star, BookOpen } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useLearningProgress, progressManager } from '@/features/learning';
import { units } from '@/data/units';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Badge } from '@/components/ui';
import { cn, getRankInfo } from '@/utils';

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { user, logout, updateDisplayName } = useAuth();
  const navigate = useNavigate();
  const { state } = useLearningProgress();
  const stats = progressManager.getProgressStats(units);
  const rankInfo = getRankInfo(state.totalXP);

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.displayName ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameStatus, setNameStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const handleSaveName = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Display name cannot be empty.');
      return;
    }
    if (trimmed.length < 2) {
      setNameError('Display name must be at least 2 characters.');
      return;
    }
    setNameError(null);
    setNameStatus('saving');

    const { error } = await updateDisplayName(trimmed);
    if (error) {
      setNameStatus('error');
      setNameError(error);
    } else {
      setNameStatus('success');
      setIsEditing(false);
      setTimeout(() => setNameStatus('idle'), 2500);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const completedLessons = Object.keys(state.completedLessons).length;
  const completedChallenges = Object.keys(state.completedChallenges).length;

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      <PageHeader
        title="Profile & Settings"
        description="Manage your account details and track your overall progress."
      />

      {/* Account card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card p-6">
        <div className="flex items-start gap-4 mb-6">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-950 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
              {(user?.displayName ?? 'U')[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {user?.displayName ?? 'Guest'}
              </h2>
              <Badge variant="purple" className="text-[10px]">
                Level {rankInfo.level} · {rankInfo.title}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email ?? '—'}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: <Star className="w-4 h-4 text-purple-500" />, label: 'Total XP', value: state.totalXP },
            { icon: <Flame className="w-4 h-4 text-orange-500" />, label: 'Day Streak', value: state.streak },
            { icon: <BookOpen className="w-4 h-4 text-primary-500" />, label: 'Lessons', value: completedLessons },
            { icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, label: 'Challenges', value: completedChallenges },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 py-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800"
            >
              {icon}
              <span className="text-lg font-bold text-gray-900 dark:text-white">{value}</span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">{label}</span>
            </div>
          ))}
        </div>

        {/* Overall progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Overall Curriculum Progress
            </span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {stats.overallPercentage}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${stats.overallPercentage}%` }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-gray-800 mb-6" />

        {/* Edit display name */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Display name</span>
            </div>
            {!isEditing && (
              <button
                onClick={() => { setIsEditing(true); setNameInput(user?.displayName ?? ''); setNameError(null); }}
                className="flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveName} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  aria-label="Display name"
                  aria-describedby={nameError ? 'name-err' : undefined}
                  aria-invalid={Boolean(nameError)}
                  className={cn(
                    'w-full px-3 py-2 text-sm rounded-xl border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white',
                    'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all',
                    nameError ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-700',
                  )}
                  placeholder="Your display name"
                  autoFocus
                />
                {nameError && (
                  <p id="name-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {nameError}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" isLoading={nameStatus === 'saving'}>
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setIsEditing(false); setNameError(null); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300 px-1">{user?.displayName ?? '—'}</p>
          )}

          {nameStatus === 'success' && (
            <p role="status" className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" /> Display name updated.
            </p>
          )}
        </div>

        {/* Email (read-only) */}
        <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Email</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 px-1">{user?.email ?? '—'}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 px-1 mt-0.5">
            Email cannot be changed. Contact the administrator if you need to update it.
          </p>
        </div>
      </div>

      {/* Sign out */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card p-6">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Sign out</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Your progress is saved to your account and will be available when you sign back in.
        </p>
        <Button
          variant="danger"
          size="sm"
          leftIcon={<LogOut className="w-4 h-4" />}
          onClick={handleLogout}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
