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

  //REQURED FIELDS VALIDATION
  for (const field of REQUIRED_FIELDS) {
    if (document[field] === null || document[field] === undefined) {
      issues.push({ field, message: `Missing required field: ${field}` });
    }
  }

  if (document.lineItems.length > 0) {
    let lineSum = 0;
    
    //LINE TOTAL = PRICE * QUANTITY VALIDATION
    for (const line of document.lineItems) {
      let linePrice = line.price;
      let lineTotal = line.total;
      let lineQuantity = line.quantity ?? 1;

      lineSum += lineTotal ?? 0;

      if (linePrice !== null && lineTotal !== null) {
        let expected = lineQuantity * linePrice;
        if (Math.abs(lineTotal - expected) > precision)
          issues.push({
            field: "lineItem.total",
            message: `Line item ${line.description} total price mismatch: ${lineQuantity} x ${linePrice} = ${expected}, got ${lineTotal}`,
            lineItemId: line.id,
          });
      }
    }
    
    // SUBTOTAL = SUM(LINE TOTAL) VALIDATION
    if (
      document.subtotal !== null &&
      Math.abs(lineSum - document.subtotal) > 0.01
    ) {
      issues.push({
        field: "subtotal",
        message: `Subtotal mismatch: line items sum to ${lineSum.toFixed(2)}, got ${document.subtotal}`,
      });
    }
  }


  //DATE VALIDATION
  if (
    document.issueDate &&
    document.dueDate &&
    document.issueDate > document.dueDate
  ) {
    issues.push({
      field: "issueDate",
      message: "Issue date is after due date",
    });
  }

  // DUPLICATE DOCUMENT NUMBER
  if (document.documentNumber !== null) {
    const duplicate = await prisma.document.findFirst({
      where: {
        documentNumber: document.documentNumber,
        id: { not: documentId },
      },
      select: { id: true },
    });

    if (duplicate !== null)
      issues.push({
        field: "documentNumber",
        message: `Duplicate document number: ${document.documentNumber}`,
      });
  }

  // TOTAL = SUBTOTAL + TAX VALIDATION
  if (document.subtotal !== null && document.total !== null) {
    if (document.tax !== null) {
      let expected = document.subtotal + document.tax;
      if (Math.abs(expected - document.total) > precision)
        issues.push({
          field: "total",
          message: `Total mismatch: ${document.subtotal} + ${document.tax} = ${expected.toFixed(2)}, got ${document.total}`,
        });
    } else {
      if (Math.abs(document.subtotal - document.total) > precision)
        issues.push({
          field: "total",
          message: `Total mismatch: ${document.subtotal} = ${document.subtotal}, got ${document.total}`,
        });
    }
  }

  return issues;
}
