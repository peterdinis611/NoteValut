import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { THEME_PRESETS } from "@/db/settings-collection";
import { HIGHLIGHT_COLORS, LABEL_COLORS, TEXT_COLORS } from "@/lib/colors";

const THEME_VARS = [
  "--background",
  "--foreground",
  "--sidebar",
  "--panel",
  "--hover",
  "--hover-strong",
  "--border",
  "--muted",
  "--accent",
  "--accent-soft",
  "--accent-ink",
  "--lilac",
  "--topbar",
] as const;

function ColorsCanvas() {
  return (
    <div className="space-y-10 p-6">
      <section>
        <p className="mb-1 text-[0.68rem] uppercase tracking-[0.28em] text-accent">Folio</p>
        <h2
          className="mb-3 text-2xl"
          style={{ fontFamily: "var(--font-land-display), Calistoga, Georgia, serif" }}
        >
          Theme CSS variables
        </h2>
        <p className="mb-4 text-sm text-muted">
          Switch presets with the Theme toolbar. Swatches read live computed values.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THEME_VARS.map((name) => (
            <div
              key={name}
              className="flex items-center gap-3 border border-foreground bg-panel p-3 shadow-[3px_3px_0_var(--foreground)]"
            >
              <span
                className="size-10 shrink-0 border border-foreground"
                style={{ background: `var(${name})` }}
              />
              <code className="text-xs">{name}</code>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2
          className="mb-3 text-2xl"
          style={{ fontFamily: "var(--font-land-display), Calistoga, Georgia, serif" }}
        >
          Label colors
        </h2>
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
        <h2
          className="mb-3 text-2xl"
          style={{ fontFamily: "var(--font-land-display), Calistoga, Georgia, serif" }}
        >
          Text colors
        </h2>
        <div className="flex flex-wrap gap-3">
          {TEXT_COLORS.filter((c) => c.hex).map((c) => (
            <span key={c.id} className="text-sm" style={{ color: c.hex }}>
              {c.label}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2
          className="mb-3 text-2xl"
          style={{ fontFamily: "var(--font-land-display), Calistoga, Georgia, serif" }}
        >
          Highlight colors
        </h2>
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
      <h2
        className="text-2xl"
        style={{ fontFamily: "var(--font-land-display), Calistoga, Georgia, serif" }}
      >
        Theme presets
      </h2>
      <p className="text-sm text-muted">
        Swatches from <code>THEME_PRESETS</code>. Folio is the default; Phosphor lives under forest.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(THEME_PRESETS).map((preset) => (
          <div
            key={preset.id}
            className="overflow-hidden border border-foreground bg-panel shadow-[4px_4px_0_var(--foreground)]"
          >
            <div
              className="flex h-16 items-end gap-1 p-3"
              style={{ background: preset.vars["--background"] }}
            >
              <span
                className="size-8 border border-foreground"
                style={{ background: preset.swatch }}
              />
              <span
                className="size-8 border border-foreground"
                style={{ background: preset.vars["--panel"] }}
              />
              <span
                className="size-8 border border-foreground"
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
