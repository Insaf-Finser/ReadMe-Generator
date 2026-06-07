import type { GeneratedReadme } from './analyzeRepo'

export interface ReadmeSection {
  title: string
  content: string
}

export interface ParsedExistingReadme {
  isSubstantial: boolean
  tagline: string
  sections: ReadmeSection[]
  fullContent: string
}

const SECTION_ALIASES: Record<string, keyof GeneratedReadme | 'featuresDetail' | 'skip'> = {
  overview: 'description',
  description: 'description',
  about: 'description',
  aim: 'aim',
  'problem statement': 'problemStatement',
  'target audience': 'targetAudience',
  features: 'featuresDetail',
  'tech stack': 'skip',
  'technology stack': 'skip',
  architecture: 'architecture',
  'getting started': 'skip',
  prerequisites: 'prerequisites',
  installation: 'installation',
  environment: 'envVars',
  'environment variables': 'envVars',
  usage: 'usage',
  run: 'usage',
  testing: 'testing',
  deployment: 'deployment',
  'project structure': 'projectStructure',
  contributing: 'contributing',
  license: 'license',
  author: 'skip',
  demo: 'skip',
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^\w\s]/g, '').trim()
}

function parseSubsections(content: string): ReadmeSection[] {
  const parts: ReadmeSection[] = []
  const lines = content.split('\n')
  let currentTitle = ''
  let currentLines: string[] = []

  for (const line of lines) {
    const h3 = line.match(/^###\s+(.+)/)
    if (h3) {
      if (currentTitle) {
        parts.push({ title: currentTitle, content: currentLines.join('\n').trim() })
      }
      currentTitle = h3[1].trim()
      currentLines = []
      continue
    }
    currentLines.push(line)
  }
  if (currentTitle) {
    parts.push({ title: currentTitle, content: currentLines.join('\n').trim() })
  }
  return parts
}

export function parseExistingReadme(content: string): ParsedExistingReadme {
  const lines = content.split('\n')
  const sections: ReadmeSection[] = []
  let currentTitle = ''
  let currentLines: string[] = []
  let titleLine = ''
  let preamble: string[] = []
  let inPreamble = true

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)/)
    if (h1 && !titleLine) {
      titleLine = h1[1].trim()
      continue
    }

    const h2 = line.match(/^##\s+(.+)/)
    if (h2) {
      inPreamble = false
      if (currentTitle || currentLines.length > 0) {
        sections.push({ title: currentTitle || 'Introduction', content: currentLines.join('\n').trim() })
      } else if (inPreamble === false && currentLines.length > 0) {
        preamble = [...currentLines]
      }
      currentTitle = h2[1].trim()
      currentLines = []
      continue
    }

    if (!currentTitle && !h2) {
      preamble.push(line)
    } else {
      currentLines.push(line)
    }
  }

  if (currentTitle || currentLines.length > 0) {
    sections.push({ title: currentTitle || 'Introduction', content: currentLines.join('\n').trim() })
  }

  const taglineFromPreamble = preamble
    .join('\n')
    .replace(/\*\*/g, '')
    .replace(/^[-*]\s+/gm, '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('![') && !l.startsWith('---') && !l.startsWith('#'))
    .slice(0, 2)
    .join(' ')

  return {
    isSubstantial: content.length > 2000,
    tagline: taglineFromPreamble,
    sections,
    fullContent: content,
  }
}

function extractCodeBlock(content: string): string {
  const match = content.match(/```[\w]*\n([\s\S]*?)```/)
  return match ? match[1].trim() : content
}

function extractEnvBlock(content: string): string {
  const envMatch =
    content.match(/```env\n([\s\S]*?)```/) ||
    content.match(/```\n([\s\S]*?(?:REACT_APP_|VITE_|API_|DATABASE_)[\s\S]*?)```/)
  return envMatch ? envMatch[1].trim() : content
}

let idSeq = 5000
function uid() {
  return String(++idSeq)
}

export function applyExistingReadmeBaseline(
  baseline: GeneratedReadme,
  parsed: ParsedExistingReadme,
): GeneratedReadme {
  if (!parsed.isSubstantial) return baseline

  const result = { ...baseline }
  const additionalSections: GeneratedReadme['additionalSections'] = []

  for (const section of parsed.sections) {
    const normalized = normalizeTitle(section.title)

    if (normalized === 'getting started') {
      for (const sub of parseSubsections(section.content)) {
        const subKey = SECTION_ALIASES[normalizeTitle(sub.title)]
        if (subKey === 'prerequisites') result.prerequisites = sub.content.replace(/^[-*]\s+/gm, '').trim()
        if (subKey === 'installation') result.installation = extractCodeBlock(sub.content)
        if (subKey === 'envVars') result.envVars = extractEnvBlock(sub.content)
        if (subKey === 'usage') {
          const runBlock = extractCodeBlock(sub.content)
          result.usage = sub.content.includes('http') ? sub.content : runBlock
        }
        if (normalizeTitle(sub.title) === 'build') {
          result.deployment = (result.deployment ? result.deployment + '\n\n' : '') + sub.content
        }
      }
      continue
    }

    const key = SECTION_ALIASES[normalized]

    if (key === 'featuresDetail' && section.content.length > 100) {
      result.featuresDetail = section.content
      result.features = []
      continue
    }

    if (key === 'projectStructure' && section.content.includes('```')) {
      result.projectStructure = extractCodeBlock(section.content)
      continue
    }

    if (key === 'envVars' && section.content.length > 50) {
      result.envVars = extractEnvBlock(section.content)
      continue
    }

    if (key === 'skip' || !key) {
      if (
        section.content.length > 80 &&
        !['table of contents', 'introduction'].includes(normalized)
      ) {
        additionalSections.push({ id: uid(), title: section.title, content: section.content })
      }
      continue
    }

    const existing = result[key]
    if (typeof existing === 'string' && section.content.length > (existing?.length ?? 0) * 0.4) {
      ;(result as Record<string, unknown>)[key] = section.content
    }
  }

  if (parsed.tagline.length > 20) {
    result.tagline = parsed.tagline.slice(0, 400)
  }

  if (additionalSections.length > 0) {
    result.additionalSections = additionalSections
  }

  return result
}
