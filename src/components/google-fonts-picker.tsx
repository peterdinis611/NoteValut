"use client";

import { Search } from "lucide-react";
import {
  useAction,
  usePreloadedQuery,
  useQuery,
  type Preloaded,
} from "convex/react";
import { useEffect, useEffectEvent, useState } from "react";
import { api } from "../../convex/_generated/api";
import {
  googleFontsCss2Url,
  type GoogleFontItem,
} from "@/lib/google-fonts";
import { PreloadSpinner, Spinner } from "@/components/ui/spinner";
import { SuspenseBoundary } from "@/components/ui/suspense-boundary";

type SearchResult = {
  ready: boolean;
  items: GoogleFontItem[];
  total: number;
  stale?: boolean;
};

type PickerProps = {
  onPick: (family: string, cssUrl: string) => void;
};

type InnerProps = PickerProps & {
  seed?: SearchResult;
};

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "sans-serif", label: "Sans" },
  { value: "serif", label: "Serif" },
  { value: "display", label: "Display" },
  { value: "handwriting", label: "Script" },
  { value: "monospace", label: "Mono" },
] as const;

function GoogleFontsPickerInner({ onPick, seed }: InnerProps) {
  const ensureCatalog = useAction(api.googleFonts.ensure);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("");
  const [applying, setApplying] = useState<string | null>(null);
  const [ensureError, setEnsureError] = useState<string | null>(null);
  const [ensuring, setEnsuring] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query.trim()), 280);
    return () => window.clearTimeout(id);
  }, [query]);

  const searchArgs = {
    q: debouncedQuery || undefined,
    category: category || undefined,
    sort: "popularity" as const,
    limit: 48,
  };

  const live = useQuery(api.googleFonts.search, searchArgs);
  const useSeed = Boolean(seed) && !debouncedQuery && !category && live === undefined;
  const result = live ?? (useSeed ? seed : undefined);

  const warmCatalog = useEffectEvent(async (force: boolean) => {
    setEnsuring(true);
    setEnsureError(null);
    try {
      const res = await ensureCatalog({ force });
      if (!res.ok) {
        setEnsureError(res.error);
      }
    } catch (err) {
      setEnsureError(err instanceof Error ? err.message : "Couldn’t load Google Fonts");
    } finally {
      setEnsuring(false);
    }
  });

  useEffect(() => {
    if (!result) return;
    if (!result.ready || result.stale) {
      void warmCatalog(Boolean(result.ready && result.stale));
    }
  }, [result?.ready, result?.stale]);

  const items: GoogleFontItem[] = result?.ready ? result.items : [];
  const total = result?.ready ? result.total : 0;
  const loading = !result || !result.ready || ensuring;
  const error = ensureError;

  useEffect(() => {
    if (items.length === 0) return;
    const id = "nv-gf-preview";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    const families = items
      .slice(0, 24)
      .map((item) => `family=${encodeURIComponent(item.family).replace(/%20/g, "+")}`)
      .join("&");
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  }, [items]);

  function applyFont(item: GoogleFontItem) {
    setApplying(item.family);
    const cssUrl = googleFontsCss2Url(item.family, item.variants);
    onPick(item.family, cssUrl);
    window.setTimeout(() => setApplying(null), 400);
  }

  return (
    <div className="settings-gf">
      <div className="settings-font-or">Google Fonts</div>

      <label className="settings-field">
        <span>Search fonts</span>
        <div className="settings-gf-search">
          <Search className="settings-gf-search-icon size-3.5" aria-hidden />
          <input
            className="settings-input settings-gf-input"
            value={query}
            placeholder="e.g. Young Serif, Sora, IBM Plex…"
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {loading ? (
            <span className="settings-gf-search-busy">
              <Spinner size="sm" label="Searching fonts" />
            </span>
          ) : null}
        </div>
      </label>

      <div className="settings-gf-cats" role="tablist" aria-label="Font category">
        {CATEGORIES.map((c) => (
          <button
            key={c.value || "all"}
            type="button"
            role="tab"
            aria-selected={category === c.value}
            className={`settings-gf-cat ${category === c.value ? "settings-gf-cat-active" : ""}`}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="settings-gf-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="settings-gf-list" aria-busy={loading}>
        {loading && items.length === 0 ? (
          <PreloadSpinner
            compact
            size="sm"
            label={ensuring ? "Fetching font catalog…" : "Loading fonts…"}
            hint="Cached in Convex for faster opens"
          />
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <p className="settings-gf-empty">No fonts match that search.</p>
        ) : null}

        <ul className="settings-gf-results">
          {items.map((item) => (
            <li key={item.family}>
              <button
                type="button"
                className="settings-gf-item"
                disabled={applying === item.family}
                onClick={() => applyFont(item)}
                style={{ fontFamily: `"${item.family}", ui-sans-serif, system-ui, sans-serif` }}
              >
                <span className="settings-gf-item-name">{item.family}</span>
                <span className="settings-gf-item-meta">
                  {item.category}
                  {applying === item.family ? " · applying…" : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {!error && total > 0 ? (
        <p className="settings-hint settings-gf-meta">
          Showing {items.length} of {total.toLocaleString()} families · sorted by popularity
        </p>
      ) : null}
    </div>
  );
}

function GoogleFontsPickerPreloaded({
  onPick,
  preloaded,
}: PickerProps & { preloaded: Preloaded<typeof api.googleFonts.search> }) {
  const seed = usePreloadedQuery(preloaded);
  return <GoogleFontsPickerInner onPick={onPick} seed={seed} />;
}

type Props = PickerProps & {
  /** Optional RSC preload from `preloadGoogleFonts()` */
  preloaded?: Preloaded<typeof api.googleFonts.search>;
};

/**
 * Google Fonts picker with Suspense boundary + Convex search/ensure.
 * Pass `preloaded` from a Server Component via `preloadGoogleFonts()`.
 */
export function GoogleFontsPicker({ preloaded, onPick }: Props) {
  return (
    <SuspenseBoundary
      label="Loading Google Fonts…"
      hint="Preparing the catalog"
      compact
      size="sm"
    >
      {preloaded ? (
        <GoogleFontsPickerPreloaded onPick={onPick} preloaded={preloaded} />
      ) : (
        <GoogleFontsPickerInner onPick={onPick} />
      )}
    </SuspenseBoundary>
  );
}
