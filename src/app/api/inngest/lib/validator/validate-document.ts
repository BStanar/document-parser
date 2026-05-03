import { prisma } from "@/lib/db";

export interface ValidationIssueInput {
  field: string | null;
  message: string;
  lineItemId?: string;
}

var precision = 0.001;

export async function validateDocument(
  documentId: string,
): Promise<ValidationIssueInput[]> {
  const document = await prisma.document.findUniqueOrThrow({
    where: { id: documentId },
    include: { lineItems: true },
  });

  const issues: ValidationIssueInput[] = [];

  const REQUIRED_FIELDS = [
    "type",
    "supplierName",
    "documentNumber",
    "issueDate",
    "dueDate",
    "currency",
    "total",
    "tax",
  ] as const;

  for (const field of REQUIRED_FIELDS) {
    if (document[field] === null || document[field] === undefined) {
      issues.push({ field, message: `Missing required field: ${field}` });
    }
  }

  for (const line of document.lineItems) {
    let price = line.price;
    let total = line.total;

    let quantity;
    if (line.quantity === null) quantity = 1;
    else quantity = line.quantity;

    if (price !== null && total !== null) {
      let expected = quantity * price;
      if (Math.abs(total - expected) > precision)
        issues.push({
          field: "lineItem.total",
          message: `Line item ${line.description} total price mismatch: ${quantity} x ${price} = ${expected}, got ${total}`,
          lineItemId: line.id,
        });
    }
  }

  return issues;
}
