import type { Doc, Id } from "../../convex/_generated/dataModel";
import * as v from "valibot";
import { BlockSchema } from "@/lib/validation";

export const VaultBackupSchema = v.object({
  version: v.literal(1),
  exportedAt: v.number(),
  notes: v.array(
    v.object({
      id: v.string(),
      title: v.string(),
      content: v.string(),
      blocks: v.optional(v.array(BlockSchema)),
      folderBlocks: v.optional(v.array(BlockSchema)),
      icon: v.string(),
      coverColor: v.optional(v.string()),
      coverImage: v.optional(v.string()),
      parentId: v.nullable(v.string()),
      kind: v.optional(v.picklist(["page", "folder"])),
      color: v.optional(v.string()),
      description: v.optional(v.string()),
      viewMode: v.optional(v.picklist(["grid", "list", "table"])),
      sortMode: v.optional(v.picklist(["updated", "name", "kind"])),
      defaultTemplateId: v.optional(v.string()),
      isLocked: v.optional(v.boolean()),
      status: v.optional(v.string()),
      pinned: v.boolean(),
      archived: v.boolean(),
      tags: v.array(v.string()),
      updatedAt: v.number(),
    }),
  ),
});

export type VaultBackup = v.InferOutput<typeof VaultBackupSchema>;

export type ExportVaultPayload = {
  version: 1;
  exportedAt: number;
  notes: Array<{
    id: Id<"notes"> | string;
    title: string;
    content: string;
    blocks?: Doc<"notes">["blocks"];
    folderBlocks?: Doc<"notes">["folderBlocks"];
    icon: string;
    coverColor?: string;
    coverImage?: string;
    parentId: Id<"notes"> | string | null;
    kind?: "page" | "folder";
    color?: string;
    description?: string;
    viewMode?: "grid" | "list" | "table";
    sortMode?: "updated" | "name" | "kind";
    defaultTemplateId?: string;
    isLocked?: boolean;
    status?: string;
    pinned: boolean;
    archived: boolean;
    tags: string[];
    updatedAt: number;
  }>;
};

export function downloadVaultBackup(backup: ExportVaultPayload) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date(backup.exportedAt).toISOString().slice(0, 10);
  a.href = url;
  a.download = `notevault-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function parseVaultBackupFile(file: File): Promise<VaultBackup> {
  const text = await file.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("File is not valid JSON");
  }
  const result = v.safeParse(VaultBackupSchema, json);
  if (!result.success) {
    throw new Error(result.issues[0]?.message ?? "Invalid vault backup format");
  }
  return result.output;
}
