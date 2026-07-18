"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { useEffect } from "react";
import {
  applyTheme,
  getSettings,
  settingsCollection,
  type SettingsRecord,
} from "@/db/settings-collection";

export function useVaultSettings(): SettingsRecord {
  useEffect(() => {
    applyTheme(getSettings());
  }, []);

  const { data } = useLiveQuery((q) => q.from({ s: settingsCollection }));

  const record = data?.find((row) => row.id === "vault") ?? data?.[0];
  useEffect(() => {
    if (record) applyTheme(record);
  }, [record]);

  return record ?? getSettings();
}
