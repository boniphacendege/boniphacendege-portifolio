/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Cryptographic Authentication & 2FA Utility
 * Implements salted SHA-256 password hashing and RFC 6238 TOTP (Google Authenticator)
 * for secure user and administrator authentication without exposing plain text credentials.
 */

const SALT_PREFIX = 'boniphace_ndege_secure_salt_v2_';

// Pure synchronous SHA-256 implementation for zero-delay instant verification
function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let compositeAscii = ascii + '\x80';
  while ((compositeAscii[lengthProperty] % 64) - 56) compositeAscii += '\x00';
  for (i = 0; i < compositeAscii[lengthProperty]; i++) {
    j = compositeAscii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = i < 16 ? w[i] : (w[i] = (
        (w[i - 16] +
          (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
          w[i - 7] +
          (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0
      ));
      const s1 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const ch = (hash[0] & hash[1]) ^ (~hash[0] & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ((hash[4] & hash[5]) ^ (~hash[4] & hash[6])) + k[i] + s0) | 0;
      const temp2 = (s1 + ch) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Creates a salted SHA-256 hash for secure internal storage
 */
export function hashPasscode(passcode: string): string {
  const normalized = passcode.trim();
  return sha256Sync(SALT_PREFIX + normalized);
}

/**
 * Verifies an entered passcode against a stored hash or default seed.
 * Prior initial passcode: "Boniphace2026"
 */
export function verifyPasscode(enteredPasscode: string, storedHashOrPass: string): boolean {
  if (!enteredPasscode) return false;
  const trimmed = enteredPasscode.trim();

  // Compare directly with hashed version
  const enteredHash = hashPasscode(trimmed);
  if (enteredHash === storedHashOrPass) return true;

  // Case-support for initial seed "Boniphace2026" / "boniphace2026"
  const defaultHash1 = hashPasscode('Boniphace2026');
  const defaultHash2 = hashPasscode('boniphace2026');
  if (
    (storedHashOrPass === defaultHash1 || storedHashOrPass === defaultHash2 ||
     storedHashOrPass === 'Boniphace2026' || storedHashOrPass === 'boniphace2026') &&
    (trimmed === 'Boniphace2026' || trimmed === 'boniphace2026')
  ) {
    return true;
  }

  // Also support legacy plain string match during migration
  if (storedHashOrPass === trimmed) {
    return true;
  }

  return false;
}

/* -------------------------------------------------------------------------- */
/* Google Authenticator (TOTP RFC 6238) & 2FA Helper Engine                  */
/* -------------------------------------------------------------------------- */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Default base32 secret for Admin Two-Factor Authentication
export const DEFAULT_ADMIN_2FA_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

/**
 * Decode Base32 string to Uint8Array
 */
function base32Decode(base32: string): Uint8Array {
  const cleaned = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

/**
 * Generate 6-digit TOTP code using Web Crypto HMAC-SHA1
 */
export async function generateTOTPCode(secretBase32: string = DEFAULT_ADMIN_2FA_SECRET, timeOffsetSteps: number = 0): Promise<string> {
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / 30) + timeOffsetSteps;

  // Convert timeStep to 8-byte big-endian buffer
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(4, timeStep, false);

  const keyBytes = base32Decode(secretBase32);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, buffer);
  const sigBytes = new Uint8Array(signature);

  const offset = sigBytes[sigBytes.length - 1] & 0xf;
  const binary =
    ((sigBytes[offset] & 0x7f) << 24) |
    ((sigBytes[offset + 1] & 0xff) << 16) |
    ((sigBytes[offset + 2] & 0xff) << 8) |
    (sigBytes[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verify TOTP code with time drift window of +/- 1 (current, -30s, +30s)
 */
export async function verifyTOTPCode(
  enteredCode: string,
  secretBase32: string = DEFAULT_ADMIN_2FA_SECRET,
  backupCodes: string[] = []
): Promise<boolean> {
  const cleanEntered = enteredCode.trim().replace(/\s+/g, '');
  if (!cleanEntered) return false;

  // 1. Check backup codes
  if (backupCodes.includes(cleanEntered)) {
    return true;
  }

  // 2. Check TOTP window (-1, 0, +1)
  try {
    const windows = [0, -1, 1];
    for (const step of windows) {
      const validCode = await generateTOTPCode(secretBase32, step);
      if (cleanEntered === validCode) {
        return true;
      }
    }
  } catch (err) {
    console.warn('TOTP calculation note:', err);
  }

  return false;
}

/**
 * Generates an Email Verification Code (6 digits)
 */
export function generateEmailVerificationCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return num.toString();
}

/**
 * Returns Google Authenticator otpauth URI for QR code generation
 */
export function getGoogleAuthenticatorUri(
  secret: string = DEFAULT_ADMIN_2FA_SECRET,
  accountName: string = 'boniphace.admin'
): string {
  const issuer = 'Boniphace Ndege Portfolio';
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/* -------------------------------------------------------------------------- */
/* Harsh Password Detection Engine & Anti-Hacker / Scammer Protection         */
/* -------------------------------------------------------------------------- */

export interface PasswordHarshnessResult {
  score: number; // 0 to 4 (0=Vulnerable, 1=Weak, 2=Moderate, 3=Strong, 4=Harsh)
  label: 'Vulnerable' | 'Weak' | 'Moderate' | 'Strong' | 'Harsh';
  color: string;
  isHarsh: boolean;
  checks: {
    minLength: boolean;      // >= 8 chars
    hasUppercase: boolean;   // [A-Z]
    hasLowercase: boolean;   // [a-z]
    hasNumber: boolean;      // [0-9]
    hasSpecialChar: boolean; // symbols (!@#$%^&*...)
    noCommonWords: boolean;  // Not vulnerable to common dictionary attacks
  };
  feedback: string;
}

/**
 * Live detector that evaluates whether a password meets harsh standards
 * to protect against hackers, automated botnet dictionaries, and scammers.
 */
export function detectPasswordHarshness(password: string): PasswordHarshnessResult {
  if (!password) {
    return {
      score: 0,
      label: 'Vulnerable',
      color: '#ef4444',
      isHarsh: false,
      checks: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        noCommonWords: true,
      },
      feedback: 'Password hidden in secure dots. Enter characters to detect strength.',
    };
  }

  const minLength = password.length >= 8;
  const optimalLength = password.length >= 10;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const commonPatterns = [
    '123456', 'password', 'qwerty', 'admin', 'passcode',
    '12345678', 'boniphace', 'tanzania', 'dodoma', 'secret'
  ];
  const lower = password.toLowerCase();
  const noCommonWords = !commonPatterns.some((pattern) => lower.includes(pattern) && password.length < 12);

  let passedCriteria = 0;
  if (minLength) passedCriteria += 1;
  if (optimalLength) passedCriteria += 0.5;
  if (hasUppercase) passedCriteria += 1;
  if (hasLowercase) passedCriteria += 1;
  if (hasNumber) passedCriteria += 1;
  if (hasSpecialChar) passedCriteria += 1.5;
  if (!noCommonWords) passedCriteria = Math.max(0, passedCriteria - 2);

  let score = 0;
  let label: 'Vulnerable' | 'Weak' | 'Moderate' | 'Strong' | 'Harsh' = 'Vulnerable';
  let color = '#ef4444';

  if (passedCriteria >= 5.5 && minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar && noCommonWords) {
    score = 4;
    label = 'Harsh'; // Maximum anti-hacker defense
    color = '#3dff8f'; // Emerald green
  } else if (passedCriteria >= 4 && minLength && (hasNumber || hasSpecialChar)) {
    score = 3;
    label = 'Strong';
    color = '#f0b92e'; // Gold
  } else if (passedCriteria >= 3 && minLength) {
    score = 2;
    label = 'Moderate';
    color = '#eab308'; // Amber
  } else if (passedCriteria >= 1.5) {
    score = 1;
    label = 'Weak';
    color = '#f97316'; // Orange
  } else {
    score = 0;
    label = 'Vulnerable';
    color = '#ef4444'; // Red
  }

  let feedback = '';
  if (score === 4) {
    feedback = '🛡️ Harsh Password detected: Maximum protection against hackers and scammers.';
  } else if (score === 3) {
    feedback = 'Strong password: Add a special symbol (!@#$) to reach Harsh tier.';
  } else if (score === 2) {
    feedback = 'Moderate: Include numbers, symbols, and uppercase letters.';
  } else if (score === 1) {
    feedback = 'Weak: Vulnerable to automated dictionary and scammer attacks.';
  } else {
    feedback = 'Vulnerable: Requires at least 8 characters with numbers and symbols.';
  }

  return {
    score,
    label,
    color,
    isHarsh: score === 4,
    checks: {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      noCommonWords,
    },
    feedback,
  };
}

/* -------------------------------------------------------------------------- */
/* Anti-Hacker / Scammer Rate Limiter & Brute-Force Lockout Engine            */
/* -------------------------------------------------------------------------- */

interface FailedAttemptRecord {
  attempts: number;
  lockUntil: number; // timestamp in ms
}

const attemptStore: Record<string, FailedAttemptRecord> = {};

export function checkBruteForceProtection(identifier: string = 'admin_portal'): {
  isLocked: boolean;
  remainingSeconds: number;
  attemptCount: number;
  maxAttempts: number;
} {
  const maxAttempts = 4;
  const record = attemptStore[identifier];
  if (!record) {
    return { isLocked: false, remainingSeconds: 0, attemptCount: 0, maxAttempts };
  }

  const now = Date.now();
  if (record.lockUntil > now) {
    const remainingSeconds = Math.ceil((record.lockUntil - now) / 1000);
    return { isLocked: true, remainingSeconds, attemptCount: record.attempts, maxAttempts };
  }

  // If lockout has elapsed, reset attempts
  if (record.lockUntil > 0 && record.lockUntil <= now) {
    record.attempts = 0;
    record.lockUntil = 0;
  }

  return { isLocked: false, remainingSeconds: 0, attemptCount: record.attempts, maxAttempts };
}

export function recordFailedPasscodeAttempt(identifier: string = 'admin_portal'): {
  isLocked: boolean;
  remainingSeconds: number;
  attemptCount: number;
} {
  const now = Date.now();
  if (!attemptStore[identifier]) {
    attemptStore[identifier] = { attempts: 0, lockUntil: 0 };
  }
  const record = attemptStore[identifier];
  record.attempts += 1;

  // After 4 failed attempts, lock for 30s; after 6, lock for 60s
  if (record.attempts >= 4) {
    const lockDurationSeconds = record.attempts >= 6 ? 60 : 30;
    record.lockUntil = now + lockDurationSeconds * 1000;
    return { isLocked: true, remainingSeconds: lockDurationSeconds, attemptCount: record.attempts };
  }

  return { isLocked: false, remainingSeconds: 0, attemptCount: record.attempts };
}

export function resetFailedPasscodeAttempts(identifier: string = 'admin_portal'): void {
  delete attemptStore[identifier];
}

