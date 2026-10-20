/**
 * Auth feature tests
 *
 * Tests cover:
 * - AuthProvider context availability
 * - ProtectedRoute behaviour (redirect when unauthenticated, render when authenticated)
 * - LoginPage form validation (client-side)
 * - SignUpPage form validation (client-side)
 * - ProfilePage rendering with a mocked authenticated user
 *
 * Supabase network calls are mocked so tests remain offline.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

// ─── Mock Supabase ────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase', () => {
  const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } });
  const mockSignInWithPassword = vi.fn().mockResolvedValue({ error: null });
  const mockSignUp = vi.fn().mockResolvedValue({ error: null });
  const mockSignOut = vi.fn().mockResolvedValue({});
  const mockUpdateUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
  const mockOnAuthStateChange = vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  }));

  return {
    isSupabaseConfigured: true,
    supabase: {
      auth: {
        getSession: mockGetSession,
        signInWithPassword: mockSignInWithPassword,
        signUp: mockSignUp,
        signOut: mockSignOut,
        updateUser: mockUpdateUser,
        onAuthStateChange: mockOnAuthStateChange,
      },
    },
  };
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderWithAuth(ui: React.ReactNode, initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}

// A simple component that shows auth state
function AuthStatus() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <span>Loading…</span>;
  return <span>{user ? `Hello ${user.displayName}` : 'Not signed in'}</span>;
}

// ─── AuthProvider ─────────────────────────────────────────────────────────────

describe('AuthProvider', () => {
  it('renders children and exposes context', async () => {
    renderWithAuth(<AuthStatus />);
    // Initially loading, then resolves
    await waitFor(() => {
      expect(screen.getByText('Not signed in')).toBeDefined();
    });
  });

  it('throws when useAuth is used outside provider', () => {
    // Suppress expected console.error from React
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AuthStatus />)).toThrow();
    spy.mockRestore();
  });
});

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login', async () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<span>Login page</span>} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <span>Profile page</span>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText('Profile page')).toBeNull();
      expect(screen.getByText('Login page')).toBeDefined();
    });
  });
});

// ─── LoginPage validation ─────────────────────────────────────────────────────

describe('LoginPage – client-side validation', () => {
  beforeEach(async () => {
    const { LoginPage } = await import('@/pages/LoginPage');
    renderWithAuth(<LoginPage />);
  });

  it('shows email error when submitted empty', async () => {
    const btn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeDefined();
    });
  });

  it('shows invalid email error', async () => {
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    const btn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeDefined();
    });
  });

  it('shows password required error when password missing', async () => {
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    const btn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeDefined();
    });
  });
});

// ─── SignUpPage validation ────────────────────────────────────────────────────

describe('SignUpPage – client-side validation', () => {
  beforeEach(async () => {
    const { SignUpPage } = await import('@/pages/SignUpPage');
    renderWithAuth(<SignUpPage />);
  });

  it('shows name required error when submitted empty', async () => {
    const btn = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeDefined();
    });
  });

  it('rejects weak password (too short)', async () => {
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Aarav' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeDefined();
    });
  });

  it('rejects mismatched passwords', async () => {
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Aarav' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password2' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeDefined();
    });
  });

  it('rejects password missing uppercase letter', async () => {
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Aarav' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password1' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password1' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/uppercase/i)).toBeDefined();
    });
  });

  it('rejects password missing a number', async () => {
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Aarav' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/one number/i)).toBeDefined();
    });
  });
});

// ─── ProfilePage ──────────────────────────────────────────────────────────────

describe('ProfilePage – authenticated rendering', () => {
  it('renders user info and stats when authenticated', async () => {
    // Override the mock to return an authenticated session
    const { supabase } = await import('@/lib/supabase');
    const mockUser = {
      id: 'user-123',
      email: 'student@vit.edu',
      user_metadata: { display_name: 'Aarav Sharma' },
    };
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          user: mockUser,
          access_token: 'token',
          refresh_token: 'refresh',
          expires_in: 3600,
          token_type: 'bearer',
        } as never,
      },
    } as never);
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementationOnce((cb) => {
      setTimeout(() => cb('SIGNED_IN', {
        user: mockUser,
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        token_type: 'bearer',
      } as never), 0);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { ProfilePage } = await import('@/pages/ProfilePage');
    renderWithAuth(<ProfilePage />);

    await waitFor(() => {
      // Name and email each appear in the header card and the edit section
      expect(screen.getAllByText('Aarav Sharma').length).toBeGreaterThan(0);
      expect(screen.getAllByText('student@vit.edu').length).toBeGreaterThan(0);
    });
  });
});
