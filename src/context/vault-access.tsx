"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  defineAbilityFor,
  isReadOnlyRole,
  roleFromPermission,
  type AppAbility,
  type AppAction,
  type AppSubjects,
  type VaultRole,
} from "@/lib/ability";
import type { SharePermission, ShareScope } from "@/lib/share";

type VaultAccess = {
  /** Derived from CASL — true when the role cannot update notes. */
  readOnly: boolean;
  role: VaultRole;
  ability: AppAbility;
  shareToken?: string;
  shareScope?: ShareScope;
  sharePermission?: SharePermission;
  isOwner: boolean;
};

const AbilityContext = createContext<AppAbility>(defineAbilityFor("viewer"));
const VaultAccessContext = createContext<VaultAccess | null>(null);

type ProviderProps = {
  children: ReactNode;
  /** Explicit role; defaults from sharePermission or owner. */
  role?: VaultRole;
  shareToken?: string;
  shareScope?: ShareScope;
  sharePermission?: SharePermission;
  isOwner?: boolean;
};

export function VaultAccessProvider({
  children,
  role: roleProp,
  shareToken,
  shareScope,
  sharePermission,
  isOwner = false,
}: ProviderProps) {
  const role: VaultRole =
    roleProp ?? (isOwner ? "owner" : roleFromPermission(sharePermission));

  const ability = useMemo(() => defineAbilityFor(role), [role]);
  const readOnly = isReadOnlyRole(role);

  const value = useMemo<VaultAccess>(
    () => ({
      readOnly,
      role,
      ability,
      shareToken,
      shareScope,
      sharePermission:
        sharePermission ??
        (role === "editor" ? "write" : role === "viewer" ? "read" : undefined),
      isOwner: isOwner || role === "owner",
    }),
    [ability, isOwner, readOnly, role, sharePermission, shareScope, shareToken],
  );

  return (
    <AbilityContext.Provider value={ability}>
      <VaultAccessContext.Provider value={value}>{children}</VaultAccessContext.Provider>
    </AbilityContext.Provider>
  );
}

/** CASL ability for the current vault session (owner or share guest). */
export function useAppAbility() {
  return useContext(AbilityContext);
}

export function useVaultAccess() {
  const ctx = useContext(VaultAccessContext);
  if (!ctx) {
    const ability = defineAbilityFor("owner");
    return {
      readOnly: false,
      role: "owner" as const,
      ability,
      isOwner: true,
    };
  }
  return ctx;
}

/** Convenience: can the current role perform `action` on `subject`? */
export function useCan(action: AppAction, subject: AppSubjects) {
  const ability = useAppAbility();
  return ability.can(action, subject);
}
