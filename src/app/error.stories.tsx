import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import ErrorPage from "./error";

const boom = Object.assign(new Error("Boom"), { digest: "storybook-digest-1" });

const meta = {
  title: "App/Error",
  component: ErrorPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ErrorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    error: boom,
    reset: fn(),
  },
};
