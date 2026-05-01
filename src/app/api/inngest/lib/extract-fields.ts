import { extractCsv } from "./extractor/extract-csv"
import { extractTxt } from "./extractor/extract-txt"

export interface ExtractedDocument {
  type: 'INVOICE' | 'PURCHASE_ORDER' | null
  supplierName: string | null
  documentNumber: string | null
  issueDate: string | null
  dueDate: string | null
  currency: string | null
  subtotal: number | null
  tax: number | null
  total: number | null
  lineItems: Array<{
    description: string | null
    quantity: number | null
    price: number | null
    total: number | null
  }>
}

export function extractFields(rawText: string, format: 'TXT' | 'CSV'): ExtractedDocument {
  switch (format) {
    case 'CSV': return extractCsv(rawText)
    case 'TXT': return extractTxt(rawText)
  }
}