enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
  }
  
  class Logger {
    private static instance: Logger;
    private level: LogLevel;
  
    private constructor() {
      this.level = this.getLogLevelFromEnv();
    }
  
    public static getInstance(): Logger {
      if (!Logger.instance) {
        Logger.instance = new Logger();
      }
      return Logger.instance;
    }
  
    private getLogLevelFromEnv(): LogLevel {
      const envLogLevel = process.env.REACT_APP_LOG_LEVEL?.toUpperCase();
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
        const logMessage = `[${timestamp}] FRONTEND - ${LogLevel[level]}: ${message}`;
        
        switch (level) {
          case LogLevel.ERROR:
            console.error(logMessage, ...args);
            break;
          case LogLevel.WARN:
            console.warn(logMessage, ...args);
            break;
          case LogLevel.INFO:
            console.info(logMessage, ...args);
            break;
          case LogLevel.DEBUG:
            console.debug(logMessage, ...args);
            break;
        }
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
  
  const logger = Logger.getInstance();
  export default logger;