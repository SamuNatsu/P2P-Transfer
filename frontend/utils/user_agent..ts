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
