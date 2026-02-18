import Papa from 'papaparse'

export type RowStatus = 'added' | 'removed' | 'changed' | 'unchanged'

export interface DiffRow {
  status: RowStatus
  key: string
  original?: Record<string, string>
  modified?: Record<string, string>
  changedFields?: string[]
}

export function diffCSV(csvA: string, csvB: string, keyColumn: string): DiffRow[] {
  const parseCSV = (csv: string) => {
    const r = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true })
    return r.data
  }

  const rowsA = parseCSV(csvA)
  const rowsB = parseCSV(csvB)

  const mapA = new Map(rowsA.map((r) => [r[keyColumn] ?? '', r]))
  const mapB = new Map(rowsB.map((r) => [r[keyColumn] ?? '', r]))

  const results: DiffRow[] = []
  const allKeys = new Set([...mapA.keys(), ...mapB.keys()])

  for (const key of allKeys) {
    const rowA = mapA.get(key)
    const rowB = mapB.get(key)

    if (rowA && !rowB) {
      results.push({ status: 'removed', key, original: rowA })
    } else if (!rowA && rowB) {
      results.push({ status: 'added', key, modified: rowB })
    } else if (rowA && rowB) {
      const allFields = new Set([...Object.keys(rowA), ...Object.keys(rowB)])
      const changedFields = [...allFields].filter((f) => rowA[f] !== rowB[f])
      if (changedFields.length > 0) {
        results.push({ status: 'changed', key, original: rowA, modified: rowB, changedFields })
      } else {
        results.push({ status: 'unchanged', key, original: rowA, modified: rowB, changedFields: [] })
      }
    }
  }

  return results.sort((a, b) => {
    const order: Record<RowStatus, number> = { removed: 0, changed: 1, added: 2, unchanged: 3 }
    return order[a.status] - order[b.status]
  })
}
