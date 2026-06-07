const GITHUB_API = 'https://api.github.com'

export interface GitHubRepo {
  name: string
  full_name: string
  description: string | null
  html_url: string
  clone_url: string
  default_branch: string
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  topics: string[]
  license: { spdx_id: string; name: string } | null
  language: string | null
  homepage: string | null
  owner: { login: string; html_url: string; avatar_url: string }
}

export interface TreeEntry {
  path: string
  mode: string
  type: 'blob' | 'tree' | 'commit'
  sha: string
  size?: number
}

export interface TreeResponse {
  sha: string
  tree: TreeEntry[]
  truncated: boolean
}

export class GitHubClient {
  private token?: string

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN
  }

  private async fetch<T>(path: string): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const res = await fetch(`${GITHUB_API}${path}`, { headers })

    if (!res.ok) {
      const body = await res.text()
      if (res.status === 404) throw new Error('Repository not found or is private')
      if (res.status === 403) throw new Error('GitHub API rate limit exceeded. Add a GITHUB_TOKEN or try again later.')
      throw new Error(`GitHub API error (${res.status}): ${body.slice(0, 200)}`)
    }

    return res.json() as Promise<T>
  }

  getRepo(owner: string, repo: string) {
    return this.fetch<GitHubRepo>(`/repos/${owner}/${repo}`)
  }

  getLanguages(owner: string, repo: string) {
    return this.fetch<Record<string, number>>(`/repos/${owner}/${repo}/languages`)
  }

  async getTree(owner: string, repo: string, branch: string) {
    const tree = await this.fetch<TreeResponse>(
      `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    )
    return tree
  }

  async getFileContent(owner: string, repo: string, path: string, ref: string): Promise<string | null> {
    try {
      const data = await this.fetch<{ content: string; encoding: string }>(
        `/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`,
      )
      if (data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8')
      }
      return data.content
    } catch {
      return null
    }
  }
}
