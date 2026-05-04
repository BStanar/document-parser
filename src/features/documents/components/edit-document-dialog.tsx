"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import {
  useUpdateDocument,
  useUpdateLineItems,
  useRevalidateDocument,
} from "@/features/documents/hooks/use-documents";

type DocumentType = "INVOICE" | "PURCHASE_ORDER";

interface LineItemFields {
  id: string;
  description: string | null;
  quantity: number | null;
  price: number | null;
  total: number | null;
}

interface DocumentFields {
  id: string;
  type: DocumentType | null;
  supplierName: string | null;
  documentNumber: string | null;
  issueDate: Date | string | null;
  dueDate: Date | string | null;
  currency: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  lineItems: LineItemFields[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentFields;
}

interface LineItemForm {
  id: string;
  description: string;
  quantity: string;
  price: string;
  total: string;
  isNew?: boolean;
}

function toDateInput(val: Date | string | null): string {
  if (!val) return "";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function generateTempId(): string {
  return `new_${Math.random().toString(36).slice(2)}`;
}

export const EditDocumentDialog = ({ open, onOpenChange, document }: Props) => {
  const { mutate: update, isPending: isSaving } = useUpdateDocument();
  const { mutate: updateLineItems, isPending: isSavingLineItems } = useUpdateLineItems();
  const { mutate: revalidate, isPending: isRevalidating } = useRevalidateDocument();

  const [form, setForm] = useState({
    type: document.type ?? "",
    supplierName: document.supplierName ?? "",
    documentNumber: document.documentNumber ?? "",
    issueDate: toDateInput(document.issueDate),
    dueDate: toDateInput(document.dueDate),
    currency: document.currency ?? "",
    subtotal: document.subtotal?.toString() ?? "",
    tax: document.tax?.toString() ?? "",
    total: document.total?.toString() ?? "",
  });

  const [lineItems, setLineItems] = useState<LineItemForm[]>(
    document.lineItems.map((item) => ({
      id: item.id,
      description: item.description ?? "",
      quantity: item.quantity?.toString() ?? "",
      price: item.price?.toString() ?? "",
      total: item.total?.toString() ?? "",
    })),
  );

  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const setLineItem = (index: number, key: keyof LineItemForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setLineItems((prev) =>
      prev.map((item, i) => i === index ? { ...item, [key]: e.target.value } : item)
    );

  const removeLineItem = (index: number) => {
    const item = lineItems[index]
    if (!item.isNew) {
      setDeletedItemIds((prev) => [...prev, item.id])
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  const addLineItem = () =>
    setLineItems((prev) => [
      ...prev,
      { id: generateTempId(), description: "", quantity: "", price: "", total: "", isNew: true },
    ]);

  const isPending = isSaving || isSavingLineItems || isRevalidating;

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
          updateLineItems(
            {
              documentId: document.id,
              deletedItemIds,
              lineItems: lineItems.map((item) => ({
                id: item.isNew ? "" : item.id,
                description: item.description || null,
                quantity: item.quantity ? parseFloat(item.quantity) : null,
                price: item.price ? parseFloat(item.price) : null,
                total: item.total ? parseFloat(item.total) : null,
                isNew: item.isNew,
              })),
            },
            {
              onSuccess: () => {
                revalidate(
                  { id: document.id },
                  { onSuccess: () => onOpenChange(false) },
                );
              },
            },
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <Select
                value={form.type}
                onValueChange={(val) => setForm((prev) => ({ ...prev, type: val }))}
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
              ["supplierName", "Supplier Name", "text"],
              ["documentNumber", "Document Number", "text"],
              ["issueDate", "Issue Date", "date"],
              ["dueDate", "Due Date", "date"],
              ["currency", "Currency", "text"],
              ["subtotal", "Subtotal", "number"],
              ["tax", "Tax", "number"],
              ["total", "Total", "number"],
            ] as const).map(([key, label, type]) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                <Input
                  type={type}
                  value={form[key]}
                  onChange={set(key)}
                  step={type === "number" ? "0.01" : undefined}
                />
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Line Items</h3>
              <Button size="sm" variant="outline" onClick={addLineItem} type="button">
                <Plus className="size-3.5 mr-1.5" />
                Add Item
              </Button>
            </div>

            {lineItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                No line items. Click "Add Item" to add one.
              </p>
            ) : (
              <div className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                        <Input
                          value={item.description}
                          onChange={setLineItem(index, "description")}
                          placeholder="Item description"
                        />
                      </div>
                      <div className="pt-5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeLineItem(index)}
                          className="text-red-500 hover:text-red-700"
                          type="button"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Quantity</label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={setLineItem(index, "quantity")}
                          step="0.01"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Price</label>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={setLineItem(index, "price")}
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Total</label>
                        <Input
                          type="number"
                          value={item.total}
                          onChange={setLineItem(index, "total")}
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isSaving ? "Saving..." : isSavingLineItems ? "Saving items..." : isRevalidating ? "Reprocessing..." : "Save & Revalidate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};