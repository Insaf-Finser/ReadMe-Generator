import type { GeneratedReadme } from './analyzeRepo'

/** Coerce any AI value to a plain string (arrays → bullet list). */
export function toMarkdownString(value: unknown, fallback = ''): string {
  if (value == null) return fallback
  if (typeof value === 'string') return value.trim() || fallback
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  if (Array.isArray(value)) {
    const lines = value
      .map((item) => {
        if (typeof item === 'string') return `- ${item.trim()}`
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>
          const text = obj.text ?? obj.name ?? obj.description ?? obj.label
          if (typeof text === 'string') return `- ${text.trim()}`
        }
        return `- ${String(item).trim()}`
      })
      .filter((line) => line.length > 2)
    return lines.join('\n') || fallback
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return fallback
    return entries.map(([k, v]) => `- **${k}**: ${String(v).trim()}`).join('\n')
  }

  return String(value).trim() || fallback
}

export function normalizeReadme(readme: GeneratedReadme): GeneratedReadme {
  return {
    ...readme,
    tagline: toMarkdownString(readme.tagline),
    aim: toMarkdownString(readme.aim),
    description: toMarkdownString(readme.description),
    problemStatement: toMarkdownString(readme.problemStatement),
    targetAudience: toMarkdownString(readme.targetAudience),
    architecture: toMarkdownString(readme.architecture),
    prerequisites: toMarkdownString(readme.prerequisites),
    installation: toMarkdownString(readme.installation),
    usage: toMarkdownString(readme.usage),
    testing: toMarkdownString(readme.testing),
    deployment: toMarkdownString(readme.deployment),
    envVars: toMarkdownString(readme.envVars),
    projectStructure: toMarkdownString(readme.projectStructure),
    contributing: toMarkdownString(readme.contributing),
    license: toMarkdownString(readme.license),
    authorName: toMarkdownString(readme.authorName),
    authorEmail: toMarkdownString(readme.authorEmail),
    features: (readme.features ?? []).map((f) => ({
      id: f.id,
      text: toMarkdownString(f.text),
    })),
    featuresDetail: toMarkdownString(readme.featuresDetail),
    additionalSections: (readme.additionalSections ?? []).map((s) => ({
      id: s.id,
      title: toMarkdownString(s.title),
      content: toMarkdownString(s.content),
    })),
    techStack: (readme.techStack ?? []).map((t) => ({
      id: t.id,
      name: toMarkdownString(t.name),
    })),
  }
}
