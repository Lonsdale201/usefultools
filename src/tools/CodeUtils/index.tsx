import { useMemo, useRef, useState, type ChangeEvent, type PointerEvent, type WheelEvent } from 'react'
import { Copy, Check, Download } from 'lucide-react'
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
import {
  analyzeDependencyGraph,
  previewRemovalImpact,
  type DependencyGraph,
} from './dependencyImpact'

export function CodeUtils() {
  const { t, lang } = useI18n()
  const passwordTabLabel = lang === 'hu' ? 'Jelszó Generátor' : 'Password Generator'
  const depImpactTabLabel = lang === 'hu' ? 'F\u00fcgg\u0151s\u00e9gelemz\u00e9s' : 'Dependency Impact'

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
          <TabsTrigger value="dep-impact">{depImpactTabLabel}</TabsTrigger>
          <TabsTrigger value="password">{passwordTabLabel}</TabsTrigger>
        </TabsList>
        <TabsContent value="prettify"><PrettifyTab /></TabsContent>
        <TabsContent value="escape"><EscapeTab /></TabsContent>
        <TabsContent value="base64"><Base64Tab /></TabsContent>
        <TabsContent value="hash"><HashTab /></TabsContent>
        <TabsContent value="dep-impact"><DependencyImpactTab /></TabsContent>
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

interface GraphLayoutNode {
  name: string
  x: number
  y: number
  level: number
  kind: 'focus' | 'dependency' | 'dependent'
}

interface GraphLayoutEdge {
  from: string
  to: string
}

interface GraphLayoutResult {
  nodes: GraphLayoutNode[]
  edges: GraphLayoutEdge[]
  width: number
  height: number
}

function buildDirectionalDistanceMap(
  graph: DependencyGraph,
  start: string,
  depth: number,
  direction: 'dependencies' | 'dependents'
): Map<string, number> {
  const distances = new Map<string, number>()
  if (!start || !graph.nodes[start]) return distances
  const queue: Array<{ name: string; distance: number }> = [{ name: start, distance: 0 }]
  distances.set(start, 0)

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue
    if (current.distance >= depth) continue
    const node = graph.nodes[current.name]
    if (!node) continue
    const nextNames = direction === 'dependencies' ? node.dependencies : node.dependents
    nextNames.forEach((next) => {
      const nextDistance = current.distance + 1
      const known = distances.get(next)
      if (known !== undefined && known <= nextDistance) return
      distances.set(next, nextDistance)
      queue.push({ name: next, distance: nextDistance })
    })
  }

  return distances
}

function buildGraphLayout(
  graph: DependencyGraph,
  focusName: string,
  depth: number,
  maxNodes: number
): GraphLayoutResult {
  if (!focusName || !graph.nodes[focusName]) {
    return { nodes: [], edges: [], width: 820, height: 380 }
  }

  const positive = buildDirectionalDistanceMap(graph, focusName, depth, 'dependencies')
  const negative = buildDirectionalDistanceMap(graph, focusName, depth, 'dependents')

  const allCandidates = new Set<string>([...positive.keys(), ...negative.keys()])
  allCandidates.add(focusName)

  const ranked = Array.from(allCandidates)
    .map((name) => {
      const pos = positive.get(name)
      const neg = negative.get(name)
      const rank = name === focusName
        ? -1
        : Math.min(
            pos ?? Number.POSITIVE_INFINITY,
            neg ?? Number.POSITIVE_INFINITY
          )
      return { name, pos, neg, rank }
    })
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank
      return a.name.localeCompare(b.name)
    })

  const capped = ranked.slice(0, Math.max(1, maxNodes))
  const visible = new Set(capped.map((item) => item.name))
  visible.add(focusName)

  const levels = new Map<string, number>()
  levels.set(focusName, 0)
  capped.forEach((item) => {
    if (item.name === focusName) return
    const pos = item.pos
    const neg = item.neg
    if (pos !== undefined && (neg === undefined || pos <= neg)) levels.set(item.name, pos)
    else if (neg !== undefined) levels.set(item.name, -neg)
  })

  const edges: GraphLayoutEdge[] = []
  visible.forEach((name) => {
    const node = graph.nodes[name]
    if (!node) return
    node.dependencies.forEach((dep) => {
      if (visible.has(dep)) edges.push({ from: name, to: dep })
    })
  })

  const byLevel = new Map<number, string[]>()
  visible.forEach((name) => {
    const level = levels.get(name) ?? 0
    const list = byLevel.get(level) ?? []
    list.push(name)
    byLevel.set(level, list)
  })
  byLevel.forEach((list) => list.sort((a, b) => a.localeCompare(b)))

  const sortedLevels = Array.from(byLevel.keys()).sort((a, b) => a - b)
  const minLevel = sortedLevels[0] ?? 0
  const maxLevel = sortedLevels[sortedLevels.length - 1] ?? 0
  const maxRows = Math.max(1, ...Array.from(byLevel.values()).map((list) => list.length))

  const xGap = 210
  const yGap = 52
  const margin = 56
  const width = (maxLevel - minLevel) * xGap + margin * 2 + 80
  const height = (maxRows - 1) * yGap + margin * 2 + 40
  const centerY = margin + ((maxRows - 1) * yGap) / 2

  const nodes: GraphLayoutNode[] = []
  sortedLevels.forEach((level) => {
    const namesAtLevel = byLevel.get(level) ?? []
    const totalLevelHeight = (namesAtLevel.length - 1) * yGap
    const startY = centerY - totalLevelHeight / 2
    namesAtLevel.forEach((name, index) => {
      const x = margin + (level - minLevel) * xGap + 40
      const y = startY + index * yGap
      const kind: GraphLayoutNode['kind'] = name === focusName
        ? 'focus'
        : level >= 0
          ? 'dependency'
          : 'dependent'
      nodes.push({ name, x, y, level, kind })
    })
  })

  return { nodes, edges, width, height }
}

function shortPackageLabel(name: string): string {
  if (name.length <= 28) return name
  return `${name.slice(0, 25)}...`
}

function DependencyImpactTab() {
  const { lang } = useI18n()
  const ui = lang === 'hu'
    ? {
        title: 'F\u00fcgg\u0151s\u00e9gelemz\u00e9s',
        desc: 'package.json + package-lock.json elemz\u00e9s: melyik csomag mit h\u00faz be, \u00e9s mi t\u00f6rt\u00e9nik, ha elt\u00e1vol\u00edtasz egy csomagot.',
        packageJson: 'package.json',
        lockfile: 'package-lock.json',
        upload: 'F\u00e1jl bet\u00f6lt\u00e9se',
        analyze: 'Gr\u00e1f \u00e9p\u00edt\u00e9se',
        clear: '\u00dcr\u00edt\u00e9s',
        invalidInput: '\u00c9rv\u00e9nytelen bemenet.',
        summary: '\u00d6sszegz\u00e9s',
        nodes: 'csomag',
        edges: 'kapcsolat',
        direct: 'k\u00f6zvetlen f\u00fcgg\u0151s\u00e9g',
        inspect: 'Csomagvizsg\u00e1lat',
        search: 'Keres\u00e9s',
        searchPlaceholder: 'pl. react',
        packageSelect: 'Csomag',
        dependsOn: 'F\u00fcgg\u0151s\u00e9gei',
        dependedBy: 'F\u00fcgg t\u0151le',
        removePreview: 'Elt\u00e1vol\u00edt\u00e1si hat\u00e1s el\u0151n\u00e9zet',
        removeTarget: 'Elt\u00e1vol\u00edtand\u00f3 k\u00f6zvetlen csomag',
        removed: 'elt\u0171nne',
        retained: 'megmaradna',
        report: 'Riport',
        copy: 'M\u00e1sol\u00e1s',
        download: 'Let\u00f6lt\u00e9s',
        graphView: 'Gr\u00e1f n\u00e9zet',
        graphDepth: 'M\u00e9lys\u00e9g',
        graphMaxNodes: 'Max node',
        zoomIn: 'Nagy\u00edt\u00e1s +',
        zoomOut: 'Kicsiny\u00edt\u00e9s -',
        zoomReset: 'Nagy\u00edt\u00e1s alaphelyzet',
        graphFocus: 'f\u00f3kusz',
        graphDeps: 'f\u00fcgg\u0151s\u00e9gi oldal',
        graphDependents: 'f\u00fcgg\u0151 oldal',
        noGraph: 'T\u00f6ltsd be a k\u00e9t f\u00e1jlt, majd futtasd az elemz\u00e9st.',
        noNode: 'Nincs kiv\u00e1lasztott csomag.',
      }
    : {
        title: 'Dependency Impact Explorer',
        desc: 'Analyze package.json + package-lock.json: who pulls what and what happens when removing a package.',
        packageJson: 'package.json',
        lockfile: 'package-lock.json',
        upload: 'Load file',
        analyze: 'Build graph',
        clear: 'Clear',
        invalidInput: 'Invalid input.',
        summary: 'Summary',
        nodes: 'nodes',
        edges: 'edges',
        direct: 'direct dependencies',
        inspect: 'Package inspect',
        search: 'Search',
        searchPlaceholder: 'e.g. react',
        packageSelect: 'Package',
        dependsOn: 'Depends on',
        dependedBy: 'Depended by',
        removePreview: 'Remove impact preview',
        removeTarget: 'Direct dependency to remove',
        removed: 'would be removed',
        retained: 'would remain',
        report: 'Report',
        copy: 'Copy',
        download: 'Download',
        graphView: 'Graph view',
        graphDepth: 'Depth',
        graphMaxNodes: 'Max nodes',
        zoomIn: 'Zoom +',
        zoomOut: 'Zoom -',
        zoomReset: 'Reset zoom',
        graphFocus: 'focus',
        graphDeps: 'dependency side',
        graphDependents: 'dependent side',
        noGraph: 'Load both files and run analysis.',
        noNode: 'No selected package.',
      }

  const [packageJsonInput, setPackageJsonInput] = useState('')
  const [lockfileInput, setLockfileInput] = useState('')
  const [graph, setGraph] = useState<DependencyGraph | null>(null)
  const [error, setError] = useState('')
  const [packageSearch, setPackageSearch] = useState('')
  const [selectedPackage, setSelectedPackage] = useState('')
  const [removeTarget, setRemoveTarget] = useState('')
  const [copied, setCopied] = useState(false)
  const [graphDepth, setGraphDepth] = useState(2)
  const [graphMaxNodes, setGraphMaxNodes] = useState(120)
  const [graphScale, setGraphScale] = useState(1)
  const [graphOffset, setGraphOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 })

  const directDependencyNames = useMemo(() => {
    if (!graph) return []
    return Array.from(new Set(graph.directDependencies.map((dep) => dep.name))).sort((a, b) => a.localeCompare(b))
  }, [graph])

  const filteredPackageNames = useMemo(() => {
    if (!graph) return []
    const query = packageSearch.trim().toLowerCase()
    if (!query) return graph.nodeNames
    return graph.nodeNames.filter((name) => name.toLowerCase().includes(query))
  }, [graph, packageSearch])

  const selectedNode = useMemo(() => {
    if (!graph || !selectedPackage) return null
    return graph.nodes[selectedPackage] ?? null
  }, [graph, selectedPackage])

  const impact = useMemo(() => {
    if (!graph || !removeTarget) return null
    return previewRemovalImpact(graph, removeTarget)
  }, [graph, removeTarget])

  const graphFocusName = useMemo(() => {
    if (!graph) return ''
    if (selectedPackage && graph.nodes[selectedPackage]) return selectedPackage
    if (removeTarget && graph.nodes[removeTarget]) return removeTarget
    if (graph.nodeNames.length > 0) return graph.nodeNames[0]
    return ''
  }, [graph, selectedPackage, removeTarget])

  const graphLayout = useMemo(() => {
    if (!graph) return { nodes: [], edges: [], width: 820, height: 380 }
    return buildGraphLayout(graph, graphFocusName, graphDepth, graphMaxNodes)
  }, [graph, graphFocusName, graphDepth, graphMaxNodes])

  const graphNodeMap = useMemo(() => {
    const map = new Map<string, GraphLayoutNode>()
    graphLayout.nodes.forEach((node) => map.set(node.name, node))
    return map
  }, [graphLayout.nodes])

  const removedSet = useMemo(() => new Set(impact?.removed ?? []), [impact])

  const reportText = useMemo(() => {
    if (!graph) return ''
    const lines: string[] = []
    lines.push('Dependency Impact Report')
    lines.push(`Nodes: ${graph.nodeNames.length}`)
    lines.push(`Edges: ${graph.edgeCount}`)
    lines.push(`Direct dependencies: ${directDependencyNames.length}`)
    if (selectedNode) {
      lines.push('')
      lines.push(`Package: ${selectedNode.name}`)
      lines.push(`Versions: ${selectedNode.versions.join(', ') || '-'}`)
      lines.push(`Depends on (${selectedNode.dependencies.length}): ${selectedNode.dependencies.join(', ') || '-'}`)
      lines.push(`Depended by (${selectedNode.dependents.length}): ${selectedNode.dependents.join(', ') || '-'}`)
    }
    if (removeTarget && impact) {
      lines.push('')
      lines.push(`Remove target: ${removeTarget}`)
      lines.push(`Would be removed (${impact.removed.length}):`)
      impact.removed.slice(0, 300).forEach((name) => lines.push(`- ${name}`))
      if (impact.removed.length > 300) lines.push(`... +${impact.removed.length - 300} more`)
    }
    return lines.join('\n')
  }, [graph, directDependencyNames.length, selectedNode, removeTarget, impact])

  const runAnalysis = () => {
    const result = analyzeDependencyGraph(packageJsonInput, lockfileInput)
    if (!result.graph) {
      setGraph(null)
      setError(result.error ?? ui.invalidInput)
      setSelectedPackage('')
      setRemoveTarget('')
      return
    }
    setGraph(result.graph)
    setError('')
    const firstDirect = result.graph.directDependencies[0]?.name ?? ''
    setSelectedPackage(firstDirect || result.graph.nodeNames[0] || '')
    const directNames = Array.from(new Set(result.graph.directDependencies.map((dep) => dep.name)))
    setRemoveTarget(directNames[0] ?? '')
    setGraphScale(1)
    setGraphOffset({ x: 0, y: 0 })
  }

  const loadFile = async (
    event: ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) {
      input.value = ''
      return
    }
    const text = await file.text()
    setter(text)
    // Allow selecting the same file again and still trigger onChange.
    input.value = ''
  }

  const clearAll = () => {
    setPackageJsonInput('')
    setLockfileInput('')
    setGraph(null)
    setError('')
    setPackageSearch('')
    setSelectedPackage('')
    setRemoveTarget('')
    setGraphScale(1)
    setGraphOffset({ x: 0, y: 0 })
  }

  const copyReport = async () => {
    if (!reportText) return
    await copyToClipboard(reportText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const downloadReport = () => {
    if (!reportText) return
    downloadFile(reportText, 'dependency-impact-report.txt', 'text/plain')
  }

  const clampScale = (value: number) => Math.min(2.5, Math.max(0.45, value))

  const zoomIn = () => setGraphScale((current) => clampScale(current + 0.12))
  const zoomOut = () => setGraphScale((current) => clampScale(current - 0.12))
  const resetZoom = () => {
    setGraphScale(1)
    setGraphOffset({ x: 0, y: 0 })
  }

  const onGraphPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { active: true, x: event.clientX, y: event.clientY }
  }

  const onGraphPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return
    const deltaX = event.clientX - dragRef.current.x
    const deltaY = event.clientY - dragRef.current.y
    dragRef.current = { active: true, x: event.clientX, y: event.clientY }
    setGraphOffset((current) => ({ x: current.x + deltaX, y: current.y + deltaY }))
  }

  const stopGraphDrag = () => {
    dragRef.current.active = false
  }

  const onGraphWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const delta = event.deltaY < 0 ? 0.08 : -0.08
    setGraphScale((current) => clampScale(current + delta))
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
            <div className="flex items-center justify-between">
              <Label>{ui.packageJson}</Label>
              <label className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                {ui.upload}
                <Input className="hidden" type="file" accept=".json,application/json" onChange={(e) => loadFile(e, setPackageJsonInput)} />
              </label>
            </div>
            <Textarea
              className="font-mono text-xs h-44"
              value={packageJsonInput}
              onChange={(e) => setPackageJsonInput(e.target.value)}
              placeholder='{"dependencies":{"react":"^19.0.0"}}'
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{ui.lockfile}</Label>
              <label className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                {ui.upload}
                <Input className="hidden" type="file" accept=".json,application/json" onChange={(e) => loadFile(e, setLockfileInput)} />
              </label>
            </div>
            <Textarea
              className="font-mono text-xs h-44"
              value={lockfileInput}
              onChange={(e) => setLockfileInput(e.target.value)}
              placeholder='{"lockfileVersion":3,"packages":{"":{},"node_modules/react":{"version":"19.0.0"}}}'
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={runAnalysis}>{ui.analyze}</Button>
          <Button size="sm" variant="outline" onClick={clearAll}>{ui.clear}</Button>
          {graph && (
            <>
              <Badge variant="secondary">{graph.nodeNames.length} {ui.nodes}</Badge>
              <Badge variant="secondary">{graph.edgeCount} {ui.edges}</Badge>
              <Badge variant="outline">{directDependencyNames.length} {ui.direct}</Badge>
            </>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {!graph ? (
          <p className="text-xs text-muted-foreground">{ui.noGraph}</p>
        ) : (
          <>
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>{ui.graphView}</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">{ui.graphDepth}</span>
                    <Input
                      className="h-8 w-20 text-xs"
                      type="number"
                      min={1}
                      max={5}
                      value={graphDepth}
                      onChange={(e) => setGraphDepth(Math.min(5, Math.max(1, Number(e.target.value) || 1)))}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">{ui.graphMaxNodes}</span>
                    <Input
                      className="h-8 w-24 text-xs"
                      type="number"
                      min={25}
                      max={400}
                      value={graphMaxNodes}
                      onChange={(e) => setGraphMaxNodes(Math.min(400, Math.max(25, Number(e.target.value) || 25)))}
                    />
                  </div>
                  <Button size="sm" variant="outline" onClick={zoomOut}>{ui.zoomOut}</Button>
                  <Button size="sm" variant="outline" onClick={zoomIn}>{ui.zoomIn}</Button>
                  <Button size="sm" variant="outline" onClick={resetZoom}>{ui.zoomReset}</Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{ui.graphFocus}</Badge>
                <Badge variant="outline">{ui.graphDeps}</Badge>
                <Badge variant="outline">{ui.graphDependents}</Badge>
                {removeTarget && impact && (
                  <Badge variant="secondary">{impact.removed.length} {ui.removed}</Badge>
                )}
              </div>

              <div className="overflow-hidden rounded-md border bg-muted/10">
                <div
                  className="h-[460px] w-full cursor-grab active:cursor-grabbing touch-none"
                  onPointerDown={onGraphPointerDown}
                  onPointerMove={onGraphPointerMove}
                  onPointerUp={stopGraphDrag}
                  onPointerLeave={stopGraphDrag}
                  onWheel={onGraphWheel}
                >
                  <svg
                    className="h-full w-full"
                    viewBox={`0 0 ${Math.max(900, graphLayout.width)} ${Math.max(460, graphLayout.height)}`}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <g transform={`translate(${graphOffset.x} ${graphOffset.y}) scale(${graphScale})`}>
                      {graphLayout.edges.map((edge) => {
                        const source = graphNodeMap.get(edge.from)
                        const target = graphNodeMap.get(edge.to)
                        if (!source || !target) return null
                        const isFocusEdge = edge.from === graphFocusName || edge.to === graphFocusName
                        const isRemovedEdge = removedSet.has(edge.from) || removedSet.has(edge.to)
                        const stroke = isRemovedEdge
                          ? '#dc2626'
                          : isFocusEdge
                            ? '#1d4ed8'
                            : '#94a3b8'
                        const opacity = isFocusEdge || isRemovedEdge ? 0.95 : 0.45
                        return (
                          <line
                            key={`${edge.from}->${edge.to}`}
                            x1={source.x}
                            y1={source.y}
                            x2={target.x}
                            y2={target.y}
                            stroke={stroke}
                            strokeWidth={isFocusEdge ? 2 : 1.3}
                            opacity={opacity}
                          />
                        )
                      })}

                      {graphLayout.nodes.map((node) => {
                        const label = shortPackageLabel(node.name)
                        const width = Math.max(128, Math.min(280, label.length * 7 + 26))
                        const height = 30
                        const isFocus = node.name === graphFocusName
                        const isSelected = node.name === selectedPackage
                        const isRemoved = removedSet.has(node.name)
                        const fill = isRemoved
                          ? '#fee2e2'
                          : isFocus
                            ? '#1d4ed8'
                            : node.kind === 'dependency'
                              ? '#eff6ff'
                              : '#ecfdf5'
                        const stroke = isRemoved
                          ? '#dc2626'
                          : isFocus
                            ? '#1d4ed8'
                            : node.kind === 'dependency'
                              ? '#60a5fa'
                              : '#34d399'
                        const textFill = isFocus ? '#ffffff' : '#0f172a'

                        return (
                          <g
                            key={node.name}
                            onClick={() => setSelectedPackage(node.name)}
                            style={{ cursor: 'pointer' }}
                          >
                            <rect
                              x={node.x - width / 2}
                              y={node.y - height / 2}
                              width={width}
                              height={height}
                              rx={8}
                              fill={fill}
                              stroke={stroke}
                              strokeWidth={isSelected ? 2.5 : 1.3}
                              opacity={isFocus || isSelected ? 1 : 0.92}
                            />
                            <text
                              x={node.x}
                              y={node.y + 4}
                              textAnchor="middle"
                              fontSize="11"
                              fill={textFill}
                              style={{ userSelect: 'none', pointerEvents: 'none', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                            >
                              {label}
                            </text>
                          </g>
                        )
                      })}
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-md border p-3">
                <Label>{ui.inspect}</Label>
                <Input
                  value={packageSearch}
                  onChange={(e) => setPackageSearch(e.target.value)}
                  placeholder={ui.searchPlaceholder}
                />
                <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                  <SelectTrigger>
                    <SelectValue placeholder={ui.packageSelect} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPackageNames.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedNode ? (
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="font-medium mb-1">{ui.dependsOn}: {selectedNode.dependencies.length}</div>
                      <div className="max-h-28 overflow-auto rounded-md border p-2 font-mono">
                        {selectedNode.dependencies.length > 0 ? selectedNode.dependencies.join('\n') : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium mb-1">{ui.dependedBy}: {selectedNode.dependents.length}</div>
                      <div className="max-h-28 overflow-auto rounded-md border p-2 font-mono">
                        {selectedNode.dependents.length > 0 ? selectedNode.dependents.join('\n') : '-'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{ui.noNode}</p>
                )}
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <Label>{ui.removePreview}</Label>
                <Select value={removeTarget} onValueChange={setRemoveTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder={ui.removeTarget} />
                  </SelectTrigger>
                  <SelectContent>
                    {directDependencyNames.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {impact && (
                  <div className="space-y-2 text-xs">
                    <div className="flex gap-2">
                      <Badge variant="secondary">{impact.removed.length} {ui.removed}</Badge>
                      <Badge variant="outline">{impact.retained.length} {ui.retained}</Badge>
                    </div>
                    <div className="max-h-56 overflow-auto rounded-md border p-2 font-mono">
                      {impact.removed.length > 0 ? impact.removed.slice(0, 250).join('\n') : '-'}
                      {impact.removed.length > 250 ? `\n... +${impact.removed.length - 250} more` : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{ui.report}</Label>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={copyReport}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    {ui.copy}
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadReport}>
                    <Download className="h-4 w-4" />
                    {ui.download}
                  </Button>
                </div>
              </div>
              <Textarea className="font-mono text-xs h-44" value={reportText} readOnly />
            </div>
          </>
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
