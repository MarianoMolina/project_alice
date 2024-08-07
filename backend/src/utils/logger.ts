// src/utils/logger.ts

enum LogLevel {
    ERROR,
    WARN,
    INFO,
    DEBUG
  }
  
  class Logger {
    private static level: LogLevel = LogLevel.INFO;
  
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