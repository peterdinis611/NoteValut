import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadCustomTemplates,
  removeCustomTemplate,
} from "@/db/templates-collection";
import { TemplateEditorDialog } from "@/components/template-editor-dialog";

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
    motion: {
      div: Passthrough,
    },
  };
});

vi.mock("@/editor", () => ({
  VaultEditor: ({
    blocks,
  }: {
    blocks: unknown[];
    onChange: (blocks: unknown[]) => void;
  }) => (
    <div data-testid="vault-editor-stub">
      {Array.isArray(blocks) ? `${blocks.length} blocks` : "0 blocks"}
    </div>
  ),
}));

vi.mock("@/components/icon-picker", () => ({
  IconPicker: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (icon: string) => void;
  }) => (
    <button type="button" aria-label="Pick icon" onClick={() => onChange("⭐")}>
      {value}
    </button>
  ),
}));

function clearTemplates() {
  for (const t of loadCustomTemplates()) {
    removeCustomTemplate(t.id);
  }
}

describe("TemplateEditorDialog", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    localStorage.clear();
    clearTemplates();
  });

  it("does not render when closed", () => {
    render(<TemplateEditorDialog open={false} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("saves a new template from the form", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSaved = vi.fn();

    render(
      <TemplateEditorDialog open onClose={onClose} onSaved={onSaved} />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/sprint retro/i), "Daily standup");
    await user.type(
      screen.getByPlaceholderText(/short hint/i),
      "Quick morning sync",
    );
    await user.type(screen.getByPlaceholderText(/comma-separated/i), "work, team");
    await user.click(within(dialog).getByRole("button", { name: /save template/i }));

    expect(onSaved).toHaveBeenCalledWith("Daily standup");
    expect(onClose).toHaveBeenCalled();

    const stored = loadCustomTemplates();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      name: "Daily standup",
      description: "Quick morning sync",
      tags: ["work", "team"],
      custom: true,
    });
  });

  it("closes on Cancel", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<TemplateEditorDialog open onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
    expect(loadCustomTemplates()).toHaveLength(0);
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<TemplateEditorDialog open onClose={onClose} />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("saves with defaults and a picked icon when fields are empty", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();

    render(<TemplateEditorDialog open onClose={() => {}} onSaved={onSaved} />);

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /pick icon/i }));
    await user.click(within(dialog).getByRole("button", { name: /save template/i }));

    expect(onSaved).toHaveBeenCalledWith("Untitled template");
    expect(loadCustomTemplates()[0]).toMatchObject({
      name: "Untitled template",
      icon: "⭐",
      description: "Custom template",
      tags: [],
    });
  });
});
