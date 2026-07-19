"use client";

import { useAuth } from "@clerk/nextjs";

/**
 * Vault identity is the signed-in Clerk user id.
 * Returns null while Clerk is loading or when signed out.
 */
export function useOwnerId() {
  const { userId, isLoaded } = useAuth();
  if (!isLoaded) return null;
  return userId;
}
