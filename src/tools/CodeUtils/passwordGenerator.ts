import { DICEWARE_WORDS, DICEWARE_WORD_COUNT } from './dicewareWordlist'

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const DEFAULT_SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>/?'
const AMBIGUOUS = 'O0Il1|'

export interface PasswordOptions {
  length: number
  includeLower: boolean
  includeUpper: boolean
  includeDigits: boolean
  includeSymbols: boolean
  excludeAmbiguous: boolean
  minLower: number
  minUpper: number
  minDigits: number
  minSymbols: number
  symbols: string
}

export interface PassphraseOptions {
  wordCount: number
  separator: string
  capitalizeWords: boolean
  noRepeatedWords: boolean
  excludeSimilarWords: boolean
  appendNumberDigits: number
  appendSymbol: boolean
  symbolSet: string
}

export interface PasswordBuild {
  value: string
  entropyBits: number
}

export interface PassphraseBuild {
  value: string
  entropyBits: number
  diceRolls: string[]
}

function ensureCrypto() {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Web Crypto API unavailable in this browser.')
  }
}

function secureRandomInt(max: number): number {
  if (!Number.isFinite(max) || max <= 0) {
    throw new Error('Invalid random range.')
  }
  ensureCrypto()
  const uintMax = 0x100000000
  const threshold = Math.floor(uintMax / max) * max
  const bytes = new Uint32Array(1)
  while (true) {
    globalThis.crypto.getRandomValues(bytes)
    const n = bytes[0]
    if (n < threshold) return n % max
  }
}

function pickOne(chars: string): string {
  return chars[secureRandomInt(chars.length)]
}

function shuffleChars(chars: string[]): string[] {
  const arr = [...chars]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1)
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

function removeAmbiguous(chars: string): string {
  return chars
    .split('')
    .filter((c) => !AMBIGUOUS.includes(c))
    .join('')
}

function uniqueChars(chars: string): string {
  return Array.from(new Set(chars.split(''))).join('')
}

function sanitizeSymbolSet(symbols: string, excludeAmbiguous: boolean): string {
  const base = symbols.trim().length > 0 ? symbols : DEFAULT_SYMBOLS
  const cleaned = excludeAmbiguous ? removeAmbiguous(base) : base
  return uniqueChars(cleaned)
}

export function defaultPasswordOptions(): PasswordOptions {
  return {
    length: 20,
    includeLower: true,
    includeUpper: true,
    includeDigits: true,
    includeSymbols: true,
    excludeAmbiguous: true,
    minLower: 1,
    minUpper: 1,
    minDigits: 1,
    minSymbols: 1,
    symbols: DEFAULT_SYMBOLS,
  }
}

export function defaultPassphraseOptions(): PassphraseOptions {
  return {
    wordCount: 6,
    separator: '-',
    capitalizeWords: false,
    noRepeatedWords: false,
    excludeSimilarWords: false,
    appendNumberDigits: 0,
    appendSymbol: false,
    symbolSet: '!@#$%^&*',
  }
}

export function passwordEntropyBits(length: number, poolSize: number): number {
  if (length <= 0 || poolSize <= 1) return 0
  return length * Math.log2(poolSize)
}

export function passphraseEntropyBits(
  wordCount: number,
  appendNumberDigits: number,
  appendSymbolSetSize: number
): number {
  let bits = wordCount > 0 ? wordCount * Math.log2(DICEWARE_WORD_COUNT) : 0
  if (appendNumberDigits > 0) bits += appendNumberDigits * Math.log2(10)
  if (appendSymbolSetSize > 0) bits += Math.log2(appendSymbolSetSize)
  return bits
}

export function entropyLevel(bits: number): 'weak' | 'ok' | 'strong' | 'very-strong' {
  if (bits < 50) return 'weak'
  if (bits < 70) return 'ok'
  if (bits < 100) return 'strong'
  return 'very-strong'
}

interface CharacterPool {
  chars: string
  minCount: number
}

function buildCharacterPools(opts: PasswordOptions): CharacterPool[] {
  const pools: CharacterPool[] = []
  const lower = opts.excludeAmbiguous ? removeAmbiguous(LOWER) : LOWER
  const upper = opts.excludeAmbiguous ? removeAmbiguous(UPPER) : UPPER
  const digits = opts.excludeAmbiguous ? removeAmbiguous(DIGITS) : DIGITS
  const symbols = sanitizeSymbolSet(opts.symbols, opts.excludeAmbiguous)

  if (opts.includeLower) pools.push({ chars: lower, minCount: Math.max(0, opts.minLower) })
  if (opts.includeUpper) pools.push({ chars: upper, minCount: Math.max(0, opts.minUpper) })
  if (opts.includeDigits) pools.push({ chars: digits, minCount: Math.max(0, opts.minDigits) })
  if (opts.includeSymbols) pools.push({ chars: symbols, minCount: Math.max(0, opts.minSymbols) })

  if (pools.length === 0) {
    throw new Error('Select at least one character set.')
  }
  for (const pool of pools) {
    if (pool.chars.length === 0) {
      throw new Error('A selected character set became empty due to current filters.')
    }
  }
  return pools
}

export function generatePassword(opts: PasswordOptions): PasswordBuild {
  if (!Number.isInteger(opts.length) || opts.length < 4 || opts.length > 512) {
    throw new Error('Length must be an integer between 4 and 512.')
  }
  const pools = buildCharacterPools(opts)
  const totalMin = pools.reduce((sum, p) => sum + p.minCount, 0)
  if (totalMin > opts.length) {
    throw new Error('Minimum required characters exceed password length.')
  }

  const unionSet = uniqueChars(pools.map((p) => p.chars).join(''))
  const result: string[] = []

  for (const pool of pools) {
    for (let i = 0; i < pool.minCount; i++) {
      result.push(pickOne(pool.chars))
    }
  }

  while (result.length < opts.length) {
    result.push(pickOne(unionSet))
  }

  const finalValue = shuffleChars(result).join('')
  return {
    value: finalValue,
    entropyBits: passwordEntropyBits(opts.length, unionSet.length),
  }
}

function indexToDiceRoll(index: number): string {
  const digits = [0, 0, 0, 0]
  let n = index
  for (let i = 3; i >= 0; i--) {
    digits[i] = (n % 6) + 1
    n = Math.floor(n / 6)
  }
  return digits.join('')
}

function editDistanceAtMostOne(a: string, b: string): boolean {
  const al = a.length
  const bl = b.length
  if (Math.abs(al - bl) > 1) return false
  if (a === b) return true

  let i = 0
  let j = 0
  let diffs = 0
  while (i < al && j < bl) {
    if (a[i] === b[j]) {
      i++
      j++
      continue
    }
    diffs++
    if (diffs > 1) return false
    if (al > bl) i++
    else if (bl > al) j++
    else {
      i++
      j++
    }
  }
  return true
}

function areWordsSimilar(a: string, b: string): boolean {
  const na = a.toLowerCase()
  const nb = b.toLowerCase()
  if (na === nb) return true
  if (na.length >= 5 && nb.length >= 5 && na.slice(0, 4) === nb.slice(0, 4)) return true
  return editDistanceAtMostOne(na, nb)
}

function canUseWord(next: string, used: string[], opts: PassphraseOptions): boolean {
  if (opts.noRepeatedWords && used.includes(next)) return false
  if (opts.excludeSimilarWords && used.some((w) => areWordsSimilar(w, next))) return false
  return true
}

export function generatePassphrase(opts: PassphraseOptions): PassphraseBuild {
  if (!Number.isInteger(opts.wordCount) || opts.wordCount < 2 || opts.wordCount > 40) {
    throw new Error('Word count must be an integer between 2 and 40.')
  }
  if (!Number.isInteger(opts.appendNumberDigits) || opts.appendNumberDigits < 0 || opts.appendNumberDigits > 12) {
    throw new Error('Number suffix digits must be between 0 and 12.')
  }
  if (opts.noRepeatedWords && opts.wordCount > DICEWARE_WORD_COUNT) {
    throw new Error('Word count exceeds the available unique Diceware words.')
  }

  const words: string[] = []
  const usedWords: string[] = []
  const rolls: string[] = []
  const maxAttempts = Math.max(8000, opts.wordCount * 1000)
  let attempts = 0

  while (words.length < opts.wordCount) {
    attempts++
    if (attempts > maxAttempts) {
      throw new Error('Could not satisfy passphrase constraints. Try fewer words or disable strict filters.')
    }
    const index = secureRandomInt(DICEWARE_WORD_COUNT)
    const rawWord = DICEWARE_WORDS[index]
    if (!canUseWord(rawWord, usedWords, opts)) continue

    let word = rawWord
    if (opts.capitalizeWords) {
      word = word.charAt(0).toUpperCase() + word.slice(1)
    }
    usedWords.push(rawWord)
    words.push(word)
    rolls.push(indexToDiceRoll(index))
  }

  let suffix = ''
  if (opts.appendNumberDigits > 0) {
    for (let i = 0; i < opts.appendNumberDigits; i++) {
      suffix += pickOne(DIGITS)
    }
  }

  let symbolEntropySize = 0
  if (opts.appendSymbol) {
    const symbolSet = uniqueChars(opts.symbolSet.trim())
    if (symbolSet.length === 0) {
      throw new Error('Symbol set is empty.')
    }
    suffix += pickOne(symbolSet)
    symbolEntropySize = symbolSet.length
  }

  return {
    value: `${words.join(opts.separator)}${suffix}`,
    entropyBits: passphraseEntropyBits(opts.wordCount, opts.appendNumberDigits, symbolEntropySize),
    diceRolls: rolls,
  }
}

export { DICEWARE_WORD_COUNT }
