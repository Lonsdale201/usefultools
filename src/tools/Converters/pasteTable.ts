import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { downloadFile, downloadBlob } from '@/lib/downloadFile'

export function parsePastedTable(input: string): string[][] {
  // Tab-separated (Excel/Sheets paste)
  return input
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => line.split('\t'))
}

export function pasteTableToCSV(rows: string[][], filename = 'table.csv') {
  const csv = Papa.unparse(rows)
  downloadFile(csv, filename, 'text/csv;charset=utf-8;')
}

export function pasteTableToXLSX(rows: string[][], filename = 'table.xlsx') {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  downloadBlob(new Blob([buf], { type: 'application/octet-stream' }), filename)
}
