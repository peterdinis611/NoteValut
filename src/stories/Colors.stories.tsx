import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { THEME_PRESETS } from "@/db/settings-collection";
import { HIGHLIGHT_COLORS, LABEL_COLORS, TEXT_COLORS } from "@/lib/colors";

const THEME_VARS = [
  "--background",
  "--foreground",
  "--sidebar",
  "--panel",
  "--hover",
  "--border",
  "--muted",
  "--accent",
  "--accent-soft",
  "--topbar",
] as const;

function ColorsCanvas() {
  return (
    <div className="space-y-10 p-6">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Theme CSS variables</h2>
        <p className="mb-4 text-sm text-muted">
          Switch presets with the Theme toolbar. Swatches read live computed values.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THEME_VARS.map((name) => (
            <div
              key={name}
              className="flex items-center gap-3 rounded-lg border border-border bg-panel p-3"
            >
              <span
                className="size-10 shrink-0 rounded-md border border-border"
                style={{ background: `var(${name})` }}
              />
              <code className="text-xs">{name}</code>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Label colors</h2>
        <div className="flex flex-wrap gap-2">
          {LABEL_COLORS.map((c) => (
            <span
              key={c.id}
              className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs ${c.class}`}
              style={{ backgroundColor: `${c.hex}33`, color: c.hex }}
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
              {c.id}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Text colors</h2>
        <div className="flex flex-wrap gap-3">
          {TEXT_COLORS.filter((c) => c.hex).map((c) => (
            <span key={c.id} className="text-sm" style={{ color: c.hex }}>
              {c.label}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Highlight colors</h2>
        <div className="flex flex-wrap gap-2">
          {HIGHLIGHT_COLORS.filter((c) => c.hex).map((c) => (
            <span
              key={c.id}
              className="rounded-md px-2.5 py-1 text-xs"
              style={{ backgroundColor: c.hex }}
            >
              {c.label}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

const meta = {
  title: "App/Colors",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Palette: Story = {
  render: () => <ColorsCanvas />,
};

function ThemeCardsCanvas() {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-lg font-semibold">Theme presets</h2>
      <p className="text-sm text-muted">
        Swatches from <code>THEME_PRESETS</code> in settings-collection.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(THEME_PRESETS).map((preset) => (
          <div key={preset.id} className="overflow-hidden rounded-lg border border-border bg-panel">
            <div
              className="flex h-16 items-end gap-1 p-3"
              style={{ background: preset.vars["--background"] }}
            >
              <span
                className="size-8 rounded-md border border-white/10"
                style={{ background: preset.swatch }}
              />
              <span
                className="size-8 rounded-md border border-white/10"
                style={{ background: preset.vars["--panel"] }}
              />
              <span
                className="size-8 rounded-md border border-white/10"
                style={{ background: preset.vars["--sidebar"] }}
              />
            </div>
            <div className="space-y-1 p-3">
              <p className="text-sm font-medium">{preset.label}</p>
              <p className="text-xs text-muted">{preset.description}</p>
              <code className="text-[10px] text-muted">{preset.id}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const ThemeCards: Story = {
  render: () => <ThemeCardsCanvas />,
};
