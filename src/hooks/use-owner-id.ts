"use client";

import { useEffect, useState } from "react";
import { getOwnerId } from "@/lib/owner-id";

export function useOwnerId() {
  const [ownerId, setOwnerId] = useState<string | null>(null);

  useEffect(() => {
    setOwnerId(getOwnerId());
  }, []);

  return ownerId;
}
