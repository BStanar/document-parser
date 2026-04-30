"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloudIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  ACCEPTED_DROPZONE,
  MAX_FILE_SIZE,
  MIME_TO_FORMAT,
} from "@/config/file-config";

export const UploadArea = () => {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) return `${file.name} exceeds 10MB limit`;
    if (!MIME_TO_FORMAT[file.type])
      return `${file.name} has unsupported type "${file.type}"`;
    return null;
  };

  const onDrop = useCallback(
    async (files: File[]) => {
      const validFiles: File[] = [];
      const errors: string[] = [];

      files.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
        } else {
          validFiles.push(file);
        }
      });
      // show errors for invalid files
      errors.forEach((e) => toast.error(e));

      // still upload the valid ones
      if (validFiles.length === 0) return;

      setUploading(true);
      try {
        const results = await Promise.allSettled(
          validFiles.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error ?? `Failed to upload ${file.name}`);
            }
            return file.name;
          }),
        );

        const failed = results.filter(
          (r) => r.status === "rejected",
        ) as PromiseRejectedResult[];
        const succeeded = results.filter((r) => r.status === "fulfilled");

        if (succeeded.length > 0 && failed.length === 0) {
          toast.success(`${succeeded.length} file(s) uploaded successfully`);
        } else if (succeeded.length > 0 && failed.length > 0) {
          toast.success(`${succeeded.length} file(s) uploaded`);
          failed.forEach((f) =>
            toast.error(f.reason?.message ?? "Upload failed"),
          );
        } else {
          failed.forEach((f) =>
            toast.error(f.reason?.message ?? "Upload failed"),
          );
        }

        if (succeeded.length > 0) {
          queryClient.invalidateQueries({
            queryKey: trpc.documents.getMany.queryKey(),
          });
        }
      } finally {
        setUploading(false);
      }
    },
    [queryClient, trpc],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_DROPZONE,
    multiple: true,
    onDropRejected: (rejections) => {
      rejections.forEach((r) => toast.error(`Rejected: ${r.file.name}`));
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        {uploading ? (
          <Loader2Icon className="size-8 animate-spin" />
        ) : (
          <UploadCloudIcon className="size-8" />
        )}
        <p className="text-sm font-medium">
          {uploading
            ? "Uploading..."
            : isDragActive
              ? "Drop files here"
              : "Drag & drop files here"}
        </p>
        <p className="text-xs">PDF, PNG, JPG, CSV, TXT · Max 10MB</p>
      </div>
    </div>
  );
};
