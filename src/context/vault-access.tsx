"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SharePermission, ShareScope } from "@/lib/share";

type VaultAccess = {
  readOnly: boolean;
  shareToken?: string;
  shareScope?: ShareScope;
  sharePermission?: SharePermission;
  isOwner: boolean;
};

const VaultAccessContext = createContext<VaultAccess>({
  readOnly: false,
  isOwner: true,
});

export function VaultAccessProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: VaultAccess;
}) {
  return (
    <VaultAccessContext.Provider value={value}>{children}</VaultAccessContext.Provider>
  );
}

export function useVaultAccess() {
  return useContext(VaultAccessContext);
}
