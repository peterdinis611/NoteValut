"use client";

import type { Block } from "@/lib/blocks";
import { blockToneStyle } from "@/lib/colors";
import { Extension } from "../create-extension";
import type { BlockRenderProps } from "../types";
import { BlockTextInput } from "../components/block-text-input";
import { CodeBlockView } from "../components/code-block-view";

function TextBlock({
  props,
  className,
  placeholder,
  tag = "textarea",
}: {
  props: BlockRenderProps;
  className: string;
  placeholder: string;
  tag?: "input" | "textarea";
}) {
  const { block, readOnly, onTextChange, onKeyDown, onPaste, onFocus } = props;
  return (
    <div
      className={`nv-block-inner ${className}`}
      style={blockToneStyle(block.color, block.bgColor)}
    >
      <BlockTextInput
        block={block}
        readOnly={readOnly}
        tag={tag}
        className={`nv-input ${className}`}
        placeholder={placeholder}
        onChange={onTextChange}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onFocus={onFocus}
      />
    </div>
  );
}

export const Paragraph = Extension({
  name: "paragraph",
  types: ["paragraph"],
  slashCommands: [
    {
      id: "paragraph",
      type: "paragraph",
      label: "Text",
      description: "Plain text block",
      icon: "¶",
      keywords: ["text", "paragraph", "p"],
      group: "Basic",
    },
    {
      id: "columns-2",
      type: "paragraph",
      label: "2 columns",
      description: "Side-by-side layout",
      icon: "▥",
      keywords: ["columns", "layout", "grid", "two"],
      group: "Layout",
    },
    {
      id: "columns-3",
      type: "paragraph",
      label: "3 columns",
      description: "Three-column layout",
      icon: "▦",
      keywords: ["columns", "layout", "grid", "three"],
      group: "Layout",
    },
  ],
  placeholder: () => "Type '/' for commands",
  render: (props) => (
    <TextBlock props={props} className="nv-paragraph" placeholder="Type '/' for commands" />
  ),
});

export const Heading1 = Extension({
  name: "heading1",
  types: ["heading1"],
  slashCommands: [
    {
      id: "heading1",
      type: "heading1",
      label: "Title",
      description: "Large heading",
      icon: "H1",
      keywords: ["h1", "title", "heading"],
      group: "Headings",
    },
  ],
  keyboardShortcuts: {
    "Mod-Alt-1": ({ block, commands }) => {
      commands.setBlockType(block.id, "heading1");
      return true;
    },
  },
  placeholder: () => "Title",
  inputTag: "input",
  render: (props) => (
    <TextBlock props={props} className="nv-h1" placeholder="Title" tag="input" />
  ),
});

export const Heading2 = Extension({
  name: "heading2",
  types: ["heading2"],
  slashCommands: [
    {
      id: "heading2",
      type: "heading2",
      label: "Heading 2",
      description: "Section heading",
      icon: "H2",
      keywords: ["h2", "section", "heading"],
      group: "Headings",
    },
  ],
  keyboardShortcuts: {
    "Mod-Alt-2": ({ block, commands }) => {
      commands.setBlockType(block.id, "heading2");
      return true;
    },
  },
  placeholder: () => "Heading 2",
  inputTag: "input",
  render: (props) => (
    <TextBlock props={props} className="nv-h2" placeholder="Heading 2" tag="input" />
  ),
});

export const Heading3 = Extension({
  name: "heading3",
  types: ["heading3"],
  slashCommands: [
    {
      id: "heading3",
      type: "heading3",
      label: "Heading 3",
      description: "Subsection heading",
      icon: "H3",
      keywords: ["h3", "subsection", "heading"],
      group: "Headings",
    },
  ],
  keyboardShortcuts: {
    "Mod-Alt-3": ({ block, commands }) => {
      commands.setBlockType(block.id, "heading3");
      return true;
    },
  },
  placeholder: () => "Heading 3",
  inputTag: "input",
  render: (props) => (
    <TextBlock props={props} className="nv-h3" placeholder="Heading 3" tag="input" />
  ),
});

export const Heading4 = Extension({
  name: "heading4",
  types: ["heading4"],
  slashCommands: [
    {
      id: "heading4",
      type: "heading4",
      label: "Heading 4",
      description: "Smaller heading",
      icon: "H4",
      keywords: ["h4", "heading"],
      group: "Headings",
    },
  ],
  keyboardShortcuts: {
    "Mod-Alt-4": ({ block, commands }) => {
      commands.setBlockType(block.id, "heading4");
      return true;
    },
  },
  placeholder: () => "Heading 4",
  inputTag: "input",
  render: (props) => (
    <TextBlock props={props} className="nv-h4" placeholder="Heading 4" tag="input" />
  ),
});

export const Heading5 = Extension({
  name: "heading5",
  types: ["heading5"],
  slashCommands: [
    {
      id: "heading5",
      type: "heading5",
      label: "Heading 5",
      description: "Fine heading",
      icon: "H5",
      keywords: ["h5", "heading"],
      group: "Headings",
    },
  ],
  keyboardShortcuts: {
    "Mod-Alt-5": ({ block, commands }) => {
      commands.setBlockType(block.id, "heading5");
      return true;
    },
  },
  placeholder: () => "Heading 5",
  inputTag: "input",
  render: (props) => (
    <TextBlock props={props} className="nv-h5" placeholder="Heading 5" tag="input" />
  ),
});

export const Heading6 = Extension({
  name: "heading6",
  types: ["heading6"],
  slashCommands: [
    {
      id: "heading6",
      type: "heading6",
      label: "Heading 6",
      description: "Smallest heading",
      icon: "H6",
      keywords: ["h6", "heading"],
      group: "Headings",
    },
  ],
  keyboardShortcuts: {
    "Mod-Alt-6": ({ block, commands }) => {
      commands.setBlockType(block.id, "heading6");
      return true;
    },
  },
  placeholder: () => "Heading 6",
  inputTag: "input",
  render: (props) => (
    <TextBlock props={props} className="nv-h6" placeholder="Heading 6" tag="input" />
  ),
});

export const BulletList = Extension({
  name: "bullet",
  types: ["bullet"],
  slashCommands: [
    {
      id: "bullet",
      type: "bullet",
      label: "List",
      description: "Bulleted list item",
      icon: "•",
      keywords: ["bullet", "list", "ul"],
      group: "Lists",
    },
  ],
  placeholder: () => "List item",
  render: (props) => (
    <div
      className="nv-block-inner nv-bullet-row"
      style={blockToneStyle(props.block.color, props.block.bgColor)}
    >
      <span className="nv-bullet-mark" aria-hidden>
        •
      </span>
      <BlockTextInput
        block={props.block}
        readOnly={props.readOnly}
        className="nv-input nv-bullet"
        placeholder="List item"
        onChange={props.onTextChange}
        onKeyDown={props.onKeyDown}
        onPaste={props.onPaste}
        onFocus={props.onFocus}
      />
    </div>
  ),
});

export const Todo = Extension({
  name: "todo",
  types: ["todo"],
  slashCommands: [
    {
      id: "todo",
      type: "todo",
      label: "Task",
      description: "Checkbox task",
      icon: "☐",
      keywords: ["todo", "task", "checkbox"],
      group: "Lists",
    },
  ],
  placeholder: () => "Task",
  render: (props) => {
    const due = props.block.dueAt;
    const overdue = !!due && !props.block.checked && due < Date.now();
    const dueValue = due ? new Date(due).toISOString().slice(0, 10) : "";
    return (
      <div
        className={`nv-block-inner nv-todo-row ${props.block.checked ? "nv-todo-done" : ""} ${overdue ? "nv-todo-overdue" : ""}`}
        style={blockToneStyle(props.block.color, props.block.bgColor)}
      >
        <input
          type="checkbox"
          className="nv-checkbox"
          checked={!!props.block.checked}
          disabled={props.readOnly}
          onChange={(e) =>
            props.commands.updateBlock(props.block.id, { checked: e.target.checked })
          }
        />
        <BlockTextInput
          block={props.block}
          readOnly={props.readOnly}
          className="nv-input nv-todo"
          placeholder="Task"
          onChange={props.onTextChange}
          onKeyDown={props.onKeyDown}
          onPaste={props.onPaste}
          onFocus={props.onFocus}
        />
        {!props.readOnly && (
          <input
            type="date"
            className="nv-todo-due"
            value={dueValue}
            title="Due date"
            aria-label="Due date"
            onChange={(e) => {
              const v = e.target.value;
              props.commands.updateBlock(props.block.id, {
                dueAt: v ? new Date(`${v}T12:00:00`).getTime() : undefined,
              });
            }}
          />
        )}
        {props.readOnly && due && (
          <span className={`nv-todo-due-label ${overdue ? "is-overdue" : ""}`}>
            {new Date(due).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
    );
  },
});

export const Quote = Extension({
  name: "quote",
  types: ["quote"],
  slashCommands: [
    {
      id: "quote",
      type: "quote",
      label: "Quote",
      description: "Highlighted quote",
      icon: "❝",
      keywords: ["quote", "blockquote"],
      group: "Basic",
    },
  ],
  placeholder: () => "Quote",
  render: (props) => (
    <TextBlock props={props} className="nv-quote" placeholder="Quote" />
  ),
});

export const Code = Extension({
  name: "code",
  types: ["code"],
  slashCommands: [
    {
      id: "code",
      type: "code",
      label: "Code",
      description: "Syntax-highlighted snippet",
      icon: "</>",
      keywords: ["code", "pre", "highlight", "syntax"],
      group: "Basic",
    },
  ],
  placeholder: () => "Code",
  render: (props) => <CodeBlockView {...props} />,
});

export function placeholderFor(block: Block, extPlaceholder?: (b: Block) => string) {
  return extPlaceholder?.(block) ?? "";
}
