import type { Preview } from "@storybook/nextjs-vite";
import { ToastProvider } from "../src/components/toast";
import { THEME_PRESETS } from "../src/db/settings-collection";
import "../src/app/globals.css";
import { StorybookConvexProvider } from "./mocks/convex-react";

function applyThemeVars(themeId: keyof typeof THEME_PRESETS) {
  const preset = THEME_PRESETS[themeId] ?? THEME_PRESETS.default;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(preset.vars)) {
    root.style.setProperty(key, value);
  }
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
      const themeId = (context.globals.theme ?? "default") as keyof typeof THEME_PRESETS;
      if (typeof document !== "undefined") {
        applyThemeVars(themeId);
      }
      const convex = (context.parameters.convex ?? {}) as {
        queries?: Record<string, unknown>;
        defaultQuery?: unknown;
      };
      return (
        <StorybookConvexProvider queries={convex.queries} defaultQuery={convex.defaultQuery}>
          <ToastProvider>
            <div
              className="min-h-[100vh] bg-background text-foreground antialiased"
              style={{
                fontFamily:
                  "var(--font-body), var(--font-sans), ui-sans-serif, system-ui, sans-serif",
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
