/** Safe string coercion for README fields (handles arrays/objects from API). */
export function asText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : String(item)))
      .join('\n')
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `- **${k}**: ${String(v)}`)
      .join('\n')
  }
  return String(value)
}

export function hasText(value: unknown): boolean {
  return asText(value).trim().length > 0
}
