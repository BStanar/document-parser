import { prisma } from "@/lib/db";
import { extractFields, ExtractedDocument } from "../lib/extract-fields";
import { inngest } from "@/inngest/client";

const parseDate = (s: string | null | undefined): Date | undefined => {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
};

export const processDocument = inngest.createFunction(
  {
    id: "process-document",
    retries: 2,
    triggers: { event: "document/uploaded" },
  },
  async ({
    event,
    step,
  }: {
    event: { data: { documentId: string } };
    step: any;
  }) => {
    const { documentId } = event.data;

    const document = await step.run("fetch-document", async () => {
      return prisma.document.findUniqueOrThrow({
        where: { id: documentId },
        include: { fileData: true },
      });
    });

    if (!document.fileData)
      throw new Error(`No file data for document ${documentId}`);

    const rawText = await step.run("extract-text", async () => {
      const buffer = Buffer.from(document.fileData!.data, "base64");

      switch (document.format) {
        case "TXT":
        case "CSV":
          return buffer.toString("utf-8");
        default:
          throw new Error(`Format ${document.format} not yet supported`);
      }
    });

    const extracted = await step.run("parse-structured-fields", async () => {
      return extractFields(rawText, document.format as "TXT" | "CSV");
    });

    await step.run("save-to-db", async () => {
      await prisma.lineItem.deleteMany({ where: { documentId } });

      await prisma.document.update({
        where: { id: documentId },
        data: {
          rawText,
          extractedJson: extracted,
          status: "NEEDS_REVIEW",
          type: extracted.type ?? undefined,
          supplierName: extracted.supplierName ?? undefined,
          documentNumber: extracted.documentNumber ?? undefined,
          issueDate: parseDate(extracted.issueDate),
          dueDate: parseDate(extracted.dueDate),
          currency: extracted.currency ?? undefined,
          subtotal: extracted.subtotal ?? undefined,
          tax: extracted.tax ?? undefined,
          total: extracted.total ?? undefined,
          lineItems: {
            create: (extracted.lineItems ?? []).map(
              (item: ExtractedDocument["lineItems"][number]) => ({
                description: item.description ?? undefined,
                quantity: item.quantity ?? undefined,
                price: item.price ?? undefined,
                total: item.total ?? undefined,
              })
            ),
          },
        },
      });
    });

    return { documentId, status: "NEEDS_REVIEW" };
  }
);