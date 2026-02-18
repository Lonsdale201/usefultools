export interface QueryRow {
  id: string
  key: string
  value: string
}

export interface ParsedUrlInfo {
  href: string
  protocol: string
  origin: string
  host: string
  hostname: string
  port: string
  pathname: string
  hash: string
}

let queryRowId = 1

function nextRowId() {
  return String(queryRowId++)
}

export function parseAbsoluteUrl(input: string): { info?: ParsedUrlInfo; queryRows?: QueryRow[]; error?: string } {
  const raw = input.trim()
  if (!raw) return { error: 'URL is empty.' }
  try {
    const url = new URL(raw)
    return {
      info: {
        href: url.toString(),
        protocol: url.protocol,
        origin: url.origin,
        host: url.host,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        hash: url.hash,
      },
      queryRows: Array.from(url.searchParams.entries()).map(([key, value]) => ({
        id: nextRowId(),
        key,
        value,
      })),
    }
  } catch {
    return { error: 'Invalid absolute URL.' }
  }
}

export function buildUrlWithQueryRows(baseUrl: string, rows: QueryRow[]): { url?: string; error?: string } {
  try {
    const url = new URL(baseUrl.trim())
    url.search = ''
    for (const row of rows) {
      const key = row.key.trim()
      if (!key) continue
      url.searchParams.append(key, row.value)
    }
    return { url: url.toString() }
  } catch {
    return { error: 'Invalid absolute URL.' }
  }
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'] as const

export type UtmKey = (typeof UTM_KEYS)[number]

export function applyUtmParams(baseUrl: string, data: Partial<Record<UtmKey, string>>): { url?: string; error?: string } {
  try {
    const url = new URL(baseUrl.trim())
    for (const key of UTM_KEYS) {
      const value = (data[key] ?? '').trim()
      if (value) url.searchParams.set(key, value)
    }
    return { url: url.toString() }
  } catch {
    return { error: 'Invalid absolute URL.' }
  }
}

