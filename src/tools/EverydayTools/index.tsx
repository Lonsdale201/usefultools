import { useMemo, useState, type ChangeEvent } from 'react'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { Check, Copy, Download, Upload } from 'lucide-react'
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

type CaseMode = 'none' | 'lower' | 'upper' | 'title'
type DateUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'
type DateDirection = 'add' | 'subtract'
type VatMode = 'netToGross' | 'grossToNet'

const DEFAULT_QR_SIZE = '256'
const DEFAULT_QR_ECC = 'M'

function toDateTimeLocalValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function parseDateInput(value: string): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function formatDateVerbose(date: Date): string {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function applyDateOffset(base: Date, unit: DateUnit, amount: number): Date {
  const next = new Date(base.getTime())
  switch (unit) {
    case 'minutes':
      next.setMinutes(next.getMinutes() + amount)
      return next
    case 'hours':
      next.setHours(next.getHours() + amount)
      return next
    case 'days':
      next.setDate(next.getDate() + amount)
      return next
    case 'weeks':
      next.setDate(next.getDate() + amount * 7)
      return next
    case 'months':
      next.setMonth(next.getMonth() + amount)
      return next
    case 'years':
      next.setFullYear(next.getFullYear() + amount)
      return next
    default:
      return next
  }
}

function toTitleCase(input: string, locale: string): string {
  return input
    .split(/(\s+)/)
    .map((token) => {
      if (!token || /^\s+$/.test(token)) return token
      return token.charAt(0).toLocaleUpperCase(locale) + token.slice(1).toLocaleLowerCase(locale)
    })
    .join('')
}

function cleanupText(
  text: string,
  options: {
    trimLines: boolean
    collapseWhitespace: boolean
    removeEmpty: boolean
    dedupeLines: boolean
    caseMode: CaseMode
    locale: string
  }
): string {
  const transformed = text.split(/\r?\n/).map((line) => {
    let next = line

    if (options.trimLines) next = next.trim()
    if (options.collapseWhitespace) next = next.replace(/[^\S\r\n]+/g, ' ')

    if (options.caseMode === 'lower') next = next.toLocaleLowerCase(options.locale)
    if (options.caseMode === 'upper') next = next.toLocaleUpperCase(options.locale)
    if (options.caseMode === 'title') next = toTitleCase(next, options.locale)

    return next
  })

  const filtered = options.removeEmpty ? transformed.filter((line) => line.trim().length > 0) : transformed

  if (!options.dedupeLines) return filtered.join('\n')

  const seen = new Set<string>()
  const unique: string[] = []
  for (const line of filtered) {
    if (seen.has(line)) continue
    seen.add(line)
    unique.push(line)
  }
  return unique.join('\n')
}

function triggerDownloadFromDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function EverydayTools() {
  const { lang } = useI18n()

  const ui = lang === 'hu'
    ? {
        title: 'Mindennapi Eszközök',
        subtitle: 'QR, dátum számítás, ÁFA kalkuláció és szövegtisztítás egy helyen.',
        qrTab: 'QR Eszköztár',
        dateTab: 'Dátum Kalkulátor',
        vatTab: 'ÁFA Kalkulátor',
        textTab: 'Szöveg Tisztító',
      }
    : {
        title: 'Everyday Tools',
        subtitle: 'QR, date calculations, VAT math, and text cleanup in one place.',
        qrTab: 'QR Toolkit',
        dateTab: 'Date Calculator',
        vatTab: 'VAT Calculator',
        textTab: 'Text Cleanup',
      }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{ui.title}</h1>
        <p className="text-muted-foreground">{ui.subtitle}</p>
      </div>
      <Tabs defaultValue="qr-toolkit">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="qr-toolkit">{ui.qrTab}</TabsTrigger>
          <TabsTrigger value="date-calculator">{ui.dateTab}</TabsTrigger>
          <TabsTrigger value="vat-calculator">{ui.vatTab}</TabsTrigger>
          <TabsTrigger value="text-cleanup">{ui.textTab}</TabsTrigger>
        </TabsList>
        <TabsContent value="qr-toolkit">
          <QrToolkitTab />
        </TabsContent>
        <TabsContent value="date-calculator">
          <DateCalculatorTab />
        </TabsContent>
        <TabsContent value="vat-calculator">
          <VatCalculatorTab />
        </TabsContent>
        <TabsContent value="text-cleanup">
          <TextCleanupTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function QrToolkitTab() {
  const { t, lang } = useI18n()
  const [input, setInput] = useState('')
  const [size, setSize] = useState(DEFAULT_QR_SIZE)
  const [ecc, setEcc] = useState(DEFAULT_QR_ECC)
  const [generatedDataUrl, setGeneratedDataUrl] = useState('')
  const [generationError, setGenerationError] = useState('')
  const [decodeResult, setDecodeResult] = useState('')
  const [decodeError, setDecodeError] = useState('')
  const [copiedGenerated, setCopiedGenerated] = useState(false)
  const [copiedDecoded, setCopiedDecoded] = useState(false)

  const ui = lang === 'hu'
    ? {
        title: 'QR Eszköztár',
        desc: 'QR kód generálás szövegből és visszafejtés feltöltött képből.',
        inputLabel: 'Bemeneti szöveg / URL',
        inputPlaceholder: 'Pl. https://example.com vagy bármilyen szöveg',
        sizeLabel: 'Méret',
        eccLabel: 'Hibatűrés',
        generate: 'QR generálás',
        copyInput: 'Bemenet másolása',
        downloadPng: 'PNG letöltés',
        preview: 'Előnézet',
        decodeTitle: 'QR beolvasás képből',
        upload: 'Kép feltöltése',
        decodeResult: 'Beolvasott tartalom',
        decodeErrorPrefix: 'Hiba',
        useDecoded: 'Használd bemenetként',
        emptyInputError: 'Adj meg szöveget vagy URL-t a QR kódhoz.',
        decodeNoCode: 'Nem találtam QR kódot a képen.',
        decodeReadError: 'A kép feldolgozása nem sikerült.',
      }
    : {
        title: 'QR Toolkit',
        desc: 'Generate QR code from text and decode QR from an uploaded image.',
        inputLabel: 'Input text / URL',
        inputPlaceholder: 'Example: https://example.com or any plain text',
        sizeLabel: 'Size',
        eccLabel: 'Error correction',
        generate: 'Generate QR',
        copyInput: 'Copy input',
        downloadPng: 'Download PNG',
        preview: 'Preview',
        decodeTitle: 'Decode QR from image',
        upload: 'Upload image',
        decodeResult: 'Decoded content',
        decodeErrorPrefix: 'Error',
        useDecoded: 'Use as input',
        emptyInputError: 'Please enter text or URL for QR generation.',
        decodeNoCode: 'No QR code found in this image.',
        decodeReadError: 'Could not process the uploaded image.',
      }

  const generateQr = async () => {
    setGenerationError('')
    if (!input.trim()) {
      setGeneratedDataUrl('')
      setGenerationError(ui.emptyInputError)
      return
    }

    try {
      const dataUrl = await QRCode.toDataURL(input, {
        width: Number(size),
        margin: 1,
        errorCorrectionLevel: ecc as 'L' | 'M' | 'Q' | 'H',
      })
      setGeneratedDataUrl(dataUrl)
    } catch {
      setGeneratedDataUrl('')
      setGenerationError(ui.decodeReadError)
    }
  }

  const decodeFromImage = async (event: ChangeEvent<HTMLInputElement>) => {
    setDecodeError('')
    setDecodeResult('')
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const reader = new FileReader()
      reader.onload = () => {
        const src = typeof reader.result === 'string' ? reader.result : ''
        const image = new Image()
        image.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = image.width
          canvas.height = image.height
          const context = canvas.getContext('2d')
          if (!context) {
            setDecodeError(ui.decodeReadError)
            return
          }

          context.drawImage(image, 0, 0)
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' })
          if (!code?.data) {
            setDecodeError(ui.decodeNoCode)
            return
          }
          setDecodeResult(code.data)
        }
        image.onerror = () => setDecodeError(ui.decodeReadError)
        image.src = src
      }
      reader.onerror = () => setDecodeError(ui.decodeReadError)
      reader.readAsDataURL(file)
    } catch {
      setDecodeError(ui.decodeReadError)
    }
  }

  const copyGeneratedText = async () => {
    await copyToClipboard(input)
    setCopiedGenerated(true)
    setTimeout(() => setCopiedGenerated(false), 1500)
  }

  const copyDecodedText = async () => {
    await copyToClipboard(decodeResult)
    setCopiedDecoded(true)
    setTimeout(() => setCopiedDecoded(false), 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ui.title}</CardTitle>
        <CardDescription>{ui.desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{ui.inputLabel}</Label>
              <Textarea
                className="h-36 text-xs font-mono"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={ui.inputPlaceholder}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Label>{ui.sizeLabel}</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="192">192</SelectItem>
                    <SelectItem value="256">256</SelectItem>
                    <SelectItem value="320">320</SelectItem>
                    <SelectItem value="384">384</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label>{ui.eccLabel}</Label>
                <Select value={ecc} onValueChange={setEcc}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="Q">Q</SelectItem>
                    <SelectItem value="H">H</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={generateQr}>{ui.generate}</Button>
              <Button size="sm" variant="outline" onClick={copyGeneratedText}>
                {copiedGenerated ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {ui.copyInput}
              </Button>
            </div>
            {generationError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                {generationError}
              </div>
            )}
            {generatedDataUrl && (
              <div className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Label>{ui.preview}</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => triggerDownloadFromDataUrl(generatedDataUrl, 'qr-code.png')}
                  >
                    <Download className="h-4 w-4" />
                    {ui.downloadPng}
                  </Button>
                </div>
                <img src={generatedDataUrl} alt="QR code preview" className="h-48 w-48 rounded-md border object-contain" />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{ui.decodeTitle}</Label>
              <Input type="file" accept="image/*" onChange={decodeFromImage} />
            </div>
            <div className="rounded-md border p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Upload className="h-4 w-4" />
                {ui.upload}
              </div>
              <Label>{ui.decodeResult}</Label>
              <Textarea className="h-40 text-xs font-mono" value={decodeResult} readOnly />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyDecodedText} disabled={!decodeResult}>
                  {copiedDecoded ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  {t('common.copy')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!decodeResult}
                  onClick={() => setInput(decodeResult)}
                >
                  {ui.useDecoded}
                </Button>
              </div>
              {decodeError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                  {ui.decodeErrorPrefix}: {decodeError}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DateCalculatorTab() {
  const { lang } = useI18n()
  const [baseDateInput, setBaseDateInput] = useState(() => toDateTimeLocalValue(new Date()))
  const [amount, setAmount] = useState(7)
  const [unit, setUnit] = useState<DateUnit>('days')
  const [direction, setDirection] = useState<DateDirection>('add')
  const [rangeStart, setRangeStart] = useState(() => toDateTimeLocalValue(new Date()))
  const [rangeEnd, setRangeEnd] = useState(() => toDateTimeLocalValue(new Date(Date.now() + 86_400_000)))
  const [copied, setCopied] = useState(false)

  const ui = lang === 'hu'
    ? {
        title: 'Dátum Kalkulátor',
        desc: 'Dátumokhoz hozzáadás/kivonás és két dátum közti eltérés számítása.',
        baseDate: 'Alap dátum',
        operation: 'Művelet',
        add: 'Hozzáadás',
        subtract: 'Kivonás',
        amount: 'Mennyiség',
        unit: 'Egység',
        minutes: 'perc',
        hours: 'óra',
        days: 'nap',
        weeks: 'hét',
        months: 'hónap',
        years: 'év',
        result: 'Eredmény dátum',
        resultLocal: 'Helyi idő',
        resultIso: 'ISO',
        resultUnixSec: 'Unix (sec)',
        resultUnixMs: 'Unix (ms)',
        diffTitle: 'Két dátum különbsége',
        start: 'Kezdet',
        end: 'Vég',
        diff: 'Eltérés',
        signedDays: 'előjeles napok',
        absolute: 'abszolút',
        minuteShort: 'perc',
        hourShort: 'óra',
        dayShort: 'nap',
        copySummary: 'Összegzés másolása',
      }
    : {
        title: 'Date Calculator',
        desc: 'Add/subtract offsets and calculate difference between two dates.',
        baseDate: 'Base date',
        operation: 'Operation',
        add: 'Add',
        subtract: 'Subtract',
        amount: 'Amount',
        unit: 'Unit',
        minutes: 'minutes',
        hours: 'hours',
        days: 'days',
        weeks: 'weeks',
        months: 'months',
        years: 'years',
        result: 'Result date',
        resultLocal: 'Local time',
        resultIso: 'ISO',
        resultUnixSec: 'Unix (sec)',
        resultUnixMs: 'Unix (ms)',
        diffTitle: 'Difference between two dates',
        start: 'Start',
        end: 'End',
        diff: 'Difference',
        signedDays: 'signed days',
        absolute: 'absolute',
        minuteShort: 'min',
        hourShort: 'h',
        dayShort: 'd',
        copySummary: 'Copy summary',
      }

  const baseDate = parseDateInput(baseDateInput)
  const signedAmount = direction === 'add' ? amount : -amount
  const offsetDate = baseDate ? applyDateOffset(baseDate, unit, signedAmount) : null

  const start = parseDateInput(rangeStart)
  const end = parseDateInput(rangeEnd)
  const rangeDiffMs = start && end ? end.getTime() - start.getTime() : null

  const diffBreakdown = useMemo(() => {
    if (rangeDiffMs == null) return null
    const absMs = Math.abs(rangeDiffMs)
    const totalMinutes = Math.floor(absMs / 60_000)
    const totalHours = Math.floor(absMs / 3_600_000)
    const totalDays = absMs / 86_400_000
    const days = Math.floor(absMs / 86_400_000)
    const hours = Math.floor((absMs % 86_400_000) / 3_600_000)
    const minutes = Math.floor((absMs % 3_600_000) / 60_000)
    return { totalMinutes, totalHours, totalDays, days, hours, minutes }
  }, [rangeDiffMs])

  const copySummary = async () => {
    if (!offsetDate || !diffBreakdown || rangeDiffMs == null) return
    const summary = [
      `${ui.resultLocal}: ${formatDateVerbose(offsetDate)}`,
      `${ui.resultIso}: ${offsetDate.toISOString()}`,
      `${ui.resultUnixSec}: ${Math.floor(offsetDate.getTime() / 1000)}`,
      `${ui.resultUnixMs}: ${offsetDate.getTime()}`,
      '',
      `${ui.diff}: ${diffBreakdown.days}${ui.dayShort} ${diffBreakdown.hours}${ui.hourShort} ${diffBreakdown.minutes}${ui.minuteShort} (${ui.absolute})`,
      `${ui.signedDays}: ${(rangeDiffMs / 86_400_000).toFixed(4)}`,
    ].join('\n')
    await copyToClipboard(summary)
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
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3 rounded-md border p-3">
            <div className="space-y-1.5">
              <Label>{ui.baseDate}</Label>
              <Input type="datetime-local" value={baseDateInput} onChange={(e) => setBaseDateInput(e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label>{ui.operation}</Label>
                <Select value={direction} onValueChange={(v) => setDirection(v as DateDirection)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">{ui.add}</SelectItem>
                    <SelectItem value="subtract">{ui.subtract}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{ui.amount}</Label>
                <Input
                  className="h-8"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{ui.unit}</Label>
                <Select value={unit} onValueChange={(v) => setUnit(v as DateUnit)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">{ui.minutes}</SelectItem>
                    <SelectItem value="hours">{ui.hours}</SelectItem>
                    <SelectItem value="days">{ui.days}</SelectItem>
                    <SelectItem value="weeks">{ui.weeks}</SelectItem>
                    <SelectItem value="months">{ui.months}</SelectItem>
                    <SelectItem value="years">{ui.years}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {offsetDate ? (
              <div className="space-y-2 rounded-md border p-3 text-xs">
                <p className="font-medium">{ui.result}</p>
                <p><span className="text-muted-foreground">{ui.resultLocal}:</span> {formatDateVerbose(offsetDate)}</p>
                <p><span className="text-muted-foreground">{ui.resultIso}:</span> <span className="font-mono">{offsetDate.toISOString()}</span></p>
                <p><span className="text-muted-foreground">{ui.resultUnixSec}:</span> <span className="font-mono">{Math.floor(offsetDate.getTime() / 1000)}</span></p>
                <p><span className="text-muted-foreground">{ui.resultUnixMs}:</span> <span className="font-mono">{offsetDate.getTime()}</span></p>
              </div>
            ) : null}
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <p className="text-sm font-medium">{ui.diffTitle}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{ui.start}</Label>
                <Input type="datetime-local" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{ui.end}</Label>
                <Input type="datetime-local" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
              </div>
            </div>
            {diffBreakdown && rangeDiffMs != null ? (
              <div className="space-y-2 rounded-md border p-3 text-xs">
                <p className="font-medium">{ui.diff}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {diffBreakdown.days}{ui.dayShort} {diffBreakdown.hours}{ui.hourShort} {diffBreakdown.minutes}{ui.minuteShort} ({ui.absolute})
                  </Badge>
                  <Badge variant="outline">{ui.signedDays}: {(rangeDiffMs / 86_400_000).toFixed(4)}</Badge>
                </div>
                <p className="text-muted-foreground">
                  {diffBreakdown.totalMinutes.toLocaleString()} {ui.minuteShort} | {diffBreakdown.totalHours.toLocaleString()} {ui.hourShort} | {diffBreakdown.totalDays.toFixed(4)} {ui.dayShort}
                </p>
              </div>
            ) : null}
            <Button size="sm" variant="outline" onClick={copySummary} disabled={!offsetDate || !diffBreakdown}>
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {ui.copySummary}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function VatCalculatorTab() {
  const { lang } = useI18n()
  const [mode, setMode] = useState<VatMode>('netToGross')
  const [amountInput, setAmountInput] = useState('100')
  const [rateInput, setRateInput] = useState('27')
  const [copied, setCopied] = useState(false)

  const ui = lang === 'hu'
    ? {
        title: 'ÁFA Kalkulátor',
        desc: 'Nettó/bruttó számítás ÁFA kulccsal, gyors ellenőrzésre és ajánlatkészítéshez.',
        mode: 'Mód',
        netToGross: 'Nettó -> Bruttó',
        grossToNet: 'Bruttó -> Nettó',
        amount: 'Kiinduló összeg',
        vatRate: 'ÁFA kulcs (%)',
        preset: 'Gyors kulcsok',
        net: 'Nettó',
        vat: 'ÁFA',
        gross: 'Bruttó',
        invalid: 'Adj meg érvényes számokat.',
        copySummary: 'Összegzés másolása',
      }
    : {
        title: 'VAT Calculator',
        desc: 'Net/gross conversion by VAT rate for quick invoice and pricing checks.',
        mode: 'Mode',
        netToGross: 'Net -> Gross',
        grossToNet: 'Gross -> Net',
        amount: 'Input amount',
        vatRate: 'VAT rate (%)',
        preset: 'Quick rates',
        net: 'Net',
        vat: 'VAT',
        gross: 'Gross',
        invalid: 'Please enter valid numeric values.',
        copySummary: 'Copy summary',
      }

  const amount = Number(amountInput)
  const rate = Number(rateInput)
  const isValid = Number.isFinite(amount) && Number.isFinite(rate) && rate >= 0

  const result = useMemo(() => {
    if (!isValid) return null
    if (mode === 'netToGross') {
      const net = amount
      const vat = net * (rate / 100)
      const gross = net + vat
      return { net, vat, gross }
    }

    const gross = amount
    const divisor = 1 + rate / 100
    const net = divisor === 0 ? 0 : gross / divisor
    const vat = gross - net
    return { net, vat, gross }
  }, [amount, mode, rate, isValid])

  const fmt = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const copySummary = async () => {
    if (!result) return
    const lines = [
      `${ui.mode}: ${mode === 'netToGross' ? ui.netToGross : ui.grossToNet}`,
      `${ui.vatRate}: ${rate}%`,
      `${ui.net}: ${fmt(result.net)}`,
      `${ui.vat}: ${fmt(result.vat)}`,
      `${ui.gross}: ${fmt(result.gross)}`,
    ]
    await copyToClipboard(lines.join('\n'))
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
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>{ui.mode}</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as VatMode)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="netToGross">{ui.netToGross}</SelectItem>
                <SelectItem value="grossToNet">{ui.grossToNet}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{ui.amount}</Label>
            <Input
              className="h-8"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{ui.vatRate}</Label>
            <Input
              className="h-8"
              inputMode="decimal"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-xs text-muted-foreground">{ui.preset}</Label>
          {[5, 18, 20, 27].map((preset) => (
            <Button key={preset} size="sm" variant="outline" onClick={() => setRateInput(String(preset))}>
              {preset}%
            </Button>
          ))}
        </div>

        {!result ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
            {ui.invalid}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border p-3 text-xs">
              <p className="text-muted-foreground">{ui.net}</p>
              <p className="mt-1 text-lg font-semibold">{fmt(result.net)}</p>
            </div>
            <div className="rounded-md border p-3 text-xs">
              <p className="text-muted-foreground">{ui.vat}</p>
              <p className="mt-1 text-lg font-semibold">{fmt(result.vat)}</p>
            </div>
            <div className="rounded-md border p-3 text-xs">
              <p className="text-muted-foreground">{ui.gross}</p>
              <p className="mt-1 text-lg font-semibold">{fmt(result.gross)}</p>
            </div>
          </div>
        )}

        <Button size="sm" variant="outline" onClick={copySummary} disabled={!result}>
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          {ui.copySummary}
        </Button>
      </CardContent>
    </Card>
  )
}

function TextCleanupTab() {
  const { lang, t } = useI18n()
  const locale = lang === 'hu' ? 'hu-HU' : 'en-US'
  const [input, setInput] = useState('')
  const [trimLines, setTrimLines] = useState(true)
  const [collapseWhitespace, setCollapseWhitespace] = useState(true)
  const [removeEmpty, setRemoveEmpty] = useState(true)
  const [dedupeLines, setDedupeLines] = useState(false)
  const [caseMode, setCaseMode] = useState<CaseMode>('none')
  const [copied, setCopied] = useState(false)

  const ui = lang === 'hu'
    ? {
        title: 'Szöveg Tisztító',
        desc: 'Gyakori sor-szintű tisztítások: trim, whitespace, kis/nagybetűsítés, üres sor és duplikáció kezelés.',
        options: 'Opciók',
        trimLines: 'Sorok eleji/végi szóköz törlése',
        collapseWhitespace: 'Többszörös szóközök összevonása',
        removeEmpty: 'Üres sorok törlése',
        dedupeLines: 'Duplikált sorok kiszűrése',
        caseMode: 'Betűméret átalakítás',
        caseNone: 'Nincs',
        caseLower: 'kisbetűs',
        caseUpper: 'NAGYBETŰS',
        caseTitle: 'Cím formátum',
        inputLabel: 'Bemenet',
        outputLabel: 'Kimenet',
        downloadTxt: 'TXT letöltés',
        inStats: 'Bemenet',
        outStats: 'Kimenet',
        lines: 'sor',
        chars: 'karakter',
      }
    : {
        title: 'Text Cleanup',
        desc: 'Common line-level cleanup actions: trim, whitespace normalization, case transform, empty and duplicate handling.',
        options: 'Options',
        trimLines: 'Trim each line',
        collapseWhitespace: 'Collapse repeated whitespace',
        removeEmpty: 'Remove empty lines',
        dedupeLines: 'Deduplicate identical lines',
        caseMode: 'Case transform',
        caseNone: 'None',
        caseLower: 'lowercase',
        caseUpper: 'UPPERCASE',
        caseTitle: 'Title Case',
        inputLabel: 'Input',
        outputLabel: 'Output',
        downloadTxt: 'Download TXT',
        inStats: 'Input',
        outStats: 'Output',
        lines: 'lines',
        chars: 'chars',
      }

  const output = useMemo(
    () =>
      cleanupText(input, {
        trimLines,
        collapseWhitespace,
        removeEmpty,
        dedupeLines,
        caseMode,
        locale,
      }),
    [caseMode, collapseWhitespace, dedupeLines, input, locale, removeEmpty, trimLines]
  )

  const stats = useMemo(() => {
    const inLines = input.length ? input.split(/\r?\n/).length : 0
    const outLines = output.length ? output.split(/\r?\n/).length : 0
    return {
      inLines,
      outLines,
      inChars: input.length,
      outChars: output.length,
    }
  }, [input, output])

  const copyOutput = async () => {
    await copyToClipboard(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const downloadOutput = () => {
    downloadFile(output, 'cleaned-text.txt', 'text/plain;charset=utf-8')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ui.title}</CardTitle>
        <CardDescription>{ui.desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">{ui.options}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={trimLines} onCheckedChange={(checked) => setTrimLines(checked === true)} />
              {ui.trimLines}
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={collapseWhitespace} onCheckedChange={(checked) => setCollapseWhitespace(checked === true)} />
              {ui.collapseWhitespace}
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={removeEmpty} onCheckedChange={(checked) => setRemoveEmpty(checked === true)} />
              {ui.removeEmpty}
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={dedupeLines} onCheckedChange={(checked) => setDedupeLines(checked === true)} />
              {ui.dedupeLines}
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">{ui.caseMode}</Label>
            <Select value={caseMode} onValueChange={(v) => setCaseMode(v as CaseMode)}>
              <SelectTrigger className="h-8 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{ui.caseNone}</SelectItem>
                <SelectItem value="lower">{ui.caseLower}</SelectItem>
                <SelectItem value="upper">{ui.caseUpper}</SelectItem>
                <SelectItem value="title">{ui.caseTitle}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{ui.inputLabel}</Label>
            <Textarea
              className="h-56 font-mono text-xs"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('common.pasteHere')}
            />
            <p className="text-xs text-muted-foreground">
              {ui.inStats}: {stats.inLines.toLocaleString()} {ui.lines}, {stats.inChars.toLocaleString()} {ui.chars}
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{ui.outputLabel}</Label>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={copyOutput}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  {t('common.copy')}
                </Button>
                <Button size="sm" variant="outline" onClick={downloadOutput}>
                  <Download className="h-4 w-4" />
                  {ui.downloadTxt}
                </Button>
              </div>
            </div>
            <Textarea className="h-56 font-mono text-xs" value={output} readOnly />
            <p className="text-xs text-muted-foreground">
              {ui.outStats}: {stats.outLines.toLocaleString()} {ui.lines}, {stats.outChars.toLocaleString()} {ui.chars}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
