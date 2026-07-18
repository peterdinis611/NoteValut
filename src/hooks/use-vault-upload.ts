"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export type UploadedFile = {
  url: string;
  storageId: Id<"_storage">;
  name: string;
  type: string;
};

export type MediaKind = "image" | "pdf" | "video" | "file";

const OFFICE_EXT =
  /\.(docx?|xlsx?|pptx?)$/i;

const OFFICE_MIME = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export const OFFICE_ACCEPT =
  ".doc,.docx,.xls,.xlsx,.ppt,.pptx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";

export function useVaultUpload() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const resolveUrl = useMutation(api.files.resolveUrl);

  async function uploadFile(file: File): Promise<UploadedFile> {
    const postUrl = await generateUploadUrl({});
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!result.ok) throw new Error("Upload failed");
    const json = (await result.json()) as { storageId: Id<"_storage"> };
    const url = await resolveUrl({ storageId: json.storageId });
    return {
      url,
      storageId: json.storageId,
      name: file.name,
      type: file.type,
    };
  }

  return { uploadFile };
}

export function fileExtension(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m?.[1] ?? "";
}

/** Word / Excel / PowerPoint label for the file card. */
export function officeKindLabel(name: string): string {
  const ext = fileExtension(name);
  if (ext === "doc" || ext === "docx") return "Word";
  if (ext === "xls" || ext === "xlsx") return "Excel";
  if (ext === "ppt" || ext === "pptx") return "PowerPoint";
  return ext ? ext.toUpperCase() : "File";
}

export function isOfficeFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type && OFFICE_MIME.has(type)) return true;
  return OFFICE_EXT.test(file.name);
}

export function mediaKindFromFile(file: File): MediaKind | null {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(name)) {
    return "image";
  }
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    type.startsWith("video/") ||
    /\.(mp4|webm|ogg|mov|m4v)$/i.test(name)
  ) {
    return "video";
  }
  if (isOfficeFile(file)) return "file";
  return null;
}
