import { ExtractedDocument } from '../extract-fields'

export function extractTxt(raw: string): ExtractedDocument {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

  // line 0: "Invoice TXT-2" -> type + documentNumber
  const headerLine = lines[0] ?? ''
  const type = /invoice/i.test(headerLine) ? 'INVOICE'
             : /purchase.?order|PO/i.test(headerLine) ? 'PURCHASE_ORDER'
             : null

  // grab last token as documentNumber ("Invoice TXT-2" -> "TXT-2")
  const headerTokens = headerLine.split(/\s+/)
  const documentNumber = headerTokens.length > 1 ? headerTokens[headerTokens.length - 1] : null

  // scan all lines for labeled fields
  let total: number | null = null
  let subtotal: number | null = null
  let tax: number | null = null
  let currency: string | null = null
  let supplierName: string | null = null
  let issueDate: string | null = null
  let dueDate: string | null = null

  for (const line of lines) {
    const lower = line.toLowerCase()

    // "Total: 999 BAM" or "Total: $999"
    if (/^total[:\s]/i.test(line)) {
      const m = line.match(/total[:\s]+([\d.]+)\s*([A-Z]{3})?/i)
      if (m) {
        total = parseFloat(m[1])
        if (m[2]) currency = m[2].toUpperCase()
      }
    }

    if (/^subtotal[:\s]/i.test(line)) {
      const m = line.match(/subtotal[:\s]+([\d.]+)/i)
      if (m) subtotal = parseFloat(m[1])
    }

    if (/^tax[:\s]|^vat[:\s]/i.test(line)) {
      const m = line.match(/(?:tax|vat)[:\s]+([\d.]+)/i)
      if (m) tax = parseFloat(m[1])
    }

    if (/^(?:supplier|vendor|from|company)[:\s]/i.test(line)) {
      supplierName = line.replace(/^[^:]+:\s*/, '').trim()
    }

    if (/^(?:issue\s*date|date)[:\s]/i.test(line)) {
      const m = line.match(/:\s*(.+)$/)
      if (m) issueDate = parseDateStr(m[1].trim())
    }

    if (/^due\s*date[:\s]/i.test(line)) {
      const m = line.match(/:\s*(.+)$/)
      if (m) dueDate = parseDateStr(m[1].trim())
    }

    // detect inline currency symbols if not found yet
    if (!currency) {
      if (/€/.test(line)) currency = 'EUR'
      else if (/£/.test(line)) currency = 'GBP'
      else if (/\$/.test(line)) currency = 'USD'
      else {
        const iso = line.match(/\b(USD|EUR|GBP|BAM|CAD|AUD)\b/)
        if (iso) currency = iso[1]
      }
    }
  }

  return {
    type,
    supplierName,
    documentNumber,
    issueDate,
    dueDate,
    currency,
    subtotal,
    tax,
    total,
    lineItems: [],
  }
}

function parseDateStr(s: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return null
}