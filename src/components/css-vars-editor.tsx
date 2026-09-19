"use client";

import { useMemo } from "react";
import {
  buildRootCss,
  CSS_THEME_VARS,
  CSS_VAR_GROUPS,
  isHexColor,
  parseCssVarMap,
  toColorInputValue,
  type CssVarDef,
} from "@/lib/css-theme-vars";
import { THEME_PRESETS, type ThemePresetId } from "@/db/settings-collection";

type Props = {
  cssDraft: string;
  themeId: ThemePresetId;
  onChangeCss: (next: string) => void;
};

function defaultsForTheme(themeId: ThemePresetId): Record<string, string> {
  const preset =
    themeId === "custom" ? THEME_PRESETS.default : THEME_PRESETS[themeId] ?? THEME_PRESETS.default;
  return { ...preset.vars };
}

export function CssVarsEditor({ cssDraft, themeId, onChangeCss }: Props) {
  const base = useMemo(() => defaultsForTheme(themeId), [themeId]);
  const overrides = useMemo(() => parseCssVarMap(cssDraft), [cssDraft]);

  const current = useMemo(() => {
    const merged: Record<string, string> = { ...base };
    for (const [k, v] of Object.entries(overrides)) {
      if (v) merged[k] = v;
    }
    return merged;
  }, [base, overrides]);

  function setVar(key: string, value: string) {
    const next = { ...current, [key]: value };
    // Only persist diffs from the active preset so reset stays clean
    const diff: Record<string, string> = {};
    for (const def of CSS_THEME_VARS) {
      const v = next[def.key]?.trim();
      if (!v) continue;
      if (v !== (base[def.key] ?? "").trim()) diff[def.key] = v;
    }
    // If user edited while on a preset, keep all set values so Apply CSS works
    const payload =
      Object.keys(diff).length > 0
        ? buildRootCss({ ...base, ...diff })
        : buildRootCss(base);
    onChangeCss(payload);
  }

  function resetVar(key: string) {
    const next = { ...overrides };
    delete next[key];
    const merged = { ...base, ...next };
    onChangeCss(buildRootCss(merged));
  }

  return (
    <div className="settings-css-vars">
      <div className="settings-css-vars-intro">
        <p className="settings-hint" style={{ margin: 0 }}>
          Tweak Folio tokens live. Changes fill the CSS editor below — hit{" "}
          <strong>Apply CSS</strong> to save as your custom theme.
        </p>
      </div>
      {CSS_VAR_GROUPS.map((group) => {
        const vars = CSS_THEME_VARS.filter((v) => v.group === group.id);
        return (
          <div key={group.id} className="settings-css-vars-group">
            <h3 className="settings-css-vars-group-title">{group.label}</h3>
            <ul className="settings-css-vars-list">
              {vars.map((def) => (
                <CssVarRow
                  key={def.key}
                  def={def}
                  value={current[def.key] ?? ""}
                  defaultValue={base[def.key] ?? ""}
                  dirty={Boolean(
                    overrides[def.key] && overrides[def.key] !== (base[def.key] ?? ""),
                  )}
                  onChange={(v) => setVar(def.key, v)}
                  onReset={() => resetVar(def.key)}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function CssVarRow({
  def,
  value,
  defaultValue,
  dirty,
  onChange,
  onReset,
}: {
  def: CssVarDef;
  value: string;
  defaultValue: string;
  dirty: boolean;
  onChange: (v: string) => void;
  onReset: () => void;
}) {
  const showPicker = def.kind === "color" || isHexColor(value) || isHexColor(defaultValue);

  return (
    <li className={`settings-css-var-row ${dirty ? "is-dirty" : ""}`}>
      <div className="settings-css-var-meta">
        <span className="settings-css-var-label">{def.label}</span>
        <code className="settings-css-var-key">{def.key}</code>
        <span className="settings-css-var-hint">{def.hint}</span>
      </div>
      <div className="settings-css-var-controls">
        {showPicker && (
          <input
            type="color"
            className="settings-css-var-swatch"
            value={toColorInputValue(value || defaultValue, "#c4480e")}
            aria-label={`${def.label} color`}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        <input
          type="text"
          className="settings-css-var-input"
          spellCheck={false}
          value={value}
          placeholder={defaultValue || "value"}
          aria-label={def.label}
          onChange={(e) => onChange(e.target.value)}
        />
        {dirty && (
          <button type="button" className="settings-css-var-reset" onClick={onReset}>
            Reset
          </button>
        )}
      </div>
    </li>
  );
}
