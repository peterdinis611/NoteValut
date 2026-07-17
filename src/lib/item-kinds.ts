export type ItemKind = "page" | "folder";

export function getKind(item: { kind?: ItemKind }): ItemKind {
  return item.kind ?? "page";
}

export function isFolder(item: { kind?: ItemKind }) {
  return getKind(item) === "folder";
}

export function isTrashed(item: { trashed?: boolean }) {
  return !!item.trashed;
}

export function itemLabel(kind: ItemKind, plural = false) {
  if (kind === "folder") return plural ? "Collections" : "Collection";
  return plural ? "Entries" : "Entry";
}
