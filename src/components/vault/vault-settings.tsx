"use client";

import { useUser } from "@appwrite.io/react";
import { motion, useReducedMotion } from "motion/react";
import {
  Bell,
  CalendarDays,
  Keyboard,
  LayoutPanelLeft,
  LayoutTemplate,
  Palette,
  PanelLeft,
  RotateCcw,
  ShieldCheck,
  Type,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  clampSidebarWidth,
  DEFAULT_VAULT_PREFERENCES,
  loadVaultPreferences,
  saveVaultPreferences,
  SIDEBAR_WIDTH_DEFAULT,
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN,
  type VaultPreferences,
} from "@/lib/vault-preferences";
import { listPageTemplates } from "@/lib/vault/page-templates";
import { ScrollPane } from "./scroll-to-top";

type SettingsSection =
  | "appearance"
  | "sidebar"
  | "writing"
  | "workspace"
  | "privacy"
  | "alerts"
  | "shortcuts";

const SECTIONS: Array<{
  id: SettingsSection;
  label: string;
  hint: string;
  icon: typeof Palette;
}> = [
  {
    id: "appearance",
    label: "Appearance",
    hint: "Theme & density",
    icon: Palette,
  },
  {
    id: "sidebar",
    label: "Sidebar",
    hint: "Width & tree",
    icon: PanelLeft,
  },
  {
    id: "writing",
    label: "Writing",
    hint: "Editor habits",
    icon: Type,
  },
  {
    id: "workspace",
    label: "Workspace",
    hint: "Defaults & templates",
    icon: CalendarDays,
  },
  {
    id: "privacy",
    label: "Privacy",
    hint: "Account & safety",
    icon: ShieldCheck,
  },
  {
    id: "alerts",
    label: "Alerts",
    hint: "Local toggles",
    icon: Bell,
  },
  {
    id: "shortcuts",
    label: "Shortcuts",
    hint: "Keyboard map",
    icon: Keyboard,
  },
];

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/70 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 sm:max-w-[22rem] sm:pr-6">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      className="inline-flex rounded-lg border border-border bg-muted/60 p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SettingsPanel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card/40">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        {action}
      </header>
      <div className="px-5">{children}</div>
    </section>
  );
}

export function VaultSettings({
  accountLabel,
  onOpenTemplates,
}: {
  accountLabel?: string | null;
  onOpenTemplates?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user } = useUser();

  const [section, setSection] = useState<SettingsSection>("appearance");
  const [prefs, setPrefs] = useState<VaultPreferences>(DEFAULT_VAULT_PREFERENCES);
  const templates = useMemo(
    () => listPageTemplates(),
    [prefs.defaultTemplateId],
  );

  useEffect(() => {
    setPrefs(loadVaultPreferences());
  }, []);

  const updatePrefs = (patch: Partial<VaultPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveVaultPreferences(next);
      return next;
    });
  };

  const resetSidebar = () => {
    updatePrefs({
      sidebarWidth: SIDEBAR_WIDTH_DEFAULT,
      compactSidebar: false,
      showPageMarks: true,
    });
  };

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
    >
      <header className="shrink-0 border-b border-border px-6 py-5 md:px-10">
        <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Settings
        </p>
        <h1 className="mt-1 font-display text-[28px] font-semibold tracking-tight text-foreground">
          Vault preferences
        </h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Tune the shell, writing surface, and defaults — stored on this device.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <nav
          aria-label="Settings sections"
          className="shrink-0 border-b border-border md:w-56 md:border-r md:border-b-0 lg:w-64"
        >
          <div className="flex gap-1 overflow-x-auto p-3 md:flex-col md:overflow-visible md:p-4">
            {SECTIONS.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={cn(
                    "flex min-w-[9.5rem] items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors md:min-w-0",
                    active
                      ? "bg-muted text-foreground shadow-[inset_2px_0_0_0_var(--primary)]"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-80" />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium">
                      {item.label}
                    </span>
                    <span className="mt-0.5 hidden text-[11px] text-muted-foreground md:block">
                      {item.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <ScrollPane className="px-6 py-6 md:px-8 lg:px-10">
          <div className="mx-auto flex max-w-2xl flex-col gap-5 pb-16">
            {section === "appearance" ? (
              <SettingsPanel
                title="Appearance"
                description="Warm paper by day, obsidian desk by night — or follow the system."
              >
                <SettingRow
                  title="Color mode"
                  description={`Currently ${resolvedTheme ?? theme ?? "system"}`}
                >
                  <Segmented
                    value={
                      (theme === "light" ||
                      theme === "dark" ||
                      theme === "system"
                        ? theme
                        : "system") as "light" | "dark" | "system"
                    }
                    onChange={(value) => setTheme(value)}
                    options={[
                      { value: "light", label: "Light" },
                      { value: "dark", label: "Dark" },
                      { value: "system", label: "System" },
                    ]}
                  />
                </SettingRow>
                <SettingRow
                  title="Editor density"
                  description="Airy spacing or a denser writing surface."
                >
                  <Segmented
                    value={prefs.editorDensity}
                    onChange={(editorDensity) => updatePrefs({ editorDensity })}
                    options={[
                      { value: "comfortable", label: "Airy" },
                      { value: "compact", label: "Dense" },
                    ]}
                  />
                </SettingRow>
                <SettingRow
                  title="Reduce motion"
                  description="Prefer calmer transitions in the vault shell."
                >
                  <Segmented
                    value={prefs.reduceMotion}
                    onChange={(reduceMotion) => updatePrefs({ reduceMotion })}
                    options={[
                      { value: "system", label: "System" },
                      { value: "on", label: "On" },
                      { value: "off", label: "Off" },
                    ]}
                  />
                </SettingRow>
              </SettingsPanel>
            ) : null}

            {section === "sidebar" ? (
              <SettingsPanel
                title="Sidebar"
                description="Drag the right edge of the panel to resize, or dial it in here."
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={resetSidebar}
                  >
                    <RotateCcw className="size-3.5" />
                    Reset
                  </Button>
                }
              >
                <SettingRow
                  title="Panel width"
                  description={`${prefs.sidebarWidth}px · ${SIDEBAR_WIDTH_MIN}–${SIDEBAR_WIDTH_MAX}px. Double-click the drag handle to reset.`}
                >
                  <div className="flex w-full max-w-[16rem] flex-col gap-2 sm:w-56">
                    <input
                      type="range"
                      min={SIDEBAR_WIDTH_MIN}
                      max={SIDEBAR_WIDTH_MAX}
                      step={4}
                      value={prefs.sidebarWidth}
                      onChange={(event) =>
                        updatePrefs({
                          sidebarWidth: clampSidebarWidth(
                            Number(event.target.value),
                          ),
                        })
                      }
                      className="h-2 w-full cursor-ew-resize appearance-none rounded-full bg-muted accent-primary"
                      aria-label="Sidebar width"
                    />
                    <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                      <span>Narrow</span>
                      <span>Wide</span>
                    </div>
                  </div>
                </SettingRow>
                <SettingRow
                  title="Compact rows"
                  description="Tighter spacing in navigation and the private tree."
                >
                  <Switch
                    checked={prefs.compactSidebar}
                    onCheckedChange={(checked) =>
                      updatePrefs({ compactSidebar: Boolean(checked) })
                    }
                  />
                </SettingRow>
                <SettingRow
                  title="Page marks"
                  description="Show emoji marks next to pages instead of plain file icons."
                >
                  <Switch
                    checked={prefs.showPageMarks}
                    onCheckedChange={(checked) =>
                      updatePrefs({ showPageMarks: Boolean(checked) })
                    }
                  />
                </SettingRow>
                <div className="flex items-start gap-3 py-4 text-[13px] text-muted-foreground">
                  <LayoutPanelLeft className="mt-0.5 size-4 shrink-0 text-foreground/55" />
                  <p>
                    Tip: grab the thin edge between the sidebar and the canvas,
                    then drag. The width saves automatically on this device.
                  </p>
                </div>
              </SettingsPanel>
            ) : null}

            {section === "writing" ? (
              <SettingsPanel
                title="Writing"
                description="How the page editor feels while you type and save."
              >
                <SettingRow
                  title="Font size"
                  description="Scale the page title and body feel."
                >
                  <Segmented
                    value={prefs.editorFontSize}
                    onChange={(editorFontSize) =>
                      updatePrefs({ editorFontSize })
                    }
                    options={[
                      { value: "sm", label: "S" },
                      { value: "md", label: "M" },
                      { value: "lg", label: "L" },
                    ]}
                  />
                </SettingRow>
                <SettingRow
                  title="Autosave delay"
                  description="How long to wait after typing before syncing to Appwrite."
                >
                  <Segmented
                    value={String(prefs.autosaveMs) as "300" | "450" | "800"}
                    onChange={(value) =>
                      updatePrefs({
                        autosaveMs: Number(value) as 300 | 450 | 800,
                      })
                    }
                    options={[
                      { value: "300", label: "Fast" },
                      { value: "450", label: "Balanced" },
                      { value: "800", label: "Calm" },
                    ]}
                  />
                </SettingRow>
                <SettingRow
                  title="Spell check"
                  description="Browser spellcheck inside the page body."
                >
                  <Switch
                    checked={prefs.spellCheck}
                    onCheckedChange={(checked) =>
                      updatePrefs({ spellCheck: Boolean(checked) })
                    }
                  />
                </SettingRow>
                <SettingRow
                  title="Focus mode"
                  description="Quieter chrome while editing (canvas support grows over time)."
                >
                  <Switch
                    checked={prefs.focusMode}
                    onCheckedChange={(checked) =>
                      updatePrefs({ focusMode: Boolean(checked) })
                    }
                  />
                </SettingRow>
                <SettingRow
                  title="Show linked notes"
                  description="Keep the page-links panel visible by default."
                >
                  <Switch
                    checked={prefs.showLinkedNotes}
                    onCheckedChange={(checked) =>
                      updatePrefs({ showLinkedNotes: Boolean(checked) })
                    }
                  />
                </SettingRow>
              </SettingsPanel>
            ) : null}

            {section === "workspace" ? (
              <>
                <SettingsPanel
                  title="Workspace"
                  description="Defaults for first paint, calendar, and new pages."
                >
                  <SettingRow
                    title="Landing view"
                    description="Where the vault opens after load."
                  >
                    <Segmented
                      value={prefs.defaultLandingView}
                      onChange={(defaultLandingView) =>
                        updatePrefs({
                          defaultLandingView,
                          openCalendarFirst:
                            defaultLandingView === "calendar",
                        })
                      }
                      options={[
                        { value: "pages", label: "Pages" },
                        { value: "calendar", label: "Cal" },
                        { value: "lab", label: "Lab" },
                        { value: "map", label: "Map" },
                      ]}
                    />
                  </SettingRow>
                  <SettingRow
                    title="Week starts on"
                    description="First day shown in the calendar week strip."
                  >
                    <Segmented
                      value={prefs.weekStartsOn}
                      onChange={(weekStartsOn) =>
                        updatePrefs({ weekStartsOn })
                      }
                      options={[
                        { value: "monday", label: "Mon" },
                        { value: "sunday", label: "Sun" },
                      ]}
                    />
                  </SettingRow>
                  <SettingRow
                    title="Default page title"
                    description="Prefill when the create dialog opens."
                  >
                    <Input
                      value={prefs.defaultNewPageTitle}
                      onChange={(event) =>
                        updatePrefs({
                          defaultNewPageTitle: event.target.value,
                        })
                      }
                      className="h-9 w-44 rounded-lg"
                    />
                  </SettingRow>
                  <SettingRow
                    title="Default template"
                    description="Selected when you create a page (unless you pick another)."
                  >
                    <select
                      value={prefs.defaultTemplateId}
                      onChange={(event) =>
                        updatePrefs({
                          defaultTemplateId: event.target.value,
                        })
                      }
                      className="h-9 max-w-[14rem] rounded-lg border border-border bg-background px-2 text-sm"
                    >
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.custom
                            ? `★ ${template.label}`
                            : template.label}
                        </option>
                      ))}
                    </select>
                  </SettingRow>
                </SettingsPanel>

                <SettingsPanel
                  title="Templates"
                  description="Browse built-ins, manage custom starters, and create pages from them."
                >
                  <div className="py-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={onOpenTemplates}
                    >
                      <LayoutTemplate className="size-3.5" />
                      Open Templates
                    </Button>
                  </div>
                </SettingsPanel>
              </>
            ) : null}

            {section === "privacy" ? (
              <>
                <SettingsPanel
                  title="Privacy & safety"
                  description="Local guards before destructive actions. Session comes from Appwrite."
                >
                  <SettingRow
                    title="Confirm before trash"
                    description="Ask before moving a page or folder to trash."
                  >
                    <Switch
                      checked={prefs.confirmTrash}
                      onCheckedChange={(checked) =>
                        updatePrefs({ confirmTrash: Boolean(checked) })
                      }
                    />
                  </SettingRow>
                  <SettingRow
                    title="Signed-in as"
                    description={
                      user?.email ||
                      accountLabel ||
                      "Guest — demo/local shelf only"
                    }
                  >
                    {user ? (
                      user.emailVerification ? (
                        <Badge variant="secondary" className="gap-1">
                          <ShieldCheck className="size-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-amber-700 dark:text-amber-300"
                        >
                          Unverified
                        </Badge>
                      )
                    ) : (
                      <Badge variant="secondary">Guest</Badge>
                    )}
                  </SettingRow>
                </SettingsPanel>

                <SettingsPanel
                  title="Account"
                  description="Profile name and password changes will land here next."
                >
                  <div className="py-4">
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="font-display text-base font-semibold text-foreground">
                        {user?.name || accountLabel || "Guest"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {user?.email ||
                          "Not signed in — shelf stays on this device."}
                      </p>
                    </div>
                  </div>
                </SettingsPanel>
              </>
            ) : null}

            {section === "alerts" ? (
              <SettingsPanel
                title="Alerts"
                description="Local toggles for upcoming notification hooks."
              >
                <SettingRow
                  title="Mentions"
                  description="When someone tags you in a shared page."
                >
                  <Switch
                    checked={prefs.notifyMentions}
                    onCheckedChange={(checked) =>
                      updatePrefs({ notifyMentions: Boolean(checked) })
                    }
                  />
                </SettingRow>
                <SettingRow
                  title="Calendar reminders"
                  description="Heads-up for events on your vault calendar."
                >
                  <Switch
                    checked={prefs.notifyCalendar}
                    onCheckedChange={(checked) =>
                      updatePrefs({ notifyCalendar: Boolean(checked) })
                    }
                  />
                </SettingRow>
                <SettingRow
                  title="Trash digests"
                  description="Occasional reminder that items sit in trash."
                >
                  <Switch
                    checked={prefs.notifyTrash}
                    onCheckedChange={(checked) =>
                      updatePrefs({ notifyTrash: Boolean(checked) })
                    }
                  />
                </SettingRow>
                <SettingRow
                  title="Product updates"
                  description="Occasional NoteValut tips and release notes."
                >
                  <Switch
                    checked={prefs.notifyUpdates}
                    onCheckedChange={(checked) =>
                      updatePrefs({ notifyUpdates: Boolean(checked) })
                    }
                  />
                </SettingRow>
              </SettingsPanel>
            ) : null}

            {section === "shortcuts" ? (
              <SettingsPanel
                title="Shortcuts"
                description="Keyboard paths that already work in the vault shell."
              >
                <ul className="divide-y divide-border text-sm">
                  {[
                    ["Search pages & jumps", "⌘ K"],
                    ["New page dialog", "Sidebar +"],
                    ["Resize sidebar", "Drag edge"],
                    ["Reset sidebar width", "Double-click edge"],
                    ["Toggle theme", "Theme control"],
                    ["Slash commands in editor", "/"],
                  ].map(([label, keys]) => (
                    <li
                      key={label}
                      className="flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-4"
                    >
                      <span className="text-foreground/80">{label}</span>
                      <kbd className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {keys}
                      </kbd>
                    </li>
                  ))}
                </ul>
              </SettingsPanel>
            ) : null}
          </div>
        </ScrollPane>
      </div>
    </motion.section>
  );
}
