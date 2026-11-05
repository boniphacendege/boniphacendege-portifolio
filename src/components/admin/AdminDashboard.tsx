import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  PortfolioDatabase,
  ServiceItem,
  SkillItem,
  ProjectItem,
  AIWorkflowStage,
  WorkExperienceItem,
  EducationItem,
  CertificationItem,
  AchievementItem,
  TestimonialItem,
  ContactInquiry,
  BlogPostItem,
  BookItem,
  BookChapter,
  BookReadingTheme,
  ProjectAttachment,
  portfolioStorage
} from '../../data/portfolioStorage';
import {
  generateEmailVerificationCode,
  getGoogleAuthenticatorUri,
  verifyTOTPCode,
  DEFAULT_ADMIN_2FA_SECRET,
  detectPasswordHarshness,
  checkBruteForceProtection,
  recordFailedPasscodeAttempt,
  resetFailedPasscodeAttempts
} from '../../utils/cryptoAuth';
import { uploadFileToStorage } from '../../lib/firebase';
import { LOGO_DATA_URI } from '../../assets/logo';
import { saveMediaToIndexedDB } from '../../utils/mediaStorage';
import { PenOnBookIcon } from '../PenOnBookIcon';
import { BestBookBadgeIcon } from '../BestBookBadgeIcon';
import {
  processImageFile,
  processProjectImageFile,
  detectStandardAspectRatio,
  detectImageDimensionsAndRatio,
  getCssAspectRatio,
  SQUARE_RATIOS,
  LANDSCAPE_RATIOS,
  PORTRAIT_RATIOS,
  StandardRatioId,
  formatTwoByThreeBookCover,
  processTradeRatioBookCoverFile
} from '../../utils/imageHelper';
import {
  Lock,
  Unlock,
  X,
  LayoutDashboard,
  User,
  Palette,
  Wrench,
  FolderOpen,
  Briefcase,
  GraduationCap,
  Award,
  Sparkles,
  MessageSquare,
  Mail,
  Download,
  Upload,
  RotateCcw,
  Shield,
  ShieldCheck,
  Key,
  QrCode,
  Plus,
  Trash2,
  Edit,
  Save,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Check,
  Search,
  ExternalLink,
  ArrowLeft,
  ChevronRight,
  Menu,
  LogOut,
  BookOpen,
  CheckCircle,
  Sliders,
  Video as VideoIcon,
  FileText,
  FileDown,
  Bold,
  Italic,
  List,
  Quote,
  Copy,
  BookMarked,
  Bookmark,
  Loader2,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { VideosTab } from './VideosTab';
import { AdminImagePreviewModal, ImagePreviewData } from './AdminImagePreviewModal';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  data: PortfolioDatabase;
  onDataChanged: () => void;
  initialTab?: string;
  initialEditingBookId?: string | null;
  initialBookSubView?: 'catalog' | 'categories';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  data,
  onDataChanged,
  initialTab = 'overview',
  initialEditingBookId = null,
  initialBookSubView = 'catalog'
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [authError, setAuthError] = useState('');
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(portfolioStorage.isAuthenticated());
  const [authStep, setAuthStep] = useState<'passcode' | '2fa'>('passcode');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState<'authenticator' | 'email'>('authenticator');
  const [emailVerificationCode, setEmailVerificationCode] = useState<string | null>(null);
  const [emailCodeNotice, setEmailCodeNotice] = useState<string | null>(null);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  // Check brute force lockout on mount or when opening
  useEffect(() => {
    if (isOpen) {
      const status = checkBruteForceProtection('admin_portal');
      if (status.isLocked) {
        setLockoutSeconds(status.remainingSeconds);
      }
    }
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Active module tab
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'profile'
    | 'services'
    | 'skills'
    | 'projects'
    | 'categories'
    | 'blog'
    | 'books'
    | 'videos'
    | 'experience'
    | 'education'
    | 'certifications'
    | 'testimonials'
    | 'workflow'
    | 'inquiries'
    | 'backup'
    | 'security'
  >((initialTab as any) || 'overview');

  // Toggle between full-screen menu view and full-screen content workspace
  const [viewMode, setViewMode] = useState<'menu' | 'content'>(
    initialTab && initialTab !== 'overview' ? 'content' : 'menu'
  );

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab as any);
      if (initialTab !== 'overview') {
        setViewMode('content');
      }
    }
  }, [isOpen, initialTab, initialEditingBookId]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Status toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!isOpen) return null;

  // Step 1: Validate Admin Passcode using salted SHA-256 hash internally
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // Anti-Hacker & Scammer Check: Prevent automated brute-force attacks
    const bruteCheck = checkBruteForceProtection('admin_portal');
    if (bruteCheck.isLocked) {
      setLockoutSeconds(bruteCheck.remainingSeconds);
      setAuthError(`🛡️ Anti-Scam Protection Active: Locked out for ${bruteCheck.remainingSeconds}s due to repeated incorrect entries.`);
      return;
    }

    if (portfolioStorage.authenticatePasscodeOnly(passcode)) {
      resetFailedPasscodeAttempts('admin_portal');
      const dbData = portfolioStorage.getData();
      const is2FAEnabled = dbData.admin2FA?.enabled ?? true;
      if (is2FAEnabled) {
        setAuthStep('2fa');
        setAuthError('');
      } else {
        portfolioStorage.completeAdminAuthentication();
        setIsAuthenticated(true);
        setPasscode('');
      }
    } else {
      const failStatus = recordFailedPasscodeAttempt('admin_portal');
      if (failStatus.isLocked) {
        setLockoutSeconds(failStatus.remainingSeconds);
        setAuthError(`🛡️ Anti-Hacker Defense Triggered: ${failStatus.attemptCount} failed attempts. Access locked for ${failStatus.remainingSeconds}s.`);
      } else {
        const remaining = 4 - failStatus.attemptCount;
        setAuthError(`Incorrect passcode. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before security cooldown.`);
      }
    }
  };

  // Step 2: Validate Two-Factor Authentication (Google Authenticator / Email Code)
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsVerifying2FA(true);
    try {
      const cleanCode = twoFactorCode.trim();
      let isValid = false;

      if (emailVerificationCode && cleanCode === emailVerificationCode) {
        isValid = true;
      } else {
        isValid = await portfolioStorage.verifyAdmin2FACode(cleanCode);
      }

      if (isValid) {
        portfolioStorage.completeAdminAuthentication();
        setIsAuthenticated(true);
        setPasscode('');
        setTwoFactorCode('');
        setAuthStep('passcode');
        setEmailCodeNotice(null);
        setEmailVerificationCode(null);
      } else {
        setAuthError('Invalid 2FA code. Please verify the code in Google Authenticator or your Email code and try again.');
      }
    } catch {
      setAuthError('Verification error. Please try again.');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleSendEmailCode = () => {
    const code = generateEmailVerificationCode();
    setEmailVerificationCode(code);
    const targetEmail = portfolioStorage.getData().admin2FA?.recoveryEmail || 'bishboniphace.ndege@gmail.com';
    setEmailCodeNotice(`Verification code sent to ${targetEmail}: [ ${code} ] (Valid for current session)`);
    setAuthError('');
  };

  const handleLogout = () => {
    portfolioStorage.logout();
    setIsAuthenticated(false);
    setAuthStep('passcode');
    setPasscode('');
    setTwoFactorCode('');
  };

  // Login Modal if not authenticated
  if (!isAuthenticated) {
    return (
      <div
        id="admin-modal-root"
        data-unauth-exempt="true"
        data-admin-portal="true"
        data-admin-login="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
      >
        <div className="w-full max-w-md p-7 rounded-[24px] bg-[#02100a] border border-[#f0b92e] shadow-2xl relative text-[#f4fff8]">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-[#9fbfae] hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {authStep === 'passcode' ? (
            <>
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#0a351e] border border-[#f0b92e]/40 flex items-center justify-center text-[#f0b92e] shrink-0 shadow-[0_0_15px_rgba(240,185,46,0.25)]">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif-heading font-extrabold text-lg text-[#fff1b8] leading-tight">
                    Admin Portal Login
                  </h3>
                  <p className="text-xs text-[#9fbfae]">
                    Dedicated administrator security gateway
                  </p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono text-[#9fbfae] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#f0b92e]" />
                      <span>Admin Passcode</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#3dff8f] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3dff8f] animate-pulse" />
                      Hidden in secure dots
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type={showPasscode ? 'text' : 'password'}
                      required
                      disabled={lockoutSeconds > 0}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.3)] text-sm text-[#f4fff8] focus:border-[#3dff8f] focus:outline-none font-mono tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                      autoFocus
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9fbfae] hover:text-[#fff1b8] p-1 transition-colors cursor-pointer"
                      title={showPasscode ? 'Hide passcode dots' : 'Reveal passcode'}
                      aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                    >
                      {showPasscode ? <EyeOff className="w-4 h-4 text-[#f0b92e]" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Real-Time Harsh Password Detection Indicator */}
                  {passcode.length > 0 && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-[#011409] border border-white/10 space-y-1.5">
                      {(() => {
                        const harshCheck = detectPasswordHarshness(passcode);
                        return (
                          <>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-[#9fbfae] font-mono">Password Harshness:</span>
                              <span
                                className="font-mono font-bold px-2 py-0.5 rounded text-[10px]"
                                style={{
                                  backgroundColor: `${harshCheck.color}20`,
                                  color: harshCheck.color,
                                  border: `1px solid ${harshCheck.color}60`
                                }}
                              >
                                {harshCheck.label} {harshCheck.isHarsh ? '🛡️ HARSH' : ''}
                              </span>
                            </div>

                            {/* 4-segment strength bar */}
                            <div className="grid grid-cols-4 gap-1.5 h-1.5">
                              {[1, 2, 3, 4].map((step) => (
                                <div
                                  key={step}
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    backgroundColor: step <= harshCheck.score ? harshCheck.color : '#082515'
                                  }}
                                />
                              ))}
                            </div>

                            <p className="text-[10px] text-[#9fbfae] font-mono leading-tight">
                              {harshCheck.feedback}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {authError && (
                    <div className="mt-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 font-mono flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {lockoutSeconds > 0 && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-300 font-mono flex items-center justify-between">
                      <span>Anti-Scam Cooldown:</span>
                      <span className="font-bold text-amber-200">{lockoutSeconds}s remaining</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={lockoutSeconds > 0}
                  className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {lockoutSeconds > 0 ? `Locked (${lockoutSeconds}s)` : 'Authenticate & Open Dashboard⚡'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#0a351e] border border-[#3dff8f]/40 flex items-center justify-center text-[#3dff8f] mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div className="mb-4">
                <h4 className="text-base font-bold text-[#fff1b8] mb-1">
                  Two-Factor Authentication (2FA)
                </h4>
                <p className="text-xs text-[#9fbfae]">
                  Enter the 6-digit verification code from your Google Authenticator app or request an Email verification code.
                </p>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-mono text-[#9fbfae]">Security Code</label>
                    <div className="flex gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => { setTwoFactorMethod('authenticator'); setAuthError(''); }}
                        className={`cursor-pointer ${twoFactorMethod === 'authenticator' ? 'text-[#3dff8f] font-bold underline' : 'text-[#9fbfae] hover:text-white'}`}
                      >
                        Google Authenticator
                      </button>
                      <span className="text-[#9fbfae]/40">•</span>
                      <button
                        type="button"
                        onClick={() => { setTwoFactorMethod('email'); handleSendEmailCode(); }}
                        className={`cursor-pointer ${twoFactorMethod === 'email' ? 'text-[#3dff8f] font-bold underline' : 'text-[#9fbfae] hover:text-white'}`}
                      >
                        Email Code
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#010904] border border-[rgba(61,255,143,0.4)] text-center tracking-[0.3em] font-mono text-base text-[#3dff8f] focus:border-[#3dff8f] focus:outline-none"
                    autoFocus
                  />
                  {emailCodeNotice && (
                    <div className="p-2.5 mt-2 rounded-lg bg-[#032012] border border-[#3dff8f]/30 text-xs text-[#a7f3d0]">
                      {emailCodeNotice}
                    </div>
                  )}
                  {authError && <p className="text-xs text-rose-400 mt-1.5 font-mono">{authError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isVerifying2FA}
                  className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-[#1a1200] bg-gradient-to-b from-[#5aff9f] via-[#3dff8f] to-[#0f7a43] hover:from-white hover:to-[#3dff8f] cursor-pointer"
                >
                  {isVerifying2FA ? 'Verifying 2FA...' : 'Verify & Open Dashboard⚡'}
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => { setAuthStep('passcode'); setAuthError(''); setTwoFactorCode(''); }}
                    className="text-[#9fbfae] hover:text-white cursor-pointer"
                  >
                    ← Back to Passcode
                  </button>
                  {twoFactorMethod === 'email' && (
                    <button
                      type="button"
                      onClick={handleSendEmailCode}
                      className="text-[#f0b92e] hover:underline cursor-pointer"
                    >
                      Resend Email Code
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  const tabModules = [
    {
      id: 'overview',
      label: 'Overview & Stats',
      icon: <LayoutDashboard className="w-5 h-5 text-[#f0b92e]" />,
      desc: 'System health, key metrics, and portfolio highlights',
      badge: `${data.projects.length} Projects`
    },
    {
      id: 'profile',
      label: 'Profile & About',
      icon: <User className="w-5 h-5 text-[#3dff8f]" />,
      desc: 'Titles, headline, bio, 1:1 square photo & logo, contact info',
      badge: data.profile.name
    },
    {
      id: 'services',
      label: 'Services Manager',
      icon: <Palette className="w-5 h-5 text-[#f0b92e]" />,
      desc: 'Services, descriptions, delivery times, and pricing settings',
      badge: `${data.services.filter((s) => s.published).length} Published`
    },
    {
      id: 'skills',
      label: 'Skills & Tools',
      icon: <Wrench className="w-5 h-5 text-[#3dff8f]" />,
      desc: 'Manual skills, categories, software tools & proficiency %',
      badge: `${data.skills.length} Skills Listed`
    },
    {
      id: 'projects',
      label: 'Projects Showcase',
      icon: <FolderOpen className="w-5 h-5 text-[#f0b92e]" />,
      desc: 'Case studies, 1:1 project cover & gallery image uploads',
      badge: `${data.projects.length} Case Studies`
    },
    {
      id: 'categories',
      label: 'Project Categories',
      icon: <FolderOpen className="w-5 h-5 text-[#3dff8f]" />,
      desc: 'Add, rename, reorder, or delete portfolio categories',
      badge: `${data.categories.length} Categories`
    },
    {
      id: 'blog',
      label: 'Blog & Articles',
      icon: <PenOnBookIcon className="w-5 h-5 text-[#3dff8f]" glow />,
      desc: 'Write, edit, and publish rich articles with auto image ratios and tags',
      badge: `${(data.blogPosts || []).length} Articles`
    },
    {
      id: 'books',
      label: 'Books & Bookstore',
      icon: <BookOpen className="w-5 h-5 text-[#3dff8f]" />,
      desc: 'Book seller manager, chapters direct typing, PDF file upload, and custom reading designs',
      badge: `${(data.books || []).length} Books`
    },
    {
      id: 'videos',
      label: 'Videos Showcase',
      icon: <VideoIcon className="w-5 h-5 text-[#3dff8f]" />,
      desc: '16:9 cinematic productions & 1:1 square reels with chapters & ratio switcher',
      badge: `${(data.videos || []).length} Videos`
    },
    {
      id: 'experience',
      label: 'Work Experience',
      icon: <Briefcase className="w-5 h-5 text-[#f0b92e]" />,
      desc: 'Freelance & professional timeline entries (2022 – Present)',
      badge: `${data.workExperience.length} Positions`
    },
    {
      id: 'education',
      label: 'Education',
      icon: <GraduationCap className="w-5 h-5 text-[#3dff8f]" />,
      desc: 'Academic studies, institutions, and qualifications',
      badge: `${data.education.length} Entries`
    },
    {
      id: 'certifications',
      label: 'Certifications',
      icon: <Award className="w-5 h-5 text-[#f0b92e]" />,
      desc: 'Verified courses, achievements, and credential links',
      badge: `${data.certifications.length} Verified`
    },
    {
      id: 'workflow',
      label: 'AI Creative Workflow',
      icon: <Sparkles className="w-5 h-5 text-[#3dff8f]" />,
      desc: 'Human-in-the-loop AI stages from research to deployment',
      badge: `${data.workflowStages.length} Stages`
    },
    {
      id: 'testimonials',
      label: 'Testimonials',
      icon: <MessageSquare className="w-5 h-5 text-[#f0b92e]" />,
      desc: 'Authentic client reviews, roles, and verified feedback',
      badge: `${data.testimonials.length} Testimonials`
    },
    {
      id: 'inquiries',
      label: `Inquiries (${data.inquiries.length})`,
      icon: <Mail className="w-5 h-5 text-[#3dff8f]" />,
      desc: 'Client project briefs submitted from the contact form',
      badge: `${data.inquiries.length} Messages`
    },
    {
      id: 'backup',
      label: 'Backup & Restore',
      icon: <Download className="w-5 h-5 text-[#f0b92e]" />,
      desc: 'Export JSON data backup, import database snapshot, or reset',
      badge: 'Persistence'
    },
    {
      id: 'security',
      label: 'Passcode & Security',
      icon: <Shield className="w-5 h-5 text-[#3dff8f]" />,
      desc: 'Update admin password and manage session authentication',
      badge: 'Protected'
    }
  ];

  // Full-Screen Menu View: Side 1 appears full screen, second part hidden
  if (viewMode === 'menu') {
    return (
      <div className="fixed inset-0 z-50 w-full h-full bg-[#010703] text-[#f4fff8] flex flex-col overflow-hidden animate-in fade-in">
        {/* Top Bar: Boniphace Portfolio Admin Portal + Lock / Logout */}
        <div className="px-4 sm:px-6 py-4 bg-[#021208] border-b border-[rgba(240,185,46,0.25)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3dff8f] animate-pulse" />
            <span className="font-serif-heading font-extrabold text-base sm:text-lg text-[#fff1b8]">
              Boniphace Portfolio Admin Portal
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0a351e] text-[#3dff8f] hidden sm:inline-block">
              Master Control
            </span>
          </div>

          <div className="flex items-center gap-3">
            {toastMessage && (
              <span className="text-xs font-mono text-[#3dff8f] bg-[#0a351e] px-3 py-1 rounded-full border border-[#3dff8f]/30">
                {toastMessage}
              </span>
            )}
            {/* Clearly Visible Log Out Button */}
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-mono font-bold text-xs sm:text-sm bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30 hover:border-rose-400 flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_14px_rgba(244,63,94,0.3)] active:scale-95"
              title="Log out of admin portal"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Log Out</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close portal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Full Menu Body: Cards reach top, down, left and right edges */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#010804] w-full h-full">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[rgba(240,185,46,0.18)]">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-heading text-[#fff1b8]">
                  Admin Modules & Settings
                </h2>
                <p className="text-xs sm:text-sm text-[#9fbfae] mt-1">
                  Click any module below to open it full-screen and manage your portfolio content.
                </p>
              </div>
              <div className="text-xs font-mono text-[#3dff8f] bg-[#0a351e] px-3 py-1.5 rounded-full border border-[#3dff8f]/30 w-fit">
                {tabModules.length} Modules Available
              </div>
            </div>

            {/* Grid of Section Cards: touching edges smoothly */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tabModules.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setViewMode('content');
                  }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-[#0f7a43]/20 via-[#03170d]/85 to-[#010804] border border-[rgba(240,185,46,0.22)] hover:border-[#3dff8f] hover:shadow-[0_0_28px_-6px_#3dff8f] transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#010c05] border border-[rgba(240,185,46,0.3)] flex items-center justify-center group-hover:scale-110 group-hover:border-[#3dff8f] transition-all">
                        {tab.icon}
                      </div>
                      <span className="text-[11px] font-mono font-bold text-[#f0b92e] bg-[#f0b92e]/10 px-2.5 py-0.5 rounded-full border border-[#f0b92e]/20">
                        {tab.badge}
                      </span>
                    </div>
                    <h3 className="font-serif-heading font-bold text-base sm:text-lg text-[#fff1b8] group-hover:text-[#3dff8f] transition-colors mb-1.5">
                      {tab.label}
                    </h3>
                    <p className="text-xs text-[#9fbfae] leading-relaxed">
                      {tab.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[rgba(240,185,46,0.12)] flex items-center justify-between text-xs font-mono text-[#f0b92e] group-hover:text-[#3dff8f]">
                    <span>Open Module</span>
                    <span className="text-sm transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full-Screen Content View: Pressed side appears full on screen, menu side disappears
  return (
    <div
      id="admin-modal-root"
      data-unauth-exempt="true"
      className="fixed inset-0 z-50 w-full h-full bg-[#010703] text-[#f4fff8] flex flex-col overflow-hidden animate-in fade-in"
    >
      {/* Full-Screen Workspace Top Bar with Menu Icon Button and Clearly Visible Log Out */}
      <div className="px-4 sm:px-6 py-3.5 bg-[#021208] border-b border-[rgba(240,185,46,0.25)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Menu icon on: button with Menu icon */}
          <button
            onClick={() => setViewMode('menu')}
            className="px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] shadow-[0_0_15px_-4px_rgba(240,185,46,0.6)] flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            title="Return to full admin modules menu"
          >
            <Menu className="w-4 h-4 text-[#1a1200]" />
            <span>Modules Menu</span>
          </button>

          <div className="flex items-center gap-2 pl-3 border-l border-[rgba(240,185,46,0.25)]">
            <span className="text-xs font-mono text-[#9fbfae] hidden sm:inline">Active Module:</span>
            <span className="font-serif-heading font-bold text-sm sm:text-base text-[#3dff8f] flex items-center gap-1.5">
              {tabModules.find((t) => t.id === activeTab)?.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {toastMessage && (
            <span className="text-xs font-mono text-[#3dff8f] bg-[#0a351e] px-3 py-1 rounded-full border border-[#3dff8f]/30">
              {toastMessage}
            </span>
          )}

          {/* Clearly Visible Log Out Button */}
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-mono font-bold text-xs sm:text-sm bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30 hover:border-rose-400 flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_14px_rgba(244,63,94,0.3)] active:scale-95"
            title="Log out of admin portal"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Log Out</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close portal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Full-Screen Workspace Content (Sidebar-less: occupies full viewport width) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#010804] w-full h-full">
        <div className="w-full">
          {activeTab === 'overview' && (
            <OverviewTab
              data={data}
              onNavigate={(tab) => {
                setActiveTab(tab);
                setViewMode('content');
              }}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab data={data} onSave={showToast} onRefresh={onDataChanged} />
          )}

          {activeTab === 'services' && (
            <ServicesTab data={data} onSave={showToast} onRefresh={onDataChanged} />
          )}

          {activeTab === 'skills' && (
            <SkillsTab data={data} onSave={showToast} onRefresh={onDataChanged} />
          )}

          {activeTab === 'projects' && (
            <ProjectsTab data={data} onSave={showToast} onRefresh={onDataChanged} />
          )}

          {activeTab === 'categories' && (
            <CategoriesTab data={data} onSave={showToast} onRefresh={onDataChanged} />
          )}

          {activeTab === 'blog' && (
            <BlogTab data={data} onSave={showToast} onRefresh={onDataChanged} />
          )}

          {activeTab === 'books' && (
            <BooksTab
              data={data}
              onSave={showToast}
              onRefresh={onDataChanged}
              initialEditingBookId={initialEditingBookId}
              initialSubView={initialBookSubView}
            />
          )}

          {activeTab === 'videos' && (
            <VideosTab data={data} onSave={showToast} onRefresh={onDataChanged} />
          )}

          {activeTab === 'experience' && (
            <ExperienceTab data={data} onSave={showToast} onRefresh={onDataChanged} />
          )}

          {activeTab === 'education' && (
            <EducationTab data={data} onSave={showToast} onRefresh={onDataChanged} />
          )}

          {activeTab === 'certifications' && (
            <CertificationsTab data={data} onSave={showToast} onRefresh={onDataChanged} />
          )}

          {activeTab === 'workflow' && (
            <WorkflowTab data={data} onSave={showToast} onRefresh={onDataChanged} />
          )}

          {activeTab === 'testimonials' && (
            <TestimonialsTab data={data} onSave={showToast} onRefresh={onDataChanged} />
          )}

          {activeTab === 'inquiries' && (
            <InquiriesTab data={data} onSave={showToast} onRefresh={onDataChanged} />
          )}

          {activeTab === 'backup' && (
            <BackupTab data={data} onSave={showToast} onRefresh={onDataChanged} />
          )}

          {activeTab === 'security' && (
            <SecurityTab onSave={showToast} />
          )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-module: Overview Tab                                                   */
/* -------------------------------------------------------------------------- */
const OverviewTab: React.FC<{ data: PortfolioDatabase; onNavigate: (tab: any) => void }> = ({
  data,
  onNavigate
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold font-serif-heading text-[#fff1b8] mb-1">
          Welcome back, Boniphace!
        </h3>
        <p className="text-xs text-[#9fbfae]">
          Manage all sections of your creative portfolio in real-time. Changes are immediately visible on the website.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#010a05] border border-[rgba(240,185,46,0.2)]">
          <div className="text-xs text-[#9fbfae] uppercase font-mono">Projects</div>
          <div className="text-2xl font-bold text-[#3dff8f] font-serif-heading mt-1">
            {data.projects.length}
          </div>
          <div className="text-[11px] text-[#9fbfae] mt-1">
            {data.projects.filter((p) => p.published).length} Published
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#010a05] border border-[rgba(240,185,46,0.2)]">
          <div className="text-xs text-[#9fbfae] uppercase font-mono">Services</div>
          <div className="text-2xl font-bold text-[#f0b92e] font-serif-heading mt-1">
            {data.services.length}
          </div>
          <div className="text-[11px] text-[#9fbfae] mt-1">
            {data.services.filter((s) => s.published).length} Active
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#010a05] border border-[rgba(240,185,46,0.2)]">
          <div className="text-xs text-[#9fbfae] uppercase font-mono">Skills & Tools</div>
          <div className="text-2xl font-bold text-[#3dff8f] font-serif-heading mt-1">
            {data.skills.length}
          </div>
          <div className="text-[11px] text-[#9fbfae] mt-1">
            Across {data.categories.length} categories
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#010a05] border border-[rgba(240,185,46,0.2)]">
          <div className="text-xs text-[#9fbfae] uppercase font-mono">Client Inquiries</div>
          <div className="text-2xl font-bold text-[#f0b92e] font-serif-heading mt-1">
            {data.inquiries.length}
          </div>
          <div className="text-[11px] text-[#9fbfae] mt-1">
            Logged from Contact form
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[#02150b] border border-[#0f7a43]/50 space-y-3">
        <h4 className="font-bold text-[#fff1b8] text-sm">Quick Administrative Shortcuts</h4>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('projects')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#3dff8f]/10 text-[#3dff8f] border border-[#3dff8f]/30 hover:bg-[#3dff8f]/20"
          >
            + Add New Project
          </button>
          <button
            onClick={() => onNavigate('services')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#f0b92e]/10 text-[#fff1b8] border border-[#f0b92e]/30 hover:bg-[#f0b92e]/20"
          >
            Manage Services
          </button>
          <button
            onClick={() => onNavigate('skills')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10"
          >
            Manage Skills
          </button>
          <button
            onClick={() => onNavigate('inquiries')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/30 hover:bg-[#0f7a43]"
          >
            View Messages ({data.inquiries.length})
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-module: Profile Tab                                                    */
/* -------------------------------------------------------------------------- */
const ProfileTab: React.FC<{
  data: PortfolioDatabase;
  onSave: (msg: string) => void;
  onRefresh: () => void;
}> = ({ data, onSave, onRefresh }) => {
  const [profile, setProfile] = useState({ ...data.profile });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const socialUrls = [
      profile.socialLinks.linkedin,
      profile.socialLinks.instagram,
      profile.socialLinks.facebook,
      profile.socialLinks.github
    ].filter((value): value is string => Boolean(value?.trim()));
    const invalidSocialUrl = socialUrls.some((value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol !== 'https:';
      } catch {
        return true;
      }
    });
    if (invalidSocialUrl) {
      onSave('Social links must be valid HTTPS URLs.');
      return;
    }
    portfolioStorage.updateData((prev) => ({
      ...prev,
      profile
    }));
    onSave('Profile settings saved successfully!');
    onRefresh();
  };

  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [heroBgUrlInput, setHeroBgUrlInput] = useState('');
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [heroBgFileName, setHeroBgFileName] = useState<string | null>(null);
  const [logoSaved, setLogoSaved] = useState(false);
  const [photoSaved, setPhotoSaved] = useState(false);
  const [heroBgSaved, setHeroBgSaved] = useState(false);
  const [previewModal, setPreviewModal] = useState<ImagePreviewData | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFileName(file.name);

    // 0ms instant visual preview into admin dashboard & live showcase
    const instantUrl = URL.createObjectURL(file);
    setProfile((prev) => ({
      ...prev,
      profilePhoto: instantUrl,
      heroBackgroundImage: prev.heroBackgroundImage || instantUrl
    }));

    try {
      // 1. Immediately store to IndexedDB for zero-quota client persistence
      await saveMediaToIndexedDB('brand_profile_photo', file);

      // 2. Process image for crisp responsive rendering
      const dataUrl = await processImageFile(file, 800, 800, 0.85, true);
      let finalUrl = dataUrl;
      try {
        const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg';
        finalUrl = await uploadFileToStorage(file, `portfolio/brand/profile_${Date.now()}.${ext}`, file.type || 'image/jpeg');
      } catch (storageErr) {
        console.warn('Storage upload note for profile photo:', storageErr);
      }

      setProfile((prev) => ({ ...prev, profilePhoto: finalUrl, heroBackgroundImage: prev.heroBackgroundImage || finalUrl }));
      portfolioStorage.setProfilePhoto(finalUrl);
      setPhotoSaved(true);
      onSave(`1:1 Hero profile photo (${file.name}) uploaded & stored! Now active in Hero and About.`);
      onRefresh();
      setTimeout(() => setPhotoSaved(false), 4000);
    } catch (err: any) {
      onSave(`Error processing image: ${err?.message || 'Unsupported format'}`);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFileName(file.name);

    // 0ms instant visual preview into admin dashboard & live showcase
    const instantUrl = URL.createObjectURL(file);
    setProfile((prev) => ({ ...prev, logoPhoto: instantUrl }));

    try {
      // 1. Immediately store raw logo to IndexedDB
      await saveMediaToIndexedDB('brand_logo', file);

      // 2. Process image (maintains SVG vector and PNG transparency)
      const dataUrl = await processImageFile(file, 600, 600, 0.85);
      let finalUrl = dataUrl;
      try {
        const ext = file.type.includes('png') ? 'png' : file.type.includes('svg') ? 'svg' : 'jpg';
        finalUrl = await uploadFileToStorage(file, `portfolio/brand/logo_${Date.now()}.${ext}`, file.type || 'image/png');
      } catch (storageErr) {
        console.warn('Storage upload note for logo:', storageErr);
      }

      setProfile((prev) => ({ ...prev, logoPhoto: finalUrl }));
      portfolioStorage.setLogoPhoto(finalUrl);
      setLogoSaved(true);
      onSave(`Logo (${file.name}) uploaded & stored! Active across status, Footer, badge, and Preloader.`);
      onRefresh();
      setTimeout(() => setLogoSaved(false), 4000);
    } catch (err: any) {
      onSave(`Error processing logo: ${err?.message || 'Unsupported format'}`);
    }
  };

  const handleSaveLogoExplicit = () => {
    if (profile.logoPhoto) {
      portfolioStorage.setLogoPhoto(profile.logoPhoto);
      setLogoSaved(true);
      onSave('Website logo saved successfully!');
      onRefresh();
      setTimeout(() => setLogoSaved(false), 4000);
    }
  };

  const handleSavePhotoExplicit = () => {
    if (profile.profilePhoto) {
      portfolioStorage.setProfilePhoto(profile.profilePhoto);
      setPhotoSaved(true);
      onSave('Profile photo saved successfully! It is live in Hero and About.');
      onRefresh();
      setTimeout(() => setPhotoSaved(false), 4000);
    }
  };

  const handleSaveAllPhotos = () => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        logoPhoto: profile.logoPhoto || prev.profile.logoPhoto,
        profilePhoto: profile.profilePhoto || prev.profile.profilePhoto,
        heroBackgroundImage: profile.heroBackgroundImage !== undefined ? profile.heroBackgroundImage : prev.profile.heroBackgroundImage,
        heroBackgroundOpacity: profile.heroBackgroundOpacity ?? prev.profile.heroBackgroundOpacity ?? 45,
        heroBackgroundPosition: profile.heroBackgroundPosition ?? prev.profile.heroBackgroundPosition ?? 'right',
        heroShowcaseTransparent: profile.heroShowcaseTransparent ?? prev.profile.heroShowcaseTransparent ?? false
      }
    }));
    setLogoSaved(true);
    setPhotoSaved(true);
    setHeroBgSaved(true);
    onSave('All uploaded brand photos, logo & hero background saved successfully!');
    onRefresh();
    setTimeout(() => {
      setLogoSaved(false);
      setPhotoSaved(false);
      setHeroBgSaved(false);
    }, 4000);
  };

  const handleHeroBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroBgFileName(file.name);

    // 0ms instant visual preview into admin dashboard & live showcase
    const instantUrl = URL.createObjectURL(file);
    setProfile((prev) => ({ ...prev, heroBackgroundImage: instantUrl }));

    try {
      // 1. Immediately store to IndexedDB
      await saveMediaToIndexedDB('brand_hero_bg', file);

      const dataUrl = await processImageFile(file, 800, 800, 0.85, true);
      let finalUrl = dataUrl;
      try {
        const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg';
        finalUrl = await uploadFileToStorage(file, `portfolio/brand/hero_bg_${Date.now()}.${ext}`, file.type || 'image/jpeg');
      } catch (storageErr) {
        console.warn('Storage upload note for hero background:', storageErr);
      }

      setProfile((prev) => ({ ...prev, heroBackgroundImage: finalUrl, profilePhoto: prev.profilePhoto === LOGO_DATA_URI ? finalUrl : prev.profilePhoto }));
      portfolioStorage.setHeroBackground(
        finalUrl,
        profile.heroBackgroundOpacity ?? 45,
        profile.heroBackgroundPosition ?? 'right',
        profile.heroShowcaseTransparent ?? false
      );
      setHeroBgSaved(true);
      onSave(`1:1 Hero image (${file.name}) uploaded & stored! Active in Hero.`);
      onRefresh();
      setTimeout(() => setHeroBgSaved(false), 4000);
    } catch (err: any) {
      onSave(`Error processing background image: ${err?.message || 'Unsupported format'}`);
    }
  };

  const handleSaveHeroBgExplicit = () => {
    if (profile.heroBackgroundImage) {
      portfolioStorage.setHeroBackground(
        profile.heroBackgroundImage,
        profile.heroBackgroundOpacity ?? 45,
        profile.heroBackgroundPosition ?? 'right',
        profile.heroShowcaseTransparent ?? false
      );
      setHeroBgSaved(true);
      onSave('Hero transparent background saved successfully! Live in Hero section.');
      onRefresh();
      setTimeout(() => setHeroBgSaved(false), 4000);
    }
  };

  const handleResetHeroBg = () => {
    setProfile((prev) => ({ ...prev, heroBackgroundImage: '' }));
    portfolioStorage.setHeroBackground('', 45, 'right', false);
    setHeroBgFileName(null);
    onSave('Hero transparent background removed.');
    onRefresh();
  };

  const handleApplyHeroBgUrl = () => {
    const trimmed = heroBgUrlInput.trim();
    if (!trimmed) return;
    setProfile((prev) => ({ ...prev, heroBackgroundImage: trimmed }));
    portfolioStorage.setHeroBackground(
      trimmed,
      profile.heroBackgroundOpacity ?? 45,
      profile.heroBackgroundPosition ?? 'right',
      profile.heroShowcaseTransparent ?? false
    );
    setHeroBgUrlInput('');
    setHeroBgSaved(true);
    onSave('Hero background URL applied and saved successfully!');
    onRefresh();
    setTimeout(() => setHeroBgSaved(false), 4000);
  };

  const handleResetPhoto = () => {
    setProfile((prev) => ({ ...prev, profilePhoto: LOGO_DATA_URI }));
    portfolioStorage.setProfilePhoto(LOGO_DATA_URI);
    setPhotoFileName(null);
    onSave('Profile photo reset to default monogram.');
    onRefresh();
  };

  const handleResetLogo = () => {
    setProfile((prev) => ({ ...prev, logoPhoto: LOGO_DATA_URI }));
    portfolioStorage.setLogoPhoto(LOGO_DATA_URI);
    setLogoFileName(null);
    onSave('Website logo reset to default monogram.');
    onRefresh();
  };

  const handleApplyPhotoUrl = () => {
    const trimmed = photoUrlInput.trim();
    if (!trimmed) return;
    setProfile((prev) => ({ ...prev, profilePhoto: trimmed }));
    portfolioStorage.setProfilePhoto(trimmed);
    setPhotoUrlInput('');
    setPhotoSaved(true);
    onSave('Profile photo URL applied and saved successfully!');
    onRefresh();
    setTimeout(() => setPhotoSaved(false), 4000);
  };

  const handleApplyLogoUrl = () => {
    const trimmed = logoUrlInput.trim();
    if (!trimmed) return;
    setProfile((prev) => ({ ...prev, logoPhoto: trimmed }));
    portfolioStorage.setLogoPhoto(trimmed);
    setLogoUrlInput('');
    setLogoSaved(true);
    onSave('Website logo URL applied and saved successfully!');
    onRefresh();
    setTimeout(() => setLogoSaved(false), 4000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(240,185,46,0.2)]">
        <div>
          <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
            Profile & About Information
          </h3>
          <p className="text-xs text-[#9fbfae]">
            Update your professional titles, main headline, intro, bio, and contact endpoints.
          </p>
        </div>
        <button
          type="submit"
          className="px-5 py-2 rounded-xl font-bold text-xs text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] flex items-center gap-1.5 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-[#1a1200]" />
          <span>Save Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono text-[#9fbfae] block mb-1">Full Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-[#9fbfae] block mb-1">Location</label>
          <input
            type="text"
            value={profile.location}
            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-mono text-[#9fbfae] block mb-1">Primary Titles (comma separated)</label>
        <input
          type="text"
          value={profile.titles.join(', ')}
          onChange={(e) =>
            setProfile({
              ...profile,
              titles: e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
            })
          }
          className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white"
        />
      </div>

      <div>
        <label className="text-xs font-mono text-[#9fbfae] block mb-1">Main Headline</label>
        <input
          type="text"
          value={profile.headline}
          onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
          className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white"
        />
      </div>

      <div>
        <label className="text-xs font-mono text-[#9fbfae] block mb-1">Availability Status</label>
        <input
          type="text"
          value={profile.availability}
          onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
          placeholder="Available Online"
          className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white"
        />
        <span className="text-[10px] text-[#9fbfae] mt-1 block">
          Displayed in the top Hero badge and About section. When &ldquo;Online&rdquo; is present, it glows with cycling neon colors.
        </span>
      </div>

      <div>
        <label className="text-xs font-mono text-[#9fbfae] block mb-1">Introduction Paragraph</label>
        <textarea
          rows={3}
          value={profile.intro}
          onChange={(e) => setProfile({ ...profile, intro: e.target.value })}
          className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white"
        />
      </div>

      <div>
        <label className="text-xs font-mono text-[#9fbfae] block mb-1">Full Biography</label>
        <textarea
          rows={4}
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono text-[#9fbfae] block mb-1">Creative Approach</label>
          <textarea
            rows={3}
            value={profile.creativeApproach}
            onChange={(e) => setProfile({ ...profile, creativeApproach: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-[#9fbfae] block mb-1">Design Philosophy</label>
          <textarea
            rows={3}
            value={profile.designPhilosophy}
            onChange={(e) => setProfile({ ...profile, designPhilosophy: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-mono text-[#9fbfae] block mb-1">AI Usage Statement</label>
        <textarea
          rows={3}
          value={profile.aiUsageStatement}
          onChange={(e) => setProfile({ ...profile, aiUsageStatement: e.target.value })}
          className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-mono text-[#9fbfae] block mb-1">Email</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-[#9fbfae] block mb-1">Phone</label>
          <input
            type="text"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-[#9fbfae] block mb-1">WhatsApp Digits</label>
          <input
            type="text"
            value={profile.whatsapp}
            onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white"
          />
        </div>
      </div>

      {/* Social profiles: URLs are editable and can be removed by clearing the field. */}
      <div className="p-5 rounded-2xl bg-[#010a05] border border-[rgba(240,185,46,0.25)] space-y-4">
        <div>
          <h4 className="text-sm font-bold font-serif-heading text-[#fff1b8]">Social Media Profiles</h4>
          <p className="text-xs text-[#9fbfae] mt-0.5">Add or update your public profile links. Leave a field empty to remove that social icon from the website.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/in/your-profile' },
            { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/your-profile' },
            { key: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/your-profile' },
            { key: 'github', label: 'GitHub', placeholder: 'https://github.com/your-username' }
          ].map((social) => (
            <div key={social.key}>
              <label className="text-xs font-mono text-[#9fbfae] block mb-1">{social.label}</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  inputMode="url"
                  placeholder={social.placeholder}
                  value={(profile.socialLinks as any)[social.key] || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, [social.key]: e.target.value } })}
                  className="min-w-0 flex-1 px-3 py-2 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, [social.key]: '' } })}
                  className="px-3 py-2 rounded-xl text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20"
                  aria-label={`Remove ${social.label} link`}
                  title={`Remove ${social.label} link`}
                >Remove</button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#9fbfae]">Click “Save Profile” above or below to apply changes. Only valid HTTPS profile links should be published.</p>
      </div>

      {/* Copyright Year Configuration (AUTO vs MANUAL Selection) */}
      <div className="p-5 rounded-2xl bg-[#010a05] border border-[rgba(240,185,46,0.35)] space-y-4 shadow-[0_0_20px_-8px_rgba(240,185,46,0.2)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <h4 className="text-sm font-bold font-serif-heading text-[#fff1b8] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#f0b92e]" />
              <span>Copyright Year Setting (Website Footer)</span>
            </h4>
            <p className="text-xs text-[#9fbfae] mt-0.5">
              Choose whether the copyright year updates dynamically with system time or stays manually locked to your specified year.
            </p>
          </div>
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/40 font-bold self-start sm:self-auto">
            Live Display: &copy; {profile.copyrightMode === 'manual' ? (profile.copyrightManualYear || '2026') : new Date().getFullYear()}
          </span>
        </div>

        {/* Selection: AUTO CHANGE vs MANUAL CHANGE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setProfile({ ...profile, copyrightMode: 'auto' });
              portfolioStorage.updateData((prev) => ({
                ...prev,
                profile: { ...prev.profile, copyrightMode: 'auto' }
              }));
              onSave('Copyright set to AUTO CHANGE (Dynamic System Year)!');
            }}
            className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
              (profile.copyrightMode || 'auto') === 'auto'
                ? 'bg-[#03301a] border-[#3dff8f] text-[#3dff8f] shadow-[0_0_15px_rgba(61,255,143,0.25)]'
                : 'bg-black/40 border-white/15 text-[#9fbfae] hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-bold text-xs flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  (profile.copyrightMode || 'auto') === 'auto' ? 'border-[#3dff8f] bg-[#3dff8f]' : 'border-white/40'
                }`}>
                  {(profile.copyrightMode || 'auto') === 'auto' && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                </span>
                <span>AUTO CHANGE</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3dff8f]/20 text-[#3dff8f] font-bold">
                Dynamic
              </span>
            </div>
            <p className="text-[11px] text-[#9fbfae] mt-2 leading-relaxed">
              Automatically calculates current year ({new Date().getFullYear()}) directly from system clock. Never requires manual updates when years change.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              const defaultManual = profile.copyrightManualYear || '2026';
              setProfile({ ...profile, copyrightMode: 'manual', copyrightManualYear: defaultManual });
              portfolioStorage.updateData((prev) => ({
                ...prev,
                profile: { ...prev.profile, copyrightMode: 'manual', copyrightManualYear: defaultManual }
              }));
              onSave('Copyright set to MANUAL CHANGE (Custom Year)!');
            }}
            className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
              profile.copyrightMode === 'manual'
                ? 'bg-[#03301a] border-[#f0b92e] text-[#f0b92e] shadow-[0_0_15px_rgba(240,185,46,0.25)]'
                : 'bg-black/40 border-white/15 text-[#9fbfae] hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-bold text-xs flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  profile.copyrightMode === 'manual' ? 'border-[#f0b92e] bg-[#f0b92e]' : 'border-white/40'
                }`}>
                  {profile.copyrightMode === 'manual' && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                </span>
                <span>MANUAL CHANGE</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f0b92e]/20 text-[#f0b92e] font-bold">
                Fixed Year
              </span>
            </div>
            <p className="text-[11px] text-[#9fbfae] mt-2 leading-relaxed">
              Manually lock or specify any custom year or year span (e.g. 2026, 2027, or 2024–2026).
            </p>
          </button>
        </div>

        {/* Manual Input Controls when MANUAL CHANGE is selected */}
        {profile.copyrightMode === 'manual' && (
          <div className="p-4 rounded-xl bg-[#02140a] border border-[#f0b92e]/40 space-y-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-mono text-[#fff1b8] font-bold">
                Manual Copyright Year / Range:
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-[#9fbfae]">Quick Presets:</span>
                {['2026', '2027', '2028', '2024–2026', '2026–2030'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setProfile({ ...profile, copyrightManualYear: preset });
                      portfolioStorage.updateData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, copyrightManualYear: preset }
                      }));
                      onSave(`Copyright year updated to "${preset}"!`);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                      profile.copyrightManualYear === preset
                        ? 'bg-[#f0b92e] text-black font-bold border-[#f0b92e]'
                        : 'bg-white/5 text-[#9fbfae] border-white/10 hover:text-white'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={profile.copyrightManualYear || ''}
                onChange={(e) => setProfile({ ...profile, copyrightManualYear: e.target.value })}
                placeholder="e.g. 2026 or 2024–2026"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-black border border-white/20 text-white font-mono text-xs focus:border-[#f0b92e] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  portfolioStorage.updateData((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, copyrightMode: 'manual', copyrightManualYear: profile.copyrightManualYear || '2026' }
                  }));
                  onSave(`Manual copyright year "${profile.copyrightManualYear || '2026'}" saved!`);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#f0b92e] hover:bg-[#fff1b8] text-black font-bold text-xs cursor-pointer transition-colors"
              >
                Apply Year
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Visual Identity: Logo & Profile Photo Uploads (1:1 Square Aspect Ratio) */}
      <div className="p-5 rounded-2xl bg-[#010a05] border border-[rgba(240,185,46,0.25)] space-y-4">
        <div>
          <h4 className="text-sm font-bold font-serif-heading text-[#fff1b8] flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#f0b92e]" />
            <span>Brand Logo & Portfolio Profile Photo (1:1 Square Aspect Ratio)</span>
          </h4>
          <p className="text-xs text-[#9fbfae] mt-0.5">
            Upload custom 1:1 square assets for your header/footer logo and hero/about profile photos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Logo Uploader */}
          <div className="p-4 rounded-xl bg-[#010703] border border-white/10 flex flex-col gap-3">
            <div className="flex items-start gap-4">
              <div
                onClick={() =>
                  setPreviewModal({
                    url: profile.logoPhoto || LOGO_DATA_URI,
                    title: 'Website Logo Emblem',
                    subtitle: 'Header, Footer, Preloader & Project Badges',
                    ratio: '1:1 Square'
                  })
                }
                className="relative group w-20 h-20 aspect-square rounded-2xl overflow-hidden bg-black border-2 border-[#f0b92e]/50 hover:border-[#3dff8f] flex items-center justify-center shrink-0 cursor-pointer shadow-lg transition-all"
                title="Click to preview logo full-size"
              >
                <img
                  src={profile.logoPhoto || LOGO_DATA_URI}
                  alt="Logo Preview"
                  className="w-full h-full object-contain p-1"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-mono gap-0.5">
                  <Eye className="w-4 h-4 text-[#3dff8f]" />
                  <span>Preview</span>
                </div>
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#f0b92e] font-bold block">
                    Website Logo (1:1 Square)
                  </label>
                  {profile.logoPhoto && profile.logoPhoto !== LOGO_DATA_URI && (
                    <span className="text-[10px] text-[#3dff8f] font-mono">Custom Active</span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="text-xs text-[#9fbfae] file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:bg-[#0a351e] file:text-[#3dff8f] file:text-xs cursor-pointer block w-full"
                />

                {logoFileName && (
                  <div className="text-[11px] font-mono text-[#f0b92e] truncate">
                    Selected: {logoFileName}
                  </div>
                )}

                <span className="text-[10px] text-[#9fbfae] block">
                  Displayed in About status, Footer branding, Available for Projects badge, and Preloader image.
                </span>

                {/* Explicit Save Logo Button */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveLogoExplicit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] shadow-md transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Logo</span>
                  </button>
                  {logoSaved && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#3dff8f] font-mono animate-in fade-in">
                      <Check className="w-3.5 h-3.5" />
                      <span>Logo Saved!</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Direct URL input & Reset button for Logo */}
            <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Or paste direct image URL (https://...)"
                  value={logoUrlInput}
                  onChange={(e) => setLogoUrlInput(e.target.value)}
                  className="min-w-0 flex-1 px-2.5 py-1.5 rounded-lg bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white placeholder:text-[#9fbfae]/50"
                />
                <button
                  type="button"
                  onClick={handleApplyLogoUrl}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#1a1200] bg-[#f0b92e] hover:bg-white transition-colors cursor-pointer shrink-0"
                >
                  Apply URL
                </button>
              </div>
              {profile.logoPhoto && profile.logoPhoto !== LOGO_DATA_URI && (
                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="self-start text-[11px] text-amber-300 hover:text-white underline cursor-pointer"
                >
                  Reset Logo to Default Monogram
                </button>
              )}
            </div>
          </div>

          {/* Profile Photo Uploader */}
          <div className="p-4 rounded-xl bg-[#010703] border border-white/10 flex flex-col gap-3">
            <div className="flex items-start gap-4">
              <div
                onClick={() =>
                  setPreviewModal({
                    url: profile.profilePhoto || LOGO_DATA_URI,
                    title: 'Hero & About Profile Photo',
                    subtitle: 'Primary 1:1 portrait appearing across Hero and About sections',
                    ratio: '1:1 Square'
                  })
                }
                className="relative group w-20 h-20 aspect-square rounded-2xl overflow-hidden bg-black border-2 border-[#3dff8f]/50 hover:border-white flex items-center justify-center shrink-0 cursor-pointer shadow-lg transition-all"
                title="Click to preview profile photo full size"
              >
                <img
                  src={profile.profilePhoto || LOGO_DATA_URI}
                  alt="Profile Preview"
                  className="w-full h-full object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-mono gap-0.5">
                  <Eye className="w-4 h-4 text-[#3dff8f]" />
                  <span>Preview</span>
                </div>
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#3dff8f] font-bold block">
                    Profile Photo (1:1 Square)
                  </label>
                  {profile.profilePhoto && profile.profilePhoto !== LOGO_DATA_URI && (
                    <span className="text-[10px] text-[#3dff8f] font-mono">Custom Active</span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="text-xs text-[#9fbfae] file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:bg-[#0a351e] file:text-[#3dff8f] file:text-xs cursor-pointer block w-full"
                />

                {photoFileName && (
                  <div className="text-[11px] font-mono text-[#3dff8f] truncate">
                    Selected: {photoFileName}
                  </div>
                )}

                <span className="text-[10px] text-[#9fbfae] block">
                  Displayed in Hero and About.
                </span>

                {/* Explicit Save Profile Photo Button */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSavePhotoExplicit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#b8ffd6] via-[#3dff8f] to-[#128a4c] hover:from-white hover:to-[#3dff8f] shadow-md transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Profile Photo</span>
                  </button>
                  {photoSaved && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#3dff8f] font-mono animate-in fade-in">
                      <Check className="w-3.5 h-3.5" />
                      <span>Photo Saved!</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Direct URL input & Reset button for Profile Photo */}
            <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Or paste direct image URL (https://...)"
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  className="min-w-0 flex-1 px-2.5 py-1.5 rounded-lg bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white placeholder:text-[#9fbfae]/50"
                />
                <button
                  type="button"
                  onClick={handleApplyPhotoUrl}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#1a1200] bg-[#3dff8f] hover:bg-white transition-colors cursor-pointer shrink-0"
                >
                  Apply URL
                </button>
              </div>
              {profile.profilePhoto && profile.profilePhoto !== LOGO_DATA_URI && (
                <button
                  type="button"
                  onClick={handleResetPhoto}
                  className="self-start text-[11px] text-amber-300 hover:text-white underline cursor-pointer"
                >
                  Reset Profile Photo to Default Monogram
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Third Card: Hero Transparent Image Background */}
        <div className="p-4 rounded-xl bg-[#010703] border border-[#3dff8f]/30 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Checkerboard Preview showing transparency */}
            <div
              onClick={() =>
                profile.heroBackgroundImage
                  ? setPreviewModal({
                      url: profile.heroBackgroundImage,
                      title: 'Hero Transparent Backdrop',
                      subtitle: `Active in Hero section (${profile.heroBackgroundOpacity ?? 45}% opacity, ${profile.heroBackgroundPosition || 'right'} position)`
                    })
                  : undefined
              }
              className={`relative group w-full sm:w-44 h-32 rounded-2xl overflow-hidden bg-[radial-gradient(#1f402b_1px,transparent_1px)] bg-[size:10px_10px] bg-[#010904] border-2 border-[#3dff8f]/40 hover:border-[#3dff8f] flex items-center justify-center shrink-0 shadow-lg transition-all ${
                profile.heroBackgroundImage ? 'cursor-pointer' : ''
              }`}
              title={profile.heroBackgroundImage ? "Click to preview hero background full size" : "Upload an image to preview"}
            >
              {profile.heroBackgroundImage ? (
                <>
                  <img
                    src={profile.heroBackgroundImage}
                    alt="Hero Background Preview"
                    className="max-w-full max-h-full object-contain"
                    style={{ opacity: (profile.heroBackgroundOpacity ?? 45) / 100 }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-mono gap-1">
                    <Eye className="w-4 h-4 text-[#3dff8f]" />
                    <span>Preview Full Size</span>
                  </div>
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#02180d]/90 text-[#3dff8f] border border-[#3dff8f]/40">
                    {profile.heroBackgroundOpacity ?? 45}%
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center text-center p-3 text-[#9fbfae]/60">
                  <ImageIcon className="w-6 h-6 mb-1 text-[#f0b92e]/50" />
                  <span className="text-[10px] font-mono leading-tight">No hero background set</span>
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-mono text-[#3dff8f] font-bold block">
                    Hero Transparent Image / Background
                  </label>
                  <p className="text-[11px] text-[#9fbfae]">
                    Upload a transparent PNG, WebP, or SVG to appear behind your Hero section text and showcase.
                  </p>
                </div>
                {profile.heroBackgroundImage && (
                  <span className="text-[10px] text-[#3dff8f] font-mono shrink-0 ml-2">Active in Hero</span>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleHeroBgUpload}
                className="text-xs text-[#9fbfae] file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:bg-[#0a351e] file:text-[#3dff8f] file:text-xs cursor-pointer block w-full"
              />

              {heroBgFileName && (
                <div className="text-[11px] font-mono text-[#3dff8f] truncate">
                  Selected: {heroBgFileName}
                </div>
              )}

              {/* Explicit Save Hero Background Button */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveHeroBgExplicit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#b8ffd6] via-[#3dff8f] to-[#128a4c] hover:from-white hover:to-[#3dff8f] shadow-md transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Hero Background</span>
                </button>
                {heroBgSaved && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#3dff8f] font-mono animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    <span>Hero Background Saved & Live!</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls: Opacity & Position & Transparent Showcase Toggle */}
          <div className="pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Opacity Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-mono text-[#9fbfae]">Opacity Level</label>
                <span className="text-[10px] font-mono text-[#3dff8f] font-bold">{profile.heroBackgroundOpacity ?? 45}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={profile.heroBackgroundOpacity ?? 45}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setProfile((prev) => ({ ...prev, heroBackgroundOpacity: val }));
                  portfolioStorage.setHeroBackground(
                    profile.heroBackgroundImage || '',
                    val,
                    profile.heroBackgroundPosition,
                    profile.heroShowcaseTransparent
                  );
                }}
                className="w-full accent-[#3dff8f] cursor-pointer"
              />
            </div>

            {/* Position Selector */}
            <div>
              <label className="text-[11px] font-mono text-[#9fbfae] block mb-1">Backdrop Position</label>
              <select
                value={profile.heroBackgroundPosition || 'right'}
                onChange={(e) => {
                  const pos = e.target.value as any;
                  setProfile((prev) => ({ ...prev, heroBackgroundPosition: pos }));
                  portfolioStorage.setHeroBackground(
                    profile.heroBackgroundImage || '',
                    profile.heroBackgroundOpacity,
                    pos,
                    profile.heroShowcaseTransparent
                  );
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white"
              >
                <option value="right">Right Side (Behind Portrait / Rings)</option>
                <option value="center">Center of Hero</option>
                <option value="left">Left Side (Behind Headline Text)</option>
                <option value="cover">Full Section Cover</option>
              </select>
            </div>

            {/* Transparent Showcase Toggle */}
            <div className="flex flex-col justify-end">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-[#9fbfae] hover:text-white pt-2 sm:pt-0">
                <input
                  type="checkbox"
                  checked={profile.heroShowcaseTransparent || false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setProfile((prev) => ({ ...prev, heroShowcaseTransparent: checked }));
                    portfolioStorage.setHeroBackground(
                      profile.heroBackgroundImage || '',
                      profile.heroBackgroundOpacity,
                      profile.heroBackgroundPosition,
                      checked
                    );
                  }}
                  className="rounded accent-[#3dff8f] w-4 h-4 cursor-pointer"
                />
                <span className="text-[11px] font-mono text-[#fff1b8]">Transparent Portrait Cutout</span>
              </label>
              <span className="text-[10px] text-[#9fbfae] mt-0.5">Removes dark frame in right showcase</span>
            </div>
          </div>

          {/* Direct URL input & Reset button for Hero Background */}
          <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="Or paste direct transparent image URL (https://...)"
              value={heroBgUrlInput}
              onChange={(e) => setHeroBgUrlInput(e.target.value)}
              className="min-w-0 flex-1 px-2.5 py-1.5 rounded-lg bg-[#010904] border border-[rgba(240,185,46,0.2)] text-xs text-white placeholder:text-[#9fbfae]/50"
            />
            <button
              type="button"
              onClick={handleApplyHeroBgUrl}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#1a1200] bg-[#3dff8f] hover:bg-white transition-colors cursor-pointer shrink-0"
            >
              Apply URL
            </button>
            {profile.heroBackgroundImage && (
              <button
                type="button"
                onClick={handleResetHeroBg}
                className="px-3 py-1.5 rounded-lg text-xs text-amber-300 hover:text-white hover:bg-white/5 border border-amber-300/30 transition-colors cursor-pointer shrink-0"
              >
                Remove Hero Background
              </button>
            )}
          </div>
        </div>

        {/* Live Synchronized Website Hero & Header Preview Showcase */}
        <div className="p-4 sm:p-6 rounded-2xl bg-[#010904] border-2 border-[#3dff8f]/50 card-neon-shallow shadow-[0_0_30px_rgba(61,255,143,0.2)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#3dff8f] animate-pulse" />
              <div>
                <h4 className="text-sm sm:text-base font-bold font-serif-heading text-[#fff1b8] flex items-center gap-2">
                  <span>Live Website Hero & Header Showcase Preview</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3dff8f]/10 text-[#3dff8f] border border-[#3dff8f]/40 font-bold">
                    Real-Time Sync
                  </span>
                </h4>
                <p className="text-xs text-[#9fbfae] mt-0.5">
                  When you upload your <strong>Logo</strong>, <strong>Profile Photo</strong>, and <strong>Hero Photo</strong>, they instantly appear below in live website context.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setPreviewModal({
                    url: profile.heroBackgroundImage || profile.profilePhoto || profile.logoPhoto || LOGO_DATA_URI,
                    title: 'Hero & Visual Identity Assets Preview',
                    subtitle: 'Full-resolution inspection of active visual identity and backdrop',
                    ratio: profile.heroBackgroundImage ? undefined : '1:1 Square'
                  })
                }
                className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-[#3dff8f] bg-[#0a351e] border border-[#3dff8f]/50 hover:bg-[#3dff8f]/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Eye className="w-4 h-4 text-[#3dff8f]" />
                <span>Enlarge Full Resolution</span>
              </button>
            </div>
          </div>

          {/* Interactive Simulated Viewport Frame */}
          <div className="rounded-2xl overflow-hidden border border-[#3dff8f]/30 bg-[#000803] relative shadow-2xl">
            {/* Simulated Header Bar with Uploaded Logo */}
            <div className="px-3.5 py-2.5 bg-[#052e1b]/95 border-b border-[#3dff8f]/25 flex items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-2.5">
                <div
                  onClick={() =>
                    setPreviewModal({
                      url: profile.logoPhoto || LOGO_DATA_URI,
                      title: 'Website Logo Emblem',
                      subtitle: 'Active Header Emblem & Brand Signature',
                      ratio: '1:1 Square'
                    })
                  }
                  className="w-8 h-8 rounded-xl overflow-hidden bg-[#010a05] border border-[#f0b92e]/70 hover:border-[#3dff8f] p-0.5 flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(240,185,46,0.3)] transition-all group shrink-0"
                  title="Click to preview logo full size"
                >
                  <img
                    src={profile.logoPhoto || LOGO_DATA_URI}
                    alt="Logo"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif-heading font-extrabold text-xs sm:text-sm text-[#fff1b8] tracking-wide">
                    Boniphace
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-[#3dff8f] bg-[#011409] border border-[#3dff8f]/50 shadow-[0_0_8px_rgba(61,255,143,0.3)]">
                    HD
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#9fbfae] hidden sm:inline">
                  Header Navigation Live Preview
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewModal({
                      url: profile.logoPhoto || LOGO_DATA_URI,
                      title: 'Website Logo Emblem',
                      subtitle: 'Header Emblem Preview',
                      ratio: '1:1 Square'
                    })
                  }
                  className="px-2 py-1 rounded-lg text-[10px] font-mono text-[#3dff8f] bg-[#02180d] border border-[#3dff8f]/30 hover:border-[#3dff8f] flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>Inspect Logo</span>
                </button>
              </div>
            </div>

            {/* Simulated Hero Section with Dynamic Background + Content + Portrait */}
            <div className="relative min-h-[240px] sm:min-h-[290px] p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden bg-[#021309]">
              {/* Dynamic Uploaded Hero Photo / Background */}
              {profile.heroBackgroundImage ? (
                <div
                  className={`absolute pointer-events-none transition-all duration-300 z-0 ${
                    profile.heroBackgroundPosition === 'cover'
                      ? 'inset-0'
                      : profile.heroBackgroundPosition === 'left'
                      ? 'left-0 top-0 bottom-0 w-3/4'
                      : profile.heroBackgroundPosition === 'center'
                      ? 'inset-0 flex items-center justify-center'
                      : 'right-0 top-0 bottom-0 w-1/2'
                  }`}
                  style={{ opacity: (profile.heroBackgroundOpacity ?? 45) / 100 }}
                >
                  <img
                    src={profile.heroBackgroundImage}
                    alt="Hero Background Preview"
                    className="w-full h-full object-contain object-right"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center text-xs font-mono text-[#9fbfae]">
                  (Upload a Hero Photo above to see it appear right here)
                </div>
              )}

              {/* Left Column: Headline and Availability */}
              <div className="relative z-10 space-y-2 text-center sm:text-left max-w-sm">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0a351e] border border-[#3dff8f]/40 text-[10px] font-mono text-[#3dff8f] shadow-[0_0_10px_rgba(61,255,143,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3dff8f] animate-ping" />
                  <span>{profile.availability || 'Available Online'}</span>
                </div>
                <h5 className="font-serif-heading font-extrabold text-base sm:text-xl text-[#fff1b8] leading-tight">
                  {profile.name}
                </h5>
                <p className="text-xs text-[#3dff8f] font-mono line-clamp-1">
                  {profile.titles?.[0] || 'Graphic Designer · Digital Architect'}
                </p>
                <p className="text-[11px] text-[#9fbfae] line-clamp-2 leading-relaxed">
                  {profile.headline || profile.intro}
                </p>
              </div>

              {/* Right Column: Uploaded Profile Photo Portrait Showcase */}
              <div className="relative z-10 shrink-0 flex items-center justify-center">
                <div
                  onClick={() =>
                    setPreviewModal({
                      url: profile.profilePhoto || LOGO_DATA_URI,
                      title: 'Hero & About Profile Photo',
                      subtitle: 'Primary 1:1 Square Portrait appearing across Hero and About sections',
                      ratio: '1:1 Square'
                    })
                  }
                  className={`relative group cursor-pointer transition-all duration-300 ${
                    profile.heroShowcaseTransparent
                      ? 'w-28 h-28 sm:w-36 sm:h-36'
                      : 'w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-2 border-[#3dff8f] card-neon-shallow shadow-[0_0_25px_rgba(61,255,143,0.4)] overflow-hidden bg-[#010904]'
                  }`}
                  title="Click to preview profile photo full size"
                >
                  <img
                    src={profile.profilePhoto || LOGO_DATA_URI}
                    alt="Profile Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-mono gap-1">
                    <Eye className="w-4 h-4 text-[#3dff8f]" />
                    <span>Inspect Photo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro Indicator bar below preview */}
            <div className="px-3.5 py-1.5 bg-[#010c06] border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#9fbfae]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[#3dff8f]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3dff8f]" />
                  Logo: {profile.logoPhoto ? 'Custom Uploaded' : 'Default Monogram'}
                </span>
                <span className="flex items-center gap-1 text-[#3dff8f]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3dff8f]" />
                  Photo: {profile.profilePhoto ? 'Active' : 'Default'}
                </span>
                <span className="flex items-center gap-1 text-[#3dff8f]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3dff8f]" />
                  Hero Photo: {profile.heroBackgroundImage ? `${profile.heroBackgroundOpacity ?? 45}% Opacity` : 'None'}
                </span>
              </div>
              <span className="text-[#f0b92e] hidden md:inline">
                Click any preview element to inspect full-size
              </span>
            </div>
          </div>
        </div>

        {/* Master Action: Save All Uploaded Photos Bar */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#03170d] via-[#02140b] to-[#010904] border border-[#3dff8f]/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div>
            <div className="text-xs font-bold text-[#fff1b8] flex items-center gap-2">
              <Check className="w-4 h-4 text-[#3dff8f]" />
              <span>Ready to save your uploaded assets?</span>
            </div>
            <p className="text-[11px] text-[#9fbfae] mt-0.5">
              Click to explicitly save and permanently commit all uploaded logo, profile photo & hero background to storage.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveAllPhotos}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] shadow-[0_0_20px_rgba(240,185,46,0.3)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4 text-[#1a1200]" />
            <span>Save All Uploaded Assets</span>
          </button>
        </div>
      </div>

      {/* Full-Screen Image Preview Modal */}
      <AdminImagePreviewModal
        image={previewModal}
        onClose={() => setPreviewModal(null)}
      />
    </form>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-module: Services Tab                                                   */
/* -------------------------------------------------------------------------- */
const ServicesTab: React.FC<{
  data: PortfolioDatabase;
  onSave: (msg: string) => void;
  onRefresh: () => void;
}> = ({ data, onSave, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ServiceItem>>({});
  const [previewService, setPreviewService] = useState<ServiceItem | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const handleTogglePublish = (id: string) => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      services: prev.services.map((s) => (s.id === id ? { ...s, published: !s.published } : s))
    }));
    onSave('Service updated');
    onRefresh();
  };

  const handleDelete = (id: string) => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== id)
    }));
    if (previewService?.id === id) setPreviewService(null);
    onSave('Service deleted successfully');
    onRefresh();
  };

  const handleStartEdit = (service: ServiceItem) => {
    setEditingId(service.id);
    setEditForm({ ...service });
  };

  const handleSaveEdit = () => {
    if (!editForm.title?.trim()) return;

    portfolioStorage.updateData((prev) => ({
      ...prev,
      services: prev.services.map((s) => (s.id === editingId ? ({ ...s, ...editForm } as ServiceItem) : s))
    }));

    setEditingId(null);
    onSave('Service updated successfully');
    onRefresh();
  };

  const handleCreateNew = () => {
    const newService: ServiceItem = {
      id: 'srv-' + Date.now(),
      title: 'New Creative Service',
      description: 'Describe what you deliver for clients...',
      category: 'Graphic Design',
      availability: 'Available',
      published: true,
      order: data.services.length + 1
    };

    portfolioStorage.updateData((prev) => ({
      ...prev,
      services: [newService, ...prev.services]
    }));

    setEditingId(newService.id);
    setEditForm(newService);
    onSave('New service added');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(240,185,46,0.2)]">
        <div>
          <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
            Services Management ({data.services.length})
          </h3>
          <p className="text-xs text-[#9fbfae]">
            Add, edit, reorder, publish, or delete your client services.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#1a1200]" />
          <span>Add Service</span>
        </button>
      </div>

      {editingId && (
        <div className="p-5 rounded-2xl bg-[#010e06] border border-[#3dff8f] space-y-4">
          <div className="flex justify-between items-center text-xs font-mono text-[#3dff8f]">
            <span>Editing Service Details</span>
            <button onClick={() => setEditingId(null)} className="text-white hover:text-rose-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Title</label>
              <input
                type="text"
                value={editForm.title || ''}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Category</label>
              <input
                type="text"
                value={editForm.category || ''}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#9fbfae] block mb-1">Description</label>
            <textarea
              rows={3}
              value={editForm.description || ''}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Optional Price Guide</label>
              <input
                type="text"
                placeholder="e.g. Starting from $150"
                value={editForm.price || ''}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Optional Delivery Time</label>
              <input
                type="text"
                placeholder="e.g. 3-5 Business Days"
                value={editForm.deliveryEstimate || ''}
                onChange={(e) => setEditForm({ ...editForm, deliveryEstimate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Availability</label>
              <select
                value={editForm.availability || 'Available'}
                onChange={(e) => setEditForm({ ...editForm, availability: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              >
                <option value="Available">Available</option>
                <option value="Limited Slots">Limited Slots</option>
                <option value="Booked">Booked</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setEditingId(null)}
              className="px-4 py-1.5 rounded-lg text-xs font-mono border border-white/20"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#3dff8f] text-black"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {data.services.map((service) => (
          <div
            key={service.id}
            className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.18)] hover:border-[#3dff8f]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-[#fff1b8]">{service.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0a351e] text-[#3dff8f]">
                  {service.category}
                </span>
                {!service.published ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300">
                    Draft
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3dff8f]/10 text-[#3dff8f]">
                    Live
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9fbfae] mt-1.5 line-clamp-2">{service.description}</p>
              {(service.price || service.deliveryEstimate) && (
                <div className="text-[11px] font-mono text-[#f0b92e] mt-1.5 flex gap-3">
                  {service.price && <span>{service.price}</span>}
                  {service.deliveryEstimate && <span>· {service.deliveryEstimate}</span>}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
              <button
                onClick={() => setPreviewService(service)}
                className="px-2.5 py-1.5 rounded-xl text-xs text-[#3dff8f] bg-[#3dff8f]/10 hover:bg-[#3dff8f]/20 border border-[#3dff8f]/30 transition-all cursor-pointer flex items-center gap-1.5"
                title="View Service Details & Preview"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">View</span>
              </button>
              <button
                onClick={() => handleStartEdit(service)}
                className="px-2.5 py-1.5 rounded-xl text-xs text-[#9fbfae] bg-white/5 hover:text-[#f0b92e] hover:border-[#f0b92e]/40 border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                title="Edit Service Details"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">Edit</span>
              </button>
              <button
                onClick={() => setDeleteTarget({ id: service.id, title: service.title })}
                className="px-2.5 py-1.5 rounded-xl text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                title="Delete Service"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Service Preview Modal */}
      {previewService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#010e06] border border-[#3dff8f] p-6 space-y-4 text-[#f4fff8] relative shadow-2xl">
            <button
              onClick={() => setPreviewService(null)}
              className="absolute top-5 right-5 text-[#9fbfae] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30">
                {previewService.category}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#fff1b8]">
                {previewService.availability || 'Available'}
              </span>
            </div>

            <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
              {previewService.title}
            </h3>

            <p className="text-xs sm:text-sm text-[#9fbfae] leading-relaxed p-4 rounded-xl bg-[#010904] border border-white/10">
              {previewService.description}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#02140b] border border-[rgba(240,185,46,0.2)]">
                <span className="text-[#9fbfae] block text-[10px]">Pricing Guide:</span>
                <span className="text-[#f0b92e] font-bold">{previewService.price || 'Custom Quote'}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#02140b] border border-[rgba(240,185,46,0.2)]">
                <span className="text-[#9fbfae] block text-[10px]">Delivery Estimate:</span>
                <span className="text-[#3dff8f] font-bold">{previewService.deliveryEstimate || 'Based on scope'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  handleTogglePublish(previewService.id);
                  setPreviewService({ ...previewService, published: !previewService.published });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer ${
                  previewService.published ? 'bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {previewService.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{previewService.published ? 'Status: Live (Click to Draft)' : 'Status: Draft (Click to Publish)'}</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = previewService;
                    setPreviewService(null);
                    setDeleteTarget({ id: toDelete.id, title: toDelete.title });
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => {
                    const toEdit = previewService;
                    setPreviewService(null);
                    handleStartEdit(toEdit);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#f0b92e] text-black cursor-pointer"
                >
                  Edit This Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#02100a] border border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.35)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#fff1b8]">Delete Service?</h4>
              <p className="text-xs text-[#9fbfae] mt-1 leading-relaxed">
                Are you sure you want to delete <span className="text-rose-300 font-bold">"{deleteTarget.title}"</span>?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-white/20 text-xs text-[#9fbfae] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-all cursor-pointer shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-module: Skills Tab                                                     */
/* -------------------------------------------------------------------------- */
const SkillsTab: React.FC<{
  data: PortfolioDatabase;
  onSave: (msg: string) => void;
  onRefresh: () => void;
}> = ({ data, onSave, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SkillItem>>({});
  const [previewSkill, setPreviewSkill] = useState<SkillItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleTogglePublish = (id: string) => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => (s.id === id ? { ...s, published: !s.published } : s))
    }));
    onSave('Skill status updated');
    onRefresh();
  };

  const handleCreateNew = () => {
    const newSkill: SkillItem = {
      id: 'sk-' + Date.now(),
      name: 'New Creative Skill',
      category: 'Graphic Design',
      shortDescription: '',
      tools: ['Photoshop', 'Illustrator'],
      proficiency: 85,
      published: true,
      order: data.skills.length + 1
    };

    portfolioStorage.updateData((prev) => ({
      ...prev,
      skills: [newSkill, ...prev.skills]
    }));

    setEditingId(newSkill.id);
    setEditForm(newSkill);
    onSave('New skill added');
    onRefresh();
  };

  const handleSaveEdit = () => {
    if (!editForm.name?.trim()) return;

    portfolioStorage.updateData((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => (s.id === editingId ? ({ ...s, ...editForm } as SkillItem) : s))
    }));

    setEditingId(null);
    onSave('Skill updated successfully');
    onRefresh();
  };

  const handleDelete = (id: string) => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.id !== id)
    }));
    if (previewSkill?.id === id) setPreviewSkill(null);
    onSave('Skill deleted successfully');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(240,185,46,0.2)]">
        <div>
          <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
            Skills & Tools Management ({data.skills.length})
          </h3>
          <p className="text-xs text-[#9fbfae]">
            Add, update, or remove skills with self-selected proficiencies and tools.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#1a1200]" />
          <span>Add Skill</span>
        </button>
      </div>

      {editingId && (
        <div className="p-5 rounded-2xl bg-[#010e06] border border-[#3dff8f] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Skill Name</label>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Category</label>
              <input
                type="text"
                value={editForm.category || ''}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#9fbfae] block mb-1">Short Description</label>
            <input
              type="text"
              value={editForm.shortDescription || ''}
              onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-xs text-[#9fbfae] block mb-1">Software / Tools (comma separated)</label>
            <input
              type="text"
              value={(editForm.tools || []).join(', ')}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  tools: e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-[#9fbfae]">Self-Assessed Proficiency: {editForm.proficiency || 0}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={editForm.proficiency || 0}
              onChange={(e) => setEditForm({ ...editForm, proficiency: Number(e.target.value) })}
              className="w-full accent-[#3dff8f]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditingId(null)} className="px-4 py-1.5 rounded-lg text-xs border border-white/20">
              Cancel
            </button>
            <button onClick={handleSaveEdit} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#3dff8f] text-black">
              Save Skill
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.skills.map((skill) => (
          <div
            key={skill.id}
            className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.18)] hover:border-[#3dff8f]/40 flex items-center justify-between gap-3 transition-all"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#fff1b8] truncate">{skill.name}</span>
                {!skill.published && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300">
                    Draft
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#3dff8f] font-mono mt-0.5">
                {skill.category} · {skill.proficiency}%
              </div>
              {skill.tools && (
                <div className="text-[10px] text-[#9fbfae] mt-1 line-clamp-1">{skill.tools.join(', ')}</div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setPreviewSkill(skill)}
                className="p-2 rounded-xl text-xs text-[#3dff8f] bg-[#3dff8f]/10 hover:bg-[#3dff8f]/20 border border-[#3dff8f]/30 transition-all cursor-pointer flex items-center gap-1"
                title="View Skill Details & Preview"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px] hidden sm:inline">View</span>
              </button>
              <button
                onClick={() => {
                  setEditingId(skill.id);
                  setEditForm(skill);
                }}
                className="p-2 rounded-xl text-xs text-[#9fbfae] bg-white/5 hover:text-[#f0b92e] hover:border-[#f0b92e]/40 border border-white/10 transition-all cursor-pointer flex items-center gap-1"
                title="Edit Skill Details"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px] hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => setDeleteTarget({ id: skill.id, name: skill.name })}
                className="p-2 rounded-xl text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
                title="Delete Skill"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px] hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Skill Preview Modal */}
      {previewSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#010e06] border border-[#3dff8f] p-6 space-y-4 text-[#f4fff8] relative shadow-2xl">
            <button
              onClick={() => setPreviewSkill(null)}
              className="absolute top-5 right-5 text-[#9fbfae] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30">
                {previewSkill.category}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f0b92e]/10 text-[#fff1b8]">
                Proficiency: {previewSkill.proficiency}%
              </span>
            </div>

            <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
              {previewSkill.name}
            </h3>

            {/* Proficiency Meter */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-[#9fbfae]">
                <span>Competency Level</span>
                <span className="text-[#3dff8f] font-bold">{previewSkill.proficiency}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#02180c] overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#0f7a43] to-[#3dff8f] rounded-full"
                  style={{ width: `${previewSkill.proficiency || 50}%` }}
                />
              </div>
            </div>

            {previewSkill.tools && previewSkill.tools.length > 0 && (
              <div>
                <span className="text-[10px] font-mono text-[#f0b92e] uppercase block mb-1.5">
                  Software & Tools Stack:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {previewSkill.tools.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-lg bg-[#010904] border border-white/10 text-xs text-[#f4fff8]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {previewSkill.shortDescription && (
              <p className="text-xs text-[#9fbfae] leading-relaxed p-3.5 rounded-xl bg-[#010904] border border-white/10">
                {previewSkill.shortDescription}
              </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  handleTogglePublish(previewSkill.id);
                  setPreviewSkill({ ...previewSkill, published: !previewSkill.published });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer ${
                  previewSkill.published ? 'bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {previewSkill.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{previewSkill.published ? 'Live on Site' : 'Draft / Hidden'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = previewSkill;
                    setPreviewSkill(null);
                    setDeleteTarget({ id: toDelete.id, name: toDelete.name });
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => {
                    const toEdit = previewSkill;
                    setPreviewSkill(null);
                    setEditingId(toEdit.id);
                    setEditForm(toEdit);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#f0b92e] text-black cursor-pointer"
                >
                  Edit Skill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#02100a] border border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.35)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#fff1b8]">Delete Skill?</h4>
              <p className="text-xs text-[#9fbfae] mt-1 leading-relaxed">
                Are you sure you want to delete <span className="text-rose-300 font-bold">"{deleteTarget.name}"</span>?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-white/20 text-xs text-[#9fbfae] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-all cursor-pointer shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-module: Projects Tab (Full Image Upload & Media Management)             */
/* -------------------------------------------------------------------------- */
const ProjectsTab: React.FC<{
  data: PortfolioDatabase;
  onSave: (msg: string) => void;
  onRefresh: () => void;
}> = ({ data, onSave, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<Partial<ProjectItem>>({});
  const [previewProject, setPreviewProject] = useState<ProjectItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [previewModal, setPreviewModal] = useState<ImagePreviewData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateNew = () => {
    const newProject: ProjectItem = {
      id: 'prj-' + Date.now(),
      slug: 'new-creative-project-' + Date.now(),
      title: 'New Creative Project',
      summary: 'Short summary of the project and key deliverable...',
      fullDescription: 'Detailed background, objectives, and creative solution...',
      category: data.categories[0] || 'Graphic Design',
      thumbnail: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
      gallery: [],
      attachments: [],
      clientName: '',
      completionDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      status: 'completed',
      projectType: 'personal',
      role: 'Lead Designer',
      tools: ['Adobe Illustrator', 'Photoshop'],
      aiUsed: ['Gemini'],
      mainChallenge: 'Describe the main design or technical challenge...',
      solution: 'How you solved it...',
      outcome: 'What was achieved or learned...',
      featured: false,
      published: true,
      order: data.projects.length + 1
    };

    portfolioStorage.updateData((prev) => ({
      ...prev,
      projects: [newProject, ...prev.projects]
    }));

    setEditingId(newProject.id);
    setProjectForm(newProject);
    onSave('New project draft created');
    onRefresh();
  };

  const handleSaveProject = () => {
    if (!projectForm.title?.trim()) return;

    portfolioStorage.updateData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === editingId ? ({ ...p, ...projectForm } as ProjectItem) : p))
    }));

    setEditingId(null);
    onSave('Project saved successfully');
    onRefresh();
  };

  const handleDeleteProject = (id: string) => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id)
    }));
    if (previewProject?.id === id) setPreviewProject(null);
    onSave('Project deleted successfully');
    onRefresh();
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 0ms instant preview
    const instantUrl = URL.createObjectURL(file);
    setProjectForm((prev) => ({ ...prev, thumbnail: instantUrl }));

    try {
      const processed = await processProjectImageFile(file, 1200, 0.88);
      let finalUrl = processed.dataUrl;
      try {
        const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg';
        const path = `portfolio/projects/thumb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        finalUrl = await uploadFileToStorage(file, path, file.type || 'image/jpeg');
      } catch (storageErr) {
        console.warn('Storage upload note, using optimized image asset:', storageErr);
      }

      setProjectForm((prev) => ({
        ...prev,
        thumbnail: finalUrl,
        aspectRatio: processed.detectedRatio
      }));
      onSave(`Cover uploaded! Auto-detected ratio: ${processed.label} (${processed.detectedRatio})`);
    } catch (err: any) {
      alert(err.message || 'Error processing image');
    }
  };

  const handleAutoDetectCurrentRatio = async () => {
    if (!projectForm.thumbnail) return;
    try {
      const detected = await detectImageDimensionsAndRatio(projectForm.thumbnail);
      setProjectForm((prev) => ({ ...prev, aspectRatio: detected.ratioId }));
      onSave(`Auto-adjusted ratio to ${detected.label} (${detected.ratioId})`);
    } catch {
      onSave('Could not auto-detect ratio');
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newGallery = [...(projectForm.gallery || [])];
    let detectedFirstRatio: StandardRatioId | null = null;

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const processed = await processProjectImageFile(file, 1200, 0.88);
        let finalUrl = processed.dataUrl;
        try {
          const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg';
          const path = `portfolio/projects/gallery_${Date.now()}_${i}.${ext}`;
          finalUrl = await uploadFileToStorage(file, path, file.type || 'image/jpeg');
        } catch (storageErr) {
          console.warn('Storage upload note for gallery item:', storageErr);
        }

        newGallery.push(finalUrl);
        if (!detectedFirstRatio && !projectForm.aspectRatio) {
          detectedFirstRatio = processed.detectedRatio;
        }
      } catch (err) {
        console.error('Failed to process gallery file', err);
      }
    }

    setProjectForm((prev) => ({
      ...prev,
      gallery: newGallery,
      aspectRatio: prev.aspectRatio || detectedFirstRatio || '1:1'
    }));
    onSave(`${files.length} image(s) added to gallery`);
  };

  const removeGalleryImage = (idx: number) => {
    setProjectForm((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).filter((_, i) => i !== idx)
    }));
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingAttachment(true);
    const newAttachments = [...(projectForm.attachments || [])];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const sizeText = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;
      let finalUrl = '';
      try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `portfolio/projects/attachments/${Date.now()}_${cleanName}`;
        finalUrl = await uploadFileToStorage(file, path, file.type || 'application/octet-stream');
      } catch (storageErr) {
        console.warn('Storage upload note for project attachment:', storageErr);
      }
      if (!finalUrl) {
        finalUrl = URL.createObjectURL(file);
        try {
          await saveMediaToIndexedDB(`att_${Date.now()}_${file.name}`, file);
        } catch {}
      }

      newAttachments.push({
        id: 'att-' + Date.now() + '-' + i,
        name: file.name,
        url: finalUrl,
        size: file.size,
        sizeFormatted: sizeText,
        type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        uploadedAt: new Date().toISOString()
      });
    }

    setProjectForm((prev) => ({ ...prev, attachments: newAttachments }));
    setUploadingAttachment(false);
    onSave(`${files.length} attachment file(s) uploaded successfully!`);
  };

  const removeAttachment = (id: string) => {
    setProjectForm((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a) => a.id !== id)
    }));
    onSave('Attachment removed');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(240,185,46,0.2)]">
        <div>
          <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
            Projects Showcase Management ({data.projects.length})
          </h3>
          <p className="text-xs text-[#9fbfae]">
            Create, edit, upload local images with automatic aspect ratio detection (Square, Landscape, Portrait), and publish portfolio case studies.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#1a1200]" />
          <span>Add Project</span>
        </button>
      </div>

      {editingId && (
        <div className="p-6 rounded-2xl bg-[#010e06] border border-[#3dff8f] space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <span className="text-sm font-bold text-[#3dff8f] font-serif-heading">
              Editing: {projectForm.title}
            </span>
            <button onClick={() => setEditingId(null)} className="text-[#9fbfae] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Project Title *</label>
              <input
                type="text"
                value={projectForm.title || ''}
                onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Category</label>
              <select
                value={projectForm.category || ''}
                onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              >
                {data.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#9fbfae] block mb-1">Short Summary</label>
            <input
              type="text"
              value={projectForm.summary || ''}
              onChange={(e) => setProjectForm({ ...projectForm, summary: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-xs text-[#9fbfae] block mb-1">Full Description & Story</label>
            <textarea
              rows={4}
              value={projectForm.fullDescription || ''}
              onChange={(e) => setProjectForm({ ...projectForm, fullDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
            />
          </div>

          {/* Image Upload Area with Automatic Aspect Ratio Adjustment */}
          <div className="p-4 rounded-xl bg-[#010804] border border-white/10 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <label className="text-xs font-mono font-bold text-[#f0b92e] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Project Cover / Thumbnail (Auto Aspect Ratio)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3dff8f]/10 text-[#3dff8f] border border-[#3dff8f]/30">
                    Active Ratio: {projectForm.aspectRatio || '1:1'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoDetectCurrentRatio}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[#fff1b8] border border-white/10 cursor-pointer"
                    title="Re-run ratio detection on current image"
                  >
                    Auto-Detect
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Dynamically framed preview container matching the detected or selected ratio */}
                <div
                  onClick={() =>
                    projectForm.thumbnail &&
                    setPreviewModal({
                      url: projectForm.thumbnail,
                      title: projectForm.title || 'Project Thumbnail',
                      subtitle: `Detected Standard Ratio: ${projectForm.aspectRatio || '1:1'}`,
                      ratio: projectForm.aspectRatio || '1:1'
                    })
                  }
                  className="w-28 sm:w-36 rounded-xl overflow-hidden border border-[#f0b92e]/40 hover:border-[#3dff8f] bg-black shrink-0 relative flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer group"
                  style={{ aspectRatio: getCssAspectRatio(projectForm.aspectRatio || '1:1') }}
                  title="Click to preview project image full size"
                >
                  <img
                    src={projectForm.thumbnail}
                    alt="Thumbnail Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-mono gap-0.5">
                    <Eye className="w-3.5 h-3.5 text-[#3dff8f]" />
                    <span>Preview</span>
                  </div>
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-[#3dff8f] border border-white/20">
                    {projectForm.aspectRatio || '1:1'}
                  </div>
                </div>

                <div className="space-y-3 flex-1 min-w-0">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="text-xs text-[#9fbfae] file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:bg-[#0a351e] file:text-[#3dff8f] file:text-xs cursor-pointer"
                    />
                    <p className="text-[10px] text-[#9fbfae] mt-1">
                      Upload any image (PNG, JPG, WebP). The aspect ratio is automatically detected and the frame adapts instantly!
                    </p>
                  </div>

                  {/* Standard Ratio Selector (Square, Landscape, Portrait) */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-mono text-[#9fbfae] uppercase tracking-wider block">
                      Supported Aspect Ratios (Auto-selected or click to override):
                    </span>

                    {/* 1. Square Ratios */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-[#fff1b8] w-24 shrink-0">1. Square:</span>
                      {SQUARE_RATIOS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setProjectForm({ ...projectForm, aspectRatio: r.id })}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all cursor-pointer border ${
                            (projectForm.aspectRatio || '1:1') === r.id
                              ? 'bg-[#3dff8f] text-black font-bold border-[#3dff8f] shadow-[0_0_8px_rgba(61,255,143,0.4)]'
                              : 'bg-white/5 text-[#9fbfae] border-white/10 hover:text-white hover:border-[#3dff8f]/30'
                          }`}
                          title={`${r.label} - ${r.description}`}
                        >
                          {r.id}
                        </button>
                      ))}
                    </div>

                    {/* 2. Landscape (Horizontal) Ratios */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-[#fff1b8] w-24 shrink-0">2. Landscape:</span>
                      {LANDSCAPE_RATIOS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setProjectForm({ ...projectForm, aspectRatio: r.id })}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all cursor-pointer border ${
                            projectForm.aspectRatio === r.id
                              ? 'bg-[#3dff8f] text-black font-bold border-[#3dff8f] shadow-[0_0_8px_rgba(61,255,143,0.4)]'
                              : 'bg-white/5 text-[#9fbfae] border-white/10 hover:text-white hover:border-[#3dff8f]/30'
                          }`}
                          title={`${r.label} - ${r.description}`}
                        >
                          {r.id}
                        </button>
                      ))}
                    </div>

                    {/* 3. Portrait (Vertical) Ratios */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-[#fff1b8] w-24 shrink-0">3. Portrait:</span>
                      {PORTRAIT_RATIOS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setProjectForm({ ...projectForm, aspectRatio: r.id })}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all cursor-pointer border ${
                            projectForm.aspectRatio === r.id
                              ? 'bg-[#3dff8f] text-black font-bold border-[#3dff8f] shadow-[0_0_8px_rgba(61,255,143,0.4)]'
                              : 'bg-white/5 text-[#9fbfae] border-white/10 hover:text-white hover:border-[#3dff8f]/30'
                          }`}
                          title={`${r.label} - ${r.description}`}
                        >
                          {r.id}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5">
              <label className="text-xs font-mono font-bold text-[#3dff8f] block mb-1">
                Project Gallery Images (Multiple Uploads Supported)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleGalleryUpload}
                className="text-xs text-[#9fbfae] file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:bg-[#0a351e] file:text-[#3dff8f] file:text-xs cursor-pointer mb-2"
              />
              <div className="flex flex-wrap gap-2.5">
                {(projectForm.gallery || []).map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 rounded-xl overflow-hidden border border-white/20 group shrink-0 bg-black flex items-center justify-center shadow"
                    style={{ aspectRatio: getCssAspectRatio(projectForm.aspectRatio || '1:1') }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project Deliverables & File Attachments */}
          <div className="p-4 rounded-xl bg-[#010804] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-[#3dff8f] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Project Deliverables &amp; Documents (PDF, ZIP, DOC, Assets)</span>
              </label>
              <span className="text-[10px] font-mono text-[#9fbfae]">
                {(projectForm.attachments || []).length} attached
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/40 hover:bg-[#0d4728] cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingAttachment ? 'Uploading files...' : 'Upload Attachment Files'}</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.zip,.txt,.png,.jpg,.jpeg,.svg"
                  onChange={handleAttachmentUpload}
                  disabled={uploadingAttachment}
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-[#9fbfae]">
                Accepts documents, archives, design specs, PDFs, and ZIP bundles.
              </span>
            </div>

            {projectForm.attachments && projectForm.attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/5">
                {projectForm.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-2.5 rounded-xl bg-[#02140b] border border-white/10 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0a351e] text-[#3dff8f] flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-mono text-[#fff1b8] truncate">{att.name}</div>
                        <div className="text-[10px] font-mono text-[#9fbfae]">{att.sizeFormatted || 'File'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-lg text-xs text-[#3dff8f] hover:bg-[#3dff8f]/10"
                        title="Download / Test Link"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="p-1 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="Remove Attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Project Status</label>
              <select
                value={projectForm.status || 'completed'}
                onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              >
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="prototype">Prototype</option>
                <option value="concept">Concept</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Project Type</label>
              <select
                value={projectForm.projectType || 'personal'}
                onChange={(e) => setProjectForm({ ...projectForm, projectType: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              >
                <option value="personal">Personal Project</option>
                <option value="client">Client Work</option>
                <option value="freelance">Freelance</option>
                <option value="concept">Design Concept</option>
                <option value="prototype">Prototype</option>
                <option value="experimental">Experimental</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Client Name (optional)</label>
              <input
                type="text"
                value={projectForm.clientName || ''}
                onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
                placeholder="e.g. Serengeti Horizons Safari"
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Delivered Date / Period</label>
              <input
                type="text"
                value={projectForm.completionDate || ''}
                onChange={(e) => setProjectForm({ ...projectForm, completionDate: e.target.value })}
                placeholder="e.g. Nov 2024"
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Tools (comma separated)</label>
              <input
                type="text"
                value={(projectForm.tools || []).join(', ')}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    tools: e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">AI Tools Used (comma separated)</label>
              <input
                type="text"
                value={(projectForm.aiUsed || []).join(', ')}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    aiUsed: e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">The Challenge</label>
              <textarea
                rows={2}
                value={projectForm.mainChallenge || ''}
                onChange={(e) => setProjectForm({ ...projectForm, mainChallenge: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">The Solution</label>
              <textarea
                rows={2}
                value={projectForm.solution || ''}
                onChange={(e) => setProjectForm({ ...projectForm, solution: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Outcome / Learning</label>
              <textarea
                rows={2}
                value={projectForm.outcome || ''}
                onChange={(e) => setProjectForm({ ...projectForm, outcome: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Live URL (optional)</label>
              <input
                type="url"
                value={projectForm.liveUrl || ''}
                onChange={(e) => setProjectForm({ ...projectForm, liveUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">GitHub / Source URL (optional)</label>
              <input
                type="url"
                value={projectForm.githubUrl || ''}
                onChange={(e) => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
              <input
                type="checkbox"
                checked={projectForm.featured || false}
                onChange={(e) => setProjectForm({ ...projectForm, featured: e.target.checked })}
                className="accent-[#f0b92e]"
              />
              <span>Mark as Featured Project</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
              <input
                type="checkbox"
                checked={projectForm.published || false}
                onChange={(e) => setProjectForm({ ...projectForm, published: e.target.checked })}
                className="accent-[#3dff8f]"
              />
              <span>Publish to Portfolio Website</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-lg text-xs border border-white/20">
              Cancel
            </button>
            <button
              onClick={handleSaveProject}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-[#3dff8f] text-black"
            >
              Save Project
            </button>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-3">
        {data.projects.map((project) => (
          <div
            key={project.id}
            className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.18)] hover:border-[#3dff8f]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="w-16 rounded-2xl overflow-hidden bg-black border border-white/10 shrink-0 flex items-center justify-center relative shadow"
                style={{ aspectRatio: getCssAspectRatio(project.aspectRatio || '1:1') }}
              >
                <img
                  src={project.thumbnail}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm sm:text-base text-[#fff1b8] truncate">{project.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0a351e] text-[#3dff8f]">
                    {project.category}
                  </span>
                  {project.featured && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f0b92e]/20 text-[#fff1b8]">
                      Featured
                    </span>
                  )}
                  {!project.published ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300">
                      Draft
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3dff8f]/10 text-[#3dff8f]">
                      Live
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#9fbfae] mt-1 line-clamp-1">
                  Type: {project.projectType} · Tools: {project.tools.join(', ')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
              <button
                onClick={() => setPreviewProject(project)}
                className="px-2.5 py-1.5 rounded-xl text-xs text-[#3dff8f] bg-[#3dff8f]/10 hover:bg-[#3dff8f]/20 border border-[#3dff8f]/30 transition-all cursor-pointer flex items-center gap-1.5"
                title="View Full Project Case Study & Preview"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">View</span>
              </button>
              <button
                onClick={() => {
                  setEditingId(project.id);
                  setProjectForm(project);
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs text-[#9fbfae] bg-white/5 hover:text-[#f0b92e] hover:border-[#f0b92e]/40 border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                title="Edit Project Details"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">Edit</span>
              </button>
              <button
                onClick={() => setDeleteTarget({ id: project.id, title: project.title })}
                className="px-2.5 py-1.5 rounded-xl text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                title="Delete Project"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Project Full Preview Modal */}
      {previewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-[#010e06] border border-[#3dff8f] p-6 space-y-4 text-[#f4fff8] relative shadow-2xl overflow-y-auto">
            <button
              onClick={() => setPreviewProject(null)}
              className="absolute top-5 right-5 text-[#9fbfae] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30">
                {previewProject.category}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#fff1b8]">
                {previewProject.projectType}
              </span>
              {previewProject.featured && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f0b92e]/20 text-[#fff1b8]">
                  Featured
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold font-serif-heading text-[#fff1b8]">
              {previewProject.title}
            </h3>

            {/* Dynamic Aspect Ratio Thumbnail */}
            <div
              className="w-full max-w-sm rounded-2xl overflow-hidden border border-white/10 bg-black flex items-center justify-center relative shadow-lg"
              style={{ aspectRatio: getCssAspectRatio(previewProject.aspectRatio || '1:1') }}
            >
              <img
                src={previewProject.thumbnail}
                alt={previewProject.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 border border-white/20 font-mono text-[10px] text-[#3dff8f]">
                Ratio: {previewProject.aspectRatio || '1:1'}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#9fbfae] leading-relaxed">
              {previewProject.summary}
            </p>

            {previewProject.fullDescription && (
              <div className="p-4 rounded-xl bg-[#010904] border border-white/10 text-xs text-[#f4fff8] leading-relaxed">
                <span className="text-[10px] font-mono text-[#3dff8f] uppercase block mb-1">
                  Full Story & Background:
                </span>
                {previewProject.fullDescription}
              </div>
            )}

            {/* Tools Stack */}
            <div>
              <span className="text-[10px] font-mono text-[#f0b92e] uppercase block mb-1.5">
                Tools & Technologies:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {previewProject.tools.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-lg bg-[#010904] border border-white/10 text-xs text-[#f4fff8]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  portfolioStorage.updateData((prev) => ({
                    ...prev,
                    projects: prev.projects.map((p) => (p.id === previewProject.id ? { ...p, published: !p.published } : p))
                  }));
                  setPreviewProject({ ...previewProject, published: !previewProject.published });
                  onSave('Publish status updated');
                  onRefresh();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer ${
                  previewProject.published ? 'bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {previewProject.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{previewProject.published ? 'Status: Live on Website' : 'Status: Draft / Hidden'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = previewProject;
                    setPreviewProject(null);
                    setDeleteTarget({ id: toDelete.id, title: toDelete.title });
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => {
                    const toEdit = previewProject;
                    setPreviewProject(null);
                    setEditingId(toEdit.id);
                    setProjectForm(toEdit);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#f0b92e] text-black cursor-pointer"
                >
                  Edit Case Study
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#02100a] border border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.35)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#fff1b8]">Delete Project?</h4>
              <p className="text-xs text-[#9fbfae] mt-1 leading-relaxed">
                Are you sure you want to delete <span className="text-rose-300 font-bold">"{deleteTarget.title}"</span>?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-white/20 text-xs text-[#9fbfae] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteProject(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-all cursor-pointer shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Image Preview Modal for Projects */}
      <AdminImagePreviewModal
        image={previewModal}
        onClose={() => setPreviewModal(null)}
      />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-module: Project Categories Tab                                         */
/* -------------------------------------------------------------------------- */
const CategoriesTab: React.FC<{
  data: PortfolioDatabase;
  onSave: (msg: string) => void;
  onRefresh: () => void;
}> = ({ data, onSave, onRefresh }) => {
  const [catType, setCatType] = useState<'projects' | 'books'>('projects');
  const [newCat, setNewCat] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [previewCat, setPreviewCat] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const currentCategories = catType === 'projects'
    ? data.categories
    : (data.bookCategories || []).filter((c) => c && c !== 'All' && c !== 'All Categories');

  const handleAdd = (e?: React.FormEvent, directVal?: string) => {
    if (e) e.preventDefault();
    const val = (directVal || newCat).trim();
    if (!val || currentCategories.includes(val)) return;

    if (catType === 'projects') {
      portfolioStorage.updateData((prev) => ({
        ...prev,
        categories: [...prev.categories, val]
      }));
      onSave(`Project category "${val}" added`);
    } else {
      portfolioStorage.addBookCategory(val);
      onSave(`Book category "${val}" added`);
    }

    setNewCat('');
    onRefresh();
  };

  const handleSaveRename = (oldName: string) => {
    if (!renameVal.trim() || renameVal.trim() === oldName) {
      setEditingCat(null);
      return;
    }

    if (catType === 'projects') {
      portfolioStorage.updateData((prev) => ({
        ...prev,
        categories: prev.categories.map((c) => (c === oldName ? renameVal.trim() : c)),
        projects: prev.projects.map((p) => (p.category === oldName ? { ...p, category: renameVal.trim() } : p))
      }));
      onSave(`Category renamed to "${renameVal.trim()}"`);
    } else {
      portfolioStorage.renameBookCategory(oldName, renameVal.trim(), true);
      onSave(`Book category renamed to "${renameVal.trim()}"`);
    }

    setEditingCat(null);
    onRefresh();
  };

  const handleDelete = (cat: string) => {
    if (catType === 'projects') {
      portfolioStorage.updateData((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c !== cat)
      }));
      if (previewCat === cat) setPreviewCat(null);
      onSave(`Category "${cat}" removed`);
    } else {
      portfolioStorage.deleteBookCategory(cat);
      onSave(`Book category "${cat}" removed`);
    }
    setDeleteTarget(null);
    onRefresh();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
            {catType === 'projects' ? 'Project Categories' : 'Book Categories'} Management ({currentCategories.length})
          </h3>
          <p className="text-xs text-[#9fbfae] mt-0.5">
            Manage and organize filter categories shown across your website.
          </p>
        </div>

        {/* Switcher between Project and Book Categories */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#010904] border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => {
              setCatType('projects');
              setEditingCat(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              catType === 'projects'
                ? 'bg-[#3dff8f] text-black shadow-sm'
                : 'text-[#9fbfae] hover:text-white'
            }`}
          >
            Projects ({data.categories.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setCatType('books');
              setEditingCat(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              catType === 'books'
                ? 'bg-[#3dff8f] text-black shadow-sm'
                : 'text-[#9fbfae] hover:text-white'
            }`}
          >
            Books ({(data.bookCategories || []).length})
          </button>
        </div>
      </div>

      <form onSubmit={(e) => handleAdd(e)} className="flex gap-2 p-4 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.2)]">
        <input
          type="text"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder={
            catType === 'projects'
              ? 'New Project Category (e.g. Mobile Apps, 3D Graphics)...'
              : 'New Book Category (e.g. Fiction, Academic, Design)...'
          }
          className="flex-1 px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white placeholder:text-gray-500 focus:border-[#3dff8f] focus:outline-none"
        />
        <button
          type="submit"
          className="px-5 py-2 rounded-xl text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] shrink-0 cursor-pointer"
        >
          Add Category
        </button>
      </form>

      {/* Suggested Book Categories quick buttons if in books mode */}
      {catType === 'books' && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span className="text-[11px] font-mono text-[#9fbfae]">Suggested:</span>
          {['Fiction', 'Academic', 'Design', 'Technology', 'Theology', 'Biographies'].filter((c) => !currentCategories.includes(c)).map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => handleAdd(undefined, sug)}
              className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#02180d] text-[#3dff8f] border border-[#3dff8f]/40 hover:bg-[#3dff8f]/20 cursor-pointer"
            >
              + {sug}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {currentCategories.map((cat) => {
          const itemCount = catType === 'projects'
            ? data.projects.filter((p) => p.category === cat).length
            : (data.books || []).filter((b) => b.category === cat).length;
          return (
            <div
              key={cat}
              className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.18)] hover:border-[#3dff8f]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
            >
              {editingCat === cat ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={renameVal}
                    onChange={(e) => setRenameVal(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#021008] border border-[#3dff8f] text-xs text-white"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveRename(cat)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#3dff8f] text-black"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingCat(null)}
                    className="px-3 py-1.5 rounded-lg text-xs border border-white/20 text-[#9fbfae]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex-1">
                  <span className="text-[#fff1b8] font-bold text-sm block">{cat}</span>
                  <span className="text-[11px] font-mono text-[#3dff8f] mt-0.5 block">
                    {itemCount} {catType === 'projects' ? 'project' : 'book'}{itemCount === 1 ? '' : 's'} assigned
                  </span>
                </div>
              )}

              {editingCat !== cat && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setPreviewCat(cat)}
                    className="p-2 rounded-xl text-xs text-[#3dff8f] bg-[#3dff8f]/10 hover:bg-[#3dff8f]/20 border border-[#3dff8f]/30 transition-all cursor-pointer flex items-center gap-1"
                    title="View Projects in this Category"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="font-mono text-[11px]">View</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingCat(cat);
                      setRenameVal(cat);
                    }}
                    className="p-2 rounded-xl text-xs text-[#9fbfae] bg-white/5 hover:text-[#f0b92e] hover:border-[#f0b92e]/40 border border-white/10 transition-all cursor-pointer flex items-center gap-1"
                    title="Rename Category"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span className="font-mono text-[11px]">Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    className="p-2 rounded-xl text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="font-mono text-[11px]">Delete</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Category Projects Preview Modal */}
      {previewCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#010e06] border border-[#3dff8f] p-6 space-y-4 text-[#f4fff8] relative shadow-2xl">
            <button
              onClick={() => setPreviewCat(null)}
              className="absolute top-5 right-5 text-[#9fbfae] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30">
              Category Preview
            </span>

            <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
              {previewCat}
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {data.projects.filter((p) => p.category === previewCat).length === 0 ? (
                <p className="text-xs text-[#9fbfae] italic">No projects currently tagged with this category.</p>
              ) : (
                data.projects
                  .filter((p) => p.category === previewCat)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-[#010904] border border-white/10 flex items-center gap-3 text-xs"
                    >
                      <img
                        src={p.thumbnail}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover bg-black"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-[#fff1b8] block truncate">{p.title}</span>
                        <span className="text-[10px] text-[#3dff8f] font-mono">{p.projectType}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const toDel = previewCat;
                  setPreviewCat(null);
                  setDeleteTarget(toDel);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <button
                onClick={() => setPreviewCat(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-mono border border-white/20 text-[#9fbfae]"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#02100a] border border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.35)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#fff1b8]">Delete Category?</h4>
              <p className="text-xs text-[#9fbfae] mt-1 leading-relaxed">
                Are you sure you want to delete category <span className="text-rose-300 font-bold">"{deleteTarget}"</span>? Projects in this category will remain.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-white/20 text-xs text-[#9fbfae] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDelete(deleteTarget);
                  setDeleteTarget(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-all cursor-pointer shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-module: Blog & Articles Tab                                            */
/* -------------------------------------------------------------------------- */
const BlogTab: React.FC<{
  data: PortfolioDatabase;
  onSave: (msg: string) => void;
  onRefresh: () => void;
}> = ({ data, onSave, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [blogForm, setBlogForm] = useState<Partial<BlogPostItem>>({});
  const [previewPost, setPreviewPost] = useState<BlogPostItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [tagInput, setTagInput] = useState('');
  const [takeawayInput, setTakeawayInput] = useState('');
  const [quickUploadingBlogId, setQuickUploadingBlogId] = useState<string | null>(null);

  const blogPosts = data.blogPosts || [];
  const blogCategories = data.blogCategories || [
    'AI & Creative Workflows',
    'Graphic Design',
    'Web Development',
    'Digital Content & Strategy',
    'Design Thinking & UI/UX'
  ];

  const handleCreateNew = () => {
    const defaultAuthor = {
      name: data.profile.name || 'Ev Dr. Boniphace J. Ndege',
      role: data.profile.titles?.[0] || 'Graphic Designer & Digital Creator',
      avatar: data.profile.logoPhoto || LOGO_DATA_URI
    };

    const newPost: BlogPostItem = {
      id: 'post-' + Date.now(),
      slug: 'new-article-' + Date.now(),
      title: 'New Editorial Article',
      excerpt: 'Brief overview or key takeaway of this article for readers...',
      content: `## Introduction

Write your insights and perspectives here.

> "A great quote or core principle summarizing this concept."

### Key Principles

- Point one explaining your creative or technical process.
- Point two detailing practical advice or client results.

### Summary

Wrap up with an encouraging conclusion and call to action.`,
      category: blogCategories[0] || 'AI & Creative Workflows',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85',
      aspectRatio: '16:9',
      author: defaultAuthor,
      publishedAt: new Date().toISOString(),
      publishedTimeFormatted: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      readTimeMinutes: 4,
      tags: ['Design', 'Creative Workflows', 'Insights'],
      featured: false,
      published: true,
      order: blogPosts.length + 1,
      views: 0,
      likes: 0,
      keyTakeaways: [
        'Core insight number one.',
        'Actionable tip number two.'
      ],
      seoMeta: {
        metaTitle: 'New Editorial Article | Boniphace Ndege',
        metaDescription: 'Read the latest creative and technical insights by Boniphace Ndege.',
        keywords: 'graphic design, web development, AI workflow, Boniphace Ndege'
      }
    };

    portfolioStorage.updateData((prev) => ({
      ...prev,
      blogPosts: [newPost, ...(prev.blogPosts || [])]
    }));

    setEditingId(newPost.id);
    setBlogForm(newPost);
    setTagInput(newPost.tags.join(', '));
    onSave('New article draft created! Start writing below.');
    onRefresh();
  };

  const handleSavePost = () => {
    if (!blogForm.title?.trim()) {
      alert('Article title is required.');
      return;
    }

    // Auto-calculate reading time if not explicitly provided (approx 200 words per minute)
    const wordCount = (blogForm.content || '').split(/\s+/).filter(Boolean).length;
    const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 200));

    // Process tags from tagInput if modified
    const processedTags = tagInput
      ? tagInput.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
      : blogForm.tags || [];

    portfolioStorage.updateData((prev) => ({
      ...prev,
      blogPosts: (prev.blogPosts || []).map((p) =>
        p.id === editingId
          ? ({
              ...p,
              ...blogForm,
              readTimeMinutes: blogForm.readTimeMinutes || estimatedMinutes,
              tags: processedTags
            } as BlogPostItem)
          : p
      )
    }));

    setEditingId(null);
    onSave('Article successfully saved and published to Cloud Firestore!');
    onRefresh();
  };

  const handleDeletePost = (id: string) => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      blogPosts: (prev.blogPosts || []).filter((p) => p.id !== id)
    }));
    if (previewPost?.id === id) setPreviewPost(null);
    onSave('Article deleted from database.');
    onRefresh();
  };

  const handleTogglePublished = (id: string) => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      blogPosts: (prev.blogPosts || []).map((p) =>
        p.id === id ? { ...p, published: !p.published } : p
      )
    }));
    onSave('Article publication visibility updated');
    onRefresh();
  };

  const handleToggleFeatured = (id: string) => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      blogPosts: (prev.blogPosts || []).map((p) =>
        p.id === id ? { ...p, featured: !p.featured } : p
      )
    }));
    onSave('Featured status updated');
    onRefresh();
  };

  // Cover image upload with auto-detection of aspect ratio & Firebase Storage upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const processed = await processProjectImageFile(file, 1200, 0.88);
      let finalUrl = processed.dataUrl;
      try {
        const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg';
        const path = `portfolio/blog/cover_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        finalUrl = await uploadFileToStorage(file, path, file.type || 'image/jpeg');
      } catch (storageErr) {
        console.warn('Storage upload note for blog cover, using optimized image:', storageErr);
      }

      setBlogForm((prev) => ({
        ...prev,
        coverImage: finalUrl,
        aspectRatio: processed.detectedRatio
      }));
      onSave(`Cover uploaded! Auto-detected ratio: ${processed.label} (${processed.detectedRatio})`);
    } catch (err: any) {
      alert(err.message || 'Error processing image');
    }
  };

  const handleAutoDetectCurrentRatio = async () => {
    if (!blogForm.coverImage) return;
    try {
      const detected = await detectImageDimensionsAndRatio(blogForm.coverImage);
      setBlogForm((prev) => ({ ...prev, aspectRatio: detected.ratioId }));
      onSave(`Auto-adjusted ratio to ${detected.label} (${detected.ratioId})`);
    } catch {
      onSave('Could not auto-detect ratio');
    }
  };

  const handleQuickUploadBlogCover = async (postId: string, file: File) => {
    setQuickUploadingBlogId(postId);
    try {
      const processed = await processProjectImageFile(file, 1200, 0.88);
      let finalUrl = processed.dataUrl;
      try {
        const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg';
        const path = `portfolio/blog/cover_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        finalUrl = await uploadFileToStorage(file, path, file.type || 'image/jpeg');
      } catch (storageErr) {
        console.warn('Storage upload note for blog quick cover:', storageErr);
      }

      portfolioStorage.updateData((prev) => ({
        ...prev,
        blogPosts: (prev.blogPosts || []).map((p) =>
          p.id === postId
            ? {
                ...p,
                coverImage: finalUrl,
                aspectRatio: processed.detectedRatio || p.aspectRatio
              }
            : p
        )
      }));
      onSave(`Cover uploaded for blog article (${processed.detectedRatio})`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error processing blog cover');
    } finally {
      setQuickUploadingBlogId(null);
    }
  };

  const handleDownloadBlogPost = (post: BlogPostItem) => {
    const mdContent = `---
title: "${(post.title || '').replace(/"/g, '\\"')}"
author: "${post.author?.name || 'Dr. Boniphace Ndege'}"
date: "${post.publishedAt}"
category: "${post.category}"
readTime: "${post.readTimeMinutes || 4} min"
tags: [${(post.tags || []).map((t) => `"${t}"`).join(', ')}]
---

# ${post.title}

> ${post.excerpt}

${post.content || ''}
`;
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${post.slug || 'article'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onSave(`Downloaded "${post.title}" as Markdown (.md)`);
  };

  const handleAddTakeaway = () => {
    if (!takeawayInput.trim()) return;
    const existing = blogForm.keyTakeaways || [];
    setBlogForm({ ...blogForm, keyTakeaways: [...existing, takeawayInput.trim()] });
    setTakeawayInput('');
  };

  const handleRemoveTakeaway = (index: number) => {
    const existing = blogForm.keyTakeaways || [];
    setBlogForm({ ...blogForm, keyTakeaways: existing.filter((_, i) => i !== index) });
  };

  // Filtered posts for admin list
  const filteredPosts = blogPosts.filter((post) => {
    const matchesCat = categoryFilter === 'All' || post.category === categoryFilter;
    const matchesQuery =
      searchQuery.trim() === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(240,185,46,0.25)]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0a351e] border border-[#3dff8f]/40 flex items-center justify-center text-[#3dff8f]">
              <PenOnBookIcon className="w-4 h-4 text-[#3dff8f]" glow />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif-heading text-[#fff1b8]">
              Blog &amp; Editorial Management
            </h3>
          </div>
          <p className="text-xs text-[#9fbfae] mt-1">
            Write, edit, and organize editorial articles. Supports all dynamic aspect ratios (Square, Landscape, Portrait), tags, key takeaways, and automatic Firestore synchronization.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-[#3dff8f] hover:bg-[#34db7a] flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(61,255,143,0.35)] shrink-0 self-start sm:self-auto transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Write New Article</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#010904] border border-white/10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#3dff8f] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles by title, topic, or keyword..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#02140b] border border-white/10 rounded-xl text-xs text-white placeholder-[#9fbfae]/60 focus:outline-none focus:border-[#3dff8f]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#9fbfae]">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#02140b] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#3dff8f] font-mono"
          >
            <option value="All">All Categories ({blogPosts.length})</option>
            {blogCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor Drawer / Modal when editing an article */}
      {editingId && (
        <div className="p-5 sm:p-7 rounded-3xl bg-[#010c06] border-2 border-[#3dff8f]/60 shadow-[0_0_40px_rgba(61,255,143,0.25)] space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <PenOnBookIcon className="w-5 h-5 text-[#3dff8f]" glow />
              <h4 className="text-lg font-bold font-serif-heading text-[#fff1b8]">
                {blogForm.id?.startsWith('post-') && !blogPosts.find((p) => p.id === editingId) ? 'Write New Article' : 'Edit Article Content'}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-mono border border-white/20 text-[#9fbfae] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePost}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-black bg-[#3dff8f] hover:bg-[#34db7a] flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(61,255,143,0.4)]"
              >
                <Save className="w-3.5 h-3.5 text-black" />
                <span>Save Article</span>
              </button>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="space-y-4">
            {/* Title & Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-[#3dff8f] block mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  value={blogForm.title || ''}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    const autoSlug = newTitle
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)+/g, '');
                    setBlogForm({
                      ...blogForm,
                      title: newTitle,
                      slug: blogForm.slug ? blogForm.slug : autoSlug
                    });
                  }}
                  placeholder="e.g. The Fusion of Human Creativity and AI"
                  className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-xs sm:text-sm text-white focus:outline-none focus:border-[#3dff8f]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#9fbfae] block mb-1">
                  URL Slug (Auto-generated or custom)
                </label>
                <input
                  type="text"
                  value={blogForm.slug || ''}
                  onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                  placeholder="e.g. human-creativity-and-ai"
                  className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-[#3dff8f]"
                />
              </div>
            </div>

            {/* Category & Excerpt */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-mono text-[#3dff8f] block mb-1">
                  Category
                </label>
                <select
                  value={blogForm.category || blogCategories[0]}
                  onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-xs sm:text-sm text-white focus:outline-none focus:border-[#3dff8f]"
                >
                  {blogCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-[#9fbfae] block mb-1">
                  Published Date
                </label>
                <input
                  type="date"
                  value={(blogForm.publishedAt || '').slice(0, 10)}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value || Date.now()).toISOString();
                    setBlogForm({ ...blogForm, publishedAt: newDate });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-xs text-white focus:outline-none focus:border-[#3dff8f] font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#9fbfae] block mb-1">
                  Published Time Formatted
                </label>
                <input
                  type="text"
                  value={blogForm.publishedTimeFormatted || ''}
                  onChange={(e) => setBlogForm({ ...blogForm, publishedTimeFormatted: e.target.value })}
                  placeholder="e.g. 10:30 AM"
                  className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-xs text-white focus:outline-none focus:border-[#3dff8f] font-mono"
                />
              </div>
            </div>

            {/* Summary / Excerpt */}
            <div>
              <label className="text-xs font-mono text-[#3dff8f] block mb-1">
                Executive Excerpt / Short Summary ("Show text except")
              </label>
              <textarea
                rows={2}
                value={blogForm.excerpt || ''}
                onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                placeholder="Brief, compelling 1-2 sentence preview shown on blog cards and search results..."
                className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-xs sm:text-sm text-white focus:outline-none focus:border-[#3dff8f]"
              />
            </div>

            {/* Cover Image Upload & Dynamic Ratio Selector (Square, Landscape, Portrait) */}
            <div className="p-4 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.3)] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-mono font-bold text-[#fff1b8] flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#f0b92e]" />
                  <span>Cover Image &amp; Automatic Aspect Ratio Support</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3dff8f]/10 text-[#3dff8f] border border-[#3dff8f]/30">
                    Active Ratio: {blogForm.aspectRatio || '16:9'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoDetectCurrentRatio}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[#fff1b8] border border-white/10 cursor-pointer"
                  >
                    Auto-Detect
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Dynamically Framed Preview */}
                <div
                  className="w-36 sm:w-44 rounded-2xl overflow-hidden border border-[#f0b92e]/40 bg-black shrink-0 relative flex items-center justify-center shadow-lg"
                  style={{ aspectRatio: getCssAspectRatio(blogForm.aspectRatio || '16:9') }}
                >
                  <img
                    src={blogForm.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85'}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-[#3dff8f] border border-white/20">
                    {blogForm.aspectRatio || '16:9'}
                  </div>
                </div>

                <div className="space-y-3 flex-1 min-w-0">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="text-xs text-[#9fbfae] file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:bg-[#0a351e] file:text-[#3dff8f] file:text-xs cursor-pointer"
                    />
                    <p className="text-[10px] text-[#9fbfae] mt-1">
                      Upload any image ratio (PNG, JPG, WebP). Ratio is automatically detected and stored to Firebase Cloud Storage.
                    </p>
                  </div>

                  {/* Standard Ratio Selector buttons */}
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-mono text-[#9fbfae] uppercase tracking-wider block">
                      Select or Override Ratio:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-[#fff1b8] w-20 shrink-0">1. Square:</span>
                      {SQUARE_RATIOS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setBlogForm({ ...blogForm, aspectRatio: r.id })}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            blogForm.aspectRatio === r.id
                              ? 'bg-[#3dff8f] text-black font-bold border-[#3dff8f]'
                              : 'bg-white/5 text-[#9fbfae] border-white/10 hover:text-white'
                          }`}
                        >
                          {r.id}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-[#fff1b8] w-20 shrink-0">2. Landscape:</span>
                      {LANDSCAPE_RATIOS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setBlogForm({ ...blogForm, aspectRatio: r.id })}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            blogForm.aspectRatio === r.id
                              ? 'bg-[#3dff8f] text-black font-bold border-[#3dff8f]'
                              : 'bg-white/5 text-[#9fbfae] border-white/10 hover:text-white'
                          }`}
                        >
                          {r.id}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-[#fff1b8] w-20 shrink-0">3. Portrait:</span>
                      {PORTRAIT_RATIOS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setBlogForm({ ...blogForm, aspectRatio: r.id })}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            blogForm.aspectRatio === r.id
                              ? 'bg-[#3dff8f] text-black font-bold border-[#3dff8f]'
                              : 'bg-white/5 text-[#9fbfae] border-white/10 hover:text-white'
                          }`}
                        >
                          {r.id}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Author Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#010904] border border-white/10">
              <div>
                <label className="text-xs font-mono text-[#3dff8f] block mb-1">
                  Author Name
                </label>
                <input
                  type="text"
                  value={blogForm.author?.name || data.profile.name}
                  onChange={(e) =>
                    setBlogForm({
                      ...blogForm,
                      author: {
                        name: e.target.value,
                        role: blogForm.author?.role || data.profile.titles?.[0] || 'Graphic Designer',
                        avatar: blogForm.author?.avatar || data.profile.logoPhoto || LOGO_DATA_URI
                      }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#02140b] border border-white/20 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#9fbfae] block mb-1">
                  Author Role / Title
                </label>
                <input
                  type="text"
                  value={blogForm.author?.role || ''}
                  onChange={(e) =>
                    setBlogForm({
                      ...blogForm,
                      author: {
                        name: blogForm.author?.name || data.profile.name,
                        role: e.target.value,
                        avatar: blogForm.author?.avatar || data.profile.logoPhoto || LOGO_DATA_URI
                      }
                    })
                  }
                  placeholder="Graphic Designer & Digital Creator"
                  className="w-full px-3 py-2 rounded-xl bg-[#02140b] border border-white/20 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#9fbfae] block mb-1">
                  Estimated Read Time (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={blogForm.readTimeMinutes || 4}
                  onChange={(e) => setBlogForm({ ...blogForm, readTimeMinutes: Number(e.target.value) || 4 })}
                  className="w-full px-3 py-2 rounded-xl bg-[#02140b] border border-white/20 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Tags & Key Takeaways */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-[#3dff8f] block mb-1">
                  Topic Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. Graphic Design, Branding, AI Tools, PWA"
                  className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-xs text-white focus:outline-none focus:border-[#3dff8f]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#3dff8f] block mb-1">
                  Add Key Insight / Takeaway
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={takeawayInput}
                    onChange={(e) => setTakeawayInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTakeaway();
                      }
                    }}
                    placeholder="Short summary takeaway point..."
                    className="flex-1 px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-xs text-white focus:outline-none focus:border-[#3dff8f]"
                  />
                  <button
                    type="button"
                    onClick={handleAddTakeaway}
                    className="px-3 py-2 rounded-xl bg-[#0a351e] text-[#3dff8f] text-xs font-bold border border-[#3dff8f]/40 hover:bg-[#3dff8f]/20 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* List of current takeaways */}
            {blogForm.keyTakeaways && blogForm.keyTakeaways.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-[#010904] border border-white/5">
                {blogForm.keyTakeaways.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0a351e] text-[11px] text-[#c8e6d4] border border-[#3dff8f]/30"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTakeaway(idx)}
                      className="text-rose-400 hover:text-rose-300 ml-1 cursor-pointer font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* External Resource / Project Reference Link */}
            <div className="p-4 rounded-2xl bg-[#010904] border border-[#3dff8f]/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-[#fff1b8] flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-[#3dff8f]" />
                  <span>External Resource / Attached Link (Optional)</span>
                </label>
                <span className="text-[10px] text-[#9fbfae]">Renders an interactive action button on the article</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-[#9fbfae] block mb-1">Link URL (https://...)</label>
                  <input
                    type="url"
                    value={blogForm.linkUrl || ''}
                    onChange={(e) => setBlogForm({ ...blogForm, linkUrl: e.target.value })}
                    placeholder="https://github.com/... or https://behance.net/..."
                    className="w-full px-3 py-2 rounded-xl bg-[#02140b] border border-white/20 text-xs text-white focus:outline-none focus:border-[#3dff8f]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[#9fbfae] block mb-1">Button Title / Action Label</label>
                  <input
                    type="text"
                    value={blogForm.linkTitle || ''}
                    onChange={(e) => setBlogForm({ ...blogForm, linkTitle: e.target.value })}
                    placeholder="e.g. View Interactive Project / Download Assets"
                    className="w-full px-3 py-2 rounded-xl bg-[#02140b] border border-white/20 text-xs text-white focus:outline-none focus:border-[#3dff8f]"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const url = blogForm.linkUrl || 'https://';
                  const label = blogForm.linkTitle || 'Explore Link';
                  setBlogForm((prev) => ({
                    ...prev,
                    content: (prev.content || '') + `\n\n[${label}](${url})`
                  }));
                }}
                className="px-2.5 py-1 rounded-lg bg-[#0a351e] border border-[#3dff8f]/40 text-[#3dff8f] text-[10px] font-mono hover:bg-[#3dff8f]/20 cursor-pointer"
              >
                + Insert Markdown Link into Content Body
              </button>
            </div>

            {/* Full Content Body with Markdown formatting tips */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono text-[#3dff8f] block">
                  Full Article Body (Supports Markdown headers, quotes, lists) *
                </label>
                <span className="text-[10px] font-mono text-[#9fbfae]">
                  Words: {(blogForm.content || '').split(/\s+/).filter(Boolean).length}
                </span>
              </div>
              <textarea
                rows={12}
                required
                value={blogForm.content || ''}
                onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                placeholder="## Section Title&#10;&#10;Write paragraphs here...&#10;&#10;> Blockquote or key quote&#10;&#10;### Subheading&#10;&#10;- Bullet point 1&#10;- Bullet point 2"
                className="w-full px-3.5 py-3 rounded-2xl bg-[#010904] border border-white/20 text-xs sm:text-sm text-white font-mono leading-relaxed focus:outline-none focus:border-[#3dff8f]"
              />
            </div>

            {/* Publication and Feature Toggles */}
            <div className="flex items-center gap-6 p-4 rounded-2xl bg-[#010904] border border-white/10 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(blogForm.published ?? true)}
                  onChange={(e) => setBlogForm({ ...blogForm, published: e.target.checked })}
                  className="rounded accent-[#3dff8f] w-4 h-4 cursor-pointer"
                />
                <span className="font-bold text-[#fff1b8]">Published &amp; Live on Blog Section</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(blogForm.featured)}
                  onChange={(e) => setBlogForm({ ...blogForm, featured: e.target.checked })}
                  className="rounded accent-[#f0b92e] w-4 h-4 cursor-pointer"
                />
                <span className="font-bold text-[#f0b92e]">Feature this Article at Top of Blog</span>
              </label>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="px-4 py-2 rounded-xl text-xs font-mono border border-white/20 text-[#9fbfae] hover:text-white cursor-pointer"
            >
              Cancel Changes
            </button>
            <button
              type="button"
              onClick={handleSavePost}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-black bg-[#3dff8f] hover:bg-[#34db7a] flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(61,255,143,0.4)]"
            >
              <Save className="w-4 h-4 text-black" />
              <span>Save &amp; Publish Article</span>
            </button>
          </div>
        </div>
      )}

      {/* Articles Management Table / Cards */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#010904] border border-white/10 text-center text-xs text-[#9fbfae] space-y-2">
            <p>No articles match the current filter.</p>
            <button
              onClick={handleCreateNew}
              className="text-[#3dff8f] underline font-bold"
            >
              Write your first article now
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-white/10 hover:border-[#3dff8f]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 min-w-0">
                {/* Thumbnail */}
                <div
                  className="w-20 sm:w-24 rounded-xl overflow-hidden bg-black shrink-0 border border-white/15 flex items-center justify-center"
                  style={{ aspectRatio: getCssAspectRatio(post.aspectRatio || '16:9') }}
                >
                  <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/30">
                      {post.category}
                    </span>
                    {post.featured && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#f0b92e]/20 text-[#f0b92e] border border-[#f0b92e]/40 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Featured
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        post.published
                          ? 'bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {post.published ? 'Live' : 'Draft'}
                    </span>
                    <span className="text-[10px] font-mono text-[#9fbfae]">
                      Ratio: {post.aspectRatio || '16:9'}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-[#fff1b8] truncate">
                    {post.title}
                  </h4>

                  <p className="text-xs text-[#9fbfae] line-clamp-1 italic">
                    "{post.excerpt}"
                  </p>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-[#9fbfae] pt-1">
                    <span>By {post.author.name}</span>
                    <span>· {new Date(post.publishedAt).toLocaleDateString()}</span>
                    <span>· {post.readTimeMinutes} min read</span>
                    <span>· {post.views || 0} views</span>
                    <span>· {post.likes || 0} likes</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: 4 Suite (Edit, Upload, Download, Delete) + Visibility */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-white/5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleToggleFeatured(post.id)}
                  className={`p-2 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
                    post.featured
                      ? 'bg-[#f0b92e]/20 text-[#f0b92e] border-[#f0b92e]/40'
                      : 'bg-[#02140b] text-[#9fbfae] border-white/10 hover:text-white'
                  }`}
                  title={post.featured ? 'Unmark featured' : 'Mark as featured article'}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleTogglePublished(post.id)}
                  className={`p-2 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
                    post.published
                      ? 'bg-[#3dff8f]/15 text-[#3dff8f] border-[#3dff8f]/40'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                  }`}
                  title={post.published ? 'Unpublish to draft' : 'Publish live'}
                >
                  {post.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                {/* Quick Upload Cover Button */}
                <label
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 ${
                    quickUploadingBlogId === post.id
                      ? 'bg-[#0a351e] text-[#3dff8f] border-[#3dff8f] animate-pulse cursor-wait'
                      : 'bg-[#01140a] text-[#3dff8f] border-[#3dff8f]/40 hover:bg-[#0a351e]'
                  }`}
                  title="Upload Blog Cover Image to Firebase"
                >
                  {quickUploadingBlogId === post.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3dff8f]" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-[#3dff8f]" />
                  )}
                  <span>{quickUploadingBlogId === post.id ? 'Uploading...' : 'Upload Cover'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={quickUploadingBlogId === post.id}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleQuickUploadBlogCover(post.id, f);
                      e.target.value = '';
                    }}
                  />
                </label>

                {/* Download Article Button (.md) */}
                <button
                  type="button"
                  onClick={() => handleDownloadBlogPost(post)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-mono bg-white/5 hover:bg-white/15 text-[#9fbfae] hover:text-white border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Download article as Markdown (.md)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(post.id);
                    setBlogForm(post);
                    setTagInput((post.tags || []).join(', '));
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/40 hover:bg-[#0d4728] flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ id: post.id, title: post.title })}
                  className="p-2 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 cursor-pointer transition-colors"
                  title="Delete article"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#02100a] border border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.35)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#fff1b8]">Delete Article?</h4>
              <p className="text-xs text-[#9fbfae] mt-1 leading-relaxed">
                Are you sure you want to delete <span className="text-rose-300 font-bold">"{deleteTarget.title}"</span>? This will permanently remove it from your portfolio and Firestore.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-white/20 text-xs text-[#9fbfae] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeletePost(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-all cursor-pointer shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-module: Books & Publications Tab                                       */
/* -------------------------------------------------------------------------- */
const BooksTab: React.FC<{
  data: PortfolioDatabase;
  onSave: (msg: string) => void;
  onRefresh: () => void;
  initialEditingBookId?: string | null;
  initialSubView?: 'catalog' | 'categories';
}> = ({ data, onSave, onRefresh, initialEditingBookId, initialSubView = 'catalog' }) => {
  const [activeView, setActiveView] = useState<'catalog' | 'categories'>(initialSubView);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bookForm, setBookForm] = useState<Partial<BookItem>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; cover?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [tagInput, setTagInput] = useState('');
  const [activeEditorTab, setActiveEditorTab] = useState<'writing' | 'cover' | 'pdf' | 'specs'>('writing');

  // Image & PDF upload states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [quickUploadingBookId, setQuickUploadingBookId] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docFileMeta, setDocFileMeta] = useState<{ name: string; size: string } | null>(null);
  const [coverUploadMsg, setCoverUploadMsg] = useState<string | null>(null);
  const [docUploadMsg, setDocUploadMsg] = useState<string | null>(null);

  // Chapter editing inside book form
  const [editingChapterIdx, setEditingChapterIdx] = useState<number | null>(null);
  const [chapterForm, setChapterForm] = useState<Partial<BookChapter>>({});

  // Book Category Management states
  const [newCatName, setNewCatName] = useState('');
  const [editingCatName, setEditingCatName] = useState<string | null>(null);
  const [renameCatVal, setRenameCatVal] = useState('');
  const [deleteCatTarget, setDeleteCatTarget] = useState<string | null>(null);
  const [inlineNewCatOpen, setInlineNewCatOpen] = useState(false);
  const [inlineNewCatVal, setInlineNewCatVal] = useState('');

  const books = data.books || [];
  const rawBookCategories = data.bookCategories || [];
  const bookCategories = useMemo<string[]>(() => {
    const list = (rawBookCategories || []).filter((c: string) => Boolean(c && c !== 'All' && c !== 'All Categories'));
    return list.length > 0
      ? Array.from(new Set(list))
      : ['Design', 'Academic', 'Fiction', 'UI/UX & Web Engineering', 'Spiritual Leadership & Ministry'];
  }, [rawBookCategories]);

  // Suggested category templates (including user requested Fiction, Academic, Design)
  const suggestedCategories: string[] = [
    'Fiction',
    'Academic',
    'Design',
    'Spiritual Leadership & Ministry',
    'Business & African Innovation',
    'Creative Philosophy & AI',
    'Personal Mastery & Growth',
    'Technology & AI Engineering',
    'Theology & Faith',
    'Biographies & Memoirs'
  ];

  const handleAddCategory = (catNameToAdd?: string) => {
    const target = (catNameToAdd || newCatName).trim();
    if (!target) return;
    if (bookCategories.some((c: string) => c.toLowerCase() === target.toLowerCase())) {
      onSave(`Category "${target}" already exists`);
      setNewCatName('');
      return;
    }
    portfolioStorage.addBookCategory(target);
    setNewCatName('');
    onSave(`Book category "${target}" added successfully`);
    onRefresh();
  };

  const handleInlineAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const target = inlineNewCatVal.trim();
    if (!target) return;
    portfolioStorage.addBookCategory(target);
    setBookForm((prev) => ({ ...prev, category: target }));
    setInlineNewCatVal('');
    setInlineNewCatOpen(false);
    onSave(`Category "${target}" created and selected!`);
    onRefresh();
  };

  const handleRenameCategory = (oldCat: string) => {
    const next = renameCatVal.trim();
    if (!next || next === oldCat) {
      setEditingCatName(null);
      return;
    }
    portfolioStorage.renameBookCategory(oldCat, next, true);
    setEditingCatName(null);
    setRenameCatVal('');
    onSave(`Book category renamed to "${next}"`);
    onRefresh();
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const remainingCats = bookCategories.filter((c: string) => c !== catToDelete);
    const fallback = remainingCats[0] || 'Design';
    portfolioStorage.deleteBookCategory(catToDelete, fallback);
    setDeleteCatTarget(null);
    if (categoryFilter === catToDelete) {
      setCategoryFilter('All');
    }
    onSave(`Book category "${catToDelete}" removed (books reassigned to "${fallback}")`);
    onRefresh();
  };

  // Quick Stats
  const totalBooks = books.length;
  const freeBooksCount = books.filter((b) => b.isFreeDownload || b.price === 0).length;
  const pdfAttachedCount = books.filter((b) => b.pdfFileUrl || b.downloadUrl).length;
  const totalChaptersCount = books.reduce((acc, b) => acc + (b.chapters?.length || 0), 0);

  const filteredBooks = books.filter((b) => {
    const matchesCat = categoryFilter === 'All' || b.category === categoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Keyboard shortcut Ctrl/Cmd + S to save book while editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        if (editingId) {
          e.preventDefault();
          handleSaveBook();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingId, bookForm, tagInput]);

  const handleCreateBook = () => {
    const defaultAuthor = {
      name: data.profile.name || 'Ev Dr. Boniphace J. Ndege',
      role: data.profile.titles?.[0] || 'Author, Designer & Digital Architect',
      avatar: data.profile.logoPhoto || LOGO_DATA_URI,
      bio: 'Ev Dr. Boniphace J. Ndege is an accomplished author, digital systems architect, and spiritual leader dedicated to advancing human potential through design excellence, technological integrity, and transformative faith.'
    };

    const newBook: BookItem = {
      id: 'book-' + Date.now(),
      slug: 'publication-' + Date.now(),
      title: 'New Book Title',
      subtitle: 'A Masterclass on Purpose, Design & Creative Leadership',
      author: defaultAuthor,
      publishedAt: new Date().toISOString(),
      publishedTimeFormatted: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      category: bookCategories[0] || 'UI/UX & Web Engineering',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&h=1350&q=85',
      aspectRatio: '2:3',
      excerpt: 'Write a compelling book excerpt here that summarizes the core thesis and practical value for your readers...',
      description: 'Comprehensive book overview and synopsis explaining the background, target audience, and transformative insights contained within these pages.',
      isbn: '978-9987-04-' + Math.floor(100 + Math.random() * 900) + '-0',
      pagesCount: 196,
      language: 'English',
      publisher: 'Ndege Masterclass Press, Dodoma',
      formats: ['PDF', 'ePub', 'Paperback', 'Kindle'],
      price: 0,
      currency: 'USD',
      isFreeDownload: true,
      isDownloadable: true,
      readingTheme: 'midnight-emerald',
      tags: ['Design', 'Leadership', 'Innovation', 'Masterpiece'],
      featured: false,
      rating: 4.96,
      reviewsCount: 16,
      downloadsCount: 0,
      readsCount: 0,
      likesCount: 0,
      order: books.length + 1,
      published: true,
      chapters: [
        {
          id: 'chap-1',
          chapterNumber: 1,
          title: 'The Foundation of Distinction',
          subtitle: 'Why excellence and vision transcend ordinary work',
          content: 'Begin directly typing Chapter 1 here. You can write paragraphs, quotes, and lessons. The bookstore reader layout will format this content with beautiful typography and chapter navigation.'
        }
      ]
    };

    portfolioStorage.updateData((prev) => ({
      ...prev,
      books: [newBook, ...(prev.books || [])]
    }));

    setEditingId(newBook.id);
    setBookForm(newBook);
    setTagInput(newBook.tags.join(', '));
    setActiveEditorTab('writing');
    setDocFileMeta(null);
    setDocUploadMsg(null);
    setCoverUploadMsg(null);
    onSave('New book draft created! Start writing and editing below.');
    onRefresh();
  };

  const handleEditBook = (book: BookItem) => {
    setEditingId(book.id);
    setBookForm({
      ...book,
      coverImage: formatTwoByThreeBookCover(book.coverImage),
      aspectRatio: '2:3'
    });
    setTagInput((book.tags || []).join(', '));
    setActiveEditorTab('writing');
    setCoverUploadMsg(null);
    setDocUploadMsg(book.pdfFileUrl ? 'PDF file currently attached' : null);
    if (book.pdfFileUrl) {
      const fileName = book.pdfFileUrl.split('/').pop()?.split('?')[0] || 'book-document.pdf';
      setDocFileMeta({ name: fileName, size: 'Attached Document' });
    } else {
      setDocFileMeta(null);
    }
  };

  useEffect(() => {
    if (initialEditingBookId) {
      const target = books.find((b) => b.id === initialEditingBookId);
      if (target) {
        handleEditBook(target);
      }
    }
  }, [initialEditingBookId]);

  const handleSaveBook = () => {
    if (!bookForm.title?.trim()) {
      alert('Book title is required.');
      return;
    }

    const processedTags = tagInput
      ? tagInput.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
      : bookForm.tags || [];

    const finalBook: BookItem = {
      ...(bookForm as BookItem),
      coverImage: formatTwoByThreeBookCover(bookForm.coverImage || ''),
      aspectRatio: '1:1.44',
      tags: processedTags
    };

    portfolioStorage.updateData((prev) => ({
      ...prev,
      books: (prev.books || []).map((b) => (b.id === editingId ? finalBook : b))
    }));

    setEditingId(null);
    setBookForm({});
    setEditingChapterIdx(null);
    setChapterForm({});
    onSave(`Book "${finalBook.title}" saved & published to bookstore!`);
    onRefresh();
  };

  const handleDeleteBook = (id: string) => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      books: (prev.books || []).filter((b) => b.id !== id)
    }));
    if (editingId === id) {
      setEditingId(null);
      setBookForm({});
      setDocFileMeta(null);
      setEditingChapterIdx(null);
      setChapterForm({});
    }
    onSave('Book publication deleted successfully');
    onRefresh();
  };

  // Quick cover image upload for any book directly from the catalog
  const handleQuickUploadCover = async (bookId: string, file: File) => {
    setQuickUploadingBookId(bookId);
    try {
      const processed = await processTradeRatioBookCoverFile(file);
      let finalUrl = formatTwoByThreeBookCover(processed.dataUrl);
      try {
        const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg';
        const path = `portfolio/books/cover_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const uploadedUrl = await uploadFileToStorage(processed.blob, path, file.type || 'image/jpeg');
        if (uploadedUrl) {
          finalUrl = formatTwoByThreeBookCover(uploadedUrl);
        }
      } catch (storageErr) {
        console.warn('Storage upload notice for quick book cover, using processed data:', storageErr);
      }

      portfolioStorage.updateData((prev) => ({
        ...prev,
        books: (prev.books || []).map((b) =>
          b.id === bookId ? { ...b, coverImage: finalUrl, aspectRatio: '1:1.44' } : b
        )
      }));
      onSave('✓ Cover Attached: Book cover uploaded to Firebase & formatted to 1:1.44 ratio!');
      onRefresh();
    } catch (err: any) {
      console.error('Quick cover upload error:', err);
      alert('Failed to upload cover: ' + (err.message || 'Unknown error'));
    } finally {
      setQuickUploadingBookId(null);
    }
  };

  // Direct download handler for admin book catalog
  const handleDownloadBookAdmin = async (book: BookItem) => {
    const targetUrl = book.pdfFileUrl || book.downloadUrl;
    if (targetUrl) {
      try {
        const res = await fetch(targetUrl);
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${book.slug || 'book'}-by-dr-boniphace-ndege.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          onSave(`Downloaded "${book.title}" PDF`);
          return;
        }
      } catch (err) {
        console.warn('Direct blob download notice:', err);
      }
      window.open(targetUrl, '_blank');
      onSave(`Opened "${book.title}" PDF file`);
    } else {
      // Export book manuscript and typed chapters as text file
      const text = `${book.title.toUpperCase()}\nBy ${book.author?.name || 'Dr. Boniphace Ndege'}\n\nCategory: ${book.category}\nISBN: ${book.isbn || 'N/A'}\n\nOVERVIEW:\n${book.description || book.excerpt}\n\n` +
        (book.chapters || []).map((ch, i) => `--- CHAPTER ${ch.chapterNumber || i + 1}: ${ch.title} ---\n${ch.subtitle ? ch.subtitle + '\n\n' : ''}${ch.content}\n\n`).join('\n');
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.slug || 'book'}-manuscript.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onSave(`Downloaded manuscript for "${book.title}"`);
    }
  };

  // Cover image upload with Trade 1:1.44 ratio enforcement & Firebase Storage
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setCoverUploadMsg('Uploading Cover to Firebase...');
    try {
      const processed = await processTradeRatioBookCoverFile(file);
      let finalUrl = formatTwoByThreeBookCover(processed.dataUrl);
      try {
        const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg';
        const path = `portfolio/books/cover_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const uploadedUrl = await uploadFileToStorage(processed.blob, path, file.type || 'image/jpeg');
        if (uploadedUrl) {
          finalUrl = formatTwoByThreeBookCover(uploadedUrl);
        }
      } catch (storageErr) {
        console.warn('Storage upload note for book cover, using processed image:', storageErr);
      }

      setBookForm((prev) => ({
        ...prev,
        coverImage: finalUrl,
        aspectRatio: '1:1.44'
      }));
      setCoverUploadMsg('✓ Cover Attached: Formatted to reduced 1:1.44 ratio with realistic 3D spine and drop shadows!');
      onSave(`✓ Cover Attached: Book cover uploaded & formatted to Trade 1:1.44 ratio!`);
    } catch (err: any) {
      console.warn('Error processing image:', err);
      setCoverUploadMsg('Error uploading cover. Please try again.');
    } finally {
      setUploadingCover(false);
    }
  };

  // PDF / Document upload to Firebase Storage with resilient local media fallback
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    setDocUploadMsg(null);
    try {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const sizeText = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;
      let finalUrl = '';
      try {
        const path = `portfolio/books/docs_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadedUrl = await uploadFileToStorage(file, path, file.type || 'application/pdf');
        if (uploadedUrl) finalUrl = uploadedUrl;
      } catch (storageErr) {
        console.warn('Cloud storage notice for PDF, falling back to local media attachment:', storageErr);
      }

      if (!finalUrl) {
        finalUrl = URL.createObjectURL(file);
        try {
          await saveMediaToIndexedDB(`pdf_${Date.now()}_${file.name}`, file);
        } catch (idbErr) {
          console.warn('IndexedDB PDF backup notice:', idbErr);
        }
      }

      setDocFileMeta({ name: file.name, size: sizeText });
      setBookForm((prev) => ({
        ...prev,
        pdfFileUrl: finalUrl,
        downloadUrl: finalUrl,
        isDownloadable: true
      }));

      setDocUploadMsg(`PDF "${file.name}" (${sizeText}) attached & ready!`);
      onSave(`Book document "${file.name}" attached & downloadable!`);
    } catch (err: any) {
      console.error('Doc upload error:', err);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRemoveDoc = () => {
    setBookForm((prev) => ({
      ...prev,
      pdfFileUrl: undefined,
      downloadUrl: undefined,
      isDownloadable: false
    }));
    setDocFileMeta(null);
    setDocUploadMsg('Attached document removed');
    onSave('Attached book document removed');
  };

  // Chapter management helpers with real-time database & website persistence
  const handleAddChapter = () => {
    const currentChapters = bookForm.chapters || [];
    const newCh: BookChapter = {
      id: 'chap-' + Date.now(),
      chapterNumber: currentChapters.length + 1,
      title: `Chapter ${currentChapters.length + 1}: Title Here`,
      subtitle: 'Key theme or thesis of this chapter',
      content: 'Write the content of this chapter here...'
    };
    const nextChapters = [...currentChapters, newCh];
    setBookForm((prev) => ({
      ...prev,
      chapters: nextChapters
    }));
    setEditingChapterIdx(currentChapters.length);
    setChapterForm(newCh);

    if (editingId) {
      portfolioStorage.updateData((prev) => ({
        ...prev,
        books: (prev.books || []).map((b) =>
          b.id === editingId ? { ...b, chapters: nextChapters } : b
        )
      }));
      onSave(`Chapter ${newCh.chapterNumber} added to book!`);
      onRefresh();
    }
  };

  const handleSaveChapter = () => {
    if (editingChapterIdx === null) return;
    const currentChapters = [...(bookForm.chapters || [])];
    currentChapters[editingChapterIdx] = {
      ...currentChapters[editingChapterIdx],
      ...chapterForm
    } as BookChapter;

    setBookForm((prev) => ({ ...prev, chapters: currentChapters }));
    const savedIdx = editingChapterIdx;
    setEditingChapterIdx(null);
    setChapterForm({});

    if (editingId) {
      portfolioStorage.updateData((prev) => ({
        ...prev,
        books: (prev.books || []).map((b) =>
          b.id === editingId ? { ...b, chapters: currentChapters } : b
        )
      }));
      onSave(`Chapter ${savedIdx + 1} saved directly to database & website!`);
      onRefresh();
    } else {
      onSave('Chapter text saved to book draft');
    }
  };

  const handleDeleteChapter = (idx: number) => {
    const currentChapters = (bookForm.chapters || []).filter((_, i) => i !== idx);
    const renumbered = currentChapters.map((c, i) => ({ ...c, chapterNumber: i + 1 }));
    setBookForm((prev) => ({ ...prev, chapters: renumbered }));
    if (editingChapterIdx === idx) {
      setEditingChapterIdx(null);
      setChapterForm({});
    }

    if (editingId) {
      portfolioStorage.updateData((prev) => ({
        ...prev,
        books: (prev.books || []).map((b) =>
          b.id === editingId ? { ...b, chapters: renumbered } : b
        )
      }));
      onSave(`Chapter deleted directly from database & website.`);
      onRefresh();
    }
  };

  const handleMoveChapter = (idx: number, direction: 'up' | 'down') => {
    const chapters = [...(bookForm.chapters || [])];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= chapters.length) return;
    const temp = chapters[idx];
    chapters[idx] = chapters[targetIdx];
    chapters[targetIdx] = temp;
    const renumbered = chapters.map((c, i) => ({ ...c, chapterNumber: i + 1 }));
    setBookForm((prev) => ({ ...prev, chapters: renumbered }));

    if (editingId) {
      portfolioStorage.updateData((prev) => ({
        ...prev,
        books: (prev.books || []).map((b) =>
          b.id === editingId ? { ...b, chapters: renumbered } : b
        )
      }));
      onSave(`Chapter moved ${direction}!`);
      onRefresh();
    }
  };

  // Chapter markdown helper toolbar
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('chapter-content-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = chapterForm.content || '';
    const selected = currentText.substring(start, end) || 'text';
    const replacement = `${prefix}${selected}${suffix}`;
    const nextText = currentText.substring(0, start) + replacement + currentText.substring(end);
    setChapterForm((prev) => ({ ...prev, content: nextText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Bar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#011409] via-[#021008] to-[#010904] border border-[rgba(240,185,46,0.3)] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-[#0a351e] border border-[#3dff8f]/40 text-[#3dff8f] font-mono font-bold text-xs uppercase flex items-center gap-1.5 shadow-sm">
              <BookOpen className="w-3.5 h-3.5 text-[#3dff8f]" />
              <span>Author Publications &amp; Book Studio</span>
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-serif-heading text-[#fff1b8]">
            Books Writing, Editing &amp; Publishing Center
          </h3>
          <p className="text-xs text-[#9fbfae] mt-1 max-w-2xl">
            Write new books, edit existing publications, delete drafts, upload 2:3 book covers, attach PDF documents to Firebase Storage, and compose chapters directly.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setActiveView('catalog');
              handleCreateBook();
            }}
            className="px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(240,185,46,0.5)] active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-[#1a1200]" />
            <span>Write New Publication</span>
          </button>
        </div>
      </div>

      {/* Sub-view Switcher: Books Catalog vs Book Categories */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.25)]">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveView('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'catalog'
                ? 'bg-gradient-to-r from-[#0a351e] via-[#052816] to-[#0a351e] text-[#3dff8f] border border-[#3dff8f] shadow-[0_0_15px_rgba(61,255,143,0.3)]'
                : 'text-[#9fbfae] hover:text-white bg-[#021008] border border-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Publications Catalog ({books.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'categories'
                ? 'bg-gradient-to-r from-[#0a351e] via-[#052816] to-[#0a351e] text-[#3dff8f] border border-[#3dff8f] shadow-[0_0_15px_rgba(61,255,143,0.3)]'
                : 'text-[#9fbfae] hover:text-white bg-[#021008] border border-white/5'
            }`}
          >
            <Bookmark className="w-4 h-4 text-[#f0b92e]" />
            <span>Manage Book Categories ({bookCategories.length})</span>
          </button>
        </div>

        <div className="text-xs font-mono text-[#9fbfae] px-2 hidden md:block">
          {activeView === 'catalog'
            ? 'Manage books, chapters & PDFs'
            : 'Add & manage categories (e.g. Fiction, Academic, Design)'}
        </div>
      </div>

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#010c06] border border-[#3dff8f]/20">
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#3dff8f]">{totalBooks}</div>
          <div className="text-xs font-mono text-[#9fbfae]">Total Publications</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#010c06] border border-[#f0b92e]/20">
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#f0b92e]">{freeBooksCount}</div>
          <div className="text-xs font-mono text-[#9fbfae]">Free Gift Books</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#010c06] border border-[#3dff8f]/20">
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#3dff8f]">{pdfAttachedCount}</div>
          <div className="text-xs font-mono text-[#9fbfae]">PDFs Attached</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#010c06] border border-[#f0b92e]/20">
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#fff1b8]">{totalChaptersCount}</div>
          <div className="text-xs font-mono text-[#9fbfae]">Chapters Written</div>
        </div>
      </div>

      {/* Full Book Writing & Editing Studio */}
      {editingId && (
        <div className="p-5 sm:p-7 rounded-3xl bg-[#011409] border-2 border-[#3dff8f]/60 shadow-[0_0_50px_rgba(61,255,143,0.22)] space-y-6 animate-in slide-in-from-top-4">
          
          {/* Studio Sticky Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 sticky top-0 z-30 bg-[#011409]/95 backdrop-blur-md pt-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#f0b92e]/20 text-[#f0b92e] border border-[#f0b92e]/40 font-bold">
                  Book Studio
                </span>
                <span className="text-[11px] font-mono text-[#9fbfae]">
                  Ctrl + S to Save
                </span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold font-serif-heading text-[#fff1b8] truncate mt-1">
                {bookForm.title || 'Untitled Book'}
              </h4>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-mono border border-white/20 text-[#9fbfae] hover:text-white hover:bg-white/10 cursor-pointer transition-colors flex items-center gap-1.5"
                title="Close Studio Editor"
              >
                <span>✕ Close Editor</span>
              </button>
            </div>
          </div>

          {/* Module Navigation Tabs inside the Editor */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none border-b border-white/10">
            {[
              { id: 'writing', label: '✍️ Writing & Chapters', icon: FileText },
              { id: 'cover', label: '🖼️ Book Cover (Trade 1:1.44 Ratio)', icon: ImageIcon },
              { id: 'pdf', label: '📄 PDF / Document Upload', icon: Download },
              { id: 'specs', label: '⚙️ Specs & Publishing', icon: Sliders }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveEditorTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  activeEditorTab === tab.id
                    ? 'bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f] shadow-[0_0_15px_rgba(61,255,143,0.25)]'
                    : 'bg-[#010904] text-[#9fbfae] border border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: Writing & Chapters Direct Composition */}
          {activeEditorTab === 'writing' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Title, Subtitle, Author, Publisher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-mono text-[#3dff8f] block mb-1">Book Title *</label>
                  <input
                    type="text"
                    required
                    value={bookForm.title || ''}
                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                    placeholder="e.g. The Gospel of Creative Excellence"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#010904] border border-white/20 text-xs sm:text-sm text-white focus:border-[#3dff8f] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-mono text-[#9fbfae] block mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={bookForm.subtitle || ''}
                    onChange={(e) => setBookForm({ ...bookForm, subtitle: e.target.value })}
                    placeholder="e.g. Why Human Artistry Must Lead the Technological Renaissance"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#010904] border border-white/20 text-xs text-white focus:border-[#3dff8f] focus:outline-none"
                  />
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-mono text-[#9fbfae]">Category *</label>
                    <button
                      type="button"
                      onClick={() => setInlineNewCatOpen(!inlineNewCatOpen)}
                      className="text-[10px] font-mono text-[#3dff8f] hover:underline flex items-center gap-1 cursor-pointer"
                      title="Add a new book category"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New</span>
                    </button>
                  </div>
                  <select
                    value={bookForm.category || bookCategories[0]}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-xs text-white focus:border-[#3dff8f] focus:outline-none cursor-pointer"
                  >
                    {bookCategories.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#010904] text-white">
                        {cat}
                      </option>
                    ))}
                  </select>

                  {/* Inline Add Category Popover */}
                  {inlineNewCatOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-2xl bg-[#02180d] border border-[#3dff8f]/60 shadow-[0_10px_30px_rgba(0,0,0,0.9)] z-40 space-y-2 animate-in fade-in">
                      <div className="text-[11px] font-mono text-[#3dff8f] font-bold flex items-center justify-between">
                        <span>New Book Category</span>
                        <button
                          type="button"
                          onClick={() => setInlineNewCatOpen(false)}
                          className="text-[#9fbfae] hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={inlineNewCatVal}
                          onChange={(e) => setInlineNewCatVal(e.target.value)}
                          placeholder="e.g. Fiction, Academic, Design..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#010a05] border border-white/20 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3dff8f]"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleInlineAddCategory(e);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleInlineAddCategory}
                          className="px-3 py-1.5 rounded-lg bg-[#3dff8f] text-black font-bold text-xs cursor-pointer hover:bg-[#34db7a]"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {['Fiction', 'Academic', 'Design'].filter((c) => !bookCategories.includes(c)).map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => {
                              portfolioStorage.addBookCategory(sug);
                              setBookForm((prev) => ({ ...prev, category: sug }));
                              setInlineNewCatOpen(false);
                              onSave(`Category "${sug}" created and selected!`);
                              onRefresh();
                            }}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/40 hover:bg-[#3dff8f]/20 cursor-pointer"
                          >
                            + {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-mono text-[#9fbfae] block mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={bookForm.slug || ''}
                    onChange={(e) => setBookForm({ ...bookForm, slug: e.target.value })}
                    placeholder="gospel-of-creative-excellence"
                    className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#9fbfae] block mb-1">Author Name</label>
                  <input
                    type="text"
                    value={bookForm.author?.name || 'Ev Dr. Boniphace J. Ndege'}
                    onChange={(e) =>
                      setBookForm({
                        ...bookForm,
                        author: {
                          ...(bookForm.author || { name: '', role: '', avatar: '', bio: '' }),
                          name: e.target.value
                        }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#9fbfae] block mb-1">Publisher Press</label>
                  <input
                    type="text"
                    value={bookForm.publisher || 'Ndege Masterclass Press, Dodoma'}
                    onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                    placeholder="Ndege Masterclass Press, Dodoma"
                    className="w-full px-3 py-2 rounded-xl bg-[#010904] border border-white/20 text-xs text-white"
                  />
                </div>
              </div>

              {/* Dedicated Book Image Upload Card (Directly within writing studio) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-[#3dff8f]/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="text-xs sm:text-sm font-mono font-bold text-[#fff1b8] uppercase flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#3dff8f]" />
                      <span>Upload Book Image &amp; Front Cover (Trade 1:1.44 Ratio)</span>
                    </h5>
                    <p className="text-[11px] text-[#9fbfae] mt-0.5">
                      Upload front cover artwork. Automatically formatted to reduced 1:1.44 ratio with realistic 3D spine and drop shadows.
                    </p>
                  </div>
                  {bookForm.coverImage && (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30 shrink-0 self-start sm:self-auto font-bold">
                      ✓ Cover Attached
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Cover Mockup Preview */}
                  <div className="md:col-span-3 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-mono text-[#f0b92e] mb-1 font-bold flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-[#f0b92e]" />
                      <span>Cover Preview</span>
                    </span>
                    <div
                      className="w-24 sm:w-28 rounded-r-xl rounded-l-sm overflow-hidden border-2 border-[rgba(240,185,46,0.6)] shadow-[0_14px_30px_rgba(0,0,0,0.95),-6px_0_15px_rgba(0,0,0,0.85)] relative bg-[#020b05] aspect-[1/1.44]"
                      style={{ aspectRatio: '1 / 1.44' }}
                    >
                      {bookForm.coverImage ? (
                        <>
                          <img
                            src={formatTwoByThreeBookCover(bookForm.coverImage)}
                            alt="Cover Preview"
                            className="w-full h-full object-cover"
                          />
                          {/* Realistic 3D spine and drop shadow */}
                          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
                          <div className="absolute inset-y-0 left-1 w-[1px] bg-white/20 pointer-events-none z-10" />
                          <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-black/40 to-transparent pointer-events-none z-10" />
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#9fbfae] text-[10px] p-2 text-center">
                          <BookOpen className="w-6 h-6 text-[#9fbfae]/40 mb-1" />
                          <span>No cover yet</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Controls & URL */}
                  <div className="md:col-span-9 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-[#01140a] bg-[#3dff8f] hover:bg-[#34db7a] cursor-pointer shadow-md transition-all active:scale-95">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingCover ? 'Uploading Cover to Firebase...' : 'Upload Book Cover Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCoverUpload}
                          disabled={uploadingCover}
                        />
                      </label>

                      {bookForm.coverImage && (
                        <button
                          type="button"
                          onClick={() => setBookForm({ ...bookForm, coverImage: '' })}
                          className="px-3 py-2 rounded-xl text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer"
                        >
                          Remove Cover
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#9fbfae] block">
                        Or enter direct Book Cover Image URL
                      </label>
                      <input
                        type="text"
                        value={bookForm.coverImage || ''}
                        onChange={(e) => setBookForm({ ...bookForm, coverImage: e.target.value, aspectRatio: '1:1.44' })}
                        placeholder="https://images.unsplash.com/... or storage URL"
                        className="w-full px-3 py-1.5 rounded-xl bg-[#021008] border border-white/20 text-xs text-white placeholder:text-gray-600 focus:border-[#3dff8f] focus:outline-none"
                      />
                    </div>

                    {coverUploadMsg && (
                      <div className="p-2 rounded-lg bg-[#0a351e] border border-[#3dff8f]/40 text-[11px] font-mono text-[#3dff8f] flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#3dff8f]" />
                        <span>{coverUploadMsg}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Excerpt & Full Description */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#010904] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-[#f0b92e] font-bold block">
                      Author Text Excerpt ("show text except") *
                    </label>
                    <span className="text-[10px] font-mono text-[#9fbfae]">
                      {(bookForm.excerpt || '').length} characters
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={bookForm.excerpt || ''}
                    onChange={(e) => setBookForm({ ...bookForm, excerpt: e.target.value })}
                    placeholder="Write the featured excerpt shown on book cards and reader headers..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#021008] border border-white/20 text-xs text-white leading-relaxed focus:border-[#3dff8f] focus:outline-none"
                  />
                  <p className="text-[11px] text-[#9fbfae]">
                    This excerpt is highlighted across the bookstore and can be read aloud via speech synthesis.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#010904] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-[#fff1b8] font-bold block">
                      Full Book Description &amp; Back-Cover Synopsis
                    </label>
                    <span className="text-[10px] font-mono text-[#9fbfae]">
                      {(bookForm.description || '').length} characters
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={bookForm.description || ''}
                    onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                    placeholder="Detailed multi-paragraph description, core lessons, and target readership..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#021008] border border-white/20 text-xs text-white leading-relaxed focus:border-[#3dff8f] focus:outline-none"
                  />
                  <p className="text-[11px] text-[#9fbfae]">
                    Appears in the sneak-peek preview and full reading layout.
                  </p>
                </div>

                {/* External Companion Link / Purchase / Resource Link */}
                <div className="p-4 rounded-2xl bg-[#010904] border border-[#3dff8f]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-[#fff1b8] font-bold flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-[#3dff8f]" />
                      <span>Book Companion Link / Resource URL (Optional)</span>
                    </label>
                    <span className="text-[10px] text-[#9fbfae]">External publisher, Amazon, or study companion link</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-[#9fbfae] block mb-1">Companion URL (https://...)</label>
                      <input
                        type="url"
                        value={bookForm.linkUrl || ''}
                        onChange={(e) => setBookForm({ ...bookForm, linkUrl: e.target.value })}
                        placeholder="https://amazon.com/... or https://boniphacendege.com/study-guide"
                        className="w-full px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white focus:border-[#3dff8f] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-[#9fbfae] block mb-1">Button Title / Action Label</label>
                      <input
                        type="text"
                        value={bookForm.linkTitle || ''}
                        onChange={(e) => setBookForm({ ...bookForm, linkTitle: e.target.value })}
                        placeholder="e.g. Order Print Copy / Access Study Guide"
                        className="w-full px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white focus:border-[#3dff8f] focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const url = bookForm.linkUrl || 'https://';
                      const label = bookForm.linkTitle || 'Companion Resource';
                      setBookForm((prev) => ({
                        ...prev,
                        description: (prev.description || '') + `\n\n[${label}](${url})`
                      }));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#0a351e] border border-[#3dff8f]/40 text-[#3dff8f] text-[10px] font-mono hover:bg-[#3dff8f]/20 cursor-pointer"
                  >
                    + Insert Markdown Link into Book Description
                  </button>
                </div>
              </div>

              {/* Chapter Composition Suite */}
              <div className="p-5 rounded-2xl bg-[#010a05] border border-[#3dff8f]/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-mono font-bold text-[#fff1b8] uppercase flex items-center gap-2">
                      <BookMarked className="w-4 h-4 text-[#3dff8f]" />
                      <span>Chapter Writing &amp; Direct Composition Suite</span>
                    </h5>
                    <p className="text-xs text-[#9fbfae]">
                      Directly compose, edit, format, and reorder full chapters for this publication.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddChapter}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#3dff8f] text-black hover:bg-[#34db7a] flex items-center gap-1.5 cursor-pointer shadow-md self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Chapter</span>
                  </button>
                </div>

                {/* Chapter List with Direct Inline Writing Studio */}
                <div className="space-y-3">
                  {(bookForm.chapters || []).map((ch, idx) => {
                    const isEditingThisChapter = editingChapterIdx === idx;
                    return (
                      <div
                        key={ch.id || idx}
                        className={`rounded-2xl border transition-all ${
                          isEditingThisChapter
                            ? 'bg-[#010904] border-2 border-[#f0b92e] shadow-[0_0_25px_rgba(240,185,46,0.25)] p-4 sm:p-5'
                            : 'p-3.5 bg-[#02140b] border-white/10 hover:border-[#3dff8f]/40'
                        }`}
                      >
                        {/* Chapter Summary Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-mono text-[#f0b92e] font-bold">
                              Chapter {ch.chapterNumber || idx + 1}
                            </div>
                            <div className="text-xs sm:text-sm font-bold text-[#f4fff8] truncate">{ch.title}</div>
                            {ch.subtitle && <div className="text-[11px] text-[#9fbfae] italic truncate">{ch.subtitle}</div>}
                            <div className="text-[10px] font-mono text-[#3dff8f] mt-1 flex items-center gap-2">
                              <span>{(ch.content || '').trim().split(/\s+/).filter(Boolean).length} words</span>
                              <span>•</span>
                              <span>~{Math.max(1, Math.ceil(((ch.content || '').trim().split(/\s+/).filter(Boolean).length) / 200))} min read</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveChapter(idx, 'up')}
                              disabled={idx === 0}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-[#9fbfae] disabled:opacity-30 cursor-pointer"
                              title="Move Up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveChapter(idx, 'down')}
                              disabled={idx === (bookForm.chapters || []).length - 1}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-[#9fbfae] disabled:opacity-30 cursor-pointer"
                              title="Move Down"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (isEditingThisChapter) {
                                  setEditingChapterIdx(null);
                                  setChapterForm({});
                                } else {
                                  setEditingChapterIdx(idx);
                                  setChapterForm(ch);
                                }
                              }}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                                isEditingThisChapter
                                  ? 'bg-[#f0b92e] text-[#1a1200] border-[#f0b92e]'
                                  : 'bg-[#0a351e] text-[#3dff8f] border-[#3dff8f]/40 hover:bg-[#0d4728]'
                              }`}
                            >
                              {isEditingThisChapter ? 'Close Studio' : 'Write & Edit Text'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteChapter(idx)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-colors"
                              title="Delete Chapter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Chapter Writing Studio */}
                        {isEditingThisChapter && (
                          <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-in fade-in duration-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-mono text-[#3dff8f] block mb-1">Chapter Title *</label>
                                <input
                                  type="text"
                                  value={chapterForm.title || ''}
                                  onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                                  placeholder="e.g. The Theological Foundation of Design Beauty"
                                  className="w-full px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs sm:text-sm text-white focus:border-[#3dff8f] focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#9fbfae] block mb-1">Subtitle / Key Thesis</label>
                                <input
                                  type="text"
                                  value={chapterForm.subtitle || ''}
                                  onChange={(e) => setChapterForm({ ...chapterForm, subtitle: e.target.value })}
                                  placeholder="e.g. Why aesthetics are moral statements"
                                  className="w-full px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs sm:text-sm text-white focus:border-[#3dff8f] focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Markdown Toolbar */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => insertFormatting('**', '**')}
                                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 text-xs font-mono text-white flex items-center gap-1 cursor-pointer"
                                  >
                                    <Bold className="w-3 h-3" />
                                    <span>Bold</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertFormatting('*', '*')}
                                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 text-xs font-mono text-white flex items-center gap-1 cursor-pointer"
                                  >
                                    <Italic className="w-3 h-3" />
                                    <span>Italic</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertFormatting('\n\n## ', '\n')}
                                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 text-xs font-mono text-white cursor-pointer"
                                  >
                                    ## Heading
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertFormatting('\n\n> "', '"\n')}
                                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 text-xs font-mono text-white flex items-center gap-1 cursor-pointer"
                                  >
                                    <Quote className="w-3 h-3" />
                                    <span>Quote</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertFormatting('\n- ', '\n')}
                                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 text-xs font-mono text-white flex items-center gap-1 cursor-pointer"
                                  >
                                    <List className="w-3 h-3" />
                                    <span>List</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertFormatting('\n\n---\n\n')}
                                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 text-xs font-mono text-white cursor-pointer"
                                  >
                                    --- Divider
                                  </button>
                                </div>

                                <span className="text-[11px] font-mono text-[#3dff8f]">
                                  {(chapterForm.content || '').trim().split(/\s+/).filter(Boolean).length} Words · ~{Math.max(1, Math.ceil(((chapterForm.content || '').trim().split(/\s+/).filter(Boolean).length) / 200))} min read
                                </span>
                              </div>

                              <textarea
                                id="chapter-content-textarea"
                                rows={10}
                                value={chapterForm.content || ''}
                                onChange={(e) => setChapterForm({ ...chapterForm, content: e.target.value })}
                                placeholder="Write your chapter paragraphs, lessons, and thoughts directly here..."
                                className="w-full p-4 rounded-xl bg-[#021008] border border-white/20 text-xs sm:text-sm text-white font-mono leading-relaxed focus:border-[#3dff8f] focus:outline-none"
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingChapterIdx(null);
                                  setChapterForm({});
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-mono border border-white/20 text-[#9fbfae] hover:text-white cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveChapter}
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#3dff8f] text-black hover:bg-[#34db7a] cursor-pointer shadow-md flex items-center gap-1.5"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Chapter to Database &amp; Website</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Book Cover Image (Trade 1:1.44 Ratio) */}
          {activeEditorTab === 'cover' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-5 rounded-2xl bg-[#010904] border border-[#3dff8f]/40 space-y-4 shadow-[0_0_20px_rgba(61,255,143,0.1)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="text-sm font-mono font-bold text-[#fff1b8] uppercase flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#3dff8f]" />
                      <span>Upload Book Image &amp; Front Cover (Trade 1:1.44 Ratio)</span>
                    </h5>
                    <p className="text-xs text-[#9fbfae] mt-1">
                      Upload front cover artwork. Automatically formatted to reduced 1:1.44 ratio with realistic 3D spine and drop shadows.
                    </p>
                  </div>
                  {bookForm.coverImage && (
                    <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/40 shrink-0 self-start sm:self-auto font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(61,255,143,0.3)]">
                      <CheckCircle className="w-3.5 h-3.5 text-[#3dff8f]" />
                      <span>✓ Cover Attached</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Real-time 1:1.44 Ratio Preview */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-[#020b05] border border-white/10 shadow-inner">
                    <div className="text-xs font-mono text-[#f0b92e] mb-3 font-bold flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#f0b92e]" />
                      <span>Cover Preview</span>
                    </div>
                    <div
                      className="w-full max-w-[200px] rounded-r-2xl rounded-l-sm overflow-hidden border-2 border-[rgba(240,185,46,0.6)] shadow-[0_20px_45px_rgba(0,0,0,0.95),-8px_0_20px_rgba(0,0,0,0.85)] relative bg-[#020b05] aspect-[1/1.44] group/cover"
                      style={{ aspectRatio: '1 / 1.44' }}
                    >
                      {bookForm.coverImage ? (
                        <>
                          <img
                            src={formatTwoByThreeBookCover(bookForm.coverImage)}
                            alt="Cover Preview"
                            className="w-full h-full object-cover z-5"
                          />
                          {/* Realistic 3D Spine and Drop Shadows */}
                          <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/90 via-black/45 to-transparent pointer-events-none z-10" />
                          <div className="absolute inset-y-0 left-1 w-[1px] bg-white/25 pointer-events-none z-10" />
                          <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-black/40 to-transparent pointer-events-none z-10" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none z-10" />
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#9fbfae] text-xs p-4 text-center">
                          <BookOpen className="w-8 h-8 text-[#9fbfae]/50 mb-1" />
                          <span>No cover uploaded yet</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-[#3dff8f] mt-3 font-bold">
                      Trade 1:1.44 Ratio (Reduced Dimensions)
                    </span>
                  </div>

                  {/* Upload Controls & URL */}
                  <div className="md:col-span-8 space-y-4">
                    {/* Drag-and-drop / Browse Upload Box */}
                    <div className="p-6 rounded-2xl border-2 border-dashed border-[#3dff8f]/50 hover:border-[#3dff8f] bg-[#02140b] text-center space-y-3 transition-colors">
                      <div className="w-12 h-12 rounded-2xl bg-[#0a351e] border border-[#3dff8f]/50 flex items-center justify-center text-[#3dff8f] mx-auto shadow-md">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <h6 className="text-sm font-bold text-[#fff1b8]">Upload Front Cover Artwork</h6>
                        <p className="text-xs text-[#9fbfae] mt-0.5">
                          Drag and drop or click to upload PNG, JPG, or WebP. Automatically formatted to reduced 1:1.44 ratio with realistic 3D spine and drop shadows.
                        </p>
                      </div>

                      <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-[#01140a] bg-[#3dff8f] hover:bg-[#34db7a] cursor-pointer shadow-md transition-all active:scale-95">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingCover ? 'Uploading Cover to Firebase...' : 'Upload Book Cover Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCoverUpload}
                          disabled={uploadingCover}
                        />
                      </label>
                    </div>

                    {coverUploadMsg && (
                      <div className="p-3 rounded-xl bg-[#0a351e] border border-[#3dff8f]/40 text-xs font-mono text-[#3dff8f] flex items-center gap-2 animate-in fade-in">
                        <CheckCircle className="w-4 h-4 text-[#3dff8f] shrink-0" />
                        <span>{coverUploadMsg}</span>
                      </div>
                    )}

                    {/* Direct URL Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-[#9fbfae] block">
                        Or enter direct Book Cover Image URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={bookForm.coverImage || ''}
                          onChange={(e) => setBookForm({ ...bookForm, coverImage: e.target.value, aspectRatio: '1:1.44' })}
                          placeholder="https://images.unsplash.com/... or storage URL"
                          className="flex-1 px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white placeholder:text-gray-600 focus:border-[#3dff8f] focus:outline-none"
                        />
                        {bookForm.coverImage && (
                          <button
                            type="button"
                            onClick={() => setBookForm({ ...bookForm, coverImage: '' })}
                            className="px-3 py-2 rounded-xl text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Books PDF / Document Upload */}
          {activeEditorTab === 'pdf' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-5 rounded-2xl bg-[#010904] border border-[#f0b92e]/40 space-y-4">
                <div>
                  <h5 className="text-sm font-mono font-bold text-[#fff1b8] uppercase flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#f0b92e]" />
                    <span>Upload Book PDF Document to Firebase Storage</span>
                  </h5>
                  <p className="text-xs text-[#9fbfae] mt-1">
                    Upload your completed book pages as a PDF or ePub file. Readers will be able to download or sample it directly from the bookstore.
                  </p>
                </div>

                {/* PDF Upload Box */}
                <div className="p-6 rounded-2xl border-2 border-dashed border-[#f0b92e]/60 hover:border-[#f0b92e] bg-[#021208] text-center space-y-3 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-[#f0b92e]/20 border border-[#f0b92e]/40 flex items-center justify-center text-[#f0b92e] mx-auto shadow-md">
                    <FileDown className="w-6 h-6" />
                  </div>
                  <div>
                    <h6 className="text-sm font-bold text-[#fff1b8]">Select Book PDF / ePub File</h6>
                    <p className="text-xs text-[#9fbfae] mt-0.5">
                      Accepts .pdf, .epub, .doc, .docx files up to 50MB. Uploads securely to your cloud storage bucket.
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-[#1a1200] bg-gradient-to-r from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] cursor-pointer shadow-md transition-all active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingDoc ? 'Uploading PDF to Cloud Storage...' : 'Choose PDF Document'}</span>
                    <input
                      type="file"
                      accept=".pdf,.epub,.doc,.docx"
                      className="hidden"
                      onChange={handleDocUpload}
                      disabled={uploadingDoc}
                    />
                  </label>
                </div>

                {/* Upload Status & Details Card */}
                {(bookForm.pdfFileUrl || bookForm.downloadUrl) && (
                  <div className="p-4 rounded-xl bg-[#02140b] border border-[#3dff8f]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#3dff8f] animate-pulse" />
                        <span className="text-xs font-mono font-bold text-[#3dff8f]">
                          PDF Document Attached &amp; Live
                        </span>
                      </div>
                      <div className="text-xs font-mono text-[#f4fff8] truncate mt-1">
                        {docFileMeta?.name || bookForm.pdfFileUrl || bookForm.downloadUrl}
                      </div>
                      {docFileMeta?.size && (
                        <div className="text-[10px] font-mono text-[#9fbfae]">{docFileMeta.size}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={bookForm.pdfFileUrl || bookForm.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/40 hover:bg-[#0d4728] flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Download &amp; Test PDF</span>
                      </a>

                      <button
                        type="button"
                        onClick={handleRemoveDoc}
                        className="p-1.5 rounded-xl text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20"
                        title="Remove Attached PDF"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {docUploadMsg && (
                  <div className="p-3 rounded-xl bg-[#0a351e] border border-[#3dff8f]/40 text-xs font-mono text-[#3dff8f] flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#3dff8f]" />
                    <span>{docUploadMsg}</span>
                  </div>
                )}

                {/* Direct URL input fallback */}
                <div className="space-y-1 pt-2">
                  <label className="text-xs font-mono text-[#9fbfae] block">
                    Or Enter PDF / Document Download URL directly
                  </label>
                  <input
                    type="text"
                    value={bookForm.pdfFileUrl || bookForm.downloadUrl || ''}
                    onChange={(e) =>
                      setBookForm({
                        ...bookForm,
                        pdfFileUrl: e.target.value,
                        downloadUrl: e.target.value,
                        isDownloadable: Boolean(e.target.value)
                      })
                    }
                    placeholder="https://firebasestorage.googleapis.com/... or Google Drive link"
                    className="w-full px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white font-mono"
                  />
                </div>

                {/* Download & Purchase Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-white/10">
                  <div className="p-3.5 rounded-xl bg-[#021008] border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#fff1b8]">Free Gift Download</div>
                      <div className="text-[10px] text-[#9fbfae]">Badge as Free Gift on website</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(bookForm.isFreeDownload)}
                      onChange={(e) => setBookForm({ ...bookForm, isFreeDownload: e.target.checked })}
                      className="rounded accent-[#f0b92e] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#021008] border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#3dff8f]">Enable Download Button</div>
                      <div className="text-[10px] text-[#9fbfae]">Allow readers to download file</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(bookForm.isDownloadable ?? true)}
                      onChange={(e) => setBookForm({ ...bookForm, isDownloadable: e.target.checked })}
                      className="rounded accent-[#3dff8f] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono text-[#9fbfae] block mb-1">Price (USD) — 0 if Free</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bookForm.price || 0}
                      onChange={(e) => setBookForm({ ...bookForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* External Purchase Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-mono text-[#9fbfae] block mb-1">
                      WhatsApp Pre-filled Order Link
                    </label>
                    <input
                      type="text"
                      value={bookForm.externalBuyUrls?.directWhatsApp || ''}
                      onChange={(e) =>
                        setBookForm({
                          ...bookForm,
                          externalBuyUrls: {
                            ...(bookForm.externalBuyUrls || {}),
                            directWhatsApp: e.target.value
                          }
                        })
                      }
                      placeholder="https://wa.me/255655483255?text=..."
                      className="w-full px-3 py-1.5 rounded-xl bg-[#021008] border border-white/20 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#9fbfae] block mb-1">
                      Amazon / External Bookstore Link
                    </label>
                    <input
                      type="text"
                      value={bookForm.externalBuyUrls?.amazon || ''}
                      onChange={(e) =>
                        setBookForm({
                          ...bookForm,
                          externalBuyUrls: {
                            ...(bookForm.externalBuyUrls || {}),
                            amazon: e.target.value
                          }
                        })
                      }
                      placeholder="https://amazon.com/..."
                      className="w-full px-3 py-1.5 rounded-xl bg-[#021008] border border-white/20 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Specs & Publishing Settings */}
          {activeEditorTab === 'specs' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-5 rounded-2xl bg-[#010904] border border-white/10 space-y-4">
                <h5 className="text-sm font-mono font-bold text-[#fff1b8] uppercase flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#f0b92e]" />
                  <span>Publication Specifications &amp; Bookstore Visibility</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-mono text-[#9fbfae] block mb-1">ISBN Number</label>
                    <input
                      type="text"
                      value={bookForm.isbn || ''}
                      onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                      placeholder="978-9987-04-122-1"
                      className="w-full px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono text-[#9fbfae] block mb-1">Page Count</label>
                    <input
                      type="number"
                      value={bookForm.pagesCount || 196}
                      onChange={(e) => setBookForm({ ...bookForm, pagesCount: parseInt(e.target.value) || 196 })}
                      className="w-full px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono text-[#9fbfae] block mb-1">Language</label>
                    <input
                      type="text"
                      value={bookForm.language || 'English'}
                      onChange={(e) => setBookForm({ ...bookForm, language: e.target.value })}
                      placeholder="English / Swahili"
                      className="w-full px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Inside Reading Theme Design */}
                <div>
                  <label className="text-xs font-mono text-[#3dff8f] block mb-2">
                    Default Interior Typography Layout Design
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {[
                      { id: 'modern-editorial', label: 'Modern Editorial', desc: 'Serif elegance, drop-caps & gold borders' },
                      { id: 'midnight-emerald', label: 'Midnight Emerald', desc: 'Obsidian dark mode with emerald neon' },
                      { id: 'minimalist-sans', label: 'Minimalist Sans', desc: 'Swiss high-readability sans' },
                      { id: 'vintage-parchment', label: 'Vintage Parchment', desc: 'Warm literary parchment tones' },
                      { id: 'executive-dual', label: 'Executive Dual', desc: 'Two-column academic spread' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setBookForm({ ...bookForm, readingTheme: t.id as BookReadingTheme })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          bookForm.readingTheme === t.id
                            ? 'bg-[#0a351e] border-[#3dff8f] text-[#3dff8f] shadow-md'
                            : 'bg-white/5 border-white/10 text-[#9fbfae] hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold mb-0.5">{t.label}</div>
                        <div className="text-[10px] text-[#9fbfae] line-clamp-2">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-xs font-mono text-[#9fbfae] block mb-1">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Creativity, Leadership, African Innovation, AI"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#021008] border border-white/20 text-xs text-white"
                  />
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap items-center gap-6 p-4 rounded-2xl bg-[#021008] border border-white/10">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(bookForm.published ?? true)}
                      onChange={(e) => setBookForm({ ...bookForm, published: e.target.checked })}
                      className="rounded accent-[#3dff8f] w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold text-[#fff1b8]">Visible &amp; Published in Bookstore</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(bookForm.featured)}
                      onChange={(e) => setBookForm({ ...bookForm, featured: e.target.checked })}
                      className="rounded accent-[#f0b92e] w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold text-[#f0b92e]">Feature at Top of Bookstore Showcase (Spotlight)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Action Card Strictly Contained Inside Studio */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#020e06] border-2 border-[#3dff8f]/50 shadow-[0_8px_30px_rgba(0,0,0,0.85)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs font-mono text-[#3dff8f] font-bold">
                <Sparkles className="w-4 h-4 text-[#3dff8f]" />
                <span>
                  Press <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-white/20 text-[#fff1b8] font-bold">Ctrl + S</kbd> or click save to apply all changes to database &amp; website.
                </span>
              </div>
              <p className="text-[11px] text-[#9fbfae]">
                Applies all chapter writings, book covers, PDFs, and publishing visibility live to the website &amp; database.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
              {editingId && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ id: editingId, title: bookForm.title || 'Untitled Book', cover: bookForm.coverImage })}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete Publication</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-mono border border-white/20 text-[#9fbfae] hover:text-white cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBook}
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#01140a] bg-gradient-to-r from-[#3dff8f] to-[#10b981] hover:brightness-110 flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(61,255,143,0.5)] active:scale-95 transition-all"
              >
                <Save className="w-4 h-4 text-[#01140a]" />
                <span>Save &amp; Publish Book</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-view Content: Book Categories Management vs Publications Catalog */}
      {activeView === 'categories' ? (
        <div className="space-y-6 animate-in fade-in">
          {/* Add Category Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#010e06] border border-[#3dff8f]/40 shadow-xl space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#3dff8f]" />
                <h4 className="text-lg font-bold font-serif-heading text-[#fff1b8]">
                  Add New Book Category
                </h4>
              </div>
              <p className="text-xs text-[#9fbfae] mt-1">
                Create new genres and classifications for your books (e.g., Fiction, Academic, Design). These categories will instantly appear as filter pills in the bookstore.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddCategory();
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Enter category name (e.g., Fiction, Academic, Design)..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#010703] border border-white/20 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:border-[#3dff8f] focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-[#01140a] bg-gradient-to-r from-[#3dff8f] to-[#10b981] hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(61,255,143,0.35)] shrink-0 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </form>

            {/* Quick Suggested Categories */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <span className="text-[11px] font-mono text-[#9fbfae] block">
                Quick Add Suggestions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedCategories
                  .filter((sc) => !bookCategories.some((c) => c.toLowerCase() === sc.toLowerCase()))
                  .map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => handleAddCategory(sc)}
                      className="px-3 py-1 rounded-full text-xs font-mono bg-[#02180d] hover:bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/40 hover:border-[#3dff8f] cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{sc}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* List of Managed Categories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-[#9fbfae]">
              <span className="font-bold text-[#f4fff8]">
                Active Categories ({bookCategories.length})
              </span>
              <span>Click 'View Books' to filter catalog</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bookCategories.map((cat) => {
                const bookCount = books.filter((b) => b.category === cat).length;
                const isEditing = editingCatName === cat;

                return (
                  <div
                    key={cat}
                    className="p-4 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.2)] hover:border-[#3dff8f]/50 flex flex-col justify-between gap-3 transition-all"
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono text-[#3dff8f]">Rename Category:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={renameCatVal}
                            onChange={(e) => setRenameCatVal(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[#021008] border border-[#3dff8f] text-xs text-white"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleRenameCategory(cat);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameCategory(cat)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#3dff8f] text-black cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCatName(null)}
                            className="px-2.5 py-1.5 rounded-lg text-xs border border-white/20 text-[#9fbfae] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-[#0a351e] border border-[#3dff8f]/30 flex items-center justify-center text-[#3dff8f] shrink-0">
                              <Bookmark className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-sm font-bold text-[#f4fff8] truncate">
                                {cat}
                              </h5>
                              <span className="text-[11px] font-mono text-[#9fbfae]">
                                {bookCount} {bookCount === 1 ? 'Publication' : 'Publications'}
                              </span>
                            </div>
                          </div>

                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            bookCount > 0
                              ? 'bg-[#3dff8f]/10 text-[#3dff8f] border-[#3dff8f]/30'
                              : 'bg-white/5 text-[#9fbfae] border-white/10'
                          }`}>
                            {bookCount} Books
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs font-mono">
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryFilter(cat);
                              setActiveView('catalog');
                            }}
                            className="px-3 py-1 rounded-lg bg-[#02180d] hover:bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30 text-xs transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Books</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCatName(cat);
                                setRenameCatVal(cat);
                              }}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#9fbfae] hover:text-white border border-white/10 transition-colors cursor-pointer"
                              title="Rename Category"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteCatTarget(cat)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Publications List & Catalog Management */
        <div className="space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#010904] border border-white/10">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#3dff8f] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search publications by title, excerpt, author, or tags..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white placeholder:text-gray-500 focus:border-[#3dff8f] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto select-none no-scrollbar">
              {['All', ...bookCategories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#3dff8f] text-black font-bold'
                      : 'bg-[#021008] text-[#9fbfae] border border-white/10 hover:border-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setActiveView('categories')}
                className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-[#f0b92e] bg-[#f0b92e]/10 border border-[#f0b92e]/30 hover:bg-[#f0b92e]/20 transition-all cursor-pointer flex items-center gap-1 shrink-0 ml-1 shadow-sm"
                title="Manage Book Categories"
              >
                <Bookmark className="w-3.5 h-3.5 text-[#f0b92e]" />
                <span>+ Categories</span>
              </button>
            </div>
          </div>

        {/* Book Cards List */}
        {filteredBooks.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#9fbfae] rounded-2xl bg-[#010904] border border-white/10 space-y-2">
            <BookOpen className="w-10 h-10 text-[#9fbfae]/40 mx-auto" />
            <p>No publications found matching your search or filters.</p>
            <button
              onClick={handleCreateBook}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#3dff8f] text-black cursor-pointer"
            >
              Write First Book
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.2)] hover:border-[#3dff8f]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* 1:1.44 Ratio Thumbnail with realistic 3D spine and drop shadow */}
                  <div
                    className="w-14 sm:w-16 rounded-r-xl rounded-l-sm overflow-hidden border border-[rgba(240,185,46,0.4)] shadow-[0_8px_18px_rgba(0,0,0,0.85),-4px_0_10px_rgba(0,0,0,0.7)] bg-[#020b05] shrink-0 relative aspect-[1/1.44] group/thumb"
                    style={{ aspectRatio: '1 / 1.44' }}
                    title={book.coverImage ? 'Cover Preview (Trade 1:1.44 Ratio)' : 'No cover yet'}
                  >
                    <img
                      src={formatTwoByThreeBookCover(book.coverImage)}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Realistic 3D spine and drop shadow highlight */}
                    <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
                    <div className="absolute inset-y-0 left-0.5 w-[1px] bg-white/20 pointer-events-none z-10" />

                    {quickUploadingBookId === book.id && (
                      <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-[#3dff8f] p-1 text-center z-20">
                        <Loader2 className="w-4 h-4 animate-spin text-[#3dff8f] mb-0.5" />
                        <span className="text-[7px] font-mono leading-tight text-white font-bold">Uploading Cover...</span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f0b92e]/15 text-[#f0b92e] font-bold">
                        {book.category}
                      </span>
                      <span className="text-[10px] font-mono text-[#3dff8f] bg-[#0a351e] px-2 py-0.5 rounded-full border border-[#3dff8f]/30">
                        Trade 1:1.44 Ratio
                      </span>
                      {book.coverImage && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30 font-bold flex items-center gap-1 shadow-sm">
                          <CheckCircle className="w-2.5 h-2.5 text-[#3dff8f]" />
                          <span>✓ Cover Attached</span>
                        </span>
                      )}
                      {(book.featured || book.id === 'book-4') && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-gradient-to-r from-[#02180d] to-[#042816] text-[#3dff8f] border border-[#3dff8f]/50 font-bold uppercase flex items-center gap-1 shadow-sm">
                          <BestBookBadgeIcon size={11} glow={false} />
                          <span>Author Masterpiece</span>
                        </span>
                      )}
                      {book.isFreeDownload ? (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#3dff8f]/20 text-[#3dff8f] font-bold">
                          Free Gift
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-bold">
                          ${book.price}
                        </span>
                      )}
                      {(book.pdfFileUrl || book.downloadUrl) && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                          <Download className="w-2.5 h-2.5" />
                          <span>PDF Attached</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-bold font-serif-heading text-[#fff1b8] truncate mt-1">
                      {book.title}
                    </h4>

                    <p className="text-xs text-[#9fbfae] line-clamp-1 mt-0.5 italic">
                      &ldquo;{book.excerpt}&rdquo;
                    </p>

                    <div className="text-[10px] font-mono text-[#9fbfae] flex items-center gap-3 mt-1.5 flex-wrap">
                      <span>Author: <strong className="text-white">{book.author?.name}</strong></span>
                      <span>•</span>
                      <span>Pages: <strong className="text-white">{book.pagesCount || 196}</strong></span>
                      <span>•</span>
                      <span>Chapters: <strong className="text-[#3dff8f]">{(book.chapters || []).length}</strong></span>
                      <span>•</span>
                      <span>Reads: <strong className="text-white">{book.readsCount || 0}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Row Actions: Quick Upload Cover, Edit, Delete, Test PDF */}
                {/* Row Actions: 4 Suite (Upload Cover, Download, Edit Book, Delete) */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                  {/* 1. Quick Upload Cover Button */}
                  <label
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 ${
                      quickUploadingBookId === book.id
                        ? 'bg-[#0a351e] text-[#3dff8f] border-[#3dff8f] animate-pulse cursor-wait'
                        : 'bg-[#01140a] text-[#3dff8f] border-[#3dff8f]/40 hover:bg-[#0a351e]'
                    }`}
                    title="Upload Book Image & Front Cover (Trade 1:1.44 Ratio)"
                  >
                    {quickUploadingBookId === book.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3dff8f]" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-[#3dff8f]" />
                    )}
                    <span>{quickUploadingBookId === book.id ? 'Uploading Cover to Firebase...' : 'Upload Cover'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={quickUploadingBookId === book.id}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleQuickUploadCover(book.id, f);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  {/* 2. Download Book (PDF or Manuscript) */}
                  <button
                    type="button"
                    onClick={() => handleDownloadBookAdmin(book)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-mono bg-white/5 hover:bg-white/15 text-[#9fbfae] hover:text-white border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                    title={book.pdfFileUrl || book.downloadUrl ? 'Download attached PDF' : 'Download manuscript text file'}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  {/* 3. Edit Book Button */}
                  <button
                    type="button"
                    onClick={() => handleEditBook(book)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/40 hover:bg-[#0d4728] flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Book</span>
                  </button>

                  {/* 4. Delete Book Button */}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ id: book.id, title: book.title, cover: book.coverImage })}
                    className="p-2 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 cursor-pointer transition-colors"
                    title="Delete Publication"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Delete Book Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#02100a] border border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.35)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            {deleteTarget.cover && (
              <div
                className="w-16 rounded-xl overflow-hidden border border-white/20 mx-auto aspect-[1/1.44] shadow-md"
                style={{ aspectRatio: '1 / 1.44' }}
              >
                <img
                  src={formatTwoByThreeBookCover(deleteTarget.cover)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h4 className="text-base font-bold text-[#fff1b8]">Delete Publication?</h4>
              <p className="text-xs text-[#9fbfae] mt-1 leading-relaxed">
                Are you sure you want to delete <span className="text-rose-300 font-bold">"{deleteTarget.title}"</span>? This will permanently remove it from your bookstore and cloud database.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-white/20 text-xs text-[#9fbfae] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteBook(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-all cursor-pointer shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {deleteCatTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#02100a] border border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.35)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#fff1b8]">Delete Category?</h4>
              <p className="text-xs text-[#9fbfae] mt-1 leading-relaxed">
                Are you sure you want to delete category <span className="text-rose-300 font-bold">"{deleteCatTarget}"</span>? Any books currently assigned to this category will be safely reassigned to the default category.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCatTarget(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-white/20 text-xs text-[#9fbfae] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(deleteCatTarget)}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-all cursor-pointer shadow-lg"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
const ExperienceTab: React.FC<{
  data: PortfolioDatabase;
  onSave: (msg: string) => void;
  onRefresh: () => void;
}> = ({ data, onSave, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<WorkExperienceItem>>({});
  const [previewExp, setPreviewExp] = useState<WorkExperienceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const handleCreate = () => {
    const newItem: WorkExperienceItem = {
      id: 'exp-' + Date.now(),
      roleTitle: 'Graphic & Web Designer',
      employer: 'Freelance & Independent Client Work',
      employmentType: 'freelance',
      startDate: '2022',
      endDate: 'Present',
      current: true,
      location: 'Dodoma CBD Tanzania',
      description: 'Describe your role and key accomplishments...',
      responsibilities: ['Created visual identities for clients', 'Designed responsive websites'],
      published: true,
      order: data.workExperience.length + 1
    };

    portfolioStorage.updateData((prev) => ({
      ...prev,
      workExperience: [newItem, ...prev.workExperience]
    }));

    setEditingId(newItem.id);
    setForm(newItem);
    onSave('Experience entry created');
    onRefresh();
  };

  const handleSave = () => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((w) => (w.id === editingId ? ({ ...w, ...form } as WorkExperienceItem) : w))
    }));
    setEditingId(null);
    onSave('Experience updated successfully');
    onRefresh();
  };

  const handleDelete = (id: string) => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.filter((w) => w.id !== id)
    }));
    if (previewExp?.id === id) setPreviewExp(null);
    onSave('Experience deleted successfully');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(240,185,46,0.2)]">
        <div>
          <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
            Work Experience Management ({data.workExperience.length})
          </h3>
          <p className="text-xs text-[#9fbfae]">
            Support for freelance, independent, contract, and employment history.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#1a1200]" />
          <span>Add Experience</span>
        </button>
      </div>

      {editingId && (
        <div className="p-5 rounded-2xl bg-[#010e06] border border-[#3dff8f] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Role Title</label>
              <input
                type="text"
                value={form.roleTitle || ''}
                onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Employer / Client</label>
              <input
                type="text"
                value={form.employer || ''}
                onChange={(e) => setForm({ ...form, employer: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Start Date</label>
              <input
                type="text"
                value={form.startDate || ''}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">End Date</label>
              <input
                type="text"
                value={form.endDate || ''}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Type</label>
              <select
                value={form.employmentType || 'freelance'}
                onChange={(e) => setForm({ ...form, employmentType: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              >
                <option value="freelance">Freelance</option>
                <option value="contract">Contract</option>
                <option value="independent">Independent</option>
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#9fbfae] block mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-xs text-[#9fbfae] block mb-1">Responsibilities (one per line)</label>
            <textarea
              rows={3}
              value={(form.responsibilities || []).join('\n')}
              onChange={(e) =>
                setForm({
                  ...form,
                  responsibilities: e.target.value.split('\n').filter(Boolean)
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditingId(null)} className="px-4 py-1.5 rounded-lg text-xs border border-white/20">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#3dff8f] text-black">
              Save Entry
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {data.workExperience.map((exp) => (
          <div
            key={exp.id}
            className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.18)] hover:border-[#3dff8f]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-[#fff1b8]">{exp.roleTitle}</span>
                <span className="text-xs text-[#9fbfae]">· {exp.employer}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0a351e] text-[#3dff8f]">
                  {exp.employmentType}
                </span>
                {!exp.published && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300">
                    Draft
                  </span>
                )}
              </div>
              <div className="text-xs text-[#3dff8f] font-mono mt-1">
                {exp.startDate} – {exp.endDate} {exp.location ? `· ${exp.location}` : ''}
              </div>
              {exp.description && (
                <p className="text-xs text-[#9fbfae] mt-1.5 line-clamp-1">{exp.description}</p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
              <button
                onClick={() => setPreviewExp(exp)}
                className="p-2 rounded-xl text-xs text-[#3dff8f] bg-[#3dff8f]/10 hover:bg-[#3dff8f]/20 border border-[#3dff8f]/30 transition-all cursor-pointer flex items-center gap-1"
                title="View Full Experience Details & Preview"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">View</span>
              </button>
              <button
                onClick={() => {
                  setEditingId(exp.id);
                  setForm(exp);
                }}
                className="p-2 rounded-xl text-xs text-[#9fbfae] bg-white/5 hover:text-[#f0b92e] hover:border-[#f0b92e]/40 border border-white/10 transition-all cursor-pointer flex items-center gap-1"
                title="Edit Experience Entry"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">Edit</span>
              </button>
              <button
                onClick={() => setDeleteTarget({ id: exp.id, title: exp.roleTitle })}
                className="p-2 rounded-xl text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
                title="Delete Experience"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Experience Preview Modal */}
      {previewExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#010e06] border border-[#3dff8f] p-6 space-y-4 text-[#f4fff8] relative shadow-2xl">
            <button
              onClick={() => setPreviewExp(null)}
              className="absolute top-5 right-5 text-[#9fbfae] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30">
                {previewExp.employmentType}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f0b92e]/10 text-[#fff1b8]">
                {previewExp.startDate} – {previewExp.endDate}
              </span>
            </div>

            <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
              {previewExp.roleTitle}
            </h3>
            <div className="text-xs text-[#3dff8f] font-mono">
              {previewExp.employer} {previewExp.location ? `· ${previewExp.location}` : ''}
            </div>

            {previewExp.description && (
              <p className="text-xs sm:text-sm text-[#9fbfae] leading-relaxed p-3.5 rounded-xl bg-[#010904] border border-white/10">
                {previewExp.description}
              </p>
            )}

            {previewExp.responsibilities && previewExp.responsibilities.length > 0 && (
              <div>
                <span className="text-[10px] font-mono text-[#f0b92e] uppercase block mb-1.5">
                  Key Responsibilities:
                </span>
                <ul className="space-y-1.5 text-xs text-[#f4fff8]">
                  {previewExp.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#3dff8f]">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const toDel = previewExp;
                  setPreviewExp(null);
                  setDeleteTarget({ id: toDel.id, title: toDel.roleTitle });
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <button
                onClick={() => {
                  const toEdit = previewExp;
                  setPreviewExp(null);
                  setEditingId(toEdit.id);
                  setForm(toEdit);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#f0b92e] text-black cursor-pointer"
              >
                Edit Experience
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#02100a] border border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.35)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#fff1b8]">Delete Experience Entry?</h4>
              <p className="text-xs text-[#9fbfae] mt-1 leading-relaxed">
                Are you sure you want to delete <span className="text-rose-300 font-bold">"{deleteTarget.title}"</span>?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-white/20 text-xs text-[#9fbfae] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-all cursor-pointer shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-module: Education Tab                                                  */
/* -------------------------------------------------------------------------- */
const EducationTab: React.FC<{
  data: PortfolioDatabase;
  onSave: (msg: string) => void;
  onRefresh: () => void;
}> = ({ data, onSave, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<EducationItem>>({});
  const [previewEdu, setPreviewEdu] = useState<EducationItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const handleCreate = () => {
    const newItem: EducationItem = {
      id: 'edu-' + Date.now(),
      institution: 'University / Institute Name',
      qualification: 'Diploma / Degree',
      field: 'Design & Computing',
      startDate: '2020',
      endDate: '2023',
      description: '',
      published: true,
      order: data.education.length + 1
    };

    portfolioStorage.updateData((prev) => ({
      ...prev,
      education: [newItem, ...prev.education]
    }));

    setEditingId(newItem.id);
    setForm(newItem);
    onSave('Education entry created');
    onRefresh();
  };

  const handleSave = () => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      education: prev.education.map((e) => (e.id === editingId ? ({ ...e, ...form } as EducationItem) : e))
    }));
    setEditingId(null);
    onSave('Education updated');
    onRefresh();
  };

  const handleDelete = (id: string) => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id)
    }));
    if (previewEdu?.id === id) setPreviewEdu(null);
    onSave('Education deleted');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(240,185,46,0.2)]">
        <div>
          <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
            Education Management ({data.education.length})
          </h3>
          <p className="text-xs text-[#9fbfae]">
            Add or update academic institutions and qualifications.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#1a1200]" />
          <span>Add Education</span>
        </button>
      </div>

      {editingId && (
        <div className="p-5 rounded-2xl bg-[#010e06] border border-[#3dff8f] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Qualification</label>
              <input
                type="text"
                value={form.qualification || ''}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Institution</label>
              <input
                type="text"
                value={form.institution || ''}
                onChange={(e) => setForm({ ...form, institution: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Field / Major</label>
              <input
                type="text"
                value={form.field || ''}
                onChange={(e) => setForm({ ...form, field: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">Start Date</label>
              <input
                type="text"
                value={form.startDate || ''}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#9fbfae] block mb-1">End Date</label>
              <input
                type="text"
                value={form.endDate || ''}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#9fbfae] block mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditingId(null)} className="px-4 py-1.5 rounded-lg text-xs border border-white/20">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#3dff8f] text-black">
              Save Education
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {data.education.map((edu) => (
          <div
            key={edu.id}
            className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.18)] hover:border-[#3dff8f]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-[#fff1b8]">{edu.qualification}</span>
                <span className="text-xs text-[#9fbfae]">· {edu.institution}</span>
                {edu.field && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0a351e] text-[#3dff8f]">
                    {edu.field}
                  </span>
                )}
              </div>
              <div className="text-xs text-[#3dff8f] font-mono mt-1">
                {edu.startDate} – {edu.endDate}
              </div>
              {edu.description && (
                <p className="text-xs text-[#9fbfae] mt-1.5 line-clamp-1">{edu.description}</p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
              <button
                onClick={() => setPreviewEdu(edu)}
                className="p-2 rounded-xl text-xs text-[#3dff8f] bg-[#3dff8f]/10 hover:bg-[#3dff8f]/20 border border-[#3dff8f]/30 transition-all cursor-pointer flex items-center gap-1"
                title="View Full Education Details & Preview"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">View</span>
              </button>
              <button
                onClick={() => {
                  setEditingId(edu.id);
                  setForm(edu);
                }}
                className="p-2 rounded-xl text-xs text-[#9fbfae] bg-white/5 hover:text-[#f0b92e] hover:border-[#f0b92e]/40 border border-white/10 transition-all cursor-pointer flex items-center gap-1"
                title="Edit Education Entry"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">Edit</span>
              </button>
              <button
                onClick={() => setDeleteTarget({ id: edu.id, title: edu.qualification })}
                className="p-2 rounded-xl text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
                title="Delete Education"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Education Preview Modal */}
      {previewEdu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#010e06] border border-[#3dff8f] p-6 space-y-4 text-[#f4fff8] relative shadow-2xl">
            <button
              onClick={() => setPreviewEdu(null)}
              className="absolute top-5 right-5 text-[#9fbfae] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30">
              {previewEdu.startDate} – {previewEdu.endDate}
            </span>

            <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
              {previewEdu.qualification}
            </h3>
            <div className="text-xs text-[#3dff8f] font-mono">
              {previewEdu.institution} {previewEdu.field ? `(${previewEdu.field})` : ''}
            </div>

            {previewEdu.description && (
              <p className="text-xs sm:text-sm text-[#9fbfae] leading-relaxed p-3.5 rounded-xl bg-[#010904] border border-white/10">
                {previewEdu.description}
              </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const toDel = previewEdu;
                  setPreviewEdu(null);
                  setDeleteTarget({ id: toDel.id, title: toDel.qualification });
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <button
                onClick={() => {
                  const toEdit = previewEdu;
                  setPreviewEdu(null);
                  setEditingId(toEdit.id);
                  setForm(toEdit);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#f0b92e] text-black cursor-pointer"
              >
                Edit Education
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#02100a] border border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.35)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#fff1b8]">Delete Education Entry?</h4>
              <p className="text-xs text-[#9fbfae] mt-1 leading-relaxed">
                Are you sure you want to delete <span className="text-rose-300 font-bold">"{deleteTarget.title}"</span>?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-white/20 text-xs text-[#9fbfae] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-all cursor-pointer shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-module: Certifications & Achievements Tab                             */
/* -------------------------------------------------------------------------- */
const CertificationsTab: React.FC<{
  data: PortfolioDatabase;
  onSave: (msg: string) => void;
  onRefresh: () => void;
}> = ({ data, onSave, onRefresh }) => {
  const [newCert, setNewCert] = useState({ title: '', issuingOrg: '', date: '', credentialUrl: '' });
  const [newAch, setNewAch] = useState({ title: '', description: '', date: '' });
  const [previewCert, setPreviewCert] = useState<CertificationItem | null>(null);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [editCertForm, setEditCertForm] = useState<Partial<CertificationItem>>({});
  const [deleteCertTarget, setDeleteCertTarget] = useState<{ id: string; title: string } | null>(null);

  const [previewAch, setPreviewAch] = useState<AchievementItem | null>(null);
  const [editingAchId, setEditingAchId] = useState<string | null>(null);
  const [editAchForm, setEditAchForm] = useState<Partial<AchievementItem>>({});
  const [deleteAchTarget, setDeleteAchTarget] = useState<{ id: string; title: string } | null>(null);

  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCert.title.trim()) return;

    const certItem: CertificationItem = {
      id: 'cert-' + Date.now(),
      title: newCert.title,
      issuingOrg: newCert.issuingOrg,
      date: newCert.date || '2023',
      credentialUrl: newCert.credentialUrl || undefined,
      published: true,
      order: data.certifications.length + 1
    };

    portfolioStorage.updateData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, certItem]
    }));

    setNewCert({ title: '', issuingOrg: '', date: '', credentialUrl: '' });
    onSave('Certification added');
    onRefresh();
  };

  const handleSaveCertEdit = () => {
    if (!editCertForm.title?.trim()) return;
    portfolioStorage.updateData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((c) =>
        c.id === editingCertId ? ({ ...c, ...editCertForm } as CertificationItem) : c
      )
    }));
    setEditingCertId(null);
    onSave('Certification updated');
    onRefresh();
  };

  const handleDeleteCert = (id: string) => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((item) => item.id !== id)
    }));
    if (previewCert?.id === id) setPreviewCert(null);
    onSave('Certification deleted');
    onRefresh();
  };

  const handleAddAch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAch.title.trim()) return;

    const achItem: AchievementItem = {
      id: 'ach-' + Date.now(),
      title: newAch.title,
      description: newAch.description,
      date: newAch.date || '2024',
      published: true,
      order: data.achievements.length + 1
    };

    portfolioStorage.updateData((prev) => ({
      ...prev,
      achievements: [...prev.achievements, achItem]
    }));

    setNewAch({ title: '', description: '', date: '' });
    onSave('Achievement added');
    onRefresh();
  };

  const handleSaveAchEdit = () => {
    if (!editAchForm.title?.trim()) return;
    portfolioStorage.updateData((prev) => ({
      ...prev,
      achievements: prev.achievements.map((a) =>
        a.id === editingAchId ? ({ ...a, ...editAchForm } as AchievementItem) : a
      )
    }));
    setEditingAchId(null);
    onSave('Achievement updated');
    onRefresh();
  };

  const handleDeleteAch = (id: string) => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((item) => item.id !== id)
    }));
    if (previewAch?.id === id) setPreviewAch(null);
    onSave('Achievement deleted');
    onRefresh();
  };

  return (
    <div className="space-y-8">
      {/* Certifications */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
            Certifications & Verified Credentials ({data.certifications.length})
          </h3>
          <p className="text-xs text-[#9fbfae]">
            Document verified certifications and technical achievements.
          </p>
        </div>

        <form onSubmit={handleAddCert} className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.2)] space-y-3">
          <span className="text-xs font-mono font-bold text-[#f0b92e] block">Add New Certificate</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Certificate Title *"
              value={newCert.title}
              onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
              className="px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white"
              required
            />
            <input
              type="text"
              placeholder="Issuing Organization (e.g. Google, Coursera)..."
              value={newCert.issuingOrg}
              onChange={(e) => setNewCert({ ...newCert, issuingOrg: e.target.value })}
              className="px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Date / Year (e.g. 2023)..."
              value={newCert.date}
              onChange={(e) => setNewCert({ ...newCert, date: e.target.value })}
              className="px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white"
            />
            <input
              type="url"
              placeholder="Verification URL (optional)..."
              value={newCert.credentialUrl}
              onChange={(e) => setNewCert({ ...newCert, credentialUrl: e.target.value })}
              className="px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] cursor-pointer"
          >
            Add Certificate
          </button>
        </form>

        {/* Edit Certificate Form */}
        {editingCertId && (
          <div className="p-5 rounded-2xl bg-[#010e06] border border-[#3dff8f] space-y-3">
            <div className="flex justify-between items-center text-xs font-mono text-[#3dff8f]">
              <span>Editing Certificate</span>
              <button onClick={() => setEditingCertId(null)} className="text-[#9fbfae] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={editCertForm.title || ''}
                onChange={(e) => setEditCertForm({ ...editCertForm, title: e.target.value })}
                className="px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
              <input
                type="text"
                value={editCertForm.issuingOrg || ''}
                onChange={(e) => setEditCertForm({ ...editCertForm, issuingOrg: e.target.value })}
                className="px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={editCertForm.date || ''}
                onChange={(e) => setEditCertForm({ ...editCertForm, date: e.target.value })}
                className="px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
              <input
                type="url"
                value={editCertForm.credentialUrl || ''}
                onChange={(e) => setEditCertForm({ ...editCertForm, credentialUrl: e.target.value })}
                className="px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
                placeholder="Verification URL"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditingCertId(null)} className="px-3 py-1.5 rounded-lg text-xs border border-white/20">
                Cancel
              </button>
              <button onClick={handleSaveCertEdit} className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#3dff8f] text-black">
                Save Changes
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {data.certifications.map((c) => (
            <div
              key={c.id}
              className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.18)] hover:border-[#3dff8f]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all"
            >
              <div>
                <strong className="text-sm text-[#fff1b8] block">{c.title}</strong>
                <span className="text-[11px] text-[#3dff8f] font-mono mt-0.5 block">
                  {c.issuingOrg} · {c.date}
                </span>
                {c.credentialUrl && (
                  <span className="text-[10px] text-[#9fbfae] truncate block max-w-md mt-1">
                    Verified Credential URL configured
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                <button
                  onClick={() => setPreviewCert(c)}
                  className="p-2 rounded-xl text-xs text-[#3dff8f] bg-[#3dff8f]/10 hover:bg-[#3dff8f]/20 border border-[#3dff8f]/30 transition-all cursor-pointer flex items-center gap-1"
                  title="View Certificate Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px]">View</span>
                </button>
                <button
                  onClick={() => {
                    setEditingCertId(c.id);
                    setEditCertForm(c);
                  }}
                  className="p-2 rounded-xl text-xs text-[#9fbfae] bg-white/5 hover:text-[#f0b92e] hover:border-[#f0b92e]/40 border border-white/10 transition-all cursor-pointer flex items-center gap-1"
                  title="Edit Certificate"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px]">Edit</span>
                </button>
                <button
                  onClick={() => setDeleteCertTarget({ id: c.id, title: c.title })}
                  className="p-2 rounded-xl text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
                  title="Delete Certificate"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px]">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#010e06] border border-[#3dff8f] p-6 space-y-4 text-[#f4fff8] relative shadow-2xl">
            <button
              onClick={() => setPreviewCert(null)}
              className="absolute top-5 right-5 text-[#9fbfae] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30">
              Verified Credential
            </span>

            <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
              {previewCert.title}
            </h3>
            <div className="text-xs text-[#3dff8f] font-mono">
              {previewCert.issuingOrg} · {previewCert.date}
            </div>

            {previewCert.credentialUrl && (
              <a
                href={previewCert.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#021008] border border-[rgba(240,185,46,0.3)] text-xs text-[#f0b92e] hover:underline"
              >
                <span>Open Verification Credential Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const toDel = previewCert;
                  setPreviewCert(null);
                  setDeleteCertTarget({ id: toDel.id, title: toDel.title });
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = previewCert;
                    setPreviewCert(null);
                    setEditingCertId(toEdit.id);
                    setEditCertForm(toEdit);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#f0b92e] text-black cursor-pointer"
                >
                  Edit Certificate
                </button>
                <button
                  onClick={() => setPreviewCert(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono border border-white/20 text-[#9fbfae]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cert Delete Confirmation Modal */}
      {deleteCertTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#02100a] border border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.35)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#fff1b8]">Delete Certificate?</h4>
              <p className="text-xs text-[#9fbfae] mt-1 leading-relaxed">
                Are you sure you want to delete <span className="text-rose-300 font-bold">"{deleteCertTarget.title}"</span>?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCertTarget(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-white/20 text-xs text-[#9fbfae] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteCert(deleteCertTarget.id);
                  setDeleteCertTarget(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-all cursor-pointer shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <div>
          <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
            Achievements & Milestones ({data.achievements.length})
          </h3>
          <p className="text-xs text-[#9fbfae]">
            Key creative achievements, client delivery milestones, and recognitions.
          </p>
        </div>

        <form onSubmit={handleAddAch} className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-white/10 space-y-3">
          <span className="text-xs font-mono font-bold text-[#3dff8f] block">Add New Achievement</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Achievement Title *"
              value={newAch.title}
              onChange={(e) => setNewAch({ ...newAch, title: e.target.value })}
              className="px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white"
              required
            />
            <input
              type="text"
              placeholder="Date / Year..."
              value={newAch.date}
              onChange={(e) => setNewAch({ ...newAch, date: e.target.value })}
              className="px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white"
            />
          </div>
          <textarea
            rows={2}
            placeholder="Description of milestone or accomplishment..."
            value={newAch.description}
            onChange={(e) => setNewAch({ ...newAch, description: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#f0b92e] text-black cursor-pointer"
          >
            Add Achievement
          </button>
        </form>

        {/* Edit Achievement Form */}
        {editingAchId && (
          <div className="p-5 rounded-2xl bg-[#010e06] border border-[#f0b92e] space-y-3">
            <div className="flex justify-between items-center text-xs font-mono text-[#f0b92e]">
              <span>Editing Achievement</span>
              <button onClick={() => setEditingAchId(null)} className="text-[#9fbfae] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={editAchForm.title || ''}
                onChange={(e) => setEditAchForm({ ...editAchForm, title: e.target.value })}
                className="px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
              <input
                type="text"
                value={editAchForm.date || ''}
                onChange={(e) => setEditAchForm({ ...editAchForm, date: e.target.value })}
                className="px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <textarea
              rows={2}
              value={editAchForm.description || ''}
              onChange={(e) => setEditAchForm({ ...editAchForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditingAchId(null)} className="px-3 py-1.5 rounded-lg text-xs border border-white/20">
                Cancel
              </button>
              <button onClick={handleSaveAchEdit} className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#f0b92e] text-black">
                Save Achievement
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {data.achievements.map((a) => (
            <div
              key={a.id}
              className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.18)] hover:border-[#3dff8f]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all"
            >
              <div>
                <strong className="text-sm text-[#fff1b8] block">{a.title}</strong>
                <span className="text-[11px] text-[#3dff8f] font-mono mt-0.5 block">{a.date}</span>
                <p className="text-xs text-[#9fbfae] mt-1 line-clamp-2">{a.description}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                <button
                  onClick={() => setPreviewAch(a)}
                  className="p-2 rounded-xl text-xs text-[#3dff8f] bg-[#3dff8f]/10 hover:bg-[#3dff8f]/20 border border-[#3dff8f]/30 transition-all cursor-pointer flex items-center gap-1"
                  title="View Achievement Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px]">View</span>
                </button>
                <button
                  onClick={() => {
                    setEditingAchId(a.id);
                    setEditAchForm(a);
                  }}
                  className="p-2 rounded-xl text-xs text-[#9fbfae] bg-white/5 hover:text-[#f0b92e] hover:border-[#f0b92e]/40 border border-white/10 transition-all cursor-pointer flex items-center gap-1"
                  title="Edit Achievement"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px]">Edit</span>
                </button>
                <button
                  onClick={() => setDeleteAchTarget({ id: a.id, title: a.title })}
                  className="p-2 rounded-xl text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
                  title="Delete Achievement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px]">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Preview Modal */}
      {previewAch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#010e06] border border-[#f0b92e] p-6 space-y-4 text-[#f4fff8] relative shadow-2xl">
            <button
              onClick={() => setPreviewAch(null)}
              className="absolute top-5 right-5 text-[#9fbfae] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#f0b92e]/15 text-[#f0b92e] border border-[#f0b92e]/30">
              Milestone & Achievement
            </span>

            <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
              {previewAch.title}
            </h3>
            <div className="text-xs text-[#3dff8f] font-mono">
              Date: {previewAch.date}
            </div>

            <p className="text-xs sm:text-sm text-[#9fbfae] leading-relaxed p-3.5 rounded-xl bg-[#010904] border border-white/10">
              {previewAch.description}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const toDel = previewAch;
                  setPreviewAch(null);
                  setDeleteAchTarget({ id: toDel.id, title: toDel.title });
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = previewAch;
                    setPreviewAch(null);
                    setEditingAchId(toEdit.id);
                    setEditAchForm(toEdit);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#f0b92e] text-black cursor-pointer"
                >
                  Edit Achievement
                </button>
                <button
                  onClick={() => setPreviewAch(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono border border-white/20 text-[#9fbfae]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ach Delete Confirmation Modal */}
      {deleteAchTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#02100a] border border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.35)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#fff1b8]">Delete Achievement?</h4>
              <p className="text-xs text-[#9fbfae] mt-1 leading-relaxed">
                Are you sure you want to delete <span className="text-rose-300 font-bold">"{deleteAchTarget.title}"</span>?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteAchTarget(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-white/20 text-xs text-[#9fbfae] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteAch(deleteAchTarget.id);
                  setDeleteAchTarget(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-all cursor-pointer shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-module: Workflow Tab                                                   */
/* -------------------------------------------------------------------------- */
const WorkflowTab: React.FC<{
  data: PortfolioDatabase;
  onSave: (msg: string) => void;
  onRefresh: () => void;
}> = ({ data, onSave, onRefresh }) => {
  const [stages, setStages] = useState(data.workflowStages);
  const [previewStage, setPreviewStage] = useState<AIWorkflowStage | null>(null);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editStageForm, setEditStageForm] = useState<Partial<AIWorkflowStage>>({});
  const [deleteStageTarget, setDeleteStageTarget] = useState<{ id: string; title: string } | null>(null);

  const handleSaveStageEdit = () => {
    if (!editStageForm.title?.trim()) return;
    const updated = stages.map((s) =>
      s.id === editingStageId ? ({ ...s, ...editStageForm } as AIWorkflowStage) : s
    );
    setStages(updated);
    portfolioStorage.updateData((prev) => ({ ...prev, workflowStages: updated }));
    setEditingStageId(null);
    onSave('Workflow stage updated');
    onRefresh();
  };

  const handleDeleteStage = (id: string) => {
    const updated = stages.filter((s) => s.id !== id);
    setStages(updated);
    portfolioStorage.updateData((prev) => ({ ...prev, workflowStages: updated }));
    if (previewStage?.id === id) setPreviewStage(null);
    onSave('Workflow stage removed');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
          AI-Assisted Workflow Stages ({stages.length})
        </h3>
        <p className="text-xs text-[#9fbfae]">
          Human-in-the-loop creative and development methodology stages.
        </p>
      </div>

      {editingStageId && (
        <div className="p-5 rounded-2xl bg-[#010e06] border border-[#3dff8f] space-y-3">
          <div className="flex justify-between items-center text-xs font-mono text-[#3dff8f]">
            <span>Editing Workflow Stage {editStageForm.stageNumber}</span>
            <button onClick={() => setEditingStageId(null)} className="text-[#9fbfae] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-[#9fbfae] block mb-1">Stage Title</label>
              <input
                type="text"
                value={editStageForm.title || ''}
                onChange={(e) => setEditStageForm({ ...editStageForm, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-[#9fbfae] block mb-1">Subtitle</label>
              <input
                type="text"
                value={editStageForm.subtitle || ''}
                onChange={(e) => setEditStageForm({ ...editStageForm, subtitle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#9fbfae] block mb-1">Description</label>
            <textarea
              rows={2}
              value={editStageForm.description || ''}
              onChange={(e) => setEditStageForm({ ...editStageForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10px] text-[#f0b92e] uppercase block mb-1">Human Role</label>
              <input
                type="text"
                value={editStageForm.humanRole || ''}
                onChange={(e) => setEditStageForm({ ...editStageForm, humanRole: e.target.value })}
                className="w-full px-3 py-1.5 rounded bg-[#010904] border border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#3dff8f] uppercase block mb-1">AI Role</label>
              <input
                type="text"
                value={editStageForm.aiRole || ''}
                onChange={(e) => setEditStageForm({ ...editStageForm, aiRole: e.target.value })}
                className="w-full px-3 py-1.5 rounded bg-[#010904] border border-white/10 text-xs text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditingStageId(null)} className="px-3.5 py-1.5 rounded-lg text-xs border border-white/20">
              Cancel
            </button>
            <button onClick={handleSaveStageEdit} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#3dff8f] text-black">
              Save Stage
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {stages.map((stg) => (
          <div
            key={stg.id}
            className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.18)] hover:border-[#3dff8f]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-[#0a351e] text-[#3dff8f] font-mono font-bold flex items-center justify-center text-xs shrink-0">
                  {stg.stageNumber}
                </span>
                <div>
                  <h4 className="font-bold text-sm text-[#fff1b8]">{stg.title}</h4>
                  <span className="text-[11px] text-[#9fbfae] font-mono">{stg.subtitle}</span>
                </div>
              </div>
              <p className="text-xs text-[#9fbfae] mt-2 line-clamp-2 pl-10">{stg.description}</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5 pl-10 sm:pl-0">
              <button
                onClick={() => setPreviewStage(stg)}
                className="p-2 rounded-xl text-xs text-[#3dff8f] bg-[#3dff8f]/10 hover:bg-[#3dff8f]/20 border border-[#3dff8f]/30 transition-all cursor-pointer flex items-center gap-1"
                title="View Stage Details"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">View</span>
              </button>
              <button
                onClick={() => {
                  setEditingStageId(stg.id);
                  setEditStageForm(stg);
                }}
                className="p-2 rounded-xl text-xs text-[#9fbfae] bg-white/5 hover:text-[#f0b92e] hover:border-[#f0b92e]/40 border border-white/10 transition-all cursor-pointer flex items-center gap-1"
                title="Edit Stage"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">Edit</span>
              </button>
              <button
                onClick={() => setDeleteStageTarget({ id: stg.id, title: stg.title })}
                className="p-2 rounded-xl text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
                title="Delete Stage"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Stage Preview Modal */}
      {previewStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#010e06] border border-[#3dff8f] p-6 space-y-4 text-[#f4fff8] relative shadow-2xl">
            <button
              onClick={() => setPreviewStage(null)}
              className="absolute top-5 right-5 text-[#9fbfae] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30">
              Stage {previewStage.stageNumber} of {stages.length}
            </span>

            <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
              {previewStage.title}
            </h3>
            <div className="text-xs text-[#f0b92e] font-mono">{previewStage.subtitle}</div>

            <p className="text-xs sm:text-sm text-[#9fbfae] leading-relaxed p-3.5 rounded-xl bg-[#010904] border border-white/10">
              {previewStage.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#010904] border border-white/10">
                <span className="text-[#f0b92e] block text-[10px] uppercase font-bold mb-1">Human Role:</span>
                <span className="text-[#f4fff8]">{previewStage.humanRole}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#010904] border border-white/10">
                <span className="text-[#3dff8f] block text-[10px] uppercase font-bold mb-1">AI Collaboration Role:</span>
                <span className="text-[#f4fff8]">{previewStage.aiRole}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const toDel = previewStage;
                  setPreviewStage(null);
                  setDeleteStageTarget({ id: toDel.id, title: toDel.title });
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = previewStage;
                    setPreviewStage(null);
                    setEditingStageId(toEdit.id);
                    setEditStageForm(toEdit);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#f0b92e] text-black cursor-pointer"
                >
                  Edit Stage
                </button>
                <button
                  onClick={() => setPreviewStage(null)}
                  className="px-4 py-1.5 rounded-xl text-xs font-mono border border-white/20 text-[#9fbfae]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteStageTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#02100a] border border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.35)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#fff1b8]">Delete Workflow Stage?</h4>
              <p className="text-xs text-[#9fbfae] mt-1 leading-relaxed">
                Are you sure you want to delete <span className="text-rose-300 font-bold">"{deleteStageTarget.title}"</span>?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteStageTarget(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-white/20 text-xs text-[#9fbfae] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteStage(deleteStageTarget.id);
                  setDeleteStageTarget(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-all cursor-pointer shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-module: Testimonials Tab                                               */
/* -------------------------------------------------------------------------- */
const TestimonialsTab: React.FC<{
  data: PortfolioDatabase;
  onSave: (msg: string) => void;
  onRefresh: () => void;
}> = ({ data, onSave, onRefresh }) => {
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    role: '',
    organization: '',
    content: '',
    permissionToPublish: true
  });
  const [previewTest, setPreviewTest] = useState<TestimonialItem | null>(null);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [editTestForm, setEditTestForm] = useState<Partial<TestimonialItem>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimonial.name.trim() || !newTestimonial.content.trim()) return;

    const item: TestimonialItem = {
      id: 'test-' + Date.now(),
      name: newTestimonial.name,
      role: newTestimonial.role || 'Client',
      organization: newTestimonial.organization || '',
      content: newTestimonial.content,
      permissionToPublish: newTestimonial.permissionToPublish,
      published: true,
      order: data.testimonials.length + 1
    };

    portfolioStorage.updateData((prev) => ({
      ...prev,
      testimonials: [item, ...prev.testimonials]
    }));

    setNewTestimonial({ name: '', role: '', organization: '', content: '', permissionToPublish: true });
    onSave('Verified testimonial added');
    onRefresh();
  };

  const handleSaveTestEdit = () => {
    if (!editTestForm.name?.trim() || !editTestForm.content?.trim()) return;
    portfolioStorage.updateData((prev) => ({
      ...prev,
      testimonials: prev.testimonials.map((t) =>
        t.id === editingTestId ? ({ ...t, ...editTestForm } as TestimonialItem) : t
      )
    }));
    setEditingTestId(null);
    onSave('Testimonial updated');
    onRefresh();
  };

  const handleDelete = (id: string) => {
    portfolioStorage.updateData((prev) => ({
      ...prev,
      testimonials: prev.testimonials.filter((item) => item.id !== id)
    }));
    if (previewTest?.id === id) setPreviewTest(null);
    onSave('Testimonial deleted');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
          Testimonials & Client Endorsements ({data.testimonials.length})
        </h3>
        <p className="text-xs text-[#9fbfae]">
          Strict requirement: Only verified, authorized client feedback should be published.
        </p>
      </div>

      <form onSubmit={handleAdd} className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.2)] space-y-3 max-w-2xl">
        <span className="text-xs font-mono font-bold text-[#f0b92e] block">Add Verified Testimonial</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Person's Name *"
            value={newTestimonial.name}
            onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
            className="px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white"
            required
          />
          <input
            type="text"
            placeholder="Role / Title..."
            value={newTestimonial.role}
            onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
            className="px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white"
          />
          <input
            type="text"
            placeholder="Company / Organization..."
            value={newTestimonial.organization}
            onChange={(e) => setNewTestimonial({ ...newTestimonial, organization: e.target.value })}
            className="px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white"
          />
        </div>

        <textarea
          rows={3}
          placeholder="Verified testimonial quote..."
          value={newTestimonial.content}
          onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
          className="w-full px-3 py-2 rounded-xl bg-[#021008] border border-white/20 text-xs text-white"
          required
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
            <input
              type="checkbox"
              checked={newTestimonial.permissionToPublish}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, permissionToPublish: e.target.checked })}
              className="accent-[#3dff8f]"
            />
            <span>I have verified permission to publish this testimonial</span>
          </label>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] cursor-pointer"
          >
            Add Testimonial
          </button>
        </div>
      </form>

      {/* Edit Testimonial Form */}
      {editingTestId && (
        <div className="p-5 rounded-2xl bg-[#010e06] border border-[#3dff8f] space-y-3 max-w-2xl">
          <div className="flex justify-between items-center text-xs font-mono text-[#3dff8f]">
            <span>Editing Testimonial</span>
            <button onClick={() => setEditingTestId(null)} className="text-[#9fbfae] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={editTestForm.name || ''}
              onChange={(e) => setEditTestForm({ ...editTestForm, name: e.target.value })}
              className="px-3 py-1.5 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
            />
            <input
              type="text"
              value={editTestForm.role || ''}
              onChange={(e) => setEditTestForm({ ...editTestForm, role: e.target.value })}
              className="px-3 py-1.5 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
            />
            <input
              type="text"
              value={editTestForm.organization || ''}
              onChange={(e) => setEditTestForm({ ...editTestForm, organization: e.target.value })}
              className="px-3 py-1.5 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
            />
          </div>
          <textarea
            rows={3}
            value={editTestForm.content || ''}
            onChange={(e) => setEditTestForm({ ...editTestForm, content: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-[#010904] border border-white/20 text-xs text-white"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditingTestId(null)} className="px-3 py-1.5 rounded-lg text-xs border border-white/20">
              Cancel
            </button>
            <button onClick={handleSaveTestEdit} className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#3dff8f] text-black">
              Save Changes
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {data.testimonials.map((t) => (
          <div
            key={t.id}
            className="p-4 sm:p-5 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.18)] hover:border-[#3dff8f]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-[#fff1b8]">{t.name}</span>
                <span className="text-xs text-[#9fbfae]">({t.role} · {t.organization})</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0a351e] text-[#3dff8f]">
                  {t.permissionToPublish ? 'Verified & Authorized' : 'Pending Authorization'}
                </span>
                {!t.published && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300">
                    Draft
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9fbfae] mt-1.5 italic line-clamp-2">"{t.content}"</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
              <button
                onClick={() => setPreviewTest(t)}
                className="p-2 rounded-xl text-xs text-[#3dff8f] bg-[#3dff8f]/10 hover:bg-[#3dff8f]/20 border border-[#3dff8f]/30 transition-all cursor-pointer flex items-center gap-1"
                title="View Full Testimonial & Preview"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">View</span>
              </button>
              <button
                onClick={() => {
                  setEditingTestId(t.id);
                  setEditTestForm(t);
                }}
                className="p-2 rounded-xl text-xs text-[#9fbfae] bg-white/5 hover:text-[#f0b92e] hover:border-[#f0b92e]/40 border border-white/10 transition-all cursor-pointer flex items-center gap-1"
                title="Edit Testimonial"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">Edit</span>
              </button>
              <button
                onClick={() => setDeleteTarget({ id: t.id, name: t.name })}
                className="p-2 rounded-xl text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
                title="Delete Testimonial"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Testimonial Preview Modal */}
      {previewTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#010e06] border border-[#3dff8f] p-6 space-y-4 text-[#f4fff8] relative shadow-2xl">
            <button
              onClick={() => setPreviewTest(null)}
              className="absolute top-5 right-5 text-[#9fbfae] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30">
              {previewTest.permissionToPublish ? 'Verified & Authorized Endorsement' : 'Pending Authorization'}
            </span>

            <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
              {previewTest.name}
            </h3>
            <div className="text-xs text-[#3dff8f] font-mono">
              {previewTest.role} · {previewTest.organization}
            </div>

            <p className="text-xs sm:text-sm text-[#f4fff8] leading-relaxed p-4 rounded-xl bg-[#010904] border border-white/10 italic">
              "{previewTest.content}"
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const toDel = previewTest;
                  setPreviewTest(null);
                  setDeleteTarget({ id: toDel.id, name: toDel.name });
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = previewTest;
                    setPreviewTest(null);
                    setEditingTestId(toEdit.id);
                    setEditTestForm(toEdit);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#f0b92e] text-black cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    portfolioStorage.updateData((prev) => ({
                      ...prev,
                      testimonials: prev.testimonials.map((item) =>
                        item.id === previewTest.id ? { ...item, published: !item.published } : item
                      )
                    }));
                    setPreviewTest({ ...previewTest, published: !previewTest.published });
                    onSave('Publish status updated');
                    onRefresh();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer ${
                    previewTest.published ? 'bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {previewTest.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{previewTest.published ? 'Live' : 'Draft'}</span>
                </button>

                <button
                  onClick={() => setPreviewTest(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono border border-white/20 text-[#9fbfae]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#02100a] border border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.35)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#fff1b8]">Delete Testimonial?</h4>
              <p className="text-xs text-[#9fbfae] mt-1 leading-relaxed">
                Are you sure you want to delete testimonial from <span className="text-rose-300 font-bold">"{deleteTarget.name}"</span>?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-white/20 text-xs text-[#9fbfae] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-all cursor-pointer shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-module: Inquiries Inbox Tab                                            */
/* -------------------------------------------------------------------------- */
const InquiriesTab: React.FC<{
  data: PortfolioDatabase;
  onSave: (msg: string) => void;
  onRefresh: () => void;
}> = ({ data, onSave, onRefresh }) => {
  const [previewInquiry, setPreviewInquiry] = useState<ContactInquiry | null>(null);

  const handleDelete = (id: string) => {
    if (confirm('Delete this client inquiry?')) {
      portfolioStorage.updateData((prev) => ({
        ...prev,
        inquiries: prev.inquiries.filter((inq) => inq.id !== id)
      }));
      if (previewInquiry?.id === id) setPreviewInquiry(null);
      onSave('Inquiry removed');
      onRefresh();
    }
  };

  const handleOpenPreview = (inq: ContactInquiry) => {
    setPreviewInquiry(inq);
    if (!inq.read) {
      portfolioStorage.updateData((prev) => ({
        ...prev,
        inquiries: prev.inquiries.map((i) => (i.id === inq.id ? { ...i, read: true } : i))
      }));
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
          Client Inquiries Inbox ({data.inquiries.length})
        </h3>
        <p className="text-xs text-[#9fbfae]">
          Messages received through the Contact & Hire Me form are securely logged here.
        </p>
      </div>

      {data.inquiries.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#010904] border border-white/10 text-center text-xs text-[#9fbfae]">
          No messages received yet. Submit a test inquiry on the Contact section!
        </div>
      ) : (
        <div className="space-y-3">
          {data.inquiries.map((inq) => (
            <div
              key={inq.id}
              className={`p-4 sm:p-5 rounded-2xl bg-[#010904] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                inq.read ? 'border-[rgba(240,185,46,0.18)]' : 'border-[#3dff8f] shadow-[0_0_15px_-4px_#3dff8f]'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-sm text-[#fff1b8]">{inq.name}</strong>
                  <span className="text-xs text-[#3dff8f]">({inq.email})</span>
                  {inq.organization && (
                    <span className="text-xs text-[#9fbfae]">· {inq.organization}</span>
                  )}
                  {!inq.read && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3dff8f] text-black font-bold">
                      New
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] font-mono mt-1.5">
                  <span className="px-2 py-0.5 rounded bg-[#0a351e] text-[#3dff8f]">
                    {inq.serviceRequired}
                  </span>
                  {inq.budgetRange && (
                    <span className="px-2 py-0.5 rounded bg-[#f0b92e]/20 text-[#fff1b8]">
                      Budget: {inq.budgetRange}
                    </span>
                  )}
                  <span className="text-[10px] text-[#9fbfae] self-center">
                    {new Date(inq.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-[#f4fff8]/80 mt-2 line-clamp-1 italic">
                  "{inq.message}"
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                <button
                  onClick={() => handleOpenPreview(inq)}
                  className="p-2 rounded-xl text-xs text-[#3dff8f] bg-[#3dff8f]/10 hover:bg-[#3dff8f]/20 border border-[#3dff8f]/30 transition-all cursor-pointer flex items-center gap-1"
                  title="View & Read Full Message"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px]">View</span>
                </button>
                <a
                  href={`mailto:${inq.email}?subject=${encodeURIComponent(`Re: Your Project Inquiry - ${inq.serviceRequired}`)}`}
                  className="p-2 rounded-xl text-xs text-[#9fbfae] bg-white/5 hover:text-[#f0b92e] hover:border-[#f0b92e]/40 border border-white/10 transition-all cursor-pointer flex items-center gap-1"
                  title="Reply via Email"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px]">Reply</span>
                </a>
                <button
                  onClick={() => handleDelete(inq.id)}
                  className="p-2 rounded-xl text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
                  title="Delete Inquiry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px]">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inquiry Detail Preview Modal */}
      {previewInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#010e06] border border-[#3dff8f] p-6 space-y-4 text-[#f4fff8] relative shadow-2xl">
            <button
              onClick={() => setPreviewInquiry(null)}
              className="absolute top-5 right-5 text-[#9fbfae] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30">
              Client Project Inquiry
            </span>

            <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
              {previewInquiry.name}
            </h3>
            <div className="text-xs text-[#3dff8f] font-mono">
              Email: {previewInquiry.email} {previewInquiry.organization ? `· ${previewInquiry.organization}` : ''}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#010904] border border-white/10">
                <span className="text-[#9fbfae] block text-[10px]">Service:</span>
                <span className="text-[#fff1b8] font-bold">{previewInquiry.serviceRequired}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#010904] border border-white/10">
                <span className="text-[#9fbfae] block text-[10px]">Budget & Timeline:</span>
                <span className="text-[#f0b92e] font-bold">{previewInquiry.budgetRange || 'Flexible'} · {previewInquiry.preferredTimeline || 'TBD'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#010904] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-[#9fbfae] block">Message:</span>
              <p className="text-xs sm:text-sm text-[#f4fff8] whitespace-pre-line leading-relaxed">
                {previewInquiry.message}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-[10px] font-mono text-[#9fbfae]">
                {new Date(previewInquiry.timestamp).toLocaleString()}
              </span>

              <div className="flex gap-2">
                <a
                  href={`mailto:${previewInquiry.email}?subject=${encodeURIComponent(`Re: Your Project Inquiry - ${previewInquiry.serviceRequired}`)}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[#1a1200]" />
                  <span>Send Email Reply</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-module: Backup & Restore Tab                                           */
/* -------------------------------------------------------------------------- */
const BackupTab: React.FC<{
  data: PortfolioDatabase;
  onSave: (msg: string) => void;
  onRefresh: () => void;
}> = ({ data, onSave, onRefresh }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = () => {
    const jsonStr = portfolioStorage.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boniphace-portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onSave('Backup JSON downloaded successfully');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (portfolioStorage.importData(content)) {
        onSave('Data successfully restored from backup file!');
        onRefresh();
      } else {
        alert('Invalid backup file. Could not restore.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Reset portfolio to initial authentic defaults? This will erase custom additions unless backed up.')) {
      portfolioStorage.resetToDefaults();
      onSave('Reset to defaults complete');
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
          Backup & Disaster Recovery
        </h3>
        <p className="text-xs text-[#9fbfae]">
          Export your entire portfolio data, images, and projects into a portable JSON file. Restore it anytime on any browser.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.2)] space-y-3">
        <h4 className="text-sm font-bold text-[#fff1b8]">1. Export Portfolio Backup</h4>
        <p className="text-xs text-[#9fbfae]">
          Download a complete snapshot of all services, skills, projects, and bio settings.
        </p>
        <button
          onClick={handleDownloadBackup}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#1a1200]" />
          <span>Download Backup (.JSON)</span>
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-[#010904] border border-[rgba(240,185,46,0.2)] space-y-3">
        <h4 className="text-sm font-bold text-[#fff1b8]">2. Restore from Backup File</h4>
        <p className="text-xs text-[#9fbfae]">
          Select a previously exported portfolio JSON file to instantly restore.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="text-xs text-[#9fbfae] file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#0a351e] file:text-[#3dff8f] file:text-xs cursor-pointer"
        />
      </div>

      <div className="p-5 rounded-2xl bg-[#010904] border border-[#3dff8f]/30 space-y-3 shadow-[0_0_15px_-5px_rgba(61,255,143,0.2)]">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#3dff8f] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3dff8f] animate-pulse" />
            3. Cloud Firestore Synchronization
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/40">
            Realtime Persistent
          </span>
        </div>
        <p className="text-xs text-[#9fbfae] leading-relaxed">
          Your portfolio data and updates are synchronized in real-time with Google Cloud Firestore (<span className="text-white font-mono text-[11px]">ai-studio-boniphacendegecr-b14a97e1-585e-4414-8cde-8bb199c69be5</span>) under project <span className="text-white font-mono text-[11px]">gen-lang-client-0507302465</span>.
        </p>
        <button
          onClick={async () => {
            const success = await portfolioStorage.syncNowToFirestore();
            if (success) {
              onSave('Portfolio data successfully pushed to Cloud Firestore!');
            } else {
              onSave('Saved locally. Ensure you are signed into Firebase with an admin account.');
            }
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-[#3dff8f] hover:bg-[#34db7a] flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(61,255,143,0.35)] active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-black" />
          <span>Sync Now to Cloud Firestore</span>
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
        <h4 className="text-sm font-bold text-rose-300">4. Reset to Verified Clean Defaults</h4>
        <p className="text-xs text-[#9fbfae]">
          Resets all sections to Boniphace Ndege's default creative portfolio schema.
        </p>
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-900/60 text-rose-200 hover:bg-rose-900 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Clean Defaults</span>
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-module: Security Tab                                                   */
/* -------------------------------------------------------------------------- */
const SecurityTab: React.FC<{ onSave: (msg: string) => void }> = ({ onSave }) => {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [testCode, setTestCode] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  const dbData = portfolioStorage.getData();
  const initialTwoFA = dbData.admin2FA || {
    enabled: true,
    secret: DEFAULT_ADMIN_2FA_SECRET,
    method: 'authenticator' as const,
    backupCodes: ['849201', '593810', '204859', '739104', '482019', '918273'],
    recoveryEmail: 'bishboniphace.ndege@gmail.com'
  };

  const [twoFA, setTwoFA] = useState(initialTwoFA);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState(initialTwoFA.recoveryEmail || 'bishboniphace.ndege@gmail.com');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  const handleSaveRecoveryEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    const trimmed = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    portfolioStorage.updateAdmin2FA({ recoveryEmail: trimmed });
    setTwoFA((prev) => ({ ...prev, recoveryEmail: trimmed }));
    setIsEditingEmail(false);
    setEmailSuccess(`Primary 2FA Email updated to ${trimmed}! Verification codes will now be dispatched here.`);
    onSave(`Primary 2FA Email updated to ${trimmed} and saved to database.`);
    setTimeout(() => setEmailSuccess(''), 6000);
  };

  const handleGenerateNewBackupCodes = () => {
    const newCodes = Array.from({ length: 6 }, () =>
      Math.floor(100000 + Math.random() * 900000).toString()
    );
    portfolioStorage.updateAdmin2FA({ backupCodes: newCodes });
    setTwoFA((prev) => ({ ...prev, backupCodes: newCodes }));
    onSave('Generated 6 new emergency 2FA backup codes!');
  };

  const newPassHarshness = detectPasswordHarshness(newPass);

  const handleChange = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPass.length < 8) {
      setError('To protect from hackers and scammers, passcode must be at least 8 characters long.');
      return;
    }

    if (newPassHarshness.score < 3) {
      setError('Harsh Password required: Include numbers, symbols, uppercase, and lowercase characters to protect from hackers and scammers.');
      return;
    }

    if (confirmPass && newPass !== confirmPass) {
      setError('New passcodes do not match.');
      return;
    }

    if (portfolioStorage.changePasscode(currentPass, newPass)) {
      onSave('Passcode updated and encrypted with salted SHA-256 successfully!');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setError('');
    } else {
      setError('Current passcode is incorrect. Passcode was not changed.');
    }
  };

  const handleTest2FACode = async () => {
    if (!testCode.trim()) return;
    const ok = await verifyTOTPCode(testCode.trim(), twoFA.secret, twoFA.backupCodes);
    if (ok) {
      setTestResult('Valid 2FA Code! Google Authenticator is correctly synced.');
    } else {
      setTestResult('Invalid code. Check device time and ensure key is added in Google Authenticator.');
    }
    setTimeout(() => setTestResult(null), 5000);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(twoFA.secret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(twoFA.backupCodes.join('\n'));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2500);
  };

  const authUri = getGoogleAuthenticatorUri(twoFA.secret, 'evdr.boniphace.ndege');

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
          Admin Passcode & Two-Factor Authentication
        </h3>
        <p className="text-xs text-[#9fbfae]">
          Manage master admin credentials. Passcodes are cryptographically salted and hashed with SHA-256 internally.
        </p>
      </div>

      {/* 1. Change Passcode Card */}
      <div className="p-6 rounded-2xl bg-[#010904] border border-white/10 space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b border-white/10">
          <Key className="w-5 h-5 text-[#f0b92e]" />
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Change Admin Passcode</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/30">
                Anti-Hacker Guard
              </span>
            </h4>
            <p className="text-xs text-[#9fbfae]">Passwords hidden by default in secure dots with real-time Harsh strength detection.</p>
          </div>
        </div>

        <form onSubmit={handleChange} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#9fbfae]">Current Passcode</label>
              <span className="text-[10px] text-[#9fbfae] font-mono">Hidden</span>
            </div>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Enter current admin passcode"
                className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-[#021008] border border-white/20 text-xs text-white focus:border-[#3dff8f] focus:outline-none font-mono tracking-wider"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9fbfae] hover:text-[#fff1b8] p-1 cursor-pointer"
                title={showCurrent ? 'Hide passcode' : 'Show passcode'}
              >
                {showCurrent ? <EyeOff className="w-4 h-4 text-[#f0b92e]" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[#9fbfae]">New Passcode</label>
                <span className="text-[10px] text-[#9fbfae] font-mono">Min 8 chars</span>
              </div>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-[#021008] border border-white/20 text-xs text-white focus:border-[#3dff8f] focus:outline-none font-mono tracking-wider"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9fbfae] hover:text-[#fff1b8] p-1 cursor-pointer"
                  title={showNew ? 'Hide passcode' : 'Show passcode'}
                >
                  {showNew ? <EyeOff className="w-4 h-4 text-[#f0b92e]" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[#9fbfae]">Confirm New Passcode</label>
                <span className="text-[10px] text-[#9fbfae] font-mono">Match check</span>
              </div>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-[#021008] border border-white/20 text-xs text-white focus:border-[#3dff8f] focus:outline-none font-mono tracking-wider"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9fbfae] hover:text-[#fff1b8] p-1 cursor-pointer"
                  title={showConfirm ? 'Hide passcode' : 'Show passcode'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4 text-[#f0b92e]" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Live Harsh Password Detection Panel */}
          {newPass.length > 0 && (
            <div className="p-3 rounded-xl bg-[#011409] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[#9fbfae] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#3dff8f]" />
                  <span>Detected Harshness:</span>
                </span>
                <span
                  className="font-mono font-bold px-2.5 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: `${newPassHarshness.color}25`,
                    color: newPassHarshness.color,
                    border: `1px solid ${newPassHarshness.color}80`
                  }}
                >
                  {newPassHarshness.label} {newPassHarshness.isHarsh ? '🛡️ (Harsh Protected)' : ''}
                </span>
              </div>

              {/* 4-segment strength bar */}
              <div className="grid grid-cols-4 gap-1.5 h-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: step <= newPassHarshness.score ? newPassHarshness.color : '#082515'
                    }}
                  />
                ))}
              </div>

              {/* Security criteria checklist */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 text-[11px] font-mono">
                <div className={`flex items-center gap-1.5 ${newPassHarshness.checks.minLength ? 'text-[#3dff8f]' : 'text-[#9fbfae]'}`}>
                  <span>{newPassHarshness.checks.minLength ? '✓' : '○'}</span>
                  <span>8+ Characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${newPassHarshness.checks.hasUppercase ? 'text-[#3dff8f]' : 'text-[#9fbfae]'}`}>
                  <span>{newPassHarshness.checks.hasUppercase ? '✓' : '○'}</span>
                  <span>Uppercase Letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${newPassHarshness.checks.hasNumber ? 'text-[#3dff8f]' : 'text-[#9fbfae]'}`}>
                  <span>{newPassHarshness.checks.hasNumber ? '✓' : '○'}</span>
                  <span>Number (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${newPassHarshness.checks.hasSpecialChar ? 'text-[#3dff8f]' : 'text-[#9fbfae]'}`}>
                  <span>{newPassHarshness.checks.hasSpecialChar ? '✓' : '○'}</span>
                  <span>Special Symbol (!@#$)</span>
                </div>
              </div>

              <p className="text-[11px] text-[#9fbfae] font-mono leading-relaxed pt-1 border-t border-white/5">
                {newPassHarshness.feedback}
              </p>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 font-mono flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#f0b92e] to-[#b8841a] text-black hover:opacity-90 cursor-pointer transition-all flex items-center gap-2"
          >
            <span>Update & Encrypt Passcode⚡</span>
          </button>
        </form>
      </div>

      {/* 2. Two-Factor Authentication (2FA) Google Authenticator & Email Setup */}
      <div className="p-6 rounded-2xl bg-[#010904] border border-[#3dff8f]/30 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#3dff8f]" />
            <div>
              <h4 className="text-sm font-bold text-white">Two-Factor Authentication (2FA)</h4>
              <p className="text-xs text-[#9fbfae]">Active for all administrative logins</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#0f7a43]/30 text-[#3dff8f] border border-[#3dff8f]/40">
            Enforced (Admin Only)
          </span>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="text-[#9fbfae] block mb-1 font-mono">Google Authenticator Setup Key (Base32)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={twoFA.secret}
                className="flex-1 px-3 py-2 rounded-lg bg-[#021008] border border-white/20 font-mono text-xs text-[#3dff8f] select-all"
              />
              <button
                type="button"
                onClick={handleCopySecret}
                className="px-3 py-2 rounded-lg bg-[#0a351e] border border-[#3dff8f]/40 text-[#3dff8f] font-mono hover:bg-[#3dff8f]/20 cursor-pointer flex items-center gap-1.5"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#9fbfae] mt-1.5">
              Open Google Authenticator → Tap <strong>+</strong> → <strong>Enter a setup key</strong> → Paste key above with Account name <em>Boniphace Ndege</em>.
            </p>
          </div>

          <div>
            <label className="text-[#9fbfae] block mb-1 font-mono">Test Google Authenticator Code</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                value={testCode}
                onChange={(e) => setTestCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit code from app"
                className="w-48 px-3 py-2 rounded-lg bg-[#021008] border border-white/20 font-mono text-center text-xs text-white"
              />
              <button
                type="button"
                onClick={handleTest2FACode}
                className="px-4 py-2 rounded-lg bg-[#3dff8f] text-black font-bold text-xs hover:bg-white cursor-pointer transition-all"
              >
                Test Code
              </button>
            </div>
            {testResult && (
              <p className={`text-xs mt-1.5 font-mono ${testResult.startsWith('Valid') ? 'text-[#3dff8f]' : 'text-rose-400'}`}>
                {testResult}
              </p>
            )}
          </div>

          {/* 3. Primary 2FA Email & Recovery Address Card */}
          <div className="pt-2 border-t border-white/10 space-y-3">
            <div className="p-4 rounded-xl bg-[#021008] border border-white/10 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0a351e] border border-[#3dff8f]/40 flex items-center justify-center text-[#3dff8f] shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Primary 2FA Email</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]/30">
                        Active Dispatch
                      </span>
                    </h5>
                    <p className="text-[11px] text-[#9fbfae]">
                      Administrator verification codes and OTP tokens will be dispatched to this email.
                    </p>
                  </div>
                </div>

                {!isEditingEmail && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingEmail(true);
                      setEmailInput(twoFA.recoveryEmail);
                      setEmailError('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[#3dff8f] hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Change Email</span>
                  </button>
                )}
              </div>

              {!isEditingEmail ? (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-[#9fbfae]">Primary 2FA Email:</span>
                    <strong className="text-[#3dff8f] text-xs sm:text-sm tracking-wide">{twoFA.recoveryEmail}</strong>
                  </div>
                  <span className="text-[10px] font-mono text-[#9fbfae]/80">
                    Configurable anytime by admin
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSaveRecoveryEmail} className="space-y-2.5 pt-1">
                  <div>
                    <label className="text-[11px] font-mono text-[#9fbfae] block mb-1">
                      New Primary 2FA Email Address:
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        autoFocus
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          setEmailError('');
                        }}
                        placeholder="admin@example.com"
                        className="w-full pl-3 pr-28 py-2 rounded-lg bg-[#010904] border border-[#3dff8f]/50 text-xs text-white focus:outline-none focus:border-[#3dff8f] font-mono tracking-wide"
                      />
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingEmail(false);
                            setEmailInput(twoFA.recoveryEmail);
                            setEmailError('');
                          }}
                          className="px-2 py-1 rounded text-[11px] text-[#9fbfae] hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-2.5 py-1 rounded text-[11px] font-bold text-black bg-[#3dff8f] hover:bg-white cursor-pointer transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save Email</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {emailError && (
                    <p className="text-[11px] text-rose-400 font-mono flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>{emailError}</span>
                    </p>
                  )}
                </form>
              )}

              {emailSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 font-mono flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{emailSuccess}</span>
                </div>
              )}
            </div>

            {/* Emergency 2FA Backup Codes */}
            <div className="pt-2 border-t border-white/10 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-[#9fbfae] block text-xs font-mono font-bold">
                    Emergency 2FA Backup Codes
                  </label>
                  <p className="text-[11px] text-[#9fbfae]">
                    Use these 6-digit one-time codes if you cannot access your Authenticator app.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateNewBackupCodes}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#9fbfae] hover:text-white flex items-center gap-1 cursor-pointer transition-all"
                    title="Generate 6 new emergency backup codes"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyBackupCodes}
                    className="px-3 py-1.5 rounded-lg bg-[#0a351e] hover:bg-[#3dff8f]/20 border border-[#3dff8f]/40 text-xs text-[#3dff8f] font-mono flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    {copiedBackup ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBackup ? 'Codes Copied!' : 'Copy Backup Codes'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#021008] border border-white/10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 font-mono text-center text-[#fff1b8] text-xs">
                {twoFA.backupCodes.map((code, idx) => (
                  <div key={idx} className="p-2 rounded bg-black/50 border border-white/5 font-bold tracking-widest text-[#3dff8f]">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-between items-center text-[11px] text-[#9fbfae] pt-1">
                <span>
                  Primary 2FA Email: <strong className="text-white font-mono">{twoFA.recoveryEmail}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopyBackupCodes}
                  className="text-xs text-[#3dff8f] hover:underline flex items-center gap-1 cursor-pointer font-mono"
                >
                  {copiedBackup ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBackup ? 'Codes Copied!' : 'Copy Backup Codes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
