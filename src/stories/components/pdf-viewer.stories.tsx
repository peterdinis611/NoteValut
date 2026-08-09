import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PdfViewer } from "@/components/pdf-viewer";

const meta = {
  title: "Components/PdfViewer",
  component: PdfViewer,
  args: {
    src: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
    title: "Sample PDF",
    height: "28rem",
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "EmbedPDF viewer (needs WASM from `/embedpdf/pdfium.wasm`). Network PDF may be blocked in some environments.",
      },
    },
  },
} satisfies Meta<typeof PdfViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tall: Story = {
  args: {
    height: "42rem",
  },
};

export const Fullscreen: Story = {
  args: {
    fullscreen: true,
  },
  parameters: { layout: "fullscreen" },
};
