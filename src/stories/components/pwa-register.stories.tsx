import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PwaRegister } from "@/components/pwa-register";

const meta = {
  title: "Components/PwaRegister",
  component: PwaRegister,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PwaRegister>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mounted: Story = {
  render: () => (
    <div className="space-y-3 p-6 text-sm text-muted">
      <p>
        <code className="text-foreground">PwaRegister</code> returns{" "}
        <code className="text-foreground">null</code>. It only registers (or
        unregisters) the service worker as a side effect.
      </p>
      <PwaRegister />
      <p className="text-xs">Component mounted — nothing visible is expected.</p>
    </div>
  ),
};
