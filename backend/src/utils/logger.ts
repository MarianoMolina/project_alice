import fs from 'fs';
import path from 'path';

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private static instance: Logger;
  private logDir: string;
  private logFile: string;
  private level: LogLevel;

  private constructor(component: 'frontend' | 'backend') {
    this.logDir = path.join('/app/logs', component);
    this.logFile = path.join(this.logDir, 'app.log');
    this.level = this.getLogLevelFromEnv();
    this.initializeLogDirectory();
  }

  public static getInstance(component: 'frontend' | 'backend'): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(component);
    }
    return Logger.instance;
  }

  private initializeLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogLevelFromEnv(): LogLevel {
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

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (level <= this.level) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${LogLevel[level]}: ${message}`;
      console.log(logMessage, ...args);
      fs.appendFileSync(this.logFile, logMessage + '\n');
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

const logger = Logger.getInstance('backend');

export default logger;