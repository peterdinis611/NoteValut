"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { useEffect } from "react";
import {
  loadCustomTemplates,
  migrateLegacyTemplates,
  templatesCollection,
  type CustomPageTemplate,
} from "@/db/templates-collection";

/** Reactive list of user templates from TanStack DB. */
export function useCustomTemplates(): CustomPageTemplate[] {
  useEffect(() => {
    migrateLegacyTemplates();
  }, []);

  const { data } = useLiveQuery((q) => q.from({ t: templatesCollection }));

  if (!data?.length) {
    // Fallback while collection boots / SSR
    return typeof window === "undefined" ? [] : loadCustomTemplates();
  }

  return [...data].sort((a, b) => b.createdAt - a.createdAt);
}
