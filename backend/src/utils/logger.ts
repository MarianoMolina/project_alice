enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private static level: LogLevel = Logger.getLogLevelFromEnv();

  private static getLogLevelFromEnv(): LogLevel {
    const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLogLevel) {
      case 'ERROR':
        return LogLevel.ERROR;
      case 'WARN':
        return LogLevel.WARN;
      case 'INFO':
        return LogLevel.INFO;
      case 'DEBUG':
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  static setLogLevel(level: LogLevel) {
    this.level = level;
  }

  private static log(level: LogLevel, message: string, ...args: any[]) {
    if (level <= this.level) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${LogLevel[level]}: ${message}`, ...args);
    }
  }

  static error(message: string, ...args: any[]) {
    this.log(LogLevel.ERROR, message, ...args);
  }

  static warn(message: string, ...args: any[]) {
    this.log(LogLevel.WARN, message, ...args);
  }

  static info(message: string, ...args: any[]) {
    this.log(LogLevel.INFO, message, ...args);
  }

  static debug(message: string, ...args: any[]) {
    this.log(LogLevel.DEBUG, message, ...args);
  }
}

export default Logger;