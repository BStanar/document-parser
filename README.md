# Smart Document Processing System

## Live Application

https://document-parser-opal-sigma.vercel.app

## Setup Instructions

### Prerequisites

- Node.js 22+
- npm
- PostgreSQL database (or Prisma Postgres hosted)
- Inngest account (https://app.inngest.com)
- Azure Document Intelligence resource (https://portal.azure.com)

### Installation

```bash
git clone <your-repo-url>
cd document-parser
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
DATABASE_URL=your-prisma-postgres-url
INNGEST_EVENT_KEY=evt-...
INNGEST_SIGNING_KEY=signkey-prod-...
AZURE_DOCUMENT_INTELLIGENCE_KEY=your-azure-key
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
```

### Database Setup

```bash
npx prisma db push
npx prisma generate
```

### Running Locally

Start the Inngest dev server in one terminal:

```bash
npx inngest-cli@latest dev
```

Start the Next.js app in another terminal:

```bash
npm run dev
```

Open http://localhost:3000

---

### Docker

Build and run with Docker:

```bash
docker build -t document-parser .
docker compose up --build
```

Or run directly:

```bash
docker run -p 3000:3000 --env-file .env document-parser
```

---

## Approach

### Stack

- **Next.js 16** App Router for the frontend and API routes
- **tRPC v11** with TanStack React Query for type-safe API calls
- **Prisma 7** with hosted Prisma Postgres for data persistence
- **Inngest** for background document processing jobs
- **Azure Document Intelligence** for image OCR and structured extraction
- **shadcn/ui** and **Tailwind v4** for the UI
- **Zod** for input validation

### Architecture

Document processing is split into two phases:

**1. Upload**
The user uploads a file via the UI. The file is validated (MIME type, extension, size), stored as base64 in a separate `FileData` table, and an Inngest event `document/uploaded` is fired. If the Inngest event fails, the document is still saved and can be reprocessed manually from the dashboard.

**2. Background Processing (Inngest)**
The Inngest function runs five sequential steps:
- `fetch-document` - loads the document and file data from the database
- `extract-text` - converts the file to raw text (UTF-8 for TXT/CSV, empty for IMAGE)
- `parse-structured-fields` - runs format-specific extractors
- `save-to-db` - persists extracted fields and line items
- `run-validation` - runs the validation engine and saves any issues found

### Extraction

Three format-specific extractors:

- **CSV** - parsed with PapaParse, line items mapped from rows, subtotal computed from line item totals
- **TXT** - pattern-based extraction using labeled field patterns (e.g. `Total: 758 EUR`), with a shared `parseAmount` utility handling various number formats including European decimal notation
- **IMAGE** - uses Azure Document Intelligence prebuilt invoice model, which handles multi-language invoices, complex table layouts, and various invoice formats. Returns structured fields directly without regex parsing.

### Messy Input Handling

- `parseAmount` handles comma/dot ambiguity and thousand separators (`1.234,56`, `1,234.56`, `1234.56`)
- `parseDateStr` handles multiple date formats (ISO, DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY)
- Field patterns use case-insensitive matching with optional colons and spaces
- Currency detection handles symbols (`€`, `$`, `£`) and ISO codes (`EUR`, `BAM`, `USD`)
- Azure Document Intelligence handles non-English invoices (French, Arabic, etc.)

### Validation Engine

Written without AI delegation. Rules:
- Missing required fields (type, supplier, document number, issue date, currency, total)
- Issue date after due date
- Duplicate document numbers across documents
- Line item total mismatch: `quantity × price != total`
- Subtotal mismatch: `sum(line items) != subtotal`
- Total mismatch: `subtotal + tax != total`

All issues are stored in the `ValidationIssue` table linked to the document and optionally to a specific line item.

**Known limitation:** The validation engine does not account for per-line-item VAT. Invoices where line item totals include tax (e.g. `Prix TTC` in French invoices) will produce false mismatch warnings. These can be corrected manually via the edit dialog.

### Review Interface

Each document has a detail page showing:
- Extracted fields with red highlights on fields with issues
- Line items table with red highlights on rows with calculation errors
- Full list of validation issues
- Edit dialog to manually correct any field, which re-triggers the full processing pipeline
- Approve / Reject actions to set final document status
- Polling - the page auto-refreshes while a document is being processed

### Dashboard

- Search by filename
- Filter by status
- Issue count per document
- Currency totals summary across all documents
- Reprocess pending button for documents stuck in UPLOADED status

---

## AI Tools Used

- **Claude (Anthropic)** - used throughout for code generation and debugging. All validation logic was written and understood independently. All AI-generated code was reviewed and understood before use.
- **Azure Document Intelligence** - used for structured extraction from image documents via the prebuilt invoice model.

---

## Improvements I Would Make

- **PDF support** - integrate pdf-parse for text-based PDFs and Azure Document Intelligence for scanned PDFs
- **Per-line-item VAT awareness** - update the validation engine to account for tax being included in line item totals
- **Line item editing** - the edit dialog currently only edits document-level fields. Editing individual line items would improve the review workflow
- **Confidence scores** - show how confident the extractor was for each field, especially for OCR results
- **Unit tests** - validation engine and extractors are pure functions, straightforward to test with Jest
- **Audit trail** - track who changed what and when on each document
- **Bulk actions** - approve or reject multiple documents at once from the dashboard
- **Export** - export validated documents as JSON or CSV for downstream systems