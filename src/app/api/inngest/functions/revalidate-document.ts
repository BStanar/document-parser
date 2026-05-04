import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { validateDocument } from "../lib/validator/validate-document";

export const revalidateDocument = inngest.createFunction(
  {
    id: "revalidate-document",
    retries: 2,
    triggers: { event: "document/revalidate" },
  },
  async ({
    event,
    step,
  }: {
    event: { data: { documentId: string } };
    step: any;
  }) => {
    const { documentId } = event.data;

    await step.run("run-validation", async () => {
      const issues = await validateDocument(documentId);
      await prisma.validationIssue.deleteMany({ where: { documentId } });

      if (issues.length > 0) {
        await prisma.validationIssue.createMany({
          data: issues.map(({ lineItemId, ...rest }) => ({
            ...rest,
            documentId,
            lineItemId: lineItemId ?? null,
          })),
        });
      }

      await prisma.document.update({
        where: { id: documentId },
        data: { status: issues.length === 0 ? "VALIDATED" : "NEEDS_REVIEW" },
      });
    });

    return { documentId, status: "NEEDS_REVIEW" };
  },
);
