import { ExtractedDocument } from "../extract-fields";
import { extractTxt } from "./extract-txt";

function safeDecodeURIComponent(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

function emptyDoc(): ExtractedDocument {
  return {
    type: null, supplierName: null, documentNumber: null,
    issueDate: null, dueDate: null, currency: null,
    subtotal: null, tax: null, total: null, lineItems: [],
  }
}

export async function extractPdf(buffer: Buffer): Promise<ExtractedDocument> {
  const PDFParser = require('pdf2json')

  return new Promise((resolve) => {
    const parser = new PDFParser()

    parser.on('pdfParser_dataError', () => resolve(emptyDoc()))
    parser.on('pdfParser_dataReady', (data: any) => {
      const rawText = data.Pages?.map((page: any) =>
        page.Texts?.map((t: any) =>
          safeDecodeURIComponent(t.R?.map((r: any) => r.T).join(''))
        ).join(' ')
      ).join('\n') ?? ''

      const text = rawText
        .replace(/(Purchase Order|Invoice)/gi, '\n$1\n')
        .replace(/(Supplier:|Vendor:|Company:|From:)\s*/gi, '\nSupplier: ')
        .replace(/(Number:|Invoice\s*No:|PO\s*No:)\s*/gi, '\nNumber: ')
        .replace(/(?<!\w)(Date:)\s*/gi, '\nDate: ')
        .replace(/(Due\s*Date:)\s*/gi, '\nDue Date: ')
        .replace(/(Description\s+Qty\s+Unit\s*Price\s+Total)/gi, '\n$1\n')
        .replace(/\s+Subtotal\s+([\d.,]+)/gi, '\nSubtotal $1')
        .replace(/\s+Tax\s*(?:\([^)]*\))?\s*([\d.,]+)/gi, '\nTax $1')
        .replace(/(?<!\w)Total\s+([\d.,]+)/gi, '\nTotal $1')

      resolve(extractTxt(text))
    })

    parser.parseBuffer(buffer)
  })
}