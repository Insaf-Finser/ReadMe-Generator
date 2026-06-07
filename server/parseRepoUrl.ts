export interface ParsedRepo {
  owner: string
  repo: string
}

export function parseRepoUrl(input: string): ParsedRepo {
  const trimmed = input.trim()

  const patterns = [
    /^https?:\/\/github\.com\/([^/]+)\/([^/?#]+)/i,
    /^git@github\.com:([^/]+)\/([^/.]+)(?:\.git)?$/i,
    /^github\.com\/([^/]+)\/([^/?#]+)/i,
    /^([^/]+)\/([^/]+)$/,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
      }
    }
  }

  throw new Error('Invalid GitHub repository URL. Use https://github.com/owner/repo')
}
