/**
 * Detects whether the web app is running inside the native Android shell
 * (Capacitor WebView) or an installed/standalone context (TWA, PWA
 * installed-to-homescreen). When true, the app renders the native-feeling
 * AppShell (bottom tab bar, role grid) instead of the marketing landing page.
 */
export function isAppMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Capacitor native bridge (Android app)
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) {
    return true;
  }

  // Standalone display (TWA / installed PWA)
  if (typeof window.matchMedia === 'function') {
    try {
      if (window.matchMedia('(display-mode: standalone)').matches) return true;
      if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
    } catch {
      /* ignore */
    }
  }

  return false;
}
