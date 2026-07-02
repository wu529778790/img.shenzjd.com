import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useConfigStore } from './configStore';

describe('configStore', () => {
  beforeEach(() => {
    // 重置 store 到初始状态
    useConfigStore.setState({
      owner: '',
      repo: '',
      branch: 'main',
      directory: '',
      compressionEnabled: false,
      compressionQuality: 80,
      watermarkEnabled: true,
      watermarkText: 'by img.shenzjd.com',
      watermarkColor: '#ffffff',
      watermarkSize: 24,
      watermarkPosition: 'bottom-right',
      theme: 'system',
      cdn: 'jsdmirror',
      useRaw: true,
      copyFormat: 'url',
      autoCopyAfterUpload: true,
      useOriginalFileName: false,
      convertToWebp: true,
      configPath: '.imgx-config/config.json',
      autoSync: true,
      configInitialized: false,
      configLastCheckedAt: undefined,
      configCheckedRepo: undefined,
      configCheckedBranch: undefined,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('default values', () => {
    it('should have correct default CDN', () => {
      expect(useConfigStore.getState().cdn).toBe('jsdmirror');
    });

    it('should have watermark enabled by default', () => {
      expect(useConfigStore.getState().watermarkEnabled).toBe(true);
    });

    it('should have correct default watermark text', () => {
      expect(useConfigStore.getState().watermarkText).toBe('by img.shenzjd.com');
    });

    it('should have WebP conversion enabled by default', () => {
      expect(useConfigStore.getState().convertToWebp).toBe(true);
    });

    it('should have compression disabled by default', () => {
      expect(useConfigStore.getState().compressionEnabled).toBe(false);
    });

    it('should have auto-sync enabled by default', () => {
      expect(useConfigStore.getState().autoSync).toBe(true);
    });

    it('should have "system" as default theme', () => {
      expect(useConfigStore.getState().theme).toBe('system');
    });

    it('should have "url" as default copy format', () => {
      expect(useConfigStore.getState().copyFormat).toBe('url');
    });

    it('should have config path set', () => {
      expect(useConfigStore.getState().configPath).toBe('.imgx-config/config.json');
    });
  });

  describe('updateConfig', () => {
    it('should update config values', () => {
      useConfigStore.getState().updateConfig({
        owner: 'testuser',
        repo: 'test-repo',
        branch: 'develop',
      });

      const state = useConfigStore.getState();
      expect(state.owner).toBe('testuser');
      expect(state.repo).toBe('test-repo');
      expect(state.branch).toBe('develop');
    });

    it('should preserve unchanged values', () => {
      useConfigStore.getState().updateConfig({ owner: 'testuser' });
      expect(useConfigStore.getState().cdn).toBe('jsdmirror'); // unchanged
    });

    it('should dispatch config-updated event on user config change', () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      useConfigStore.getState().updateConfig({ directory: 'images' });

      vi.runAllTimers();

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'config-updated' })
      );

      dispatchSpy.mockRestore();
    });

    it('should call onUpdate callback if provided', () => {
      const callback = vi.fn();
      useConfigStore.getState().updateConfig({ owner: 'test' }, callback);
      expect(callback).toHaveBeenCalledOnce();
    });
  });

  describe('resetConfig', () => {
    it('should reset all values to defaults', () => {
      useConfigStore.getState().updateConfig({
        owner: 'testuser',
        repo: 'test-repo',
        cdn: 'github',
        watermarkEnabled: false,
      });

      useConfigStore.getState().resetConfig();

      const state = useConfigStore.getState();
      expect(state.owner).toBe('');
      expect(state.repo).toBe('');
      expect(state.cdn).toBe('jsdmirror');
      expect(state.watermarkEnabled).toBe(false);
      expect(state.configInitialized).toBe(false);
    });
  });

  describe('config check tracking', () => {
    it('should mark config as checked', () => {
      useConfigStore.getState().markConfigChecked('test-repo', 'main');

      const state = useConfigStore.getState();
      expect(state.configCheckedRepo).toBe('test-repo');
      expect(state.configCheckedBranch).toBe('main');
      expect(state.configLastCheckedAt).toBeTypeOf('number');
    });

    it('should need check when never checked', () => {
      expect(useConfigStore.getState().needsConfigCheck()).toBe(true);
    });

    it('should not need check within TTL', () => {
      useConfigStore.getState().markConfigChecked('test-repo', 'main');
      expect(useConfigStore.getState().needsConfigCheck()).toBe(false);
    });

    it('should need check after TTL expires', () => {
      useConfigStore.getState().markConfigChecked('test-repo', 'main');

      // 前进 6 分钟（超过 5 分钟 TTL）
      vi.advanceTimersByTime(6 * 60 * 1000);

      expect(useConfigStore.getState().needsConfigCheck()).toBe(true);
    });

    it('should invalidate config check', () => {
      useConfigStore.getState().markConfigChecked('test-repo', 'main');
      useConfigStore.getState().invalidateConfigCheck();

      const state = useConfigStore.getState();
      expect(state.configLastCheckedAt).toBeUndefined();
      expect(state.configCheckedRepo).toBeUndefined();
      expect(state.configCheckedBranch).toBeUndefined();
    });
  });

  describe('configInitialized', () => {
    it('should set initialized flag', () => {
      expect(useConfigStore.getState().configInitialized).toBe(false);
      useConfigStore.getState().setConfigInitialized();
      expect(useConfigStore.getState().configInitialized).toBe(true);
    });
  });
});
