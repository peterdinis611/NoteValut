import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { SoftErrorBoundary } from "@/components/soft-error-boundary";

function Boom(): ReactNode {
  throw new Error("Storybook intentional error");
}

const meta = {
  title: "Components/SoftErrorBoundary",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const TriggerError: Story = {
  render: () => (
    <SoftErrorBoundary
      fallback={
        <div className="rounded-lg border border-border bg-panel p-4 text-sm text-muted">
          Soft error caught — feature disabled.
        </div>
      }
    >
      <Boom />
    </SoftErrorBoundary>
  ),
};

export const Healthy: Story = {
  render: () => (
    <SoftErrorBoundary fallback={<p>fallback</p>}>
      <p className="text-sm">Child rendered normally.</p>
    </SoftErrorBoundary>
  ),
};
