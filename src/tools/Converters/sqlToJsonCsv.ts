import Papa from 'papaparse'

type SqlPrimitive = string | number | boolean | null
type SqlRow = Record<string, SqlPrimitive>

interface ParsedInsert {
  table: string
  columns: string[]
  rows: SqlPrimitive[][]
  warning?: string
}

export interface SqlRowsResult {
  rows: SqlRow[]
  tableNames: string[]
  warnings: string[]
  error?: string
}

function stripLeadingSqlComments(statement: string): string {
  let text = statement
  let changed = true

  while (changed) {
    changed = false
    const before = text
    text = text.replace(/^\s*--[^\n\r]*(\r?\n|$)/, '')
    text = text.replace(/^\s*\/\*[\s\S]*?\*\//, '')
    if (text !== before) changed = true
  }

  return text.trim()
}

function splitSqlStatements(input: string): string[] {
  const statements: string[] = []
  let current = ''
  let inSingle = false
  let inDouble = false
  let inBacktick = false

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    const prev = i > 0 ? input[i - 1] : ''

    if (ch === "'" && !inDouble && !inBacktick && prev !== '\\') {
      inSingle = !inSingle
    } else if (ch === '"' && !inSingle && !inBacktick && prev !== '\\') {
      inDouble = !inDouble
    } else if (ch === '`' && !inSingle && !inDouble) {
      inBacktick = !inBacktick
    }

    if (ch === ';' && !inSingle && !inDouble && !inBacktick) {
      if (current.trim()) statements.push(current.trim())
      current = ''
      continue
    }

    current += ch
  }

  if (current.trim()) statements.push(current.trim())
  return statements
}

function normalizeIdentifier(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith('`') && trimmed.endsWith('`')) return trimmed.slice(1, -1)
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1)
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return trimmed.slice(1, -1)
  return trimmed
}

function splitTopLevelComma(input: string): string[] {
  const parts: string[] = []
  let current = ''
  let inSingle = false
  let inDouble = false
  let inBacktick = false
  let depth = 0

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    const prev = i > 0 ? input[i - 1] : ''

    if (ch === "'" && !inDouble && !inBacktick && prev !== '\\') {
      inSingle = !inSingle
    } else if (ch === '"' && !inSingle && !inBacktick && prev !== '\\') {
      inDouble = !inDouble
    } else if (ch === '`' && !inSingle && !inDouble) {
      inBacktick = !inBacktick
    } else if (!inSingle && !inDouble && !inBacktick) {
      if (ch === '(') depth++
      if (ch === ')' && depth > 0) depth--
    }

    if (ch === ',' && !inSingle && !inDouble && !inBacktick && depth === 0) {
      parts.push(current.trim())
      current = ''
      continue
    }

    current += ch
  }

  if (current.trim()) parts.push(current.trim())
  return parts
}

function parseSqlValue(raw: string): SqlPrimitive {
  const token = raw.trim()
  if (!token) return null

  if (/^null$/i.test(token)) return null
  if (/^true$/i.test(token)) return true
  if (/^false$/i.test(token)) return false
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(token)) return Number(token)

  if (
    (token.startsWith("'") && token.endsWith("'")) ||
    (token.startsWith('"') && token.endsWith('"'))
  ) {
    const body = token.slice(1, -1)
    return body
      .replace(/''/g, "'")
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
  }

  return token
}

function parseValuesTuples(input: string): { rows: SqlPrimitive[][]; warning?: string } {
  const rows: SqlPrimitive[][] = []
  const text = input.trim()
  let i = 0

  const skipDelimiters = () => {
    while (i < text.length && (text[i] === ',' || /\s/.test(text[i]))) i++
  }

  while (i < text.length) {
    skipDelimiters()
    if (i >= text.length) break
    if (text[i] !== '(') {
      const tail = text.slice(i).trim()
      if (tail) {
        return { rows, warning: `Ignored trailing SQL after VALUES: ${tail.slice(0, 80)}` }
      }
      break
    }

    const start = i
    i++
    let inSingle = false
    let inDouble = false
    let inBacktick = false
    let depth = 1

    while (i < text.length && depth > 0) {
      const ch = text[i]
      const prev = i > start ? text[i - 1] : ''

      if (ch === "'" && !inDouble && !inBacktick && prev !== '\\') {
        inSingle = !inSingle
      } else if (ch === '"' && !inSingle && !inBacktick && prev !== '\\') {
        inDouble = !inDouble
      } else if (ch === '`' && !inSingle && !inDouble) {
        inBacktick = !inBacktick
      } else if (!inSingle && !inDouble && !inBacktick) {
        if (ch === '(') depth++
        if (ch === ')') depth--
      }

      i++
    }

    if (depth !== 0) throw new Error('Unclosed tuple in VALUES clause')

    const tupleBody = text.slice(start + 1, i - 1)
    const values = splitTopLevelComma(tupleBody).map(parseSqlValue)
    rows.push(values)
  }

  return { rows }
}

function parseInsertStatement(statement: string): ParsedInsert {
  const cleaned = stripLeadingSqlComments(statement).replace(/;$/, '')
  const match = cleaned.match(/^\s*insert(?:\s+ignore)?\s+into\s+([\s\S]+?)\s+values\s+([\s\S]+)$/i)
  if (!match) throw new Error('Only INSERT INTO ... VALUES ... statements are supported')

  const leftPart = match[1].trim()
  const rightPart = match[2].trim()

  const openIdx = leftPart.indexOf('(')
  let table = leftPart
  let columns: string[] = []

  if (openIdx >= 0) {
    const closeIdx = leftPart.lastIndexOf(')')
    if (closeIdx <= openIdx) throw new Error('Invalid column list in INSERT statement')
    table = leftPart.slice(0, openIdx).trim()
    const columnBlock = leftPart.slice(openIdx + 1, closeIdx).trim()
    columns = splitTopLevelComma(columnBlock).map(normalizeIdentifier).filter(Boolean)
  }

  const normalizedTable = table
    .split('.')
    .map((part) => normalizeIdentifier(part))
    .join('.')

  const parsedRows = parseValuesTuples(rightPart)
  if (parsedRows.rows.length === 0) throw new Error('No row values found in INSERT statement')

  if (columns.length === 0) {
    const maxLen = Math.max(...parsedRows.rows.map((r) => r.length))
    columns = Array.from({ length: maxLen }, (_, idx) => `column_${idx + 1}`)
  }

  return {
    table: normalizedTable,
    columns,
    rows: parsedRows.rows,
    warning: parsedRows.warning,
  }
}

function rowsFromInsert(insert: ParsedInsert): SqlRow[] {
  const maxLen = Math.max(insert.columns.length, ...insert.rows.map((r) => r.length))
  const columns = [...insert.columns]
  while (columns.length < maxLen) {
    columns.push(`column_${columns.length + 1}`)
  }

  return insert.rows.map((values) => {
    const row: SqlRow = {}
    for (let idx = 0; idx < columns.length; idx++) {
      row[columns[idx]] = idx < values.length ? values[idx] : null
    }
    return row
  })
}

export function sqlToRows(input: string): SqlRowsResult {
  const statements = splitSqlStatements(input)
  if (statements.length === 0) {
    return { rows: [], tableNames: [], warnings: [], error: 'Input is empty' }
  }

  const warnings: string[] = []
  const records: Array<{ table: string; row: SqlRow }> = []
  let skipped = 0

  for (const statement of statements) {
    const normalized = stripLeadingSqlComments(statement)
    if (!/^\s*insert(?:\s+ignore)?\s+into\s+/i.test(normalized)) {
      skipped++
      continue
    }

    try {
      const parsed = parseInsertStatement(normalized)
      if (parsed.warning) warnings.push(parsed.warning)

      const rows = rowsFromInsert(parsed)
      rows.forEach((row) => records.push({ table: parsed.table, row }))
    } catch (err) {
      warnings.push(`Skipped invalid INSERT statement: ${String(err)}`)
    }
  }

  if (skipped > 0) warnings.push(`Skipped ${skipped} non-INSERT statement(s).`)
  if (records.length === 0) {
    return {
      rows: [],
      tableNames: [],
      warnings,
      error: 'No supported INSERT statements found. Use INSERT INTO ... VALUES ... format.',
    }
  }

  const tableNames = Array.from(new Set(records.map((r) => r.table)))
  const rows =
    tableNames.length > 1
      ? records.map((r) => ({ __table: r.table, ...r.row }))
      : records.map((r) => r.row)

  if (tableNames.length > 1) {
    warnings.push('Multiple tables detected. Added "__table" column to output.')
  }

  return { rows, tableNames, warnings }
}

export function rowsToJSON(rows: SqlRow[]): string {
  return JSON.stringify(rows, null, 2)
}

export function rowsToCSV(rows: SqlRow[]): string {
  return Papa.unparse(rows)
}
