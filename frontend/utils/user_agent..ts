/// User agent utils

/* Check internal browser */
export function isInternalBrowser(): boolean {
  const UA: string = window.navigator.userAgent.toLowerCase();

  return (
    /micromessenger|alipay|taurusapp|dingtalk/i.test(UA) ||
    /(?<!m)qq(?!browser)/i.test(UA) ||
    (window as any)?.__wxjs_environment == 'miniprogram'
  );
}

/* Get browser environment */
export function getBrowserEnv(): string {
  let ret: string = '';

  ret += '[Language] ' + window.navigator.language + '\n';

  ret +=
    '[Mobile] ' +
    ('userAgentData' in window.navigator
      ? (window.navigator as any).userAgentData.mobile
      : 'Unknown') +
    '\n';

  ret +=
    '[Platform] ' +
    ('userAgentData' in window.navigator
      ? (window.navigator as any).userAgentData.platform
      : window.navigator.platform) +
    '\n';

  ret += '[User Agent] ' + window.navigator.userAgent + '\n';

  ret += '[Vendor] ' + window.navigator.vendor + '\n';

  if (window.navigator.cookieEnabled) {
    ret += '[Cookie] Available\n';
  } else {
    ret += '[Cookie] Not available\n';
  }

  if (window.navigator.serviceWorker === undefined) {
    ret += '[Service Worker] Not available\n';
  } else {
    ret += '[Service Worker] Available\n';
  }

  if (typeof WebSocket === 'undefined') {
    ret += '[WebSocket] Not available\n';
  } else {
    ret += '[WebSocket] Available\n';
  }

  if (typeof RTCPeerConnection === 'undefined') {
    ret += '[WebRTC] Not available\n';
  } else {
    ret += '[WebRTC] Available\n';
  }

  if (window.crypto === undefined) {
    ret += '[Web Crypto API] Not available\n';
  } else {
    ret += '[Web Crypto API] Available\n';
  }

  return ret;
}
