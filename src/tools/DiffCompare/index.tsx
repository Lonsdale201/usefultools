import { useState } from 'react'
import { Copy, Check, Download } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { copyToClipboard, downloadFile } from '@/lib/downloadFile'
import { computeDiff, diffStats, type DiffMode } from './textDiff'
import { diffCSV, type DiffRow } from './csvDiff'
import { deduplicateList, type DedupOptions } from './listDedup'
import { useI18n } from '@/lib/i18n'

export function DiffCompare() {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('dc.title')}</h1>
        <p className="text-muted-foreground">{t('dc.subtitle')}</p>
      </div>
      <Tabs defaultValue="text-diff">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="text-diff">{t('dc.textDiff')}</TabsTrigger>
          <TabsTrigger value="csv-diff">{t('dc.csvDiff')}</TabsTrigger>
          <TabsTrigger value="dedup">{t('dc.dedup')}</TabsTrigger>
        </TabsList>
        <TabsContent value="text-diff"><TextDiffTab /></TabsContent>
        <TabsContent value="csv-diff"><CsvDiffTab /></TabsContent>
        <TabsContent value="dedup"><DedupTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Text Diff ────────────────────────────────────────────────────────────────

function TextDiffTab() {
  const { t } = useI18n()
  const [original, setOriginal] = useState('')
  const [modified, setModified] = useState('')
  const [mode, setMode] = useState<DiffMode>('lines')
  const [chunks, setChunks] = useState<ReturnType<typeof computeDiff> | null>(null)

  const run = () => setChunks(computeDiff(original, modified, mode))
  const stats = chunks ? diffStats(chunks) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dc.textDiff.title')}</CardTitle>
        <CardDescription>{t('dc.textDiff.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Select value={mode} onValueChange={(v) => setMode(v as DiffMode)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lines">{t('dc.textDiff.lineMode')}</SelectItem>
              <SelectItem value="words">{t('dc.textDiff.wordMode')}</SelectItem>
              <SelectItem value="chars">{t('dc.textDiff.charMode')}</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={run}>{t('common.compare')}</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('dc.textDiff.original')}</Label>
            <Textarea className="font-mono text-xs h-48" value={original} onChange={(e) => setOriginal(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('dc.textDiff.modified')}</Label>
            <Textarea className="font-mono text-xs h-48" value={modified} onChange={(e) => setModified(e.target.value)} />
          </div>
        </div>

        {stats && (
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-green-600 text-white">+{stats.added} {t('dc.textDiff.added')}</Badge>
            <Badge className="bg-red-600 text-white">-{stats.removed} {t('dc.textDiff.removed')}</Badge>
            <Badge variant="secondary">{stats.unchanged} {t('dc.textDiff.unchanged')}</Badge>
          </div>
        )}

        {chunks && (
          <div className="rounded-md border overflow-auto max-h-80">
            <pre className="text-xs p-3 whitespace-pre-wrap font-mono">
              {chunks.map((chunk, i) => (
                <span
                  key={i}
                  className={
                    chunk.added
                      ? 'bg-green-100 text-green-900'
                      : chunk.removed
                      ? 'bg-red-100 text-red-900 line-through'
                      : ''
                  }
                >
                  {chunk.value}
                </span>
              ))}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── CSV Diff ─────────────────────────────────────────────────────────────────

function CsvDiffTab() {
  const { t } = useI18n()
  const [csvA, setCsvA] = useState('')
  const [csvB, setCsvB] = useState('')
  const [keyCol, setKeyCol] = useState('id')
  const [rows, setRows] = useState<DiffRow[]>([])

  const run = () => setRows(diffCSV(csvA, csvB, keyCol))

  const statusColor: Record<DiffRow['status'], string> = {
    added: 'bg-green-50 border-green-200',
    removed: 'bg-red-50 border-red-200',
    changed: 'bg-yellow-50 border-yellow-200',
    unchanged: 'bg-muted/30 border-border',
  }

  const statusBadge: Record<DiffRow['status'], string> = {
    added: 'bg-green-600 text-white',
    removed: 'bg-red-600 text-white',
    changed: 'bg-yellow-500 text-white',
    unchanged: '',
  }

  const summary = rows.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dc.csvDiff.title')}</CardTitle>
        <CardDescription>{t('dc.csvDiff.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">{t('dc.csvDiff.keyCol')}</Label>
            <Input className="h-8 w-32" value={keyCol} onChange={(e) => setKeyCol(e.target.value)} />
          </div>
          <Button size="sm" onClick={run}>{t('common.compare')}</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('dc.csvDiff.csvA')}</Label>
            <Textarea className="font-mono text-xs h-40" value={csvA} onChange={(e) => setCsvA(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('dc.csvDiff.csvB')}</Label>
            <Textarea className="font-mono text-xs h-40" value={csvB} onChange={(e) => setCsvB(e.target.value)} />
          </div>
        </div>

        {rows.length > 0 && (
          <>
            <div className="flex gap-2 flex-wrap">
              {summary.added && <Badge className="bg-green-600 text-white">+{summary.added} {t('dc.csvDiff.added')}</Badge>}
              {summary.removed && <Badge className="bg-red-600 text-white">-{summary.removed} {t('dc.csvDiff.removed')}</Badge>}
              {summary.changed && <Badge className="bg-yellow-500 text-white">~{summary.changed} {t('dc.csvDiff.changed')}</Badge>}
              {summary.unchanged && <Badge variant="secondary">{summary.unchanged} {t('dc.csvDiff.unchanged')}</Badge>}
            </div>
            <div className="space-y-1.5 max-h-72 overflow-auto">
              {rows.filter((r) => r.status !== 'unchanged').map((row) => (
                <div key={row.key} className={`rounded-md border p-3 text-xs ${statusColor[row.status]}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-xs ${statusBadge[row.status]}`}>{row.status}</Badge>
                    <span className="font-mono font-semibold">{keyCol}: {row.key}</span>
                  </div>
                  {row.changedFields && row.changedFields.length > 0 && (
                    <div className="space-y-0.5">
                      {row.changedFields.map((f) => (
                        <div key={f} className="flex gap-2">
                          <span className="text-muted-foreground w-20 truncate">{f}:</span>
                          <span className="line-through text-red-700">{row.original?.[f]}</span>
                          <span>→</span>
                          <span className="text-green-700">{row.modified?.[f]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── List Dedup ───────────────────────────────────────────────────────────────

function DedupTab() {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const [opts, setOpts] = useState<DedupOptions>({ caseInsensitive: true, trim: true, keepFirst: true })
  const [result, setResult] = useState<ReturnType<typeof deduplicateList> | null>(null)
  const [copied, setCopied] = useState(false)

  const run = () => setResult(deduplicateList(text, opts))

  const copy = async () => {
    if (!result) return
    await copyToClipboard(result.unique.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    if (!result) return
    downloadFile(result.unique.join('\n'), 'deduplicated.txt', 'text/plain')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dc.dedup.title')}</CardTitle>
        <CardDescription>{t('dc.dedup.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={opts.caseInsensitive} onChange={(e) => setOpts({ ...opts, caseInsensitive: e.target.checked })} />
            {t('dc.dedup.caseFold')}
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={opts.trim} onChange={(e) => setOpts({ ...opts, trim: e.target.checked })} />
            {t('dc.dedup.trim')}
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={opts.keepFirst} onChange={(e) => setOpts({ ...opts, keepFirst: e.target.checked })} />
            {t('dc.dedup.keepFirst')}
          </label>
          <Button size="sm" onClick={run}>{t('dc.dedup.run')}</Button>
        </div>

        <div className="space-y-1.5">
          <Label>{t('dc.dedup.inputLabel')}</Label>
          <Textarea
            className="font-mono text-xs h-48"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="alma&#10;körte&#10;alma&#10;barack&#10;körte"
          />
        </div>

        {result && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Badge variant="secondary">{t('dc.dedup.totalLabel')}: {result.totalCount}</Badge>
              <Badge>{result.removedCount} {t('dc.dedup.removedLabel')}</Badge>
              <Badge variant="outline">{t('dc.dedup.uniqueLabel')}: {result.unique.length}</Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{t('common.result')}</Label>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={copy}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={download}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Textarea className="font-mono text-xs h-48" value={result.unique.join('\n')} readOnly />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
