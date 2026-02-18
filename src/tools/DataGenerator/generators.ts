import { faker } from '@faker-js/faker'

export type ColumnType =
  // Person
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'username'
  | 'jobTitle'
  // Location
  | 'address'
  | 'city'
  | 'country'
  | 'zipCode'
  | 'latitude'
  | 'longitude'
  // Commerce / Business
  | 'productName'
  | 'productCategory'
  | 'productDescription'
  | 'price'
  | 'color'
  | 'company'
  | 'department'
  | 'iban'
  | 'creditCard'
  // Data types
  | 'date'
  | 'datetime'
  | 'int'
  | 'float'
  | 'boolean'
  | 'uuid'
  | 'enum'
  // Tech
  | 'url'
  | 'ipAddress'
  | 'userAgent'
  | 'fileName'
  | 'mimeType'
  // Text
  | 'word'
  | 'sentence'
  | 'paragraph'
  | 'loremWords'
  // Custom
  | 'customRegex'

export interface ColumnDef {
  id: string
  name: string
  type: ColumnType
  unique?: boolean
  // int/float
  min?: number
  max?: number
  // date
  dateFrom?: string
  dateTo?: string
  // enum
  enumValues?: string
  // customRegex
  pattern?: string
}

export const COLUMN_TYPE_GROUPS: { labelKey: string; types: ColumnType[] }[] = [
  {
    labelKey: 'dg.group.person',
    types: ['firstName', 'lastName', 'fullName', 'email', 'phone', 'username', 'jobTitle'],
  },
  {
    labelKey: 'dg.group.location',
    types: ['address', 'city', 'country', 'zipCode', 'latitude', 'longitude'],
  },
  {
    labelKey: 'dg.group.commerce',
    types: ['productName', 'productCategory', 'productDescription', 'price', 'color', 'company', 'department', 'iban', 'creditCard'],
  },
  {
    labelKey: 'dg.group.dataTypes',
    types: ['date', 'datetime', 'int', 'float', 'boolean', 'uuid', 'enum'],
  },
  {
    labelKey: 'dg.group.tech',
    types: ['url', 'ipAddress', 'userAgent', 'fileName', 'mimeType'],
  },
  {
    labelKey: 'dg.group.text',
    types: ['word', 'sentence', 'paragraph', 'loremWords'],
  },
  {
    labelKey: 'dg.group.custom',
    types: ['customRegex'],
  },
]

export const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  // Person
  firstName: 'First Name',
  lastName: 'Last Name',
  fullName: 'Full Name',
  email: 'Email',
  phone: 'Phone',
  username: 'Username',
  jobTitle: 'Job Title',
  // Location
  address: 'Address',
  city: 'City',
  country: 'Country',
  zipCode: 'Zip Code',
  latitude: 'Latitude',
  longitude: 'Longitude',
  // Commerce
  productName: 'Product Name',
  productCategory: 'Product Category',
  productDescription: 'Product Description',
  price: 'Price',
  color: 'Color',
  company: 'Company',
  department: 'Department',
  iban: 'IBAN',
  creditCard: 'Credit Card',
  // Data types
  date: 'Date',
  datetime: 'Date + Time',
  int: 'Integer',
  float: 'Float',
  boolean: 'Boolean',
  uuid: 'UUID',
  enum: 'Enum (custom list)',
  // Tech
  url: 'URL',
  ipAddress: 'IP Address',
  userAgent: 'User Agent',
  fileName: 'File Name',
  mimeType: 'MIME Type',
  // Text
  word: 'Random Word',
  sentence: 'Sentence',
  paragraph: 'Paragraph',
  loremWords: 'Lorem (N words)',
  // Custom
  customRegex: 'Custom Regex',
}

function seedFaker(seed: number) {
  faker.seed(seed)
}

function generateValue(col: ColumnDef): string {
  switch (col.type) {
    // ── Person ──
    case 'firstName':
      return faker.person.firstName()
    case 'lastName':
      return faker.person.lastName()
    case 'fullName':
      return faker.person.fullName()
    case 'email':
      return faker.internet.email()
    case 'phone':
      return faker.phone.number()
    case 'username':
      return faker.internet.username()
    case 'jobTitle':
      return faker.person.jobTitle()

    // ── Location ──
    case 'address':
      return faker.location.streetAddress()
    case 'city':
      return faker.location.city()
    case 'country':
      return faker.location.country()
    case 'zipCode':
      return faker.location.zipCode()
    case 'latitude':
      return faker.location.latitude().toString()
    case 'longitude':
      return faker.location.longitude().toString()

    // ── Commerce / Business ──
    case 'productName':
      return faker.commerce.productName()
    case 'productCategory':
      return faker.commerce.department()
    case 'productDescription':
      return faker.commerce.productDescription()
    case 'price': {
      const min = col.min ?? 1
      const max = col.max ?? 999
      return faker.commerce.price({ min, max })
    }
    case 'color':
      return faker.color.human()
    case 'company':
      return faker.company.name()
    case 'department':
      return faker.commerce.department()
    case 'iban':
      return faker.finance.iban()
    case 'creditCard':
      return faker.finance.creditCardNumber()

    // ── Data types ──
    case 'date': {
      const from = col.dateFrom ? new Date(col.dateFrom) : new Date('1970-01-01')
      const to = col.dateTo ? new Date(col.dateTo) : new Date()
      return faker.date.between({ from, to }).toISOString().split('T')[0]
    }
    case 'datetime': {
      const from = col.dateFrom ? new Date(col.dateFrom) : new Date('1970-01-01')
      const to = col.dateTo ? new Date(col.dateTo) : new Date()
      return faker.date.between({ from, to }).toISOString()
    }
    case 'int': {
      const min = col.min ?? 0
      const max = col.max ?? 1000
      return String(faker.number.int({ min, max }))
    }
    case 'float': {
      const min = col.min ?? 0
      const max = col.max ?? 1000
      return faker.number.float({ min, max, fractionDigits: 2 }).toFixed(2)
    }
    case 'boolean':
      return faker.datatype.boolean() ? 'true' : 'false'
    case 'uuid':
      return faker.string.uuid()
    case 'enum': {
      const values = (col.enumValues ?? 'A,B,C').split(',').map((v) => v.trim()).filter(Boolean)
      return faker.helpers.arrayElement(values.length > 0 ? values : ['A', 'B', 'C'])
    }

    // ── Tech ──
    case 'url':
      return faker.internet.url()
    case 'ipAddress':
      return faker.internet.ip()
    case 'userAgent':
      return faker.internet.userAgent()
    case 'fileName':
      return faker.system.fileName()
    case 'mimeType':
      return faker.system.mimeType()

    // ── Text ──
    case 'word':
      return faker.lorem.word()
    case 'sentence':
      return faker.lorem.sentence()
    case 'paragraph':
      return faker.lorem.paragraph()
    case 'loremWords': {
      const count = col.min ?? 3
      return faker.lorem.words(count)
    }

    // ── Custom ──
    case 'customRegex': {
      try {
        return faker.helpers.fromRegExp(col.pattern ?? '[A-Z]{3}[0-9]{3}')
      } catch {
        return 'INVALID_PATTERN'
      }
    }
    default:
      return ''
  }
}

export function generateRows(
  columns: ColumnDef[],
  rowCount: number,
  seed?: number
): Record<string, string>[] {
  if (seed !== undefined) {
    seedFaker(seed)
  }

  const uniqueSets: Map<string, Set<string>> = new Map()
  columns.forEach((col) => {
    if (col.unique) uniqueSets.set(col.id, new Set())
  })

  const rows: Record<string, string>[] = []

  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, string> = {}
    for (const col of columns) {
      if (col.unique) {
        const set = uniqueSets.get(col.id)!
        let val = generateValue(col)
        let attempts = 0
        while (set.has(val) && attempts < 1000) {
          val = generateValue(col)
          attempts++
        }
        set.add(val)
        row[col.name] = val
      } else {
        row[col.name] = generateValue(col)
      }
    }
    rows.push(row)
  }

  return rows
}
