import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
}

export interface SignUpCredentials {
  name: string;
  email: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signUp: (credentials: SignUpCredentials) => Promise<AuthResult>;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<AuthResult>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    displayName:
      (user.user_metadata?.display_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split('@')[0] ??
      'User',
  };
}

function friendlyError(err: AuthError | null | unknown): string {
  if (!err) return 'An unknown error occurred.';
  const msg = (err as AuthError).message ?? String(err);

  if (msg.includes('Invalid login credentials')) return 'Incorrect email or password.';
  if (msg.includes('Email not confirmed')) return 'Please confirm your email before signing in.';
  if (msg.includes('User already registered')) return 'An account with this email already exists.';
  if (msg.includes('Password should be')) return 'Password must be at least 6 characters.';
  if (msg.includes('Unable to validate email')) return 'Please enter a valid email address.';
  if (msg.includes('signup is disabled')) return 'Sign-ups are currently disabled. Contact the administrator.';
  return msg;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session from localStorage (Supabase handles this automatically)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Retrieve the current session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ? toAuthUser(existingSession.user) : null);
      setIsLoading(false);
    });

    // Subscribe to future auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, updatedSession) => {
        setSession(updatedSession);
        setUser(updatedSession?.user ? toAuthUser(updatedSession.user) : null);
        setIsLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async ({ name, email, password }: SignUpCredentials): Promise<AuthResult> => {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name.trim() },
      },
    });
    return { error: error ? friendlyError(error) : null };
  }, []);

  const login = useCallback(async ({ email, password }: LoginCredentials): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: error ? friendlyError(error) : null };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateDisplayName = useCallback(async (name: string): Promise<AuthResult> => {
    const trimmed = name.trim();
    if (!trimmed) return { error: 'Display name cannot be empty.' };

    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: trimmed },
    });

    if (error) return { error: friendlyError(error) };

    // Reflect update immediately in local state
    if (data.user) setUser(toAuthUser(data.user));
    return { error: null };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signUp,
        login,
        logout,
        updateDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
