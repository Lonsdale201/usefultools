import * as Diff from 'diff'

export type DiffMode = 'lines' | 'words' | 'chars'

export interface DiffChunk {
  value: string
  added?: boolean
  removed?: boolean
}

export function computeDiff(original: string, modified: string, mode: DiffMode): DiffChunk[] {
  switch (mode) {
    case 'lines':
      return Diff.diffLines(original, modified)
    case 'words':
      return Diff.diffWords(original, modified)
    case 'chars':
      return Diff.diffChars(original, modified)
    default:
      return Diff.diffLines(original, modified)
  }
}

export function diffStats(chunks: DiffChunk[]) {
  const added = chunks.filter((c) => c.added).reduce((s, c) => s + c.value.length, 0)
  const removed = chunks.filter((c) => c.removed).reduce((s, c) => s + c.value.length, 0)
  const unchanged = chunks.filter((c) => !c.added && !c.removed).reduce((s, c) => s + c.value.length, 0)
  return { added, removed, unchanged }
}
