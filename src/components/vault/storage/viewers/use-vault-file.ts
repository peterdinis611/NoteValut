"use client";

import { useEffect, useState } from "react";

type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

export function vaultFileUrl(fileId: string) {
  return `/api/vault/files/${encodeURIComponent(fileId)}`;
}

export function useVaultFileText(fileId: string | null) {
  const [state, setState] = useState<LoadState<string>>({ status: "loading" });

  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    setState({ status: "loading" });

    void (async () => {
      try {
        const response = await fetch(vaultFileUrl(fileId));
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error || "Could not load file.");
        }
        const text = await response.text();
        if (!cancelled) setState({ status: "ready", data: text });
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Could not load file.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  return state;
}

export function useVaultFileBuffer(fileId: string | null) {
  const [state, setState] = useState<LoadState<ArrayBuffer>>({
    status: "loading",
  });

  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    setState({ status: "loading" });

    void (async () => {
      try {
        const response = await fetch(vaultFileUrl(fileId));
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error || "Could not load file.");
        }
        const buffer = await response.arrayBuffer();
        if (!cancelled) setState({ status: "ready", data: buffer });
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Could not load file.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  return state;
}
