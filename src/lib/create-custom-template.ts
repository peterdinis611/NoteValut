import { saveCustomTemplate } from "@/db/templates-collection";
import { defaultBlocks, type Block } from "@/lib/blocks";
import { normalizeTags } from "@/lib/tags";
import { firstIssue, parseBlocks, parseTemplateName } from "@/lib/validation";

export type CreateCustomTemplateInput = {
  name: string;
  icon?: string;
  description?: string;
  /** Comma-separated tag draft from the create form */
  tagsDraft?: string;
  tags?: string[];
  blocks: Block[];
  id?: string;
};

export type CreateCustomTemplateResult =
  | { success: true; name: string; id: string }
  | { success: false; error: string };

function tagsFromInput(input: CreateCustomTemplateInput): string[] {
  if (input.tags) {
    const result = normalizeTags(input.tags);
    return result.success ? result.tags : [];
  }
  if (!input.tagsDraft?.trim()) return [];
  const result = normalizeTags(
    input.tagsDraft
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  );
  return result.success ? result.tags : [];
}

/**
 * Validate and persist a custom page template (Settings “New template” / Save as template).
 */
export function createCustomTemplate(
  input: CreateCustomTemplateInput,
): CreateCustomTemplateResult {
  const nameResult = parseTemplateName(input.name.trim() || "Untitled template");
  if (!nameResult.success) {
    return { success: false, error: firstIssue(nameResult) };
  }

  const blocksResult = parseBlocks(input.blocks.length ? input.blocks : defaultBlocks());
  if (!blocksResult.success) {
    return { success: false, error: firstIssue(blocksResult) };
  }

  const id = input.id ?? `custom-${crypto.randomUUID()}`;
  const name = nameResult.output;

  saveCustomTemplate({
    id,
    name,
    icon: input.icon?.trim() || "✦",
    description: input.description?.trim() || "Custom template",
    tags: tagsFromInput(input),
    blocks: blocksResult.output.map((b) => ({
      ...b,
      id: crypto.randomUUID(),
      rows: b.rows?.map((row) => [...row]),
    })),
  });

  return { success: true, name, id };
}
