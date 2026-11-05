import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  DownloadCloud,
  Smartphone,
  X,
  Share,
  PlusSquare,
  Sparkles,
  CheckCircle2,
  Zap,
  WifiOff,
  ArrowLeft
} from 'lucide-react';

interface PWAFullscreenViewProps {
  onClose: () => void;
}

export const PWAFullscreenView: React.FC<PWAFullscreenViewProps> = ({ onClose }) => {
  const { isInstallable, install, triggerShare } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => {
          setInstallSuccess(false);
          onClose();
        }, 3000);
        return;
      }
    }

    // If browser prompt is not primed (e.g. iOS Safari), trigger native share sheet
    const res = await triggerShare();
    if (res.method === 'copy') {
      setToastMessage('Portfolio link copied to clipboard!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleShareClick = async () => {
    const res = await triggerShare();
    if (res.method === 'copy') {
      setToastMessage('Portfolio link copied to clipboard!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 min-h-[100dvh] w-full bg-[#010603] text-[#f4fff8] flex flex-col items-center justify-center p-3.5 sm:p-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Progressive Web App Installation"
    >
      {/* Ambient background glow accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute w-[280px] sm:w-[400px] aspect-square rounded-full bg-radial from-[#3dff8f]/15 via-[#0f7a43]/08 to-transparent blur-3xl -top-10 -left-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute w-[280px] sm:w-[400px] aspect-square rounded-full bg-radial from-[#f0b92e]/12 to-transparent blur-3xl -bottom-10 -right-10"
      />

      {/* Main Centered PWA Card Container */}
      <div className="relative my-auto mx-auto w-full max-w-[92vw] sm:max-w-md rounded-[26px] bg-gradient-to-b from-[#02180d]/98 via-[#01140a]/98 to-[#010904]/98 border border-[rgba(61,255,143,0.4)] shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_25px_rgba(61,255,143,0.18)] p-5 sm:p-6 text-center flex flex-col items-center justify-center max-h-[90dvh] overflow-y-auto">
        {/* Top shining green neon accent line */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#3dff8f] to-transparent shadow-[0_0_10px_#3dff8f]"
        />

        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-2 rounded-xl text-[#9fbfae] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close PWA screen and return to website"
          title="Close and return to website"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Centered App Icon Emblem with Subtle Green Glow */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-[#010a05] border border-[#f0b92e]/45 p-2.5 shadow-[0_0_16px_rgba(61,255,143,0.25)] flex items-center justify-center">
            <Smartphone className="w-7 h-7 sm:w-8 sm:h-8 text-[#3dff8f]" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#f0b92e] text-[#010d06] flex items-center justify-center shadow-[0_0_8px_#f0b92e]">
            <Sparkles className="w-3 h-3 text-[#010d06]" />
          </div>
        </div>

        {/* Centered Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#3dff8f]/10 border border-[#3dff8f]/35 text-[10px] sm:text-[11px] font-mono font-semibold text-[#3dff8f]">
            <Zap className="w-3 h-3 text-[#f0b92e]" />
            <span>PROGRESSIVE WEB APP</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#f0b92e] px-2 py-0.5 rounded-full bg-[#f0b92e]/10 border border-[#f0b92e]/30 font-mono">
            <WifiOff className="w-2.5 h-2.5 text-[#f0b92e]" />
            <span>Offline Ready</span>
          </span>
        </div>

        {/* Centered Title */}
        <h2 className="font-serif-heading font-extrabold text-lg sm:text-xl text-[#fff1b8] text-center mb-1">
          Install Boniphace Ndege Portfolio App
        </h2>

        {/* Centered Subtitle */}
        <p className="text-xs text-[#a4c7b5] text-center max-w-xs mx-auto mb-4 leading-relaxed">
          Install directly on your home screen for instant full-screen access, fast loading, and offline browsing.
        </p>

        {/* Optional Toast Feedback if link copied */}
        {toastMessage && (
          <div className="w-full mb-3 p-2 rounded-xl bg-[#0a351e] border border-[#3dff8f]/50 text-xs text-[#3dff8f] font-mono animate-in fade-in">
            {toastMessage}
          </div>
        )}

        {/* Strictly Centered 3 Steps */}
        <div className="w-full space-y-2 mb-4 text-center flex flex-col items-center">
          {/* Step 1 */}
          <div className="w-full p-2.5 sm:p-3 rounded-xl bg-[#010a05] border border-[rgba(240,185,46,0.22)] text-center flex flex-col items-center justify-center shadow-xs">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-5 h-5 rounded-full bg-[#0a351e] text-[#3dff8f] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <span className="text-xs font-semibold text-[#f4fff8]">
                Tap Share in Browser Toolbar
              </span>
            </div>
            <button
              type="button"
              onClick={handleShareClick}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f0b92e]/10 hover:bg-[#f0b92e]/20 border border-[#f0b92e]/30 text-[10px] sm:text-[11px] text-[#f0b92e] font-mono font-semibold cursor-pointer active:scale-95 transition-all"
              title="Tap to open share dialog or copy link"
            >
              <Share className="w-3 h-3 text-[#f0b92e]" />
              <span>Share icon</span>
            </button>
          </div>

          {/* Step 2 */}
          <div className="w-full p-2.5 sm:p-3 rounded-xl bg-[#010a05] border border-[rgba(61,255,143,0.25)] text-center flex flex-col items-center justify-center shadow-xs">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-5 h-5 rounded-full bg-[#0a351e] text-[#3dff8f] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <span className="text-xs font-semibold text-[#f4fff8]">
                Scroll down &amp; tap Add to Home Screen
              </span>
            </div>
            <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#3dff8f]/10 border border-[#3dff8f]/30 text-[10px] sm:text-[11px] text-[#3dff8f] font-mono font-semibold">
              <PlusSquare className="w-3 h-3 text-[#3dff8f]" />
              <span>Add to Home Screen</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="w-full p-2.5 sm:p-3 rounded-xl bg-[#010a05] border border-[rgba(240,185,46,0.22)] text-center flex flex-col items-center justify-center shadow-xs">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-5 h-5 rounded-full bg-[#0a351e] text-[#3dff8f] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <span className="text-xs font-semibold text-[#f4fff8]">
                Tap Add in the top right
              </span>
            </div>
            <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#3dff8f]/10 border border-[#3dff8f]/30 text-[10px] sm:text-[11px] text-[#3dff8f] font-mono font-semibold">
              <CheckCircle2 className="w-3 h-3 text-[#3dff8f]" />
              <span>Launch directly with offline support!</span>
            </div>
          </div>
        </div>

        {/* Centered Actions */}
        <div className="w-full flex flex-col items-center justify-center gap-2">
          {!installSuccess && (
            <button
              onClick={handleInstallClick}
              className="w-full max-w-xs mx-auto py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm text-[#011408] bg-gradient-to-r from-[#3dff8f] via-[#fff1b8] to-[#3dff8f] hover:brightness-110 shadow-[0_0_15px_rgba(61,255,143,0.4)] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <DownloadCloud className="w-4 h-4 text-[#011408] shrink-0" />
              <span>Install to Device</span>
              <Sparkles className="w-3.5 h-3.5 text-[#011408] shrink-0" />
            </button>
          )}

          {installSuccess && (
            <div className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0a351e] border border-[#3dff8f] text-xs font-semibold text-[#3dff8f] shadow-[0_0_15px_rgba(61,255,143,0.3)]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>App Installed Successfully!</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="inline-flex items-center justify-center gap-1.5 text-xs text-[#9fbfae] hover:text-[#3dff8f] transition-colors mt-2 py-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Portfolio</span>
          </button>
        </div>
      </div>
    </div>
  );
};

