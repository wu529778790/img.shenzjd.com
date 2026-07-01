import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('debug utilities', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('in development mode', () => {
    it('debugLog should log in development', async () => {
      process.env.NODE_ENV = 'development';
      const { debugLog } = await import('./debug');
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

      debugLog('test message', { data: 123 });

      expect(spy).toHaveBeenCalledWith('test message', { data: 123 });
      spy.mockRestore();
    });

    it('debugWarn should warn in development', async () => {
      process.env.NODE_ENV = 'development';
      const { debugWarn } = await import('./debug');
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      debugWarn('warning message');

      expect(spy).toHaveBeenCalledWith('warning message');
      spy.mockRestore();
    });

    it('debugError should error in development', async () => {
      process.env.NODE_ENV = 'development';
      const { debugError } = await import('./debug');
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      debugError('error message');

      expect(spy).toHaveBeenCalledWith('error message');
      spy.mockRestore();
    });
  });

  describe('in production mode', () => {
    it('debugLog should NOT log in production', async () => {
      process.env.NODE_ENV = 'production';
      const { debugLog } = await import('./debug');
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

      debugLog('test message');

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('debugWarn should NOT warn in production', async () => {
      process.env.NODE_ENV = 'production';
      const { debugWarn } = await import('./debug');
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      debugWarn('warning message');

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('debugError should NOT error in production', async () => {
      process.env.NODE_ENV = 'production';
      const { debugError } = await import('./debug');
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      debugError('error message');

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
