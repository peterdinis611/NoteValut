const OWNER_KEY = "notevault-owner-id";

export function getOwnerId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(OWNER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(OWNER_KEY, id);
  }
  return id;
}
