import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { useToast } from "@/components/toast";

function ToastDemo() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-3 p-6">
      <button type="button" className="settings-btn" onClick={() => toast.success("Saved")}>
        Success
      </button>
      <button
        type="button"
        className="settings-btn"
        onClick={() => toast.error("Something failed")}
      >
        Error
      </button>
      <button type="button" className="settings-btn" onClick={() => toast.info("Heads up")}>
        Info
      </button>
    </div>
  );
}

function AutoFire({ kind, message }: { kind: "success" | "error" | "info"; message: string }) {
  const toast = useToast();
  useEffect(() => {
    toast[kind](message);
  }, [kind, message, toast]);
  return (
    <p className="p-6 text-sm text-muted">
      Auto-fired <code className="text-foreground">{kind}</code> toast on mount.
    </p>
  );
}

const meta = {
  title: "Components/Toast",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Demo: Story = {
  render: () => <ToastDemo />,
};

export const Success: Story = {
  render: () => <AutoFire kind="success" message="Saved successfully" />,
};

export const Error: Story = {
  render: () => <AutoFire kind="error" message="Something failed" />,
};

export const Info: Story = {
  render: () => <AutoFire kind="info" message="Heads up" />,
};
