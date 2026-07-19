export type SharePermission = "read" | "write";

export type ShareScope = "vault" | "collection" | "entry";

export function shareUrl(token: string) {
  if (typeof window === "undefined") return `/share/${token}`;
  return `${window.location.origin}/share/${token}`;
}

export function permissionLabel(p: SharePermission) {
  return p === "read" ? "Viewer" : "Editor";
}
