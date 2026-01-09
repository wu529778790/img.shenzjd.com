import { ofetch } from "ofetch";

export interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
  name?: string;
}

export interface GitHubRepo {
  full_name: string;
  name: string;
  owner: {
    login: string;
  };
  default_branch: string;
  private: boolean;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubContent {
  type: "file" | "dir" | "symlink" | "submodule";
  name: string;
  path: string;
  sha: string;
  size?: number;
  download_url?: string;
  url: string;
}

export interface GitHubCommit {
  commit: {
    sha: string;
    message: string;
  };
  content?: GitHubContent;
}

export interface GitHubFileResponse extends GitHubCommit {
  content?: GitHubContent;
}

export interface GitHubRef {
  ref: string;
  node_id: string;
  url: string;
  object: {
    sha: string;
    type: string;
    url: string;
  };
}

/**
 * 创建 GitHub API fetcher
 */
export function createGitHubFetcher(accessToken: string) {
  return ofetch.create({
    baseURL: "https://api.github.com",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
}

/**
 * 获取用户信息
 */
export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const fetcher = createGitHubFetcher(accessToken);
  return await fetcher("/user");
}

/**
 * 获取用户仓库列表
 */
export async function getUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const fetcher = createGitHubFetcher(accessToken);
  // 获取用户所有仓库（包括私有）
  const repos = await fetcher("/user/repos?per_page=100&sort=updated");
  return repos;
}

/**
 * 获取仓库分支列表
 */
export async function getRepoBranches(
  owner: string,
  repo: string,
  accessToken: string,
): Promise<GitHubBranch[]> {
  const fetcher = createGitHubFetcher(accessToken);
  return await fetcher(`/repos/${owner}/${repo}/branches`);
}

/**
 * 获取仓库内容（目录或文件）
 */
export async function getRepoContent(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
  accessToken?: string,
): Promise<GitHubContent | GitHubContent[]> {
  const fetcher = createGitHubFetcher(accessToken || "");
  const params = ref ? { ref } : {};

  return await fetcher(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    {
      query: params,
    },
  );
}

/**
 * 创建仓库
 */
export async function createRepository(
  name: string,
  description: string,
  accessToken: string,
  privateRepo: boolean = true,
): Promise<GitHubRepo> {
  const fetcher = createGitHubFetcher(accessToken);
  return await fetcher("/user/repos", {
    method: "POST",
    body: {
      name,
      description,
      private: privateRepo,
      auto_init: true,
    },
  });
}

/**
 * 创建或更新文件
 */
export async function createOrUpdateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  accessToken: string,
  branch?: string,
  sha?: string,
): Promise<GitHubCommit> {
  const fetcher = createGitHubFetcher(accessToken);

  const body = {
    message,
    content: Buffer.from(content).toString("base64"),
    ...(branch && { branch }),
    ...(sha && { sha }),
  };

  return await fetcher(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    {
      method: "PUT",
      body,
    },
  );
}

/**
 * 删除文件
 */
export async function deleteFile(
  owner: string,
  repo: string,
  path: string,
  message: string,
  sha: string,
  accessToken: string,
  branch?: string,
): Promise<GitHubCommit> {
  const fetcher = createGitHubFetcher(accessToken);

  const body = {
    message,
    sha,
    ...(branch && { branch }),
  };

  return await fetcher(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    {
      method: "DELETE",
      body,
    },
  );
}

/**
 * 创建分支
 */
export async function createBranch(
  owner: string,
  repo: string,
  branchName: string,
  fromBranch: string,
  accessToken: string,
): Promise<GitHubRef> {
  const fetcher = createGitHubFetcher(accessToken);

  // 获取源分支的最新 commit SHA
  const branchData = await fetcher<GitHubBranch>(
    `/repos/${owner}/${repo}/branches/${fromBranch}`,
  );
  const sha = branchData.commit.sha;

  // 创建新分支
  return await fetcher<GitHubRef>(`/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    body: {
      ref: `refs/heads/${branchName}`,
      sha,
    },
  });
}

/**
 * 检查仓库是否存在
 */
export async function checkRepositoryExists(
  owner: string,
  repo: string,
  accessToken: string,
): Promise<boolean> {
  try {
    const fetcher = createGitHubFetcher(accessToken);
    await fetcher(`/repos/${owner}/${repo}`);
    return true;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * 获取文件或目录的 SHA
 */
export async function getSha(
  owner: string,
  repo: string,
  path: string,
  accessToken: string,
  branch?: string,
): Promise<string | null> {
  try {
    const content = await getRepoContent(
      owner,
      repo,
      path,
      branch,
      accessToken,
    );

    if (Array.isArray(content)) {
      // 目录，返回第一个文件的 SHA（用于目录删除）
      if (content.length > 0) {
        return content[0]?.sha || "";
      }
      return null;
    }

    return content.sha;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}
