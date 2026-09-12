import type { Preview } from "@storybook/nextjs-vite";
import { ToastProvider } from "../src/components/toast";
import { THEME_PRESETS, type ThemePresetId } from "../src/db/settings-collection";
import "../src/app/globals.css";
import "../src/app/folio-pages.css";
import { StorybookConvexProvider } from "./mocks/convex-react";
import { folioTheme } from "./folio-theme";

function applyThemeVars(themeId: Exclude<ThemePresetId, "custom">) {
  const preset = THEME_PRESETS[themeId] ?? THEME_PRESETS.default;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(preset.vars)) {
    root.style.setProperty(key, value);
  }
  const accent = preset.vars["--accent"];
  const background = preset.vars["--background"] ?? "#fbf8f2";
  if (accent) {
    root.style.setProperty("--accent-bright", `color-mix(in srgb, ${accent} 72%, #fff)`);
    root.style.setProperty("--accent-ink", preset.vars["--accent-ink"] ?? background);
  }
  const hex = background.replace("#", "");
  let isLight = true;
  if (hex.length >= 6) {
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    isLight = 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45;
  }
  root.style.colorScheme = isLight ? "light" : "dark";
  root.classList.toggle("dark", !isLight);
}

const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
    docs: {
      theme: folioTheme,
    },
    options: {
      storySort: {
        order: ["Folio", "App", "Components", "Editor"],
      },
    },
    a11y: { test: "todo" },
    convex: {
      queries: {},
      defaultQuery: undefined,
    },
  },
  globalTypes: {
    theme: {
      description: "NoteVault color theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: Object.values(THEME_PRESETS).map((p) => ({
          value: p.id,
          title: p.label,
          right: p.swatch,
        })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "default",
  },
  decorators: [
    (Story, context) => {
      const themeId = (context.globals.theme ?? "default") as Exclude<ThemePresetId, "custom">;
      if (typeof document !== "undefined") {
        applyThemeVars(THEME_PRESETS[themeId] ? themeId : "default");
      }
      const convex = (context.parameters.convex ?? {}) as {
        queries?: Record<string, unknown>;
        defaultQuery?: unknown;
      };
      return (
        <StorybookConvexProvider queries={convex.queries} defaultQuery={convex.defaultQuery}>
          <ToastProvider>
            <div
              className="nv-atmosphere min-h-[100vh] bg-background text-foreground antialiased"
              style={{
                fontFamily: "var(--font-body), var(--font-sans), ui-sans-serif, sans-serif",
              }}
            >
              <Story />
            </div>
          </ToastProvider>
        </StorybookConvexProvider>
      );
    },
  ],
};

export default preview;
