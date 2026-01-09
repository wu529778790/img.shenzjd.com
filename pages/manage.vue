<template>
  <div class="max-w-7xl mx-auto">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          文件管理
        </h1>
        
        <!-- Warning -->
        <div v-if="!configStore.config?.storage.repository.name" class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-3">
          <p class="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ 请先在<a href="/config" class="text-yellow-600 dark:text-yellow-300 hover:underline">配置页</a>设置仓库信息
          </p>
        </div>

        <!-- Search and Filter -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索文件名或路径..."
              class="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div class="flex gap-2">
            <select
              v-model="filterType"
              class="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            >
              <option value="all">全部文件</option>
              <option value="image">图片</option>
              <option value="other">其他文件</option>
            </select>
            
            <select
              v-model="sortBy"
              class="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            >
              <option value="name">按名称</option>
              <option value="size">按大小</option>
              <option value="date">按日期</option>
            </select>
          </div>
          
          <div class="flex gap-2">
            <select
              v-model="viewMode"
              class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            >
              <option value="grid">网格视图</option>
              <option value="list">列表视图</option>
            </select>
            
            <select
              v-model="itemsPerPage"
              class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            >
              <option value="20">20个/页</option>
              <option value="50">50个/页</option>
              <option value="100">100个/页</option>
            </select>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-2">
          <button
            @click="loadFiles"
            :disabled="loading || !configStore.config?.storage.repository.name"
            class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{{ loading ? '加载中...' : '刷新文件' }}</span>
          </button>

          <div v-if="selectedPaths.size > 0" class="flex gap-2">
            <button
              @click="copySelectedUrls"
              class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              📋 复制链接 ({{ selectedPaths.size }})
            </button>
            
            <button
              @click="downloadSelected"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              💾 下载 ({{ selectedPaths.size }})
            </button>
            
            <button
              @click="showDeleteConfirm = true"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              🗑️ 删除 ({{ selectedPaths.size }})
            </button>
            
            <button
              @click="deselectAll"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              取消选择
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading && files.length === 0" class="p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p class="text-gray-500 dark:text-gray-400">加载文件中...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="files.length === 0" class="p-12 text-center">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400 mb-3">暂无文件</p>
        <button
          @click="loadFiles"
          :disabled="!configStore.config?.storage.repository.name"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          加载文件
        </button>
      </div>

      <!-- Files Grid -->
      <div v-else-if="viewMode === 'grid'" class="p-4">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <div
            v-for="file in paginatedFiles"
            :key="file.path"
            class="relative group"
          >
            <!-- Selection Checkbox -->
            <div class="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                :checked="selectedPaths.has(file.path)"
                @change="toggleSelection(file.path)"
                class="w-4 h-4 text-primary-600 bg-white/80 dark:bg-gray-700/80 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:border-gray-600 cursor-pointer"
              />
            </div>

            <!-- File Card -->
            <div 
              class="bg-gray-50 dark:bg-gray-900/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md cursor-pointer"
              @click="handleFileClick(file)"
            >
              <!-- Preview -->
              <div class="relative aspect-square bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <img
                  v-if="isImage(file)"
                  :src="file.download_url"
                  :alt="file.name"
                  class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <svg class="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                
                <!-- File Type Badge -->
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <span class="text-xs text-white font-medium">{{ getFileExtension(file.name) }}</span>
                </div>
              </div>

              <!-- File Info -->
              <div class="p-3">
                <h3 class="font-medium text-gray-900 dark:text-white truncate text-sm">
                  {{ file.name }}
                </h3>
                <div class="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{{ formatFileSize(file.size) }}</span>
                  <span>{{ formatDate(file.download_url) }}</span>
                </div>
              </div>
            </div>

            <!-- File Actions -->
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 space-y-1">
              <button
                @click.stop="copyUrl(file)"
                class="p-1.5 bg-gray-800/80 hover:bg-gray-800 text-white rounded-lg transition-colors"
                title="复制链接"
              >
                📋
              </button>
              <button
                @click.stop="downloadFile(file)"
                class="p-1.5 bg-gray-800/80 hover:bg-gray-800 text-white rounded-lg transition-colors"
                title="下载文件"
              >
                💾
              </button>
              <button
                @click.stop="renameFile(file)"
                class="p-1.5 bg-gray-800/80 hover:bg-gray-800 text-white rounded-lg transition-colors"
                title="重命名"
              >
                ✏️
              </button>
              <button
                @click.stop="showDeleteConfirmForSingle(file)"
                class="p-1.5 bg-gray-800/80 hover:bg-red-800 text-white rounded-lg transition-colors"
                title="删除"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else-if="viewMode === 'list'" class="overflow-x-auto">
        <table class="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                  class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                预览
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                文件名
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                大小
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                类型
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                日期
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr 
              v-for="file in paginatedFiles" 
              :key="file.path"
              class="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
            >
              <td class="px-4 py-3 whitespace-nowrap">
                <input
                  type="checkbox"
                  :checked="selectedPaths.has(file.path)"
                  @change="toggleSelection(file.path)"
                  class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <img
                  v-if="isImage(file)"
                  :src="file.download_url"
                  :alt="file.name"
                  class="w-12 h-12 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  @click="previewFile(file)"
                  loading="lazy"
                />
                <div v-else class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer" @click="previewFile(file)">
                  <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:underline" @click="previewFile(file)">
                  {{ file.name }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                  {{ file.path }}
                </div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ formatFileSize(file.size) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ file.type || getFileExtension(file.name) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(file.download_url) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
                <div class="flex gap-2">
                  <button @click="copyUrl(file)" class="text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" title="复制链接">
                    📋
                  </button>
                  <button @click="downloadFile(file)" class="text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" title="下载">
                    💾
                  </button>
                  <button @click="renameFile(file)" class="text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" title="重命名">
                    ✏️
                  </button>
                  <button @click="showDeleteConfirmForSingle(file)" class="text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="删除">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="files.length > 0" class="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          显示 {{ paginatedFiles.length }} 个文件 (共 {{ files.length }} 个)
        </div>
        <div class="flex gap-2">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            上一页
          </button>
          <span class="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Preview Modal -->
  <div v-if="previewItem" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" @click="previewItem = null">
    <div class="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden" @click.stop>
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 class="font-bold text-gray-900 dark:text-white">{{ previewItem.name }}</h3>
        <div class="flex gap-2">
          <button @click="copyUrl(previewItem)" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            📋
          </button>
          <button @click="downloadFile(previewItem)" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            💾
          </button>
          <button @click="previewItem = null" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div class="p-4 bg-gray-50 dark:bg-gray-900/30">
        <img
          v-if="isImage(previewItem)"
          :src="previewItem.download_url"
          :alt="previewItem.name"
          class="max-h-[70vh] max-w-full mx-auto rounded object-contain"
        />
        <div v-else class="text-center py-8">
          <p class="text-gray-600 dark:text-gray-400">预览不可用</p>
          <a :href="previewItem.download_url" target="_blank" class="text-primary-600 hover:underline mt-2 inline-block">
            在新标签页打开
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- Rename Modal -->
  <div v-if="renameItem" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
        重命名文件
      </h3>
      <div class="space-y-3 mb-4">
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">
            当前名称
          </label>
          <input
            :value="renameItem.name"
            disabled
            class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white opacity-60"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">
            新名称
          </label>
          <input
            v-model="newName"
            type="text"
            placeholder="输入新文件名"
            class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            @keydown.enter="confirmRename"
          />
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <button
          @click="cancelRename"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
        >
          取消
        </button>
        <button
          @click="confirmRename"
          :disabled="!newName || newName === renameItem.name || renaming"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ renaming ? '重命名中...' : '确认重命名' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
        确认删除
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        此操作将永久删除选中的 {{ selectedPaths.size }} 个文件，且无法恢复。
      </p>
      <div class="flex justify-end gap-2">
        <button
          @click="showDeleteConfirm = false"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
        >
          取消
        </button>
        <button
          @click="confirmDeleteSelected"
          :disabled="deleting"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ deleting ? '删除中...' : '确认删除' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Single Delete Confirmation Modal -->
  <div v-if="deleteSingleItem" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
        确认删除
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        此操作将永久删除文件 <span class="font-mono text-red-600 dark:text-red-400">{{ deleteSingleItem.name }}</span>，且无法恢复。
      </p>
      <div class="flex justify-end gap-2">
        <button
          @click="deleteSingleItem = null"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
        >
          取消
        </button>
        <button
          @click="confirmDeleteSingle"
          :disabled="deleting"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ deleting ? '删除中...' : '确认删除' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useConfigStore } from '~/stores/config'
import { useToastStore } from '~/stores/toast'
import { apiFetch } from '~/utils/api-fetch'

interface FileItem {
  name: string
  path: string
  type: string
  size: number
  download_url: string
  sha: string
}

const authStore = useAuthStore()
const configStore = useConfigStore()
const toastStore = useToastStore()

// Core state
const files = ref<FileItem[]>([])
const directories = ref<DirectoryItem[]>([])
const loading = ref(false)
const deleting = ref(false)
const renaming = ref(false)
const selectedPaths = ref<Set<string>>(new Set())

// UI state
const searchQuery = ref('')
const filterType = ref<'all' | 'image' | 'other'>('all')
const sortBy = ref<'name' | 'date' | 'size'>('name')
const viewMode = ref<'grid' | 'list'>('grid')
const itemsPerPage = ref(20)
const currentPage = ref(1)

// Modal state
const previewItem = ref<FileItem | null>(null)
const renameItem = ref<FileItem | null>(null)
const newName = ref('')
const deleteSingleItem = ref<FileItem | null>(null)
const showDeleteConfirm = ref(false)

// Computed properties
const filteredFiles = computed(() => {
  let result = [...files.value]

  // Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(f => f.name.toLowerCase().includes(query) || f.path.toLowerCase().includes(query))
  }

  // Filter by type
  if (filterType.value === 'image') {
    result = result.filter(f => isImage(f))
  } else if (filterType.value === 'other') {
    result = result.filter(f => !isImage(f))
  }

  // Sort
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'date':
        // Extract date from URL or use current date
        return b.download_url.localeCompare(a.download_url)
      case 'size':
        return (b.size || 0) - (a.size || 0)
      default:
        return 0
    }
  })

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredFiles.value.length / itemsPerPage.value)
})

const paginatedFiles = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredFiles.value.slice(start, end)
})

const isAllSelected = computed(() => {
  return paginatedFiles.value.length > 0 && selectedPaths.value.size === paginatedFiles.value.length
})

// Methods
const loadFiles = async () => {
  if (!configStore.config?.storage.repository.name) {
    toastStore.error('请先配置仓库信息')
    return
  }

  loading.value = true
  selectedPaths.value.clear()
  currentPage.value = 1

  try {
    // 确保使用用户配置的分支，不使用默认值
    const branch = configStore.config.storage.repository.branch
    const response = await apiFetch('/api/management/list', {
      query: {
        owner: configStore.config.storage.repository.owner,
        repo: configStore.config.storage.repository.name,
        path: configStore.config.storage.directory.path || '',
        ref: branch
      }
    })

    // API返回的数据格式是{ success: true, data: { files: [], directories: [] } }
    files.value = response.data?.files || []
    directories.value = response.data?.directories || []
    toastStore.success(`成功加载 ${files.value.length} 个文件`)
  } catch (error: any) {
    toastStore.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const toggleSelection = (path: string) => {
  if (selectedPaths.value.has(path)) {
    selectedPaths.value.delete(path)
  } else {
    selectedPaths.value.add(path)
  }
}

const selectAll = () => {
  paginatedFiles.value.forEach(f => selectedPaths.value.add(f.path))
}

const deselectAll = () => {
  selectedPaths.value.clear()
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    paginatedFiles.value.forEach(f => selectedPaths.value.delete(f.path))
  } else {
    selectAll()
  }
}

const copyUrl = async (file: FileItem) => {
  try {
    await navigator.clipboard.writeText(file.download_url)
    toastStore.success('链接已复制到剪贴板')
  } catch (error) {
    toastStore.error('复制失败')
  }
}

const copySelectedUrls = async () => {
  if (selectedPaths.value.size === 0) return

  const selected = files.value.filter(f => selectedPaths.value.has(f.path))
  const text = selected.map(f => `${f.name}: ${f.download_url}`).join('\n')

  try {
    await navigator.clipboard.writeText(text)
    toastStore.success(`已复制 ${selectedPaths.value.size} 个链接到剪贴板`)
  } catch (error) {
    toastStore.error('复制失败')
  }
}

const downloadFile = (file: FileItem) => {
  const a = document.createElement('a')
  a.href = file.download_url
  a.download = file.name
  a.target = '_blank'
  a.click()
  toastStore.success(`开始下载: ${file.name}`)
}

const downloadSelected = () => {
  if (selectedPaths.value.size === 0) return

  const selected = files.value.filter(f => selectedPaths.value.has(f.path))
  selected.forEach(f => downloadFile(f))
}

const previewFile = (file: FileItem) => {
  previewItem.value = file
}

const handleFileClick = (file: FileItem) => {
  if (isImage(file)) {
    previewFile(file)
  }
}

const renameFile = (file: FileItem) => {
  renameItem.value = file
  newName.value = file.name
}

const cancelRename = () => {
  renameItem.value = null
  newName.value = ''
}

const confirmRename = async () => {
  if (!renameItem.value || !newName.value) return

  if (newName.value === renameItem.value.name) {
    cancelRename()
    return
  }

  renaming.value = true

  const oldPath = renameItem.value.path
  const oldName = renameItem.value.name
  const directory = oldPath.substring(0, oldPath.length - oldName.length)
  const newPath = directory + newName.value

  try {
    await apiFetch('/api/management/rename', {
      method: 'PATCH',
      body: {
        oldPath,
        newPath,
        repository: {
          owner: configStore.config?.storage.repository.owner || '',
          name: configStore.config?.storage.repository.name || '',
          branch: configStore.config?.storage.repository.branch || ''
        }
      }
    })

    // Update local list
    const index = files.value.findIndex(f => f.path === oldPath)
    if (index !== -1 && files.value[index]) {
      files.value[index].name = newName.value
      files.value[index].path = newPath
    }

    // Update selected state
    if (selectedPaths.value.has(oldPath)) {
      selectedPaths.value.delete(oldPath)
      selectedPaths.value.add(newPath)
    }

    toastStore.success('重命名成功')
    cancelRename()
  } catch (error: any) {
    toastStore.error(error.message || '重命名失败')
  } finally {
    renaming.value = false
  }
}

const showDeleteConfirmForSingle = (file: FileItem) => {
  deleteSingleItem.value = file
}

const confirmDeleteSingle = async () => {
  if (!deleteSingleItem.value) return

  try {
    await apiFetch('/api/management/delete', {
      method: 'DELETE',
      body: {
        paths: [deleteSingleItem.value.path],
        message: `Delete: ${deleteSingleItem.value.name}`,
        repository: {
          owner: configStore.config?.storage.repository.owner || '',
          name: configStore.config?.storage.repository.name || '',
          branch: configStore.config?.storage.repository.branch || ''
        },
        shas: [deleteSingleItem.value.sha]
      }
    })

    files.value = files.value.filter(f => f.path !== deleteSingleItem.value?.path)
    selectedPaths.value.delete(deleteSingleItem.value.path)
    toastStore.success('删除成功')
    deleteSingleItem.value = null
  } catch (error: any) {
    toastStore.error(error.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

const confirmDeleteSelected = async () => {
  if (selectedPaths.value.size === 0) return

  deleting.value = true

  const pathsToDelete = Array.from(selectedPaths.value)
  const filesToDelete = files.value.filter(f => pathsToDelete.includes(f.path))

  try {
    await apiFetch('/api/management/delete', {
      method: 'DELETE',
      body: {
        paths: pathsToDelete,
        message: `Delete ${pathsToDelete.length} files`,
        repository: {
          owner: configStore.config?.storage.repository.owner || '',
          name: configStore.config?.storage.repository.name || '',
          branch: configStore.config?.storage.repository.branch || ''
        },
        shas: filesToDelete.map(f => f.sha)
      }
    })

    files.value = files.value.filter(f => !pathsToDelete.includes(f.path))
    selectedPaths.value.clear()
    showDeleteConfirm.value = false
    toastStore.success('删除成功')
  } catch (error: any) {
    toastStore.error(error.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

// Helper functions
const isImage = (file: FileItem): boolean => {
  return file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(file.name)
}

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (url: string): string => {
  // Try to extract date from URL
  const dateMatch = url.match(/(\d{4})[-/](\d{2})[-/](\d{2})/)
  if (dateMatch) {
    return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
  }
  return new Date().toLocaleDateString()
}

const getFileExtension = (name: string) => {
  const parts = name.split('.')
  if (parts.length > 1) {
    const extension = parts[parts.length - 1]
    if (extension) {
      return extension.toUpperCase()
    }
  }
  return 'FILE'
}

// Initialization
onMounted(async () => {
  if (authStore.isAuthenticated && configStore.config?.storage.repository.name) {
    await loadFiles()
  }
})
</script>