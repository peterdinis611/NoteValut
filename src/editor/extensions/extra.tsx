"use client";

import { ChevronDown, ChevronRight, ImageIcon } from "lucide-react";
import { blockToneStyle } from "@/lib/colors";
import { Extension } from "../create-extension";
import { BlockTextInput } from "../components/block-text-input";

export const NumberedList = Extension({
  name: "numbered",
  types: ["numbered"],
  slashCommands: [
    {
      id: "numbered",
      type: "numbered",
      label: "Numbered list",
      description: "Ordered list item",
      icon: "1.",
      keywords: ["numbered", "ordered", "ol", "list"],
      group: "Lists",
    },
  ],
  placeholder: () => "List item",
  render: (props) => {
    const number = numberedIndex(props);
    return (
      <div
        className="nv-block-inner nv-bullet-row"
        style={blockToneStyle(props.block.color, props.block.bgColor)}
      >
        <span className="nv-number-mark" aria-hidden>
          {number}.
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
    );
  },
});

function numberedIndex(props: {
  index: number;
  commands: { getBlocks: () => { type: string }[] };
}) {
  const blocks = props.commands.getBlocks();
  let n = 1;
  for (let i = props.index - 1; i >= 0; i--) {
    if (blocks[i]?.type !== "numbered") break;
    n += 1;
  }
  return n;
}

export const Toggle = Extension({
  name: "toggle",
  types: ["toggle"],
  slashCommands: [
    {
      id: "toggle",
      type: "toggle",
      label: "Toggle",
      description: "Collapsible section",
      icon: "▸",
      keywords: ["toggle", "collapse", "disclosure", "spoiler"],
      group: "Media",
    },
  ],
  render: (props) => {
    const open = props.block.checked !== false;
    const [title, ...rest] = props.block.text.split("\n");
    const body = rest.join("\n");

    return (
      <div className="nv-toggle" style={blockToneStyle(props.block.color, props.block.bgColor)}>
        <button
          type="button"
          className="nv-toggle-head"
          onClick={() =>
            !props.readOnly &&
            props.commands.updateBlock(props.block.id, { checked: !open })
          }
        >
          {open ? (
            <ChevronDown className="size-4 text-muted" />
          ) : (
            <ChevronRight className="size-4 text-muted" />
          )}
          <input
            data-block-id={props.block.id}
            className="nv-input nv-toggle-title"
            value={title}
            readOnly={props.readOnly}
            placeholder="Toggle title"
            onChange={(e) => {
              const next = body ? `${e.target.value}\n${body}` : e.target.value;
              props.onTextChange(next);
            }}
            onKeyDown={props.onKeyDown}
            onFocus={props.onFocus}
            onClick={(e) => e.stopPropagation()}
          />
        </button>
        {open && (
          <div className="nv-toggle-body">
            <textarea
              className="nv-input nv-toggle-content"
              value={body}
              readOnly={props.readOnly}
              rows={Math.max(2, body.split("\n").length)}
              placeholder="Hidden content…"
              onChange={(e) => props.onTextChange(`${title}\n${e.target.value}`)}
              onKeyDown={props.onKeyDown}
              onFocus={props.onFocus}
            />
          </div>
        )}
      </div>
    );
  },
});

export const ImageBlock = Extension({
  name: "image",
  types: ["image"],
  atom: true,
  slashCommands: [
    {
      id: "image",
      type: "image",
      label: "Image",
      description: "Embed an image by URL",
      icon: "🖼",
      keywords: ["image", "img", "photo", "picture"],
      group: "Media",
    },
  ],
  render: (props) => (
    <div className="nv-image">
      {!props.readOnly && (
        <div className="nv-image-fields">
          <input
            className="nv-image-url"
            placeholder="https://… image URL"
            value={props.block.url ?? ""}
            onChange={(e) =>
              props.commands.updateBlock(props.block.id, { url: e.target.value })
            }
            onFocus={props.onFocus}
          />
          <input
            className="nv-image-alt"
            placeholder="Alt text"
            value={props.block.text}
            onChange={(e) => props.onTextChange(e.target.value)}
            onFocus={props.onFocus}
          />
        </div>
      )}
      {props.block.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={props.block.url}
          alt={props.block.text || "Image"}
          className="nv-image-preview"
        />
      ) : (
        <div className="nv-image-empty">
          <ImageIcon className="size-5" />
          <span>Paste an image URL</span>
        </div>
      )}
    </div>
  ),
});
