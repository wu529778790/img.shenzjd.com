import axios, { AxiosInstance } from 'axios'
import type { GitHubFileInfo } from '@/types/image'

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  default_branch: string
  description: string | null
  html_url: string
}

export class GitHubAPI {
  private client: AxiosInstance
  public owner: string
  public repo: string
  private branch: string

  constructor(token: string, owner: string, repo: string, branch: string = 'main') {
    this.owner = owner
    this.repo = repo
    this.branch = branch

    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })
  }

  // 获取当前用户信息
  async getCurrentUser() {
    const response = await this.client.get('/user')
    return response.data
  }

  // 创建仓库
  async createRepo(name: string, description: string = 'ImgX image host', private_: boolean = false) {
    const response = await this.client.post('/user/repos', {
      name,
      description,
      private: private_,
      auto_init: true,
    })
    return response.data
  }

  // 列出用户的所有仓库
  async listRepos() {
    const response = await this.client.get('/user/repos', {
      params: {
        sort: 'updated',
        per_page: 100,
      },
    })
    return response.data as GitHubRepo[]
  }

  // 获取仓库信息
  async getRepo() {
    const response = await this.client.get(`/repos/${this.owner}/${this.repo}`)
    return response.data
  }

  // 递归列出所有文件
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
      console.error(`Failed to list files in ${path}:`, error)
      return Array.from(allFiles.values())
    }
  }

  // 列出目录内容
  async listContents(path: string = ''): Promise<GitHubFileInfo[]> {
    const response = await this.client.get(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      params: { ref: this.branch },
    })
    return response.data as GitHubFileInfo[]
  }

  // 获取单个文件
  async getFile(path: string, branch?: string): Promise<any> {
    const response = await this.client.get(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      params: { ref: branch || this.branch },
    })
    return response.data
  }

  // 创建或更新文件
  async createOrUpdateFile(
    filePath: string,
    content: string | Blob,
    message: string,
    branch: string = this.branch,
    onProgress?: (progress: number) => void
  ): Promise<{ sha: string; html_url: string }> {
    // 检查文件是否存在
    let sha: string | undefined
    let fileExists = false
    try {
      const existing = await this.getFile(filePath)
      sha = existing.sha
      fileExists = true
      console.log(`[GitHub] File exists, will update: ${filePath} on branch ${branch}`)
    } catch {
      // 文件不存在，创建新文件
      console.log(`[GitHub] File does not exist, will create: ${filePath} on branch ${branch}`)
    }

    console.log(`[GitHub] ${fileExists ? 'Updating' : 'Creating'} file: ${filePath} on branch ${branch}`)

    // 报告 10% 进度（开始处理文件）
    console.log('[GitHub Progress] Reporting 10%')
    onProgress?.(10)

    // 处理 Blob 内容
    let contentBase64: string
    if (content instanceof Blob) {
      onProgress?.(30) // 报告 30% 进度（开始 Base64 编码）
      console.log('[GitHub Progress] Reporting 30%')
      contentBase64 = await this.blobToBase64(content)
      onProgress?.(50) // 报告 50% 进度（Base64 编码完成）
      console.log('[GitHub Progress] Reporting 50%')
    } else {
      contentBase64 = Buffer.from(content).toString('base64')
      onProgress?.(50)
      console.log('[GitHub Progress] Reporting 50% (string content)')
    }

    console.log(`[GitHub] Content size: ${contentBase64.length} bytes (base64)`)

    // 报告 60% 进度（开始上传到 GitHub）
    console.log('[GitHub Progress] Reporting 60%')
    onProgress?.(60)

    const response = await this.client.put(
      `/repos/${this.owner}/${this.repo}/contents/${filePath}`,
      {
        message,
        content: contentBase64,
        sha,
        branch,  // ✅ 添加分支参数
      }
    )

    // 报告 90% 进度（上传请求已完成）
    console.log('[GitHub Progress] Reporting 90%')
    onProgress?.(90)

    console.log(`[GitHub] Response:`, {
      sha: response.data.content.sha,
      html_url: response.data.content.html_url,
      size: response.data.content.size,
    })

    // 报告 100% 进度
    console.log('[GitHub Progress] Reporting 100%')
    onProgress?.(100)

    return {
      sha: response.data.content.sha,
      html_url: response.data.content.html_url,
    }
  }

  // 删除文件
  async deleteFile(filePath: string, message: string, sha: string) {
    const response = await this.client.delete(`/repos/${this.owner}/${this.repo}/contents/${filePath}`, {
      data: { message, sha },
    })
    return response.data
  }

  // 批量删除文件
  async deleteFiles(filePaths: string[]) {
    const results = await Promise.allSettled(
      filePaths.map(async (filePath) => {
        try {
          const file = await this.getFile(filePath)
          return this.deleteFile(filePath, `[skip ci] https://img.shenzjd.com/`, file.sha)
        } catch (error) {
          console.error(`Failed to delete ${filePath}:`, error)
          throw error
        }
      })
    )

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return { successful, failed }
  }

  // 搜索仓库内容
  async searchContent(query: string) {
    const response = await this.client.get('/search/code', {
      params: {
        q: `${query} repo:${this.owner}/${this.repo}`,
        per_page: 50,
      },
    })
    return response.data
  }

  // 获取文件的最后提交时间
  async getFileCommitTime(path: string, branch?: string): Promise<Date | null> {
    try {
      const response = await this.client.get(`/repos/${this.owner}/${this.repo}/commits`, {
        params: {
          path: path,
          per_page: 1,
          sha: branch || this.branch,
        },
      })

      if (response.data && response.data.length > 0) {
        const commitDate = response.data[0].commit?.committer?.date
        return commitDate ? new Date(commitDate) : null
      }

      return null
    } catch (error) {
      console.error(`Failed to get commit time for ${path}:`, error)
      return null
    }
  }

  // 批量获取文件的最后提交时间
  async getFilesCommitTime(paths: string[]): Promise<Map<string, Date>> {
    const results = new Map<string, Date>()

    await Promise.allSettled(
      paths.map(async (path) => {
        const date = await this.getFileCommitTime(path, this.branch)
        if (date) {
          results.set(path, date)
        }
      })
    )

    return results
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

// 工厂函数
export function createGitHubAPI(token: string, owner: string, repo: string, branch?: string) {
  return new GitHubAPI(token, owner, repo, branch)
}
