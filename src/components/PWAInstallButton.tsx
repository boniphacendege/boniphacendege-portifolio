import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { DownloadCloud, Smartphone, Sparkles, CheckCircle2, Zap, WifiOff } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'card';
  className?: string;
  onOpen?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
  onOpen,
}) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running inside standalone PWA mode, don't show install buttons
  if (isInstalled) {
    return null;
  }

  const handleTriggerPWA = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If native install prompt is primed, trigger 1-click install directly!
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 3000);
        return;
      }
    }

    // Otherwise open the interactive platform guide
    if (onOpen) {
      onOpen();
    } else {
      window.dispatchEvent(new CustomEvent('open-pwa-fullscreen'));
    }
  };

  // Header compact button - narrowed width
  if (variant === 'header') {
    return (
      <button
        onClick={handleTriggerPWA}
        className={`group inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold text-[#3dff8f] bg-[#02180d] border border-[#3dff8f]/40 hover:border-[#3dff8f] hover:bg-[#032a14] shadow-[0_0_10px_rgba(61,255,143,0.25)] hover:shadow-[0_0_16px_rgba(61,255,143,0.5)] active:scale-95 transition-all cursor-pointer select-none shrink-0 ${className}`}
        title={isInstallable ? 'Install Portfolio to Device' : 'Open PWA Mobile Install Screen'}
        aria-label="Install Portfolio Progressive Web App"
      >
        <DownloadCloud className="w-3.5 h-3.5 text-[#3dff8f] group-hover:animate-bounce shrink-0" />
        <span className="hidden md:inline text-[11px]">
          {installSuccess ? 'Installed' : isInstallable ? 'Install' : 'App'}
        </span>
        <span className="text-[9px] text-[#f0b92e] font-sans font-bold px-1 py-[1px] rounded-md bg-[#f0b92e]/10 border border-[#f0b92e]/30 tracking-tight leading-none shrink-0">
          PWA
        </span>
      </button>
    );
  }

  // Centered Showcase Card variant (Main page section)
  if (variant === 'card') {
    return (
      <div
        className={`w-full max-w-sm sm:max-w-md mx-auto p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-[#02180d]/98 via-[#01140a]/98 to-[#010904]/98 border border-[#3dff8f]/35 shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(61,255,143,0.12)] text-center flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${className}`}
      >
        {/* Top ambient green neon accent line */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#3dff8f] to-transparent shadow-[0_0_8px_#3dff8f]"
        />

        {/* Centered App Icon Emblem */}
        <div className="relative mb-2.5 flex items-center justify-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#010a05] border border-[#f0b92e]/40 p-2 shadow-[0_0_15px_rgba(61,255,143,0.2)] flex items-center justify-center">
            <Smartphone className="w-6 h-6 sm:w-7 sm:h-7 text-[#3dff8f]" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#f0b92e] text-[#010d06] flex items-center justify-center shadow-[0_0_6px_#f0b92e]">
            <Sparkles className="w-2.5 h-2.5 text-[#010d06]" />
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
        <h3 className="font-serif-heading font-extrabold text-base sm:text-lg text-[#fff1b8] text-center mb-1.5">
          Install Portfolio App
        </h3>

        {/* Centered Description */}
        <p className="text-[11px] sm:text-xs text-[#a4c7b5] text-center max-w-xs mx-auto mb-3.5 leading-relaxed">
          Install directly on your home screen for full-screen access, fast loading, and offline browsing.
        </p>

        {/* Centered Action Button */}
        {installSuccess ? (
          <div className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0a351e] border border-[#3dff8f] text-xs font-semibold text-[#3dff8f] shadow-[0_0_15px_rgba(61,255,143,0.3)]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>App Installed Successfully!</span>
          </div>
        ) : (
          <button
            onClick={handleTriggerPWA}
            className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs sm:text-sm font-bold text-[#011408] bg-gradient-to-r from-[#3dff8f] via-[#fff1b8] to-[#3dff8f] hover:brightness-110 shadow-[0_0_15px_rgba(61,255,143,0.4)] active:scale-98 transition-all cursor-pointer"
          >
            <DownloadCloud className="w-4 h-4 text-[#011408] shrink-0" />
            <span>Open PWA Screen</span>
            <Sparkles className="w-3.5 h-3.5 text-[#011408] shrink-0" />
          </button>
        )}

        {/* Platform Support Hints */}
        <div className="mt-2.5 text-[10px] font-mono text-[#789d89] text-center">
          Android · iOS Safari · iPad · Desktop
        </div>
      </div>
    );
  }

  // Sidebar / Drawer variant — Centered and mobile-responsive
  return (
    <div
      className={`w-full mx-auto p-4 rounded-2xl bg-gradient-to-b from-[#02180d] via-[#01130a] to-[#010904] border border-[#3dff8f]/30 shadow-lg text-center flex flex-col items-center justify-center ${className}`}
    >
      {/* Centered Badges */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#3dff8f] font-semibold">
          <Smartphone className="w-3.5 h-3.5 text-[#f0b92e]" />
          <span>PROGRESSIVE WEB APP</span>
        </div>
        <span className="text-[10px] font-bold text-[#f0b92e] px-2 py-0.5 rounded-full bg-[#f0b92e]/10 border border-[#f0b92e]/30 font-mono">
          Offline Ready
        </span>
      </div>

      {/* Centered Title */}
      <h4 className="text-xs sm:text-sm font-serif-heading font-bold text-[#fff1b8] text-center mb-1">
        Install Portfolio App
      </h4>

      {/* Centered Description */}
      <p className="text-[11px] text-[#9fbfae] text-center max-w-xs mx-auto mb-3 leading-relaxed">
        Install this portfolio on your phone or desktop home screen for instant full-screen access, fast loading, and offline browsing.
      </p>

      {/* Centered Button */}
      <button
        onClick={handleTriggerPWA}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-[#011408] bg-gradient-to-r from-[#3dff8f] via-[#fff1b8] to-[#3dff8f] hover:brightness-110 shadow-[0_0_15px_rgba(61,255,143,0.4)] active:scale-98 transition-all cursor-pointer"
      >
        <DownloadCloud className="w-4 h-4 text-[#011408] shrink-0" />
        <span>Install Portfolio to Device</span>
        <Sparkles className="w-3.5 h-3.5 text-[#011408] shrink-0" />
      </button>
    </div>
  );
};
