import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { LottieStatus, errorStatusDetails } from "@/components/lottie-status";

/**
 * Real `global-error.tsx` renders nested `<html><body>`, which breaks Storybook’s
 * iframe document. This story mirrors the user-visible status UI instead.
 */
function GlobalErrorPreview({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const details = errorStatusDetails(error, {
    path: "/storybook",
    when: new Date().toLocaleString(),
  });
  return (
    <LottieStatus
      variant="error"
      title="NoteVault crashed"
      description="A critical error stopped the app from rendering. Reload to get back in."
      detailPreview={details.detailPreview}
      detailRows={details.detailRows}
      detailStack={details.detailStack}
      actions={[
        { label: "Reload", onClick: reset, primary: true },
        { label: "Go home", href: "/" },
      ]}
    />
  );
}

const crash = Object.assign(new Error("Critical layout crash"), {
  digest: "storybook-global-digest",
});

const meta = {
  title: "App/GlobalError",
  component: GlobalErrorPreview,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Preview of root layout error UI. The real route also wraps content in its own html/body.",
      },
    },
  },
} satisfies Meta<typeof GlobalErrorPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    error: crash,
    reset: fn(),
  },
};
