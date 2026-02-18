import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { copyToClipboard } from '@/lib/downloadFile'
import { useI18n } from '@/lib/i18n'
import { prettifyJSON, minifyJSON, prettifyXML, prettifyHTML, minifyHTML } from './prettify'
import { escapeHTML, unescapeHTML, encodeURL, decodeURL } from './escape'
import { encodeBase64, decodeBase64 } from './base64'
import { hashText, type HashAlgorithm } from './hash'

export function CodeUtils() {
  const { t } = useI18n()

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
        </TabsList>
        <TabsContent value="prettify"><PrettifyTab /></TabsContent>
        <TabsContent value="escape"><EscapeTab /></TabsContent>
        <TabsContent value="base64"><Base64Tab /></TabsContent>
        <TabsContent value="hash"><HashTab /></TabsContent>
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
