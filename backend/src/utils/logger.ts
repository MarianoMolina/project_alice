import fs from 'fs';
import path from 'path';
import { LOG_LEVEL } from './const';

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogFileConfig {
  maxBytes: number;
  backupCount: number;
}

class LoggerClass {
  private static instance: LoggerClass;
  private logDir: string;
  private logFile: string;
  private level: LogLevel;
  private maxBytes: number;
  private backupCount: number;
  private currentSize: number;

  private constructor(component: 'frontend' | 'backend', config?: LogFileConfig) {
    this.logDir = path.join('/app/logs', component);
    this.logFile = path.join(this.logDir, 'app.log');
    this.level = this.getLogLevelFromEnv();
    // Default to 10MB max file size and 5 backup files if not specified
    this.maxBytes = config?.maxBytes ?? 10 * 1024 * 1024;
    this.backupCount = config?.backupCount ?? 5;
    this.currentSize = 0;
   
    this.initializeLogDirectory();
    this.initializeCurrentSize();
    this.info('LOG_LEVEL:', LogLevel[this.level]);
  }

  public static getInstance(
    component: 'frontend' | 'backend',
    config?: LogFileConfig
  ): LoggerClass {
    if (!LoggerClass.instance) {
      LoggerClass.instance = new LoggerClass(component, config);
    }
    return LoggerClass.instance;
  }

  private initializeLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private initializeCurrentSize() {
    if (fs.existsSync(this.logFile)) {
      const stats = fs.statSync(this.logFile);
      this.currentSize = stats.size;
    } else {
      this.currentSize = 0;
    }
  }

  private rotateFiles() {
    // Delete the last backup if it exists
    const lastBackup = `${this.logFile}.${this.backupCount}`;
    if (fs.existsSync(lastBackup)) {
      fs.unlinkSync(lastBackup);
    }

    // Rotate existing backup files
    for (let i = this.backupCount - 1; i >= 1; i--) {
      const currentFile = `${this.logFile}.${i}`;
      const nextFile = `${this.logFile}.${i + 1}`;
      if (fs.existsSync(currentFile)) {
        fs.renameSync(currentFile, nextFile);
      }
    }

    // Rotate the current log file
    if (fs.existsSync(this.logFile)) {
      fs.renameSync(this.logFile, `${this.logFile}.1`);
    }

    // Reset current size
    this.currentSize = 0;
  }

  private getLogLevelFromEnv(): LogLevel {
    console.log('envLogLevel:', LOG_LEVEL);
    switch (LOG_LEVEL) {
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
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';

      if (arg instanceof Error) {
        return `${arg.message}${arg.stack ? `\nStack Trace:\n${arg.stack}` : ''}`;
      }

      if (typeof arg === 'object') {
        try {
          if ('error' in arg && 'stack' in arg) {
            const { error, stack, ...rest } = arg;
            return JSON.stringify({
              ...rest,
              error,
              ...(this.level === LogLevel.DEBUG ? { stack } : {})
            }, null, 2);
          }

          if ('stack' in arg) {
            const { stack, ...rest } = arg;
            return JSON.stringify({
              ...rest,
              ...(this.level === LogLevel.DEBUG ? { stack } : {})
            }, null, 2);
          }

          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return '[Circular or Non-Serializable Object]';
        }
      }

      return String(arg);
    }).join(' ');
  }

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (level <= this.level) {
      const timestamp = new Date().toISOString();
      const formattedArgs = this.formatArgs(args);
      
      // Console output (without newline)
      const consoleMessage = `[${timestamp}] ${LogLevel[level]}: ${message} ${formattedArgs}`;
      console.log(this.getColoredLogLevel(level) + consoleMessage + '\x1b[0m');
  
      // File output (with newline)
      const fileMessage = consoleMessage + '\n';
      
      // Check if we need to rotate files
      if (this.currentSize + Buffer.byteLength(fileMessage) > this.maxBytes) {
        this.rotateFiles();
      }
  
      // File output
      fs.appendFileSync(this.logFile, fileMessage);
      this.currentSize += Buffer.byteLength(fileMessage);
    }
  }
  
  private getColoredLogLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return '\x1b[31m';
      case LogLevel.WARN: return '\x1b[33m';
      case LogLevel.INFO: return '\x1b[36m';
      case LogLevel.DEBUG: return '\x1b[35m';
      default: return '\x1b[0m';
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
  const stack = error instanceof Error ? error.stack : new Error().stack;

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

  const errorDetails: ErrorDetails = {
    receivedValue: value !== undefined ? formatValue(value) : 'No value provided',
    receivedType: value !== undefined ? typeof value : 'undefined',
    errorMessage: error instanceof Error ? error.message : String(error),
    stack,
    ...(additionalContext && { context: additionalContext })
  };

  const Logger = LoggerClass.getInstance('backend');
  Logger.error(message, {
    error: errorDetails,
    stack
  });
}

const Logger = LoggerClass.getInstance('backend', {
  maxBytes: 10 * 1024 * 1024, // 10MB
  backupCount: 10
});

export default Logger;