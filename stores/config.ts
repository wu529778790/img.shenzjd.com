import { defineStore } from "pinia";
import { apiFetch } from "~/utils/api-fetch";

export interface StorageConfig {
  repository: {
    owner: string;
    name: string;
    branch: string;
  };
  directory: {
    mode: "auto" | "custom" | "root";
    path: string;
    autoPattern: "date" | "year/month" | "year/month/day";
  };
  naming: {
    strategy: "hash" | "timestamp" | "original" | "custom";
    prefix: string;
    suffix: string;
  };
}

export interface ImageConfig {
  autoCompress: boolean;
  compressionQuality: number;
  maxWidth: number;
  maxHeight: number;
  watermark: {
    enabled: boolean;
    text: string;
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    opacity: number;
  };
}

export interface LinkConfig {
  format: "markdown" | "html" | "bbcode" | "plain";
  cdn: "github" | "jsdelivr" | "custom";
  customDomain: string;
}

export interface UserConfig {
  version: string;
  storage: StorageConfig;
  image: ImageConfig;
  links: LinkConfig;
  user: {
    id: number;
    login: string;
    email: string;
    avatar: string;
  };
  lastSync: string;
}

export interface ConfigState {
  config: UserConfig | null;
  loading: boolean;
  syncing: boolean;
  repoList: any[];
  branchList: any[];
}

export const useConfigStore = defineStore("config", {
  state: (): ConfigState => ({
    config: null,
    loading: false,
    syncing: false,
    repoList: [],
    branchList: [],
  }),

  getters: {
    getConfig: (state) => state.config,
    getStorageConfig: (state) => state.config?.storage,
    getImageConfig: (state) => state.config?.image,
    getLinkConfig: (state) => state.config?.links,
    getRepository: (state) => state.config?.storage.repository,
    getDirectory: (state) => state.config?.storage.directory,
    getNaming: (state) => state.config?.storage.naming,
  },

  actions: {
    /**
     * 从云端加载配置
     */
    async loadConfig() {
      const authStore = useAuthStore();

      if (!authStore.isAuthenticated) {
        return;
      }

      this.loading = true;

      try {
        const response = await apiFetch("/api/user/config", {
          query: {
            owner: authStore.user?.login,
            repo: "img.shenzjd.com",
          },
        });

        if (response.data) {
          this.config = response.data;
        } else {
          // 创建默认配置
          this.createDefaultConfig();
        }
      } catch (error) {
        console.error("Load config error:", error);
        this.createDefaultConfig();
      } finally {
        this.loading = false;
      }
    },

    /**
     * 保存配置到云端
     */
    async saveConfig() {
      const authStore = useAuthStore();
      const toastStore = useToastStore();

      if (!authStore.isAuthenticated || !this.config) {
        toastStore.error("未登录或配置不存在");
        return false;
      }

      this.syncing = true;

      try {
        // 更新最后同步时间
        this.config.lastSync = new Date().toISOString();

        await apiFetch("/api/user/config", {
          method: "PUT",
          body: {
            config: this.config,
            repository: this.config.storage.repository,
          },
        });

        toastStore.success("配置已保存到云端");
        return true;
      } catch (error: any) {
        console.error("Save config error:", error);
        toastStore.error("保存配置失败: " + (error.message || "未知错误"));
        return false;
      } finally {
        this.syncing = false;
      }
    },

    /**
     * 更新仓库配置
     */
    updateRepository(repository: StorageConfig["repository"]) {
      if (!this.config) return;

      this.config.storage.repository = {
        ...this.config.storage.repository,
        ...repository,
      };
    },

    /**
     * 更新目录配置
     */
    updateDirectory(directory: StorageConfig["directory"]) {
      if (!this.config) return;

      this.config.storage.directory = {
        ...this.config.storage.directory,
        ...directory,
      };
    },

    /**
     * 更新命名配置
     */
    updateNaming(naming: StorageConfig["naming"]) {
      if (!this.config) return;

      this.config.storage.naming = {
        ...this.config.storage.naming,
        ...naming,
      };
    },

    /**
     * 更新图片配置
     */
    updateImage(image: ImageConfig) {
      if (!this.config) return;

      this.config.image = {
        ...this.config.image,
        ...image,
      };
    },

    /**
     * 更新链接配置
     */
    updateLinks(links: LinkConfig) {
      if (!this.config) return;

      this.config.links = {
        ...this.config.links,
        ...links,
      };
    },

    /**
     * 重置为默认配置
     */
    resetToDefault() {
      this.createDefaultConfig();
    },

    /**
     * 创建默认配置
     */
    createDefaultConfig() {
      const authStore = useAuthStore();
      const user = authStore.user;

      if (!user) return;

      this.config = {
        version: "3.0.0",
        storage: {
          repository: {
            owner: user.login,
            name: "img.shenzjd.com",
            branch: "main",
          },
          directory: {
            mode: "auto",
            path: "images",
            autoPattern: "year/month/day",
          },
          naming: {
            strategy: "hash",
            prefix: "",
            suffix: "",
          },
        },
        image: {
          autoCompress: true,
          compressionQuality: 0.85,
          maxWidth: 1920,
          maxHeight: 1080,
          watermark: {
            enabled: false,
            text: "",
            position: "bottom-right",
            opacity: 0.5,
          },
        },
        links: {
          format: "markdown",
          cdn: "github",
          customDomain: "",
        },
        user: {
          id: user.id,
          login: user.login,
          email: user.email,
          avatar: user.avatarUrl,
        },
        lastSync: new Date().toISOString(),
      };
    },

    /**
     * 获取仓库列表
     */
    async loadRepoList() {
      const authStore = useAuthStore();

      if (!authStore.isAuthenticated) return;

      try {
        const response = await apiFetch("/api/repo/list");
        this.repoList = response.data || [];
      } catch (error) {
        console.error("Load repo list error:", error);
      }
    },

    /**
     * 获取分支列表
     */
    async loadBranchList(owner: string, repo: string) {
      try {
        const response = await apiFetch("/api/repo/branches", {
          query: { owner, repo },
        });
        this.branchList = response.data || [];
      } catch (error) {
        console.error("Load branch list error:", error);
        this.branchList = [];
      }
    },

    /**
     * 创建新仓库
     */
    async createRepository(
      name: string,
      description: string,
      isPrivate: boolean
    ) {
      const toastStore = useToastStore();

      try {
        const response = await apiFetch("/api/repo/create", {
          method: "POST",
          body: {
            name,
            description,
            private: isPrivate,
          },
        });

        toastStore.success("仓库创建成功");
        await this.loadRepoList();

        return response.data;
      } catch (error: any) {
        toastStore.error("创建仓库失败: " + (error.message || "未知错误"));
        return null;
      }
    },

    /**
     * 初始化仓库
     */
    async initRepository() {
      const toastStore = useToastStore();

      if (!this.config) return false;

      try {
        await apiFetch("/api/repo/init", {
          method: "POST",
          body: {
            owner: this.config.storage.repository.owner,
            repo: this.config.storage.repository.name,
            branch: this.config.storage.repository.branch,
          },
        });

        toastStore.success("仓库初始化完成");
        return true;
      } catch (error: any) {
        toastStore.error("初始化失败: " + (error.message || "未知错误"));
        return false;
      }
    },
  },
});