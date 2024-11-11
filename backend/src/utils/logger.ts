import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class LoggerClass {
  private static instance: LoggerClass;
  private logDir: string;
  private logFile: string;
  private level: LogLevel;

  private constructor(component: 'frontend' | 'backend') {
    this.logDir = path.join('/app/logs', component);
    this.logFile = path.join(this.logDir, 'app.log');
    this.level = this.getLogLevelFromEnv();
    this.info('LOG_LEVEL:', this.level);
    this.initializeLogDirectory();
  }

  public static getInstance(component: 'frontend' | 'backend'): LoggerClass {
    if (!LoggerClass.instance) {
      LoggerClass.instance = new LoggerClass(component);
    }
    return LoggerClass.instance;
  }

  private initializeLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogLevelFromEnv(): LogLevel {
    console.log('envLogLevel:', process.env.LOG_LEVEL);
    const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLogLevel) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  public setLogLevel(level: LogLevel) {
    this.level = level;
  }

  private formatArgs(args: any[]): string {
    return args.map(arg => {
      // Handle null/undefined
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';

      // Handle Error objects
      if (arg instanceof Error) {
        return `${arg.message}${arg.stack ? `\nStack Trace:\n${arg.stack}` : ''}`;
      }

      // Handle objects
      if (typeof arg === 'object') {
        try {
          // Handle the specific case where we have error details and stack
          if ('error' in arg && 'stack' in arg) {
            const { error, stack, ...rest } = arg;
            return JSON.stringify({
              ...rest,
              error,
              ...(this.level === LogLevel.DEBUG ? { stack } : {})
            }, null, 2);
          }

          // Handle objects that have a stack property
          if ('stack' in arg) {
            const { stack, ...rest } = arg;
            return JSON.stringify({
              ...rest,
              ...(this.level === LogLevel.DEBUG ? { stack } : {})
            }, null, 2);
          }

          // Default object handling
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return '[Circular or Non-Serializable Object]';
        }
      }

      // Handle primitives
      return String(arg);
    }).join(' ');
  }

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (level <= this.level) {
      const timestamp = new Date().toISOString();
      const formattedArgs = this.formatArgs(args);
      const logMessage = `[${timestamp}] ${LogLevel[level]}: ${message} ${formattedArgs}`;

      // Console output with color coding
      const consoleMessage = this.getColoredLogLevel(level) + logMessage + '\x1b[0m';
      console.log(consoleMessage);

      // File output
      fs.appendFileSync(this.logFile, logMessage + '\n');
    }
  }

  private getColoredLogLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return '\x1b[31m'; // Red
      case LogLevel.WARN:
        return '\x1b[33m'; // Yellow
      case LogLevel.INFO:
        return '\x1b[36m'; // Cyan
      case LogLevel.DEBUG:
        return '\x1b[35m'; // Magenta
      default:
        return '\x1b[0m'; // Reset
    }
  }

  public error(message: string, ...args: any[]) {
    this.log(LogLevel.ERROR, message, ...args);
  }

  public warn(message: string, ...args: any[]) {
    this.log(LogLevel.WARN, message, ...args);
  }

  public info(message: string, ...args: any[]) {
    this.log(LogLevel.INFO, message, ...args);
  }

  public debug(message: string, ...args: any[]) {
    this.log(LogLevel.DEBUG, message, ...args);
  }
}

const Logger = LoggerClass.getInstance('backend');

export interface ErrorDetails {
  receivedValue: string;
  receivedType: string;
  errorMessage: string;
  stack?: string;
  context?: Record<string, unknown>;
}
export function logError(
  error: unknown,
  message: string,
  value?: unknown,
  additionalContext?: Record<string, unknown>
): void {
  // Capture stack trace
  const stack = error instanceof Error ? error.stack : new Error().stack;

  // Format the received value
  const formatValue = (val: unknown): string => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch (e) {
        return '[Circular or Non-Serializable Object]';
      }
    }
    return String(val);
  };

  // Create detailed error message
  const errorDetails: ErrorDetails = {
    receivedValue: value !== undefined ? formatValue(value) : 'No value provided',
    receivedType: value !== undefined ? typeof value : 'undefined',
    errorMessage: error instanceof Error ? error.message : String(error),
    stack,
    ...(additionalContext && { context: additionalContext })
  };

  // Log the error with all details
  Logger.error(message, {
    error: errorDetails,
    stack
  });
}

export default Logger;