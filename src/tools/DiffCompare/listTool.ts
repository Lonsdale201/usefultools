export interface ListTransformOptions {
  trim: boolean
  lowercase: boolean
  removeEmpty: boolean
}

export type SortMode = 'alpha' | 'numeric' | 'length'
export type SortOrder = 'asc' | 'desc'

export interface DuplicateCountRow {
  value: string
  count: number
}

export interface ListDiffResult {
  aMinusB: string[]
  bMinusA: string[]
  intersection: string[]
}

function normalizeLine(line: string, opts: ListTransformOptions): string {
  let out = line
  if (opts.trim) out = out.trim()
  if (opts.lowercase) out = out.toLowerCase()
  return out
}

export function parseList(input: string, opts: ListTransformOptions): string[] {
  const lines = input.replace(/\r/g, '').split('\n').map((line) => normalizeLine(line, opts))
  return opts.removeEmpty ? lines.filter((line) => line.length > 0) : lines
}

export function uniqueLines(lines: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const line of lines) {
    if (seen.has(line)) continue
    seen.add(line)
    out.push(line)
  }
  return out
}

export function countDuplicates(lines: string[]): DuplicateCountRow[] {
  const counts = new Map<string, number>()
  for (const line of lines) {
    counts.set(line, (counts.get(line) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

export function sortLines(lines: string[], mode: SortMode, order: SortOrder): string[] {
  const copy = [...lines]

  copy.sort((a, b) => {
    let diff = 0
    if (mode === 'alpha') {
      diff = a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    } else if (mode === 'numeric') {
      const an = Number(a)
      const bn = Number(b)
      const aNaN = Number.isNaN(an)
      const bNaN = Number.isNaN(bn)
      if (aNaN && bNaN) diff = a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
      else if (aNaN) diff = 1
      else if (bNaN) diff = -1
      else diff = an - bn
    } else {
      diff = a.length - b.length || a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    }
    return order === 'asc' ? diff : -diff
  })

  return copy
}

export function diffLists(listA: string[], listB: string[]): ListDiffResult {
  const aUnique = uniqueLines(listA)
  const bUnique = uniqueLines(listB)

  const setA = new Set(aUnique)
  const setB = new Set(bUnique)

  const aMinusB = aUnique.filter((item) => !setB.has(item))
  const bMinusA = bUnique.filter((item) => !setA.has(item))
  const intersection = aUnique.filter((item) => setB.has(item))

  return { aMinusB, bMinusA, intersection }
}
