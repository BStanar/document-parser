# API Documentation

All endpoints are exposed via tRPC at `/api/trpc`.
Base URL: `https://document-parser-opal-sigma.vercel.app/api/trpc`

---

## Documents

### Upload Document
**Procedure:** `documents.upload` - mutation
**Input:** `FormData` with a `file` field
**Supported formats:** PDF, PNG, JPG, CSV, TXT
**Max size:** 10MB

```http
POST /api/trpc/documents.upload
Content-Type: multipart/form-data

file: <binary>
```

**Response:**
```json
{
  "id": "clx...",
  "filename": "invoice.csv",
  "format": "CSV",
  "status": "UPLOADED",
  "createdAt": "2026-05-01T10:00:00.000Z"
}
```

---

### Get Documents
**Procedure:** `documents.getMany` - query
**Input:**
```json
{
  "search": ""
}
```

**Response:** Array of documents with `lineItems` and `issues` included.

```json
[
  {
    "id": "clx...",
    "filename": "invoice.csv",
    "format": "CSV",
    "status": "NEEDS_REVIEW",
    "type": "INVOICE",
    "supplierName": "Acme Corp",
    "documentNumber": "INV-001",
    "issueDate": "2026-01-01T00:00:00.000Z",
    "dueDate": "2026-02-01T00:00:00.000Z",
    "currency": "EUR",
    "subtotal": 100.00,
    "tax": 17.00,
    "total": 117.00,
    "lineItems": [],
    "issues": [],
    "createdAt": "2026-05-01T10:00:00.000Z",
    "updatedAt": "2026-05-01T10:00:00.000Z"
  }
]
```

---

### Get Document
**Procedure:** `documents.getOne` - query
**Input:**
```json
{
  "id": "clx..."
}
```

**Response:** Single document with `lineItems` and `issues` included.

```json
{
  "id": "clx...",
  "filename": "invoice.pdf",
  "format": "PDF",
  "status": "NEEDS_REVIEW",
  "type": "INVOICE",
  "supplierName": "Acme Corp",
  "documentNumber": "INV-001",
  "issueDate": "2026-01-01T00:00:00.000Z",
  "dueDate": "2026-02-01T00:00:00.000Z",
  "currency": "EUR",
  "subtotal": 100.00,
  "tax": 17.00,
  "total": 117.00,
  "rawText": "...",
  "extractedJson": {},
  "lineItems": [
    {
      "id": "clx...",
      "documentId": "clx...",
      "description": "Service A",
      "quantity": 2,
      "price": 50.00,
      "total": 100.00
    }
  ],
  "issues": [
    {
      "id": "clx...",
      "documentId": "clx...",
      "lineItemId": null,
      "field": "dueDate",
      "message": "Missing required field: dueDate",
      "createdAt": "2026-05-01T10:00:00.000Z"
    }
  ],
  "createdAt": "2026-05-01T10:00:00.000Z",
  "updatedAt": "2026-05-01T10:00:00.000Z"
}
```

---

### Update Document
**Procedure:** `documents.update` - mutation
**Input:**
```json
{
  "id": "clx...",
  "type": "INVOICE",
  "supplierName": "Acme Corp",
  "documentNumber": "INV-001",
  "issueDate": "2026-01-01",
  "dueDate": "2026-02-01",
  "currency": "EUR",
  "subtotal": 100.00,
  "tax": 17.00,
  "total": 117.00
}
```

All fields except `id` are nullable.

---

### Update Line Items
**Procedure:** `documents.updateLineItems` - mutation
**Input:**
```json
{
  "documentId": "clx...",
  "deletedItemIds": ["clx..."],
  "lineItems": [
    {
      "id": "clx...",
      "description": "Item A",
      "quantity": 2,
      "price": 50.00,
      "total": 100.00,
      "isNew": false
    }
  ]
}
```

Set `isNew: true` and `id: ""` for new items. Pass existing IDs in `deletedItemIds` to delete them.

---

### Update Status
**Procedure:** `documents.updateStatus` - mutation
**Input:**
```json
{
  "id": "clx...",
  "status": "VALIDATED"
}
```

**Status values:** `UPLOADED` | `NEEDS_REVIEW` | `VALIDATED` | `REJECTED`

---

### Reprocess Document
**Procedure:** `documents.reprocess` - mutation

Resets status to `UPLOADED` and re-triggers the full extraction and validation pipeline.

**Input:**
```json
{
  "id": "clx..."
}
```

---

### Revalidate Document
**Procedure:** `documents.revalidate` - mutation

Runs validation only against current DB state without re-extracting. Sets status to `VALIDATED` if no issues found, `NEEDS_REVIEW` otherwise. Use this after manual field or line item edits.

**Input:**
```json
{
  "id": "clx..."
}
```

---

### Reprocess Pending
**Procedure:** `documents.reprocessPending` - mutation

Re-triggers the full pipeline for all documents stuck in `UPLOADED` status.

**Response:**
```json
{
  "count": 3
}
```

---

### Get Currency Summary
**Procedure:** `documents.getTotalsByCurrency` - query

Returns total amounts grouped by currency across all documents that have a currency and total set.

**Response:**
```json
[
  { "currency": "EUR", "count": 3, "total": 2163.00 },
  { "currency": "BAM", "count": 1, "total": 999.00 },
  { "currency": "USD", "count": 2, "total": 514.00 }
]
```

---

### Remove Document
**Procedure:** `documents.remove` - mutation

Deletes the document and all associated file data, line items, and validation issues.

**Input:**
```json
{
  "id": "clx..."
}
```

---

## Background Processing

Two Inngest functions handle document processing.

### `document/uploaded` - Full pipeline

Triggered automatically on upload and manually via `documents.reprocess`.

**Event payload:**
```json
{
  "data": {
    "documentId": "clx..."
  }
}
```

**Pipeline steps:**
1. `fetch-document` - loads document and file data from DB
2. `extract-text` - converts file to raw text (empty string for IMAGE and PDF)
3. `parse-structured-fields` - runs format-specific extractor:
   - **CSV** - PapaParse row mapping, line items from rows, subtotal summed from line item totals
   - **TXT** - regex pattern matching on labeled fields, shared `parseAmount` utility for number normalization
   - **PDF** - pdf2json text extraction with label-aware normalization, then TXT extractor
   - **IMAGE** - Azure Document Intelligence `prebuilt-invoice` model with TXT extractor fallback for unlabeled fields
4. `save-to-db` - deletes existing line items and validation issues, persists extracted fields and new line items
5. `run-validation` - runs all validation rules, saves issues, sets status to `VALIDATED` or `NEEDS_REVIEW`

---

### `document/revalidate` - Validation only

Triggered via `documents.revalidate`. Skips extraction entirely.

**Event payload:**
```json
{
  "data": {
    "documentId": "clx..."
  }
}
```

**Steps:**
1. `run-validation` - runs all validation rules against current DB state, saves issues, sets status to `VALIDATED` or `NEEDS_REVIEW`

---

## Validation Rules

The validation engine runs the following checks:

| Rule | Field | Description |
|---|---|---|
| Missing required fields | various | Flags null values for `type`, `supplierName`, `documentNumber`, `issueDate`, `dueDate`, `currency`, `total`, `tax` |
| Date order | `issueDate` | Flags if `issueDate` is after `dueDate` |
| Duplicate document number | `documentNumber` | Flags if another document has the same `documentNumber` |
| Line item calculation | `lineItem.total` | Flags if `quantity × price != total` (tolerance 0.001) |
| Subtotal mismatch | `subtotal` | Flags if `sum(lineItems.total) != subtotal` (tolerance 0.01) |
| Total mismatch | `total` | Flags if `subtotal + tax != total` (tolerance 0.001) |

**Known limitation:** Per-line-item VAT is not accounted for. Invoices where line item totals include tax will produce false line item mismatch warnings.

---

## Azure Document Intelligence

Image and PDF extraction uses the Azure `prebuilt-invoice` model.

**Required environment variables:**
AZURE_DOCUMENT_INTELLIGENCE_KEY=your-key
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/

**Supported features:**
- Multi-language invoices (English, French, Arabic, and more)
- Complex table layouts and multi-column formats
- Extracts: vendor name, invoice ID, dates, currency, line items, subtotal, tax, total
- Falls back to regex extraction for fields the model misses
