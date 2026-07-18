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

export function mediaKindFromFile(file: File): "image" | "pdf" | "video" | null {
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
  return null;
}
