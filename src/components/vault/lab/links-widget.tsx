"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LabWidgetFrame } from "./lab-widget-shell";

const STORAGE_KEY = "notevalut.lab.links";

type LabLink = {
  id: string;
  title: string;
  url: string;
  createdAt: number;
};

const SEED_LINKS: LabLink[] = [
  {
    id: "seed-appwrite",
    title: "Appwrite Console",
    url: "https://cloud.appwrite.io",
    createdAt: 0,
  },
  {
    id: "seed-tanstack-md",
    title: "TanStack Markdown",
    url: "https://tanstack.com/markdown",
    createdAt: 0,
  },
  {
    id: "seed-picsum",
    title: "Lorem Picsum",
    url: "https://picsum.photos",
    createdAt: 0,
  },
];

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function loadLinks(): LabLink[] {
  if (typeof window === "undefined") return SEED_LINKS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_LINKS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return SEED_LINKS;
    return parsed
      .filter(
        (item): item is LabLink =>
          item != null &&
          typeof item === "object" &&
          typeof (item as LabLink).id === "string" &&
          typeof (item as LabLink).title === "string" &&
          typeof (item as LabLink).url === "string",
      )
      .map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        createdAt:
          typeof item.createdAt === "number" ? item.createdAt : Date.now(),
      }));
  } catch {
    return SEED_LINKS;
  }
}

function persistLinks(links: LabLink[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  } catch {
    // ignore quota / private mode
  }
}

export function LinksWidget() {
  const reduceMotion = useReducedMotion();
  const [links, setLinks] = useState<LabLink[]>(SEED_LINKS);
  const [hydrated, setHydrated] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setLinks(loadLinks());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistLinks(links);
  }, [hydrated, links]);

  const addLink = () => {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError("Enter a valid http(s) URL.");
      return;
    }
    const label = title.trim() || new URL(normalized).hostname;
    setLinks((prev) => [
      {
        id: crypto.randomUUID(),
        title: label,
        url: normalized,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setTitle("");
    setUrl("");
    setError(null);
  };

  const removeLink = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
  };

  const copyUrl = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1200);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <LabWidgetFrame
      icon={Link2}
      title="Important links"
      subtitle="local · quick jumps"
      badge={`${links.length} saved`}
      iconClassName="bg-[oklch(0.9_0.04_230)] text-[oklch(0.35_0.08_230)] dark:bg-[oklch(0.34_0.05_230)] dark:text-[oklch(0.9_0.04_230)]"
      preview={
        <ul className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto p-3">
          {links.length === 0 ? (
            <li className="flex flex-1 items-center justify-center px-4 py-10 text-center text-[13px] text-foreground/45">
              No links yet — add Appwrite, docs, or staging URLs on the right.
            </li>
          ) : (
            <AnimatePresence initial={false}>
              {links.map((link) => (
                <motion.li
                  key={link.id}
                  layout
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                  className="group flex items-start gap-2 rounded-[10px] border border-border bg-background/80 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {link.title}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-foreground/50">
                      {link.url}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md p-1.5 text-foreground/45 transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={`Open ${link.title}`}
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => void copyUrl(link.id, link.url)}
                      className="rounded-md p-1.5 text-foreground/45 transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={`Copy ${link.title}`}
                    >
                      {copiedId === link.id ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLink(link.id)}
                      className="rounded-md p-1.5 text-foreground/45 transition-colors hover:bg-muted hover:text-destructive"
                      aria-label={`Remove ${link.title}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          )}
        </ul>
      }
      controls={
        <>
          <div>
            <h3 className="font-display text-lg tracking-tight text-foreground">
              Save a link
            </h3>
            <p className="mt-1 text-[13px] text-foreground/60">
              Pin console URLs, docs, and staging hosts. Stored in this browser
              only.
            </p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-[12px] text-foreground/60">Title</span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Appwrite Console"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[12px] text-foreground/60">URL</span>
            <Input
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addLink();
                }
              }}
              placeholder="https://…"
            />
          </label>

          {error ? (
            <p className="text-[12px] text-destructive">{error}</p>
          ) : null}

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <Button type="button" className="rounded-xl" onClick={addLink}>
              <Plus data-icon="inline-start" />
              Add link
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setLinks(SEED_LINKS);
                setError(null);
              }}
            >
              Reset defaults
            </Button>
          </div>
        </>
      }
    />
  );
}
