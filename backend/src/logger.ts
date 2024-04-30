/// Logger module
import chalk from 'chalk';

// Types
export enum LogLevel {
  Error = 1,
  Warn,
  Info,
  Debug,
  Trace
}

// Get log level
let logLv: LogLevel = LogLevel.Info;
if (process.env.LOG_LEVEL !== undefined) {
  logLv = Math.max(0, Math.min(parseInt(process.env.LOG_LEVEL), 5));
}
process.stdout.write(`Log Level: ${logLv}\n`);

// Export class
export class Logger {
  private static getTag(level: string): string {
    return '[' + new Date().toISOString() + `] [${level.padStart(5, ' ')}] `;
  }

  public static trace(msg: string): void {
    if (logLv < LogLevel.Trace) {
      return;
    }

    process.stdout.write(chalk.gray(Logger.getTag('TRACE')));
    process.stdout.write(msg + '\n');
  }

  public static debug(msg: string): void {
    if (logLv < LogLevel.Debug) {
      return;
    }

    process.stdout.write(chalk.blue(Logger.getTag('DEBUG')));
    process.stdout.write(msg + '\n');
  }

  public static info(msg: string): void {
    if (logLv < LogLevel.Info) {
      return;
    }

    process.stdout.write(chalk.green(Logger.getTag('INFO')));
    process.stdout.write(msg + '\n');
  }

  public static warn(msg: string): void {
    if (logLv < LogLevel.Warn) {
      return;
    }

    process.stdout.write(chalk.yellow(Logger.getTag('WARN')));
    process.stdout.write(msg + '\n');
  }

  public static error(msg: string): void {
    if (logLv < LogLevel.Error) {
      return;
    }

    process.stdout.write(chalk.red(Logger.getTag('ERROR')));
    process.stdout.write(msg + '\n');
  }
}
