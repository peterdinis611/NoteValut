import { mergeAttributes, Node, wrappingInputRule } from "@tiptap/core";

export type CalloutVariant = "info" | "tip" | "warning" | "danger";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { variant?: CalloutVariant }) => ReturnType;
      toggleCallout: (attrs?: { variant?: CalloutVariant }) => ReturnType;
      unsetCallout: () => ReturnType;
    };
  }
}

const VARIANT_EMOJI: Record<CalloutVariant, string> = {
  info: "ℹ️",
  tip: "💡",
  warning: "⚠️",
  danger: "🚨",
};

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      variant: {
        default: "info" satisfies CalloutVariant,
        parseHTML: (element) =>
          (element.getAttribute("data-callout") as CalloutVariant) || "info",
        renderHTML: (attributes) => ({
          "data-callout": attributes.variant,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "callout",
        class: "nv-editor-callout",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attrs) =>
        ({ commands }) =>
          commands.wrapIn(this.name, attrs),
      toggleCallout:
        (attrs) =>
        ({ commands }) =>
          commands.toggleWrap(this.name, attrs),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: /^::info\s$/,
        type: this.type,
        getAttributes: () => ({ variant: "info" }),
      }),
      wrappingInputRule({
        find: /^::tip\s$/,
        type: this.type,
        getAttributes: () => ({ variant: "tip" }),
      }),
      wrappingInputRule({
        find: /^::warn\s$/,
        type: this.type,
        getAttributes: () => ({ variant: "warning" }),
      }),
    ];
  },
});

export function insertCallout(
  editor: import("@tiptap/core").Editor,
  range: import("@tiptap/core").Range,
  variant: CalloutVariant,
) {
  const emoji = VARIANT_EMOJI[variant];
  editor
    .chain()
    .focus()
    .deleteRange(range)
    .insertContent({
      type: "callout",
      attrs: { variant },
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: `${emoji} ` }],
        },
      ],
    })
    .run();
}
