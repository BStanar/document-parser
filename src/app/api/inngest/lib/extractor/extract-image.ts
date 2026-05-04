import {
  DocumentAnalysisClient,
  AzureKeyCredential,
} from "@azure/ai-form-recognizer";
import { ExtractedDocument } from "../extract-fields";
import { extractTxt } from "./extract-txt";

export async function extractImage(buffer: Buffer): Promise<ExtractedDocument> {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
  if (!endpoint || !key) {
    throw new Error(
      "Missing required env vars: AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT and AZURE_DOCUMENT_INTELLIGENCE_KEY",
    );
  }
  const client = new DocumentAnalysisClient(
    endpoint,
    new AzureKeyCredential(key),
  );

  const poller = await client.beginAnalyzeDocument("prebuilt-invoice", buffer);
  const result = await poller.pollUntilDone();

  const invoice = result.documents?.[0]?.fields;

  if (!invoice) {
    return emptyDoc();
  }

  const getString = (key: string) =>
    invoice[key]?.kind === "string" ? (invoice[key].value as string) : null;

  const getNumber = (key: string) =>
    invoice[key]?.kind === "number" ? (invoice[key].value as number) : null;

  const getDate = (key: string): string | null => {
    const field = invoice[key];
    if (field?.kind === "date" && field.value) {
      const date = field.value as Date;
      return date.toISOString().slice(0, 10);
    }
    return null;
  };

  const getCurrency = (): string | null => {
    const amount =
      invoice["InvoiceTotal"] ?? invoice["SubTotal"] ?? invoice["TotalTax"];
    return amount?.kind === "currency"
      ? ((amount.value as any)?.currencyCode ?? null)
      : null;
  };

  const lineItems: ExtractedDocument["lineItems"] = [];
  const itemsField = invoice["Items"];

  if (itemsField?.kind === "array") {
    for (const item of itemsField.values ?? []) {
      if (item.kind !== "object") continue;
      const fields = item.properties ?? {};

      const getItemNumber = (key: string) =>
        fields[key]?.kind === "number" ? (fields[key].value as number) : null;

      const getItemCurrencyValue = (key: string): number | null => {
        const field = fields[key];
        if (field?.kind === "currency")
          return (field.value as any)?.amount ?? null;
        if (field?.kind === "number") return field.value as number;
        return null;
      };

      lineItems.push({
        description:
          fields["Description"]?.kind === "string"
            ? (fields["Description"].value as string)
            : null,
        quantity: getItemNumber("Quantity"),
        price: getItemCurrencyValue("UnitPrice"),
        total: getItemCurrencyValue("Amount"),
      });
    }
  }

  const subtotal =
    getNumber("SubTotal") ??
    (invoice["SubTotal"]?.kind === "currency"
      ? (invoice["SubTotal"].value as any)?.amount
      : null);

  const tax =
    getNumber("TotalTax") ??
    (invoice["TotalTax"]?.kind === "currency"
      ? (invoice["TotalTax"].value as any)?.amount
      : null);

  const total =
    getNumber("InvoiceTotal") ??
    (invoice["InvoiceTotal"]?.kind === "currency"
      ? (invoice["InvoiceTotal"].value as any)?.amount
      : null);

  const azureResult = {
    type: "INVOICE" as const,
    supplierName: getString("VendorName"),
    documentNumber: getString("InvoiceId"),
    issueDate: getDate("InvoiceDate"),
    dueDate: getDate("DueDate"),
    currency: getCurrency(),
    subtotal,
    tax,
    total,
    lineItems,
  };
  // get raw OCR text from Azure
  const rawText = result.content ?? "";

  // run txt extractor on the OCR text as fallback
  const txtResult = extractTxt(rawText);

  // merge: prefer Azure values, fall back to txt extractor
  return {
    type: azureResult.type ?? txtResult.type,
    supplierName: azureResult.supplierName ?? txtResult.supplierName,
    documentNumber: azureResult.documentNumber ?? txtResult.documentNumber,
    issueDate: azureResult.issueDate ?? txtResult.issueDate,
    dueDate: azureResult.dueDate ?? txtResult.dueDate,
    currency: azureResult.currency ?? txtResult.currency,
    subtotal: azureResult.subtotal ?? txtResult.subtotal,
    tax: azureResult.tax ?? txtResult.tax,
    total: azureResult.total ?? txtResult.total,
    lineItems:
      azureResult.lineItems.length > 0
        ? azureResult.lineItems
        : txtResult.lineItems,
  };
}

function emptyDoc(): ExtractedDocument {
  return {
    type: null,
    supplierName: null,
    documentNumber: null,
    issueDate: null,
    dueDate: null,
    currency: null,
    subtotal: null,
    tax: null,
    total: null,
    lineItems: [],
  };
}
