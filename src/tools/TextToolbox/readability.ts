export interface ReadabilityResult {
  charCount: number
  wordCount: number
  sentenceCount: number
  paragraphCount: number
  avgWordsPerSentence: number
  avgCharsPerWord: number
  lexicalDiversity: number
  longestSentence: string
  longestSentenceWords: number
}

export function analyzeReadability(text: string): ReadabilityResult {
  const trimmed = text.trim()
  if (!trimmed) {
    return {
      charCount: 0, wordCount: 0, sentenceCount: 0, paragraphCount: 0,
      avgWordsPerSentence: 0, avgCharsPerWord: 0, lexicalDiversity: 0,
      longestSentence: '', longestSentenceWords: 0,
    }
  }

  const words = trimmed.split(/\s+/).filter(Boolean)
  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const paragraphs = trimmed.split(/\n\s*\n/).filter(Boolean)

  const uniqueWords = new Set(words.map((w) => w.toLowerCase()))
  const totalChars = words.reduce((sum, w) => sum + w.replace(/[^a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ]/g, '').length, 0)

  const sentenceWordCounts = sentences.map((s) => s.split(/\s+/).filter(Boolean).length)
  const maxIdx = sentenceWordCounts.indexOf(Math.max(...sentenceWordCounts))

  return {
    charCount: trimmed.replace(/\s/g, '').length,
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    avgWordsPerSentence: sentences.length > 0 ? Math.round((words.length / sentences.length) * 10) / 10 : 0,
    avgCharsPerWord: words.length > 0 ? Math.round((totalChars / words.length) * 10) / 10 : 0,
    lexicalDiversity: words.length > 0 ? Math.round((uniqueWords.size / words.length) * 1000) / 10 : 0,
    longestSentence: sentences[maxIdx] ?? '',
    longestSentenceWords: Math.max(0, ...sentenceWordCounts),
  }
}
