/**
 * Logging Service
 */
class LoggingService {
  protected static _instance: LoggingService;
  protected shouldLog: boolean;

  /**
   * @constructor
   */
  protected constructor() {
    this.shouldLog = !process.env.SUPPRESS_LOGGING || process.env.SUPPRESS_LOGGING !== 'true';
  }

  /**
   * Singleton accessor.
   *
   * @constructor
   */
  public static get Instance(): LoggingService {
    return this._instance || (this._instance = new LoggingService());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public log(...args: any[]) {
    if (this.shouldLog) {
      console.log(...args);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public warn(...args: any[]) {
    if (this.shouldLog) {
      console.warn(...args);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public error(...args: any[]) {
    if (this.shouldLog) {
      console.error(...args);
    }
  }
}

export default LoggingService;
export const LOG = LoggingService.Instance;
