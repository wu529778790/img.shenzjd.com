<template>
  <div class="max-w-4xl mx-auto">
    <!-- 未登录状态：显示引导界面 -->
    <div
      v-if="!authStore.isAuthenticated"
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center"
    >
      <div class="max-w-md mx-auto">
        <div
          class="w-20 h-20 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center"
        >
          <svg
            class="w-10 h-10 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          需要登录
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mb-8">
          请使用 GitHub 账号登录以配置图床
        </p>
        <button
          @click="authStore.loginWithGitHub"
          class="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
            />
          </svg>
          使用 GitHub 登录
        </button>
      </div>
    </div>

    <!-- 已登录状态：显示配置界面 -->
    <div
      v-else
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
    >
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        配置管理
      </h1>

      <!-- Repository Configuration -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          仓库配置
        </h2>

        <div class="space-y-4">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              仓库所有者
            </label>
            <input
              v-model="config.repositoryOwner"
              type="text"
              :placeholder="authStore.user?.login || 'username'"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              GitHub 用户名
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              仓库名称
            </label>
            <input
              v-model="config.repositoryName"
              type="text"
              placeholder="img.shenzjd.com"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              分支
            </label>
            <div class="flex gap-2">
              <select
                v-model="config.branch"
                :disabled="loadingBranches"
                class="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>选择分支</option>
                <option
                  v-for="branch in branches"
                  :key="branch"
                  :value="branch"
                >
                  {{ branch }}
                </option>
              </select>
              <button
                @click="loadBranches"
                :disabled="
                  loadingBranches ||
                  !config.repositoryOwner ||
                  !config.repositoryName
                "
                class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                title="刷新分支列表"
              >
                <svg
                  v-if="loadingBranches"
                  class="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <svg
                  v-else
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              从 GitHub 仓库加载分支列表
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              存储目录
            </label>
            <div class="flex gap-2">
              <select
                v-model="config.directory"
                :disabled="loadingDirectories"
                class="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>选择目录</option>
                <option value="/">/ (根目录)</option>
                <option value="images">images</option>
                <option value="img">img</option>
                <option value="assets">assets</option>
                <option value="uploads">uploads</option>
                <option value="public">public</option>
                <option value="static">static</option>
                <option
                  v-for="dir in directories"
                  :key="dir.path"
                  :value="dir.path"
                >
                  {{ dir.name }}
                </option>
              </select>
              <button
                @click="loadDirectories"
                :disabled="
                  loadingDirectories ||
                  !config.repositoryOwner ||
                  !config.repositoryName ||
                  !config.branch
                "
                class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                title="刷新目录列表"
              >
                <svg
                  v-if="loadingDirectories"
                  class="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <svg
                  v-else
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              从 GitHub 仓库加载目录列表（需先选择分支）
            </p>
          </div>
        </div>
      </div>

      <!-- Repository Actions -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          仓库操作
        </h2>

        <div class="flex flex-wrap gap-3">
          <button
            @click="checkRepository"
            :disabled="
              checkingRepo || !config.repositoryOwner || !config.repositoryName
            "
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              v-if="checkingRepo"
              class="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>{{ checkingRepo ? "检查中..." : "检查仓库" }}</span>
          </button>

          <button
            @click="createRepository"
            :disabled="
              creatingRepo || !config.repositoryOwner || !config.repositoryName
            "
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              v-if="creatingRepo"
              class="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>{{ creatingRepo ? "创建中..." : "创建仓库" }}</span>
          </button>

          <button
            @click="initializeRepository"
            :disabled="
              initializingRepo ||
              !config.repositoryOwner ||
              !config.repositoryName ||
              !config.branch
            "
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              v-if="initializingRepo"
              class="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>{{ initializingRepo ? "初始化中..." : "初始化仓库" }}</span>
          </button>
        </div>

        <div
          v-if="repoStatus"
          class="mt-3 p-3 rounded-lg text-sm"
          :class="
            repoStatus.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          "
        >
          {{ repoStatus.message }}
        </div>
      </div>

      <!-- Advanced Settings -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          高级设置
        </h2>

        <div class="space-y-4">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              自定义域名
            </label>
            <input
              v-model="config.customDomain"
              type="text"
              placeholder="https://cdn.example.com"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              CDN 域名，留空使用默认链接
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              水印文字
            </label>
            <input
              v-model="config.watermarkText"
              type="text"
              placeholder="© Your Name"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              图片压缩
            </label>
            <select
              v-model="config.imageCompression"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="none">不压缩</option>
              <option value="light">轻度压缩</option>
              <option value="medium">中度压缩</option>
              <option value="heavy">重度压缩</option>
            </select>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              按日期分类
            </label>
            <div class="flex items-center">
              <input
                v-model="config.timestampDir"
                type="checkbox"
                class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                自动按年/月/日创建子目录
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Actions -->
      <div
        class="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700"
      >
        <button
          @click="saveConfig"
          :disabled="saving"
          class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg
            v-if="saving"
            class="w-4 h-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>{{ saving ? "保存中..." : "保存配置" }}</span>
        </button>

        <button
          @click="resetConfig"
          class="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
        >
          重置
        </button>

        <button
          @click="loadFromGitHub"
          :disabled="loadingGitHub"
          class="px-6 py-2.5 bg-blue-200 dark:bg-blue-900/30 hover:bg-blue-300 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg
            v-if="loadingGitHub"
            class="w-4 h-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>{{ loadingGitHub ? "加载中..." : "从 GitHub 加载" }}</span>
        </button>
      </div>

      <!-- Repository Info -->
      <div
        v-if="repoInfo"
        class="mt-6 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
          仓库信息
        </h3>
        <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div>完整名称: {{ repoInfo.full_name }}</div>
          <div>描述: {{ repoInfo.description || "-" }}</div>
          <div>默认分支: {{ repoInfo.default_branch }}</div>
          <div>私有仓库: {{ repoInfo.private ? "是" : "否" }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { apiFetch } from "~/utils/api-fetch";

const authStore = useAuthStore();
const configStore = useConfigStore();
const toastStore = useToastStore();

// 监听认证状态变化，自动加载配置
watch(
  () => authStore.isAuthenticated,
  async (isAuthenticated) => {
    if (isAuthenticated) {
      await loadConfigFromStore();
    }
  }
);

// 组件挂载时自动加载配置
onMounted(async () => {
  if (authStore.isAuthenticated) {
    await loadConfigFromStore();
  }
});

// 从store加载配置的函数
async function loadConfigFromStore() {
  try {
    await configStore.loadConfig();
    if (configStore.config) {
      // 从嵌套结构转换为页面使用的扁平结构
      config.value.repositoryOwner =
        configStore.config.storage.repository.owner;
      config.value.repositoryName =
        configStore.config.storage.repository.name;
      config.value.branch = configStore.config.storage.repository.branch;
      config.value.directory = configStore.config.storage.directory.path;
      config.value.customDomain = configStore.config.links.customDomain;
      config.value.watermarkText = configStore.config.image.watermark.text;
      config.value.imageCompression = configStore.config.image.autoCompress
        ? "medium"
        : "none";
      config.value.timestampDir =
        configStore.config.storage.directory.autoPattern ===
        "year/month/day";
    } else {
      // 设置默认值
      config.value.repositoryOwner = authStore.user?.login || "";
      config.value.repositoryName = "img.shenzjd.com";
      config.value.branch = "main";
      config.value.directory = "images";
    }
  } catch (error) {
    toastStore.error("加载配置失败");
  }
};

const config = ref({
  repositoryOwner: "",
  repositoryName: "",
  branch: "",
  directory: "",
  customDomain: "",
  watermarkText: "",
  imageCompression: "none",
  timestampDir: false,
});

const checkingRepo = ref(false);
const creatingRepo = ref(false);
const initializingRepo = ref(false);
const saving = ref(false);
const loadingGitHub = ref(false);

const repoStatus = ref<{ type: "success" | "error"; message: string } | null>(
  null
);
const repoInfo = ref<any>(null);

// 分支和目录列表
const branches = ref<string[]>([]);
const directories = ref<Array<{ path: string; name: string }>>([]);
const loadingBranches = ref(false);
const loadingDirectories = ref(false);

// 监听仓库信息变化，自动加载分支
watch(
  () => [config.value.repositoryOwner, config.value.repositoryName],
  async ([owner, repo]) => {
    if (owner && repo) {
      await loadBranches();
    }
  },
  { immediate: false }
);

// 监听分支变化，自动加载目录
watch(
  () => config.value.branch,
  async (branch) => {
    if (branch) {
      await loadDirectories();
    }
  },
  { immediate: false }
);

// 加载分支列表
const loadBranches = async () => {
  if (!config.value.repositoryOwner || !config.value.repositoryName) {
    toastStore.error("请先填写仓库信息");
    return;
  }

  loadingBranches.value = true;
  branches.value = [];

  try {
    const response = (await apiFetch("/api/repo/branches", {
      query: {
        owner: config.value.repositoryOwner,
        repo: config.value.repositoryName,
      },
    })) as any;

    if (response && response.data) {
      branches.value = response.data.map((b: any) => b.name);
      // 如果当前分支不在列表中，清空
      if (
        config.value.branch &&
        !branches.value.includes(config.value.branch)
      ) {
        // 保留原有选择，因为它可能是有效的
      }
      toastStore.success(`加载了 ${branches.value.length} 个分支`);
    }
  } catch (error: any) {
    console.error("加载分支失败:", error);
    toastStore.error(error.message || "加载分支失败");
  } finally {
    loadingBranches.value = false;
  }
};

// 初始加载配置
if (authStore.isAuthenticated) {
  configStore.loadConfig();
}

// 加载目录列表
const loadDirectories = async () => {
  if (
    !config.value.repositoryOwner ||
    !config.value.repositoryName ||
    !config.value.branch
  ) {
    toastStore.error("请先填写仓库信息和选择分支");
    return;
  }

  loadingDirectories.value = true;
  directories.value = [];

  try {
    const response = (await apiFetch("/api/repo/contents", {
      query: {
        owner: config.value.repositoryOwner,
        repo: config.value.repositoryName,
        path: "",
        ref: config.value.branch,
      },
    })) as any;

    if (response && response.data && Array.isArray(response.data)) {
      // 只显示目录，过滤文件
      directories.value = response.data
        .filter((item: any) => item.type === "dir")
        .map((item: any) => ({
          path: item.path,
          name: item.name,
        }));
      toastStore.success(`加载了 ${directories.value.length} 个目录`);
    }
  } catch (error: any) {
    console.error("加载目录失败:", error);
    toastStore.error(error.message || "加载目录失败");
  } finally {
    loadingDirectories.value = false;
  }
};

// 检查仓库是否存在
const checkRepository = async () => {
  checkingRepo.value = true;
  repoStatus.value = null;
  repoInfo.value = null;

  try {
    const response = await apiFetch("/api/repo/list");

    const repo = response.data?.find(
      (r: any) =>
        r.name === config.value.repositoryName &&
        r.owner === config.value.repositoryOwner
    );

    if (repo) {
      repoStatus.value = {
        type: "success",
        message: "✅ 仓库存在",
      };
      repoInfo.value = repo;
    } else {
      repoStatus.value = {
        type: "error",
        message: "❌ 仓库不存在",
      };
    }
  } catch (error: any) {
    repoStatus.value = {
      type: "error",
      message: "❌ " + (error.message || "检查失败"),
    };
  } finally {
    checkingRepo.value = false;
  }
};

// 创建仓库
const createRepository = async () => {
  creatingRepo.value = true;
  repoStatus.value = null;

  try {
    const response = await apiFetch("/api/repo/create", {
      method: "POST",
      body: {
        name: config.value.repositoryName,
        private: false,
        autoInit: false,
      },
    });

    repoStatus.value = {
      type: "success",
      message: "✅ 仓库创建成功",
    };
    repoInfo.value = response.data;
    toastStore.success("仓库创建成功");
  } catch (error: any) {
    repoStatus.value = {
      type: "error",
      message: "❌ " + (error.message || "创建失败"),
    };
    toastStore.error("创建失败");
  } finally {
    creatingRepo.value = false;
  }
};

// 初始化仓库（创建 README 和 .gitignore）
const initializeRepository = async () => {
  initializingRepo.value = true;
  repoStatus.value = null;

  try {
    await apiFetch("/api/repo/init", {
      method: "POST",
      body: {
        owner: config.value.repositoryOwner,
        repo: config.value.repositoryName,
        branch: config.value.branch,
      },
    });

    repoStatus.value = {
      type: "success",
      message: "✅ 初始化成功",
    };
    toastStore.success("初始化成功");
  } catch (error: any) {
    repoStatus.value = {
      type: "error",
      message: "❌ " + (error.message || "初始化失败"),
    };
    toastStore.error("初始化失败");
  } finally {
    initializingRepo.value = false;
  }
};

// 保存配置
const saveConfig = async () => {
  if (
    !config.value.repositoryOwner ||
    !config.value.repositoryName ||
    !config.value.branch ||
    !config.value.directory
  ) {
    toastStore.error("请填写所有必填项");
    return;
  }

  // 先更新 store 中的配置
  if (!configStore.config) {
    // 创建新配置
    configStore.config = {
      version: "3.0.0",
      storage: {
        repository: {
          owner: config.value.repositoryOwner,
          name: config.value.repositoryName,
          branch: config.value.branch,
        },
        directory: {
          mode: "custom",
          path: config.value.directory,
          autoPattern: config.value.timestampDir ? "year/month/day" : "date",
        },
        naming: {
          strategy: "hash",
          prefix: "",
          suffix: "",
        },
      },
      image: {
        autoCompress: config.value.imageCompression !== "none",
        compressionQuality: 0.85,
        maxWidth: 1920,
        maxHeight: 1080,
        watermark: {
          enabled: !!config.value.watermarkText,
          text: config.value.watermarkText,
          position: "bottom-right",
          opacity: 0.5,
        },
      },
      links: {
        format: "markdown",
        cdn: "github",
        customDomain: config.value.customDomain,
      },
      user: {
        id: authStore.user?.id || 0,
        login: authStore.user?.login || "",
        email: authStore.user?.email || "",
        avatar: authStore.user?.avatarUrl || "",
      },
      lastSync: new Date().toISOString(),
    };
  } else {
    // 更新现有配置
    configStore.config.storage.repository.owner = config.value.repositoryOwner;
    configStore.config.storage.repository.name = config.value.repositoryName;
    configStore.config.storage.repository.branch = config.value.branch;
    configStore.config.storage.directory.path = config.value.directory;
    configStore.config.storage.directory.autoPattern = config.value.timestampDir
      ? "year/month/day"
      : "date";
    configStore.config.image.autoCompress =
      config.value.imageCompression !== "none";
    configStore.config.image.watermark.text = config.value.watermarkText;
    configStore.config.image.watermark.enabled = !!config.value.watermarkText;
    configStore.config.links.customDomain = config.value.customDomain;
  }

  saving.value = true;
  try {
    await configStore.saveConfig();
    toastStore.success("保存成功");
  } catch (error) {
    toastStore.error("保存失败");
  } finally {
    saving.value = false;
  }
};

// 重置配置
const resetConfig = () => {
  config.value = {
    repositoryOwner: authStore.user?.login || "",
    repositoryName: "img.shenzjd.com",
    branch: "main",
    directory: "images",
    customDomain: "",
    watermarkText: "",
    imageCompression: "none",
    timestampDir: false,
  };
  repoStatus.value = null;
  repoInfo.value = null;
  toastStore.info("已重置为默认配置");
};
// 从 GitHub 加载配置
const loadFromGitHub = async () => {
  if (!config.value.repositoryOwner || !config.value.repositoryName) {
    toastStore.error("请先填写仓库信息");
    return;
  }

  loadingGitHub.value = true;
  try {
    const response = await apiFetch("/api/repo/contents", {
      query: {
        owner: config.value.repositoryOwner,
        repo: config.value.repositoryName,
        path: "",
        ref: config.value.branch || "main",
      },
    });
    // 检查是否有 .imgconfig.json 文件
    const configFile = response.data?.find(
      (f: any) => f.name === ".imgconfig.json"
    );
    if (configFile) {
      const configData = await apiFetch(configFile.download_url);

      if (configData) {
        const parsed = JSON.parse(configData);
        config.value = { ...config.value, ...parsed };
        toastStore.success("加载成功");
      }
    } else {
      toastStore.info("未找到配置文件");
    }
  } catch (error) {
    toastStore.error("加载失败");
  } finally {
    loadingGitHub.value = false;
  }
};
</script>
