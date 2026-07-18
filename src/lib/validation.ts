import * as v from "valibot";

export const BlockTypeSchema = v.picklist([
  "paragraph",
  "heading1",
  "heading2",
  "heading3",
  "heading4",
  "heading5",
  "heading6",
  "bullet",
  "numbered",
  "todo",
  "quote",
  "code",
  "divider",
  "callout",
  "pagelink",
  "toggle",
  "image",
  "custom",
  "table",
  "video",
  "link",
]);

export const CalloutVariantSchema = v.picklist(["info", "tip", "warning"]);

export const BlockSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  type: BlockTypeSchema,
  text: v.string(),
  checked: v.optional(v.boolean()),
  calloutVariant: v.optional(CalloutVariantSchema),
  pageId: v.optional(v.string()),
  language: v.optional(v.string()),
  url: v.optional(v.string()),
  label: v.optional(v.string()),
  rows: v.optional(v.array(v.array(v.string()))),
  color: v.optional(v.string()),
  bgColor: v.optional(v.string()),
});

export const BlocksSchema = v.pipe(v.array(BlockSchema), v.minLength(1));

export const NoteTitleSchema = v.pipe(
  v.string(),
  v.maxLength(200, "Title is too long"),
);

export const TagSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(32),
  v.regex(/^[\p{L}\p{N}][\p{L}\p{N}\s_-]*$/u, "Use letters, numbers, spaces, - or _"),
);

export const TagsSchema = v.pipe(v.array(TagSchema), v.maxLength(24));

export const CoverImageSchema = v.pipe(
  v.string(),
  v.trim(),
  v.url("Enter a valid image URL"),
  v.maxLength(2000),
);

export const CustomBlockNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "Name is required"),
  v.maxLength(60, "Name is too long"),
);

export const CustomBlockContentSchema = v.pipe(
  v.string(),
  v.maxLength(20_000, "Content is too long"),
);

export const TemplateNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "Template name is required"),
  v.maxLength(60, "Name is too long"),
);

export function parseTemplateName(input: string) {
  return v.safeParse(TemplateNameSchema, input);
}

export type ValidBlock = v.InferOutput<typeof BlockSchema>;

export function parseBlocks(input: unknown) {
  return v.safeParse(BlocksSchema, input);
}

export function parseTags(input: unknown) {
  return v.safeParse(TagsSchema, input);
}

export function parseCoverImage(input: string) {
  return v.safeParse(CoverImageSchema, input);
}

export function parseCustomBlock(input: { label: string; body: string }) {
  return v.safeParse(
    v.object({
      label: CustomBlockNameSchema,
      body: CustomBlockContentSchema,
    }),
    input,
  );
}

export function firstIssue(result: { success: false; issues: v.BaseIssue<unknown>[] }) {
  return result.issues[0]?.message ?? "Invalid input";
}
