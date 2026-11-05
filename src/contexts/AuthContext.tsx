/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  updatePassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserActivity, ClientInquiry } from '../types/auth';
import { portfolioStorage } from '../data/portfolioStorage';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  activityLogs: UserActivity[];
  clientInquiries: ClientInquiry[];
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  sendResetPasswordEmail: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  changeUserPassword: (newPass: string) => Promise<void>;
  submitClientInquiry: (data: { serviceTitle: string; budgetRange: string; deadline?: string; message: string }) => Promise<void>;
  toggleSaveProject: (projectId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshActivity: () => Promise<void>;
  refreshInquiries: () => Promise<void>;
  deleteAccount: (passwordConfirmation?: string) => Promise<void>;
  reauthenticateWithGoogleUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Recognized administrator emails
const ADMIN_EMAILS = [
  'bishboniphace.ndege@gmail.com',
  'drboniphacendege@gmail.com',
  'boniphacendege@gmail.com',
  'boniphacejndege@gmail.com',
  'joycemasanja979@gmail.com',
  'bishdrboniphacendege@gmail.com'
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<UserActivity[]>([]);
  const [clientInquiries, setClientInquiries] = useState<ClientInquiry[]>([]);

  // Check if current user qualifies as administrator
  const current2FAEmail = portfolioStorage.getData().admin2FA?.recoveryEmail?.toLowerCase();
  const isAdmin = Boolean(
    user && (
      ADMIN_EMAILS.includes((user.email || '').toLowerCase()) ||
      (current2FAEmail && (user.email || '').toLowerCase() === current2FAEmail) ||
      profile?.role === 'admin'
    )
  );

  // Sync admin state with portfolioStorage
  useEffect(() => {
    if (isAdmin) {
      try {
        localStorage.setItem('boniphace_portfolio_auth_token', 'authenticated');
      } catch {}
    }
  }, [isAdmin]);

  // Helper to record activity in Firestore subcollection
  const recordActivity = async (
    targetUid: string,
    type: UserActivity['type'],
    description: string
  ) => {
    try {
      const activityData: Omit<UserActivity, 'id'> = {
        userId: targetUid,
        type,
        description,
        timestamp: new Date().toISOString(),
        device: navigator.userAgent.slice(0, 120)
      };

      const path = `users/${targetUid}/activity`;
      const docRef = await addDoc(collection(db, path), activityData);
      
      const newEntry: UserActivity = {
        id: docRef.id,
        ...activityData
      };

      setActivityLogs((prev) => [newEntry, ...prev.slice(0, 19)]);
    } catch (err) {
      console.warn('Activity logging fallback:', err);
    }
  };

  // Fetch or create user profile document in Firestore
  const syncUserProfile = async (firebaseUser: User): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    let existingData: Partial<UserProfile> | null = null;

    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        existingData = snap.data() as UserProfile;
      }
    } catch (err) {
      console.warn('Fetching user document from Firestore:', err);
    }

    const isSystemAdmin = ADMIN_EMAILS.includes((firebaseUser.email || '').toLowerCase());
    const role: 'admin' | 'user' = isSystemAdmin ? 'admin' : (existingData?.role || 'user');

    const syncedProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: existingData?.displayName || firebaseUser.displayName || 'Client User',
      photoURL: existingData?.photoURL || firebaseUser.photoURL || '',
      role,
      phoneNumber: existingData?.phoneNumber || firebaseUser.phoneNumber || '',
      location: existingData?.location || 'Dodoma, Tanzania',
      bio: existingData?.bio || 'Professional client & portfolio collaborator.',
      companyOrTitle: existingData?.companyOrTitle || '',
      preferredContactMethod: existingData?.preferredContactMethod || 'whatsapp',
      savedProjectIds: existingData?.savedProjectIds || [],
      emailVerified: firebaseUser.emailVerified,
      createdAt: existingData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: existingData?.settings || {
        notificationsEmail: true,
        projectInquiryUpdates: true,
        compactDashboardView: false
      }
    };

    try {
      await setDoc(userDocRef, syncedProfile, { merge: true });
    } catch (err) {
      console.warn('Saving user document in Firestore:', err);
    }

    return syncedProfile;
  };

  // Load activity logs
  const fetchActivity = async (targetUid: string) => {
    try {
      const path = `users/${targetUid}/activity`;
      const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(20));
      const snap = await getDocs(q);
      const items: UserActivity[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<UserActivity, 'id'>) });
      });
      setActivityLogs(items);
    } catch (err) {
      console.warn('Loading activity log:', err);
    }
  };

  // Load client inquiries
  const fetchClientInquiries = async (targetUid: string) => {
    try {
      const path = `users/${targetUid}/inquiries`;
      const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      const items: ClientInquiry[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<ClientInquiry, 'id'>) });
      });
      setClientInquiries(items);
    } catch (err) {
      console.warn('Loading client inquiries:', err);
    }
  };

  // Listen to Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const prof = await syncUserProfile(currentUser);
          setProfile(prof);
          await fetchActivity(currentUser.uid);
          await fetchClientInquiries(currentUser.uid);
        } catch (e) {
          console.error('Error syncing profile:', e);
        }
      } else {
        setProfile(null);
        setActivityLogs([]);
        setClientInquiries([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. Email & Password Login
  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const prof = await syncUserProfile(cred.user);
    setProfile(prof);
    await recordActivity(cred.user.uid, 'login', `Signed in via Email (${email.trim()})`);
  };

  // 2. User Registration
  const registerWithEmail = async (name: string, email: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    
    // Set display name in Firebase Auth
    if (name.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }

    // Attempt to send email verification
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn('Email verification prompt dispatch:', e);
    }

    const prof = await syncUserProfile(cred.user);
    setProfile(prof);

    await recordActivity(cred.user.uid, 'register', `Account created with name: ${name.trim()}`);
    await recordActivity(cred.user.uid, 'verification_sent', `Verification email dispatched to ${email.trim()}`);
  };

  // 3. Google Sign In
  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const prof = await syncUserProfile(cred.user);
    setProfile(prof);
    await recordActivity(cred.user.uid, 'login', `Signed in via Google (${cred.user.email || 'OAuth'})`);
  };

  // 4. Logout
  const logout = async () => {
    if (user) {
      await recordActivity(user.uid, 'logout', 'Logged out from current session');
    }
    // Also remove admin key if logged out
    portfolioStorage.logout();
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setActivityLogs([]);
  };

  // 5. Send Verification Email
  const handleSendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('No user currently logged in');
    await sendEmailVerification(auth.currentUser);
    await recordActivity(auth.currentUser.uid, 'verification_sent', 'Verification link re-sent');
  };

  // 6. Send Password Reset Email
  const sendResetPasswordEmail = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  // 7. Update User Profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('You must be signed in to update your profile');

    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Safely update Firebase Auth Profile
    // Note: Firebase Auth updateProfile strictly enforces a short URL character limit (<2048 chars).
    // Passing a data:image/... base64 string will cause auth/invalid-profile-attribute: "Photo URL too long".
    // We store the full photo in Firestore, and only sync to Firebase Auth if it's a short external URL.
    try {
      const authUpdates: { displayName?: string; photoURL?: string } = {};
      if (updates.displayName !== undefined && updates.displayName.trim()) {
        authUpdates.displayName = updates.displayName.trim();
      }
      if (
        updates.photoURL !== undefined &&
        typeof updates.photoURL === 'string' &&
        updates.photoURL.startsWith('http') &&
        updates.photoURL.length < 2000
      ) {
        authUpdates.photoURL = updates.photoURL;
      }
      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(user, authUpdates);
      }
    } catch (authErr) {
      console.warn('Firebase Auth updateProfile notice:', authErr);
    }

    // Update Firestore User Document using setDoc with merge to ensure persistence
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, updatedData, { merge: true });

    setProfile((prev) => (prev ? { ...prev, ...updatedData } : null));
    await recordActivity(user.uid, 'profile_update', 'Updated personal profile details');
  };

  // 8. Change Password
  const changeUserPassword = async (newPass: string) => {
    if (!auth.currentUser) throw new Error('No user currently logged in');
    await updatePassword(auth.currentUser, newPass);
    await recordActivity(auth.currentUser.uid, 'password_change', 'Updated account password');
  };

  // 9. Submit Client Project Brief / Inquiry
  const submitClientInquiry = async (inquiryData: {
    serviceTitle: string;
    budgetRange: string;
    deadline?: string;
    message: string;
  }) => {
    if (!user) throw new Error('You must be signed in to submit an inquiry');

    const newInquiry: Omit<ClientInquiry, 'id'> = {
      userId: user.uid,
      serviceTitle: inquiryData.serviceTitle,
      budgetRange: inquiryData.budgetRange,
      deadline: inquiryData.deadline || 'Flexible',
      message: inquiryData.message,
      status: 'received',
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, `users/${user.uid}/inquiries`), newInquiry);
    const savedItem: ClientInquiry = { id: docRef.id, ...newInquiry };
    setClientInquiries((prev) => [savedItem, ...prev]);

    // Also sync to portfolioStorage inquiries so it appears in the existing Admin Dashboard
    portfolioStorage.recordInquiry({
      name: profile?.displayName || user.displayName || 'Client User',
      email: user.email || '',
      organization: profile?.companyOrTitle || (profile?.phoneNumber ? `Tel: ${profile.phoneNumber}` : undefined),
      serviceRequired: inquiryData.serviceTitle,
      budgetRange: inquiryData.budgetRange,
      preferredTimeline: inquiryData.deadline || 'Flexible',
      message: `${inquiryData.message}${profile?.phoneNumber ? `\n(Phone/WhatsApp: ${profile.phoneNumber})` : ''}`
    });

    await recordActivity(user.uid, 'inquiry_submitted', `Submitted project brief for "${inquiryData.serviceTitle}"`);
  };

  // 10. Toggle Saving Favorite Project
  const toggleSaveProject = async (projectId: string) => {
    if (!user || !profile) return;
    const current = profile.savedProjectIds || [];
    const exists = current.includes(projectId);
    const updated = exists ? current.filter((id) => id !== projectId) : [...current, projectId];
    await updateUserProfile({ savedProjectIds: updated });
  };

  // 11. Refresh Profile
  const refreshProfile = async () => {
    if (auth.currentUser) {
      const prof = await syncUserProfile(auth.currentUser);
      setProfile(prof);
    }
  };

  // 12. Refresh Activity
  const refreshActivity = async () => {
    if (auth.currentUser) {
      await fetchActivity(auth.currentUser.uid);
    }
  };

  // 13. Refresh Inquiries
  const refreshInquiries = async () => {
    if (auth.currentUser) {
      await fetchClientInquiries(auth.currentUser.uid);
    }
  };

  // 14. Re-authenticate with Google (for sensitive actions like account deletion)
  const reauthenticateWithGoogleUser = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user is currently signed in');
    await reauthenticateWithPopup(currentUser, googleProvider);
  };

  // 15. Delete Account Permanently (Firebase Auth + Firestore associated records)
  const deleteAccount = async (passwordConfirmation?: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user is currently signed in');
    const uid = currentUser.uid;

    // A. Re-authenticate if password confirmation was provided
    if (passwordConfirmation && currentUser.email) {
      const credential = EmailAuthProvider.credential(currentUser.email, passwordConfirmation);
      await reauthenticateWithCredential(currentUser, credential);
    }

    // B. Clean up user's Firestore data while still authenticated
    // 1. Delete all client inquiries subcollection documents
    try {
      const inquiriesSnap = await getDocs(collection(db, `users/${uid}/inquiries`));
      const inqPromises = inquiriesSnap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(inqPromises);
    } catch (err) {
      console.warn('Notice clearing inquiries during account deletion:', err);
    }

    // 2. Delete all activity logs subcollection documents
    try {
      const activitySnap = await getDocs(collection(db, `users/${uid}/activity`));
      const actPromises = activitySnap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(actPromises);
    } catch (err) {
      console.warn('Notice clearing activity logs during account deletion:', err);
    }

    // 3. Delete user document from Firestore
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      console.warn('Notice deleting user document during account deletion:', err);
    }

    // C. Trigger Firebase User Deletion
    await deleteUser(currentUser);

    // D. Purge local session states & admin tokens
    portfolioStorage.logout();
    setUser(null);
    setProfile(null);
    setActivityLogs([]);
    setClientInquiries([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        activityLogs,
        clientInquiries,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        sendVerificationEmail: handleSendVerificationEmail,
        sendResetPasswordEmail,
        updateUserProfile,
        changeUserPassword,
        submitClientInquiry,
        toggleSaveProject,
        refreshProfile,
        refreshActivity,
        refreshInquiries,
        deleteAccount,
        reauthenticateWithGoogleUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
