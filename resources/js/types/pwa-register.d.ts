/// <reference types="vite-plugin-pwa/client" />

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
  }

  /**
   * Register the service worker injected by vite-plugin-pwa.
   * Returns a function to trigger update/reload if needed.
   */
  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => void;
}