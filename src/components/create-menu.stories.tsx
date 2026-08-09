import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { CreateMenu, CreateMenuTrigger } from "./create-menu";

const meta = {
  title: "Components/CreateMenu",
  component: CreateMenu,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="relative h-80 w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CreateMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    onClose: fn(),
    onCreateEntry: fn(),
    onCreateCollection: fn(),
  },
};

export const Closed: Story = {
  args: {
    open: false,
    onClose: fn(),
    onCreateEntry: fn(),
    onCreateCollection: fn(),
  },
};

export const Trigger: Story = {
  render: () => (
    <CreateMenuTrigger onClick={fn()}>New page</CreateMenuTrigger>
  ),
};
