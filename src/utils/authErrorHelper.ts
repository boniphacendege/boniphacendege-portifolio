/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FriendlyAuthError {
  message: string;
  isOperationNotAllowed: boolean;
  consoleUrl?: string;
  actionHint?: string;
}

const FIREBASE_PROJECT_ID = 'gen-lang-client-0507302465';

export function formatAuthError(error: unknown, context: 'register' | 'login' | 'reset' | 'password_change' | 'delete_account'): FriendlyAuthError {
  const err = error as any;
  const code: string = err?.code || '';
  const rawMsg: string = err?.message || String(error || '');

  // 1. Email/Password provider disabled in Firebase Console
  if (code === 'auth/operation-not-allowed' || rawMsg.includes('operation-not-allowed')) {
    const action = context === 'register' ? 'Sign up' : 'Sign in';
    return {
      message: `Email/Password authentication is currently disabled in your Firebase project. To enable it, open the Firebase Console, go to Authentication > Sign-in method, and toggle "Email/Password" to Enabled. Alternatively, you can use Google Sign In below.`,
      isOperationNotAllowed: true,
      consoleUrl: `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/providers`,
      actionHint: `Enable Email/Password in Firebase Console or use Google Sign In.`
    };
  }

  // 2. Email already registered
  if (code === 'auth/email-already-in-use' || rawMsg.includes('email-already-in-use')) {
    return {
      message: 'This email address is already registered. Please sign in or use "Forgot password?" to recover your account.',
      isOperationNotAllowed: false
    };
  }

  // 3. Invalid email format
  if (code === 'auth/invalid-email' || rawMsg.includes('invalid-email')) {
    return {
      message: 'Please provide a valid email address (e.g. yourname@domain.com).',
      isOperationNotAllowed: false
    };
  }

  // 4. Weak password
  if (code === 'auth/weak-password' || rawMsg.includes('weak-password')) {
    return {
      message: 'Password is too short or weak. Please enter at least 6 characters with a combination of letters and numbers.',
      isOperationNotAllowed: false
    };
  }

  // 5. User not found / Invalid credentials
  if (
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/invalid-login-credentials' ||
    rawMsg.includes('invalid-credential') ||
    rawMsg.includes('user-not-found')
  ) {
    return {
      message: 'Invalid email or password. Please verify your credentials and try again.',
      isOperationNotAllowed: false
    };
  }

  // 6. Account temporarily locked / too many attempts
  if (code === 'auth/too-many-requests' || rawMsg.includes('too-many-requests')) {
    return {
      message: 'Access to this account has been temporarily disabled due to multiple failed login attempts. Please wait a few minutes or reset your password.',
      isOperationNotAllowed: false
    };
  }

  // 7. Network connection issues
  if (code === 'auth/network-request-failed' || rawMsg.includes('network-request-failed')) {
    return {
      message: 'A network error occurred while communicating with Firebase. Please verify your internet connection and try again.',
      isOperationNotAllowed: false
    };
  }

  // 8. Popup issues (Google Sign In)
  if (code === 'auth/popup-closed-by-user') {
    return {
      message: 'The Google Sign In popup was closed before completing authentication. Please try again.',
      isOperationNotAllowed: false
    };
  }

  if (code === 'auth/popup-blocked') {
    return {
      message: 'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.',
      isOperationNotAllowed: false
    };
  }

  // 9. Unauthorized domain
  if (code === 'auth/unauthorized-domain' || rawMsg.includes('unauthorized-domain')) {
    return {
      message: `This domain is not yet added to your Firebase Authorized Domains list. Please add your site domain in Firebase Console > Authentication > Settings > Authorized domains.`,
      isOperationNotAllowed: false,
      consoleUrl: `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/settings`
    };
  }

  // 10. Requires recent login (sensitive operations)
  if (code === 'auth/requires-recent-login' || rawMsg.includes('requires-recent-login')) {
    const actionDesc = context === 'delete_account' ? 'deleting your account' : 'changing your password';
    return {
      message: `For security reasons, ${actionDesc} requires recent authentication. Please sign out and sign in again, or re-authenticate before proceeding.`,
      isOperationNotAllowed: false
    };
  }

  // Fallback: strip raw technical prefixes like "Firebase: Error (auth/...)"
  const cleanMessage = rawMsg
    .replace(/^Firebase:\s*/i, '')
    .replace(/^Error\s*\((auth\/[^)]+)\):\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();

  return {
    message: cleanMessage || 'An unexpected authentication error occurred. Please try again.',
    isOperationNotAllowed: false
  };
}
