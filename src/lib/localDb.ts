/**
 * Local "database" backed entirely by localStorage.
 *
 * Schema
 * ──────
 *   vas_users_v1   → StoredUser[]        (all accounts)
 *   vas_session_v1 → StoredSession | null (active session)
 *
 * Passwords are never stored in plain text. Each entry holds a
 * PBKDF2-derived key in the format `<hex-salt>:<hex-hash>`.
 *
 * User progress is stored separately under `vas_progress_<userId>`
 * by the LocalUserProgressAdapter, giving per-account isolation.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoredUser {
  id: string;           // UUID v4
  email: string;        // lower-cased on write
  displayName: string;
  passwordHash: string; // "<salt-hex>:<derived-hex>"
  createdAt: string;    // ISO timestamp
}

export interface StoredSession {
  userId: string;
  createdAt: string;
  /** Session expires after 30 days of inactivity */
  expiresAt: string;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const USERS_KEY = 'vas_users_v1';
const SESSION_KEY = 'vas_session_v1';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[localDb] Failed to write to localStorage:', e);
  }
}

function uuid(): string {
  // crypto.randomUUID() is available in all modern browsers and in Node ≥ 14.17
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for jsdom in tests
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── User store ───────────────────────────────────────────────────────────────

export function getAllUsers(): StoredUser[] {
  return readJson<StoredUser[]>(USERS_KEY) ?? [];
}

export function getUserByEmail(email: string): StoredUser | null {
  return getAllUsers().find((u) => u.email === email.toLowerCase().trim()) ?? null;
}

export function getUserById(id: string): StoredUser | null {
  return getAllUsers().find((u) => u.id === id) ?? null;
}

export function createUser(
  email: string,
  displayName: string,
  passwordHash: string,
): StoredUser {
  const users = getAllUsers();
  const user: StoredUser = {
    id: uuid(),
    email: email.toLowerCase().trim(),
    displayName: displayName.trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  writeJson(USERS_KEY, [...users, user]);
  return user;
}

export function updateUser(
  id: string,
  patch: Partial<Pick<StoredUser, 'displayName' | 'passwordHash'>>,
): StoredUser | null {
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...patch };
  writeJson(USERS_KEY, users);
  return users[idx];
}

// ─── Session store ────────────────────────────────────────────────────────────

export function getSession(): StoredSession | null {
  const session = readJson<StoredSession>(SESSION_KEY);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    clearSession();
    return null;
  }
  return session;
}

export function createSession(userId: string): StoredSession {
  const now = new Date();
  const session: StoredSession = {
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
  };
  writeJson(SESSION_KEY, session);
  return session;
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
