import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 sm:bottom-20 left-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#0a2316]/95 border border-[#3dff8f]/40 text-xs font-mono text-[#f4fff8] shadow-[0_0_20px_rgba(0,0,0,0.85),0_0_12px_rgba(61,255,143,0.3)] backdrop-blur-md animate-in slide-in-from-bottom duration-300 select-none"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f0b92e] opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#f0b92e]" />
      </span>
      <WifiOff className="w-4 h-4 text-[#f0b92e]" />
      <span>
        <strong className="text-[#3dff8f] font-semibold">Offline Mode Active</strong> — Cached portfolio assets are loaded.
      </span>
    </div>
  );
};
