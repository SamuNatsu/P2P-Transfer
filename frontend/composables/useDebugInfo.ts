/// Debug info states
import moment from 'moment';

/* States */
function useDebugShow(): Ref<boolean> {
  return useState<boolean>('debug_show', (): boolean => false);
}
function useDebugLog(): Ref<string> {
  return useState<string>('debug_log', (): string => {
    let ret: string = '** Browser environment **\n';
    ret += getBrowserEnv();
    ret += '** Debug start **\n';
    return ret;
  });
}

/* Print log */
function log(str: string): void {
  const logStr: Ref<string> = useDebugLog();
  const now: string = moment().toISOString();
  logStr.value += `[${now}] ${str}\n`;
}

/* Export composable */
export function useDebugInfo(): {
  isShow: Ref<boolean>;
  logText: Ref<string>;
  log: (str: string) => void;
} {
  return {
    isShow: useDebugShow(),
    logText: useDebugLog(),
    log
  };
}
