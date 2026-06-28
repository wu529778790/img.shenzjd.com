import axios, { AxiosInstance } from 'axios'

export interface GitHubFile {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  download_url: string
  type: 'file' | 'dir'
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
        'User-Agent': 'ImgX',
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

  // 列出目录内容
  async listContents(path: string = '') {
    const response = await this.client.get(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      params: { ref: this.branch },
    })
    return response.data as GitHubFile[]
  }

  // 获取单个文件
  async getFile(path: string) {
    const response = await this.client.get(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      params: { ref: this.branch },
    })
    return response.data
  }

  // 创建或更新文件
  async createOrUpdateFile(
    filePath: string,
    content: string | Blob,
    message: string
  ): Promise<{ sha: string }> {
    // 检查文件是否存在
    let sha: string | undefined
    try {
      const existing = await this.getFile(filePath)
      sha = existing.sha
    } catch {
      // 文件不存在，创建新文件
    }

    // 处理 Blob 内容
    let contentBase64: string
    if (content instanceof Blob) {
      contentBase64 = await this.blobToBase64(content)
    } else {
      contentBase64 = Buffer.from(content).toString('base64')
    }

    const response = await this.client.put(
      `/repos/${this.owner}/${this.repo}/contents/${filePath}`,
      {
        message,
        content: contentBase64,
        sha,
      }
    )

    return { sha: response.data.content.sha }
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
          return this.deleteFile(filePath, `Delete ${filePath}`, file.sha)
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
