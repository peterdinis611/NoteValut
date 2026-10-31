"use client";

import { useUser } from "@appwrite.io/react";
import { motion, useReducedMotion } from "motion/react";
import {
  Bell,
  CalendarDays,
  Keyboard,
  LayoutTemplate,
  Moon,
  Palette,
  ShieldCheck,
  Type,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_VAULT_PREFERENCES,
  loadVaultPreferences,
  saveVaultPreferences,
  type VaultPreferences,
} from "@/lib/vault-preferences";
import { listPageTemplates } from "@/lib/vault/page-templates";
import { ScrollPane } from "./scroll-to-top";

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
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 sm:pr-6">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-[13px] text-foreground/60">{description}</p>
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
    <div className="inline-flex rounded-lg bg-muted p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-foreground/55 hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
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

  const [prefs, setPrefs] = useState<VaultPreferences>(DEFAULT_VAULT_PREFERENCES);
  const templates = useMemo(() => listPageTemplates(), [prefs.defaultTemplateId]);

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

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-0 flex min-w-0 flex-1 flex-col overflow-hidden bg-background"
    >
      <header className="border-b border-border px-6 py-5 md:px-10">
        <p className="text-[12px] font-medium tracking-[0.04em] text-foreground/55 uppercase">
          Settings
        </p>
        <h1 className="mt-1 font-display text-[28px] font-semibold tracking-tight text-foreground">
          Vault preferences
        </h1>
        <p className="mt-1 max-w-xl text-sm text-foreground/65">
          Theme, writing habits, workspace defaults, privacy, and alerts —
          stored on this device.
        </p>
      </header>

      <ScrollPane className="px-6 py-6 md:px-10">
        <Tabs defaultValue="appearance" className="max-w-3xl gap-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-muted p-1">
            <TabsTrigger value="appearance" className="rounded-lg">
              <Palette className="size-3.5" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="editor" className="rounded-lg">
              <Type className="size-3.5" />
              Writing
            </TabsTrigger>
            <TabsTrigger value="workspace" className="rounded-lg">
              <CalendarDays className="size-3.5" />
              Workspace
            </TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-lg">
              <ShieldCheck className="size-3.5" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg">
              <Bell className="size-3.5" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="rounded-lg">
              <Keyboard className="size-3.5" />
              Shortcuts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="mt-4 space-y-4">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="font-display text-lg">Theme</CardTitle>
                <CardDescription>
                  Warm paper by day, espresso ink by night — or follow the system.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
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
                  title="Compact sidebar"
                  description="Tighter row spacing in the private tree."
                >
                  <Switch
                    checked={prefs.compactSidebar}
                    onCheckedChange={(checked) =>
                      updatePrefs({ compactSidebar: Boolean(checked) })
                    }
                  />
                </SettingRow>
                <SettingRow
                  title="Editor density"
                  description="Comfortable spacing or a denser writing surface."
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editor" className="mt-4 space-y-4">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="font-display text-lg">Writing</CardTitle>
                <CardDescription>
                  How the page editor feels while you type and save.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
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
                  description="Hide chrome hints while editing (coming to the canvas)."
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workspace" className="mt-4 space-y-4">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="font-display text-lg">Workspace</CardTitle>
                <CardDescription>
                  Defaults for new pages, calendar, and first paint.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                <SettingRow
                  title="Open calendar first"
                  description="Land on Calendar when opening the vault."
                >
                  <div className="flex items-center gap-2">
                    <Moon className="size-3.5 text-foreground/55" />
                    <Switch
                      checked={prefs.openCalendarFirst}
                      onCheckedChange={(checked) =>
                        updatePrefs({ openCalendarFirst: Boolean(checked) })
                      }
                    />
                  </div>
                </SettingRow>
                <SettingRow
                  title="Week starts on"
                  description="First day shown in the calendar week strip."
                >
                  <Segmented
                    value={prefs.weekStartsOn}
                    onChange={(weekStartsOn) => updatePrefs({ weekStartsOn })}
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
                      updatePrefs({ defaultNewPageTitle: event.target.value })
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
                      updatePrefs({ defaultTemplateId: event.target.value })
                    }
                    className="h-9 max-w-[14rem] rounded-lg border border-border bg-background px-2 text-sm"
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.custom ? `★ ${template.label}` : template.label}
                      </option>
                    ))}
                  </select>
                </SettingRow>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2 text-lg">
                  <LayoutTemplate className="size-4" />
                  Templates
                </CardTitle>
                <CardDescription>
                  Browse built-ins, manage custom starters, and create pages from
                  them.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={onOpenTemplates}
                >
                  Open Templates
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="mt-4 space-y-4">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="font-display text-lg">Privacy & safety</CardTitle>
                <CardDescription>
                  Local guards before destructive actions. Session comes from
                  Appwrite.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
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
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="font-display text-lg">Account</CardTitle>
                <CardDescription>
                  Profile name and password changes will land here next.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="font-display text-base font-semibold text-foreground">
                    {user?.name || accountLabel || "Guest"}
                  </p>
                  <p className="mt-1 text-sm text-foreground/60">
                    {user?.email || "Not signed in — shelf stays on this device."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="font-display text-lg">Alerts</CardTitle>
                <CardDescription>
                  Local toggles for upcoming notification hooks.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shortcuts" className="mt-4">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="font-display text-lg">Shortcuts</CardTitle>
                <CardDescription>
                  Keyboard paths that already work in the vault shell.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border text-sm">
                  {[
                    ["Search pages & jumps", "⌘ K"],
                    ["New page dialog", "Sidebar +"],
                    ["Toggle theme", "Theme control"],
                    ["Slash commands in editor", "/"],
                  ].map(([label, keys]) => (
                    <li
                      key={label}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="text-foreground/80">{label}</span>
                      <kbd className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {keys}
                      </kbd>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ScrollPane>
    </motion.section>
  );
}
