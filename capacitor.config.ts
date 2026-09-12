import type { CapacitorConfig } from '@capacitor/cli';

/**
 * InterviewAce — Capacitor (native Android shell)
 *
 * The app UI loads from the live production site (server.url), which keeps
 * the APK tiny and lets us ship fixes without Play Store review for web
 * content. The native shell provides: branded splash, dark status bar,
 * hardware back-button support and a Play-ready native container.
 */
const config: CapacitorConfig = {
  appId: 'com.interviewace.app',
  appName: 'InterviewAce',
  webDir: 'capacitor-www',
  backgroundColor: '#0F172A',
  server: {
    url: 'https://interviewace.umprintables.com',
    cleartext: false,
  },
  android: {
    backgroundColor: '#0F172A',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1600,
      launchAutoHide: true,
      backgroundColor: '#0F172A',
      androidSplashResourceName: 'splash',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F172A',
      overlaysWebView: false,
    },
  },
};

export default config;
