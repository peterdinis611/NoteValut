import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { VaultAccessProvider, useVaultAccess } from "./vault-access";

function AccessDemo() {
  const access = useVaultAccess();
  return (
    <div className="mx-auto max-w-sm space-y-2 rounded-xl border border-border bg-panel p-6 text-sm">
      <p>
        <span className="text-muted">role:</span>{" "}
        <strong className="text-foreground">{access.role}</strong>
      </p>
      <p>
        <span className="text-muted">isOwner:</span>{" "}
        <strong className="text-foreground">{String(access.isOwner)}</strong>
      </p>
      <p>
        <span className="text-muted">readOnly:</span>{" "}
        <strong className="text-foreground">{String(access.readOnly)}</strong>
      </p>
      {access.sharePermission ? (
        <p>
          <span className="text-muted">sharePermission:</span>{" "}
          <strong className="text-foreground">{access.sharePermission}</strong>
        </p>
      ) : null}
    </div>
  );
}

const meta = {
  title: "Context/VaultAccess",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Owner: Story = {
  render: () => (
    <VaultAccessProvider isOwner>
      <AccessDemo />
    </VaultAccessProvider>
  ),
};

export const Viewer: Story = {
  render: () => (
    <VaultAccessProvider sharePermission="read" shareScope="vault" shareToken="viewer-token">
      <AccessDemo />
    </VaultAccessProvider>
  ),
};

export const Editor: Story = {
  render: () => (
    <VaultAccessProvider sharePermission="write" shareScope="entry" shareToken="editor-token">
      <AccessDemo />
    </VaultAccessProvider>
  ),
};
