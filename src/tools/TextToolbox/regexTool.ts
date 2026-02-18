export interface RegexPattern {
  id: string
  find: string
  replace: string
  flags: string
}

export interface RegexMatch {
  line: number
  original: string
  replaced: string
}

export interface RegexExtractMatch {
  index: number
  match: string
  groups: string[]
  namedGroups: Record<string, string>
}

function normalizeFlags(flags: string): string {
  const allowed = new Set(['g', 'i', 'm', 's', 'u', 'y', 'd'])
  const uniq = new Set<string>()
  for (const ch of flags) {
    if (allowed.has(ch)) uniq.add(ch)
  }
  return Array.from(uniq).join('')
}

export function applyPatterns(text: string, patterns: RegexPattern[]): {
  result: string
  matches: RegexMatch[]
  errors: string[]
} {
  const errors: string[] = []
  let result = text

  for (const pat of patterns) {
    if (!pat.find) continue
    try {
      const re = new RegExp(pat.find, pat.flags || 'g')
      result = result.replace(re, pat.replace)
    } catch (e) {
      errors.push(`Pattern "${pat.find}": ${String(e)}`)
    }
  }

  // Compute per-line changes for preview
  const origLines = text.split('\n')
  const newLines = result.split('\n')
  const matches: RegexMatch[] = []

  origLines.forEach((line, i) => {
    if (line !== (newLines[i] ?? '')) {
      matches.push({ line: i + 1, original: line, replaced: newLines[i] ?? '' })
    }
  })

  return { result, matches, errors }
}

export function extractMatches(
  text: string,
  pattern: string,
  flags: string
): { matches: RegexExtractMatch[]; error?: string; normalizedFlags: string } {
  if (!pattern.trim()) {
    return { matches: [], error: 'Regex pattern is required.', normalizedFlags: normalizeFlags(flags) }
  }

  const normalizedFlags = normalizeFlags(flags || 'g')
  let re: RegExp

  try {
    re = new RegExp(pattern, normalizedFlags || 'g')
  } catch (e) {
    return { matches: [], error: String(e), normalizedFlags }
  }

  const matches: RegexExtractMatch[] = []

  const collect = (m: RegExpExecArray) => {
    const groups = m.slice(1).map((g) => (g ?? ''))
    const namedGroups: Record<string, string> = {}
    if (m.groups) {
      for (const [k, v] of Object.entries(m.groups)) {
        namedGroups[k] = v ?? ''
      }
    }
    matches.push({
      index: m.index,
      match: m[0] ?? '',
      groups,
      namedGroups,
    })
  }

  if (re.global) {
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      collect(m)
      if (m[0] === '') re.lastIndex += 1
    }
  } else {
    const m = re.exec(text)
    if (m) collect(m)
  }

  return { matches, normalizedFlags }
}
