import { prisma } from "@/lib/db";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import {
  MIME_TO_FORMAT,
  MAX_FILE_SIZE,
  EXTENSION_TO_FORMAT,
} from "@/config/file-config";
import { z } from "zod";
import { inngest } from "@/inngest/client";

export const documentsRouter = createTRPCRouter({
  upload: baseProcedure
    .input(z.instanceof(FormData))
    .mutation(async ({ input }) => {
      const fileEntry = input.get("file");

      if (!fileEntry || !(fileEntry instanceof File)) {
        throw new Error("No file provided");
      }
      const file = fileEntry;

      if (file.size > MAX_FILE_SIZE)
        throw new Error("File too large. Max size is 10MB");

      const extension = file.name.split(".").pop()?.toLowerCase();
      const extensionFormat = EXTENSION_TO_FORMAT[extension ?? ""];
      const mimeFormat = MIME_TO_FORMAT[file.type];

      if (!mimeFormat) throw new Error(`Unsupported file type "${file.type}"`);
      if (!extensionFormat)
        throw new Error(`Unsupported extension ".${extension}"`);
      if (extensionFormat !== mimeFormat)
        throw new Error(
          `File extension ".${extension}" does not match file type "${file.type}"`,
        );

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");

      const doc = await prisma.document.create({
        data: {
          filename: file.name,
          format: mimeFormat,
          status: "UPLOADED",
          fileData: {
            create: { data: base64 },
          },
        },
      });

      try {
        await inngest.send({
          name: "document/uploaded",
          data: { documentId: doc.id },
        });
      } catch (err) {
        await prisma.document.delete({ where: { id: doc.id } });
        throw new Error("Failed to queue document processing");
      }

      return doc;
    }),

  getMany: baseProcedure
    .input(z.object({ search: z.string().default("") }))
    .query(async ({ input }) => {
      return prisma.document.findMany({
        where: input.search
          ? {
              filename: { contains: input.search, mode: "insensitive" },
            }
          : undefined,
        include: { lineItems: true, issues: true },
        orderBy: { createdAt: "desc" },
      });
    }),

  getOne: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.document.findUniqueOrThrow({
        where: { id: input.id },
        include: { lineItems: true, issues: true },
      });
    }),

  updateStatus: baseProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["UPLOADED", "NEEDS_REVIEW", "VALIDATED", "REJECTED"]),
      }),
    )
    .mutation(async ({ input }) => {
      return prisma.document.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  remove: baseProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.document.delete({ where: { id: input.id } });
    }),
});
