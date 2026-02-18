import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { copyToClipboard } from '@/lib/downloadFile'
import { useI18n } from '@/lib/i18n'
import { prettifyJSON, minifyJSON, prettifyXML, prettifyHTML, minifyHTML } from './prettify'
import { escapeHTML, unescapeHTML, encodeURL, decodeURL } from './escape'
import { encodeBase64, decodeBase64 } from './base64'
import { hashText, type HashAlgorithm } from './hash'
import {
  DICEWARE_WORD_COUNT,
  defaultPassphraseOptions,
  defaultPasswordOptions,
  entropyLevel,
  generatePassphrase,
  generatePassword,
  type PassphraseOptions,
  type PasswordOptions,
} from './passwordGenerator'

export function CodeUtils() {
  const { t, lang } = useI18n()
  const passwordTabLabel = lang === 'hu' ? 'Jelszó Generátor' : 'Password Generator'

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('cu.title')}</h1>
        <p className="text-muted-foreground">{t('cu.subtitle')}</p>
      </div>
      <Tabs defaultValue="prettify">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="prettify">{t('cu.prettify')}</TabsTrigger>
          <TabsTrigger value="escape">{t('cu.escape')}</TabsTrigger>
          <TabsTrigger value="base64">{t('cu.base64')}</TabsTrigger>
          <TabsTrigger value="hash">{t('cu.hash')}</TabsTrigger>
          <TabsTrigger value="password">{passwordTabLabel}</TabsTrigger>
        </TabsList>
        <TabsContent value="prettify"><PrettifyTab /></TabsContent>
        <TabsContent value="escape"><EscapeTab /></TabsContent>
        <TabsContent value="base64"><Base64Tab /></TabsContent>
        <TabsContent value="hash"><HashTab /></TabsContent>
        <TabsContent value="password"><PasswordTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Prettify ────────────────────────────────────────────────────────────────

function PrettifyTab() {
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [lang, setLang] = useState<'json' | 'xml' | 'html'>('json')
  const [copied, setCopied] = useState(false)

  const run = (mode: 'prettify' | 'minify') => {
    setError('')
    let res: { result: string; error?: string }
    if (lang === 'json') res = mode === 'prettify' ? prettifyJSON(input) : minifyJSON(input)
    else if (lang === 'xml') res = mode === 'prettify' ? prettifyXML(input) : { result: input.replace(/\s+/g, ' ') }
    else res = mode === 'prettify' ? prettifyHTML(input) : minifyHTML(input)
    if (res.error) setError(res.error)
    else setOutput(res.result)
  }

  const copy = async () => {
    await copyToClipboard(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('cu.prettify.title')}</CardTitle>
        <CardDescription>{t('cu.prettify.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Label>{t('cu.prettify.lang')}</Label>
          <Select value={lang} onValueChange={(v) => setLang(v as typeof lang)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="xml">XML</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => run('prettify')}>{t('cu.prettify.prettify')}</Button>
          <Button size="sm" variant="outline" onClick={() => run('minify')}>{t('cu.prettify.minify')}</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('common.input')}</Label>
            <Textarea className="font-mono text-xs h-64" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('common.pasteHere')} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{t('common.output')}</Label>
              <Button size="sm" variant="ghost" onClick={copy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {error ? (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive font-mono">{error}</div>
            ) : (
              <Textarea className="font-mono text-xs h-64" value={output} readOnly />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Escape ──────────────────────────────────────────────────────────────────

function EscapeTab() {
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'html-escape' | 'html-unescape' | 'url-encode' | 'url-decode'>('html-escape')
  const [copied, setCopied] = useState(false)

  const run = () => {
    if (mode === 'html-escape') setOutput(escapeHTML(input))
    else if (mode === 'html-unescape') setOutput(unescapeHTML(input))
    else if (mode === 'url-encode') setOutput(encodeURL(input))
    else setOutput(decodeURL(input))
  }

  const copy = async () => {
    await copyToClipboard(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('cu.escape.title')}</CardTitle>
        <CardDescription>{t('cu.escape.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          {([
            ['html-escape', 'HTML Escape'],
            ['html-unescape', 'HTML Unescape'],
            ['url-encode', 'URL Encode'],
            ['url-decode', 'URL Decode'],
          ] as const).map(([v, label]) => (
            <Button
              key={v}
              size="sm"
              variant={mode === v ? 'default' : 'outline'}
              onClick={() => setMode(v)}
            >
              {label}
            </Button>
          ))}
          <Button size="sm" onClick={run}>{t('common.run')}</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('common.input')}</Label>
            <Textarea className="font-mono text-xs h-48" value={input} onChange={(e) => setInput(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{t('common.output')}</Label>
              <Button size="sm" variant="ghost" onClick={copy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Textarea className="font-mono text-xs h-48" value={output} readOnly />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Base64 ──────────────────────────────────────────────────────────────────

function Base64Tab() {
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const encode = () => {
    const r = encodeBase64(input)
    setError(r.error ?? '')
    setOutput(r.result)
  }

  const decode = () => {
    const r = decodeBase64(input)
    setError(r.error ?? '')
    setOutput(r.result)
  }

  const copy = async () => {
    await copyToClipboard(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('cu.base64.title')}</CardTitle>
        <CardDescription>{t('cu.base64.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button size="sm" onClick={encode}>{t('cu.base64.encode')}</Button>
          <Button size="sm" variant="outline" onClick={decode}>{t('cu.base64.decode')}</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('common.input')}</Label>
            <Textarea className="font-mono text-xs h-48" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('cu.base64.placeholder')} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{t('common.output')}</Label>
              <Button size="sm" variant="ghost" onClick={copy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {error ? (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">{error}</div>
            ) : (
              <Textarea className="font-mono text-xs h-48" value={output} readOnly />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Hash ─────────────────────────────────────────────────────────────────────

function HashTab() {
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256')
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)

  const compute = async () => {
    const hash = await hashText(input, algorithm)
    setResult(hash)
  }

  const copy = async () => {
    await copyToClipboard(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('cu.hash.title')}</CardTitle>
        <CardDescription>{t('cu.hash.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as HashAlgorithm)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SHA-1">SHA-1</SelectItem>
              <SelectItem value="SHA-256">SHA-256</SelectItem>
              <SelectItem value="SHA-384">SHA-384</SelectItem>
              <SelectItem value="SHA-512">SHA-512</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={compute}>{t('cu.hash.compute')}</Button>
        </div>
        <div className="space-y-1.5">
          <Label>{t('cu.hash.text')}</Label>
          <Textarea
            className="font-mono text-xs h-32"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('cu.hash.placeholder')}
          />
        </div>
        {result && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{algorithm} {t('cu.hash.result')}</Label>
              <Button size="sm" variant="ghost" onClick={copy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="rounded-md bg-muted p-3 font-mono text-xs break-all">
              {result}
            </div>
            <Badge variant="secondary">{result.length * 4} bit</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PasswordTab() {
  const { lang } = useI18n()
  const ui = lang === 'hu'
    ? {
        title: 'Password / Passphrase Generator',
        desc: 'Offline, Web Crypto API alapú generálás Diceware + entropy kalkulációval.',
        modePassword: 'Jelszó',
        modePassphrase: 'Jelmondat',
        generate: 'Generálás',
        copyAll: 'Mind másolása',
        count: 'Darab',
        length: 'Hossz',
        excludeAmbiguous: 'Hasonló karakterek kizárása (O/0, l/1, ...)',
        includeLower: 'kisbetű',
        includeUpper: 'nagybetű',
        includeDigits: 'szám',
        includeSymbols: 'szimbólum',
        minRules: 'Minimum szabályok',
        minLower: 'min kisbetű',
        minUpper: 'min nagybetű',
        minDigits: 'min szám',
        minSymbols: 'min szimbólum',
        symbols: 'Szimbólum készlet',
        words: 'Szavak száma',
        separator: 'Elválasztó',
        capitalize: 'Első betű nagy',
        noRepeatWords: 'Ismétlődő szavak tiltása',
        excludeSimilarWords: 'Hasonló szavak tiltása',
        appendDigits: 'Szám utótag (db)',
        appendSymbol: 'Véletlen szimbólum a végére',
        output: 'Kimenet',
        diceware: 'Diceware lista',
        entropy: 'Entrópia',
        rolls: 'Első sor dobásai',
        weak: 'gyenge',
        ok: 'ok',
        strong: 'erős',
        veryStrong: 'nagyon erős',
      }
    : {
        title: 'Password / Passphrase Generator',
        desc: 'Offline generation with Web Crypto API, Diceware wordlist and entropy estimation.',
        modePassword: 'Password',
        modePassphrase: 'Passphrase',
        generate: 'Generate',
        copyAll: 'Copy all',
        count: 'Count',
        length: 'Length',
        excludeAmbiguous: 'Exclude ambiguous characters (O/0, l/1, ...)',
        includeLower: 'lowercase',
        includeUpper: 'uppercase',
        includeDigits: 'digits',
        includeSymbols: 'symbols',
        minRules: 'Minimum rules',
        minLower: 'min lowercase',
        minUpper: 'min uppercase',
        minDigits: 'min digits',
        minSymbols: 'min symbols',
        symbols: 'Symbol set',
        words: 'Word count',
        separator: 'Separator',
        capitalize: 'Capitalize words',
        noRepeatWords: 'No repeated words',
        excludeSimilarWords: 'Exclude similar words',
        appendDigits: 'Number suffix digits',
        appendSymbol: 'Append one random symbol',
        output: 'Output',
        diceware: 'Diceware list',
        entropy: 'Entropy',
        rolls: 'First row dice rolls',
        weak: 'weak',
        ok: 'ok',
        strong: 'strong',
        veryStrong: 'very strong',
      }

  const [mode, setMode] = useState<'password' | 'passphrase'>('password')
  const [count, setCount] = useState(3)
  const [passwordOpts, setPasswordOpts] = useState<PasswordOptions>(defaultPasswordOptions())
  const [passphraseOpts, setPassphraseOpts] = useState<PassphraseOptions>(defaultPassphraseOptions())
  const [output, setOutput] = useState('')
  const [entropyBits, setEntropyBits] = useState(0)
  const [firstRolls, setFirstRolls] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const getLevelLabel = (bits: number) => {
    const level = entropyLevel(bits)
    if (level === 'weak') return ui.weak
    if (level === 'ok') return ui.ok
    if (level === 'strong') return ui.strong
    return ui.veryStrong
  }

  const run = () => {
    try {
      const lines: string[] = []
      let firstBits = 0
      let firstPassphraseRolls = ''
      const safeCount = Math.max(1, Math.min(20, Number.isFinite(count) ? Math.trunc(count) : 1))
      for (let i = 0; i < safeCount; i++) {
        if (mode === 'password') {
          const built = generatePassword(passwordOpts)
          lines.push(built.value)
          if (i === 0) firstBits = built.entropyBits
        } else {
          const built = generatePassphrase(passphraseOpts)
          lines.push(built.value)
          if (i === 0) {
            firstBits = built.entropyBits
            firstPassphraseRolls = built.diceRolls.join(' ')
          }
        }
      }
      setOutput(lines.join('\n'))
      setEntropyBits(firstBits)
      setFirstRolls(firstPassphraseRolls)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setOutput('')
      setEntropyBits(0)
      setFirstRolls('')
    }
  }

  const copyAll = async () => {
    if (!output) return
    await copyToClipboard(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ui.title}</CardTitle>
        <CardDescription>{ui.desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant={mode === 'password' ? 'default' : 'outline'} onClick={() => setMode('password')}>
            {ui.modePassword}
          </Button>
          <Button size="sm" variant={mode === 'passphrase' ? 'default' : 'outline'} onClick={() => setMode('passphrase')}>
            {ui.modePassphrase}
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Label className="text-xs">{ui.count}</Label>
            <Input
              className="h-8 w-20 text-xs"
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || 1)}
            />
            <Button size="sm" onClick={run}>{ui.generate}</Button>
          </div>
        </div>

        {mode === 'password' ? (
          <div className="space-y-3 rounded-md border p-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label>{ui.length}</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  min={4}
                  max={512}
                  value={passwordOpts.length}
                  onChange={(e) => setPasswordOpts((p) => ({ ...p, length: Number(e.target.value) || 4 }))}
                />
              </div>
              <div className="space-y-1.5 lg:col-span-3">
                <Label>{ui.symbols}</Label>
                <Input
                  className="h-8 text-xs font-mono"
                  value={passwordOpts.symbols}
                  onChange={(e) => setPasswordOpts((p) => ({ ...p, symbols: e.target.value }))}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox
                checked={passwordOpts.excludeAmbiguous}
                onCheckedChange={(checked) => setPasswordOpts((p) => ({ ...p, excludeAmbiguous: checked === true }))}
              />
              {ui.excludeAmbiguous}
            </label>

            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={passwordOpts.includeLower} onCheckedChange={(checked) => setPasswordOpts((p) => ({ ...p, includeLower: checked === true }))} />
                {ui.includeLower}
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={passwordOpts.includeUpper} onCheckedChange={(checked) => setPasswordOpts((p) => ({ ...p, includeUpper: checked === true }))} />
                {ui.includeUpper}
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={passwordOpts.includeDigits} onCheckedChange={(checked) => setPasswordOpts((p) => ({ ...p, includeDigits: checked === true }))} />
                {ui.includeDigits}
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={passwordOpts.includeSymbols} onCheckedChange={(checked) => setPasswordOpts((p) => ({ ...p, includeSymbols: checked === true }))} />
                {ui.includeSymbols}
              </label>
            </div>

            <div className="space-y-1.5">
              <Label>{ui.minRules}</Label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Input className="h-8 text-xs" type="number" min={0} value={passwordOpts.minLower} onChange={(e) => setPasswordOpts((p) => ({ ...p, minLower: Number(e.target.value) || 0 }))} placeholder={ui.minLower} />
                <Input className="h-8 text-xs" type="number" min={0} value={passwordOpts.minUpper} onChange={(e) => setPasswordOpts((p) => ({ ...p, minUpper: Number(e.target.value) || 0 }))} placeholder={ui.minUpper} />
                <Input className="h-8 text-xs" type="number" min={0} value={passwordOpts.minDigits} onChange={(e) => setPasswordOpts((p) => ({ ...p, minDigits: Number(e.target.value) || 0 }))} placeholder={ui.minDigits} />
                <Input className="h-8 text-xs" type="number" min={0} value={passwordOpts.minSymbols} onChange={(e) => setPasswordOpts((p) => ({ ...p, minSymbols: Number(e.target.value) || 0 }))} placeholder={ui.minSymbols} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-md border p-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label>{ui.words}</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  min={2}
                  max={40}
                  value={passphraseOpts.wordCount}
                  onChange={(e) => setPassphraseOpts((p) => ({ ...p, wordCount: Number(e.target.value) || 2 }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{ui.separator}</Label>
                <Input
                  className="h-8 text-xs font-mono"
                  value={passphraseOpts.separator}
                  onChange={(e) => setPassphraseOpts((p) => ({ ...p, separator: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{ui.appendDigits}</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  min={0}
                  max={12}
                  value={passphraseOpts.appendNumberDigits}
                  onChange={(e) => setPassphraseOpts((p) => ({ ...p, appendNumberDigits: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{ui.symbols}</Label>
                <Input
                  className="h-8 text-xs font-mono"
                  value={passphraseOpts.symbolSet}
                  onChange={(e) => setPassphraseOpts((p) => ({ ...p, symbolSet: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={passphraseOpts.capitalizeWords}
                  onCheckedChange={(checked) => setPassphraseOpts((p) => ({ ...p, capitalizeWords: checked === true }))}
                />
                {ui.capitalize}
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={passphraseOpts.noRepeatedWords}
                  onCheckedChange={(checked) => setPassphraseOpts((p) => ({ ...p, noRepeatedWords: checked === true }))}
                />
                {ui.noRepeatWords}
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={passphraseOpts.excludeSimilarWords}
                  onCheckedChange={(checked) => setPassphraseOpts((p) => ({ ...p, excludeSimilarWords: checked === true }))}
                />
                {ui.excludeSimilarWords}
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={passphraseOpts.appendSymbol}
                  onCheckedChange={(checked) => setPassphraseOpts((p) => ({ ...p, appendSymbol: checked === true }))}
                />
                {ui.appendSymbol}
              </label>
            </div>
            <Badge variant="outline">{ui.diceware}: EFF short ({DICEWARE_WORD_COUNT} words)</Badge>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>{ui.output}</Label>
            <Button size="sm" variant="ghost" onClick={copyAll}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {ui.copyAll}
            </Button>
          </div>
          <Textarea className="font-mono text-xs h-40" value={output} readOnly />
        </div>

        {output && (
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary">{ui.entropy}: {entropyBits.toFixed(1)} bits</Badge>
            <Badge variant="outline">{getLevelLabel(entropyBits)}</Badge>
            {mode === 'passphrase' && firstRolls && (
              <Badge variant="outline">{ui.rolls}: {firstRolls}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
