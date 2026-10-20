import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  getSession,
  createSession,
  clearSession,
} from '@/lib/localDb';
import { hashPassword, verifyPassword } from '@/lib/crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  /** Always true — local auth is always available, no env-var setup required. */
  isConfigured: true;
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

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session from localStorage
  useEffect(() => {
    const session = getSession();
    if (session) {
      const stored = getUserById(session.userId);
      if (stored) {
        setUser({ id: stored.id, email: stored.email, displayName: stored.displayName });
      } else {
        // Session references a deleted user — clear it
        clearSession();
      }
    }
    setIsLoading(false);
  }, []);

  const signUp = useCallback(
    async ({ name, email, password }: SignUpCredentials): Promise<AuthResult> => {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();

      if (getUserByEmail(trimmedEmail)) {
        return { error: 'An account with this email already exists.' };
      }

      const passwordHash = await hashPassword(password);
      const stored = createUser(trimmedEmail, trimmedName, passwordHash);
      createSession(stored.id);
      setUser({ id: stored.id, email: stored.email, displayName: stored.displayName });
      return { error: null };
    },
    [],
  );

  const login = useCallback(
    async ({ email, password }: LoginCredentials): Promise<AuthResult> => {
      const stored = getUserByEmail(email.trim());
      if (!stored) {
        return { error: 'Incorrect email or password.' };
      }

      const valid = await verifyPassword(password, stored.passwordHash);
      if (!valid) {
        return { error: 'Incorrect email or password.' };
      }

      createSession(stored.id);
      setUser({ id: stored.id, email: stored.email, displayName: stored.displayName });
      return { error: null };
    },
    [],
  );

  const logout = useCallback(async () => {
    clearSession();
    setUser(null);
  }, []);

  const updateDisplayName = useCallback(
    async (name: string): Promise<AuthResult> => {
      const trimmed = name.trim();
      if (!trimmed) return { error: 'Display name cannot be empty.' };
      if (!user) return { error: 'Not signed in.' };

      const updated = updateUser(user.id, { displayName: trimmed });
      if (!updated) return { error: 'Failed to update display name.' };

      setUser({ ...user, displayName: trimmed });
      return { error: null };
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isConfigured: true,
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
