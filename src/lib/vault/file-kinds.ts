export type VaultFileKind =
  | "image"
  | "pdf"
  | "txt"
  | "md"
  | "csv"
  | "json"
  | "xml"
  | "docx"
  | "other";

const EXT_KIND: Record<string, VaultFileKind> = {
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  pdf: "pdf",
  txt: "txt",
  md: "md",
  markdown: "md",
  csv: "csv",
  json: "json",
  xml: "xml",
  docx: "docx",
};

export function getFileExtension(name: string): string {
  const parts = name.split(".");
  if (parts.length < 2) return "";
  return (parts.at(-1) ?? "").toLowerCase();
}

export function getVaultFileKind(name: string): VaultFileKind {
  return EXT_KIND[getFileExtension(name)] ?? "other";
}

export const VAULT_ACCEPTED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "pdf",
  "txt",
  "md",
  "csv",
  "json",
  "xml",
  "docx",
] as const;

export const VAULT_ACCEPT_ATTR = VAULT_ACCEPTED_EXTENSIONS.map(
  (ext) => `.${ext}`,
).join(",");

export function fileKindLabel(kind: VaultFileKind): string {
  switch (kind) {
    case "image":
      return "Image";
    case "pdf":
      return "PDF";
    case "txt":
      return "Text";
    case "md":
      return "Markdown";
    case "csv":
      return "CSV";
    case "json":
      return "JSON";
    case "xml":
      return "XML";
    case "docx":
      return "Word";
    default:
      return "File";
  }
}
