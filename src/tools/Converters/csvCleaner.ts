import Papa from 'papaparse'

export type Delimiter = ',' | ';' | '\t' | '|' | 'auto'

export interface CleanOptions {
  delimiter: Delimiter
  trimWhitespace: boolean
  fixQuotes: boolean
  outputDelimiter: ',' | ';' | '\t' | '|'
}

export interface CleanResult {
  csv: string
  rowCount: number
  colCount: number
  detectedDelimiter: string
  warnings: string[]
}

function detectDelimiter(input: string): string {
  const sample = input.split('\n').slice(0, 5).join('\n')
  const counts = {
    ',': (sample.match(/,/g) ?? []).length,
    ';': (sample.match(/;/g) ?? []).length,
    '\t': (sample.match(/\t/g) ?? []).length,
    '|': (sample.match(/\|/g) ?? []).length,
  }
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0]
}

export function cleanCSV(input: string, opts: CleanOptions): CleanResult {
  const warnings: string[] = []
  const delim = opts.delimiter === 'auto' ? detectDelimiter(input) : opts.delimiter
  const detected = opts.delimiter === 'auto' ? delim : opts.delimiter

  const parsed = Papa.parse(input, {
    delimiter: delim,
    skipEmptyLines: true,
    quoteChar: '"',
  })

  if (parsed.errors.length > 0) {
    parsed.errors.forEach((e) => warnings.push(`Row ${e.row}: ${e.message}`))
  }

  const data = parsed.data as string[][]
  const cleaned = data.map((row) =>
    row.map((cell) => {
      let v = String(cell)
      if (opts.trimWhitespace) v = v.trim()
      return v
    })
  )

  const csv = Papa.unparse(cleaned, { delimiter: opts.outputDelimiter })

  return {
    csv,
    rowCount: cleaned.length,
    colCount: cleaned[0]?.length ?? 0,
    detectedDelimiter: detected === '\t' ? 'TAB' : detected,
    warnings,
  }
}
