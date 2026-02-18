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
