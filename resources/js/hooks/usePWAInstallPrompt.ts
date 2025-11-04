import { useEffect, useMemo, useRef, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = window.navigator.standalone === true; // iOS Safari
  return mq || iosStandalone;
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

export function usePWAInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(isStandalone());
  const [showPrompt, setShowPrompt] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  const dismissedKey = 'pwa_install_dismissed';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
      // Only show if not previously dismissed in this session
      const dismissed = sessionStorage.getItem(dismissedKey);
      if (!dismissed && !installed) setShowPrompt(true);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      setCanInstall(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [installed]);

  const install = async () => {
    const evt = deferredPromptRef.current;
    if (!evt) return { outcome: 'dismissed' as const };
    await evt.prompt();
    const choice = await evt.userChoice;
    if (choice.outcome === 'accepted') {
      setShowPrompt(false);
    }
    return choice;
  };

  const dismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem(dismissedKey, '1');
  };

  const ios = useMemo(() => isIosSafari(), []);

  return { canInstall, isInstalled: installed, showPrompt, install, dismiss, isIosSafari: ios };
}

export default usePWAInstallPrompt;