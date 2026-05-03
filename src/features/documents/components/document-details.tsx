"use client";

import {
  useDocument,
  useUpdateStatus,
} from "@/features/documents/hooks/use-documents";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { EditDocumentDialog } from "./edit-document-dialog";

const statusStyle = {
  UPLOADED: "bg-secondary text-secondary-foreground",
  NEEDS_REVIEW: "bg-yellow-100 text-yellow-800",
  VALIDATED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

interface Props {
  id: string;
}

export const DocumentDetail = ({ id }: Props) => {
  const { data: document, isLoading } = useDocument(id);
  const { mutate: updateStatus, isPending } = useUpdateStatus();
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (isLoading || !document) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  const fieldsWithIssues = new Set(document.issues.map((issue) => issue.field));

  const issuesByLineItemId = document.issues.reduce<Record<string, string[]>>(
    (accumulator, issue) => {
      if (!issue.lineItemId) return accumulator;
      accumulator[issue.lineItemId] ??= [];
      accumulator[issue.lineItemId].push(issue.message);
      return accumulator;
    },
    {},
  );

  const renderField = (fieldName: string, value: string | null | undefined) => {
    const hasIssue = fieldsWithIssues.has(fieldName);
    return (
      <div key={fieldName}>
        <dt className={`text-xs capitalize ${hasIssue ? "text-red-600" : "text-muted-foreground"}`}>
          {fieldName.replace(/([A-Z])/g, " $1")}
        </dt>
        <dd className={`text-sm font-medium mt-0.5 ${hasIssue ? "text-red-600" : ""}`}>
          {value ?? <span className="text-muted-foreground italic">—</span>}
        </dd>
      </div>
    );
  };

  const canApprove = document.status !== "VALIDATED";
  const canReject = document.status !== "REJECTED";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{document.filename}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {document.format} · {document.type ?? "Unknown type"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[document.status]}`}>
            {document.status.replace("_", " ")}
          </span>
          {canApprove && (
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => updateStatus({ id: document.id, status: "VALIDATED" })}
            >
              Approve
            </Button>
          )}
          {canReject && (
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() => updateStatus({ id: document.id, status: "REJECTED" })}
            >
              Reject
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setIsEditOpen(true)}>
            Edit
          </Button>
        </div>
      </div>

      {/* Fields */}
      <section>
        <h2 className="text-sm font-semibold mb-3">Extracted Fields</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 border rounded-lg">
          {renderField("supplierName", document.supplierName)}
          {renderField("documentNumber", document.documentNumber)}
          {renderField("issueDate", document.issueDate ? new Date(document.issueDate).toLocaleDateString() : null)}
          {renderField("dueDate", document.dueDate ? new Date(document.dueDate).toLocaleDateString() : null)}
          {renderField("currency", document.currency)}
          {renderField("subtotal", document.subtotal?.toString() ?? null)}
          {renderField("tax", document.tax?.toString() ?? null)}
          {renderField("total", document.total?.toString() ?? null)}
        </dl>
      </section>

      {/* Line Items */}
      {document.lineItems.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3">Line Items</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {document.lineItems.map((lineItem) => {
                const lineItemHasIssue = !!issuesByLineItemId[lineItem.id];
                return (
                  <TableRow key={lineItem.id} className={lineItemHasIssue ? "bg-red-50" : ""}>
                    <TableCell>{lineItem.description ?? "—"}</TableCell>
                    <TableCell className="text-right">{lineItem.quantity?.toString() ?? "—"}</TableCell>
                    <TableCell className="text-right">{lineItem.price?.toString() ?? "—"}</TableCell>
                    <TableCell className={`text-right ${lineItemHasIssue ? "text-red-600 font-medium" : ""}`}>
                      {lineItem.total?.toString() ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>
      )}

      {/* Validation Issues */}
      {document.issues.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3 text-red-600">Validation Issues</h2>
          <ul className="space-y-1">
            {document.issues.map((issue) => (
              <li key={issue.id} className="text-sm text-red-600 flex gap-2">
                <span>·</span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <EditDocumentDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        document={document}
      />
    </div>
  );
};