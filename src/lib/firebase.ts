/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import defaultConfig from '../../firebase-applet-config.json';

// Active Firebase config supporting both local config file and production environment variables (e.g. Google Cloud Run, Vercel, Netlify)
const resolvedConfig = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || (defaultConfig as any)?.apiKey || '',
  authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || (defaultConfig as any)?.authDomain || '',
  projectId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || (defaultConfig as any)?.projectId || '',
  firestoreDatabaseId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID) || (defaultConfig as any)?.firestoreDatabaseId || 'ai-studio-boniphacendegecr-b14a97e1-585e-4414-8cde-8bb199c69be5',
  storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || (defaultConfig as any)?.storageBucket || '',
  messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || (defaultConfig as any)?.messagingSenderId || '',
  appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || (defaultConfig as any)?.appId || '',
  measurementId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID) || (defaultConfig as any)?.measurementId || '',
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(resolvedConfig) : getApp();

// Initialize Firestore per AI Studio Firebase Skill guidelines
export const db = getFirestore(app, resolvedConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firebase Storage with specific bucket from config
export const storage = getStorage(app, resolvedConfig.storageBucket);

// Google Auth Provider for popup sign-in
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Storage upload helper for avatar, project graphics, and assets
export async function uploadFileToStorage(
  file: File | Blob,
  path: string,
  contentType?: string
): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const resolvedType = contentType || (file instanceof File && file.type ? file.type : 'application/octet-stream');
    const metadata = { contentType: resolvedType };
    const snapshot = await uploadBytes(storageRef, file, metadata);
    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.warn('Firebase Storage upload notice (falling back to direct high-fidelity data encoding):', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}

// Storage delete helper
export async function deleteFileFromStorage(pathOrUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, pathOrUrl);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Storage delete notice (item may have been base64 or already removed):', err);
  }
}

// Firestore Error Logging Interface per AI Studio Guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore at startup per AI Studio Firebase guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Proactive connection validation
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    const snap = await Promise.race([
      getDoc(doc(db, 'content', 'portfolio')),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
    ]);
    return snap !== null && snap.exists();
  } catch {
    return false;
  }
}

export default app;
