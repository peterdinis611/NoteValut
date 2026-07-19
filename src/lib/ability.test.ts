import { describe, expect, it } from "vitest";
import {
  defineAbilityFor,
  isReadOnlyRole,
  permissionFromRole,
  roleDescription,
  roleFromPermission,
  roleLabel,
} from "@/lib/ability";

describe("role mapping", () => {
  it("maps share permissions to roles", () => {
    expect(roleFromPermission("write")).toBe("editor");
    expect(roleFromPermission("read")).toBe("viewer");
    expect(roleFromPermission(undefined)).toBe("viewer");
  });

  it("maps guest roles back to permissions", () => {
    expect(permissionFromRole("editor")).toBe("write");
    expect(permissionFromRole("viewer")).toBe("read");
  });

  it("exposes labels and descriptions", () => {
    expect(roleLabel("owner")).toBe("Owner");
    expect(roleLabel("editor")).toBe("Editor");
    expect(roleLabel("viewer")).toBe("Viewer");
    expect(roleDescription("viewer")).toMatch(/cannot edit/i);
  });
});

describe("defineAbilityFor", () => {
  it("gives owners full manage access", () => {
    const ability = defineAbilityFor("owner");
    expect(ability.can("manage", "all")).toBe(true);
    expect(ability.can("share", "Note")).toBe(true);
    expect(ability.can("delete", "Note")).toBe(true);
    expect(isReadOnlyRole("owner")).toBe(false);
  });

  it("lets editors update notes but not share or delete them", () => {
    const ability = defineAbilityFor("editor");
    expect(ability.can("read", "Note")).toBe(true);
    expect(ability.can("update", "Note")).toBe(true);
    expect(ability.can("create", "Note")).toBe(true);
    expect(ability.can("update", "Block")).toBe(true);
    expect(ability.can("delete", "Note")).toBe(false);
    expect(ability.can("share", "Note")).toBe(false);
    expect(ability.can("manage", "Settings")).toBe(false);
    expect(isReadOnlyRole("editor")).toBe(false);
  });

  it("keeps viewers read-only", () => {
    const ability = defineAbilityFor("viewer");
    expect(ability.can("read", "Note")).toBe(true);
    expect(ability.can("update", "Note")).toBe(false);
    expect(ability.can("create", "Block")).toBe(false);
    expect(ability.can("share", "Vault")).toBe(false);
    expect(isReadOnlyRole("viewer")).toBe(true);
  });
});
