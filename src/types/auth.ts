/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'user';
  phoneNumber?: string;
  location?: string;
  bio?: string;
  companyOrTitle?: string;
  preferredContactMethod?: 'whatsapp' | 'email' | 'phone';
  savedProjectIds?: string[];
  emailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
  settings?: {
    notificationsEmail: boolean;
    projectInquiryUpdates: boolean;
    compactDashboardView: boolean;
  };
}

export interface ClientInquiry {
  id: string;
  userId: string;
  serviceTitle: string;
  budgetRange: string;
  deadline?: string;
  message: string;
  status: 'received' | 'in_review' | 'quoted' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  type: 'login' | 'register' | 'profile_update' | 'password_change' | 'logout' | 'password_reset_sent' | 'verification_sent' | 'inquiry_submitted';
  description: string;
  timestamp: string;
  device?: string;
}

export type AuthModalView = 'login' | 'register' | 'forgot_password';
