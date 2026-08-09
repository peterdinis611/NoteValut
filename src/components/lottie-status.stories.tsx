import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { LottieStatus } from "./lottie-status";

const meta = {
  title: "Components/LottieStatus",
  component: LottieStatus,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof LottieStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    variant: "loading",
    title: "Loading vault",
    description: "Fetching your notes and collections.",
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    title: "Something went wrong",
    description: "We couldn’t load this page. Try again or go home.",
    detailPreview: "TypeError: Cannot read properties of undefined",
    detailRows: [
      { label: "Code", value: "NV_EDITOR_CRASH", mono: true },
      { label: "Digest", value: "abc123", mono: true },
    ],
    detailStack: "Error: boom\n    at NoteEditor (note-editor.tsx:42)\n    at renderWithHooks",
    actions: [
      { label: "Try again", onClick: fn(), primary: true },
      { label: "Back to vault", href: "/" },
    ],
  },
};

export const NotFound: Story = {
  args: {
    variant: "not-found",
    title: "Page not found",
    description: "This note may have been moved or deleted.",
    actions: [{ label: "Back to vault", href: "/", primary: true }],
  },
};

export const NotAuthorized: Story = {
  args: {
    variant: "not-authorized",
    title: "Not authorized",
    description: "You don’t have access to this shared vault.",
    actions: [{ label: "Sign in", href: "/sign-in", primary: true }],
  },
};

export const Compact: Story = {
  args: {
    variant: "loading",
    title: "Syncing",
    description: "Saving changes…",
    compact: true,
  },
};

export const ErrorMinimal: Story = {
  args: {
    variant: "error",
    title: "Something went wrong",
    description: "We couldn’t load this page. Try again or go home.",
  },
};

export const LoadingWithActions: Story = {
  args: {
    variant: "loading",
    title: "Importing notes",
    description: "This may take a moment for large vaults.",
    actions: [
      { label: "Cancel", onClick: fn() },
      { label: "Work offline", onClick: fn(), primary: true },
    ],
  },
};
