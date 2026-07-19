import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
  type InferSubjects,
} from "@casl/ability";
import type { SharePermission } from "@/lib/share";

/** Actions guests / owners can perform on shared content. */
export type AppAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "share"
  | "manage";

export type AppSubjectName =
  | "Note"
  | "Block"
  | "Vault"
  | "Share"
  | "Settings"
  | "all";

export type AppSubjects = InferSubjects<AppSubjectName> | "all";

export type AppAbility = MongoAbility<[AppAction, AppSubjects]>;

/** Role carried by a share link (or the vault owner). */
export type VaultRole = "owner" | "editor" | "viewer";

export function roleFromPermission(permission: SharePermission | undefined): VaultRole {
  if (permission === "write") return "editor";
  return "viewer";
}

export function permissionFromRole(role: Exclude<VaultRole, "owner">): SharePermission {
  return role === "editor" ? "write" : "read";
}

export function roleLabel(role: VaultRole) {
  if (role === "owner") return "Owner";
  if (role === "editor") return "Editor";
  return "Viewer";
}

export function roleDescription(role: VaultRole) {
  if (role === "owner") return "Full access to this vault";
  if (role === "editor") return "Can view and edit shared pages";
  return "Can view shared pages — cannot edit";
}

/** Build a CASL ability for a vault role. */
export function defineAbilityFor(role: VaultRole): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (role === "owner") {
    can("manage", "all");
    return build();
  }

  // Everyone with a valid link can read shared notes / vault shell.
  can("read", "Note");
  can("read", "Block");
  can("read", "Vault");

  if (role === "editor") {
    can("create", "Note");
    can("update", "Note");
    can("update", "Block");
    can("create", "Block");
    can("delete", "Block");
    // Nested pages under a shared collection — allow creating children.
    // Trash / permanent delete / share / settings stay owner-only.
    cannot("delete", "Note");
    cannot("share", "Note");
    cannot("share", "Vault");
    cannot("manage", "Settings");
    cannot("manage", "Share");
  }

  if (role === "viewer") {
    cannot("create", "Note");
    cannot("update", "Note");
    cannot("delete", "Note");
    cannot("create", "Block");
    cannot("update", "Block");
    cannot("delete", "Block");
    cannot("share", "Note");
    cannot("share", "Vault");
    cannot("manage", "Settings");
    cannot("manage", "Share");
  }

  return build();
}

export function isReadOnlyRole(role: VaultRole) {
  return !defineAbilityFor(role).can("update", "Note");
}
