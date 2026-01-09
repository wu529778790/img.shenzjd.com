import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useConfigStore } from '~/stores/config'

describe('Config Store', () => {
  let configStore: ReturnType<typeof useConfigStore>

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    configStore = useConfigStore()
  })

  it('should initialize with default state', () => {
    expect(configStore.config).toBeNull()
    expect(configStore.loading).toBe(false)
    expect(configStore.syncing).toBe(false)
    expect(configStore.repoList).toEqual([])
    expect(configStore.branchList).toEqual([])
  })

  it('should update repository configuration', () => {
    // 先创建一个默认配置
    configStore.$state.config = {
      version: '3.0.0',
      storage: {
        repository: {
          owner: 'testuser',
          name: 'test-repo',
          branch: 'main',
        },
        directory: {
          mode: 'auto',
          path: 'images',
          autoPattern: 'year/month/day',
        },
        naming: {
          strategy: 'hash',
          prefix: '',
          suffix: '',
        },
      },
      image: {
        autoCompress: true,
        compressionQuality: 0.85,
        maxWidth: 1920,
        maxHeight: 1080,
        watermark: {
          enabled: false,
          text: '',
          position: 'bottom-right',
          opacity: 0.7,
        },
      },
      links: {
        format: 'markdown',
        cdn: 'github',
        customDomain: '',
      },
      user: {
        id: 1,
        login: 'testuser',
        email: 'test@example.com',
        avatar: 'https://example.com/avatar.jpg',
      },
      lastSync: new Date().toISOString(),
    }

    // 更新仓库配置
    const newRepoConfig = {
      owner: 'updateduser',
      name: 'updated-repo',
      branch: 'main',
    }

    configStore.updateRepository(newRepoConfig)

    expect(configStore.config).not.toBeNull()
    if (configStore.config) {
      expect(configStore.config.storage.repository).toEqual(newRepoConfig)
    }
  })

  it('should update image configuration', () => {
    // 先创建一个默认配置
    configStore.$state.config = {
      version: '3.0.0',
      storage: {
        repository: {
          owner: 'testuser',
          name: 'test-repo',
          branch: 'main',
        },
        directory: {
          mode: 'auto',
          path: 'images',
          autoPattern: 'year/month/day',
        },
        naming: {
          strategy: 'hash',
          prefix: '',
          suffix: '',
        },
      },
      image: {
        autoCompress: true,
        compressionQuality: 0.85,
        maxWidth: 1920,
        maxHeight: 1080,
        watermark: {
          enabled: false,
          text: '',
          position: 'bottom-right',
          opacity: 0.7,
        },
      },
      links: {
        format: 'markdown',
        cdn: 'github',
        customDomain: '',
      },
      user: {
        id: 1,
        login: 'testuser',
        email: 'test@example.com',
        avatar: 'https://example.com/avatar.jpg',
      },
      lastSync: new Date().toISOString(),
    }

    // 更新图片配置
    const newImageConfig = {
      autoCompress: false,
      compressionQuality: 0.9,
      maxWidth: 2560,
      maxHeight: 1440,
      watermark: {
        enabled: true,
        text: 'TEST',
        position: 'bottom-left' as const,
        opacity: 0.5,
      },
    }

    configStore.updateImage(newImageConfig)

    expect(configStore.config).not.toBeNull()
    if (configStore.config) {
      expect(configStore.config.image).toEqual(newImageConfig)
    }
  })

  it('should update links configuration', () => {
    // 先创建一个默认配置
    configStore.$state.config = {
      version: '3.0.0',
      storage: {
        repository: {
          owner: 'testuser',
          name: 'test-repo',
          branch: 'main',
        },
        directory: {
          mode: 'auto',
          path: 'images',
          autoPattern: 'year/month/day',
        },
        naming: {
          strategy: 'hash',
          prefix: '',
          suffix: '',
        },
      },
      image: {
        autoCompress: true,
        compressionQuality: 0.85,
        maxWidth: 1920,
        maxHeight: 1080,
        watermark: {
          enabled: false,
          text: '',
          position: 'bottom-right',
          opacity: 0.7,
        },
      },
      links: {
        format: 'markdown',
        cdn: 'github',
        customDomain: '',
      },
      user: {
        id: 1,
        login: 'testuser',
        email: 'test@example.com',
        avatar: 'https://example.com/avatar.jpg',
      },
      lastSync: new Date().toISOString(),
    }

    // 更新链接配置
    const newLinksConfig = {
      format: 'html' as const,
      cdn: 'jsdelivr' as const,
      customDomain: 'https://cdn.example.com',
    }

    configStore.updateLinks(newLinksConfig)

    expect(configStore.config).not.toBeNull()
    if (configStore.config) {
      expect(configStore.config.links).toEqual(newLinksConfig)
    }
  })

  it('should update loading state when setting state directly', () => {
    // 直接修改状态，模拟loading的变化
    configStore.$state.loading = true
    expect(configStore.loading).toBe(true)

    configStore.$state.loading = false
    expect(configStore.loading).toBe(false)
  })
})
