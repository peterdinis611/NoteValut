import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { VirtualList } from "./virtual-list";

type Row = { id: string; label: string };

const items: Row[] = Array.from({ length: 200 }, (_, i) => ({
  id: `item-${i}`,
  label: `Note ${i + 1}`,
}));

const meta = {
  title: "Components/VirtualList",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const TwoHundredItems: Story = {
  render: () => (
    <VirtualList
      items={items}
      estimateSize={36}
      className="virtual-list h-80 max-w-md overflow-auto rounded-lg border border-border"
      getKey={(item) => item.id}
      renderItem={(item) => (
        <div className="border-b border-border/60 px-3 py-2 text-sm">{item.label}</div>
      )}
    />
  ),
};
