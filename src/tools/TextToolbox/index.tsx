import { useState } from 'react'
import { Plus, Trash2, Download, Copy, Check } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { copyToClipboard, downloadFile } from '@/lib/downloadFile'
import { computeWordFreq, type WordFreqOptions } from './wordFreq'
import { computeNgrams } from './ngrams'
import { findDuplicateSentences, findDuplicateParagraphs } from './dedup'
import { analyzeReadability } from './readability'
import { applyPatterns, type RegexPattern } from './regexTool'
import { useI18n } from '@/lib/i18n'
import { faker } from '@faker-js/faker'
import Papa from 'papaparse'

export function TextToolbox() {
  const { t } = useI18n()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('tt.title')}</h1>
        <p className="text-muted-foreground">{t('tt.subtitle')}</p>
      </div>
      <Tabs defaultValue="wordfreq">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="wordfreq">{t('tt.wordFreq')}</TabsTrigger>
          <TabsTrigger value="ngram">{t('tt.ngram')}</TabsTrigger>
          <TabsTrigger value="dedup">{t('tt.dedup')}</TabsTrigger>
          <TabsTrigger value="readability">{t('tt.readability')}</TabsTrigger>
          <TabsTrigger value="regex">{t('tt.regex')}</TabsTrigger>
          <TabsTrigger value="lorem">{t('tt.lorem')}</TabsTrigger>
        </TabsList>
        <TabsContent value="wordfreq"><WordFreqTab /></TabsContent>
        <TabsContent value="ngram"><NgramTab /></TabsContent>
        <TabsContent value="dedup"><DedupTab /></TabsContent>
        <TabsContent value="readability"><ReadabilityTab /></TabsContent>
        <TabsContent value="regex"><RegexTab /></TabsContent>
        <TabsContent value="lorem"><LoremTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Word Frequency ───────────────────────────────────────────────────────────

function WordFreqTab() {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const [opts, setOpts] = useState<WordFreqOptions>({ language: 'en', caseFold: true, minLength: 3 })
  const [results, setResults] = useState<{ word: string; count: number; firstLine: number }[]>([])

  const run = () => setResults(computeWordFreq(text, opts))

  const downloadCSV = () => {
    const csv = Papa.unparse(results)
    downloadFile(csv, 'word-frequency.csv', 'text/csv')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tt.wordFreq.title')}</CardTitle>
        <CardDescription>{t('tt.wordFreq.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={opts.language} onValueChange={(v) => setOpts({ ...opts, language: v as WordFreqOptions['language'] })}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t('tt.wordFreq.stopwords')}: EN</SelectItem>
              <SelectItem value="hu">{t('tt.wordFreq.stopwords')}: HU</SelectItem>
              <SelectItem value="none">{t('tt.wordFreq.none')}</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={opts.caseFold} onChange={(e) => setOpts({ ...opts, caseFold: e.target.checked })} />
            {t('tt.wordFreq.caseFold')}
          </label>
          <div className="flex items-center gap-1">
            <Label className="text-sm whitespace-nowrap">{t('tt.wordFreq.minLen')}</Label>
            <Input className="w-16 h-8 text-sm" type="number" min={1} max={20} value={opts.minLength}
              onChange={(e) => setOpts({ ...opts, minLength: parseInt(e.target.value) || 1 })} />
          </div>
          <Button size="sm" onClick={run}>{t('common.analyze')}</Button>
          {results.length > 0 && (
            <Button size="sm" variant="outline" onClick={downloadCSV}>
              <Download className="mr-1 h-3 w-3" /> CSV {t('common.export').toLowerCase()}
            </Button>
          )}
        </div>
        <Textarea className="font-mono text-xs h-36" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('common.pasteHere')} />
        {results.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge>{results.length} {t('tt.wordFreq.uniqueWords')}</Badge>
            </div>
            <div className="overflow-auto max-h-72">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1.5 text-left">{t('tt.wordFreq.word')}</th>
                    <th className="px-2 py-1.5 text-right">{t('tt.wordFreq.count')}</th>
                    <th className="px-2 py-1.5 text-right">{t('tt.wordFreq.firstLine')}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 100).map((r) => (
                    <tr key={r.word} className="border-b hover:bg-muted/40">
                      <td className="px-2 py-1.5 font-mono">{r.word}</td>
                      <td className="px-2 py-1.5 text-right font-semibold">{r.count}</td>
                      <td className="px-2 py-1.5 text-right text-muted-foreground">{r.firstLine}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── N-gram ───────────────────────────────────────────────────────────────────

function NgramTab() {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const [n, setN] = useState<2 | 3>(2)
  const [results, setResults] = useState<{ ngram: string; count: number }[]>([])

  const run = () => setResults(computeNgrams(text, n))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tt.ngram.title')}</CardTitle>
        <CardDescription>{t('tt.ngram.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button size="sm" variant={n === 2 ? 'default' : 'outline'} onClick={() => setN(2)}>{t('tt.ngram.bigram')}</Button>
          <Button size="sm" variant={n === 3 ? 'default' : 'outline'} onClick={() => setN(3)}>{t('tt.ngram.trigram')}</Button>
          <Button size="sm" onClick={run}>{t('common.analyze')}</Button>
        </div>
        <Textarea className="font-mono text-xs h-36" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('common.pasteHere')} />
        {results.length > 0 && (
          <div className="overflow-auto max-h-72">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-1.5 text-left">{t('tt.ngram.column')}</th>
                  <th className="px-2 py-1.5 text-right">{t('tt.ngram.count')}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.ngram} className="border-b hover:bg-muted/40">
                    <td className="px-2 py-1.5 font-mono">{r.ngram}</td>
                    <td className="px-2 py-1.5 text-right font-semibold">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Duplicate finder ─────────────────────────────────────────────────────────

function DedupTab() {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'sentences' | 'paragraphs'>('sentences')
  const [caseInsensitive, setCaseInsensitive] = useState(true)
  const [results, setResults] = useState<{ text: string; lines: number[] }[]>([])

  const run = () => {
    const fn = mode === 'sentences' ? findDuplicateSentences : findDuplicateParagraphs
    setResults(fn(text, caseInsensitive))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tt.dedup.title')}</CardTitle>
        <CardDescription>{t('tt.dedup.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant={mode === 'sentences' ? 'default' : 'outline'} onClick={() => setMode('sentences')}>{t('tt.dedup.sentences')}</Button>
          <Button size="sm" variant={mode === 'paragraphs' ? 'default' : 'outline'} onClick={() => setMode('paragraphs')}>{t('tt.dedup.paragraphs')}</Button>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={caseInsensitive} onChange={(e) => setCaseInsensitive(e.target.checked)} />
            {t('tt.dedup.caseFold')}
          </label>
          <Button size="sm" onClick={run}>{t('common.search')}</Button>
        </div>
        <Textarea className="font-mono text-xs h-36" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('common.pasteHere')} />
        {results.length === 0 ? (
          text ? <p className="text-sm text-muted-foreground">{t('tt.dedup.none')}</p> : null
        ) : (
          <div className="space-y-2">
            <Badge variant="destructive">{results.length} {t('tt.dedup.found')}</Badge>
            <div className="space-y-2 max-h-72 overflow-auto">
              {results.map((r, i) => (
                <div key={i} className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="destructive" className="text-xs">{r.lines.length}×</Badge>
                    <span className="text-xs text-muted-foreground">{t('tt.dedup.positions')}: {r.lines.join(', ')}</span>
                  </div>
                  <p className="text-xs font-mono line-clamp-2">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Readability ──────────────────────────────────────────────────────────────

function ReadabilityTab() {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const [result, setResult] = useState<ReturnType<typeof analyzeReadability> | null>(null)

  const run = () => setResult(analyzeReadability(text))

  const stats: { label: string; value: string | number; unit?: string }[] = result ? [
    { label: t('tt.readability.chars'), value: result.charCount },
    { label: t('tt.readability.words'), value: result.wordCount },
    { label: t('tt.readability.sentences'), value: result.sentenceCount },
    { label: t('tt.readability.paragraphs'), value: result.paragraphCount },
    { label: t('tt.readability.avgWords'), value: result.avgWordsPerSentence },
    { label: t('tt.readability.avgChars'), value: result.avgCharsPerWord },
    { label: t('tt.readability.lexDiv'), value: result.lexicalDiversity, unit: '%' },
    { label: t('tt.readability.longest'), value: result.longestSentenceWords, unit: t('tt.readability.longestWords') },
  ] : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tt.readability.title')}</CardTitle>
        <CardDescription>{t('tt.readability.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea className="font-mono text-xs h-36" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('common.pasteHere')} />
        <Button size="sm" onClick={run}>{t('common.analyze')}</Button>
        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-md border p-3">
                  <div className="text-xl font-bold">{s.value}{s.unit ? <span className="text-sm font-normal ml-1">{s.unit}</span> : ''}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
            {result.longestSentence && (
              <div>
                <Label className="text-xs">{t('tt.readability.longest')}</Label>
                <p className="text-xs text-muted-foreground mt-1 rounded-md bg-muted p-2 italic">"{result.longestSentence.slice(0, 300)}{result.longestSentence.length > 300 ? '...' : ''}"</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Regex Batch ──────────────────────────────────────────────────────────────

let regexIdCounter = 1

function RegexTab() {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const [patterns, setPatterns] = useState<RegexPattern[]>([
    { id: String(regexIdCounter++), find: '', replace: '', flags: 'g' },
  ])
  const [result, setResult] = useState('')
  const [matches, setMatches] = useState<{ line: number; original: string; replaced: string }[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const addPattern = () => {
    setPatterns((prev) => [...prev, { id: String(regexIdCounter++), find: '', replace: '', flags: 'g' }])
  }

  const removePattern = (id: string) => {
    setPatterns((prev) => prev.filter((p) => p.id !== id))
  }

  const updatePattern = (id: string, patch: Partial<RegexPattern>) => {
    setPatterns((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const run = () => {
    const r = applyPatterns(text, patterns)
    setResult(r.result)
    setMatches(r.matches)
    setErrors(r.errors)
  }

  const copy = async () => {
    await copyToClipboard(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tt.regex.title')}</CardTitle>
        <CardDescription>{t('tt.regex.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Patterns */}
        <div className="space-y-2">
          <Label>{t('tt.regex.patterns')}</Label>
          {patterns.map((pat) => (
            <div key={pat.id} className="flex items-center gap-2">
              <Input
                className="h-8 flex-1 font-mono text-xs"
                placeholder={t('tt.regex.find')}
                value={pat.find}
                onChange={(e) => updatePattern(pat.id, { find: e.target.value })}
              />
              <span className="text-muted-foreground text-sm">→</span>
              <Input
                className="h-8 flex-1 font-mono text-xs"
                placeholder={t('tt.regex.replace')}
                value={pat.replace}
                onChange={(e) => updatePattern(pat.id, { replace: e.target.value })}
              />
              <Input
                className="h-8 w-16 font-mono text-xs"
                placeholder="flags"
                value={pat.flags}
                onChange={(e) => updatePattern(pat.id, { flags: e.target.value })}
              />
              <button onClick={() => removePattern(pat.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addPattern}>
            <Plus className="mr-1 h-3 w-3" /> {t('tt.regex.addPattern')}
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label>{t('tt.regex.text')}</Label>
          <Textarea className="font-mono text-xs h-32" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('common.pasteHere')} />
        </div>

        <Button size="sm" onClick={run}>{t('common.run')}</Button>

        {errors.length > 0 && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-2 text-xs text-destructive">
            {errors.join('\n')}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            {matches.length > 0 && (
              <div>
                <Badge className="mb-2">{matches.length} {t('tt.regex.modifiedLines')}</Badge>
                <div className="max-h-40 overflow-auto space-y-1">
                  {matches.slice(0, 20).map((m) => (
                    <div key={m.line} className="text-xs grid grid-cols-[2rem_1fr_1fr] gap-1">
                      <span className="text-muted-foreground">#{m.line}</span>
                      <span className="line-through text-destructive/70 font-mono truncate">{m.original}</span>
                      <span className="text-green-700 font-mono truncate">{m.replaced}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{t('common.result')}</Label>
                <Button size="sm" variant="ghost" onClick={copy}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Textarea className="font-mono text-xs h-40" value={result} readOnly />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Lorem Ipsum Generator ───────────────────────────────────────────────────

function LoremTab() {
  const { t } = useI18n()
  const [mode, setMode] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs')
  const [count, setCount] = useState(3)
  const [startWithLorem, setStartWithLorem] = useState(true)
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)

  const generate = () => {
    let text = ''
    const n = Math.max(1, count)
    if (mode === 'paragraphs') {
      text = faker.lorem.paragraphs(n, '\n\n')
      if (startWithLorem) {
        const loremStart = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
        // Replace the beginning of the first paragraph
        const firstDotIndex = text.indexOf('.')
        if (firstDotIndex !== -1) {
          text = loremStart + text.slice(firstDotIndex + 1)
        } else {
          text = loremStart + ' ' + text
        }
      }
    } else if (mode === 'sentences') {
      text = faker.lorem.sentences(n)
    } else {
      text = faker.lorem.words(n)
    }
    setOutput(text)
  }

  const copy = async () => {
    await copyToClipboard(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tt.lorem.title')}</CardTitle>
        <CardDescription>{t('tt.lorem.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paragraphs">{t('tt.lorem.mode.paragraphs')}</SelectItem>
              <SelectItem value="sentences">{t('tt.lorem.mode.sentences')}</SelectItem>
              <SelectItem value="words">{t('tt.lorem.mode.words')}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Label className="text-sm whitespace-nowrap">{t('tt.lorem.count')}</Label>
            <Input
              className="w-20 h-8 text-sm"
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            />
          </div>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={startWithLorem}
              onChange={(e) => setStartWithLorem(e.target.checked)}
            />
            {t('tt.lorem.startWithLorem')}
          </label>
          <Button size="sm" onClick={generate}>{t('tt.lorem.generate')}</Button>
        </div>
        {output && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{t('common.output')}</Label>
              <Button size="sm" variant="ghost" onClick={copy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Textarea className="font-mono text-xs h-48" value={output} readOnly />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
