const STOPWORDS_EN = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'not',
  'that', 'this', 'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i',
  'my', 'your', 'our', 'their', 'his', 'her', 'if', 'then', 'so', 'up',
  'out', 'no', 'yes',
])

const STOPWORDS_HU = new Set([
  'a', 'az', 'és', 'de', 'hogy', 'nem', 'van', 'egy', 'ez', 'az', 'is',
  'el', 'meg', 'ki', 'be', 'le', 'fel', 'már', 'még', 'csak', 'ha',
  'mint', 'én', 'te', 'ő', 'mi', 'ti', 'ők', 'ezt', 'azt', 'erre', 'arra',
  'itt', 'ott', 'sem', 'vagy', 'mert', 'amikor', 'ahol', 'aki', 'ami',
  'minden', 'mindig', 'volt', 'lett', 'lesz', 'len',
])

export interface WordFreqOptions {
  language: 'en' | 'hu' | 'none'
  caseFold: boolean
  minLength: number
}

export interface WordFreqResult {
  word: string
  count: number
  firstLine: number
}

export function computeWordFreq(text: string, opts: WordFreqOptions): WordFreqResult[] {
  const stopwords = opts.language === 'en' ? STOPWORDS_EN : opts.language === 'hu' ? STOPWORDS_HU : new Set<string>()
  const lines = text.split('\n')
  const freq = new Map<string, { count: number; firstLine: number }>()

  lines.forEach((line, lineIdx) => {
    const words = line.split(/[\s.,;:!?'"()\[\]{}<>\/\\|@#$%^&*+=`~\-–—]+/).filter(Boolean)
    words.forEach((rawWord) => {
      const word = opts.caseFold ? rawWord.toLowerCase() : rawWord
      if (word.length < opts.minLength) return
      const clean = opts.caseFold ? word.toLowerCase() : word
      if (stopwords.has(clean.toLowerCase())) return
      if (freq.has(clean)) {
        freq.get(clean)!.count++
      } else {
        freq.set(clean, { count: 1, firstLine: lineIdx + 1 })
      }
    })
  })

  return Array.from(freq.entries())
    .map(([word, { count, firstLine }]) => ({ word, count, firstLine }))
    .sort((a, b) => b.count - a.count)
}
