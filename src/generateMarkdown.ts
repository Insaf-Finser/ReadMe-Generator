import type { ReadmeData } from './types'
import { asText, hasText } from './utils/text'

function section(title: string, body: string): string {
  if (!body.trim()) return ''
  return `## ${title}\n\n${body.trim()}\n`
}

function codeBlock(content: string, lang = 'bash'): string {
  return '```' + lang + '\n' + content.trim() + '\n```'
}

function isRichMarkdown(content: string): boolean {
  return /^#{1,3}\s/m.test(content) || /\|.+\|/.test(content) || content.includes('```') || content.split('\n\n').length > 2
}

function formatUsage(usage: string): string {
  if (isRichMarkdown(usage)) return usage.trim()
  if (usage.includes('```')) return usage.trim()
  return codeBlock(usage)
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
}

export function generateMarkdown(data: ReadmeData): string {
  const tagline = asText(data.tagline)
  const aim = asText(data.aim)
  const description = asText(data.description)
  const problemStatement = asText(data.problemStatement)
  const targetAudience = asText(data.targetAudience)
  const featuresDetail = asText(data.featuresDetail)
  const architecture = asText(data.architecture)
  const prerequisites = asText(data.prerequisites)
  const installation = asText(data.installation)
  const usage = asText(data.usage)
  const testing = asText(data.testing)
  const deployment = asText(data.deployment)
  const envVars = asText(data.envVars)
  const projectStructure = asText(data.projectStructure)
  const contributing = asText(data.contributing)
  const license = asText(data.license)
  const authorName = asText(data.authorName)
  const authorEmail = asText(data.authorEmail)
  const demoUrl = asText(data.demoUrl)
  const screenshotUrl = asText(data.screenshotUrl)

  const additionalSections = (data.additionalSections ?? []).filter((s) => hasText(s.title) && hasText(s.content))
  const hasTechStackSection = additionalSections.some((s) => /tech(nology)?\s*stack/i.test(s.title))

  const parts: string[] = []

  parts.push(`# ${asText(data.title) || 'Project'}`)
  if (hasText(tagline)) {
    parts.push(`\n> ${tagline.trim()}`)
  }

  const activeBadges = data.badges.filter((b) => hasText(b.url))
  if (activeBadges.length > 0) {
    parts.push('\n' + activeBadges.map((b) => `![${b.label}](${asText(b.url).trim()})`).join(' '))
  }

  if (data.showTableOfContents) {
    parts.push('\n## Table of Contents\n')
    const toc: string[] = []
    if (hasText(aim)) toc.push('- [Aim](#aim)')
    if (hasText(description)) toc.push('- [Description](#description)')
    if (hasText(problemStatement)) toc.push('- [Problem Statement](#problem-statement)')
    if (hasText(targetAudience)) toc.push('- [Target Audience](#target-audience)')
    if (hasText(featuresDetail) || data.features.some((f) => hasText(f.text))) toc.push('- [Features](#features)')
    if (hasText(demoUrl) || hasText(screenshotUrl)) toc.push('- [Demo](#demo)')
    if (!hasTechStackSection && data.techStack.some((t) => hasText(t.name))) toc.push('- [Tech Stack](#tech-stack)')
    for (const s of additionalSections) toc.push(`- [${s.title}](#${slugify(s.title)})`)
    if (hasText(architecture)) toc.push('- [Architecture](#architecture)')
    if (hasText(prerequisites) || hasText(installation) || hasText(envVars)) toc.push('- [Getting Started](#getting-started)')
    if (hasText(usage)) toc.push('- [Usage](#usage)')
    if (hasText(testing)) toc.push('- [Testing](#testing)')
    if (hasText(deployment)) toc.push('- [Deployment](#deployment)')
    if (hasText(projectStructure)) toc.push('- [Project Structure](#project-structure)')
    if (hasText(contributing)) toc.push('- [Contributing](#contributing)')
    if (hasText(license)) toc.push('- [License](#license)')
    if (hasText(authorName)) toc.push('- [Author](#author)')
    parts.push(toc.join('\n'))
  }

  if (hasText(aim)) parts.push('\n' + section('Aim', aim))
  if (hasText(description)) parts.push('\n' + section('Description', description))
  if (hasText(problemStatement)) parts.push('\n' + section('Problem Statement', problemStatement))
  if (hasText(targetAudience)) parts.push('\n' + section('Target Audience', targetAudience))

  if (hasText(featuresDetail)) {
    parts.push('\n' + section('Features', featuresDetail))
  } else {
    const features = data.features.filter((f) => hasText(f.text))
    if (features.length > 0) {
      parts.push('\n## Features\n')
      parts.push(features.map((f) => `- ${asText(f.text).trim()}`).join('\n'))
    }
  }

  if (hasText(demoUrl) || hasText(screenshotUrl)) {
    parts.push('\n## Demo\n')
    if (hasText(demoUrl)) parts.push(`[Live Demo](${demoUrl.trim()})`)
    if (hasText(screenshotUrl)) parts.push(`\n![Screenshot](${screenshotUrl.trim()})`)
  }

  if (!hasTechStackSection) {
    const tech = data.techStack.filter((t) => hasText(t.name))
    if (tech.length > 0) {
      parts.push('\n## Tech Stack\n')
      parts.push('| Technology | Role |')
      parts.push('|------------|------|')
      parts.push(tech.map((t) => `| ${asText(t.name).trim()} | Core dependency |`).join('\n'))
    }
  }

  for (const s of additionalSections) {
    parts.push('\n' + section(s.title, s.content))
  }

  if (hasText(architecture)) parts.push('\n' + section('Architecture', architecture))

  if (hasText(prerequisites) || hasText(installation) || hasText(envVars)) {
    parts.push('\n## Getting Started\n')
    if (hasText(prerequisites)) parts.push('### Prerequisites\n\n' + prerequisites.trim())
    if (hasText(installation)) parts.push('\n### Installation\n\n' + codeBlock(installation))
    if (hasText(envVars)) {
      parts.push('\n### Environment\n\nCreate a `.env` file:\n\n' + codeBlock(envVars, 'env'))
    }
  }

  if (hasText(usage)) {
    parts.push('\n' + section('Usage', formatUsage(usage)))
  }

  if (hasText(testing)) parts.push('\n' + section('Testing', testing))
  if (hasText(deployment)) parts.push('\n' + section('Deployment', deployment))

  if (hasText(projectStructure)) {
    parts.push('\n' + section('Project Structure', '```text\n' + projectStructure.trim() + '\n```'))
  }

  if (hasText(contributing)) parts.push('\n' + section('Contributing', contributing))

  if (hasText(license)) {
    parts.push('\n' + section('License', `This project is licensed under the **${license.trim()}** License. See the [LICENSE](LICENSE) file for full details.`))
  }

  if (hasText(authorName)) {
    parts.push('\n## Author\n')
    let author = `**${authorName.trim()}**`
    if (hasText(authorEmail)) {
      author += ` — [${authorEmail.trim()}](mailto:${authorEmail.trim()})`
    }
    parts.push(author)

    const links = data.socialLinks.filter((s) => hasText(s.platform) && hasText(s.url))
    if (links.length > 0) {
      parts.push('\n' + links.map((s) => `- [${asText(s.platform).trim()}](${asText(s.url).trim()})`).join('\n'))
    }
  }

  return parts.join('\n').trim() + '\n'
}
