import LoggingService from './LoggingService';

class TestLoggingUtils extends LoggingService {
  constructor(shouldLog: boolean) {
    super();
    this.shouldLog = shouldLog;
  }
}

describe('LoggingService', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  let LOG: LoggingService;

  beforeEach(() => {
    // Reset the instance before each test
    (LoggingService as any)._instance = undefined;

    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    LOG = new TestLoggingUtils(false);
  });

  afterEach(() => {
    // Clean up spies
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log silently in tests', () => {
    expect(consoleLogSpy).not.toHaveBeenCalled();
    LOG.log('This should not appear in the console of a unit test.');
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should warn silently in tests', () => {
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    LOG.warn('This should not appear in the console of a unit test.');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should error silently in tests', () => {
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    LOG.error('This should not appear in the console of a unit test.');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should log out loud at runtime', () => {
    LOG = new TestLoggingUtils(true);
    expect(consoleLogSpy).not.toHaveBeenCalled();
    LOG.log("This would appear in the console if we weren't mocking it.");
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should warn out loud at runtime', () => {
    LOG = new TestLoggingUtils(true);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    LOG.warn("This would appear in the console if we weren't mocking it.");
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should error out loud at runtime', () => {
    LOG = new TestLoggingUtils(true);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    LOG.error("This would appear in the console if we weren't mocking it.");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
