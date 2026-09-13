"use client";

import { LayoutTemplate, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useCustomTemplates } from "@/hooks/use-custom-templates";
import { AnimePresence } from "@/lib/anime-ui";
import { PAGE_TEMPLATES, type PageTemplate } from "@/lib/templates";

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (templateId: string) => void;
};

const CATEGORY_CHIPS = [
  "all",
  "meeting",
  "standup",
  "daily",
  "weekly",
  "project",
  "journal",
  "review",
  "planning",
  "docs",
  "ideas",
  "tasks",
] as const;

export function TemplatesMarketplace({ open, onClose, onApply }: Props) {
  const custom = useCustomTemplates();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setCategory("all");
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const templates: PageTemplate[] = useMemo(
    () => [...custom, ...PAGE_TEMPLATES],
    [custom],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (category !== "all") {
        const tags = t.tags.map((x) => x.toLowerCase());
        const hay = `${t.id} ${t.name} ${tags.join(" ")}`.toLowerCase();
        if (!tags.includes(category) && !hay.includes(category)) return false;
      }
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [templates, query, category]);

  if (!mounted) return null;

  return createPortal(
    <AnimePresence show={open} kind="overlay">
      <div className="share-overlay" onClick={onClose}>
        <div
          className="share-panel templates-market"
          role="dialog"
          aria-modal="true"
          aria-labelledby="templates-market-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="share-panel-header">
            <div className="share-panel-heading">
              <span className="share-panel-icon" aria-hidden>
                <LayoutTemplate className="size-4" />
              </span>
              <div>
                <h2 id="templates-market-title" className="share-panel-title">
                  Templates
                </h2>
                <p className="share-panel-subtitle">
                  Browse built-in and custom page starters
                </p>
              </div>
            </div>
            <button
              type="button"
              className="share-panel-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </header>

          <div className="templates-market-toolbar">
            <label className="templates-market-search">
              <Search className="size-3.5" />
              <input
                type="search"
                placeholder="Search templates…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="templates-market-chips" role="listbox" aria-label="Categories">
              {CATEGORY_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  role="option"
                  aria-selected={category === chip}
                  className={`templates-market-chip ${category === chip ? "is-active" : ""}`}
                  onClick={() => setCategory(chip)}
                >
                  {chip === "all" ? "All" : chip}
                </button>
              ))}
            </div>
          </div>

          <div className="templates-market-grid note-scroll">
            {filtered.length === 0 ? (
              <p className="templates-market-empty">No templates match</p>
            ) : (
              filtered.map((t) => (
                <article key={t.id} className="templates-market-card">
                  <div className="templates-market-card-head">
                    <span className="templates-market-icon">{t.icon}</span>
                    <div className="min-w-0">
                      <h3 className="templates-market-name">{t.name}</h3>
                      <p className="templates-market-desc">{t.description}</p>
                    </div>
                  </div>
                  {t.tags.length > 0 && (
                    <div className="templates-market-tags">
                      {t.tags.map((tag) => (
                        <span key={tag} className="templates-market-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    className="vault-btn-primary templates-market-use"
                    onClick={() => {
                      onApply(t.id);
                      onClose();
                    }}
                  >
                    Use
                  </button>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </AnimePresence>,
    document.body,
  );
}
