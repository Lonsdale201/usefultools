export interface NgramResult {
  ngram: string
  count: number
}

export function computeNgrams(text: string, n: 2 | 3, topN = 50): NgramResult[] {
  const words = text
    .toLowerCase()
    .split(/[\s.,;:!?'"()\[\]{}<>\/\\|@#$%^&*+=`~\-–—]+/)
    .filter((w) => w.length > 1)

  const freq = new Map<string, number>()
  for (let i = 0; i <= words.length - n; i++) {
    const gram = words.slice(i, i + n).join(' ')
    freq.set(gram, (freq.get(gram) ?? 0) + 1)
  }

  return Array.from(freq.entries())
    .map(([ngram, count]) => ({ ngram, count }))
    .filter(({ count }) => count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
}
