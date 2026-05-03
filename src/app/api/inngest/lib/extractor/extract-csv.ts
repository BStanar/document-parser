import Papa from 'papaparse'
import { ExtractedDocument } from '../extract-fields'
import { parseAmount } from '../parse-amount'

export function extractCsv(raw: string): ExtractedDocument {
  const { data, errors } = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  })

  if (errors.length && !data.length) return emptyDoc()

  const lineItems = data.map((row) => {
    const num = (key: string) => parseAmount(row[key])
    return {
      description: row['desc'] ?? row['description'] ?? null,
      quantity:    num('qty') ?? num('quantity'),
      price:       num('price') ?? num('unit_price'),
      total:       num('total') ?? num('amount'),
    }
  })

  const subtotal = lineItems.reduce((sum, item) => sum + (item.total ?? 0), 0)

  return {
    ...emptyDoc(),
    type: 'INVOICE',
    lineItems,
    subtotal,
    total: subtotal,
  }
}

function emptyDoc(): ExtractedDocument {
  return {
    type: null, supplierName: null, documentNumber: null,
    issueDate: null, dueDate: null, currency: null,
    subtotal: null, tax: null, total: null, lineItems: [],
  }
}