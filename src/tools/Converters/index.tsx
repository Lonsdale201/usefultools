import { useState } from 'react'
import { Download, Copy, Check, AlertTriangle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { copyToClipboard, downloadFile } from '@/lib/downloadFile'
import { jsonToCSV, csvToJSON } from './jsonCsv'
import { jsonToYAML, yamlToJSON } from './jsonYaml'
import { cleanCSV, type CleanOptions } from './csvCleaner'
import { parsePastedTable, pasteTableToCSV, pasteTableToXLSX } from './pasteTable'
import { useI18n } from '@/lib/i18n'

export function Converters() {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('cv.title')}</h1>
        <p className="text-muted-foreground">{t('cv.subtitle')}</p>
      </div>
      <Tabs defaultValue="json-csv">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="json-csv">{t('cv.jsonCsv')}</TabsTrigger>
          <TabsTrigger value="json-yaml">{t('cv.jsonYaml')}</TabsTrigger>
          <TabsTrigger value="csv-cleaner">{t('cv.csvCleaner')}</TabsTrigger>
          <TabsTrigger value="paste-table">{t('cv.pasteTable')}</TabsTrigger>
        </TabsList>
        <TabsContent value="json-csv"><JsonCsvTab /></TabsContent>
        <TabsContent value="json-yaml"><JsonYamlTab /></TabsContent>
        <TabsContent value="csv-cleaner"><CsvCleanerTab /></TabsContent>
        <TabsContent value="paste-table"><PasteTableTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ─── JSON ↔ CSV ───────────────────────────────────────────────────────────────

function JsonCsvTab() {
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [mode, setMode] = useState<'json2csv' | 'csv2json'>('json2csv')
  const [copied, setCopied] = useState(false)

  const run = () => {
    setError(''); setWarning('')
    const r = mode === 'json2csv' ? jsonToCSV(input) : csvToJSON(input)
    if (r.error && !r.result) setError(r.error)
    else {
      if (r.error) setWarning(r.error)
      setOutput(r.result)
    }
  }

  const download = () => {
    const ext = mode === 'json2csv' ? 'csv' : 'json'
    const mime = mode === 'json2csv' ? 'text/csv' : 'application/json'
    downloadFile(output, `converted.${ext}`, mime)
  }

  const copy = async () => {
    await copyToClipboard(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('cv.jsonCsv.title')}</CardTitle>
        <CardDescription>{t('cv.jsonCsv.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button size="sm" variant={mode === 'json2csv' ? 'default' : 'outline'} onClick={() => { setMode('json2csv'); setOutput('') }}>JSON → CSV</Button>
          <Button size="sm" variant={mode === 'csv2json' ? 'default' : 'outline'} onClick={() => { setMode('csv2json'); setOutput('') }}>CSV → JSON</Button>
          <Button size="sm" onClick={run}>{t('common.convert')}</Button>
        </div>
        <TwoPanel
          input={input} onInput={setInput}
          output={output} error={error} warning={warning}
          onCopy={copy} onDownload={download} copied={copied}
          inputLabel={t('common.input')} outputLabel={t('common.output')}
          inputPlaceholder={mode === 'json2csv' ? '[{"name":"Alice","age":30},...]' : 'name,age\nAlice,30'}
        />
      </CardContent>
    </Card>
  )
}

// ─── JSON ↔ YAML ──────────────────────────────────────────────────────────────

function JsonYamlTab() {
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'json2yaml' | 'yaml2json'>('json2yaml')
  const [copied, setCopied] = useState(false)

  const run = () => {
    setError('')
    const r = mode === 'json2yaml' ? jsonToYAML(input) : yamlToJSON(input)
    if (r.error) setError(r.error)
    else setOutput(r.result)
  }

  const download = () => {
    const ext = mode === 'json2yaml' ? 'yaml' : 'json'
    downloadFile(output, `converted.${ext}`, 'text/plain')
  }

  const copy = async () => {
    await copyToClipboard(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('cv.jsonYaml.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button size="sm" variant={mode === 'json2yaml' ? 'default' : 'outline'} onClick={() => { setMode('json2yaml'); setOutput('') }}>JSON → YAML</Button>
          <Button size="sm" variant={mode === 'yaml2json' ? 'default' : 'outline'} onClick={() => { setMode('yaml2json'); setOutput('') }}>YAML → JSON</Button>
          <Button size="sm" onClick={run}>{t('common.convert')}</Button>
        </div>
        <TwoPanel
          input={input} onInput={setInput}
          output={output} error={error}
          onCopy={copy} onDownload={download} copied={copied}
          inputLabel={t('common.input')} outputLabel={t('common.output')}
        />
      </CardContent>
    </Card>
  )
}

// ─── CSV Cleaner ──────────────────────────────────────────────────────────────

function CsvCleanerTab() {
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [stats, setStats] = useState<{ rowCount: number; colCount: number; detectedDelimiter: string } | null>(null)
  const [opts, setOpts] = useState<CleanOptions>({
    delimiter: 'auto',
    trimWhitespace: true,
    fixQuotes: true,
    outputDelimiter: ',',
  })

  const run = () => {
    const r = cleanCSV(input, opts)
    setOutput(r.csv)
    setWarnings(r.warnings)
    setStats({ rowCount: r.rowCount, colCount: r.colCount, detectedDelimiter: r.detectedDelimiter })
  }

  const download = () => downloadFile(output, 'cleaned.csv', 'text/csv')

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('cv.csvCleaner.title')}</CardTitle>
        <CardDescription>{t('cv.csvCleaner.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">{t('cv.csvCleaner.inputDelim')}</Label>
            <Select value={opts.delimiter} onValueChange={(v) => setOpts({ ...opts, delimiter: v as CleanOptions['delimiter'] })}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{t('cv.csvCleaner.autoDetect')}</SelectItem>
                <SelectItem value=",">{t('cv.csvCleaner.comma')}</SelectItem>
                <SelectItem value=";">{t('cv.csvCleaner.semicolon')}</SelectItem>
                <SelectItem value="\t">{t('cv.csvCleaner.tab')}</SelectItem>
                <SelectItem value="|">{t('cv.csvCleaner.pipe')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">{t('cv.csvCleaner.outputDelim')}</Label>
            <Select value={opts.outputDelimiter} onValueChange={(v) => setOpts({ ...opts, outputDelimiter: v as CleanOptions['outputDelimiter'] })}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=",">{t('cv.csvCleaner.comma')}</SelectItem>
                <SelectItem value=";">{t('cv.csvCleaner.semicolon')}</SelectItem>
                <SelectItem value="\t">{t('cv.csvCleaner.tab')}</SelectItem>
                <SelectItem value="|">{t('cv.csvCleaner.pipe')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-1 text-sm cursor-pointer">
            <input type="checkbox" checked={opts.trimWhitespace} onChange={(e) => setOpts({ ...opts, trimWhitespace: e.target.checked })} />
            {t('cv.csvCleaner.trimWs')}
          </label>
          <Button size="sm" onClick={run}>{t('cv.csvCleaner.clean')}</Button>
        </div>

        {stats && (
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">{t('common.rows')}: {stats.rowCount}</Badge>
            <Badge variant="secondary">{t('common.columns')}: {stats.colCount}</Badge>
            <Badge variant="outline">{t('cv.csvCleaner.detectedDelim')}: {stats.detectedDelimiter}</Badge>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="flex items-start gap-2 rounded-md bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>{warnings.slice(0, 5).join(' | ')}{warnings.length > 5 ? ` +${warnings.length - 5} more` : ''}</div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('cv.csvCleaner.inputLabel')}</Label>
            <Textarea className="font-mono text-xs h-56" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('common.pasteHere')} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{t('cv.csvCleaner.outputLabel')}</Label>
              <Button size="sm" variant="outline" onClick={download}>
                <Download className="mr-1 h-3 w-3" /> {t('common.download')}
              </Button>
            </div>
            <Textarea className="font-mono text-xs h-56" value={output} readOnly />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Paste Table ──────────────────────────────────────────────────────────────

function PasteTableTab() {
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState<string[][]>([])

  const parse = () => {
    setParsed(parsePastedTable(input))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('cv.pasteTable.title')}</CardTitle>
        <CardDescription>{t('cv.pasteTable.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t('cv.pasteTable.label')}</Label>
          <Textarea
            className="font-mono text-xs h-40"
            value={input}
            onChange={(e) => { setInput(e.target.value); setParsed([]) }}
            placeholder={t('cv.pasteTable.placeholder')}
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={parse}>{t('common.preview')}</Button>
          <Button size="sm" variant="outline" onClick={() => pasteTableToCSV(parsed.length ? parsed : parsePastedTable(input))}>
            <Download className="mr-1 h-3 w-3" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => pasteTableToXLSX(parsed.length ? parsed : parsePastedTable(input))}>
            <Download className="mr-1 h-3 w-3" /> XLSX
          </Button>
        </div>
        {parsed.length > 0 && (
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse">
              <tbody>
                {parsed.slice(0, 20).map((row, i) => (
                  <tr key={i} className={i === 0 ? 'bg-muted font-semibold' : 'hover:bg-muted/40'}>
                    {row.map((cell, j) => (
                      <td key={j} className="border px-2 py-1 whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.length > 20 && (
              <p className="text-xs text-muted-foreground mt-2">...{parsed.length - 20} {t('cv.pasteTable.moreRows')}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Shared: TwoPanel ─────────────────────────────────────────────────────────

interface TwoPanelProps {
  input: string
  onInput: (v: string) => void
  output: string
  error?: string
  warning?: string
  onCopy: () => void
  onDownload: () => void
  copied: boolean
  inputPlaceholder?: string
  inputLabel: string
  outputLabel: string
}

function TwoPanel({ input, onInput, output, error, warning, onCopy, onDownload, copied, inputPlaceholder, inputLabel, outputLabel }: TwoPanelProps) {
  return (
    <div className="space-y-2">
      {warning && (
        <div className="flex items-start gap-2 rounded-md bg-yellow-50 border border-yellow-200 p-2 text-xs text-yellow-800">
          <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
          {warning}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{inputLabel}</Label>
          <Textarea className="font-mono text-xs h-56" value={input} onChange={(e) => onInput(e.target.value)} placeholder={inputPlaceholder} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>{outputLabel}</Label>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={onCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={onDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {error ? (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive font-mono h-56 overflow-auto">{error}</div>
          ) : (
            <Textarea className="font-mono text-xs h-56" value={output} readOnly />
          )}
        </div>
      </div>
    </div>
  )
}
