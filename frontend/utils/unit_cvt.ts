/// Unit convert utils

/* Constants */
const unit: string[] = ['', 'K', 'M', 'G', 'P', 'E'];
const base: number[] = unit.map((_, index: number): number => Math.pow(1024, index));
const stage: number[] = unit.map((_, index: number): number => Math.pow(1024, index + 1));

/* Convert */
export function convert(num: number, postfix: string): string {
  for (let i = 0; i < unit.length; ++i) {
    if (num < stage[i]) {
      return (num / base[i]).toFixed(1) + unit[i] + postfix;
    }
  }
  return (num / base[base.length - 1]).toFixed(1) + unit[unit.length - 1] + postfix;
}
