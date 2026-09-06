import type { Meta, StoryObj } from "@storybook/nextjs-vite";

/**
 * `ConvexClientProvider` gates the app on `NEXT_PUBLIC_CONVEX_URL`.
 * This story re-renders the same setup empty state JSX without relying on env
 * so Storybook always shows the missing-Convex UI.
 */
function SetupRequiredUi() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
      <div className="max-w-md space-y-4">
        <p className="text-2xl font-semibold">NoteVault</p>
        <p className="text-sm text-muted">
          Connect Convex to get started. Run{" "}
          <code className="rounded bg-panel px-1.5 py-0.5 text-foreground">npx convex dev</code> and
          add{" "}
          <code className="rounded bg-panel px-1.5 py-0.5 text-foreground">
            NEXT_PUBLIC_CONVEX_URL
          </code>{" "}
          to <code className="rounded bg-panel px-1.5 py-0.5">.env.local</code>.
        </p>
      </div>
    </div>
  );
}

const meta = {
  title: "App/Providers",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Setup empty state shown by ConvexClientProvider when NEXT_PUBLIC_CONVEX_URL is missing.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const SetupRequired: Story = {
  name: "SetupRequired",
  render: () => <SetupRequiredUi />,
};
