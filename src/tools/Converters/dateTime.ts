export interface ParsedDateTime {
  date: Date
  inputType: string
}

const NAIVE_DATE_TIME_RE =
  /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/

function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime())
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date())
    return true
  } catch {
    return false
  }
}

export function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const values: Record<string, number> = {}
  for (const p of parts) {
    if (p.type === 'literal') continue
    if (p.type === 'year' || p.type === 'month' || p.type === 'day' || p.type === 'hour' || p.type === 'minute' || p.type === 'second') {
      values[p.type] = Number(p.value)
    }
  }

  const asUtc = Date.UTC(
    values.year,
    (values.month ?? 1) - 1,
    values.day ?? 1,
    values.hour ?? 0,
    values.minute ?? 0,
    values.second ?? 0
  )

  return Math.round((asUtc - date.getTime()) / 60000)
}

export function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `${sign}${hh}:${mm}`
}

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
  timeZone: string
): Date {
  const localUtcMs = Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
  let guess = localUtcMs

  for (let i = 0; i < 6; i++) {
    const offset = getTimeZoneOffsetMinutes(new Date(guess), timeZone)
    const next = localUtcMs - offset * 60000
    if (Math.abs(next - guess) < 1) {
      guess = next
      break
    }
    guess = next
  }

  return new Date(guess)
}

export function formatInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const values: Record<string, string> = {}
  for (const p of parts) {
    if (p.type === 'literal') continue
    values[p.type] = p.value
  }

  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`
}

export function parseDateTimeInput(input: string, sourceTimeZone: string): { parsed?: ParsedDateTime; error?: string } {
  const text = input.trim()
  if (!text) return { error: 'Input is empty.' }

  if (/^-?\d+(\.\d+)?$/.test(text)) {
    const raw = Number(text)
    if (Number.isFinite(raw)) {
      const ms = Math.abs(raw) < 1e11 ? Math.round(raw * 1000) : Math.round(raw)
      const date = new Date(ms)
      if (isValidDate(date)) return { parsed: { date, inputType: Math.abs(raw) < 1e11 ? 'unix-seconds' : 'unix-milliseconds' } }
    }
  }

  const hasExplicitTimeZone = /[zZ]|[+\-]\d{2}:\d{2}$/.test(text)
  if (hasExplicitTimeZone) {
    const date = new Date(text)
    if (isValidDate(date)) return { parsed: { date, inputType: 'iso-with-timezone' } }
  }

  const naive = text.match(NAIVE_DATE_TIME_RE)
  if (naive) {
    if (!isValidTimeZone(sourceTimeZone)) {
      return { error: `Invalid source timezone: ${sourceTimeZone}` }
    }

    const year = Number(naive[1])
    const month = Number(naive[2])
    const day = Number(naive[3])
    const hour = Number(naive[4] ?? '0')
    const minute = Number(naive[5] ?? '0')
    const second = Number(naive[6] ?? '0')
    const ms = Number((naive[7] ?? '0').padEnd(3, '0'))

    const date = zonedDateTimeToUtc(year, month, day, hour, minute, second, ms, sourceTimeZone)
    if (!isValidDate(date)) return { error: 'Could not parse date/time.' }
    return { parsed: { date, inputType: `naive-in-${sourceTimeZone}` } }
  }

  const fallback = new Date(text)
  if (isValidDate(fallback)) return { parsed: { date: fallback, inputType: 'runtime-date-parse' } }

  return { error: 'Unsupported date/time format.' }
}
