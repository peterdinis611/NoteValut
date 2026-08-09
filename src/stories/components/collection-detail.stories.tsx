import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { noteId, ownerId, sampleFolder, sampleNotes } from "../../../.storybook/fixtures";
import { CollectionDetail } from "@/components/collection-detail";

const folder = sampleFolder();
const children = sampleNotes().filter((n) => n.parentId === folder._id);

const meta = {
  title: "App/CollectionDetail",
  component: CollectionDetail,
  parameters: {
    layout: "fullscreen",
    convex: {
      queries: {
        "notes:listChildren": children,
        "shares:list": [],
        "vaultSettings:get": {
          ownerId,
          sharingEnabled: true,
          publicReadonly: true,
          updatedAt: Date.now(),
        },
      },
    },
  },
} satisfies Meta<typeof CollectionDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    folder,
    ownerId,
    onNavigate: fn(),
    onCreateEntry: fn(),
    onCreateCollection: fn(),
  },
};

export const Empty: Story = {
  parameters: {
    convex: {
      queries: {
        "notes:listChildren": [],
      },
    },
  },
  args: {
    folder: sampleFolder({ _id: noteId(11), title: "Empty collection" }),
    ownerId,
    onNavigate: fn(),
    onCreateEntry: fn(),
    onCreateCollection: fn(),
  },
};

export const Grid: Story = {
  args: {
    folder: sampleFolder({ viewMode: "grid" }),
    ownerId,
    onNavigate: fn(),
    onCreateEntry: fn(),
    onCreateCollection: fn(),
  },
};

export const List: Story = {
  args: {
    folder: sampleFolder({ viewMode: "list" }),
    ownerId,
    onNavigate: fn(),
    onCreateEntry: fn(),
    onCreateCollection: fn(),
  },
};
