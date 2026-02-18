export interface DedupOptions {
  caseInsensitive: boolean
  trim: boolean
  keepFirst: boolean
}

export interface DedupResult {
  unique: string[]
  removedCount: number
  totalCount: number
}

export function deduplicateList(text: string, opts: DedupOptions): DedupResult {
  const lines = text.split('\n')
  const seen = new Set<string>()
  const unique: string[] = []

  const process = (line: string) => {
    let key = line
    if (opts.trim) key = key.trim()
    if (opts.caseInsensitive) key = key.toLowerCase()
    return key
  }

  if (opts.keepFirst) {
    for (const line of lines) {
      const key = process(line)
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(opts.trim ? line.trim() : line)
      }
    }
  } else {
    // Keep last occurrence
    const reversed = [...lines].reverse()
    const seenReversed = new Set<string>()
    const uniqueReversed: string[] = []
    for (const line of reversed) {
      const key = process(line)
      if (!seenReversed.has(key)) {
        seenReversed.add(key)
        uniqueReversed.push(opts.trim ? line.trim() : line)
      }
    }
    unique.push(...uniqueReversed.reverse())
  }

  return {
    unique,
    removedCount: lines.length - unique.length,
    totalCount: lines.length,
  }
}
