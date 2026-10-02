"use client";

import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";

/** Best-effort display name from Clerk (falls back to You). */
export function useDisplayName(fallback = "You") {
  const { user } = useUser();
  return useMemo(() => {
    if (!user) return fallback;
    return (
      user.fullName?.trim() ||
      user.firstName?.trim() ||
      user.username?.trim() ||
      user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
      fallback
    );
  }, [user, fallback]);
}

export function useClerkPeople() {
  const { user } = useUser();
  return useMemo(() => {
    if (!user) return [] as Array<{ id: string; name: string; email?: string }>;
    const self = {
      id: user.id,
      name:
        user.fullName?.trim() ||
        user.firstName?.trim() ||
        user.username ||
        "You",
      email: user.primaryEmailAddress?.emailAddress,
    };
    return [self];
  }, [user]);
}
