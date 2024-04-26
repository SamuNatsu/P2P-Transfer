/// Logger module
import chalk from 'chalk';

// Export class
export class Logger {
  private static checkLevel(lv: number): boolean {
    if (process.env.LOG_LV === undefined) {
      return lv <= 3;
    }
    return parseInt(process.env.LOG_LV) > lv;
  }

  public static trace(msg: string): void {
    if (Logger.checkLevel(5)) {
      process.stdout.write(
        '[' + new Date().toISOString() + '] [TRACE] ' + msg + '\n'
      );
    }
  }

  public static debug(msg: string): void {
    if (Logger.checkLevel(4)) {
      process.stdout.write(
        chalk.blue('[' + new Date().toISOString() + '] [DEBUG] ' + msg + '\n')
      );
    }
  }

  public static info(msg: string): void {
    if (Logger.checkLevel(3)) {
      process.stdout.write(
        chalk.green('[' + new Date().toISOString() + '] [ INFO] ' + msg + '\n')
      );
    }
  }

  public static warn(msg: string): void {
    if (Logger.checkLevel(2)) {
      process.stdout.write(
        chalk.yellow('[' + new Date().toISOString() + '] [ WARN] ' + msg + '\n')
      );
    }
  }

  public static error(msg: string): void {
    if (Logger.checkLevel(1)) {
      process.stdout.write(
        chalk.red('[' + new Date().toISOString() + '] [ERROR] ' + msg + '\n')
      );
    }
  }
}
