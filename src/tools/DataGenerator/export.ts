import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { downloadFile, downloadBlob } from '@/lib/downloadFile'

export function exportCSV(rows: Record<string, string>[], filename = 'data.csv') {
  const csv = Papa.unparse(rows)
  downloadFile(csv, filename, 'text/csv;charset=utf-8;')
}

export function exportJSON(rows: Record<string, string>[], filename = 'data.json') {
  downloadFile(JSON.stringify(rows, null, 2), filename, 'application/json')
}

export function exportXLSX(rows: Record<string, string>[], filename = 'data.xlsx') {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  downloadBlob(new Blob([buf], { type: 'application/octet-stream' }), filename)
}

export function exportSQL(rows: Record<string, string>[], tableName = 'table_name', filename = 'data.sql') {
  if (rows.length === 0) return
  const cols = Object.keys(rows[0])
  const lines = rows.map((row) => {
    const vals = cols.map((c) => {
      const v = row[c] ?? ''
      return `'${v.replace(/'/g, "''")}'`
    })
    return `INSERT INTO ${tableName} (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${vals.join(', ')});`
  })
  downloadFile(lines.join('\n'), filename, 'text/plain')
}
