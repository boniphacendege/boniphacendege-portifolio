/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModalView } from '../../types/auth';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { formatAuthError, FriendlyAuthError } from '../../utils/authErrorHelper';
import { detectPasswordHarshness } from '../../utils/cryptoAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthModalView;
  onSuccess?: () => void;
  onOpenLegal?: (tab: 'privacy' | 'terms') => void;
  onOpenAdmin?: () => void;
  notice?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = 'login',
  onSuccess,
  onOpenLegal,
  onOpenAdmin,
  notice
}) => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, sendResetPasswordEmail } = useAuth();
  const [view, setView] = useState<AuthModalView>(initialView);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading & notification states
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<FriendlyAuthError | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAuthError(null);
    setSuccessMsg('');
  };

  const handleSwitchView = (newView: AuthModalView) => {
    resetForm();
    setView(newView);
  };

  // 1. Submit Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMsg('');

    if (!fullName.trim()) {
      setAuthError({ message: 'Please enter your full name.', isOperationNotAllowed: false });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setAuthError({ message: 'Please enter a valid email address.', isOperationNotAllowed: false });
      return;
    }
    if (password.length < 8) {
      setAuthError({ message: 'Password must be at least 8 characters long to shield against automated scanners.', isOperationNotAllowed: false });
      return;
    }
    const passHarshness = detectPasswordHarshness(password);
    if (passHarshness.score < 2) {
      setAuthError({
        message: 'To protect against hackers and scammers, choose a stronger password containing numbers, letters, or symbols.',
        isOperationNotAllowed: false
      });
      return;
    }
    if (password !== confirmPassword) {
      setAuthError({ message: 'Passwords do not match. Please verify your password confirmation.', isOperationNotAllowed: false });
      return;
    }

    setIsLoading(true);
    try {
      await registerWithEmail(fullName, email, password);
      setSuccessMsg('Account created successfully! Verification email has been dispatched.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        resetForm();
      }, 1500);
    } catch (err: any) {
      setAuthError(formatAuthError(err, 'register'));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setAuthError({ message: 'Please provide both your email and password.', isOperationNotAllowed: false });
      return;
    }

    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
      setSuccessMsg('Signed in successfully! Welcome back.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        resetForm();
      }, 1000);
    } catch (err: any) {
      setAuthError(formatAuthError(err, 'login'));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Google Sign In
  const handleGoogleLogin = async () => {
    setAuthError(null);
    setSuccessMsg('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
      setSuccessMsg('Google sign in verified!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        resetForm();
      }, 1000);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(formatAuthError(err, 'login'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Submit Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMsg('');

    if (!email.trim() || !email.includes('@')) {
      setAuthError({ message: 'Please enter the email address linked to your account.', isOperationNotAllowed: false });
      return;
    }

    setIsLoading(true);
    try {
      await sendResetPasswordEmail(email);
      setSuccessMsg(`Password reset link dispatched to ${email}. Check your inbox or spam folder.`);
    } catch (err: any) {
      setAuthError(formatAuthError(err, 'reset'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-root"
      data-unauth-exempt="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in"
    >
      <div
        className="relative w-full max-w-md bg-[#021008] card-neon-shallow rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(5,46,27,0.9)] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top green/gold neon glowing accent line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3dff8f] via-[#f0b92e] to-[#3dff8f] animate-pulse" />

        {/* Modal Top Bar */}
        <div className="px-5 sm:px-6 pt-5 pb-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0a351e] to-[#010904] border border-[#3dff8f]/40 flex items-center justify-center shadow-[0_0_10px_rgba(61,255,143,0.3)]">
              <ShieldCheck className="w-4 h-4 text-[#3dff8f]" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-sm sm:text-base font-bold text-[#f4fff8]">
                {view === 'login' && 'Sign In'}
                {view === 'register' && 'Create Your Account'}
                {view === 'forgot_password' && 'Reset Account Password'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#9fbfae] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Sign In vs Sign Up) */}
        {view !== 'forgot_password' && (
          <div className="grid grid-cols-2 p-1.5 mx-6 mt-4 bg-[#000603] border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => handleSwitchView('login')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                view === 'login'
                  ? 'bg-gradient-to-r from-[#052e1b] to-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/30 shadow-sm'
                  : 'text-[#9fbfae] hover:text-[#f4fff8]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleSwitchView('register')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                view === 'register'
                  ? 'bg-gradient-to-r from-[#052e1b] to-[#0a351e] text-[#f0b92e] border border-[#f0b92e]/30 shadow-sm'
                  : 'text-[#9fbfae] hover:text-[#f4fff8]'
              }`}
            >
              Sign Up / Register
            </button>
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* Status Notifications */}
          {authError && (
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                authError.isOperationNotAllowed
                  ? 'bg-amber-950/50 border-amber-500/50 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    authError.isOperationNotAllowed ? 'text-amber-400' : 'text-rose-400'
                  }`}
                />
                <div className="space-y-2 flex-1">
                  <p>{authError.message}</p>

                  {authError.isOperationNotAllowed && (
                    <div className="pt-1.5 flex flex-col sm:flex-row gap-2">
                      {authError.consoleUrl && (
                        <a
                          href={authError.consoleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-mono font-bold text-[11px] border border-amber-500/40 transition-colors"
                        >
                          <span>Open Firebase Console</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-bold text-[11px] border border-emerald-500/40 transition-colors cursor-pointer"
                      >
                        <span>Continue with Google</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* VIEW 1: SIGN IN */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-medium text-[#f4fff8] mb-1.5 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] font-mono text-[#9fbfae]">Required</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9fbfae]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#010904] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#3dff8f] focus:ring-1 focus:ring-[#3dff8f]/50 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#f4fff8]">Password</label>
                  <button
                    type="button"
                    onClick={() => handleSwitchView('forgot_password')}
                    className="text-[11px] font-mono text-[#f0b92e] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9fbfae]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#010904] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#3dff8f] focus:ring-1 focus:ring-[#3dff8f]/50 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9fbfae] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-[#001407] bg-gradient-to-r from-[#3dff8f] via-[#5effa3] to-[#2ecc71] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(61,255,143,0.35)] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#001407] border-t-transparent rounded-full animate-spin" />
                    <span>Signing in securely...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* VIEW 2: REGISTRATION */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-[#f4fff8] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9fbfae]" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Jonah"
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-2 bg-[#010904] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f0b92e] focus:ring-1 focus:ring-[#f0b92e]/50 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-medium text-[#f4fff8] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9fbfae]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2 bg-[#010904] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f0b92e] focus:ring-1 focus:ring-[#f0b92e]/50 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-[#f4fff8] mb-1">
                  Password (min. 8 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9fbfae]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2 bg-[#010904] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f0b92e] focus:ring-1 focus:ring-[#f0b92e]/50 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9fbfae] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Harsh Password Detection Indicator & Anti-Hacker Shield */}
                {password && (() => {
                  const regHarshness = detectPasswordHarshness(password);
                  return (
                    <div className="mt-2 p-2.5 rounded-xl bg-[#000603] border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <div className="flex items-center gap-1.5 text-[#9fbfae]">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#3dff8f]" />
                          <span>Harsh Password Detection:</span>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px]"
                          style={{
                            backgroundColor: `${regHarshness.color}20`,
                            color: regHarshness.color,
                            border: `1px solid ${regHarshness.color}50`,
                          }}
                        >
                          {regHarshness.label === 'Harsh' ? '🛡️ Harsh (Anti-Hacker)' : regHarshness.label}
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
                                regHarshness.score >= step ? regHarshness.color : 'rgba(255,255,255,0.08)',
                            }}
                          />
                        ))}
                      </div>

                      <p className="text-[10px] text-[#9fbfae] leading-snug pt-0.5">
                        {regHarshness.feedback}
                      </p>
                      <div className="text-[10px] text-[#9fbfae]/70 flex items-center justify-between pt-0.5 font-mono">
                        <span>• Hidden in password dots</span>
                        <span>• Anti-scammer protection</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-[#f4fff8] mb-1">
                  Confirm Password
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
                    className="w-full pl-10 pr-10 py-2 bg-[#010904] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f0b92e] focus:ring-1 focus:ring-[#f0b92e]/50 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9fbfae] hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-[#1a1200] bg-gradient-to-r from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(240,185,46,0.3)] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#1a1200] border-t-transparent rounded-full animate-spin" />
                    <span>Creating your profile...</span>
                  </>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Legal Terms & Privacy Agreement */}
              <p className="text-[11px] text-center text-[#9fbfae] pt-2 leading-relaxed">
                By creating an account, you accept our{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegal?.('terms')}
                  className="text-[#f0b92e] hover:underline font-medium cursor-pointer"
                >
                  Terms of Service
                </button>{' '}
                and acknowledge our{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegal?.('privacy')}
                  className="text-[#3dff8f] hover:underline font-medium cursor-pointer"
                >
                  Privacy Policy
                </button>
                .
              </p>
            </form>
          )}

          {/* VIEW 3: FORGOT PASSWORD */}
          {view === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-[#011409] border border-[#3dff8f]/20 text-xs text-[#9fbfae] flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-[#f0b92e] shrink-0" />
                <span>
                  Enter your registered email address and we'll send you a password reset link.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#f4fff8] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9fbfae]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#010904] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#3dff8f] focus:ring-1 focus:ring-[#3dff8f]/50 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSwitchView('login')}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-[#9fbfae] hover:text-white bg-white/5 border border-white/10 transition-colors"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-[#001407] bg-gradient-to-r from-[#3dff8f] to-[#5effa3] hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(61,255,143,0.3)] disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}

          {/* Sign in with Google Button */}
          {view !== 'forgot_password' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#010904] border border-white/15 hover:border-white/30 text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-3 transition-all hover:bg-white/5 active:scale-[0.99] cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{view === 'register' ? 'Sign up with Google' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
