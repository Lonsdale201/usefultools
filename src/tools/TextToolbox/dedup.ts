export interface DupResult {
  text: string
  lines: number[]
}

export function findDuplicateSentences(text: string, caseInsensitive = true): DupResult[] {
  // Split into sentences
  const raw = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
  const map = new Map<string, number[]>()

  raw.forEach((sentence, idx) => {
    const key = caseInsensitive ? sentence.toLowerCase() : sentence
    const existing = map.get(key)
    if (existing) existing.push(idx + 1)
    else map.set(key, [idx + 1])
  })

  return Array.from(map.entries())
    .filter(([, lines]) => lines.length > 1)
    .map(([key]) => {
      const original = caseInsensitive
        ? raw.find((s) => s.toLowerCase() === key) ?? key
        : key
      return { text: original, lines: map.get(key)! }
    })
    .sort((a, b) => b.lines.length - a.lines.length)
}

export function findDuplicateParagraphs(text: string, caseInsensitive = true): DupResult[] {
  const raw = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const map = new Map<string, number[]>()

  raw.forEach((para, idx) => {
    const key = caseInsensitive ? para.toLowerCase() : para
    const existing = map.get(key)
    if (existing) existing.push(idx + 1)
    else map.set(key, [idx + 1])
  })

  return Array.from(map.entries())
    .filter(([, lines]) => lines.length > 1)
    .map(([key]) => {
      const original = caseInsensitive
        ? raw.find((p) => p.toLowerCase() === key) ?? key
        : key
      return { text: original, lines: map.get(key)! }
    })
    .sort((a, b) => b.lines.length - a.lines.length)
}
