/**
 * Browser-native password hashing using the Web Crypto API (SubtleCrypto).
 *
 * Algorithm: PBKDF2 + SHA-256, 200 000 iterations, 32-byte key.
 * A random 16-byte salt is generated per password so two identical passwords
 * never produce the same stored hash.
 *
 * The stored format is:  <hex-salt>:<hex-derived-key>
 *
 * No npm dependency — SubtleCrypto is built into every modern browser and
 * into Node ≥ 15 / jsdom (via @vitest/browser or via globalThis.crypto).
 */

const ITERATIONS = 200_000;
const KEY_LENGTH = 32; // bytes → 256-bit key

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hex: string): Uint8Array {
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return result;
}

/**
 * Hash a plaintext password. Returns a storable `salt:hash` string.
 */
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8,
  );

  return `${bufToHex(salt)}:${bufToHex(derived)}`;
}

/**
 * Verify a plaintext password against a stored `salt:hash` string.
 * Returns true when the password matches.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;

  const enc = new TextEncoder();
  const salt = hexToBuf(saltHex);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8,
  );

  // Constant-time comparison to avoid timing attacks
  const derivedHex = bufToHex(derived);
  if (derivedHex.length !== hashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < derivedHex.length; i++) {
    diff |= derivedHex.charCodeAt(i) ^ hashHex.charCodeAt(i);
  }
  return diff === 0;
}
