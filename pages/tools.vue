<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {{ $t('tools.title') }}
      </h1>

      <!-- Tool Tabs -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="tool in tools"
          :key="tool.id"
          @click="currentTool = tool.id"
          class="px-4 py-2 rounded-lg font-medium transition-colors"
          :class="currentTool === tool.id ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
        >
          {{ tool.name }}
        </button>
      </div>

      <!-- Base64 Converter -->
      <div v-if="currentTool === 'base64'" class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ $t('tools.base64Title') }}</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('tools.input') }}
            </label>
            <textarea
              v-model="base64Input"
              :placeholder="$t('tools.base64Placeholder')"
              class="w-full h-32 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-xs"
            ></textarea>
            <div class="mt-2 flex gap-2">
              <input
                ref="base64FileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="fileToBase64"
              />
              <button
                @click="$refs.base64FileInput?.click()"
                class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                {{ $t('tools.fileToBase64') }}
              </button>
              <button
                @click="convertToBase64"
                class="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded transition-colors"
              >
                {{ $t('tools.convert') }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('tools.output') }}
            </label>
            <textarea
              v-model="base64Output"
              readonly
              :placeholder="$t('tools.outputPlaceholder')"
              class="w-full h-32 px-3 py-2 bg-gray-50 dark:bg-gray-900/30 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-xs"
            ></textarea>
            <div class="mt-2 flex gap-2">
              <button
                @click="copyBase64"
                :disabled="!base64Output"
                class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ $t('tools.copy') }}
              </button>
              <button
                @click="downloadBase64"
                :disabled="!base64Output"
                class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ $t('tools.download') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div v-if="base64Output" class="mt-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ $t('tools.preview') }}
          </label>
          <div class="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 flex justify-center">
            <img :src="base64Output" alt="Preview" class="max-h-64 rounded" />
          </div>
        </div>
      </div>

      <!-- URL Generator -->
      <div v-if="currentTool === 'url'" class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ $t('tools.urlTitle') }}</h2>

        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('tools.baseDomain') }}
            </label>
            <input
              v-model="urlBase"
              type="text"
              placeholder="https://raw.githubusercontent.com/user/repo/branch"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('tools.filePath') }}
            </label>
            <input
              v-model="urlPath"
              type="text"
              placeholder="images/2024/01/01/example.png"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('tools.customDomain') }}
            </label>
            <input
              v-model="customDomain"
              type="text"
              placeholder="https://cdn.example.com"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div class="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('tools.generatedUrl') }}
            </label>
            <div class="flex gap-2 items-start">
              <input
                :value="generatedUrl"
                readonly
                class="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-xs break-all"
              />
              <button
                @click="copyGeneratedUrl"
                :disabled="!generatedUrl"
                class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {{ $t('tools.copy') }}
              </button>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="generateUrl"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              {{ $t('tools.generate') }}
            </button>
            <button
              @click="loadFromConfig"
              :disabled="!configStore.config?.repository"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ $t('tools.loadFromConfig') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Image Compressor -->
      <div v-if="currentTool === 'compress'" class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ $t('tools.compressTitle') }}</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('tools.selectImage') }}
            </label>
            <input
              ref="compressFileInput"
              type="file"
              accept="image/*"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              @change="loadCompressImage"
            />

            <div v-if="compressImage" class="mt-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('tools.quality') }}
              </label>
              <input
                v-model.number="compressQuality"
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                class="w-full"
              />
              <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>10%</span>
                <span>{{ Math.round(compressQuality * 100) }}%</span>
                <span>100%</span>
              </div>

              <div class="mt-4 flex gap-2">
                <button
                  @click="compressImageNow"
                  :disabled="compressing"
                  class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ compressing ? $t('tools.compressing') : $t('tools.compress') }}
                </button>
                <button
                  @click="downloadCompressed"
                  :disabled="!compressedBlob"
                  class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ $t('tools.download') }}
                </button>
              </div>
            </div>
          </div>

          <div>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="bg-gray-50 dark:bg-gray-900/30 p-2 rounded">
                <div class="text-gray-500 dark:text-gray-400">{{ $t('tools.originalSize') }}</div>
                <div class="font-semibold text-gray-900 dark:text-white">{{ formatFileSize(originalSize) }}</div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-900/30 p-2 rounded">
                <div class="text-gray-500 dark:text-gray-400">{{ $t('tools.compressedSize') }}</div>
                <div class="font-semibold text-gray-900 dark:text-white">{{ compressedSize ? formatFileSize(compressedSize) : '-' }}</div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-900/30 p-2 rounded">
                <div class="text-gray-500 dark:text-gray-400">{{ $t('tools.reduction') }}</div>
                <div class="font-semibold text-green-600">{{ reductionPercentage }}</div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-900/30 p-2 rounded">
                <div class="text-gray-500 dark:text-gray-400">{{ $t('tools.dimensions') }}</div>
                <div class="font-semibold text-gray-900 dark:text-white">{{ dimensions }}</div>
              </div>
            </div>

            <div v-if="compressImage" class="mt-4">
              <div class="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-2">
                <img :src="compressImage" alt="Original" class="max-h-32 w-auto mx-auto rounded" />
              </div>
              <div v-if="compressedPreview" class="mt-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg p-2">
                <img :src="compressedPreview" alt="Compressed" class="max-h-32 w-auto mx-auto rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Watermark Tool -->
      <div v-if="currentTool === 'watermark'" class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ $t('tools.watermarkTitle') }}</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('tools.selectImage') }}
            </label>
            <input
              ref="watermarkFileInput"
              type="file"
              accept="image/*"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              @change="loadWatermarkImage"
            />

            <div v-if="watermarkImage" class="mt-4 space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t('tools.watermarkText') }}
                </label>
                <input
                  v-model="watermarkText"
                  type="text"
                  placeholder="© Your Name"
                  class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t('tools.position') }}
                </label>
                <select
                  v-model="watermarkPosition"
                  class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="top-left">{{ $t('tools.posTopLeft') }}</option>
                  <option value="top-right">{{ $t('tools.posTopRight') }}</option>
                  <option value="bottom-left">{{ $t('tools.posBottomLeft') }}</option>
                  <option value="bottom-right">{{ $t('tools.posBottomRight') }}</option>
                  <option value="center">{{ $t('tools.posCenter') }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t('tools.opacity') }}
                </label>
                <input
                  v-model.number="watermarkOpacity"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  class="w-full"
                />
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                  {{ Math.round(watermarkOpacity * 100) }}%
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  @click="addWatermark"
                  :disabled="addingWatermark"
                  class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ addingWatermark ? $t('tools.adding') : $t('tools.addWatermark') }}
                </button>
                <button
                  @click="downloadWatermarked"
                  :disabled="!watermarkedBlob"
                  class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ $t('tools.download') }}
                </button>
              </div>
            </div>
          </div>

          <div>
            <div v-if="watermarkImage" class="space-y-2">
              <div class="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-2">
                <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ $t('tools.original') }}</div>
                <img :src="watermarkImage" alt="Original" class="max-h-40 w-auto mx-auto rounded" />
              </div>
              <div v-if="watermarkedPreview" class="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-2">
                <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ $t('tools.withWatermark') }}</div>
                <img :src="watermarkedPreview" alt="With Watermark" class="max-h-40 w-auto mx-auto rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Batch Rename Tool -->
      <div v-if="currentTool === 'batch'" class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ $t('tools.batchTitle') }}</h2>

        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('tools.selectFiles') }}
            </label>
            <input
              ref="batchFileInput"
              type="file"
              multiple
              accept="image/*"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              @change="loadBatchFiles"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('tools.prefix') }}
              </label>
              <input
                v-model="batchPrefix"
                type="text"
                placeholder="image_"
                class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('tools.suffix') }}
              </label>
              <input
                v-model="batchSuffix"
                type="text"
                placeholder="_v1"
                class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="batchUseTimestamp"
              type="checkbox"
              class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label class="text-sm text-gray-700 dark:text-gray-300">
              {{ $t('tools.useTimestamp') }}
            </label>
          </div>

          <div v-if="batchFiles.length > 0" class="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('tools.preview') }}
            </div>
            <div class="max-h-40 overflow-y-auto space-y-1">
              <div v-for="(file, idx) in batchPreview" :key="idx" class="text-xs font-mono text-gray-600 dark:text-gray-400">
                {{ file.original }} → <span class="text-green-600">{{ file.renamed }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="generateBatchNames"
              :disabled="batchFiles.length === 0"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ $t('tools.generateNames') }}
            </button>
            <button
              @click="downloadBatch"
              :disabled="batchFiles.length === 0"
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ $t('tools.downloadAll') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useConfigStore } from '~/stores/config'
import { useToastStore } from '~/stores/toast'

const configStore = useConfigStore()
const toastStore = useToastStore()

// Tool tabs
const tools = [
  { id: 'base64', name: 'Base64' },
  { id: 'url', name: 'URL Generator' },
  { id: 'compress', name: 'Compressor' },
  { id: 'watermark', name: 'Watermark' },
  { id: 'batch', name: 'Batch Rename' }
]
const currentTool = ref('base64')

// Base64 Converter
const base64Input = ref('')
const base64Output = ref('')
const base64FileInput = ref<HTMLInputElement | null>(null)

// URL Generator
const urlBase = ref('')
const urlPath = ref('')
const customDomain = ref('')
const generatedUrl = ref('')

// Compressor
const compressFileInput = ref<HTMLInputElement | null>(null)
const compressImage = ref('')
const compressQuality = ref(0.8)
const compressedBlob = ref<Blob | null>(null)
const compressedPreview = ref('')
const compressing = ref(false)
const originalSize = ref(0)
const compressedSize = ref(0)
const dimensions = ref('-')

// Watermark
const watermarkFileInput = ref<HTMLInputElement | null>(null)
const watermarkImage = ref('')
const watermarkText = ref('')
const watermarkPosition = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'>('bottom-right')
const watermarkOpacity = ref(0.7)
const watermarkedBlob = ref<Blob | null>(null)
const watermarkedPreview = ref('')
const addingWatermark = ref(false)

// Batch Rename
const batchFileInput = ref<HTMLInputElement | null>(null)
const batchFiles = ref<File[]>([])
const batchPrefix = ref('')
const batchSuffix = ref('')
const batchUseTimestamp = ref(false)
const batchPreview = ref<{ original: string; renamed: string }[]>([])

// Base64 functions
const convertToBase64 = () => {
  if (!base64Input.value) {
    toastStore.error($t('tools.noInput'))
    return
  }

  try {
    // Check if it's already base64 or needs conversion
    if (base64Input.value.startsWith('data:image/')) {
      base64Output.value = base64Input.value
      toastStore.success($t('tools.alreadyBase64'))
    } else {
      // Try to convert text to base64
      base64Output.value = 'data:text/plain;base64,' + btoa(base64Input.value)
      toastStore.success($t('tools.converted'))
    }
  } catch (error) {
    toastStore.error($t('tools.convertFailed'))
  }
}

const fileToBase64 = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  const reader = new FileReader()

  reader.onload = (e) => {
    base64Output.value = e.target?.result as string
    toastStore.success($t('tools.fileConverted'))
  }

  reader.readAsDataURL(file)
  target.value = ''
}

const copyBase64 = async () => {
  try {
    await navigator.clipboard.writeText(base64Output.value)
    toastStore.success($t('tools.copySuccess'))
  } catch (error) {
    toastStore.error($t('tools.copyFailed'))
  }
}

const downloadBase64 = () => {
  if (!base64Output.value) return

  const a = document.createElement('a')
  a.href = base64Output.value
  a.download = `base64-${Date.now()}.txt`
  a.click()
  toastStore.success($t('tools.downloadSuccess'))
}

// URL Generator functions
const generateUrl = () => {
  if (!urlBase.value || !urlPath.value) {
    toastStore.error($t('tools.fillUrlFields'))
    return
  }

  let base = urlBase.value.replace(/\/$/, '')
  let path = urlPath.value.replace(/^\//, '')

  generatedUrl.value = `${base}/${path}`

  if (customDomain.value) {
    const domain = customDomain.value.replace(/\/$/, '')
    const rawBase = `https://raw.githubusercontent.com/${configStore.config?.repositoryOwner}/${configStore.config?.repositoryName}/${configStore.config?.branch}/`
    generatedUrl.value = generatedUrl.value.replace(rawBase, domain + '/')
  }

  toastStore.success($t('tools.urlGenerated'))
}

const copyGeneratedUrl = async () => {
  try {
    await navigator.clipboard.writeText(generatedUrl.value)
    toastStore.success($t('tools.copySuccess'))
  } catch (error) {
    toastStore.error($t('tools.copyFailed'))
  }
}

const loadFromConfig = () => {
  if (!configStore.config?.repository) {
    toastStore.error($t('tools.noConfig'))
    return
  }

  urlBase.value = `https://raw.githubusercontent.com/${configStore.config.repositoryOwner}/${configStore.config.repositoryName}/${configStore.config.branch}`
  urlPath.value = `${configStore.config.directory || 'images'}/`
  customDomain.value = configStore.config.customDomain || ''

  toastStore.success($t('tools.configLoaded'))
}

// Compressor functions
const loadCompressImage = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  const reader = new FileReader()

  reader.onload = (e) => {
    compressImage.value = e.target?.result as string
    originalSize.value = file.size
    compressedSize.value = 0
    compressedBlob.value = null
    compressedPreview.value = ''
    dimensions.value = '-'

    // Get dimensions
    const img = new Image()
    img.onload = () => {
      dimensions.value = `${img.width} × ${img.height}`
    }
    img.src = compressImage.value
  }

  reader.readAsDataURL(file)
  target.value = ''
}

const compressImageNow = async () => {
  if (!compressImage.value) {
    toastStore.error($t('tools.noImage'))
    return
  }

  compressing.value = true

  try {
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = compressImage.value
    })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b)
          else reject(new Error('Compression failed'))
        },
        'image/jpeg',
        compressQuality.value
      )
    })

    compressedBlob.value = blob
    compressedSize.value = blob.size

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      compressedPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(blob)

    toastStore.success($t('tools.compressSuccess'))
  } catch (error) {
    toastStore.error($t('tools.compressFailed'))
  } finally {
    compressing.value = false
  }
}

const downloadCompressed = () => {
  if (!compressedBlob.value) return

  const url = URL.createObjectURL(compressedBlob.value)
  const a = document.createElement('a')
  a.href = url
  a.download = `compressed-${Date.now()}.jpg`
  a.click()
  URL.revokeObjectURL(url)

  toastStore.success($t('tools.downloadSuccess'))
}

const reductionPercentage = computed(() => {
  if (!originalSize.value || !compressedSize.value) return '-'
  const reduction = ((originalSize.value - compressedSize.value) / originalSize.value) * 100
  return reduction > 0 ? `-${reduction.toFixed(1)}%` : '-'
})

// Watermark functions
const loadWatermarkImage = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  const reader = new FileReader()

  reader.onload = (e) => {
    watermarkImage.value = e.target?.result as string
    watermarkedBlob.value = null
    watermarkedPreview.value = ''
  }

  reader.readAsDataURL(file)
  target.value = ''
}

const addWatermark = async () => {
  if (!watermarkImage.value || !watermarkText.value) {
    toastStore.error($t('tools.fillWatermarkFields'))
    return
  }

  addingWatermark.value = true

  try {
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = watermarkImage.value
    })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    // Add watermark
    ctx.globalAlpha = watermarkOpacity.value
    ctx.fillStyle = 'white'
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 2

    const fontSize = Math.max(16, img.width / 20)
    ctx.font = `bold ${fontSize}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const text = watermarkText.value
    const metrics = ctx.measureText(text)
    const textWidth = metrics.width
    const textHeight = fontSize

    let x = 0, y = 0
    const padding = 20

    switch (watermarkPosition.value) {
      case 'top-left':
        x = padding + textWidth / 2
        y = padding + textHeight / 2
        break
      case 'top-right':
        x = canvas.width - padding - textWidth / 2
        y = padding + textHeight / 2
        break
      case 'bottom-left':
        x = padding + textWidth / 2
        y = canvas.height - padding - textHeight / 2
        break
      case 'bottom-right':
        x = canvas.width - padding - textWidth / 2
        y = canvas.height - padding - textHeight / 2
        break
      case 'center':
        x = canvas.width / 2
        y = canvas.height / 2
        break
    }

    // Draw text with outline
    ctx.strokeText(text, x, y)
    ctx.fillText(text, x, y)

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b)
          else reject(new Error('Watermark failed'))
        },
        'image/png'
      )
    })

    watermarkedBlob.value = blob

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      watermarkedPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(blob)

    toastStore.success($t('tools.watermarkSuccess'))
  } catch (error) {
    toastStore.error($t('tools.watermarkFailed'))
  } finally {
    addingWatermark.value = false
  }
}

const downloadWatermarked = () => {
  if (!watermarkedBlob.value) return

  const url = URL.createObjectURL(watermarkedBlob.value)
  const a = document.createElement('a')
  a.href = url
  a.download = `watermarked-${Date.now()}.png`
  a.click()
  URL.revokeObjectURL(url)

  toastStore.success($t('tools.downloadSuccess'))
}

// Batch rename functions
const loadBatchFiles = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  batchFiles.value = Array.from(target.files)
  generateBatchPreview()
}

const generateBatchPreview = () => {
  batchPreview.value = batchFiles.value.map((file, idx) => {
    let newName = ''

    if (batchUseTimestamp.value) {
      const timestamp = Date.now() + idx
      newName = `${batchPrefix.value}${timestamp}${batchSuffix.value}`
    } else {
      newName = `${batchPrefix.value}${idx + 1}${batchSuffix.value}`
    }

    // Keep original extension
    const ext = file.name.split('.').pop()
    if (ext && !newName.endsWith(`.${ext}`)) {
      newName += `.${ext}`
    }

    return {
      original: file.name,
      renamed: newName
    }
  })
}

const generateBatchNames = () => {
  if (batchFiles.value.length === 0) {
    toastStore.error($t('tools.noFiles'))
    return
  }

  generateBatchPreview()
  toastStore.success($t('tools.namesGenerated'))
}

const downloadBatch = () => {
  if (batchFiles.value.length === 0) return

  batchPreview.value.forEach((preview, idx) => {
    const file = batchFiles.value[idx]
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = preview.renamed
    a.click()
    URL.revokeObjectURL(url)
  })

  toastStore.success($t('tools.downloadAllSuccess'))
}

// Watchers
watch([batchPrefix, batchSuffix, batchUseTimestamp], () => {
  if (batchFiles.value.length > 0) {
    generateBatchPreview()
  }
})

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Initialize URL base from config
onMounted(() => {
  if (configStore.config?.repository) {
    urlBase.value = `https://raw.githubusercontent.com/${configStore.config.repositoryOwner}/${configStore.config.repositoryName}/${configStore.config.branch}`
  }
})
</script>
