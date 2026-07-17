"use client";

import { ArrowRight } from "lucide-react";
import { CALLOUT_STYLES } from "@/lib/blocks";
import { Extension } from "../create-extension";
import { BlockTextInput } from "../components/block-text-input";

export const Callout = Extension({
  name: "callout",
  types: ["callout"],
  slashCommands: [
    {
      id: "callout-info",
      type: "callout",
      label: "Info box",
      description: "Info callout",
      icon: "ℹ",
      keywords: ["callout", "info"],
      calloutVariant: "info",
      group: "Callouts",
    },
    {
      id: "callout-tip",
      type: "callout",
      label: "Tip box",
      description: "Helpful tip",
      icon: "💡",
      keywords: ["tip", "hint"],
      calloutVariant: "tip",
      group: "Callouts",
    },
    {
      id: "callout-warning",
      type: "callout",
      label: "Alert box",
      description: "Important warning",
      icon: "⚠",
      keywords: ["warning", "alert"],
      calloutVariant: "warning",
      group: "Callouts",
    },
  ],
  render: (props) => {
    const variant = props.block.calloutVariant ?? "info";
    const style = CALLOUT_STYLES[variant];
    return (
      <div className={`nv-callout ${style.class}`}>
        <span className="nv-callout-icon">{style.icon}</span>
        <BlockTextInput
          block={props.block}
          readOnly={props.readOnly}
          className="nv-input nv-callout-input"
          placeholder="Callout text…"
          onChange={props.onTextChange}
          onKeyDown={props.onKeyDown}
          onPaste={props.onPaste}
          onFocus={props.onFocus}
        />
      </div>
    );
  },
});

export const Divider = Extension({
  name: "divider",
  types: ["divider"],
  atom: true,
  slashCommands: [
    {
      id: "divider",
      type: "divider",
      label: "Divider",
      description: "Visual separator",
      icon: "—",
      keywords: ["divider", "line", "hr"],
      group: "Media",
    },
  ],
  render: () => (
    <div className="nv-divider-wrap">
      <hr className="nv-divider" />
    </div>
  ),
});

export const PageLink = Extension({
  name: "pagelink",
  types: ["pagelink"],
  atom: true,
  slashCommands: [
    {
      id: "pagelink",
      type: "pagelink",
      label: "Vault link",
      description: "Link to another entry",
      icon: "🔗",
      keywords: ["link", "page", "entry", "vault"],
      group: "Media",
    },
  ],
  render: (props) => {
    const linked = props.linkablePages.find((p) => p._id === props.block.pageId);
    return (
      <div className="nv-pagelink">
        <select
          className="nv-pagelink-select"
          disabled={props.readOnly}
          value={props.block.pageId ?? ""}
          onChange={(e) => {
            const page = props.linkablePages.find((p) => p._id === e.target.value);
            props.commands.updateBlock(props.block.id, {
              pageId: e.target.value || undefined,
              text: page?.title ?? props.block.text,
            });
          }}
          onFocus={props.onFocus}
        >
          <option value="">Select entry…</option>
          {props.linkablePages.map((p) => (
            <option key={p._id} value={p._id}>
              {p.icon} {p.title || "Untitled"}
            </option>
          ))}
        </select>
        {linked && props.onNavigate && (
          <button
            type="button"
            className="nv-pagelink-open"
            onClick={() => props.onNavigate?.(linked._id)}
          >
            <span>{linked.icon}</span>
            <span className="truncate">{linked.title || "Untitled"}</span>
            <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>
    );
  },
});
