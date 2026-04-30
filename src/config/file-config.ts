export const SUPPORTED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'csv', 'txt'] as const

export const MIME_TO_FORMAT: Record<string, 'PDF' | 'IMAGE' | 'CSV' | 'TXT'> = {
  'application/pdf': 'PDF',
  'image/png': 'IMAGE',
  'image/jpeg': 'IMAGE',
  'text/csv': 'CSV',
  'text/plain': 'TXT',
  'application/vnd.ms-excel': 'CSV', // CSV on Windows
  'text/x-csv': 'CSV', // CSV on Mac
}

export const EXTENSION_TO_FORMAT: Record<string, 'PDF' | 'IMAGE' | 'CSV' | 'TXT'> = {
  pdf: 'PDF',
  png: 'IMAGE',
  jpg: 'IMAGE',
  jpeg: 'IMAGE',
  csv: 'CSV',
  txt: 'TXT',
}

export const ACCEPTED_MIME_TYPES = Object.keys(MIME_TO_FORMAT)

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const ACCEPTED_DROPZONE = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'text/csv': ['.csv'],
  'text/plain': ['.txt'],
  'application/vnd.ms-excel': ['.csv'],
}