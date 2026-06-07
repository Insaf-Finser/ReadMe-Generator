import type { GitHubRepo, TreeEntry } from './github'

interface ContentContext {
  repo: GitHubRepo
  owner: string
  userDescription?: string
  detectedStack: string[]
  languages: { name: string; percent: number }[]
  features: string[]
  fileSet: Set<string>
  fileContents: Map<string, string>
  blobs: TreeEntry[]
  hasTests: boolean
  hasCi: boolean
  hasDocker: boolean
}

function projectType(stack: string[], topics: string[]): string {
  if (topics.includes('cli') || stack.some((s) => /cli|command/i.test(s))) return 'command-line tool'
  if (topics.includes('api') || stack.includes('Express') || stack.includes('FastAPI')) return 'API service'
  if (stack.includes('React') || stack.includes('Vue') || stack.includes('Next.js')) return 'web application'
  if (topics.includes('library') || topics.includes('sdk')) return 'library'
  if (topics.includes('machine-learning') || topics.includes('deep-learning')) return 'machine learning project'
  if (stack.includes('Docker')) return 'containerized application'
  return 'software project'
}

function extractReadmeIntro(readme: string | undefined): string | null {
  if (!readme) return null
  const lines = readme.split('\n')
  const paragraphs: string[] = []
  let current = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#') || trimmed.startsWith('![') || trimmed.startsWith('<')) continue
    if (trimmed === '') {
      if (current.trim().length > 40) paragraphs.push(current.trim())
      current = ''
      if (paragraphs.length >= 2) break
      continue
    }
    current += (current ? ' ' : '') + trimmed
  }
  if (current.trim().length > 40 && paragraphs.length < 2) paragraphs.push(current.trim())

  return paragraphs.length > 0 ? paragraphs.join('\n\n') : null
}

function topLevelDirs(blobs: TreeEntry[]): string[] {
  const dirs = new Set<string>()
  for (const b of blobs) {
    const parts = b.path.split('/')
    if (parts.length > 1) dirs.add(parts[0])
  }
  return [...dirs].sort().slice(0, 8)
}

function getPackageInfo(fileContents: Map<string, string>) {
  try {
    const pkg = JSON.parse(fileContents.get('package.json') ?? '{}')
    return {
      name: pkg.name as string | undefined,
      description: pkg.description as string | undefined,
      scripts: (pkg.scripts ?? {}) as Record<string, string>,
      keywords: (pkg.keywords ?? []) as string[],
    }
  } catch {
    return { scripts: {} as Record<string, string>, keywords: [] as string[] }
  }
}

export function buildAim(ctx: ContentContext): string {
  const { repo, detectedStack, languages, userDescription } = ctx
  const type = projectType(detectedStack, repo.topics ?? [])
  const stackSummary = detectedStack.slice(0, 4).join(', ') || languages.slice(0, 2).map((l) => l.name).join(' and ')
  const topicHint = repo.topics?.length ? ` It is tagged with topics such as ${repo.topics.slice(0, 4).join(', ')}.` : ''

  if (userDescription?.trim()) {
    const desc = userDescription.trim().replace(/\.$/, '')
    return `The aim of **${repo.name}** is to ${desc.charAt(0).toLowerCase()}${desc.slice(1)}. This ${type} is built using ${stackSummary || 'modern technologies'} to deliver on that vision.${topicHint}`
  }

  const pkgDesc = getPackageInfo(ctx.fileContents).description

  if (pkgDesc) {
    return `The aim of **${repo.name}** is to ${pkgDesc.charAt(0).toLowerCase()}${pkgDesc.slice(1).replace(/\.$/, '')}. This ${type} is built using ${stackSummary || 'modern technologies'} and is designed to be maintainable, well-structured, and easy for developers to adopt.${topicHint}`
  }

  if (repo.description) {
    return `The aim of **${repo.name}** is to ${repo.description.charAt(0).toLowerCase()}${repo.description.slice(1).replace(/\.$/, '')}. Developed as a ${type}, it leverages ${stackSummary || 'a modern technology stack'} to deliver a reliable solution for its intended use case.${topicHint}`
  }

  return `**${repo.name}** is a ${type} created by [${repo.owner.login}](${repo.owner.html_url}). The project's goal is to provide a robust, open-source solution built with ${stackSummary || 'industry-standard tools'}, making it easier for developers to ${type.includes('library') ? 'integrate into their own applications' : 'solve real-world problems efficiently'}.${topicHint}`
}

export function buildProblemStatement(ctx: ContentContext): string {
  const { repo, detectedStack, features, userDescription } = ctx
  const type = projectType(detectedStack, repo.topics ?? [])

  if (userDescription?.trim()) {
    return `${repo.name} was created to address a specific need: ${userDescription.trim().replace(/\.$/, '')}. The repository implements this vision using ${detectedStack.slice(0, 3).join(', ') || 'a modern tech stack'}${features.length ? `, with capabilities including ${features.slice(0, 3).join(', ').toLowerCase()}` : ''}.`
  }

  const painPoints: string[] = []

  if (type.includes('web')) {
    painPoints.push('Building user-facing applications often requires repetitive setup, inconsistent tooling, and fragmented documentation.')
  } else if (type.includes('API')) {
    painPoints.push('Teams frequently struggle with boilerplate when standing up APIs, managing configuration, and keeping services consistent across environments.')
  } else if (type.includes('library')) {
    painPoints.push('Developers need dependable, well-documented building blocks instead of reinventing common functionality in every project.')
  } else if (type.includes('CLI')) {
    painPoints.push('Automating workflows from the terminal should be fast and predictable, without opaque configuration or fragile scripts.')
  } else {
    painPoints.push('Many projects lack clear structure, onboarding guidance, and production-ready defaults, which slows down adoption and contribution.')
  }

  const solutionParts = [
    `${repo.name} addresses these challenges by offering a clearly organized codebase`,
    detectedStack.length ? `a cohesive stack centered on ${detectedStack.slice(0, 3).join(', ')}` : 'sensible project conventions',
    features.length ? `and capabilities such as ${features.slice(0, 3).join(', ').toLowerCase()}` : 'and practical defaults derived from the repository structure',
  ]

  return `${painPoints[0]} ${repo.name} addresses these challenges by offering ${solutionParts.slice(1).join(', ')}. By standardizing how the project is set up, tested, and extended, it reduces friction for both new contributors and downstream users.`
}

export function buildTargetAudience(ctx: ContentContext): string {
  const { repo, detectedStack, languages } = ctx
  const audiences: string[] = []

  if (detectedStack.includes('React') || detectedStack.includes('Vue') || detectedStack.includes('Next.js')) {
    audiences.push('frontend developers building interactive user interfaces')
  }
  if (detectedStack.includes('Express') || detectedStack.includes('FastAPI') || detectedStack.includes('Django')) {
    audiences.push('backend engineers designing APIs and server-side logic')
  }
  if (detectedStack.includes('TypeScript') || detectedStack.includes('JavaScript')) {
    audiences.push('JavaScript/TypeScript developers')
  }
  if (detectedStack.includes('Python')) audiences.push('Python developers')
  if (detectedStack.includes('Rust')) audiences.push('systems programmers and Rust enthusiasts')
  if (detectedStack.includes('Go')) audiences.push('Go developers building performant services')
  if (detectedStack.includes('Docker')) audiences.push('DevOps engineers and teams deploying with containers')

  if (repo.topics?.includes('beginner')) audiences.push('developers learning best practices from a reference implementation')
  if (repo.topics?.includes('hacktoberfest')) audiences.push('open-source contributors looking for welcoming projects')

  if (audiences.length === 0) {
    const langNames = languages.slice(0, 2).map((l) => l.name).join('/') || 'software'
    audiences.push(`${langNames} developers`, 'maintainers seeking a well-documented codebase', 'contributors who want a clear entry point into the project')
  }

  const unique = [...new Set(audiences)]
  return `This project is intended for:\n\n${unique.map((a) => `- **${a.charAt(0).toUpperCase()}${a.slice(1)}**`).join('\n')}\n\nWhether you want to use ${repo.name} directly, study its architecture, or contribute improvements, the repository is structured to support gradual onboarding.`
}

export function buildDetailedDescription(ctx: ContentContext): string {
  const { repo, detectedStack, languages, features, fileSet, blobs, userDescription } = ctx
  const readmeIntro = extractReadmeIntro(ctx.fileContents.get('README.md'))
  const pkg = getPackageInfo(ctx.fileContents)
  const paragraphs: string[] = []

  if (userDescription?.trim()) {
    paragraphs.push(userDescription.trim())
  }

  if (readmeIntro && !userDescription?.trim()) {
    paragraphs.push(readmeIntro)
  } else if (!userDescription?.trim() && pkg.description) {
    paragraphs.push(pkg.description)
    if (repo.description && repo.description !== pkg.description) {
      paragraphs.push(repo.description)
    }
  } else if (repo.description) {
    paragraphs.push(repo.description)
  } else {
    paragraphs.push(
      `${repo.name} is an open-source ${projectType(detectedStack, repo.topics ?? [])} hosted on GitHub under [${repo.owner.login}](${repo.owner.html_url}). It brings together ${detectedStack.slice(0, 4).join(', ') || 'multiple technologies'} into a single, cohesive codebase.`,
    )
  }

  const langSummary =
    languages.length > 0
      ? `The codebase is primarily written in ${languages.slice(0, 3).map((l) => `${l.name} (${l.percent}%)`).join(', ')}.`
      : ''

  const scaleNote = `The repository contains **${blobs.length.toLocaleString()}** tracked files`
  const dirNote = topLevelDirs(blobs).length
    ? ` organized into top-level areas such as \`${topLevelDirs(blobs).join('`, `')}\``
    : ''
  paragraphs.push(`${scaleNote}${dirNote}. ${langSummary}`.trim())

  if (features.length > 0) {
    paragraphs.push(
      `Notable characteristics identified during repository analysis include ${features.map((f) => f.toLowerCase()).join(', ')}.${fileSet.has('docs') || [...fileSet].some((p) => p.startsWith('docs/')) ? ' Additional documentation is available within the repository.' : ''}`,
    )
  }

  if (repo.homepage) {
    paragraphs.push(`A live demo or project homepage is available at [${repo.homepage}](${repo.homepage}).`)
  }

  paragraphs.push(
    `The project has garnered **${repo.stargazers_count.toLocaleString()}** stars and welcomes community participation through issues and pull requests.`,
  )

  return paragraphs.join('\n\n')
}

export function buildArchitecture(ctx: ContentContext): string {
  const { detectedStack, fileSet, blobs } = ctx
  const dirs = topLevelDirs(blobs)
  const parts: string[] = [
    `${ctx.repo.name} follows a modular layout that separates concerns across directories and configuration files. This makes it easier to navigate, test, and extend individual parts of the system without affecting unrelated code.`,
  ]

  const dirDescriptions: Record<string, string> = {
    src: 'Core application source code and business logic',
    lib: 'Shared libraries and reusable modules',
    app: 'Application entry points and route handlers',
    components: 'UI components (for frontend projects)',
    pages: 'Page-level views and routing',
    api: 'API routes, controllers, and service integrations',
    server: 'Backend server code and middleware',
    tests: 'Automated tests and test utilities',
    test: 'Test suites and fixtures',
    '__tests__': 'Unit and integration tests',
    docs: 'Project documentation',
    public: 'Static assets served to clients',
    assets: 'Images, fonts, and other static resources',
    scripts: 'Build, deployment, and utility scripts',
    '.github': 'GitHub metadata, issue templates, and CI workflows',
    docker: 'Container-related configuration',
    config: 'Application and environment configuration',
    utils: 'Helper functions and shared utilities',
    models: 'Data models and schema definitions',
    routes: 'HTTP route definitions',
    middleware: 'Request/response middleware',
  }

  if (dirs.length > 0) {
    parts.push('\n**Directory overview:**\n')
    for (const dir of dirs) {
      const desc = dirDescriptions[dir] ?? `Contains ${dir}-related code and resources`
      parts.push(`- \`${dir}/\` — ${desc}`)
    }
  }

  const configFiles: string[] = []
  if (fileSet.has('package.json')) configFiles.push('`package.json` — Node.js dependencies and scripts')
  if (fileSet.has('tsconfig.json')) configFiles.push('`tsconfig.json` — TypeScript compiler options')
  if (fileSet.has('Dockerfile')) configFiles.push('`Dockerfile` — Container image definition')
  if (fileSet.has('docker-compose.yml')) configFiles.push('`docker-compose.yml` — Multi-container orchestration')
  if (fileSet.has('.env.example')) configFiles.push('`.env.example` — Environment variable template')

  if (configFiles.length > 0) {
    parts.push('\n**Key configuration:**\n')
    parts.push(configFiles.map((c) => `- ${c}`).join('\n'))
  }

  if (detectedStack.length > 0) {
    parts.push(`\nThe architecture is built on **${detectedStack.join(', ')}**, chosen to balance developer productivity, performance, and ecosystem support.`)
  }

  return parts.join('\n')
}

export function buildTestingSection(ctx: ContentContext): string {
  const { fileSet, fileContents, hasTests, hasCi } = ctx
  const pkg = getPackageInfo(fileContents)
  const scripts = pkg.scripts

  const parts: string[] = []

  if (hasTests) {
    parts.push('This repository includes an automated test suite. Tests help ensure that changes do not break existing behavior and provide a safety net for refactoring.')
  } else {
    parts.push('No dedicated test directory was detected in the repository scan. Consider adding tests to improve reliability and contributor confidence.')
    return parts.join('\n')
  }

  const testDirs = [...fileSet].filter((p) => /test|spec|__tests__/i.test(p) && !p.includes('.')).slice(0, 5)
  if (testDirs.length > 0) {
    parts.push(`\nTest-related paths found: \`${testDirs.join('`, `')}\`.`)
  }

  const testScript = scripts.test ?? scripts['test:unit'] ?? scripts['test:ci']
  if (testScript) {
    const cmd = Object.entries(scripts).find(([, v]) => v === testScript)?.[0] ?? 'test'
    const pkgManager = fileSet.has('pnpm-lock.yaml') ? 'pnpm' : fileSet.has('yarn.lock') ? 'yarn' : 'npm'
    parts.push(`\nRun the test suite:\n\n\`\`\`bash\n${pkgManager} run ${cmd}\n\`\`\``)
  }

  if (scripts['test:coverage'] || scripts.coverage) {
    const cmd = scripts['test:coverage'] ? 'test:coverage' : 'coverage'
    const pkgManager = fileSet.has('pnpm-lock.yaml') ? 'pnpm' : fileSet.has('yarn.lock') ? 'yarn' : 'npm'
    parts.push(`\nGenerate a coverage report:\n\n\`\`\`bash\n${pkgManager} run ${cmd}\n\`\`\``)
  }

  if (hasCi) {
    parts.push('\nContinuous integration is configured via **GitHub Actions**, so tests are automatically executed on pull requests and pushes to the main branch.')
  }

  return parts.join('\n')
}

export function buildDeploymentSection(ctx: ContentContext): string {
  const { hasDocker, hasCi, fileSet, fileContents, repo } = ctx
  const parts: string[] = []

  if (!hasDocker && !hasCi && !fileSet.has('vercel.json') && !fileSet.has('netlify.toml')) {
    return ''
  }

  parts.push(`This section outlines how **${repo.name}** can be built and deployed based on configuration found in the repository.`)

  if (hasDocker) {
    parts.push('\n### Docker\n')
    if (fileSet.has('docker-compose.yml') || fileSet.has('docker-compose.yaml')) {
      parts.push('The project includes Docker Compose for running the full stack locally or in production-like environments:\n\n```bash\ndocker compose up --build\n```')
    } else {
      parts.push('Build and run the container image:\n\n```bash\ndocker build -t ' + repo.name + ' .\ndocker run -p 3000:3000 ' + repo.name + '\n```')
    }
  }

  if (hasCi) {
    const workflow = fileContents.get([...fileContents.keys()].find((k) => k.startsWith('.github/workflows/')) ?? '')
    parts.push('\n### CI/CD\n')
    parts.push('GitHub Actions workflows are configured under `.github/workflows/` to automate testing, linting, and deployment pipelines.')
    if (workflow?.includes('deploy')) {
      parts.push(' Deployment steps are included in the CI pipeline — review the workflow files for environment-specific configuration.')
    }
  }

  const pkg = getPackageInfo(fileContents)
  if (pkg.scripts.build) {
    const pkgManager = fileSet.has('pnpm-lock.yaml') ? 'pnpm' : fileSet.has('yarn.lock') ? 'yarn' : 'npm'
    parts.push(`\n### Production build\n\n\`\`\`bash\n${pkgManager} run build\n\`\`\``)
  }

  if (repo.homepage) {
    parts.push(`\nThe project homepage at [${repo.homepage}](${repo.homepage}) may reflect the latest deployed version.`)
  }

  return parts.join('\n')
}

export function buildDetailedFeatures(ctx: ContentContext): string[] {
  const { features, detectedStack, hasTests, hasCi, hasDocker, fileSet, languages } = ctx
  const detailed: string[] = []

  for (const f of features) {
    detailed.push(f)
  }

  if (detectedStack.includes('TypeScript')) {
    detailed.push('**Type-safe development** — TypeScript enforces static typing, improving IDE support and catching errors at compile time')
  }
  if (languages.length > 1) {
    detailed.push(`**Multi-language codebase** — Combines ${languages.slice(0, 4).map((l) => l.name).join(', ')} for specialized tasks`)
  }
  if (fileSet.has('.env.example')) {
    detailed.push('**Configurable environments** — `.env.example` documents required environment variables for local and production setups')
  }
  if (hasTests && !features.some((f) => f.toLowerCase().includes('test'))) {
    detailed.push('**Test coverage** — Includes automated tests to validate core functionality')
  }
  if (hasCi && !features.some((f) => f.toLowerCase().includes('ci'))) {
    detailed.push('**Automated pipelines** — GitHub Actions run checks on every push and pull request')
  }
  if (hasDocker && !features.some((f) => f.toLowerCase().includes('docker'))) {
    detailed.push('**Container-ready** — Dockerfile and/or Compose files support reproducible deployments')
  }
  if (fileSet.has('LICENSE')) {
    detailed.push('**Open source** — Licensed for free use, modification, and distribution')
  }

  return [...new Set(detailed)]
}

export function buildUsageDetails(
  usage: string,
  ctx: ContentContext,
): string {
  const pkg = getPackageInfo(ctx.fileContents)
  const scripts = pkg.scripts
  const pkgManager = ctx.fileSet.has('pnpm-lock.yaml') ? 'pnpm' : ctx.fileSet.has('yarn.lock') ? 'yarn' : 'npm'
  const parts: string[] = [
    `Once installed, you can start working with **${ctx.repo.name}** using the commands below.`,
  ]

  if (usage) {
    parts.push(`\n### Quick start\n\n\`\`\`bash\n${usage}\n\`\`\``)
  }

  const otherScripts = Object.entries(scripts).filter(
    ([name]) => !['test', 'start', 'dev', 'build'].includes(name) && !name.startsWith('pre'),
  ).slice(0, 6)

  if (otherScripts.length > 0) {
    parts.push('\n### Available scripts\n')
    parts.push('| Script | Command |')
    parts.push('|--------|---------|')
    for (const [name, cmd] of otherScripts) {
      parts.push(`| \`${name}\` | \`${pkgManager} run ${name}\` |`)
    }
    parts.push('\n> Run `npm run` (or `pnpm run` / `yarn`) without arguments to list all available scripts.')
  }

  return parts.join('\n')
}

export function buildContributingDetailed(ctx: ContentContext): string {
  const { repo, fileSet } = ctx
  const parts: string[] = [
    `Contributions to **${repo.name}** are welcome and appreciated. Whether you are fixing a bug, improving documentation, or proposing a new feature, your help makes the project better for everyone.`,
    '\n### How to contribute\n',
    '1. **Fork** the repository on GitHub',
    `2. **Clone** your fork: \`git clone https://github.com/YOUR_USERNAME/${repo.name}.git\``,
    `3. **Create a branch** for your changes: \`git checkout -b feature/your-feature-name\``,
    '4. **Make your changes** and add tests if applicable',
    '5. **Commit** with a clear message describing what you changed',
    `6. **Push** to your fork and open a **Pull Request** against [\`${repo.owner.login}/${repo.name}\`](${repo.html_url})`,
  ]

  if (fileSet.has('CONTRIBUTING.md')) {
    parts.push('\nPlease read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines, coding standards, and review expectations.')
  }

  parts.push('\n### Reporting issues\n')
  parts.push(`If you encounter a bug or have a feature request, please [open an issue](${repo.html_url}/issues) with a clear description, steps to reproduce (if applicable), and your environment details.`)

  return parts.join('\n')
}
