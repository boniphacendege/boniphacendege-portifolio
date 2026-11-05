import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Global reference to ensure early beforeinstallprompt events are captured before React mount
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalIsInstalled = false;

if (typeof window !== 'undefined') {
  // Capture event as early as possible
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
  });

  window.addEventListener('appinstalled', () => {
    globalIsInstalled = true;
    globalDeferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed-event'));
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      globalIsInstalled ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [swActive, setSwActive] = useState(false);
  const [cachedAssetsCount, setCachedAssetsCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Standalone check
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(standalone);
    };
    checkStandalone();

    // Device detection
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const android = /android/.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);
    setIsDesktop(!ios && !android);

    // Online / Offline listener
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Service Worker check
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.active) {
          setSwActive(true);
        }
      }).catch(() => {});

      // Inspect CacheStorage count
      if ('caches' in window) {
        caches.keys().then(async (keys) => {
          let count = 0;
          for (const key of keys) {
            try {
              const cache = await caches.open(key);
              const items = await cache.keys();
              count += items.length;
            } catch {}
          }
          setCachedAssetsCount(count);
        }).catch(() => {});
      }
    }

    // Prompt event listeners
    const handlePromptReady = () => {
      setDeferredPrompt(globalDeferredPrompt);
    };

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(globalDeferredPrompt);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('pwa-installed-event', handleInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('pwa-installed-event', handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const promptToUse = deferredPrompt || globalDeferredPrompt;
    if (!promptToUse) {
      return false;
    }

    try {
      await promptToUse.prompt();
      const { outcome } = await promptToUse.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        globalDeferredPrompt = null;
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('PWA install prompt error:', err);
    }
    return false;
  }, [deferredPrompt]);

  const triggerShare = useCallback(async () => {
    const shareData = {
      title: 'Boniphace Ndege | Creative & Digital Portfolio',
      text: 'Explore the creative portfolio of Boniphace Ndege — Graphic Designer, Website Designer & Developer, and Digital Content Creator.',
      url: window.location.href,
    };

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return { success: true, method: 'share' as const };
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          console.warn('Native share error:', err);
        }
      }
    }

    // Fallback: Clipboard copy
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        return { success: true, method: 'copy' as const };
      } catch {
        return { success: false, method: 'none' as const };
      }
    }

    return { success: false, method: 'none' as const };
  }, []);

  return {
    isInstallable: !!(deferredPrompt || globalDeferredPrompt),
    isInstalled,
    isIOS,
    isAndroid,
    isDesktop,
    isOnline,
    swActive,
    cachedAssetsCount,
    install,
    triggerShare,
  };
}
