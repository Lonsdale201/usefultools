import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, Copy, Check, AlertTriangle, Plus, Trash2 } from 'lucide-react'
import Papa from 'papaparse'
import { JSONPath } from 'jsonpath-plus'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { copyToClipboard, downloadFile } from '@/lib/downloadFile'
import { jsonToCSV, csvToJSON } from './jsonCsv'
import { jsonToYAML, yamlToJSON } from './jsonYaml'
import { htmlToMarkdown, markdownToHtml, markdownToPlain } from './mdHtml'
import { cleanCSV, type CleanOptions } from './csvCleaner'
import { parsePastedTable, pasteTableToCSV, pasteTableToXLSX } from './pasteTable'
import { formatInTimeZone, formatOffset, getTimeZoneOffsetMinutes, isValidTimeZone, parseDateTimeInput } from './dateTime'
import { sqlToRows, rowsToCSV, rowsToJSON } from './sqlToJsonCsv'
import { applyUtmParams, buildUrlWithQueryRows, parseAbsoluteUrl, type ParsedUrlInfo, type QueryRow } from './urlToolkit'
import { useI18n } from '@/lib/i18n'

export function Converters() {
  const { t, lang } = useI18n()
  const sqlTabLabel = 'SQL -> JSON/CSV'
  const dateTimeTabLabel = lang === 'hu' ? 'Dátum és idő' : 'Date & Time'
  const urlToolkitTabLabel = lang === 'hu' ? 'URL Eszköztár' : 'URL Toolkit'
  const markdownTabLabel = lang === 'hu' ? 'Markdown Eszközök' : 'Markdown Tools'
  const jsonPathTabLabel = lang === 'hu' ? 'JSONPath Explorer' : 'JSONPath Explorer'
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
          <TabsTrigger value="jsonpath-explorer">{jsonPathTabLabel}</TabsTrigger>
          <TabsTrigger value="markdown-tools">{markdownTabLabel}</TabsTrigger>
          <TabsTrigger value="url-toolkit">{urlToolkitTabLabel}</TabsTrigger>
          <TabsTrigger value="date-time">{dateTimeTabLabel}</TabsTrigger>
          <TabsTrigger value="sql-converter">{sqlTabLabel}</TabsTrigger>
        </TabsList>
        <TabsContent value="json-csv"><JsonCsvTab /></TabsContent>
        <TabsContent value="json-yaml"><JsonYamlTab /></TabsContent>
        <TabsContent value="csv-cleaner"><CsvCleanerTab /></TabsContent>
        <TabsContent value="paste-table"><PasteTableTab /></TabsContent>
        <TabsContent value="jsonpath-explorer"><JsonPathExplorerTab /></TabsContent>
        <TabsContent value="markdown-tools"><MarkdownToolsTab /></TabsContent>
        <TabsContent value="url-toolkit"><UrlToolkitTab /></TabsContent>
        <TabsContent value="date-time"><DateTimeTab /></TabsContent>
        <TabsContent value="sql-converter"><SqlConverterTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// â”€â”€â”€ JSON â†” CSV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
          <Button size="sm" variant={mode === 'json2csv' ? 'default' : 'outline'} onClick={() => { setMode('json2csv'); setOutput('') }}>JSON -&gt; CSV</Button>
          <Button size="sm" variant={mode === 'csv2json' ? 'default' : 'outline'} onClick={() => { setMode('csv2json'); setOutput('') }}>CSV -&gt; JSON</Button>
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

// â”€â”€â”€ JSON â†” YAML â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
          <Button size="sm" variant={mode === 'json2yaml' ? 'default' : 'outline'} onClick={() => { setMode('json2yaml'); setOutput('') }}>JSON -&gt; YAML</Button>
          <Button size="sm" variant={mode === 'yaml2json' ? 'default' : 'outline'} onClick={() => { setMode('yaml2json'); setOutput('') }}>YAML -&gt; JSON</Button>
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

// â”€â”€â”€ CSV Cleaner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={opts.trimWhitespace} onCheckedChange={(checked) => setOpts({ ...opts, trimWhitespace: checked === true })} />
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

// â”€â”€â”€ Paste Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

interface JsonPathExplorerMatch {
  path: string
  value: unknown
}

interface DynamicCandidate {
  path: string
  label: string
  rows: Record<string, unknown>[]
  rowCount: number
  expandableKeys: string[]
}

interface DynamicFilterRow {
  id: string
  key: string
  operator: 'contains' | 'equals'
  value: string
}

interface LabelValuePair {
  label: string
  value: string
}

function previewValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function normalizeJsonPath(path: string | Array<string | number>): string {
  if (!Array.isArray(path)) return String(path)
  const normalized = path.length === 0
    ? ['$']
    : path[0] === '$'
      ? path
      : ['$', ...path]
  return normalized
    .map((segment, idx) => {
      if (idx === 0) return '$'
      if (typeof segment === 'number') return `[${segment}]`
      const key = String(segment)
      if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) return `.${key}`
      return `['${key.replace(/'/g, "\\'")}']`
    })
    .join('')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isPrimitiveLike(value: unknown): boolean {
  return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

function flattenRowValues(
  row: Record<string, unknown>,
  prefix = '',
  excludeKeys: Set<string> = new Set()
): Record<string, string> {
  const flat: Record<string, string> = {}
  Object.entries(row).forEach(([key, value]) => {
    if (excludeKeys.has(key)) return
    const targetKey = prefix ? `${prefix}.${key}` : key
    if (isPrimitiveLike(value)) {
      flat[targetKey] = previewValue(value)
      return
    }
    if (Array.isArray(value) && value.every((item) => isPrimitiveLike(item))) {
      flat[targetKey] = value.map((item) => previewValue(item)).join(', ')
    }
  })
  return flat
}

function collectDynamicCandidates(root: unknown): DynamicCandidate[] {
  const candidates: DynamicCandidate[] = []

  const walk = (node: unknown, path: Array<string | number>) => {
    if (Array.isArray(node)) {
      const objectRows = node.filter(isRecord) as Record<string, unknown>[]
      if (objectRows.length > 0) {
        const keySet = new Set<string>()
        objectRows.forEach((row) => {
          Object.entries(row).forEach(([key, value]) => {
            if (Array.isArray(value) && value.some(isRecord)) keySet.add(key)
          })
        })
        const normalizedPath = normalizeJsonPath(path)
        candidates.push({
          path: normalizedPath,
          label: `${normalizedPath} [${objectRows.length}]`,
          rows: objectRows,
          rowCount: objectRows.length,
          expandableKeys: Array.from(keySet).sort(),
        })
      }
      node.forEach((item, index) => walk(item, [...path, index]))
      return
    }
    if (!isRecord(node)) return
    Object.entries(node).forEach(([key, value]) => walk(value, [...path, key]))
  }

  walk(root, [])
  return candidates
}

function expandCandidateRows(candidate: DynamicCandidate, expandKey: string): Array<Record<string, string>> {
  if (expandKey === '__none__') {
    return candidate.rows.map((row) => flattenRowValues(row))
  }
  const expanded: Array<Record<string, string>> = []
  candidate.rows.forEach((row) => {
    const parentFlat = flattenRowValues(row, '', new Set([expandKey]))
    const nested = row[expandKey]
    if (!Array.isArray(nested)) {
      expanded.push(parentFlat)
      return
    }
    const objectChildren = nested.filter(isRecord) as Record<string, unknown>[]
    if (objectChildren.length === 0) {
      expanded.push(parentFlat)
      return
    }
    objectChildren.forEach((child) => {
      expanded.push({
        ...parentFlat,
        ...flattenRowValues(child, expandKey),
      })
    })
  })
  return expanded
}

function JsonTreeNode({ label, value, depth }: { label: string; value: unknown; depth: number }) {
  const padding = { paddingLeft: `${depth * 12}px` }
  if (Array.isArray(value)) {
    return (
      <div className="space-y-1">
        <div className="font-mono text-xs" style={padding}>{label}: [array:{value.length}]</div>
        {value.map((item, idx) => (
          <JsonTreeNode key={`${label}-${idx}`} label={`[${idx}]`} value={item} depth={depth + 1} />
        ))}
      </div>
    )
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    return (
      <div className="space-y-1">
        <div className="font-mono text-xs" style={padding}>{label}: {"{object}"}</div>
        {entries.map(([k, v]) => (
          <JsonTreeNode key={`${label}-${k}`} label={k} value={v} depth={depth + 1} />
        ))}
      </div>
    )
  }
  return (
    <div className="font-mono text-xs" style={padding}>
      {label}: <span className="text-muted-foreground">{previewValue(value)}</span>
    </div>
  )
}

function JsonPathExplorerTab() {
  const { lang } = useI18n()
  const ui = lang === 'hu'
    ? {
        title: 'JSONPath Explorer',
        desc: 'JSON tree nézet + JSONPath lekérdezés és találat export.',
        inputJson: 'JSON bemenet',
        treeView: 'Strukturált tree nézet',
        query: 'JSONPath',
        run: 'Lekérdezés',
        analyze: 'JSON elemzése',
        invalidJson: 'Érvénytelen JSON.',
        invalidPath: 'Érvénytelen JSONPath.',
        matches: 'találat',
        path: 'Path',
        value: 'Érték',
        copy: 'Másolás',
        downloadCsv: 'CSV letöltés',
        fieldExtract: 'Dinamikus kivonat',
        fieldExtractDesc: 'Automatikus rekordforrás-felismerés, dinamikus szűrők és label/value párok.',
        analyzeHint: 'Előbb futtasd a JSON elemzést vagy JSONPath lekérdezést.',
        fieldSearch: 'Forrás szűrés',
        fieldSearchPlaceholder: 'pl. options, meta_fields, listings',
        datasetSelect: 'Rekordforrás',
        datasetSelectPlaceholder: 'Válassz rekordforrást',
        datasetPath: 'Forrás útvonal',
        rowsFound: 'sor',
        expandBy: 'Kibontás',
        expandNone: 'Nincs (közvetlen sorok)',
        filters: 'Szűrők',
        addFilter: 'Szűrő hozzáadása',
        filterField: 'Mező',
        filterFieldPlaceholder: 'Mező kiválasztása',
        filterOp: 'Művelet',
        filterContains: 'tartalmazza',
        filterEquals: 'egyenlő',
        filterValue: 'Érték',
        filterValuePlaceholder: 'pl. jelleg',
        labelField: 'Label mező',
        valueField: 'Value mező',
        labelFieldPlaceholder: 'Válassz label mezőt',
        valueFieldPlaceholder: 'Válassz value mezőt',
        outputFormat: 'Kimenet',
        formatPairs: 'label: ... / value: ...',
        formatComma: 'Csak value, vesszővel',
        formatPlain: 'Csak value, soronként',
        formatJson: 'JSON label/value tömb',
        uniqueOnly: 'Csak egyedi értékek',
        pairCount: 'pár',
        preview: 'Előnézet',
        output: 'Kivont kimenet',
        downloadTxt: 'TXT letöltés',
        noDatasets: 'Nem találtam objektum-lista alapú rekordforrást az inputban.',
        noRows: 'Nincs sor a kiválasztott feltételekkel.',
        placeholder: '{\n  \"user\": {\"name\": \"Anna\", \"tags\": [\"pro\", \"beta\"]}\n}',
      }
    : {
        title: 'JSONPath Explorer',
        desc: 'Structured JSON tree view with JSONPath query and export.',
        inputJson: 'JSON input',
        treeView: 'Structured tree view',
        query: 'JSONPath',
        run: 'Query',
        analyze: 'Analyze JSON',
        invalidJson: 'Invalid JSON.',
        invalidPath: 'Invalid JSONPath.',
        matches: 'matches',
        path: 'Path',
        value: 'Value',
        copy: 'Copy',
        downloadCsv: 'Download CSV',
        fieldExtract: 'Dynamic extractor',
        fieldExtractDesc: 'Auto-discovered record sources, dynamic filters, and label/value pairs.',
        analyzeHint: 'Run JSON analysis or JSONPath query first.',
        fieldSearch: 'Source filter',
        fieldSearchPlaceholder: 'e.g. options, meta_fields, listings',
        datasetSelect: 'Record source',
        datasetSelectPlaceholder: 'Select record source',
        datasetPath: 'Source path',
        rowsFound: 'rows',
        expandBy: 'Expand by',
        expandNone: 'None (direct rows)',
        filters: 'Filters',
        addFilter: 'Add filter',
        filterField: 'Field',
        filterFieldPlaceholder: 'Select field',
        filterOp: 'Operator',
        filterContains: 'contains',
        filterEquals: 'equals',
        filterValue: 'Value',
        filterValuePlaceholder: 'e.g. jelleg',
        labelField: 'Label field',
        valueField: 'Value field',
        labelFieldPlaceholder: 'Select label field',
        valueFieldPlaceholder: 'Select value field',
        outputFormat: 'Output',
        formatPairs: 'label: ... / value: ...',
        formatComma: 'value only, comma',
        formatPlain: 'value only, plain',
        formatJson: 'JSON label/value array',
        uniqueOnly: 'Unique values only',
        pairCount: 'pairs',
        preview: 'Preview',
        output: 'Extracted output',
        downloadTxt: 'Download TXT',
        noDatasets: 'No object-array based record sources found in input.',
        noRows: 'No rows match the selected conditions.',
        placeholder: '{\n  \"user\": {\"name\": \"Anna\", \"tags\": [\"pro\", \"beta\"]}\n}',
      }

  const [input, setInput] = useState(ui.placeholder)
  const [query, setQuery] = useState('$.user.tags[*]')
  const [root, setRoot] = useState<unknown | null>(null)
  const [matches, setMatches] = useState<JsonPathExplorerMatch[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [fieldFilter, setFieldFilter] = useState('')
  const [selectedCandidatePath, setSelectedCandidatePath] = useState('')
  const [expandKey, setExpandKey] = useState('__none__')
  const [filters, setFilters] = useState<DynamicFilterRow[]>([{ id: 'f-1', key: '', operator: 'contains', value: '' }])
  const [labelKey, setLabelKey] = useState('')
  const [valueKey, setValueKey] = useState('')
  const [outputMode, setOutputMode] = useState<'pairs' | 'comma' | 'plain' | 'json'>('pairs')
  const [uniqueOnly, setUniqueOnly] = useState(true)
  const [extractCopied, setExtractCopied] = useState(false)

  const parseInput = (): unknown | null => {
    try {
      const parsed = JSON.parse(input)
      setError('')
      return parsed
    } catch {
      setError(ui.invalidJson)
      setRoot(null)
      setMatches([])
      return null
    }
  }

  const analyzeJson = () => {
    const parsed = parseInput()
    if (parsed === null) return
    setRoot(parsed)
  }

  const run = () => {
    const parsed = parseInput()
    if (parsed === null) return
    try {
      const parsedJson = parsed as string | number | boolean | null | Record<string, unknown> | unknown[]
      const raw = JSONPath({
        path: query.trim() || '$',
        json: parsedJson,
        resultType: 'all',
        wrap: true,
      }) as unknown as Array<{ path: string | Array<string | number>; value: unknown }>
      const nextMatches = raw.map((m) => ({
        path: normalizeJsonPath(m.path),
        value: m.value,
      }))
      setRoot(parsed)
      setMatches(nextMatches)
      setError('')
    } catch {
      setRoot(parsed)
      setMatches([])
      setError(ui.invalidPath)
    }
  }

  const copyMatches = async () => {
    await copyToClipboard(JSON.stringify(matches, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const downloadMatchesCsv = () => {
    if (matches.length === 0) return
    const rows = matches.map((m) => ({
      path: m.path,
      value: previewValue(m.value),
    }))
    downloadFile(Papa.unparse(rows), 'jsonpath-results.csv', 'text/csv')
  }

  const candidateSources = useMemo<DynamicCandidate[]>(() => {
    if (root === null) return []
    const locale = lang === 'hu' ? 'hu' : 'en'
    return collectDynamicCandidates(root)
      .sort((a, b) => a.path.localeCompare(b.path, locale, { sensitivity: 'base' }))
  }, [root, lang])

  const filteredSources = useMemo(() => {
    const q = fieldFilter.trim().toLowerCase()
    if (!q) return candidateSources
    return candidateSources.filter((source) =>
      source.path.toLowerCase().includes(q) || source.label.toLowerCase().includes(q)
    )
  }, [candidateSources, fieldFilter])

  useEffect(() => {
    if (candidateSources.length === 0) {
      setSelectedCandidatePath('')
      setExpandKey('__none__')
      return
    }
    if (!candidateSources.some((source) => source.path === selectedCandidatePath)) {
      setSelectedCandidatePath(candidateSources[0].path)
    }
  }, [candidateSources, selectedCandidatePath])

  const selectedSource = useMemo(
    () => candidateSources.find((source) => source.path === selectedCandidatePath) ?? null,
    [candidateSources, selectedCandidatePath]
  )

  useEffect(() => {
    if (!selectedSource) {
      setExpandKey('__none__')
      return
    }
    if (expandKey !== '__none__' && !selectedSource.expandableKeys.includes(expandKey)) {
      setExpandKey('__none__')
    }
  }, [selectedSource, expandKey])

  const workingRows = useMemo(() => {
    if (!selectedSource) return []
    return expandCandidateRows(selectedSource, expandKey)
  }, [selectedSource, expandKey])

  const availableFields = useMemo(() => {
    const locale = lang === 'hu' ? 'hu' : 'en'
    return Array.from(new Set(workingRows.flatMap((row) => Object.keys(row))))
      .sort((a, b) => a.localeCompare(b, locale, { sensitivity: 'base' }))
  }, [workingRows, lang])

  useEffect(() => {
    if (availableFields.length === 0) {
      setLabelKey('')
      setValueKey('')
      return
    }
    if (!availableFields.includes(labelKey)) {
      const fallback = availableFields.find((key) => /label|name|title/i.test(key)) ?? availableFields[0]
      setLabelKey(fallback)
    }
    if (!availableFields.includes(valueKey)) {
      const fallback = availableFields.find((key) => /value|id|slug|code/i.test(key)) ?? availableFields[0]
      setValueKey(fallback)
    }
  }, [availableFields, labelKey, valueKey])

  useEffect(() => {
    setFilters((prev) =>
      prev.map((row) => (row.key && !availableFields.includes(row.key) ? { ...row, key: '' } : row))
    )
  }, [availableFields])

  const filteredRows = useMemo(() => {
    const activeFilters = filters.filter((row) => row.key && row.value.trim())
    if (activeFilters.length === 0) return workingRows
    return workingRows.filter((row) =>
      activeFilters.every((filterRow) => {
        const target = String(row[filterRow.key] ?? '').toLowerCase()
        const term = filterRow.value.trim().toLowerCase()
        if (!term) return true
        if (filterRow.operator === 'equals') return target === term
        return target.includes(term)
      })
    )
  }, [workingRows, filters])

  const pairs = useMemo<LabelValuePair[]>(() => {
    if (!labelKey || !valueKey) return []
    const rawPairs = filteredRows
      .map((row) => ({
        label: String(row[labelKey] ?? '').trim(),
        value: String(row[valueKey] ?? '').trim(),
      }))
      .filter((pair) => pair.label || pair.value)
    if (!uniqueOnly) return rawPairs
    const seen = new Set<string>()
    return rawPairs.filter((pair) => {
      const key = `${pair.label}\u0000${pair.value}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [filteredRows, labelKey, valueKey, uniqueOnly])

  const valueOnlyList = useMemo(() => {
    const values = pairs.map((pair) => pair.value).filter(Boolean)
    return uniqueOnly ? Array.from(new Set(values)) : values
  }, [pairs, uniqueOnly])

  const extractedOutput = useMemo(() => {
    if (outputMode === 'pairs') {
      return pairs.map((pair) => `label: ${pair.label} / value: ${pair.value}`).join('\n')
    }
    if (outputMode === 'comma') return valueOnlyList.join(', ')
    if (outputMode === 'plain') return valueOnlyList.join('\n')
    return JSON.stringify(pairs, null, 2)
  }, [outputMode, pairs, valueOnlyList])

  const createFilterRow = (): DynamicFilterRow => ({
    id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    key: '',
    operator: 'contains',
    value: '',
  })

  const addFilter = () => {
    setFilters((prev) => [...prev, createFilterRow()])
  }

  const updateFilter = (id: string, patch: Partial<DynamicFilterRow>) => {
    setFilters((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const removeFilter = (id: string) => {
    setFilters((prev) => {
      const next = prev.filter((row) => row.id !== id)
      return next.length > 0 ? next : [createFilterRow()]
    })
  }

  const copyExtracted = async () => {
    if (!extractedOutput) return
    await copyToClipboard(extractedOutput)
    setExtractCopied(true)
    setTimeout(() => setExtractCopied(false), 1500)
  }

  const downloadExtracted = () => {
    if (!extractedOutput) return
    downloadFile(extractedOutput, 'meta-field-values.txt', 'text/plain')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ui.title}</CardTitle>
        <CardDescription>{ui.desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{ui.inputJson}</Label>
            <Textarea
              className="font-mono text-xs h-52"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={ui.placeholder}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{ui.treeView}</Label>
            <div className="h-52 overflow-auto rounded-md border bg-muted/10 p-2">
              {root === null ? (
                <p className="text-xs text-muted-foreground">-</p>
              ) : (
                <JsonTreeNode label="$" value={root} depth={0} />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input className="font-mono text-xs" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="$.items[*].id" />
          <Button size="sm" variant="outline" onClick={analyzeJson}>{ui.analyze}</Button>
          <Button size="sm" onClick={run}>{ui.run}</Button>
          <Badge variant="secondary">{matches.length} {ui.matches}</Badge>
          <Button size="sm" variant="outline" onClick={copyMatches}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            {ui.copy}
          </Button>
          <Button size="sm" variant="outline" onClick={downloadMatchesCsv}>
            <Download className="h-4 w-4" />
            {ui.downloadCsv}
          </Button>
        </div>

        <div className="space-y-3 rounded-md border p-3">
          <div>
            <Label>{ui.fieldExtract}</Label>
            <p className="text-xs text-muted-foreground mt-1">{ui.fieldExtractDesc}</p>
          </div>

          {root === null ? (
            <p className="text-xs text-muted-foreground">{ui.analyzeHint}</p>
          ) : candidateSources.length === 0 ? (
            <p className="text-xs text-muted-foreground">{ui.noDatasets}</p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{ui.fieldSearch}</Label>
                  <Input value={fieldFilter} onChange={(e) => setFieldFilter(e.target.value)} placeholder={ui.fieldSearchPlaceholder} />
                </div>
                <div className="space-y-1.5">
                  <Label>{ui.datasetSelect}</Label>
                  <Select value={selectedCandidatePath} onValueChange={setSelectedCandidatePath}>
                    <SelectTrigger>
                      <SelectValue placeholder={ui.datasetSelectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSources.map((source) => (
                        <SelectItem key={source.path} value={source.path}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedSource && <Badge variant="secondary">{selectedSource.rowCount} {ui.rowsFound}</Badge>}
                <Badge variant="outline">{pairs.length} {ui.pairCount}</Badge>
                <Select value={expandKey} onValueChange={setExpandKey}>
                  <SelectTrigger className="w-[260px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{ui.expandNone}</SelectItem>
                    {(selectedSource?.expandableKeys ?? []).map((key) => (
                      <SelectItem key={key} value={key}>{key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={outputMode} onValueChange={(value) => setOutputMode(value as 'pairs' | 'comma' | 'plain' | 'json')}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pairs">{ui.formatPairs}</SelectItem>
                    <SelectItem value="comma">{ui.formatComma}</SelectItem>
                    <SelectItem value="plain">{ui.formatPlain}</SelectItem>
                    <SelectItem value="json">{ui.formatJson}</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={uniqueOnly} onCheckedChange={(checked) => setUniqueOnly(checked === true)} />
                  {ui.uniqueOnly}
                </label>
                <Button size="sm" variant="outline" onClick={copyExtracted}>
                  {extractCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {ui.copy}
                </Button>
                <Button size="sm" variant="outline" onClick={downloadExtracted}>
                  <Download className="h-4 w-4" />
                  {ui.downloadTxt}
                </Button>
              </div>

              {selectedSource && (
                <p className="text-xs text-muted-foreground font-mono">{ui.datasetPath}: {selectedSource.path}</p>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{ui.labelField}</Label>
                  <Select value={labelKey} onValueChange={setLabelKey}>
                    <SelectTrigger>
                      <SelectValue placeholder={ui.labelFieldPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={`label-${field}`} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{ui.valueField}</Label>
                  <Select value={valueKey} onValueChange={setValueKey}>
                    <SelectTrigger>
                      <SelectValue placeholder={ui.valueFieldPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={`value-${field}`} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <Label>{ui.filters}</Label>
                  <Button size="sm" variant="outline" onClick={addFilter}>
                    <Plus className="mr-1 h-3 w-3" />
                    {ui.addFilter}
                  </Button>
                </div>
                <div className="space-y-2">
                  {filters.map((filterRow) => (
                    <div key={filterRow.id} className="grid gap-2 md:grid-cols-[1fr_180px_1fr_auto]">
                      <Select value={filterRow.key} onValueChange={(value) => updateFilter(filterRow.id, { key: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder={ui.filterFieldPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.map((field) => (
                            <SelectItem key={`${filterRow.id}-${field}`} value={field}>{field}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={filterRow.operator} onValueChange={(value) => updateFilter(filterRow.id, { operator: value as 'contains' | 'equals' })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contains">{ui.filterContains}</SelectItem>
                          <SelectItem value="equals">{ui.filterEquals}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={filterRow.value}
                        onChange={(e) => updateFilter(filterRow.id, { value: e.target.value })}
                        placeholder={ui.filterValuePlaceholder}
                      />
                      <Button size="sm" variant="ghost" onClick={() => removeFilter(filterRow.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{ui.preview}</Label>
                {filteredRows.length === 0 ? (
                  <div className="rounded-md border p-2 text-xs text-muted-foreground">{ui.noRows}</div>
                ) : (
                  <div className="max-h-52 overflow-auto rounded-md border">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          {availableFields.slice(0, 6).map((field) => (
                            <th key={field} className="px-2 py-1.5 text-left">{field}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.slice(0, 60).map((row, idx) => (
                          <tr key={`row-${idx}`} className="border-b hover:bg-muted/30">
                            {availableFields.slice(0, 6).map((field) => (
                              <td key={`${idx}-${field}`} className="px-2 py-1.5 font-mono">{row[field] ?? ''}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>{ui.output}</Label>
                {extractedOutput ? (
                  <Textarea className="font-mono text-xs h-28" value={extractedOutput} readOnly />
                ) : (
                  <div className="rounded-md border p-2 text-xs text-muted-foreground">{ui.noRows}</div>
                )}
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {matches.length > 0 && (
          <div className="max-h-64 overflow-auto rounded-md border">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-2 py-1.5 text-left">{ui.path}</th>
                  <th className="px-2 py-1.5 text-left">{ui.value}</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m, idx) => (
                  <tr key={`${m.path}-${idx}`} className="border-b hover:bg-muted/30">
                    <td className="px-2 py-1.5 font-mono">{m.path}</td>
                    <td className="px-2 py-1.5 font-mono">{previewValue(m.value)}</td>
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

function MarkdownToolsTab() {
  const { lang } = useI18n()
  const ui = lang === 'hu'
    ? {
        title: 'Markdown Eszközök',
        desc: 'Markdown és HTML konverzió: Markdown -> HTML/Plain, HTML -> Markdown.',
        mdToHtml: 'Markdown -> HTML',
        mdToPlain: 'Markdown -> Plain',
        htmlToMd: 'HTML -> Markdown',
        convert: 'Konvertálás',
        input: 'Bemenet',
        output: 'Kimenet',
        copy: 'Másolás',
        download: 'Letöltés',
        placeholderMd: '# Cím\n\nEz **félkövér** és ez [link](https://example.com).',
        placeholderHtml: '<h1>Title</h1><p><strong>bold</strong> text</p>',
      }
    : {
        title: 'Markdown Tools',
        desc: 'Markdown and HTML conversions: Markdown -> HTML/Plain, HTML -> Markdown.',
        mdToHtml: 'Markdown -> HTML',
        mdToPlain: 'Markdown -> Plain',
        htmlToMd: 'HTML -> Markdown',
        convert: 'Convert',
        input: 'Input',
        output: 'Output',
        copy: 'Copy',
        download: 'Download',
        placeholderMd: '# Title\n\nThis is **bold** and this is a [link](https://example.com).',
        placeholderHtml: '<h1>Title</h1><p><strong>bold</strong> text</p>',
      }

  const [mode, setMode] = useState<'md2html' | 'md2plain' | 'html2md'>('md2html')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const run = () => {
    const result = mode === 'md2html'
      ? markdownToHtml(input)
      : mode === 'md2plain'
        ? markdownToPlain(input)
        : htmlToMarkdown(input)
    setOutput(result.result)
    setError(result.error ?? '')
  }

  const copy = async () => {
    await copyToClipboard(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    if (!output) return
    const ext = mode === 'md2html' ? 'html' : mode === 'md2plain' ? 'txt' : 'md'
    const mime = mode === 'md2html' ? 'text/html' : 'text/plain'
    downloadFile(output, `markdown-convert.${ext}`, mime)
  }

  const placeholder = mode === 'html2md' ? ui.placeholderHtml : ui.placeholderMd

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ui.title}</CardTitle>
        <CardDescription>{ui.desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant={mode === 'md2html' ? 'default' : 'outline'} onClick={() => setMode('md2html')}>
            {ui.mdToHtml}
          </Button>
          <Button size="sm" variant={mode === 'md2plain' ? 'default' : 'outline'} onClick={() => setMode('md2plain')}>
            {ui.mdToPlain}
          </Button>
          <Button size="sm" variant={mode === 'html2md' ? 'default' : 'outline'} onClick={() => setMode('html2md')}>
            {ui.htmlToMd}
          </Button>
          <Button size="sm" onClick={run}>{ui.convert}</Button>
        </div>
        <TwoPanel
          input={input}
          onInput={setInput}
          output={output}
          error={error}
          onCopy={copy}
          onDownload={download}
          copied={copied}
          inputLabel={ui.input}
          outputLabel={ui.output}
          inputPlaceholder={placeholder}
        />
      </CardContent>
    </Card>
  )
}

function UrlToolkitTab() {
  const { lang } = useI18n()
  const ui = lang === 'hu'
    ? {
        title: 'URL Eszköztár',
        desc: 'Parser, query param szerkesztő, batch UTM generálás, URL encode/decode.',
        inputUrl: 'URL',
        parse: 'Parse',
        applyParams: 'Paraméterek alkalmazása',
        copyUrl: 'URL másolása',
        invalidUrl: 'Érvénytelen abszolút URL (pl. https://example.com).',
        protocol: 'Protokoll',
        host: 'Host',
        path: 'Útvonal',
        queryCount: 'Paraméterek',
        queryEditor: 'Query paraméter szerkesztő',
        addParam: 'Paraméter hozzáadása',
        emptyParams: 'Nincs query paraméter.',
        key: 'Kulcs',
        value: 'Érték',
        urlCodec: 'URL encode/decode',
        encode: 'Encode',
        decode: 'Decode',
        codecInput: 'Bemenet',
        codecOutput: 'Kimenet',
        codecError: 'Nem dekódolható URL.',
        batchTitle: 'Batch UTM Builder (CSV)',
        batchDesc: 'CSV bemenetből generált UTM URL-ek. Kötelező oszlop: url',
        batchRun: 'UTM generálás',
        batchEmpty: 'Nincs feldolgozható CSV sor.',
        batchMissingUrl: 'Hiányzó url oszlop',
        batchInvalidUrl: 'Érvénytelen URL',
        rows: 'sor',
        ok: 'sikeres',
        errors: 'hibás',
        batchInput: 'CSV bemenet',
        batchOutput: 'CSV kimenet',
        copyCsv: 'CSV másolása',
        downloadCsv: 'CSV letöltés',
        sampleCsv: 'url,utm_source,utm_medium,utm_campaign,utm_content',
      }
    : {
        title: 'URL Toolkit',
        desc: 'URL parser, query param editor, batch UTM builder, URL encode/decode.',
        inputUrl: 'URL',
        parse: 'Parse',
        applyParams: 'Apply params',
        copyUrl: 'Copy URL',
        invalidUrl: 'Invalid absolute URL (e.g. https://example.com).',
        protocol: 'Protocol',
        host: 'Host',
        path: 'Path',
        queryCount: 'Query params',
        queryEditor: 'Query param editor',
        addParam: 'Add param',
        emptyParams: 'No query params.',
        key: 'Key',
        value: 'Value',
        urlCodec: 'URL encode/decode',
        encode: 'Encode',
        decode: 'Decode',
        codecInput: 'Input',
        codecOutput: 'Output',
        codecError: 'Cannot decode URL.',
        batchTitle: 'Batch UTM Builder (CSV)',
        batchDesc: 'Build UTM URLs from CSV rows. Required column: url',
        batchRun: 'Build UTM URLs',
        batchEmpty: 'No parsable CSV rows.',
        batchMissingUrl: 'Missing url column',
        batchInvalidUrl: 'Invalid URL',
        rows: 'rows',
        ok: 'ok',
        errors: 'errors',
        batchInput: 'CSV input',
        batchOutput: 'CSV output',
        copyCsv: 'Copy CSV',
        downloadCsv: 'Download CSV',
        sampleCsv: 'url,utm_source,utm_medium,utm_campaign,utm_content',
      }

  const [urlInput, setUrlInput] = useState('')
  const [parsedInfo, setParsedInfo] = useState<ParsedUrlInfo | null>(null)
  const [queryRows, setQueryRows] = useState<QueryRow[]>([])
  const [urlError, setUrlError] = useState('')
  const [urlCopied, setUrlCopied] = useState(false)

  const [codecInput, setCodecInput] = useState('')
  const [codecOutput, setCodecOutput] = useState('')
  const [codecError, setCodecError] = useState('')

  const [batchInput, setBatchInput] = useState(
    `${ui.sampleCsv}\nhttps://example.com/article,newsletter,email,spring_launch,cta_top`
  )
  const [batchOutput, setBatchOutput] = useState('')
  const [batchError, setBatchError] = useState('')
  const [batchStats, setBatchStats] = useState<{ total: number; ok: number; errors: number } | null>(null)
  const [batchCopied, setBatchCopied] = useState(false)

  const parseUrl = (value?: string) => {
    const source = (value ?? urlInput).trim()
    const parsed = parseAbsoluteUrl(source)
    if (!parsed.info) {
      setUrlError(ui.invalidUrl)
      setParsedInfo(null)
      setQueryRows([])
      return
    }
    setUrlInput(parsed.info.href)
    setParsedInfo(parsed.info)
    setQueryRows(parsed.queryRows ?? [])
    setUrlError('')
  }

  const addQueryRow = () => {
    setQueryRows((prev) => [...prev, { id: `q-${Date.now()}-${prev.length}`, key: '', value: '' }])
  }

  const updateQueryRow = (id: string, patch: Partial<QueryRow>) => {
    setQueryRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const removeQueryRow = (id: string) => {
    setQueryRows((prev) => prev.filter((row) => row.id !== id))
  }

  const applyParams = () => {
    const built = buildUrlWithQueryRows(urlInput, queryRows)
    if (!built.url) {
      setUrlError(ui.invalidUrl)
      return
    }
    parseUrl(built.url)
  }

  const copyCurrentUrl = async () => {
    if (!urlInput.trim()) return
    await copyToClipboard(urlInput.trim())
    setUrlCopied(true)
    setTimeout(() => setUrlCopied(false), 1500)
  }

  const runEncode = () => {
    setCodecError('')
    setCodecOutput(encodeURI(codecInput))
  }

  const runDecode = () => {
    try {
      setCodecError('')
      setCodecOutput(decodeURI(codecInput))
    } catch {
      setCodecOutput('')
      setCodecError(ui.codecError)
    }
  }

  const runBatchUtm = () => {
    const parsed = Papa.parse<Record<string, string>>(batchInput, {
      header: true,
      skipEmptyLines: true,
    })

    const rows = parsed.data ?? []
    if (rows.length === 0) {
      setBatchError(ui.batchEmpty)
      setBatchOutput('')
      setBatchStats(null)
      return
    }

    let ok = 0
    let errorCount = 0
    const outRows = rows.map((row) => {
      const baseUrl = String(row.url ?? row.URL ?? '').trim()
      if (!baseUrl) {
        errorCount++
        return { ...row, generated_url: '', error: ui.batchMissingUrl }
      }
      const built = applyUtmParams(baseUrl, {
        utm_source: String(row.utm_source ?? ''),
        utm_medium: String(row.utm_medium ?? ''),
        utm_campaign: String(row.utm_campaign ?? ''),
        utm_term: String(row.utm_term ?? ''),
        utm_content: String(row.utm_content ?? ''),
        utm_id: String(row.utm_id ?? ''),
      })
      if (!built.url) {
        errorCount++
        return { ...row, generated_url: '', error: ui.batchInvalidUrl }
      }
      ok++
      return { ...row, generated_url: built.url, error: '' }
    })

    setBatchOutput(Papa.unparse(outRows))
    setBatchStats({ total: outRows.length, ok, errors: errorCount })
    setBatchError('')
  }

  const copyBatchOutput = async () => {
    if (!batchOutput) return
    await copyToClipboard(batchOutput)
    setBatchCopied(true)
    setTimeout(() => setBatchCopied(false), 1500)
  }

  const downloadBatchOutput = () => {
    if (!batchOutput) return
    downloadFile(batchOutput, 'utm-generated.csv', 'text/csv')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ui.title}</CardTitle>
        <CardDescription>{ui.desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>{ui.inputUrl}</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/path?utm_source=x"
            />
            <Button size="sm" onClick={() => parseUrl()}>{ui.parse}</Button>
            <Button size="sm" variant="outline" onClick={applyParams}>{ui.applyParams}</Button>
            <Button size="sm" variant="ghost" onClick={copyCurrentUrl}>
              {urlCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {ui.copyUrl}
            </Button>
          </div>
          {urlError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-2 text-xs text-destructive">
              {urlError}
            </div>
          )}
          {parsedInfo && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{ui.protocol}: {parsedInfo.protocol}</Badge>
              <Badge variant="secondary">{ui.host}: {parsedInfo.host}</Badge>
              <Badge variant="secondary">{ui.path}: {parsedInfo.pathname}</Badge>
              <Badge variant="outline">{ui.queryCount}: {queryRows.length}</Badge>
            </div>
          )}
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label>{ui.queryEditor}</Label>
              <Button size="sm" variant="outline" onClick={addQueryRow}>
                <Plus className="mr-1 h-3 w-3" />
                {ui.addParam}
              </Button>
            </div>
            {queryRows.length === 0 ? (
              <p className="text-xs text-muted-foreground">{ui.emptyParams}</p>
            ) : (
              <div className="space-y-2">
                {queryRows.map((row) => (
                  <div key={row.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <Input value={row.key} placeholder={ui.key} onChange={(e) => updateQueryRow(row.id, { key: e.target.value })} />
                    <Input value={row.value} placeholder={ui.value} onChange={(e) => updateQueryRow(row.id, { value: e.target.value })} />
                    <Button size="sm" variant="ghost" onClick={() => removeQueryRow(row.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label>{ui.urlCodec}</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={runEncode}>{ui.encode}</Button>
            <Button size="sm" variant="outline" onClick={runDecode}>{ui.decode}</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{ui.codecInput}</Label>
              <Textarea className="font-mono text-xs h-28" value={codecInput} onChange={(e) => setCodecInput(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{ui.codecOutput}</Label>
              {codecError ? (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 p-2 text-xs text-destructive">{codecError}</div>
              ) : (
                <Textarea className="font-mono text-xs h-28" value={codecOutput} readOnly />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label>{ui.batchTitle}</Label>
            <p className="text-xs text-muted-foreground mt-1">{ui.batchDesc}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={runBatchUtm}>{ui.batchRun}</Button>
            <Button size="sm" variant="outline" onClick={copyBatchOutput}>
              {batchCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {ui.copyCsv}
            </Button>
            <Button size="sm" variant="outline" onClick={downloadBatchOutput}>
              <Download className="h-4 w-4" />
              {ui.downloadCsv}
            </Button>
          </div>
          {batchError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-2 text-xs text-destructive">
              {batchError}
            </div>
          )}
          {batchStats && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{batchStats.total} {ui.rows}</Badge>
              <Badge className="bg-green-600 text-white">{ui.ok}: {batchStats.ok}</Badge>
              <Badge className="bg-red-600 text-white">{ui.errors}: {batchStats.errors}</Badge>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{ui.batchInput}</Label>
              <Textarea className="font-mono text-xs h-36" value={batchInput} onChange={(e) => setBatchInput(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{ui.batchOutput}</Label>
              <Textarea className="font-mono text-xs h-36" value={batchOutput} readOnly />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const COMMON_TIMEZONES = [
  'UTC',
  'Europe/Budapest',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Australia/Sydney',
]

function getAllTimeZones(localTimeZone: string): string[] {
  const intlWithSupportedValues = Intl as unknown as {
    supportedValuesOf?: (key: string) => string[]
  }
  const supported = typeof intlWithSupportedValues.supportedValuesOf === 'function'
    ? intlWithSupportedValues.supportedValuesOf('timeZone')
    : []
  if (!supported || supported.length === 0) {
    return Array.from(new Set([localTimeZone, ...COMMON_TIMEZONES]))
  }
  return Array.from(new Set(['UTC', localTimeZone, ...supported]))
}

function filterTimezones(options: string[], query: string, selected: string): string[] {
  const q = query.trim().toLowerCase()
  const filtered = q.length === 0
    ? options
    : options.filter((tz) => tz.toLowerCase().includes(q))
  if (filtered.includes(selected)) return filtered
  return [selected, ...filtered]
}

interface DateTimeBatchRow {
  line: number
  input: string
  status: 'ok' | 'error'
  iso: string
  unixSec: string
  unixMs: string
  target: string
  error: string
}

function DateTimeTab() {
  const { lang } = useI18n()
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const timezoneOptions = useMemo(
    () => getAllTimeZones(localTimeZone),
    [localTimeZone]
  )
  const ui = lang === 'hu'
    ? {
        title: 'Dátum és idő konverter',
        desc: 'ISO / Unix / RFC2822 + időzóna átváltás offline.',
        sourceTz: 'Forrás időzóna',
        targetTz: 'Cél időzóna',
        useLocal: 'Helyi',
        useUtc: 'UTC',
        inputLabel: 'Bemenet (több sor lehet)',
        convert: 'Konvertálás',
        invalidSource: 'Érvénytelen forrás időzóna.',
        invalidTarget: 'Érvénytelen cél időzóna.',
        emptyInput: 'Nincs bemenet.',
        noSuccess: 'Egyik sor sem volt érvényesen parse-olható.',
        parsedAs: 'Parser',
        iso: 'ISO (UTC)',
        unixSec: 'Unix sec',
        unixMs: 'Unix ms',
        rfc2822: 'RFC2822',
        sourceTime: 'Forrás időzónában',
        targetTime: 'Cél időzónában',
        sourceOffset: 'Forrás offset',
        targetOffset: 'Cél offset',
        rows: 'Sorok',
        okRows: 'sikeres',
        errorRows: 'hibás',
        status: 'Státusz',
        ok: 'ok',
        error: 'hiba',
        copy: 'Másolás',
        txt: 'TXT',
        csv: 'CSV',
        searchTimezone: 'Időzóna keresés',
        noTimezoneMatch: 'Nincs találat a szűrőre.',
        placeholder: '2026-02-18 14:30:00\n2026-02-18T14:30:00Z\n1739889000',
      }
    : {
        title: 'Date & Time Converter',
        desc: 'ISO / Unix / RFC2822 + offline timezone conversion.',
        sourceTz: 'Source timezone',
        targetTz: 'Target timezone',
        useLocal: 'Local',
        useUtc: 'UTC',
        inputLabel: 'Input (multiple lines supported)',
        convert: 'Convert',
        invalidSource: 'Invalid source timezone.',
        invalidTarget: 'Invalid target timezone.',
        emptyInput: 'Input is empty.',
        noSuccess: 'No line could be parsed successfully.',
        parsedAs: 'Parsed as',
        iso: 'ISO (UTC)',
        unixSec: 'Unix sec',
        unixMs: 'Unix ms',
        rfc2822: 'RFC2822',
        sourceTime: 'In source timezone',
        targetTime: 'In target timezone',
        sourceOffset: 'Source offset',
        targetOffset: 'Target offset',
        rows: 'Rows',
        okRows: 'ok',
        errorRows: 'error',
        status: 'Status',
        ok: 'ok',
        error: 'error',
        copy: 'Copy',
        txt: 'TXT',
        csv: 'CSV',
        searchTimezone: 'Search timezone',
        noTimezoneMatch: 'No timezone matches the current filter.',
        placeholder: '2026-02-18 14:30:00\n2026-02-18T14:30:00Z\n1739889000',
      }

  const [sourceTimeZone, setSourceTimeZone] = useState('UTC')
  const [targetTimeZone, setTargetTimeZone] = useState(localTimeZone)
  const [sourceTzQuery, setSourceTzQuery] = useState('')
  const [targetTzQuery, setTargetTzQuery] = useState('')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [batchRows, setBatchRows] = useState<DateTimeBatchRow[]>([])
  const [detailText, setDetailText] = useState('')
  const [copied, setCopied] = useState(false)
  const filteredSourceTimezones = useMemo(
    () => filterTimezones(timezoneOptions, sourceTzQuery, sourceTimeZone),
    [timezoneOptions, sourceTzQuery, sourceTimeZone]
  )
  const filteredTargetTimezones = useMemo(
    () => filterTimezones(timezoneOptions, targetTzQuery, targetTimeZone),
    [timezoneOptions, targetTzQuery, targetTimeZone]
  )

  const run = () => {
    if (!isValidTimeZone(sourceTimeZone)) {
      setError(ui.invalidSource)
      setBatchRows([])
      setDetailText('')
      return
    }
    if (!isValidTimeZone(targetTimeZone)) {
      setError(ui.invalidTarget)
      setBatchRows([])
      setDetailText('')
      return
    }

    const lines = input
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length === 0) {
      setError(ui.emptyInput)
      setBatchRows([])
      setDetailText('')
      return
    }

    const rows: DateTimeBatchRow[] = []
    let firstDetail = ''
    let okCount = 0

    lines.forEach((line, idx) => {
      const parsed = parseDateTimeInput(line, sourceTimeZone)
      if (!parsed.parsed) {
        rows.push({
          line: idx + 1,
          input: line,
          status: 'error',
          iso: '',
          unixSec: '',
          unixMs: '',
          target: '',
          error: parsed.error ?? 'parse error',
        })
        return
      }

      const date = parsed.parsed.date
      const unixMs = String(date.getTime())
      const unixSec = String(Math.floor(date.getTime() / 1000))
      const iso = date.toISOString()
      const sourceLocal = formatInTimeZone(date, sourceTimeZone)
      const targetLocal = formatInTimeZone(date, targetTimeZone)
      const sourceOffset = formatOffset(getTimeZoneOffsetMinutes(date, sourceTimeZone))
      const targetOffset = formatOffset(getTimeZoneOffsetMinutes(date, targetTimeZone))
      okCount++

      rows.push({
        line: idx + 1,
        input: line,
        status: 'ok',
        iso,
        unixSec,
        unixMs,
        target: targetLocal,
        error: '',
      })

      if (!firstDetail) {
        firstDetail = [
          `${ui.parsedAs}: ${parsed.parsed.inputType}`,
          `${ui.iso}: ${iso}`,
          `${ui.unixSec}: ${unixSec}`,
          `${ui.unixMs}: ${unixMs}`,
          `${ui.rfc2822}: ${date.toUTCString()}`,
          `${ui.sourceTime} (${sourceTimeZone}): ${sourceLocal}`,
          `${ui.targetTime} (${targetTimeZone}): ${targetLocal}`,
          `${ui.sourceOffset}: ${sourceOffset}`,
          `${ui.targetOffset}: ${targetOffset}`,
        ].join('\n')
      }
    })

    setBatchRows(rows)
    setDetailText(firstDetail)
    setError(okCount === 0 ? ui.noSuccess : '')
  }

  const copy = async () => {
    if (!detailText) return
    await copyToClipboard(detailText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const downloadTxt = () => {
    if (batchRows.length === 0) return
    const text = batchRows
      .map((row) =>
        row.status === 'ok'
          ? `#${row.line}\t${row.input}\t${row.iso}\t${row.unixSec}\t${row.unixMs}\t${row.target}`
          : `#${row.line}\t${row.input}\tERROR\t${row.error}`
      )
      .join('\n')
    downloadFile(text, 'datetime-convert.txt', 'text/plain')
  }

  const downloadCsv = () => {
    if (batchRows.length === 0) return
    downloadFile(Papa.unparse(batchRows), 'datetime-convert.csv', 'text/csv')
  }

  const okRows = batchRows.filter((row) => row.status === 'ok').length
  const errorRows = batchRows.length - okRows

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ui.title}</CardTitle>
        <CardDescription>{ui.desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{ui.sourceTz}</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                className="w-[240px]"
                value={sourceTzQuery}
                onChange={(e) => setSourceTzQuery(e.target.value)}
                placeholder={ui.searchTimezone}
              />
              <Select
                value={sourceTimeZone}
                onValueChange={setSourceTimeZone}
                disabled={filteredSourceTimezones.length === 0}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {filteredSourceTimezones.map((tz) => (
                    <SelectItem key={`src-${tz}`} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => setSourceTimeZone(localTimeZone)}>{ui.useLocal}</Button>
              <Button size="sm" variant="outline" onClick={() => setSourceTimeZone('UTC')}>{ui.useUtc}</Button>
            </div>
            {filteredSourceTimezones.length === 0 && (
              <p className="text-xs text-muted-foreground">{ui.noTimezoneMatch}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{ui.targetTz}</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                className="w-[240px]"
                value={targetTzQuery}
                onChange={(e) => setTargetTzQuery(e.target.value)}
                placeholder={ui.searchTimezone}
              />
              <Select
                value={targetTimeZone}
                onValueChange={setTargetTimeZone}
                disabled={filteredTargetTimezones.length === 0}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {filteredTargetTimezones.map((tz) => (
                    <SelectItem key={`dst-${tz}`} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => setTargetTimeZone(localTimeZone)}>{ui.useLocal}</Button>
              <Button size="sm" variant="outline" onClick={() => setTargetTimeZone('UTC')}>{ui.useUtc}</Button>
            </div>
            {filteredTargetTimezones.length === 0 && (
              <p className="text-xs text-muted-foreground">{ui.noTimezoneMatch}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{ui.inputLabel}</Label>
          <Textarea
            className="font-mono text-xs h-32"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ui.placeholder}
          />
        </div>

        <Button size="sm" onClick={run}>{ui.convert}</Button>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {detailText && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{ui.title}</Label>
              <Button size="sm" variant="ghost" onClick={copy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {ui.copy}
              </Button>
            </div>
            <Textarea className="font-mono text-xs h-40" value={detailText} readOnly />
          </div>
        )}

        {batchRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{ui.rows}: {batchRows.length}</Badge>
              <Badge className="bg-green-600 text-white">{ui.okRows}: {okRows}</Badge>
              <Badge className="bg-red-600 text-white">{ui.errorRows}: {errorRows}</Badge>
              <div className="ml-auto flex gap-1">
                <Button size="sm" variant="ghost" onClick={downloadTxt}>
                  <Download className="h-4 w-4" />
                  {ui.txt}
                </Button>
                <Button size="sm" variant="ghost" onClick={downloadCsv}>
                  <Download className="h-4 w-4" />
                  {ui.csv}
                </Button>
              </div>
            </div>
            <div className="max-h-60 overflow-auto rounded-md border">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-2 py-1.5 text-left">#</th>
                    <th className="px-2 py-1.5 text-left">{ui.inputLabel}</th>
                    <th className="px-2 py-1.5 text-left">{ui.status}</th>
                    <th className="px-2 py-1.5 text-left">{ui.targetTime}</th>
                    <th className="px-2 py-1.5 text-right">{ui.unixSec}</th>
                  </tr>
                </thead>
                <tbody>
                  {batchRows.map((row) => (
                    <tr key={`${row.line}-${row.input}`} className="border-b hover:bg-muted/30">
                      <td className="px-2 py-1.5">{row.line}</td>
                      <td className="px-2 py-1.5 font-mono">{row.input}</td>
                      <td className="px-2 py-1.5">
                        {row.status === 'ok' ? (
                          <span className="text-green-700">{ui.ok}</span>
                        ) : (
                          <span className="text-red-700">{ui.error}</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 font-mono">{row.status === 'ok' ? row.target : row.error}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{row.status === 'ok' ? row.unixSec : '-'}</td>
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

// SQL -> JSON/CSV

function SqlConverterTab() {
  const { lang } = useI18n()
  const ui = lang === 'hu'
    ? {
        title: 'SQL INSERT dump -> JSON/CSV',
        desc: 'SQL szöveg beillesztése vagy feltöltése (INSERT INTO ... VALUES ...).',
        jsonOutput: 'JSON kimenet',
        csvOutput: 'CSV kimenet',
        convert: 'Konvertálás',
        uploadSql: '.sql feltöltése',
        rows: 'Sorok',
        tables: 'Táblák',
        sqlInput: 'SQL bemenet',
        outputJson: 'JSON kimenet',
        outputCsv: 'CSV kimenet',
        inputPlaceholder: "INSERT INTO users (id, name, email) VALUES (1, 'Alice', 'alice@example.com');",
      }
    : {
        title: 'SQL Insert Dump to JSON/CSV',
        desc: 'Paste or upload SQL with INSERT INTO ... VALUES ... statements.',
        jsonOutput: 'JSON output',
        csvOutput: 'CSV output',
        convert: 'Convert',
        uploadSql: 'Upload .sql',
        rows: 'Rows',
        tables: 'Tables',
        sqlInput: 'SQL Input',
        outputJson: 'JSON Output',
        outputCsv: 'CSV Output',
        inputPlaceholder: "INSERT INTO users (id, name, email) VALUES (1, 'Alice', 'alice@example.com');",
      }

  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [rows, setRows] = useState<Record<string, string | number | boolean | null>[]>([])
  const [tableNames, setTableNames] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<'json' | 'csv'>('json')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const buildOutput = (
    nextRows: Record<string, string | number | boolean | null>[],
    nextMode: 'json' | 'csv'
  ) => {
    return nextMode === 'json' ? rowsToJSON(nextRows) : rowsToCSV(nextRows)
  }

  const run = () => {
    const parsed = sqlToRows(input)
    setWarnings(parsed.warnings)

    if (parsed.error) {
      setError(parsed.error)
      setOutput('')
      setRows([])
      setTableNames([])
      return
    }

    setError('')
    setRows(parsed.rows)
    setTableNames(parsed.tableNames)
    setOutput(buildOutput(parsed.rows, mode))
  }

  const onModeChange = (nextMode: 'json' | 'csv') => {
    setMode(nextMode)
    if (rows.length > 0) {
      setOutput(buildOutput(rows, nextMode))
    }
  }

  const copy = async () => {
    await copyToClipboard(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    if (!output) return
    const ext = mode === 'json' ? 'json' : 'csv'
    const mime = mode === 'json' ? 'application/json' : 'text/csv'
    downloadFile(output, `converted-from-sql.${ext}`, mime)
  }

  const onFileChange = async (file: File | undefined) => {
    if (!file) return
    const text = await file.text()
    setInput(text)
    setError('')
    setWarnings([])
    setOutput('')
    setRows([])
    setTableNames([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ui.title}</CardTitle>
        <CardDescription>{ui.desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant={mode === 'json' ? 'default' : 'outline'} onClick={() => onModeChange('json')}>
            {ui.jsonOutput}
          </Button>
          <Button size="sm" variant={mode === 'csv' ? 'default' : 'outline'} onClick={() => onModeChange('csv')}>
            {ui.csvOutput}
          </Button>
          <Button size="sm" onClick={run}>{ui.convert}</Button>
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            {ui.uploadSql}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".sql,text/plain"
            className="hidden"
            onChange={(e) => {
              onFileChange(e.target.files?.[0])
              e.currentTarget.value = ''
            }}
          />
        </div>

        {rows.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">{ui.rows}: {rows.length}</Badge>
            <Badge variant="secondary">{ui.tables}: {tableNames.length}</Badge>
            <Badge variant="outline">{tableNames.join(', ')}</Badge>
          </div>
        )}

        <TwoPanel
          input={input}
          onInput={setInput}
          output={output}
          error={error}
          warning={warnings.length ? warnings.slice(0, 3).join(' | ') : undefined}
          onCopy={copy}
          onDownload={download}
          copied={copied}
          inputLabel={ui.sqlInput}
          outputLabel={mode === 'json' ? ui.outputJson : ui.outputCsv}
          inputPlaceholder={ui.inputPlaceholder}
        />
      </CardContent>
    </Card>
  )
}

// Shared: TwoPanel
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





