'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useUpdateDocument, useReprocessDocument } from '@/features/documents/hooks/use-documents'

type DocumentType = 'INVOICE' | 'PURCHASE_ORDER'

interface DocumentFields {
  id: string
  type: DocumentType | null
  supplierName: string | null
  documentNumber: string | null
  issueDate: Date | string | null
  dueDate: Date | string | null
  currency: string | null
  subtotal: number | null
  tax: number | null
  total: number | null
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: DocumentFields
}

function toDateInput(val: Date | string | null): string {
  if (!val) return ''
  const d = new Date(val)
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

export const EditDocumentDialog = ({ open, onOpenChange, document }: Props) => {
  const { mutate: update, isPending: isSaving } = useUpdateDocument()
  const { mutate: reprocess, isPending: isReprocessing } = useReprocessDocument()

  const [form, setForm] = useState({
    type: document.type ?? '',
    supplierName: document.supplierName ?? '',
    documentNumber: document.documentNumber ?? '',
    issueDate: toDateInput(document.issueDate),
    dueDate: toDateInput(document.dueDate),
    currency: document.currency ?? '',
    subtotal: document.subtotal?.toString() ?? '',
    tax: document.tax?.toString() ?? '',
    total: document.total?.toString() ?? '',
  })

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const isPending = isSaving || isReprocessing

  const handleSave = () => {
    update(
      {
        id: document.id,
        type: (form.type as DocumentType) || null,
        supplierName: form.supplierName || null,
        documentNumber: form.documentNumber || null,
        issueDate: form.issueDate || null,
        dueDate: form.dueDate || null,
        currency: form.currency || null,
        subtotal: form.subtotal ? parseFloat(form.subtotal) : null,
        tax: form.tax ? parseFloat(form.tax) : null,
        total: form.total ? parseFloat(form.total) : null,
      },
      {
        onSuccess: () => {
          reprocess(
            { id: document.id },
            { onSuccess: () => onOpenChange(false) }
          )
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Type</label>
            <Select
              value={form.type}
              onValueChange={val => setForm(prev => ({ ...prev, type: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INVOICE">Invoice</SelectItem>
                <SelectItem value="PURCHASE_ORDER">Purchase Order</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {([
            ['supplierName', 'Supplier Name', 'text'],
            ['documentNumber', 'Document Number', 'text'],
            ['issueDate', 'Issue Date', 'date'],
            ['dueDate', 'Due Date', 'date'],
            ['currency', 'Currency', 'text'],
            ['subtotal', 'Subtotal', 'number'],
            ['tax', 'Tax', 'number'],
            ['total', 'Total', 'number'],
          ] as const).map(([key, label, type]) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
              <Input
                type={type}
                value={form[key]}
                onChange={set(key)}
                step={type === 'number' ? '0.01' : undefined}
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isSaving ? 'Saving...' : isReprocessing ? 'Reprocessing...' : 'Save & Revalidate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}