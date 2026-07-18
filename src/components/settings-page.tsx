"use client";

import {
  Database,
  FileUp,
  Palette,
  RotateCcw,
  Settings2,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  MAX_FONT_BYTES,
  THEME_PRESETS,
  clearCustomFont,
  clearCustomTheme,
  familyNameFromFile,
  readFontFileAsDataUrl,
  setCustomFontFromFile,
  setCustomFontFromUrl,
  setCustomThemeCss,
  setThemePreset,
} from "@/db/settings-collection";
import { removeCustomTemplate } from "@/db/templates-collection";
import { useCustomTemplates } from "@/hooks/use-custom-templates";
import { useVaultSettings } from "@/hooks/use-vault-settings";
import { easeOutSoft, fadeUpVariants } from "@/lib/motion";
import { listDefaultTemplates } from "@/lib/templates";
import { parseVaultBackupFile } from "@/lib/vault-backup";
import { useToast } from "./toast";

const MAX_CSS_BYTES = 100_000;
const FONT_ACCEPT = ".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf";

type Props = {
  ownerId: string;
  onClose: () => void;
  onExport?: () => void;
};

export function SettingsPage({ ownerId, onClose, onExport }: Props) {
  const toast = useToast();
  const settings = useVaultSettings();
  const templates = useCustomTemplates();
  const importVault = useMutation(api.notes.importVault);
  const fileRef = useRef<HTMLInputElement>(null);
  const fontFileRef = useRef<HTMLInputElement>(null);
  const backupFileRef = useRef<HTMLInputElement>(null);
  const [cssDraft, setCssDraft] = useState(settings.customCss);
  const [dragging, setDragging] = useState(false);
  const [fontFamilyDraft, setFontFamilyDraft] = useState(settings.fontFamily ?? "");
  const [fontUrlDraft, setFontUrlDraft] = useState(settings.fontUrl ?? "");
  const [fontDragging, setFontDragging] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setCssDraft(settings.customCss);
  }, [settings.customCss]);

  useEffect(() => {
    setFontFamilyDraft(settings.fontFamily ?? "");
    setFontUrlDraft(settings.fontUrl ?? "");
  }, [settings.fontFamily, settings.fontUrl]);

  async function loadCssFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".css") && file.type !== "text/css") {
      toast.error("Upload a .css file");
      return;
    }
    if (file.size > MAX_CSS_BYTES) {
      toast.error("CSS file is too large (max 100 KB)");
      return;
    }
    try {
      const text = await file.text();
      setCssDraft(text);
      setCustomThemeCss(text, file.name);
      toast.success(`Theme “${file.name}” applied`);
    } catch {
      toast.error("Couldn’t read CSS file");
    }
  }

  function applyDraftCss() {
    setCustomThemeCss(cssDraft, settings.customCssName ?? "custom.css");
    toast.success("Custom CSS applied");
  }

  async function loadFontFile(file: File) {
    const lower = file.name.toLowerCase();
    const okExt = [".woff2", ".woff", ".ttf", ".otf"].some((ext) => lower.endsWith(ext));
    if (!okExt) {
      toast.error("Upload .woff2, .woff, .ttf, or .otf");
      return;
    }
    if (file.size > MAX_FONT_BYTES) {
      toast.error("Font is too large (max 1.5 MB)");
      return;
    }
    try {
      const dataUrl = await readFontFileAsDataUrl(file);
      const family = fontFamilyDraft.trim() || familyNameFromFile(file.name);
      setFontFamilyDraft(family);
      setCustomFontFromFile({ family, fileName: file.name, dataUrl });
      toast.success(`Font “${family}” applied`);
    } catch {
      toast.error("Couldn’t read font file");
    }
  }

  function applyFontUrl() {
    const family = fontFamilyDraft.trim();
    const url = fontUrlDraft.trim();
    if (!family) {
      toast.error("Enter a font family name");
      return;
    }
    if (!url) {
      toast.error("Enter a stylesheet URL (e.g. Google Fonts CSS)");
      return;
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        toast.error("Font URL must start with https://");
        return;
      }
    } catch {
      toast.error("Invalid font URL");
      return;
    }
    setCustomFontFromUrl(family, url);
    toast.success(`Font “${family}” linked`);
  }

  const fontActive = (settings.fontMode ?? "default") !== "default";

  async function handleImportBackup(file: File) {
    if (!file.name.toLowerCase().endsWith(".json")) {
      toast.error("Upload a .json vault backup");
      return;
    }
    setImporting(true);
    try {
      const backup = await parseVaultBackupFile(file);
      const result = await importVault({
        ownerId,
        notes: backup.notes.map((n) => ({
          ...n,
          parentId: n.parentId,
        })),
      });
      toast.success(`Imported ${result.imported} items`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn’t import backup");
    } finally {
      setImporting(false);
    }
  }

  return (
    <motion.div
      className="settings-page note-scroll"
      initial="hidden"
      animate="visible"
      variants={fadeUpVariants}
      transition={easeOutSoft}
    >
      <header className="settings-header">
        <div>
          <p className="settings-kicker">
            <Settings2 className="size-3.5" />
            Workspace
          </p>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">
            Themes, fonts, custom CSS, and vault preferences
          </p>
        </div>
        <button type="button" className="settings-close" onClick={onClose} aria-label="Close settings">
          <X className="size-4" />
        </button>
      </header>

      <section className="settings-section">
        <div className="settings-section-head">
          <Palette className="size-4 text-accent" />
          <div>
            <h2>Appearance</h2>
            <p>Pick a preset or upload your own CSS theme</p>
          </div>
        </div>

        <div className="settings-theme-grid">
          {(Object.values(THEME_PRESETS) as (typeof THEME_PRESETS)[keyof typeof THEME_PRESETS][]).map(
            (preset) => {
              const active = settings.themeId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`settings-theme-card ${active ? "settings-theme-card-active" : ""}`}
                  onClick={() => {
                    setThemePreset(preset.id);
                    toast.success(`${preset.label} theme`);
                  }}
                >
                  <span
                    className="settings-theme-swatch"
                    style={{ background: preset.swatch }}
                  />
                  <span className="settings-theme-meta">
                    <span className="settings-theme-name">{preset.label}</span>
                    <span className="settings-theme-desc">{preset.description}</span>
                  </span>
                </button>
              );
            },
          )}
          <button
            type="button"
            className={`settings-theme-card ${
              settings.themeId === "custom" ? "settings-theme-card-active" : ""
            }`}
            onClick={() => {
              if (settings.customCss.trim()) {
                setCustomThemeCss(settings.customCss, settings.customCssName);
                toast.success("Custom theme");
              } else {
                fileRef.current?.click();
              }
            }}
          >
            <span className="settings-theme-swatch settings-theme-swatch-custom">CSS</span>
            <span className="settings-theme-meta">
              <span className="settings-theme-name">Custom CSS</span>
              <span className="settings-theme-desc">
                {settings.customCssName || "Upload or paste your theme"}
              </span>
            </span>
          </button>
        </div>

        <div
          className={`settings-css-drop ${dragging ? "settings-css-drop-active" : ""}`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void loadCssFile(file);
          }}
        >
          <div className="settings-css-toolbar">
            <button
              type="button"
              className="settings-btn"
              onClick={() => fileRef.current?.click()}
            >
              <FileUp className="size-3.5" />
              Upload .css
            </button>
            <button type="button" className="settings-btn" onClick={applyDraftCss}>
              Apply CSS
            </button>
            <button
              type="button"
              className="settings-btn settings-btn-ghost"
              onClick={() => {
                clearCustomTheme();
                setCssDraft("");
                toast.success("Reset to Teal night");
              }}
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".css,text/css"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void loadCssFile(file);
              }}
            />
          </div>
          <textarea
            className="settings-css-editor"
            spellCheck={false}
            placeholder={`:root {\n  --accent: #3ecfbe;\n  --background: #12151c;\n}`}
            value={cssDraft}
            onChange={(e) => setCssDraft(e.target.value)}
            rows={10}
          />
          <p className="settings-hint">
            Override CSS variables like <code>--accent</code>, <code>--background</code>,{" "}
            <code>--sidebar</code>, <code>--panel</code>, <code>--muted</code>.
          </p>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-head">
          <Type className="size-4 text-accent" />
          <div>
            <h2>Custom font</h2>
            <p>Upload a font file or link a stylesheet (Google Fonts CSS)</p>
          </div>
        </div>

        <div
          className={`settings-font-panel ${fontActive ? "settings-font-panel-active" : ""} ${
            fontDragging ? "settings-css-drop-active" : ""
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            setFontDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setFontDragging(true);
          }}
          onDragLeave={() => setFontDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setFontDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void loadFontFile(file);
          }}
        >
          <label className="settings-field">
            <span>Font family name</span>
            <input
              className="settings-input"
              value={fontFamilyDraft}
              placeholder="e.g. Inter, Space Grotesk"
              onChange={(e) => setFontFamilyDraft(e.target.value)}
            />
          </label>

          <div className="settings-css-toolbar">
            <button
              type="button"
              className="settings-btn"
              onClick={() => fontFileRef.current?.click()}
            >
              <FileUp className="size-3.5" />
              Upload font
            </button>
            <button
              type="button"
              className="settings-btn settings-btn-ghost"
              onClick={() => {
                clearCustomFont();
                setFontFamilyDraft("");
                setFontUrlDraft("");
                toast.success("Default Geist font restored");
              }}
            >
              <RotateCcw className="size-3.5" />
              Reset font
            </button>
            <input
              ref={fontFileRef}
              type="file"
              accept={FONT_ACCEPT}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void loadFontFile(file);
              }}
            />
          </div>

          {settings.fontMode === "file" && settings.fontFileName && (
            <p className="settings-font-status">
              Active file: <strong>{settings.fontFileName}</strong>
              {settings.fontFamily ? ` · ${settings.fontFamily}` : ""}
            </p>
          )}

          <div className="settings-font-or">or link a CSS URL</div>

          <label className="settings-field">
            <span>Stylesheet URL</span>
            <input
              className="settings-input"
              value={fontUrlDraft}
              placeholder="https://fonts.googleapis.com/css2?family=…"
              onChange={(e) => setFontUrlDraft(e.target.value)}
            />
          </label>
          <button type="button" className="settings-btn" onClick={applyFontUrl}>
            Apply URL font
          </button>

          <p
            className="settings-font-preview"
            style={
              fontActive && settings.fontFamily
                ? { fontFamily: `"${settings.fontFamily}", ui-sans-serif, system-ui, sans-serif` }
                : undefined
            }
          >
            The quick brown fox jumps over the lazy dog — 0123456789
          </p>
          <p className="settings-hint">
            Supported files: <code>.woff2</code>, <code>.woff</code>, <code>.ttf</code>,{" "}
            <code>.otf</code> (max 1.5 MB). For Google Fonts, paste the CSS2 URL and use the
            exact family name.
          </p>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-head">
          <Database className="size-4 text-accent" />
          <div>
            <h2>Backup</h2>
            <p>Export or import your vault as JSON</p>
          </div>
        </div>
        <div className="settings-css-toolbar">
          <button
            type="button"
            className="settings-btn"
            onClick={() => onExport?.()}
            disabled={!onExport}
          >
            Export JSON
          </button>
          <button
            type="button"
            className="settings-btn"
            disabled={importing}
            onClick={() => backupFileRef.current?.click()}
          >
            <FileUp className="size-3.5" />
            {importing ? "Importing…" : "Import JSON"}
          </button>
          <input
            ref={backupFileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void handleImportBackup(file);
            }}
          />
        </div>
        <p className="settings-hint">
          Export includes pages and collections (not trash). Import merges as new items and
          remaps parent links.
        </p>
      </section>

      <section className="settings-section">
        <div className="settings-section-head">
          <Settings2 className="size-4 text-accent" />
          <div>
            <h2>Default templates</h2>
            <p>Built-in starters available when you create a page</p>
          </div>
        </div>
        <ul className="settings-template-list">
          {listDefaultTemplates().map((t) => (
            <li key={t.id} className="settings-template-row">
              <span className="text-lg">{t.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{t.name}</span>
                <span className="block truncate text-xs text-muted">{t.description}</span>
              </span>
              <span className="settings-template-badge">Built-in</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="settings-section">
        <div className="settings-section-head">
          <Settings2 className="size-4 text-accent" />
          <div>
            <h2>Your templates</h2>
            <p>Saved page templates stored in TanStack DB</p>
          </div>
        </div>
        {templates.length === 0 ? (
          <p className="settings-empty">No custom templates yet — save one from More actions.</p>
        ) : (
          <ul className="settings-template-list">
            {templates.map((t) => (
              <li key={t.id} className="settings-template-row">
                <span className="text-lg">{t.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{t.name}</span>
                  <span className="block truncate text-xs text-muted">{t.description}</span>
                </span>
                <button
                  type="button"
                  className="settings-icon-btn"
                  aria-label={`Delete ${t.name}`}
                  onClick={() => {
                    removeCustomTemplate(t.id);
                    toast.success("Template removed");
                  }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </motion.div>
  );
}
