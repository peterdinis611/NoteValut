"use client";

import { Search, Star } from "lucide-react";
import {
  useAction,
  usePreloadedQuery,
  useQuery,
  type Preloaded,
} from "convex/react";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import { api } from "../../convex/_generated/api";
import {
  googleFontsCss2Url,
  googleFontWeightOptions,
  type GoogleFontItem,
} from "@/lib/google-fonts";
import {
  getFontHistory,
  isFavoriteFont,
  rememberRecentFont,
  subscribeFontHistory,
  toggleFavoriteFont,
} from "@/lib/font-history";
import { PreloadSpinner, Spinner } from "@/components/ui/spinner";
import { SuspenseBoundary } from "@/components/ui/suspense-boundary";

type SearchResult = {
  ready: boolean;
  items: GoogleFontItem[];
  total: number;
  stale?: boolean;
};

type PickerProps = {
  onPick: (family: string, cssUrl: string, weight?: number) => void;
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

function useFontHistory() {
  return useSyncExternalStore(subscribeFontHistory, getFontHistory, () => ({
    recent: [],
    favorites: [],
  }));
}

function GoogleFontsPickerInner({ onPick, seed }: InnerProps) {
  const ensureCatalog = useAction(api.googleFonts.ensure);
  const history = useFontHistory();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("");
  const [ensureError, setEnsureError] = useState<string | null>(null);
  const [retryAfterMs, setRetryAfterMs] = useState<number | null>(null);
  const [ensuring, setEnsuring] = useState(false);
  const [pending, setPending] = useState<GoogleFontItem | null>(null);
  const [weight, setWeight] = useState(400);
  const [favTick, setFavTick] = useState(0);
  const ensureInFlight = useRef(false);
  const lastEnsureAt = useRef(0);
  const staleRefreshDone = useRef(false);

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
    if (ensureInFlight.current) return;
    const now = Date.now();
    // Client-side cooldown — avoid action spam while typing / remounting.
    if (!force && now - lastEnsureAt.current < 4_000) return;

    ensureInFlight.current = true;
    lastEnsureAt.current = now;
    setEnsuring(true);
    setEnsureError(null);
    setRetryAfterMs(null);
    try {
      const res = await ensureCatalog({ force });
      if (!res.ok) {
        setEnsureError(res.error);
        setRetryAfterMs(res.retryAfterMs ?? null);
        return;
      }
      if (force || res.source === "metadata") {
        staleRefreshDone.current = true;
      }
    } catch (err) {
      setEnsureError(err instanceof Error ? err.message : "Couldn’t load Google Fonts");
    } finally {
      ensureInFlight.current = false;
      setEnsuring(false);
    }
  });

  useEffect(() => {
    if (!result) return;
    if (!result.ready) {
      void warmCatalog(false);
      return;
    }
    // Background refresh at most once per mount when catalog is stale.
    if (result.stale && !staleRefreshDone.current) {
      staleRefreshDone.current = true;
      void warmCatalog(false);
    }
  }, [result?.ready, result?.stale]);

  const items: GoogleFontItem[] = result?.ready ? result.items : [];
  const total = result?.ready ? result.total : 0;
  const loading = (!result || !result.ready) && ensuring;
  const error = ensureError;

  const weightOptions = pending ? googleFontWeightOptions(pending.variants) : [400];

  useEffect(() => {
    if (!pending) return;
    const opts = googleFontWeightOptions(pending.variants);
    setWeight(opts.includes(400) ? 400 : opts[0] ?? 400);
  }, [pending?.family]);

  useEffect(() => {
    const previewItems = pending ? [pending] : items.slice(0, 24);
    if (previewItems.length === 0) return;
    const id = "nv-gf-preview";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (pending) {
      link.href = googleFontsCss2Url(pending.family, pending.variants, { weight });
    } else {
      const families = previewItems
        .map((item) => `family=${encodeURIComponent(item.family).replace(/%20/g, "+")}`)
        .join("&");
      link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    }
  }, [items, pending, weight]);

  function commit(family: string, variants: string[], w?: number) {
    const cssUrl = googleFontsCss2Url(family, variants, w ? { weight: w } : undefined);
    rememberRecentFont({ family, cssUrl, weight: w });
    onPick(family, cssUrl, w);
    setPending(null);
  }

  function pickChip(family: string, cssUrl: string, w?: number) {
    rememberRecentFont({ family, cssUrl, weight: w });
    onPick(family, cssUrl, w);
  }

  return (
    <div className="settings-gf">
      <div className="settings-font-or">Google Fonts</div>

      {(history.favorites.length > 0 || history.recent.length > 0) && (
        <div className="settings-gf-chips">
          {history.favorites.length > 0 && (
            <div className="settings-gf-chip-row">
              <span className="settings-gf-chip-label">Favorites</span>
              <div className="settings-gf-chip-list">
                {history.favorites.map((f) => (
                  <button
                    key={`fav-${f.family}`}
                    type="button"
                    className="settings-gf-chip settings-gf-chip-fav"
                    style={{ fontFamily: `"${f.family}", ui-sans-serif, sans-serif` }}
                    onClick={() => pickChip(f.family, f.cssUrl, f.weight)}
                  >
                    <Star className="size-3 fill-current" aria-hidden />
                    {f.family}
                  </button>
                ))}
              </div>
            </div>
          )}
          {history.recent.length > 0 && (
            <div className="settings-gf-chip-row">
              <span className="settings-gf-chip-label">Recent</span>
              <div className="settings-gf-chip-list">
                {history.recent.map((f) => (
                  <button
                    key={`rec-${f.family}`}
                    type="button"
                    className="settings-gf-chip"
                    style={{ fontFamily: `"${f.family}", ui-sans-serif, sans-serif` }}
                    onClick={() => pickChip(f.family, f.cssUrl, f.weight)}
                  >
                    {f.family}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
        <div className="settings-gf-error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="settings-btn settings-btn-ghost"
            disabled={ensuring || (retryAfterMs !== null && retryAfterMs > 0)}
            onClick={() => {
              staleRefreshDone.current = false;
              lastEnsureAt.current = 0;
              void warmCatalog(true);
            }}
          >
            {ensuring
              ? "Retrying…"
              : retryAfterMs
                ? `Retry available soon`
                : "Retry"}
          </button>
        </div>
      ) : null}

      {pending ? (
        <div className="settings-gf-preview-panel">
          <div className="settings-gf-preview-head">
            <strong style={{ fontFamily: `"${pending.family}", sans-serif` }}>
              {pending.family}
            </strong>
            <button
              type="button"
              className={`settings-gf-star ${isFavoriteFont(pending.family) ? "is-on" : ""}`}
              aria-label="Toggle favorite"
              onClick={() => {
                const cssUrl = googleFontsCss2Url(pending.family, pending.variants, {
                  weight,
                });
                toggleFavoriteFont({ family: pending.family, cssUrl, weight });
                setFavTick((n) => n + 1);
              }}
            >
              <Star
                className="size-3.5"
                fill={isFavoriteFont(pending.family) ? "currentColor" : "none"}
              />
            </button>
          </div>
          <p
            className="settings-gf-preview-sample"
            style={{
              fontFamily: `"${pending.family}", ui-sans-serif, sans-serif`,
              fontWeight: weight,
            }}
          >
            The quick brown fox jumps over the lazy dog — 0123456789
          </p>
          <label className="settings-gf-weight">
            <span>
              Weight <strong>{weight}</strong>
            </span>
            <input
              type="range"
              min={weightOptions[0] ?? 100}
              max={weightOptions[weightOptions.length - 1] ?? 900}
              step={weightOptions.length > 1 ? Math.min(100, weightOptions[1]! - weightOptions[0]!) : 100}
              list="nv-gf-weights"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
            <datalist id="nv-gf-weights">
              {weightOptions.map((w) => (
                <option key={w} value={w} />
              ))}
            </datalist>
          </label>
          <div className="settings-css-toolbar">
            <button
              type="button"
              className="settings-btn"
              onClick={() => commit(pending.family, pending.variants, weight)}
            >
              Apply font
            </button>
            <button
              type="button"
              className="settings-btn settings-btn-ghost"
              onClick={() => setPending(null)}
            >
              Cancel
            </button>
          </div>
          {/* favTick forces re-render after toggle */}
          <span className="sr-only">{favTick}</span>
        </div>
      ) : (
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
                  onClick={() => setPending(item)}
                  style={{ fontFamily: `"${item.family}", ui-sans-serif, system-ui, sans-serif` }}
                >
                  <span className="settings-gf-item-name">{item.family}</span>
                  <span className="settings-gf-item-meta">{item.category}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!error && !pending && total > 0 ? (
        <p className="settings-hint settings-gf-meta">
          Showing {items.length} of {total.toLocaleString()} families · pick one to preview weight
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
  preloaded?: Preloaded<typeof api.googleFonts.search>;
};

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
