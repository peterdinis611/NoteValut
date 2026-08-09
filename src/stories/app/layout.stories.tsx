import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";

/**
 * Root layout pulls next/font + ClerkProvider + ConvexClientProvider.
 * Story shows the provider shell with placeholder children (fonts come from preview-head).
 */
function LayoutShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="border-b border-border px-4 py-2 text-xs text-muted">
        Root layout shell (Clerk + Convex + PwaRegister in app)
      </div>
      {children}
    </div>
  );
}

const meta = {
  title: "App/Routes/RootLayout",
  component: LayoutShell,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof LayoutShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithChildren: Story = {
  args: {
    children: (
      <main className="p-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl">NoteVault</h1>
        <p className="mt-2 text-sm text-muted">
          Layout story — real `layout.tsx` also mounts ClerkProvider, ConvexClientProvider, and
          PwaRegister.
        </p>
      </main>
    ),
  },
};
