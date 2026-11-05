/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatAuthError } from '../../utils/authErrorHelper';
import { processImageFile } from '../../utils/imageHelper';
import { portfolioStorage } from '../../data/portfolioStorage';
import { uploadFileToStorage } from '../../lib/firebase';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Camera,
  CheckCircle,
  AlertCircle,
  Shield,
  ShieldAlert,
  LogOut,
  Save,
  KeyRound,
  Activity,
  Sliders,
  Sparkles,
  ExternalLink,
  Clock,
  Send,
  FolderOpen,
  Heart,
  Plus,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Trash2,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { detectPasswordHarshness } from '../../utils/cryptoAuth';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin?: () => void;
  onOpenLegal?: (tab?: 'privacy' | 'terms' | 'cookies' | 'services') => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenAdmin,
  onOpenLegal
}) => {
  const {
    user,
    profile,
    isAdmin,
    activityLogs,
    clientInquiries,
    updateUserProfile,
    changeUserPassword,
    sendVerificationEmail,
    submitClientInquiry,
    toggleSaveProject,
    logout,
    deleteAccount,
    reauthenticateWithGoogleUser
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'inquiries' | 'saved' | 'settings' | 'security' | 'activity'>('profile');

  // Edit profile form state
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [location, setLocation] = useState(profile?.location || 'Dodoma, Tanzania');
  const [companyOrTitle, setCompanyOrTitle] = useState(profile?.companyOrTitle || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || user?.photoURL || '');
  const [preferredContactMethod, setPreferredContactMethod] = useState<'whatsapp' | 'email' | 'phone'>(
    profile?.preferredContactMethod || 'whatsapp'
  );

  // Sync state if profile changes
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || user?.displayName || '');
      setPhoneNumber(profile.phoneNumber || '');
      setLocation(profile.location || 'Dodoma, Tanzania');
      setCompanyOrTitle(profile.companyOrTitle || '');
      setBio(profile.bio || '');
      setPhotoURL(profile.photoURL || user?.photoURL || '');
      setPreferredContactMethod(profile.preferredContactMethod || 'whatsapp');
    }
  }, [profile, user]);

  // New inquiry form state
  const [showNewInquiryForm, setShowNewInquiryForm] = useState(false);
  const [newInquiryService, setNewInquiryService] = useState('Graphic Design & Branding');
  const [newInquiryBudget, setNewInquiryBudget] = useState('$300 - $600 USD');
  const [newInquiryDeadline, setNewInquiryDeadline] = useState('2-3 Weeks');
  const [newInquiryMessage, setNewInquiryMessage] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  // Change password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Settings state
  const [notificationsEmail, setNotificationsEmail] = useState(
    profile?.settings?.notificationsEmail ?? true
  );
  const [projectInquiryUpdates, setProjectInquiryUpdates] = useState(
    profile?.settings?.projectInquiryUpdates ?? true
  );

  // Delete account confirmation & execution states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [requiresRecentLogin, setRequiresRecentLogin] = useState(false);

  // Authentication provider detection
  const isGoogleAuth = user?.providerData?.some((p) => p.providerId === 'google.com') ?? false;
  const isPasswordAuth = user?.providerData?.some((p) => p.providerId === 'password') ?? false;

  // Status indicators
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !user) return null;

  // Calculate profile completeness score
  const completenessFields = [
    Boolean(displayName.trim()),
    Boolean(user.email),
    Boolean(photoURL),
    Boolean(phoneNumber.trim()),
    Boolean(location.trim()),
    Boolean(companyOrTitle.trim()),
    Boolean(bio.trim())
  ];
  const completenessScore = Math.round(
    (completenessFields.filter(Boolean).length / completenessFields.length) * 100
  );

  // Handle image upload from local file with automatic optimization and Firebase Storage persistence
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      try {
        setIsSaving(true);
        setStatusMsg(null);
        // Optimize and square crop to a fast, clean 256x256 image (~15KB)
        const optimized = await processImageFile(file, 256, 256, 0.82, true);
        
        let finalUrl = optimized;
        try {
          const extension = file.type.includes('png') ? 'png' : 'jpg';
          const storagePath = `users/${user.uid}/profile_${Date.now()}.${extension}`;
          finalUrl = await uploadFileToStorage(file, storagePath, file.type || 'image/jpeg');
        } catch (storageErr) {
          console.warn('Firebase Storage upload note, falling back to optimized inline asset:', storageErr);
        }

        setPhotoURL(finalUrl);
        setStatusMsg({ type: 'success', text: 'Portrait image uploaded! Click "Save Profile Changes" below.' });
      } catch (err) {
        setStatusMsg({ type: 'error', text: 'Failed to process image file. Please try another image.' });
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);

    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        location: location.trim(),
        companyOrTitle: companyOrTitle.trim(),
        bio: bio.trim(),
        photoURL,
        preferredContactMethod,
        settings: {
          notificationsEmail,
          projectInquiryUpdates,
          compactDashboardView: profile?.settings?.compactDashboardView ?? false
        }
      });
      setStatusMsg({ type: 'success', text: 'Profile changes saved successfully!' });
    } catch (err: any) {
      const formatted = formatAuthError(err, 'profile_update' as any);
      setStatusMsg({ type: 'error', text: formatted.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Submit client project inquiry
  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInquiryMessage.trim()) return;

    setIsSubmittingInquiry(true);
    setStatusMsg(null);
    try {
      await submitClientInquiry({
        serviceTitle: newInquiryService,
        budgetRange: newInquiryBudget,
        deadline: newInquiryDeadline,
        message: newInquiryMessage.trim()
      });
      setNewInquiryMessage('');
      setShowNewInquiryForm(false);
      setStatusMsg({ type: 'success', text: 'Project brief submitted! Boniphace has received your request.' });
    } catch (err: any) {
      const formatted = formatAuthError(err, 'profile_update' as any);
      setStatusMsg({ type: 'error', text: formatted.message });
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword.length < 8) {
      setStatusMsg({ type: 'error', text: 'Password must be at least 8 characters long to shield against automated dictionary attacks.' });
      return;
    }
    const passHarshness = detectPasswordHarshness(newPassword);
    if (passHarshness.score < 2) {
      setStatusMsg({
        type: 'error',
        text: 'To protect from hackers and scammers, choose a stronger password (at least 8 chars with mixed case, numbers, or symbols).'
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match. Please verify password confirmation.' });
      return;
    }

    setIsSaving(true);
    try {
      await changeUserPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setStatusMsg({ type: 'success', text: 'Password updated successfully!' });
    } catch (err: any) {
      const formatted = formatAuthError(err, 'password_change');
      setStatusMsg({
        type: 'error',
        text: formatted.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    setStatusMsg(null);
    try {
      await sendVerificationEmail();
      setStatusMsg({ type: 'success', text: 'Verification email sent! Please check your inbox.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to send verification email.' });
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  // Account deletion handlers
  const handleOpenDeleteModal = () => {
    setDeleteConfirmText('');
    setDeletePassword('');
    setDeleteError(null);
    setRequiresRecentLogin(false);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setShowDeleteModal(false);
    setDeleteConfirmText('');
    setDeletePassword('');
    setDeleteError(null);
    setRequiresRecentLogin(false);
  };

  const handleReauthGoogle = async () => {
    try {
      setDeleteError(null);
      await reauthenticateWithGoogleUser();
      setRequiresRecentLogin(false);
      setDeleteError(null);
    } catch (err: any) {
      const formatted = formatAuthError(err, 'delete_account');
      setDeleteError(formatted.message);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm you wish to delete your account.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(isPasswordAuth && deletePassword ? deletePassword : undefined);
      setShowDeleteModal(false);
      onClose();
    } catch (err: any) {
      console.error('Account deletion error:', err);
      const formatted = formatAuthError(err, 'delete_account');
      if (err?.code === 'auth/requires-recent-login' || String(err?.message || err).includes('requires-recent-login')) {
        setRequiresRecentLogin(true);
      }
      setDeleteError(formatted.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Get saved projects from portfolio database
  const allProjects = portfolioStorage.getData().projects;
  const savedProjectsList = allProjects.filter((p) =>
    (profile?.savedProjectIds || []).includes(p.id)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-profile-title"
      className="fixed inset-0 z-50 w-full h-full min-h-screen bg-[#010804] text-[#f4fff8] flex flex-col overflow-hidden animate-fade-in"
    >
      {/* Top green/gold neon glowing accent line reaching top, left and right edges */}
      <div className="h-1 w-full bg-gradient-to-r from-[#3dff8f] via-[#f0b92e] to-[#3dff8f] shrink-0" />

      {/* Header Bar reaching top, left and right edges */}
      <div className="px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4 flex items-center justify-between border-b border-white/10 shrink-0 bg-[#010904] shadow-md z-10">
        <div className="flex items-center gap-3.5">
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName || 'User'}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-[#3dff8f] shadow-[0_0_12px_rgba(61,255,143,0.45)]"
            />
          ) : (
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#0a351e] to-[#010904] border border-[#3dff8f]/40 flex items-center justify-center text-[#3dff8f] font-bold text-base shadow-[0_0_10px_rgba(61,255,143,0.3)]">
              {(displayName || user.email || 'U')[0].toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="user-profile-title" className="text-base sm:text-lg font-bold text-[#f4fff8]">
                {displayName || 'Personal Account'}
              </h2>
              {isAdmin ? (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#f0b92e]/20 text-[#f0b92e] border border-[#f0b92e]/40 font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Administrator
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30 font-semibold">
                  Client Account
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-[#9fbfae] truncate max-w-[200px] sm:max-w-md">
              {user.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin && onOpenAdmin && (
            <button
              type="button"
              data-unauth-exempt="true"
              data-admin-portal="true"
              data-admin-trigger="true"
              data-admin-login="true"
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#f0b92e]/10 border border-[#f0b92e]/40 hover:bg-[#f0b92e]/20 text-[#f0b92e] text-xs font-bold hidden sm:flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          )}

          <button
            onClick={onClose}
            aria-label="Close client account"
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-[#9fbfae] hover:text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* Verification Status & Completeness Banner reaching left & right edges */}
      <div className="px-4 sm:px-8 lg:px-12 py-2.5 bg-[#000603] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
        <div className="flex items-center gap-4">
          {user.emailVerified ? (
            <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Email Verified</span>
            </span>
          ) : (
            <span className="text-amber-400 flex items-center gap-1.5 font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Email Unverified</span>
            </span>
          )}

          {/* Profile completion badge */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#9fbfae]">
            <span>Profile Completion:</span>
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#3dff8f] to-[#f0b92e] transition-all duration-500"
                style={{ width: `${completenessScore}%` }}
              />
            </div>
            <span className="font-bold text-[#f0b92e]">{completenessScore}%</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!user.emailVerified && (
            <button
              onClick={handleResendVerification}
              className="text-[11px] text-[#f0b92e] hover:underline cursor-pointer font-bold flex items-center gap-1"
            >
              <span>Resend Verification Email</span>
            </button>
          )}
          <span className="hidden md:inline text-[10px] text-[#9fbfae]/70">
            Boniphace Ndege Client Portal
          </span>
        </div>
      </div>

      {/* Navigation Tabs reaching left & right edges */}
      <div className="flex border-b border-white/10 px-4 sm:px-8 lg:px-12 bg-[#010904] overflow-x-auto shrink-0 scrollbar-none gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-[#3dff8f] text-[#3dff8f]'
              : 'border-transparent text-[#9fbfae] hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Personal Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'inquiries'
              ? 'border-[#3dff8f] text-[#3dff8f]'
              : 'border-transparent text-[#9fbfae] hover:text-white'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>My Briefs ({clientInquiries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'saved'
              ? 'border-[#3dff8f] text-[#3dff8f]'
              : 'border-transparent text-[#9fbfae] hover:text-white'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Saved Showcase ({savedProjectsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-[#3dff8f] text-[#3dff8f]'
              : 'border-transparent text-[#9fbfae] hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-[#3dff8f] text-[#3dff8f]'
              : 'border-transparent text-[#9fbfae] hover:text-white'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Password</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'activity'
              ? 'border-[#3dff8f] text-[#3dff8f]'
              : 'border-transparent text-[#9fbfae] hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Activity</span>
        </button>
      </div>

      {/* Tab Content (Scrollable reaching bottom, left and right edges) */}
      <div className="flex-1 overflow-y-auto w-full bg-[#021008] p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto w-full space-y-5 pb-8">
          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border border-rose-500/40 text-rose-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: PERSONAL PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Profile Picture Upload & Presets */}
              <div className="p-4 rounded-xl bg-[#010904] border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group shrink-0">
                    {photoURL ? (
                      <img
                        src={photoURL}
                        alt="Avatar"
                        className="w-20 h-20 rounded-full object-cover border-2 border-[#3dff8f] shadow-[0_0_15px_rgba(61,255,143,0.3)]"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-[#0a351e] border-2 border-[#3dff8f]/40 flex items-center justify-center text-2xl font-bold text-[#3dff8f]">
                        {(displayName || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}

                    <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[10px]">
                      <Camera className="w-5 h-5 mb-1 text-[#3dff8f]" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex-1 space-y-1.5 text-center sm:text-left">
                    <div className="text-xs font-bold text-[#f4fff8]">Profile Portrait</div>
                    <p className="text-[11px] text-[#9fbfae] leading-relaxed">
                      Upload your custom portrait photo (automatically optimized &amp; securely saved to your account).
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                      <label className="py-1 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white cursor-pointer transition-colors inline-block">
                        <span>Upload Custom Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                      {photoURL && (
                        <button
                          type="button"
                          onClick={() => setPhotoURL('')}
                          className="py-1 px-3 rounded-lg text-[11px] text-rose-300 hover:bg-rose-500/10 transition-colors"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#f4fff8] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. John Jonah"
                    className="w-full px-3 py-2 bg-[#010904] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#3dff8f] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#f4fff8] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email || ''}
                    className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-[#9fbfae] font-mono opacity-80 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#f4fff8] mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+255 765 326 515"
                    className="w-full px-3 py-2 bg-[#010904] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#3dff8f] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#f4fff8] mb-1">
                    Location / City
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Dodoma, Tanzania"
                    className="w-full px-3 py-2 bg-[#010904] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#3dff8f] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#f4fff8] mb-1">
                    Professional Title / Organization
                  </label>
                  <input
                    type="text"
                    value={companyOrTitle}
                    onChange={(e) => setCompanyOrTitle(e.target.value)}
                    placeholder="e.g. Graphic Designer / Lumina Studio"
                    className="w-full px-3 py-2 bg-[#010904] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#3dff8f] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#f4fff8] mb-1">
                    Preferred Contact Channel
                  </label>
                  <select
                    value={preferredContactMethod}
                    onChange={(e) => setPreferredContactMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#010904] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#3dff8f] font-mono"
                  >
                    <option value="whatsapp">WhatsApp Message</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone Call</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#f4fff8] mb-1">
                  Bio / Collaboration Goals
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell Boniphace about yourself, brand, or projects you are looking to create..."
                  className="w-full px-3 py-2 bg-[#010904] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#3dff8f] font-mono"
                />
              </div>

              {/* Direct WhatsApp Quick Chat with Boniphace */}
              <div className="p-3 rounded-xl bg-[#0a351e]/40 border border-[#3dff8f]/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#3dff8f]">
                  <MessageSquare className="w-4 h-4" />
                  <span>Direct WhatsApp Channel</span>
                </div>
                <a
                  href={`https://wa.me/255765326515?text=${encodeURIComponent(`Hello Boniphace, this is ${displayName || 'a client'} from your portfolio website.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1 px-3 rounded-lg bg-[#3dff8f] hover:bg-white text-[#001407] font-bold text-[11px] transition-colors"
                >
                  Chat with Boniphace
                </a>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2.5 px-5 rounded-xl font-bold text-xs text-[#001407] bg-gradient-to-r from-[#3dff8f] to-[#5effa3] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(61,255,143,0.3)] disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MY PROJECT BRIEFS & INQUIRIES */}
          {activeTab === 'inquiries' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#f4fff8]">My Service Inquiries</h3>
                  <p className="text-[11px] text-[#9fbfae]">
                    Track your design and website requests submitted to Boniphace Ndege.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewInquiryForm(!showNewInquiryForm)}
                  className="py-1.5 px-3 rounded-lg bg-[#f0b92e] text-[#1a1200] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:bg-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showNewInquiryForm ? 'Cancel Brief' : 'New Project Brief'}</span>
                </button>
              </div>

              {/* Submit New Brief Form */}
              {showNewInquiryForm && (
                <form onSubmit={handleCreateInquiry} className="p-4 rounded-xl bg-[#010904] border border-[#f0b92e]/30 space-y-3">
                  <div className="text-xs font-bold text-[#f0b92e] flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    <span>Create New Project Brief</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#9fbfae] mb-1">Service Type</label>
                      <select
                        value={newInquiryService}
                        onChange={(e) => setNewInquiryService(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#000603] border border-white/10 rounded-lg text-xs text-white"
                      >
                        <option>Graphic Design & Branding</option>
                        <option>Logo Design & Visual Identity</option>
                        <option>Flyers, Posters & Social Media</option>
                        <option>Website Design (UI/UX)</option>
                        <option>Website Development (React)</option>
                        <option>Landing Pages & Business Sites</option>
                        <option>AI-Assisted Design & Prototyping</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#9fbfae] mb-1">Estimated Budget</label>
                      <select
                        value={newInquiryBudget}
                        onChange={(e) => setNewInquiryBudget(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#000603] border border-white/10 rounded-lg text-xs text-white"
                      >
                        <option>$100 - $300 USD</option>
                        <option>$300 - $600 USD</option>
                        <option>$600 - $1,200 USD</option>
                        <option>$1,200+ USD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#9fbfae] mb-1">Target Timeline</label>
                      <select
                        value={newInquiryDeadline}
                        onChange={(e) => setNewInquiryDeadline(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#000603] border border-white/10 rounded-lg text-xs text-white"
                      >
                        <option>1-2 Weeks (Urgent)</option>
                        <option>2-3 Weeks (Standard)</option>
                        <option>1 Month+</option>
                        <option>Flexible Schedule</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#9fbfae] mb-1">Project Details & Requirements</label>
                    <textarea
                      required
                      rows={3}
                      value={newInquiryMessage}
                      onChange={(e) => setNewInquiryMessage(e.target.value)}
                      placeholder="Describe your design goals, deliverables, brand details, or reference links..."
                      className="w-full p-2.5 bg-[#000603] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#f0b92e]"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewInquiryForm(false)}
                      className="py-1.5 px-3 rounded-lg text-xs text-[#9fbfae] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingInquiry}
                      className="py-1.5 px-4 rounded-lg bg-[#3dff8f] text-[#001407] font-bold text-xs hover:bg-white transition-colors"
                    >
                      {isSubmittingInquiry ? 'Submitting...' : 'Dispatch Brief'}
                    </button>
                  </div>
                </form>
              )}

              {/* Inquiries List */}
              {clientInquiries.length === 0 ? (
                <div className="p-8 text-center bg-[#010904] rounded-xl border border-white/5 space-y-2">
                  <Briefcase className="w-8 h-8 text-[#9fbfae]/40 mx-auto" />
                  <p className="text-xs text-[#f4fff8] font-bold">No Inquiries Submitted Yet</p>
                  <p className="text-[11px] text-[#9fbfae] max-w-sm mx-auto">
                    Click "New Project Brief" to request a design or website solution directly from your account.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {clientInquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="p-3.5 rounded-xl bg-[#010904] border border-white/10 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#f4fff8]">{inq.serviceTitle}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30">
                          {inq.status}
                        </span>
                      </div>
                      <p className="text-[#9fbfae] text-[11px] leading-relaxed line-clamp-2">
                        {inq.message}
                      </p>
                      <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-[#9fbfae]/80 pt-1 border-t border-white/5">
                        <div className="flex items-center gap-3">
                          <span>Budget: {inq.budgetRange}</span>
                          <span>Timeline: {inq.deadline}</span>
                        </div>
                        <span>
                          {new Date(inq.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVED SHOWCASE / MOODBOARD */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#f4fff8]">Saved Project Showcase</h3>
                  <p className="text-[11px] text-[#9fbfae]">
                    Case studies you have saved for creative reference and collaboration.
                  </p>
                </div>
              </div>

              {savedProjectsList.length === 0 ? (
                <div className="p-8 text-center bg-[#010904] rounded-xl border border-white/5 space-y-2">
                  <Heart className="w-8 h-8 text-[#9fbfae]/40 mx-auto" />
                  <p className="text-xs text-[#f4fff8] font-bold">Your Moodboard is Empty</p>
                  <p className="text-[11px] text-[#9fbfae]">
                    Explore the portfolio and tap the heart icon on any project to save it to your personal showcase.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedProjectsList.map((prj) => (
                    <div
                      key={prj.id}
                      className="p-3 rounded-xl bg-[#010904] border border-white/10 space-y-2 flex flex-col justify-between"
                    >
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/40 relative">
                        <img
                          src={prj.thumbnail}
                          alt={prj.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-[#f0b92e] font-bold">
                          {prj.category}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#f4fff8] line-clamp-1">{prj.title}</h4>
                        <p className="text-[11px] text-[#9fbfae] line-clamp-2">{prj.summary}</p>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => toggleSaveProject(prj.id)}
                          className="text-[11px] text-rose-300 hover:text-rose-100 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                        <a
                          href="#projects"
                          onClick={onClose}
                          className="text-[11px] text-[#3dff8f] font-bold hover:underline flex items-center gap-1"
                        >
                          <span>Explore Project</span>
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACCOUNT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#010904] border border-white/10 space-y-3">
                <h3 className="text-xs font-bold text-[#f0b92e] uppercase tracking-wider font-mono">
                  Communication Preferences
                </h3>

                <label className="flex items-center justify-between py-2 border-b border-white/5 cursor-pointer">
                  <div>
                    <div className="text-xs font-semibold text-[#f4fff8]">
                      Email Notifications
                    </div>
                    <div className="text-[11px] text-[#9fbfae]">
                      Receive updates regarding service inquiries and replies.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsEmail}
                    onChange={(e) => setNotificationsEmail(e.target.checked)}
                    className="w-4 h-4 accent-[#3dff8f] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between py-2 cursor-pointer">
                  <div>
                    <div className="text-xs font-semibold text-[#f4fff8]">
                      Project Status & Case Study Alerts
                    </div>
                    <div className="text-[11px] text-[#9fbfae]">
                      Receive alerts when new projects or design prototypes are published.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={projectInquiryUpdates}
                    onChange={(e) => setProjectInquiryUpdates(e.target.checked)}
                    className="w-4 h-4 accent-[#3dff8f] cursor-pointer"
                  />
                </label>
              </div>

              {/* Admin Portal Gateway */}
              {isAdmin && (
                <div className="p-4 rounded-xl bg-[#052e1b]/40 border border-[#f0b92e]/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#f0b92e]">
                    <Shield className="w-4 h-4" />
                    <span>Administrator Privileges Active</span>
                  </div>
                  <p className="text-[11px] text-[#fff1b8] leading-relaxed">
                    Your authenticated account is linked to the administrator permissions. You have direct access to manage portfolio projects, client testimonials, resume data, and inquiries.
                  </p>
                  <button
                    type="button"
                    data-unauth-exempt="true"
                    data-admin-portal="true"
                    data-admin-trigger="true"
                    data-admin-login="true"
                    onClick={() => {
                      onClose();
                      onOpenAdmin?.();
                    }}
                    className="py-2 px-3.5 rounded-lg bg-[#f0b92e] hover:bg-[#fff1b8] text-[#1a1200] font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Launch Admin Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Danger Zone: Account Deletion */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span className="uppercase tracking-wider font-mono">Danger Zone</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold">
                    Irreversible
                  </span>
                </div>
                <p className="text-[11px] text-[#9fbfae] leading-relaxed">
                  Permanently delete your user account, personal profile, submitted project inquiries, and activity records from Firebase and Firestore. Once deleted, this data cannot be recovered.
                </p>
                <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleOpenDeleteModal}
                    className="py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 hover:text-rose-100 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete My Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenLegal?.('privacy');
                    }}
                    className="text-xs text-[#3dff8f] hover:underline font-mono inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Data Privacy Rights (PDPA & GDPR) ↗</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CHANGE PASSWORD */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#011409] border border-[#3dff8f]/20 text-xs text-[#9fbfae] flex items-start gap-2.5 leading-relaxed">
                  <KeyRound className="w-4 h-4 text-[#3dff8f] shrink-0 mt-0.5" />
                  <span>
                    To protect from hackers or scammers, passwords are hidden in secure dots with real-time harshness detection. Choose a harsh password with letters, numbers, and symbols.
                  </span>
                </div>

                {/* New Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[#f4fff8]">
                      New Password (min 8 characters)
                    </label>
                    <span className="text-[10px] font-mono text-[#9fbfae]/80">
                      Hidden in password dots
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9fbfae]" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-10 py-2 bg-[#010904] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#3dff8f] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9fbfae] hover:text-white transition-colors cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Harsh Password Detection Indicator & Meter */}
                  {newPassword && (() => {
                    const newHarshness = detectPasswordHarshness(newPassword);
                    return (
                      <div className="mt-2 p-2.5 rounded-xl bg-[#000603] border border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <div className="flex items-center gap-1.5 text-[#9fbfae]">
                            <Shield className="w-3.5 h-3.5 text-[#3dff8f]" />
                            <span>Harsh Password Detection:</span>
                          </div>
                          <span
                            className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px]"
                            style={{
                              backgroundColor: `${newHarshness.color}20`,
                              color: newHarshness.color,
                              border: `1px solid ${newHarshness.color}50`,
                            }}
                          >
                            {newHarshness.label === 'Harsh' ? '🛡️ Harsh (Maximum Defense)' : newHarshness.label}
                          </span>
                        </div>

                        {/* 4-bar strength indicator */}
                        <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className="h-1 rounded-full transition-all duration-300"
                              style={{
                                backgroundColor:
                                  newHarshness.score >= step ? newHarshness.color : 'rgba(255,255,255,0.08)',
                              }}
                            />
                          ))}
                        </div>

                        <p className="text-[10px] text-[#9fbfae] leading-snug pt-0.5">
                          {newHarshness.feedback}
                        </p>
                        <div className="text-[10px] text-[#9fbfae]/70 flex items-center justify-between pt-0.5 font-mono">
                          <span>• Hidden in password dots</span>
                          <span>• Protected from hackers & scammers</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-medium text-[#f4fff8] mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9fbfae]" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-10 py-2 bg-[#010904] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#3dff8f] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9fbfae] hover:text-white transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="py-2.5 px-5 rounded-xl font-bold text-xs text-[#1a1200] bg-gradient-to-r from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(240,185,46,0.3)] disabled:opacity-50"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>

              {/* Account Deletion Shortcut in Security */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[#9fbfae] text-[11px]">Looking to permanently close and delete your account?</span>
                <button
                  type="button"
                  onClick={handleOpenDeleteModal}
                  className="text-rose-400 hover:text-rose-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: ACCOUNT ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#9fbfae]">
                <span>Recent Security &amp; Account Actions</span>
                <span>Audit Trail</span>
              </div>

              {activityLogs.length === 0 ? (
                <div className="p-8 text-center bg-[#010904] rounded-xl border border-white/5 space-y-2">
                  <Activity className="w-8 h-8 text-[#9fbfae]/40 mx-auto" />
                  <p className="text-xs text-[#9fbfae]">No recent activity logs recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activityLogs.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#010904] border border-white/5 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-[#0a351e] text-[#3dff8f] shrink-0 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-[#f4fff8]">{item.description}</div>
                          <div className="text-[10px] font-mono text-[#9fbfae]">
                            Type: {item.type}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-[#9fbfae] text-right shrink-0">
                        {new Date(item.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Footer reaching bottom, left, and right edges */}
      <div className="px-4 sm:px-8 lg:px-12 py-3.5 bg-[#010904] border-t border-white/10 flex items-center justify-between shrink-0 z-10">
        <button
          onClick={handleLogout}
          className="py-2 px-4 rounded-xl bg-rose-950/40 border border-rose-500/30 hover:border-rose-500 hover:bg-rose-950/70 text-rose-300 hover:text-rose-100 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Secure Sign Out</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-[11px] font-mono text-[#3dff8f]/80">
            Protected with Firebase Zero-Trust
          </span>
          <span className="text-[10px] font-mono text-[#9fbfae]">
            Session ID: {user.uid.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* FINAL CONFIRMATION MODAL: DELETE ACCOUNT */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#021008] border border-rose-500/40 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(244,63,94,0.3)] space-y-4 relative">
            {/* Header with danger icon */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">Permanently Delete Account?</h3>
                <p className="text-xs text-rose-300/90 font-mono mt-0.5">Final Confirmation Required</p>
              </div>
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
                className="text-[#9fbfae] hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning consequences */}
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/20 space-y-2 text-xs text-[#d1e8db]">
              <p className="font-semibold text-rose-300">
                This action is permanent and cannot be reversed:
              </p>
              <ul className="space-y-1.5 text-[11px] text-[#9fbfae] list-disc list-inside">
                <li>
                  Your Firebase authentication user (<span className="text-white font-mono">{user.email}</span>) will be deleted immediately.
                </li>
                <li>
                  Your Firestore profile data, personal details, and avatar will be permanently removed.
                </li>
                <li>
                  All submitted project inquiries and audit logs in your account will be erased.
                </li>
              </ul>
            </div>

            {/* Error notice if deletion fails or re-auth is needed */}
            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <p className="font-medium">{deleteError}</p>
                  {requiresRecentLogin && isGoogleAuth && (
                    <button
                      type="button"
                      onClick={handleReauthGoogle}
                      className="mt-1 py-1.5 px-3 rounded-lg bg-white text-gray-900 font-bold text-xs flex items-center gap-1.5 hover:bg-gray-100 cursor-pointer shadow-sm"
                    >
                      <span>Re-authenticate with Google</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Confirmation input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#f4fff8]">
                To confirm deletion, please type <span className="text-rose-400 font-bold font-mono">DELETE</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                disabled={isDeleting}
                className="w-full px-3 py-2 bg-[#010904] border border-rose-500/30 focus:border-rose-400 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none font-mono tracking-wider uppercase"
              />
            </div>

            {/* Password input for email/password users */}
            {isPasswordAuth && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#f4fff8]">
                  Current Account Password (optional, verifies session credentials):
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isDeleting}
                  className="w-full px-3 py-2 bg-[#010904] border border-white/10 focus:border-rose-400 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none font-mono"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-[#9fbfae] hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel / Keep Account
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={isDeleting || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.3)]"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Purging Account Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete My Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
