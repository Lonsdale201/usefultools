import Papa from 'papaparse'

function flattenObject(obj: unknown, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  if (obj === null || obj === undefined) {
    result[prefix] = ''
    return result
  }
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    result[prefix] = String(obj)
    return result
  }
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const newKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey))
    } else {
      result[newKey] = value === null || value === undefined ? '' : String(value)
    }
  }
  return result
}

export function jsonToCSV(input: string): { result: string; error?: string } {
  try {
    const parsed = JSON.parse(input)
    const arr = Array.isArray(parsed) ? parsed : [parsed]
    const flat = arr.map((item) => flattenObject(item))
    return { result: Papa.unparse(flat) }
  } catch (e) {
    return { result: '', error: String(e) }
  }
}

export function csvToJSON(input: string): { result: string; error?: string } {
  try {
    const parsed = Papa.parse(input, { header: true, skipEmptyLines: true })
    if (parsed.errors.length > 0) {
      const msg = parsed.errors.map((e) => e.message).join('; ')
      // Non-fatal – still return data with warning
      return { result: JSON.stringify(parsed.data, null, 2), error: `Figyelmeztetés: ${msg}` }
    }
    return { result: JSON.stringify(parsed.data, null, 2) }
  } catch (e) {
    return { result: '', error: String(e) }
  }
}
