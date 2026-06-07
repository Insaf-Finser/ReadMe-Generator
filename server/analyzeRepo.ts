import type { GitHubClient, TreeEntry } from './github'
import { enhanceWithAI, resolveAIKey, type AIAnalyzerOptions, type AIProvider } from './aiAnalyzer'
import { normalizeReadme, toMarkdownString } from './normalizeReadme'
import { applyExistingReadmeBaseline, parseExistingReadme } from './parseExistingReadme'
import {
  buildAim,
  buildArchitecture,
  buildContributingDetailed,
  buildDeploymentSection,
  buildDetailedDescription,
  buildDetailedFeatures,
  buildProblemStatement,
  buildTargetAudience,
  buildTestingSection,
  buildUsageDetails,
} from './generateDetailedContent'

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.cache',
  '__pycache__',
  '.venv',
  'venv',
  'target',
  '.idea',
  '.vscode',
])

const KEY_FILES = [
  'package.json',
  'pyproject.toml',
  'requirements.txt',
  'setup.py',
  'Pipfile',
  'Cargo.toml',
  'go.mod',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'Gemfile',
  'composer.json',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  '.env.example',
  'Makefile',
  'README.md',
  'LICENSE',
  'CONTRIBUTING.md',
  'tsconfig.json',
  'vite.config.ts',
  'vite.config.js',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
]

export interface ScanSummary {
  owner: string
  repo: string
  url: string
  defaultBranch: string
  fileCount: number
  languages: { name: string; bytes: number; percent: number }[]
  detectedStack: string[]
  hasTests: boolean
  hasCi: boolean
  hasDocker: boolean
  topics: string[]
  stars: number
  treeTruncated: boolean
  aiEnhanced: boolean
  aiProvider?: string
  aiModel?: string
  userDescriptionProvided: boolean
  hadExistingReadme: boolean
}

export interface GeneratedReadme {
  title: string
  tagline: string
  badges: { id: string; label: string; url: string }[]
  aim: string
  description: string
  problemStatement: string
  targetAudience: string
  features: { id: string; text: string }[]
  featuresDetail: string
  demoUrl: string
  screenshotUrl: string
  techStack: { id: string; name: string }[]
  architecture: string
  prerequisites: string
  installation: string
  usage: string
  testing: string
  deployment: string
  envVars: string
  projectStructure: string
  additionalSections: { id: string; title: string; content: string }[]
  contributing: string
  license: string
  authorName: string
  authorEmail: string
  socialLinks: { id: string; platform: string; url: string }[]
  showTableOfContents: boolean
}

let idSeq = 0
function uid() {
  return String(++idSeq)
}

function shouldIgnorePath(path: string): boolean {
  return path.split('/').some((part) => IGNORED_DIRS.has(part) || part.startsWith('.'))
}

function filterTree(tree: TreeEntry[]): TreeEntry[] {
  return tree.filter((e) => e.type === 'blob' && !shouldIgnorePath(e.path))
}

function buildProjectStructure(tree: TreeEntry[], maxLines = 40): string {
  const paths = tree
    .map((e) => e.path)
    .filter((p) => !shouldIgnorePath(p))
    .sort()

  const root = new Map<string, Set<string>>()

  for (const path of paths) {
    const parts = path.split('/')
    if (parts.length === 1) {
      if (!root.has('.')) root.set('.', new Set())
      root.get('.')!.add(parts[0])
    } else {
      const top = parts[0]
      if (!root.has(top)) root.set(top, new Set())
      if (parts.length === 2) {
        root.get(top)!.add(parts[1])
      } else if (parts.length > 2) {
        root.get(top)!.add(parts[1] + '/')
      }
    }
  }

  const lines: string[] = []
  const topDirs = [...root.keys()].sort()

  for (const dir of topDirs) {
    const label = dir === '.' ? '' : dir + '/'
    if (label) lines.push(label)
    const children = [...(root.get(dir) ?? [])].sort().slice(0, 12)
    for (const child of children) {
      lines.push(dir === '.' ? child : `  ${child}`)
    }
    if ((root.get(dir)?.size ?? 0) > 12) {
      lines.push(dir === '.' ? '  ...' : '  ...')
    }
    if (lines.length >= maxLines) break
  }

  return lines.join('\n')
}

function detectStack(files: Set<string>, fileContents: Map<string, string>): string[] {
  const stack = new Set<string>()

  if (files.has('package.json')) {
    stack.add('Node.js')
    try {
      const pkg = JSON.parse(fileContents.get('package.json') ?? '{}')
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }
      if (deps.react) stack.add('React')
      if (deps.vue) stack.add('Vue')
      if (deps.next) stack.add('Next.js')
      if (deps.express) stack.add('Express')
      if (deps.typescript || files.has('tsconfig.json')) stack.add('TypeScript')
      if (deps.vite || files.has('vite.config.ts') || files.has('vite.config.js')) stack.add('Vite')
    } catch {
      /* ignore parse errors */
    }
  }
  if (files.has('pyproject.toml') || files.has('requirements.txt') || files.has('setup.py')) {
    stack.add('Python')
    if (fileContents.get('pyproject.toml')?.includes('django')) stack.add('Django')
    if (fileContents.get('requirements.txt')?.includes('flask')) stack.add('Flask')
    if (fileContents.get('requirements.txt')?.includes('fastapi')) stack.add('FastAPI')
  }
  if (files.has('Cargo.toml')) stack.add('Rust')
  if (files.has('go.mod')) stack.add('Go')
  if (files.has('pom.xml') || files.has('build.gradle') || files.has('build.gradle.kts')) stack.add('Java')
  if (files.has('Gemfile')) stack.add('Ruby')
  if (files.has('composer.json')) stack.add('PHP')
  if (files.has('Dockerfile') || files.has('docker-compose.yml') || files.has('docker-compose.yaml')) {
    stack.add('Docker')
  }

  return [...stack]
}

function inferFeatures(files: Set<string>, tree: TreeEntry[]): string[] {
  const features: string[] = []
  const paths = [...files, ...tree.map((t) => t.path)]

  if (paths.some((p) => p.includes('.github/workflows'))) {
    features.push('CI/CD with GitHub Actions')
  }
  if (files.has('Dockerfile') || files.has('docker-compose.yml')) {
    features.push('Docker support for containerized deployment')
  }
  if (paths.some((p) => /test|spec|__tests__/.test(p))) {
    features.push('Automated test suite')
  }
  if (files.has('.env.example')) {
    features.push('Environment-based configuration')
  }
  if (paths.some((p) => p.startsWith('docs/') || p.startsWith('doc/'))) {
    features.push('Dedicated documentation')
  }
  if (paths.some((p) => p.includes('api/') || p.includes('routes/'))) {
    features.push('API endpoints')
  }

  return features
}

function buildBadges(repo: import('./github').GitHubRepo, primaryLang: string | null): GeneratedReadme['badges'] {
  const badges: GeneratedReadme['badges'] = []

  if (repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION') {
    badges.push({
      id: uid(),
      label: `License ${repo.license.spdx_id}`,
      url: `https://img.shields.io/github/license/${repo.full_name}`,
    })
  }

  if (primaryLang) {
    badges.push({
      id: uid(),
      label: primaryLang,
      url: `https://img.shields.io/github/languages/top/${repo.full_name}?color=%233178C6`,
    })
  }

  badges.push({
    id: uid(),
    label: 'Stars',
    url: `https://img.shields.io/github/stars/${repo.full_name}?style=social`,
  })

  if (repo.topics?.includes('hacktoberfest')) {
    badges.push({
      id: uid(),
      label: 'Hacktoberfest',
      url: 'https://img.shields.io/badge/Hacktoberfest-friendly-orange.svg',
    })
  }

  return badges
}

function buildInstallation(
  repo: import('./github').GitHubRepo,
  files: Set<string>,
  fileContents: Map<string, string>,
): { prerequisites: string; installation: string; usage: string } {
  const cloneUrl = repo.clone_url
  const repoName = repo.name

  if (files.has('package.json')) {
    let pkg: Record<string, unknown> = {}
    try {
      pkg = JSON.parse(fileContents.get('package.json') ?? '{}')
    } catch {
      /* ignore */
    }
    const scripts = (pkg.scripts ?? {}) as Record<string, string>
    const engines = (pkg.engines ?? {}) as Record<string, string>
    const nodeReq = engines.node ? `Node.js ${engines.node}` : 'Node.js 18+'
    const pkgManager = files.has('pnpm-lock.yaml') ? 'pnpm' : files.has('yarn.lock') ? 'yarn' : 'npm'

    const installCmd =
      pkgManager === 'pnpm'
        ? 'pnpm install'
        : pkgManager === 'yarn'
          ? 'yarn'
          : 'npm install'

    const usage =
      scripts.dev
        ? `${pkgManager} run dev`
        : scripts.start
          ? `${pkgManager} start`
          : scripts.serve
            ? `${pkgManager} run serve`
            : `${pkgManager} test`

    return {
      prerequisites: `${nodeReq} and ${pkgManager}`,
      installation: `git clone ${cloneUrl}\ncd ${repoName}\n${installCmd}`,
      usage,
    }
  }

  if (files.has('requirements.txt') || files.has('pyproject.toml')) {
    return {
      prerequisites: 'Python 3.8+',
      installation: `git clone ${cloneUrl}\ncd ${repoName}\npip install -r requirements.txt`,
      usage: files.has('pyproject.toml') ? 'python -m <module>' : 'python main.py',
    }
  }

  if (files.has('Cargo.toml')) {
    return {
      prerequisites: 'Rust toolchain (rustc, cargo)',
      installation: `git clone ${cloneUrl}\ncd ${repoName}\ncargo build`,
      usage: 'cargo run',
    }
  }

  if (files.has('go.mod')) {
    return {
      prerequisites: 'Go 1.21+',
      installation: `git clone ${cloneUrl}\ncd ${repoName}\ngo mod download`,
      usage: 'go run .',
    }
  }

  if (files.has('Makefile')) {
    const makefile = fileContents.get('Makefile') ?? ''
    const hasMakeInstall = /^install:/m.test(makefile)
    return {
      prerequisites: 'make',
      installation: `git clone ${cloneUrl}\ncd ${repoName}${hasMakeInstall ? '\nmake install' : ''}`,
      usage: makefile.match(/^run:/m) ? 'make run' : 'make',
    }
  }

  return {
    prerequisites: '',
    installation: `git clone ${cloneUrl}\ncd ${repoName}`,
    usage: '',
  }
}

function extractEnvVars(fileContents: Map<string, string>): string {
  const example = fileContents.get('.env.example')
  if (example) return example.trim()

  const lines: string[] = []
  for (const [path, content] of fileContents) {
    if (path.endsWith('.env.example') || path.endsWith('.env.sample')) {
      return content.trim()
    }
    const matches = content.match(/^([A-Z][A-Z0-9_]+)=/gm)
    if (matches && path.includes('config')) {
      lines.push(...matches.map((m) => `${m}your_value`))
    }
  }
  return lines.slice(0, 8).join('\n')
}

export interface AnalyzeOptions {
  useAI?: boolean
  aiProvider?: AIProvider
  aiApiKey?: string
  aiModel?: string
  userDescription?: string
}

export async function analyzeRepository(
  client: GitHubClient,
  owner: string,
  repo: string,
  onProgress?: (step: string) => void,
  options: AnalyzeOptions = {},
): Promise<{ summary: ScanSummary; readme: GeneratedReadme }> {
  idSeq = 0
  onProgress?.('Fetching repository metadata...')

  const [repoData, languages, treeData] = await Promise.all([
    client.getRepo(owner, repo),
    client.getLanguages(owner, repo),
    client.getRepo(owner, repo).then((r) => client.getTree(owner, repo, r.default_branch)),
  ])

  onProgress?.('Scanning file tree...')

  const blobs = filterTree(treeData.tree)
  const allPaths = new Set(blobs.map((b) => b.path))
  const fileSet = new Set(allPaths)

  const langEntries = Object.entries(languages).sort((a, b) => b[1] - a[1])
  const totalBytes = langEntries.reduce((sum, [, b]) => sum + b, 0)
  const langList = langEntries.map(([name, bytes]) => ({
    name,
    bytes,
    percent: totalBytes ? Math.round((bytes / totalBytes) * 100) : 0,
  }))

  const filesToFetch = KEY_FILES.filter((f) => allPaths.has(f))
  const extraEnv = blobs.filter((b) => b.path.endsWith('.env.example')).map((b) => b.path)
  const workflowSample = blobs.find((b) => b.path.startsWith('.github/workflows/'))?.path

  const fetchPaths = [...new Set([...filesToFetch, ...extraEnv, ...(workflowSample ? [workflowSample] : [])])]

  onProgress?.(`Reading ${fetchPaths.length} key files...`)

  const fileContents = new Map<string, string>()
  await Promise.all(
    fetchPaths.map(async (path) => {
      const content = await client.getFileContent(owner, repo, path, repoData.default_branch)
      if (content) fileContents.set(path, content)
    }),
  )

  onProgress?.('Generating README...')

  const detectedStack = detectStack(fileSet, fileContents)
  for (const lang of langList.slice(0, 5)) {
    if (!detectedStack.includes(lang.name)) detectedStack.push(lang.name)
  }

  const rawFeatures = inferFeatures(fileSet, blobs)
  const hasTests = [...fileSet].some((p) => /test|spec|__tests__/i.test(p))
  const hasCi = [...fileSet].some((p) => p.startsWith('.github/workflows/'))
  const hasDocker = fileSet.has('Dockerfile') || fileSet.has('docker-compose.yml')

  const contentCtx = {
    repo: repoData,
    owner,
    userDescription: options.userDescription?.trim() || undefined,
    detectedStack,
    languages: langList,
    features: rawFeatures,
    fileSet,
    fileContents,
    blobs,
    hasTests,
    hasCi,
    hasDocker,
  }

  const detailedFeatures = buildDetailedFeatures(contentCtx)
  const { prerequisites, installation, usage: baseUsage } = buildInstallation(repoData, fileSet, fileContents)
  const envVars = extractEnvVars(fileContents)
  const projectStructure = buildProjectStructure(blobs)
  const badges = buildBadges(repoData, repoData.language)

  let readme: GeneratedReadme = {
    title: repoData.name,
    tagline:
      options.userDescription?.trim().split(/[.!?]/)[0]?.trim() ||
      repoData.description?.trim() ||
      `A ${detectedStack[0] || 'open-source'} project by ${repoData.owner.login}`,
    badges,
    aim: buildAim(contentCtx),
    description: buildDetailedDescription(contentCtx),
    problemStatement: buildProblemStatement(contentCtx),
    targetAudience: buildTargetAudience(contentCtx),
    features: detailedFeatures.map((text) => ({ id: uid(), text })),
    featuresDetail: '',
    demoUrl: repoData.homepage ?? '',
    screenshotUrl: '',
    techStack: detectedStack.map((name) => ({ id: uid(), name })),
    architecture: buildArchitecture(contentCtx),
    prerequisites,
    installation,
    usage: buildUsageDetails(baseUsage, contentCtx),
    testing: buildTestingSection(contentCtx),
    deployment: buildDeploymentSection(contentCtx),
    envVars,
    projectStructure,
    additionalSections: [],
    contributing: buildContributingDetailed(contentCtx),
    license: repoData.license?.spdx_id && repoData.license.spdx_id !== 'NOASSERTION' ? repoData.license.spdx_id : '',
    authorName: repoData.owner.login,
    authorEmail: '',
    socialLinks: [{ id: uid(), platform: 'GitHub', url: repoData.owner.html_url }],
    showTableOfContents: true,
  }

  const existingReadme = fileContents.get('README.md')
  const parsedExisting = existingReadme ? parseExistingReadme(existingReadme) : null
  if (parsedExisting?.isSubstantial) {
    readme = applyExistingReadmeBaseline(readme, parsedExisting)
    console.log(`[scan] Found substantial existing README (${existingReadme!.length} chars) — using as baseline`)
  }

  let aiEnhanced = false
  let aiProvider: string | undefined
  let aiModel: string | undefined

  if (options.useAI) {
    const provider = options.aiProvider ?? 'openai'
    const apiKey = resolveAIKey(options.aiApiKey, provider)

    if (!apiKey) {
      throw new Error(
        `AI analysis requires an API key. Add one in the UI or set ${provider === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY'} on the server.`,
      )
    }

    onProgress?.('Running AI analysis...')

    const topPaths = blobs.map((b) => b.path).sort().slice(0, 50)
    const aiOptions: AIAnalyzerOptions = { provider, apiKey, model: options.aiModel }
    const enhanced = await enhanceWithAI(
      {
        repo: repoData,
        owner,
        detectedStack,
        languages: langList,
        fileCount: blobs.length,
        topPaths,
        fileContents,
        hasTests,
        hasCi,
        hasDocker,
        baseline: readme,
        userDescription: options.userDescription?.trim() || undefined,
        existingReadme: existingReadme ?? undefined,
        parsedExisting: parsedExisting ?? undefined,
      },
      aiOptions,
    )

    readme = enhanced.readme
    aiEnhanced = true
    aiProvider = provider
    aiModel = enhanced.model
  }

  readme = normalizeReadme(readme)

  const summary: ScanSummary = {
    owner,
    repo,
    url: repoData.html_url,
    defaultBranch: repoData.default_branch,
    fileCount: blobs.length,
    languages: langList,
    detectedStack,
    hasTests,
    hasCi,
    hasDocker,
    topics: repoData.topics ?? [],
    stars: repoData.stargazers_count,
    treeTruncated: treeData.truncated,
    aiEnhanced,
    aiProvider,
    aiModel,
    userDescriptionProvided: Boolean(options.userDescription?.trim()),
    hadExistingReadme: Boolean(parsedExisting?.isSubstantial),
  }

  return { summary, readme }
}
