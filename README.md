# Smart Document Processing System

## Live Application

https://document-parser-opal-sigma.vercel.app

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL database (or Prisma Postgres hosted)
- Inngest account (https://app.inngest.com)

### Installation

```bash
git clone <your-repo-url>
cd document-parser
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
DATABASE_URL=  your-prisma-postgres-url
INNGEST_EVENT_KEY=   event-key
INNGEST_SIGNING_KEY= signkey-prod
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

## Approach

### Stack

- **Next.js 15** App Router for the frontend and API routes
- **tRPC v11** with TanStack React Query for type-safe API calls
- **Prisma 7** with hosted Prisma Postgres for data persistence
- **Inngest** for background document processing jobs
- **shadcn/ui** and **Tailwind v4** for the UI
- **Zod** for input validation

### Architecture

Document processing is split into two phases:

**1. Upload**
The user uploads a file via the UI. The file is validated (MIME type, extension, size), stored as base64 in a separate `FileData` table, and an Inngest event `document/uploaded` is fired.

**2. Background Processing (Inngest)**
The Inngest function runs five sequential steps:
- `fetch-document` - loads the document and file data from the database
- `extract-text` - converts the file to raw text (UTF-8 for TXT/CSV)
- `parse-structured-fields` - runs format-specific extractors to pull out document type, supplier name, document number, dates, currency, line items, and totals
- `save-to-db` - persists extracted fields and line items
- `run-validation` - runs the validation engine and saves any issues found

### Extraction

Two format-specific extractors:
- **CSV** - parsed with PapaParse, line items mapped from rows, subtotal computed from line item totals
- **TXT** - pattern-based extraction using labeled field patterns (e.g. `Total: 758 EUR`), with a shared `parseAmount` utility handling various number formats

### Validation Engine

Written without AI delegation. Rules:
- Missing required fields (type, supplier, document number, issue date, currency, total)
- Issue date after due date
- Duplicate document numbers across documents
- Line item total mismatch: `quantity × price != total`
- Subtotal mismatch: `sum(line items) != subtotal`
- Total mismatch: `subtotal + tax != total`

All issues are stored in the `ValidationIssue` table linked to the document and optionally to a specific line item.

### Review Interface

Each document has a detail page showing:
- Extracted fields with red highlights on fields with issues
- Line items table with red highlights on rows with calculation errors
- Full list of validation issues
- Edit dialog to manually correct any field, which re-triggers the full processing pipeline
- Approve / Reject actions to set final document status

---

## AI Tools Used

- **Claude (Anthropic)** - used throughout for code generation, debugging. AI-generated code was reviewed, understood, and modified before use.

---

## Improvements I Would Make

- **PDF and image support** - pdf-parse for text extraction, tesseract.js for OCR on scanned documents. The pipeline is already structured to support additional formats.
- **Line item editing** - the edit dialog currently only edits document-level fields. Editing individual line items and re-running validation would improve the review workflow.
- **Unit tests** - validation engine and extractors are pure functions and straightforward to test. Would add Jest tests for edge cases (missing fields, malformed numbers, date edge cases).
- **Audit trail** - track who changed what and when on each document.
- **Bulk actions** - approve or reject multiple documents at once from the dashboard.
- **Export** - export validated documents as JSON or CSV for downstream systems.