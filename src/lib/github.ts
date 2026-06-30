import type { GitHubFileInfo } from '@/types/image'
import { debugLog, debugWarn, debugError } from './debug'

/**
 * 浏览器兼容的 UTF-8 base64 编码（替代 Buffer.from）
 * 确保非 ASCII 字符（如中文文件名）正确编码
 */
function encodeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binary)
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  default_branch: string
  description: string | null
  html_url: string
}

// GitHub API response types
export interface GitHubUser {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
  html_url: string
  type: string
}

export interface GitHubBranchInfo {
  name: string
  commit: { sha: string; url: string }
  protected: boolean
}

export interface GitHubTreeItem {
  path: string
  mode: string
  type: 'blob' | 'tree' | 'commit'
  sha: string
  size?: number
  url: string
}

export interface GitHubTreeResponse {
  sha: string
  url: string
  tree: GitHubTreeItem[]
  truncated: boolean
}

export interface GitHubContentResponse {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  download_url: string | null
  type: 'file' | 'dir'
  content: string
  encoding?: string
  commit?: { commit?: { committer?: { date?: string } } }
}

export interface GitHubFileCreateUpdateResponse {
  content: GitHubContentResponse
  commit: {
    sha: string
    url: string
    message?: string
  }
}

interface GitHubAPIError extends Error {
  response?: {
    status: number
    data: unknown
  }
}

function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof Error && 'response' in error) {
    const response = (error as GitHubAPIError).response
    return response?.status
  }
  return undefined
}

export class GitHubAPI {
  public owner: string
  public repo: string
  private branch: string
  private token: string
  // API 请求超时（毫秒）
  static readonly REQUEST_TIMEOUT = 30_000

  constructor(token: string, owner: string, repo: string, branch: string = 'main') {
    this.owner = owner
    this.repo = repo
    this.branch = branch
    this.token = token
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `https://api.github.com${endpoint}`
    const headers: HeadersInit = {
      Authorization: `token ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // 添加超时控制，防止请求无限挂起
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      GitHubAPI.REQUEST_TIMEOUT
    )

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error: GitHubAPIError = new Error(`GitHub API error: ${response.statusText}`)
        error.response = {
          status: response.status,
          data: await response.json().catch(() => null),
        }
        throw error
      }

      // 对于 204 No Content 响应，不解析 JSON
      if (response.status === 204) {
        return undefined as T
      }

      return response.json()
    } catch (err) {
      clearTimeout(timeoutId)
      // 如果是 AbortController 超时，抛出更友好的错误
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`GitHub API request timeout (${GitHubAPI.REQUEST_TIMEOUT}ms)`)
      }
      throw err
    }
  }

  // 获取当前用户信息
  async getCurrentUser(): Promise<GitHubUser> {
    return this.request<GitHubUser>('/user')
  }

  // 创建仓库
  async createRepo(name: string, description: string = 'ImgX image host', private_: boolean = false): Promise<GitHubRepo> {
    return this.request<GitHubRepo>('/user/repos', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        private: private_,
        auto_init: true,
      }),
    })
  }

  // 列出用户的所有仓库
  async listRepos(): Promise<GitHubRepo[]> {
    const response = await this.request<GitHubRepo[]>('/user/repos', {
      method: 'GET',
    })
    return response
  }

  // 获取仓库信息
  async getRepo(): Promise<GitHubRepo> {
    return this.request<GitHubRepo>(`/repos/${this.owner}/${this.repo}`)
  }

  // 获取仓库的所有分支
  async getBranches(): Promise<string[]> {
    try {
      const response = await this.request<GitHubBranchInfo[]>(`/repos/${this.owner}/${this.repo}/branches`, {
        method: 'GET',
      })
      const branches = response.map((branch: GitHubBranchInfo) => branch.name)
      return branches
    } catch (error) {
      debugError('Failed to get branches:', error)
      // 如果失败，返回默认分支
      try {
        const repo = await this.getRepo()
        return [repo.default_branch]
      } catch {
        return ['main', 'master'] // 最终回退
      }
    }
  }

  // 使用 Git Trees API 一次性获取整个仓库的文件树
  // 替代递归调用 listContents，大幅减少 API 请求数
  async listAllFilesWithTree(): Promise<GitHubFileInfo[]> {
    try {
      // 使用 Git Trees API，recursive=1 递归获取所有文件
      const response = await this.request<GitHubTreeResponse>(`/repos/${this.owner}/${this.repo}/git/trees/${this.branch}?recursive=1`, {
        method: 'GET',
      })

      const tree = response.tree || []

      // 只保留文件（blob），过滤掉目录（tree）和子模块（commit）
      const files: GitHubFileInfo[] = tree
        .filter((item: GitHubTreeItem) => item.type === 'blob')
        .map((item: GitHubTreeItem) => ({
          name: item.path.split('/').pop() || item.path,
          path: item.path,
          sha: item.sha,
          size: item.size ?? 0,
          type: 'file' as const,
          url: item.url,
          download_url: `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${item.path}`,
          html_url: `https://github.com/${this.owner}/${this.repo}/blob/${this.branch}/${item.path}`,
        }))

      debugLog('[GitHub] Tree API returned', tree.length, 'items,', files.length, 'files')
      if (tree.length > 0) {
        debugLog('[GitHub] Tree sample:', tree.slice(0, 10).map((item: GitHubTreeItem) => ({ path: item.path, type: item.type })))
      }

      return files
    } catch (error) {
      debugError('Failed to list files with tree API:', error)
      // 如果失败，回退到递归方式
      debugWarn('Falling back to recursive listContents')
      return this.listAllFiles('')
    }
  }

  // 递归列出所有文件（旧方法，保留作为回退）
  async listAllFiles(path: string = '', allFiles: Map<string, GitHubFileInfo> = new Map()): Promise<GitHubFileInfo[]> {
    try {
      const files = await this.listContents(path)

      for (const file of files) {
        if (file.type === 'dir') {
          // 递归遍历子文件夹
          await this.listAllFiles(file.path, allFiles)
        } else {
          // 使用 SHA 作为 key，避免重复
          if (!allFiles.has(file.sha)) {
            allFiles.set(file.sha, file)
          }
        }
      }

      return Array.from(allFiles.values())
    } catch (error) {
      debugError(`Failed to list files in ${path}:`, error)
      return Array.from(allFiles.values())
    }
  }

  // 列出目录内容
  async listContents(path: string = ''): Promise<GitHubFileInfo[]> {
    const response = await this.request<GitHubContentResponse[]>(`/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`)
    return response as unknown as GitHubFileInfo[]
  }

  // 获取单个文件
  async getFile(path: string, branch?: string): Promise<GitHubContentResponse> {
    const response = await this.request<GitHubContentResponse>(`/repos/${this.owner}/${this.repo}/contents/${path}?ref=${branch || this.branch}`)
    return response
  }

  // 创建或更新文件
  async createOrUpdateFile(
    filePath: string,
    content: string | Blob,
    message: string,
    branch: string = this.branch,
    onProgress?: (progress: number) => void
  ): Promise<{ sha: string; html_url: string }> {
    let sha: string | undefined

    // 报告 10% 进度（开始处理文件）
    debugLog('[GitHub Progress] Reporting 10%')
    onProgress?.(10)

    // 处理 Blob 内容
    let contentBase64: string
    if (content instanceof Blob) {
      onProgress?.(30) // 报告 30% 进度（开始 Base64 编码）
      debugLog('[GitHub Progress] Reporting 30%')
      contentBase64 = await this.blobToBase64(content)
      onProgress?.(50) // 报告 50% 进度（Base64 编码完成）
      debugLog('[GitHub Progress] Reporting 50%')
    } else {
      contentBase64 = encodeBase64(content)
      onProgress?.(50)
      debugLog('[GitHub Progress] Reporting 50% (string content)')
    }

    debugLog(`[GitHub] Content size: ${contentBase64.length} bytes (base64)`)

    // 报告 60% 进度（开始上传到 GitHub）
    debugLog('[GitHub Progress] Reporting 60%')
    onProgress?.(60)

    // 先尝试创建文件（不带 sha）
    // 如果文件已存在，GitHub 会返回 422，我们再获取 sha 并更新
    let response: GitHubFileCreateUpdateResponse
    try {
      response = await this.request<GitHubFileCreateUpdateResponse>(`/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(filePath)}`, {
        method: 'PUT',
        body: JSON.stringify({
          message,
          content: contentBase64,
          branch,
        }),
      })
      debugLog(`[GitHub] Created new file: ${filePath} on branch ${branch}`)
    } catch (error) {
      // 如果是 422，说明文件已存在，需要获取 sha 后更新
      if (getErrorStatus(error) === 422) {
        debugLog(`[GitHub] File already exists, fetching SHA for update: ${filePath}`)
        const existing = await this.getFile(filePath, branch)
        sha = existing.sha

        // 使用 sha 更新文件
        response = await this.request<GitHubFileCreateUpdateResponse>(`/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(filePath)}`, {
          method: 'PUT',
          body: JSON.stringify({
            message,
            content: contentBase64,
            sha,
            branch,
          }),
        })
        debugLog(`[GitHub] Updated existing file: ${filePath} on branch ${branch}`)
      } else {
        // 其他错误直接抛出
        throw error
      }
    }

    // 报告 90% 进度（上传请求已完成）
    debugLog('[GitHub Progress] Reporting 90%')
    onProgress?.(90)

    debugLog(`[GitHub] Response:`, {
      sha: response.content.sha,
      html_url: response.content.html_url,
      size: response.content.size,
    })

    // 报告 100% 进度
    debugLog('[GitHub Progress] Reporting 100%')
    onProgress?.(100)

    return {
      sha: response.content.sha,
      html_url: response.content.html_url,
    }
  }

  // 删除文件
  async deleteFile(filePath: string, message: string, sha: string, branch?: string): Promise<GitHubFileCreateUpdateResponse> {
    const response = await this.request<GitHubFileCreateUpdateResponse>(`/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
      body: JSON.stringify({
        message,
        sha,
        branch: branch || this.branch,
      }),
    })
    return response
  }

  // 批量删除文件（带并发限制）
  async deleteFiles(filePaths: string[], concurrency: number = 5, branch?: string): Promise<{ successful: number; failed: number }> {
    let successful = 0
    let failed = 0

    // 分批处理，限制并发数
    for (let i = 0; i < filePaths.length; i += concurrency) {
      const batch = filePaths.slice(i, i + concurrency)

      const results = await Promise.allSettled(
        batch.map(async (filePath) => {
          try {
            const file = await this.getFile(filePath, branch)
            return this.deleteFile(filePath, `[skip ci] https://img.shenzjd.com/`, file.sha, branch)
          } catch (error) {
            debugError(`Failed to delete ${filePath}:`, error)
            throw error
          }
        })
      )

      successful += results.filter((r) => r.status === 'fulfilled').length
      failed += results.filter((r) => r.status === 'rejected').length

      // 批次之间添加延迟
      if (i + concurrency < filePaths.length) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    return { successful, failed }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
}
