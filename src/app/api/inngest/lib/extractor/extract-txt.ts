import { ExtractedDocument } from "../extract-fields";
import { parseAmount } from "../parse-amount";

type Fields = {
  total: number | null;
  currency: string | null;
  subtotal: number | null;
  tax: number | null;
  supplierName: string | null;
  issueDate: string | null;
  dueDate: string | null;
};

const FIELD_PATTERNS: Array<{
  key: keyof Fields;
  pattern: RegExp;
  parse: (match: RegExpMatchArray) => string | number | null;
}> = [
  {
    key: "total",
    pattern: /^total[:\s]+([\d.,]+)\s*([A-Z]{3})?/i,
    parse: (match) => parseAmount(match[1]),
  },
  {
    key: "currency",
    pattern: /^total[:\s]+[\d.,]+\s*([A-Z]{3})/i,
    parse: (match) => match[1].toUpperCase(),
  },
  {
    key: "subtotal",
    pattern: /^subtotal[:\s]+([\d.,]+)/i,
    parse: (match) => parseAmount(match[1]),
  },
  {
    key: "tax",
    pattern: /^(?:tax|vat)[:\s]+([\d.,]+)/i,
    parse: (match) => parseAmount(match[1]),
  },
  {
    key: "supplierName",
    pattern: /^(?:supplier|vendor|company|from)[:\s]+(.+)/i,
    parse: (match) => match[1].trim(),
  },
  {
    key: "issueDate",
    pattern: /^(?:issue\s*date|date)[:\s]+(.+)/i,
    parse: (match) => parseDateStr(match[1].trim()),
  },
  {
    key: "dueDate",
    pattern: /^due\s*date[:\s]+(.+)/i,
    parse: (match) => parseDateStr(match[1].trim()),
  },
];

export function extractTxt(raw: string): ExtractedDocument {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const headerLine = lines[0] ?? "";
  const type = /invoice/i.test(headerLine)
    ? "INVOICE"
    : /purchase.?order|po/i.test(headerLine)
      ? "PURCHASE_ORDER"
      : null;

  const headerTokens = headerLine.split(/\s+/);
  const documentNumber =
    headerTokens.length > 1 ? headerTokens[headerTokens.length - 1] : null;

  const fields: Fields = {
    total: null,
    currency: null,
    subtotal: null,
    tax: null,
    supplierName: null,
    issueDate: null,
    dueDate: null,
  };

  for (const line of lines) {
    for (const { key, pattern, parse } of FIELD_PATTERNS) {
      if (fields[key] !== null) continue;
      const match = line.match(pattern);
      if (match) fields[key] = parse(match) as any;
    }
  }

  return {
    type,
    documentNumber,
    lineItems: [],
    ...fields,
  };
}

function parseDateStr(dateString: string): string | null {
  // ISO - already correct
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString

  // DD/MM/YYYY or MM/DD/YYYY - treat as local, no timezone conversion
  const slash = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slash) {
    const [, a, b, y] = slash
    return `${y}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`
  }

  // DD.MM.YYYY
  const dot = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dot) {
    const [, d, m, y] = dot
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // DD-MM-YYYY
  const dash = dateString.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (dash) {
    const [, d, m, y] = dash
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  return null
}
