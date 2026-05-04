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
  "search": "",
  "status": ""
}
```

**Status values:** `UPLOADED` | `NEEDS_REVIEW` | `VALIDATED` | `REJECTED`

**Response:** Array of documents with `lineItems` and `issues` included.

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

### Update Status
**Procedure:** `documents.updateStatus` - mutation
**Input:**
```json
{
  "id": "clx...",
  "status": "VALIDATED"
}
```

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

### Get Currency Summary
**Procedure:** `documents.getSummaryByCurrency` - query

Returns total amounts grouped by currency across all documents.

**Response:**
```json
[
  { "currency": "EUR", "count": 3, "total": 2163.00 },
  { "currency": "BAM", "count": 1, "total": 999.00 }
]
```

---

### Remove Document
**Procedure:** `documents.remove` - mutation
**Input:**
```json
{
  "id": "clx..."
}
```

---

## Background Processing

Document processing is handled asynchronously via Inngest.

**Event:** `document/uploaded`
**Payload:**
```json
{
  "data": {
    "documentId": "clx..."
  }
}
```

**Pipeline steps:**
1. `fetch-document` - loads document and file data from DB
2. `extract-text` - converts file to raw text
3. `parse-structured-fields` - runs format-specific extractor
4. `save-to-db` - persists extracted fields and line items
5. `run-validation` - runs validation engine and saves issues 