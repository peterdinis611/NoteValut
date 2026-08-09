import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createBlock } from "@/lib/blocks";
import {
  TemplatePreviewDialog,
  type PreviewableTemplate,
} from "@/components/template-preview-dialog";

vi.mock("motion/react", () => {
  const Passthrough = ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => {
    const {
      initial: _i,
      animate: _a,
      exit: _e,
      variants: _v,
      transition: _t,
      ...rest
    } = props;
    return <div {...rest}>{children}</div>;
  };
  return {
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
    motion: { div: Passthrough },
  };
});

vi.mock("@/editor", () => ({
  VaultEditor: ({ readOnly }: { readOnly?: boolean }) => (
    <div data-testid="preview-editor">{readOnly ? "readonly" : "editable"}</div>
  ),
}));

const sample: PreviewableTemplate = {
  id: "meeting",
  name: "Meeting notes",
  icon: "🤝",
  description: "Agenda and actions",
  tags: ["meeting", "work"],
  blocks: [createBlock("heading2", "Agenda")],
  builtIn: true,
};

describe("TemplatePreviewDialog", () => {
  afterEach(() => cleanup());

  it("renders nothing without a template", () => {
    render(<TemplatePreviewDialog template={null} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows template metadata and a read-only editor", () => {
    render(<TemplatePreviewDialog template={sample} onClose={() => {}} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Meeting notes")).toBeInTheDocument();
    expect(screen.getByText(/built-in/i)).toBeInTheDocument();
    expect(screen.getByText("Agenda and actions")).toBeInTheDocument();
    expect(screen.getByText("meeting")).toBeInTheDocument();
    expect(screen.getByTestId("preview-editor")).toHaveTextContent("readonly");
  });

  it("marks custom templates", () => {
    render(
      <TemplatePreviewDialog
        template={{ ...sample, builtIn: false }}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/custom/i)).toBeInTheDocument();
  });

  it("closes via button, overlay, and Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <TemplatePreviewDialog template={sample} onClose={onClose} />,
    );

    await user.click(screen.getByRole("button", { name: /close preview/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    rerender(<TemplatePreviewDialog template={sample} onClose={onClose} />);
    await user.click(document.querySelector(".share-overlay")!);
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    rerender(<TemplatePreviewDialog template={sample} onClose={onClose} />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
