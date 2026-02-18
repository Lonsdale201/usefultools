import { useState, useCallback } from 'react'
import { Plus, Trash2, RefreshCw, Download, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { type ColumnDef, type ColumnType, COLUMN_TYPE_GROUPS, generateRows } from './generators'
import { exportCSV, exportJSON, exportXLSX, exportSQL } from './export'
import { useI18n } from '@/lib/i18n'

type PresetKey = 'users' | 'orders' | 'products' | 'empty'

const PRESET_COLUMNS: Record<PresetKey, { tableName: string; columns: ColumnDef[] }> = {
  users: {
    tableName: 'users',
    columns: [
      { id: 'p1', name: 'id', type: 'uuid' },
      { id: 'p2', name: 'first_name', type: 'firstName' },
      { id: 'p3', name: 'last_name', type: 'lastName' },
      { id: 'p4', name: 'email', type: 'email', unique: true },
      { id: 'p5', name: 'phone', type: 'phone' },
      { id: 'p6', name: 'birth_date', type: 'date', dateFrom: '1960-01-01', dateTo: '2005-12-31' },
    ],
  },
  orders: {
    tableName: 'orders',
    columns: [
      { id: 'p1', name: 'order_id', type: 'uuid' },
      { id: 'p2', name: 'customer_name', type: 'fullName' },
      { id: 'p3', name: 'email', type: 'email' },
      { id: 'p4', name: 'product', type: 'productName' },
      { id: 'p5', name: 'category', type: 'productCategory' },
      { id: 'p6', name: 'price', type: 'price', min: 5, max: 500 },
      { id: 'p7', name: 'quantity', type: 'int', min: 1, max: 10 },
      { id: 'p8', name: 'order_date', type: 'date', dateFrom: '2024-01-01', dateTo: '2026-02-18' },
      { id: 'p9', name: 'status', type: 'enum', enumValues: 'pending,shipped,delivered,cancelled' },
    ],
  },
  products: {
    tableName: 'products',
    columns: [
      { id: 'p1', name: 'id', type: 'uuid' },
      { id: 'p2', name: 'name', type: 'productName' },
      { id: 'p3', name: 'description', type: 'productDescription' },
      { id: 'p4', name: 'category', type: 'productCategory' },
      { id: 'p5', name: 'price', type: 'price', min: 1, max: 999 },
      { id: 'p6', name: 'color', type: 'color' },
      { id: 'p7', name: 'in_stock', type: 'boolean' },
    ],
  },
  empty: {
    tableName: 'data',
    columns: [],
  },
}

const PRESET_KEYS: PresetKey[] = ['users', 'orders', 'products', 'empty']

const PRESET_LABEL_KEYS: Record<PresetKey, string> = {
  users: 'dg.preset.users',
  orders: 'dg.preset.orders',
  products: 'dg.preset.products',
  empty: 'dg.preset.empty',
}

let idCounter = 100

function newId() {
  return String(idCounter++)
}

function getColumnTypeLabel(type: ColumnType, lang: 'en' | 'hu') {
  const labels: Record<'en' | 'hu', Record<ColumnType, string>> = {
    en: {
      firstName: 'First Name',
      lastName: 'Last Name',
      fullName: 'Full Name',
      email: 'Email',
      phone: 'Phone',
      username: 'Username',
      jobTitle: 'Job Title',
      address: 'Address',
      city: 'City',
      country: 'Country',
      zipCode: 'Zip Code',
      latitude: 'Latitude',
      longitude: 'Longitude',
      productName: 'Product Name',
      productCategory: 'Product Category',
      productDescription: 'Product Description',
      price: 'Price',
      color: 'Color',
      company: 'Company',
      department: 'Department',
      iban: 'IBAN',
      creditCard: 'Credit Card',
      date: 'Date',
      datetime: 'Date + Time',
      int: 'Integer',
      float: 'Float',
      boolean: 'Boolean',
      uuid: 'UUID',
      enum: 'Enum (custom list)',
      url: 'URL',
      ipAddress: 'IP Address',
      userAgent: 'User Agent',
      fileName: 'File Name',
      mimeType: 'MIME Type',
      word: 'Random Word',
      sentence: 'Sentence',
      paragraph: 'Paragraph',
      loremWords: 'Lorem (N words)',
      customRegex: 'Custom Regex',
    },
    hu: {
      firstName: 'Keresztnév',
      lastName: 'Vezetéknév',
      fullName: 'Teljes név',
      email: 'Email',
      phone: 'Telefonszám',
      username: 'Felhasználónév',
      jobTitle: 'Beosztás',
      address: 'Cím',
      city: 'Város',
      country: 'Ország',
      zipCode: 'Irányítószám',
      latitude: 'Szélesség',
      longitude: 'Hosszúság',
      productName: 'Terméknév',
      productCategory: 'Termék kategória',
      productDescription: 'Termék leírás',
      price: 'Ár',
      color: 'Szín',
      company: 'Cég',
      department: 'Részleg',
      iban: 'IBAN',
      creditCard: 'Bankkártya',
      date: 'Dátum',
      datetime: 'Dátum + idő',
      int: 'Egész szám',
      float: 'Törtszám',
      boolean: 'Logikai',
      uuid: 'UUID',
      enum: 'Enum (saját lista)',
      url: 'URL',
      ipAddress: 'IP cím',
      userAgent: 'User Agent',
      fileName: 'Fájlnév',
      mimeType: 'MIME típus',
      word: 'Véletlen szó',
      sentence: 'Mondat',
      paragraph: 'Bekezdés',
      loremWords: 'Lorem (N szó)',
      customRegex: 'Egyedi regex',
    },
  }
  return labels[lang][type]
}

export function DataGenerator() {
  const { t, lang } = useI18n()
  const [columns, setColumns] = useState<ColumnDef[]>(PRESET_COLUMNS.users.columns)
  const [rowCount, setRowCount] = useState(100)
  const [seed, setSeed] = useState<string>('')
  const [tableName, setTableName] = useState('users')
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [generated, setGenerated] = useState(false)

  const loadPreset = (key: PresetKey) => {
    const preset = PRESET_COLUMNS[key]
    setColumns(preset.columns.map((c) => ({ ...c, id: String(idCounter++) })))
    setTableName(preset.tableName)
    setPreview([])
    setGenerated(false)
  }

  const addColumn = () => {
    setColumns((prev) => [
      ...prev,
      { id: newId(), name: `column_${prev.length + 1}`, type: 'firstName' },
    ])
  }

  const removeColumn = (id: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== id))
  }

  const updateColumn = useCallback((id: string, patch: Partial<ColumnDef>) => {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const moveColumn = (id: string, dir: -1 | 1) => {
    setColumns((prev) => {
      const idx = prev.findIndex((c) => c.id === id)
      if (idx < 0) return prev
      const next = idx + dir
      if (next < 0 || next >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr
    })
  }

  const generate = (previewOnly = false) => {
    const seedNum = seed !== '' ? parseInt(seed) : undefined
    const rows = generateRows(columns, previewOnly ? Math.min(rowCount, 10) : rowCount, seedNum)
    setPreview(rows.slice(0, 10))
    setGenerated(true)
    return rows
  }

  const allRows = () => {
    const seedNum = seed !== '' ? parseInt(seed) : undefined
    return generateRows(columns, rowCount, seedNum)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('dg.title')}</h1>
        <p className="text-muted-foreground">{t('dg.subtitle')}</p>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">{t('dg.preset')}:</span>
        {PRESET_KEYS.map((key) => (
          <Button key={key} variant="outline" size="sm" onClick={() => loadPreset(key)}>
            {t(PRESET_LABEL_KEYS[key])}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Schema editor */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dg.schema')}</CardTitle>
            <CardDescription>{t('dg.schema.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {columns.map((col, idx) => (
              <ColumnRow
                key={col.id}
                col={col}
                isFirst={idx === 0}
                isLast={idx === columns.length - 1}
                onChange={(patch) => updateColumn(col.id, patch)}
                onRemove={() => removeColumn(col.id)}
                onMove={(dir) => moveColumn(col.id, dir)}
                t={t}
                lang={lang}
              />
            ))}
            <Button variant="outline" size="sm" onClick={addColumn} className="mt-2 w-full">
              <Plus className="mr-1 h-4 w-4" /> {t('dg.addColumn')}
            </Button>
          </CardContent>
        </Card>

        {/* Config panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('common.settings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t('dg.rowCount')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={10000}
                  value={rowCount}
                  onChange={(e) => setRowCount(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('dg.seed')}</Label>
                <Input
                  placeholder={t('dg.seed.placeholder')}
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('dg.tableName')}</Label>
                <Input
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={() => generate(true)}>
                <RefreshCw className="mr-2 h-4 w-4" /> {t('dg.generatePreview')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('common.export')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => exportCSV(allRows())}>
                <Download className="mr-1 h-3 w-3" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportXLSX(allRows())}>
                <Download className="mr-1 h-3 w-3" /> XLSX
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportJSON(allRows())}>
                <Download className="mr-1 h-3 w-3" /> JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportSQL(allRows(), tableName)}>
                <Download className="mr-1 h-3 w-3" /> SQL
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview table */}
      {generated && preview.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('dg.previewTitle')}</CardTitle>
              <Badge variant="secondary">{rowCount} {t('dg.totalRows')}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b">
                    {columns.map((col) => (
                      <th key={col.id} className="px-2 py-1.5 text-left font-semibold text-muted-foreground whitespace-nowrap">
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b hover:bg-muted/40">
                      {columns.map((col) => (
                        <td key={col.id} className="px-2 py-1.5 whitespace-nowrap max-w-[200px] truncate">
                          {row[col.name]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface ColumnRowProps {
  col: ColumnDef
  isFirst: boolean
  isLast: boolean
  onChange: (patch: Partial<ColumnDef>) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
  t: (key: string) => string
  lang: 'en' | 'hu'
}

function ColumnRow({ col, isFirst, isLast, onChange, onRemove, onMove, t, lang }: ColumnRowProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
      <div className="flex flex-col">
        <button
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          onClick={() => onMove(-1)}
          disabled={isFirst}
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          onClick={() => onMove(1)}
          disabled={isLast}
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      <Input
        className="h-8 w-36 text-xs"
        value={col.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder={t('dg.columnName')}
      />

      <Select value={col.type} onValueChange={(v) => onChange({ type: v as ColumnType })}>
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {COLUMN_TYPE_GROUPS.map((group, gi) => (
            <div key={group.labelKey}>
              {gi > 0 && <SelectSeparator />}
              <SelectGroup>
                <SelectLabel className="text-xs font-bold text-primary">{t(group.labelKey)}</SelectLabel>
                {group.types.map((tp) => (
                  <SelectItem key={tp} value={tp} className="text-xs">
                    {getColumnTypeLabel(tp, lang)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </div>
          ))}
        </SelectContent>
      </Select>

      {/* Type-specific options */}
      {(col.type === 'int' || col.type === 'float' || col.type === 'price') && (
        <>
          <Input
            className="h-8 w-16 text-xs"
            type="number"
            placeholder="min"
            value={col.min ?? ''}
            onChange={(e) => onChange({ min: e.target.value === '' ? undefined : Number(e.target.value) })}
          />
          <Input
            className="h-8 w-16 text-xs"
            type="number"
            placeholder="max"
            value={col.max ?? ''}
            onChange={(e) => onChange({ max: e.target.value === '' ? undefined : Number(e.target.value) })}
          />
        </>
      )}

      {(col.type === 'date' || col.type === 'datetime') && (
        <>
          <Input
            className="h-8 w-32 text-xs"
            type="date"
            value={col.dateFrom ?? ''}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
          />
          <Input
            className="h-8 w-32 text-xs"
            type="date"
            value={col.dateTo ?? ''}
            onChange={(e) => onChange({ dateTo: e.target.value })}
          />
        </>
      )}

      {col.type === 'loremWords' && (
        <Input
          className="h-8 w-20 text-xs"
          type="number"
          placeholder={t('dg.group.text')}
          min={1}
          max={50}
          value={col.min ?? 3}
          onChange={(e) => onChange({ min: e.target.value === '' ? 3 : Number(e.target.value) })}
        />
      )}

      {col.type === 'enum' && (
        <Input
          className="h-8 flex-1 text-xs"
          placeholder="A,B,C"
          value={col.enumValues ?? ''}
          onChange={(e) => onChange({ enumValues: e.target.value })}
        />
      )}

      {col.type === 'customRegex' && (
        <Input
          className="h-8 flex-1 text-xs font-mono"
          placeholder="[A-Z]{3}[0-9]{3}"
          value={col.pattern ?? ''}
          onChange={(e) => onChange({ pattern: e.target.value })}
        />
      )}

      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer ml-auto">
        <Checkbox
          checked={col.unique ?? false}
          onCheckedChange={(checked) => onChange({ unique: checked === true })}
          className="h-3.5 w-3.5"
        />
        {t('common.unique')}
      </label>

      <button
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
