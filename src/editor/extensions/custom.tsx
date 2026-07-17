"use client";

import { Boxes, Plus } from "lucide-react";
import { useToast } from "@/components/toast";
import { Extension } from "../create-extension";
import {
  saveCustomBlockTemplate,
  type CustomBlockTemplate,
} from "../custom-blocks";
import type { BlockRenderProps } from "../types";
import { BlockTextInput } from "../components/block-text-input";

function CustomBlockView(props: BlockRenderProps) {
  const toast = useToast();
  const label = props.block.label || "Custom block";

  return (
    <div className="nv-custom">
      <div className="nv-custom-head">
        <Boxes className="size-3.5 text-accent" />
        <input
          className="nv-custom-label"
          value={label}
          readOnly={props.readOnly}
          placeholder="Block name"
          onChange={(e) =>
            props.commands.updateBlock(props.block.id, { label: e.target.value })
          }
          onFocus={props.onFocus}
        />
        {!props.readOnly && (
          <button
            type="button"
            className="nv-custom-save"
            title="Save to slash menu"
            onClick={() => {
              const template: CustomBlockTemplate = {
                id: crypto.randomUUID(),
                label: props.block.label?.trim() || "Custom block",
                description: "Saved custom block",
                icon: "✦",
                body: props.block.text,
              };
              saveCustomBlockTemplate(template);
              window.dispatchEvent(new Event("nv-custom-blocks-changed"));
              toast.success(`Saved “${template.label}” to slash menu`);
            }}
          >
            <Plus className="size-3.5" />
            Save
          </button>
        )}
      </div>
      <BlockTextInput
        block={props.block}
        readOnly={props.readOnly}
        className="nv-input nv-custom-body"
        placeholder="Write anything for this block…"
        rows={Math.max(2, props.block.text.split("\n").length)}
        onChange={props.onTextChange}
        onKeyDown={props.onKeyDown}
        onPaste={props.onPaste}
        onFocus={props.onFocus}
      />
    </div>
  );
}

export const CustomBlock = Extension({
  name: "custom",
  types: ["custom"],
  slashCommands: [
    {
      id: "custom",
      type: "custom",
      label: "Custom block",
      description: "Name it, write it, save it to Yours",
      icon: "✦",
      keywords: ["custom", "own", "template", "block", "yours"],
      group: "Yours",
    },
  ],
  render: (props) => <CustomBlockView {...props} />,
});
