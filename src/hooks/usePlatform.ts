export type Platform =
  | 'ios-safari'
  | 'ios-chrome'
  | 'ios-firefox'
  | 'ios-edge'
  | 'ios-other'
  | 'android-chrome'
  | 'android-samsung'
  | 'android-firefox'
  | 'android-edge'
  | 'android-other'
  | 'desktop'
  | 'installed';

export function detectPlatform(): Platform {
  // Already running as installed PWA
  if (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  ) {
    return 'installed';
  }

  const ua = navigator.userAgent;
  const isIOS = /iP(hone|ad|od)/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  if (isIOS) {
    if (/CriOS/i.test(ua)) return 'ios-chrome';
    if (/FxiOS/i.test(ua)) return 'ios-firefox';
    if (/EdgiOS/i.test(ua)) return 'ios-edge';
    // Safari detection: has WebKit, no other browser markers
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'ios-safari';
    return 'ios-other';
  }

  if (isAndroid) {
    if (/SamsungBrowser/i.test(ua)) return 'android-samsung';
    if (/Firefox/i.test(ua)) return 'android-firefox';
    if (/Edg\//i.test(ua)) return 'android-edge';
    if (/Chrome/i.test(ua)) return 'android-chrome';
    return 'android-other';
  }

  return 'desktop';
}

export function isMobile(platform: Platform): boolean {
  return platform !== 'desktop' && platform !== 'installed';
}

export function isIOS(platform: Platform): boolean {
  return platform.startsWith('ios-');
}

export function isAndroid(platform: Platform): boolean {
  return platform.startsWith('android-');
}
