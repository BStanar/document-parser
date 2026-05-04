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
  documentNumber: string | null;
};

const FIELD_PATTERNS: Array<{
  key: keyof Fields;
  pattern: RegExp;
  parse: (match: RegExpMatchArray) => string | number | null;
}> = [
  {
    key: "total",
    pattern: /^total[^0-9]*([\d.,]+)\s*([A-Z]{3})?\s*$/i,
    parse: (match) => parseAmount(match[1]),
  },
  {
    key: "currency",
    pattern: /^total[^0-9]+[\d.,]+\s*([A-Z]{3})\s*$/i,
    parse: (match) => match[1].toUpperCase(),
  },
  {
    key: "subtotal",
    pattern: /^subtotal[^0-9]*([\d.,]+)\s*$/i,
    parse: (match) => parseAmount(match[1]),
  },
  {
    key: "tax",
    pattern: /^(?:tax|vat)[^0-9]*([\d.,]+)\s*$/i,
    parse: (match) => parseAmount(match[1]),
  },
  {
    key: "documentNumber",
    pattern:
      /^(?:number|invoice\s*(?:no|number|#)?|po\s*(?:no|number)?)[:\s#]+([A-Z0-9\-\/]+)/i,
    parse: (match) => match[1].trim(),
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

  const fields: Fields = {
    total: null,
    currency: null,
    subtotal: null,
    tax: null,
    supplierName: null,
    issueDate: null,
    dueDate: null,
    documentNumber: null,
  };

  for (const line of lines) {
    for (const { key, pattern, parse } of FIELD_PATTERNS) {
      if (fields[key] !== null) continue;
      const match = line.match(pattern);
      if (match) fields[key] = parse(match) as any;
    }
  }

  const lineItems = extractLineItems(lines);

  return {
    type,
    lineItems,
    ...fields,
  };
}

function extractLineItems(lines: string[]): ExtractedDocument["lineItems"] {
  const lineItems: ExtractedDocument["lineItems"] = []

  const headerIndex = lines.findIndex(
    (line) => /description/i.test(line) && /total/i.test(line)
  )

  if (headerIndex === -1) return lineItems

  for (const line of lines.slice(headerIndex + 1)) {
    if (/^(subtotal|sub\s*total|tax|vat|total|discount)/i.test(line)) break

    // extract all numbers from the line
    const numberMatches = [...line.matchAll(/([\d.,]+)/g)]
    const numbers = numberMatches
      .map(match => parseAmount(match[1]))
      .filter((n): n is number => n !== null)

    if (numbers.length < 2) continue

    const total = numbers[numbers.length - 1]
    const price = numbers[numbers.length - 2]
    const qty = numbers.length >= 3 ? numbers[numbers.length - 3] : null

    // description is everything before the first number match
    const firstNumberMatch = numberMatches[numbers.length >= 3 ? numberMatches.length - 3 : numberMatches.length - 2]
    const descriptionEndIndex = firstNumberMatch?.index ?? line.length
    const description = line.slice(0, descriptionEndIndex).replace(/\s+$/, '') || null

    if (!description) continue

    lineItems.push({
      description,
      quantity: qty,
      price,
      total,
    })
  }

  return lineItems
}

function parseDateStr(dateString: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

  const slash = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, a, b, y] = slash;
    return `${y}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`;
  }

  const dot = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dot) {
    const [, d, m, y] = dot;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const dash = dateString.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dash) {
    const [, d, m, y] = dash;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return null;
}
