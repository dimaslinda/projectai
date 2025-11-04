import React from 'react';
import usePWAInstallPrompt from '@/hooks/usePWAInstallPrompt';

export default function InstallPromptBanner() {
  const { canInstall, isInstalled, showPrompt, install, dismiss, isIosSafari } = usePWAInstallPrompt();

  if (isInstalled) return null;

  // iOS Safari does not support beforeinstallprompt; show instruction when not installed
  if (isIosSafari) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 rounded-lg bg-sky-600 text-white shadow-lg">
        <div className="px-4 py-3 flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 mt-0.5">
            <path d="M12 3l4 4h-3v6h-2V7H8l4-4zm-7 9h2v8h10v-8h2v10H5V12z" />
          </svg>
          <div className="text-sm">
            <div className="font-medium">Pasang aplikasi ke layar utama</div>
            <div className="opacity-90">
              Buka menu <span className="font-semibold">Share</span> lalu pilih <span className="font-semibold">Add to Home Screen</span>.
            </div>
          </div>
          <button
            className="ml-auto inline-flex items-center rounded-md bg-white/20 px-3 py-1.5 text-sm hover:bg-white/30"
            onClick={dismiss}
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  if (!canInstall || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-lg bg-sky-600 text-white shadow-lg">
      <div className="px-4 py-3 flex items-start gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 mt-0.5">
          <path d="M12 3l4 4h-3v6h-2V7H8l4-4zm-7 9h2v8h10v-8h2v10H5V12z" />
        </svg>
        <div className="text-sm">
          <div className="font-medium">Install aplikasi ke desktop</div>
          <div className="opacity-90">Nikmati pengalaman penuh dengan aplikasi yang terpasang.</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-white/90"
            onClick={async () => {
              await install();
            }}
          >
            Install
          </button>
          <button
            className="inline-flex items-center rounded-md bg-white/20 px-3 py-1.5 text-sm hover:bg-white/30"
            onClick={dismiss}
          >
            Nanti
          </button>
        </div>
      </div>
    </div>
  );
}