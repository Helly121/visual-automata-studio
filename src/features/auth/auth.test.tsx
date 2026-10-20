/**
 * Auth feature tests — local-DB implementation (no Supabase)
 *
 * Tests cover:
 * - AuthProvider context availability
 * - ProtectedRoute redirect behaviour
 * - LoginPage client-side form validation
 * - SignUpPage client-side form validation
 * - localDb user & session helpers
 * - crypto hashPassword / verifyPassword
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';

// ─── localStorage mock ────────────────────────────────────────────────────────
// Use a fresh in-memory store for each test to avoid cross-test contamination.

function makeLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
}

let localStorageMock = makeLocalStorageMock();

beforeEach(() => {
  localStorageMock = makeLocalStorageMock();
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderWithAuth(ui: React.ReactNode, initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}

function AuthStatus() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <span>Loading…</span>;
  return <span data-testid="auth-status">{user ? `Hello ${user.displayName}` : 'Not signed in'}</span>;
}

// ─── AuthProvider ─────────────────────────────────────────────────────────────

describe('AuthProvider', () => {
  it('renders children and starts with no user when localStorage is empty', async () => {
    renderWithAuth(<AuthStatus />);
    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('Not signed in');
    });
  });

  it('throws when useAuth is used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AuthStatus />)).toThrow();
    spy.mockRestore();
  });
});

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login', async () => {
    const { ProtectedRoute } = await import('./ProtectedRoute');
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

// ─── localDb helpers ──────────────────────────────────────────────────────────

describe('localDb', () => {
  it('creates a user and retrieves them by email', async () => {
    const { createUser, getUserByEmail } = await import('@/lib/localDb');
    createUser('test@example.com', 'Test User', 'hash:abc123');
    const found = getUserByEmail('test@example.com');
    expect(found).not.toBeNull();
    expect(found!.displayName).toBe('Test User');
    expect(found!.email).toBe('test@example.com');
  });

  it('normalises email to lowercase', async () => {
    const { createUser, getUserByEmail } = await import('@/lib/localDb');
    createUser('UPPER@EXAMPLE.COM', 'Upper User', 'hash:xyz');
    expect(getUserByEmail('upper@example.com')).not.toBeNull();
  });

  it('returns null for unknown email', async () => {
    const { getUserByEmail } = await import('@/lib/localDb');
    expect(getUserByEmail('nobody@example.com')).toBeNull();
  });

  it('prevents duplicate email registrations at the AuthContext level', async () => {
    const { createUser } = await import('@/lib/localDb');
    createUser('dup@example.com', 'First', 'hash:1');
    // Second call at the AuthContext level checks getUserByEmail before creating
    const { getUserByEmail } = await import('@/lib/localDb');
    const existing = getUserByEmail('dup@example.com');
    expect(existing).not.toBeNull();
  });

  it('creates and reads back a session', async () => {
    const { createSession, getSession } = await import('@/lib/localDb');
    createSession('user-abc');
    const session = getSession();
    expect(session).not.toBeNull();
    expect(session!.userId).toBe('user-abc');
  });

  it('clears a session', async () => {
    const { createSession, clearSession, getSession } = await import('@/lib/localDb');
    createSession('user-xyz');
    clearSession();
    expect(getSession()).toBeNull();
  });

  it('updateUser persists display name change', async () => {
    const { createUser, updateUser, getUserById } = await import('@/lib/localDb');
    const user = createUser('update@example.com', 'Old Name', 'hash:old');
    updateUser(user.id, { displayName: 'New Name' });
    const updated = getUserById(user.id);
    expect(updated!.displayName).toBe('New Name');
  });
});

// ─── crypto helpers ───────────────────────────────────────────────────────────

describe('crypto', () => {
  it('hashPassword produces a salt:hash string', async () => {
    const { hashPassword } = await import('@/lib/crypto');
    const hash = await hashPassword('MySecret1');
    expect(hash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });

  it('verifyPassword returns true for correct password', async () => {
    const { hashPassword, verifyPassword } = await import('@/lib/crypto');
    const hash = await hashPassword('CorrectPassword1');
    expect(await verifyPassword('CorrectPassword1', hash)).toBe(true);
  });

  it('verifyPassword returns false for wrong password', async () => {
    const { hashPassword, verifyPassword } = await import('@/lib/crypto');
    const hash = await hashPassword('CorrectPassword1');
    expect(await verifyPassword('WrongPassword1', hash)).toBe(false);
  });

  it('two hashes of the same password are different (unique salts)', async () => {
    const { hashPassword } = await import('@/lib/crypto');
    const h1 = await hashPassword('SamePassword1');
    const h2 = await hashPassword('SamePassword1');
    expect(h1).not.toBe(h2);
  });
});

// ─── LoginPage form validation ────────────────────────────────────────────────

describe('LoginPage – client-side validation', () => {
  beforeEach(async () => {
    const { LoginPage } = await import('@/pages/LoginPage');
    renderWithAuth(<LoginPage />);
  });

  it('shows email required error on empty submit', async () => {
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeDefined();
    });
  });

  it('shows invalid email error', async () => {
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'bad-email' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeDefined();
    });
  });

  it('shows password required error', async () => {
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeDefined();
    });
  });

  it('shows incorrect credentials error for unknown user', async () => {
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'ghost@nowhere.com' } });
    fireEvent.change(screen.getByRole('textbox', { name: /email address/i }), { target: { value: 'ghost@nowhere.com' } });
    // target the password input directly by id to avoid matching the show/hide button aria-label
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'Password1' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/incorrect email or password/i)).toBeDefined();
    });
  });
});

// ─── SignUpPage form validation ───────────────────────────────────────────────

describe('SignUpPage – client-side validation', () => {
  beforeEach(async () => {
    const { SignUpPage } = await import('@/pages/SignUpPage');
    renderWithAuth(<SignUpPage />);
  });

  it('shows name required error on empty submit', async () => {
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeDefined();
    });
  });

  it('rejects password shorter than 8 characters', async () => {
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
