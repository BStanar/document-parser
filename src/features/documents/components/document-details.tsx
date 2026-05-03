"use client";

import { useSuspenseDocument } from "@/features/documents/hooks/use-documents";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const { data: doc } = useSuspenseDocument(id);

  const issueFields = new Set(doc.issues.map((i) => i.field));
  const issuesByLineItem = doc.issues.reduce<Record<string, string[]>>(
    (acc, i) => {
      if (!i.lineItemId) return acc;
      acc[i.lineItemId] ??= [];
      acc[i.lineItemId].push(i.message);
      return acc;
    },
    {},
  );

  const field = (name: string, value: string | null | undefined) => {
    const hasIssue = issueFields.has(name);
    return (
      <div key={name}>
        <dt
          className={`text-xs capitalize ${hasIssue ? "text-red-600" : "text-muted-foreground"}`}
        >
          {name.replace(/([A-Z])/g, " $1")}
        </dt>
        <dd
          className={`text-sm font-medium mt-0.5 ${hasIssue ? "text-red-600" : ""}`}
        >
          {value ?? <span className="text-muted-foreground italic">—</span>}
        </dd>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{doc.filename}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {doc.format} · {doc.type ?? "Unknown type"}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[doc.status]}`}
        >
          {doc.status.replace("_", " ")}
        </span>
      </div>

      {/* Fields */}
      <section>
        <h2 className="text-sm font-semibold mb-3">Extracted Fields</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 border rounded-lg">
          {field("supplierName", doc.supplierName)}
          {field("documentNumber", doc.documentNumber)}
          {field(
            "issueDate",
            doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : null,
          )}
          {field(
            "dueDate",
            doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : null,
          )}
          {field("currency", doc.currency)}
          {field("subtotal", doc.subtotal?.toString() ?? null)}
          {field("tax", doc.tax?.toString() ?? null)}
          {field("total", doc.total?.toString() ?? null)}
        </dl>
      </section>

      {/* Line Items */}
      {doc.lineItems.length > 0 && (
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
              {doc.lineItems.map((item) => {
                const hasIssue = !!issuesByLineItem[item.id];
                return (
                  <TableRow
                    key={item.id}
                    className={hasIssue ? "bg-red-50" : ""}
                  >
                    <TableCell>{item.description ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {item.quantity?.toString() ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.price?.toString() ?? "—"}
                    </TableCell>
                    <TableCell
                      className={`text-right ${hasIssue ? "text-red-600 font-medium" : ""}`}
                    >
                      {item.total?.toString() ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>
      )}

      {/* Validation Issues */}
      {doc.issues.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3 text-red-600">
            Validation Issues
          </h2>
          <ul className="space-y-1">
            {doc.issues.map((issue) => (
              <li key={issue.id} className="text-sm text-red-600 flex gap-2">
                <span>·</span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
