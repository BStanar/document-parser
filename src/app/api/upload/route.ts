import { prisma } from "@/lib/db";
import {
  MIME_TO_FORMAT,
  MAX_FILE_SIZE,
  EXTENSION_TO_FORMAT,
} from "@/config/file-config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size is 10MB` },
        { status: 400 },
      );
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    const extensionFormat = EXTENSION_TO_FORMAT[extension ?? ""];
    const mimeFormat = MIME_TO_FORMAT[file.type];

    if (!mimeFormat) {
      return NextResponse.json(
        { error: `Unsupported file type "${file.type}"` },
        { status: 400 },
      );
    }

    if (!extensionFormat) {
      return NextResponse.json(
        { error: `Unsupported extension ".${extension}"` },
        { status: 400 },
      );
    }

    if (extensionFormat !== mimeFormat) {
      return NextResponse.json(
        {
          error: `File extension ".${extension}" does not match file type "${file.type}"`,
        },
        { status: 400 },
      );
    }

    const format = mimeFormat;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    const existing = await prisma.document.findFirst({
      where: { filename: file.name },
    });

    if (existing) {
      const document = await prisma.document.update({
        where: { id: existing.id },
        data: {
          format,
          status: "UPLOADED",
          fileData: {
            upsert: {
              create: { data: base64 },
              update: { data: base64 },
            },
          },
        },
      });
      return NextResponse.json(document);
    }


    const document = await prisma.document.create({
      data: {
        filename: file.name,
        format,
        status: "UPLOADED",
        fileData: {
          create: { data: base64 },
        },
      },
    });

    return NextResponse.json(document);
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
