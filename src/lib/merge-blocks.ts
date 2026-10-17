import type { Block } from "@/lib/blocks";

/** Merge remote blocks with local dirty blocks (keep local for dirty ids). */
export function mergeRemoteBlocks(
  local: Block[],
  remote: Block[],
  dirtyIds: Set<string>,
): Block[] {
  if (!dirtyIds.size) return remote;
  const localById = new Map(local.map((b) => [b.id, b]));
  const remoteIds = new Set(remote.map((b) => b.id));
  const merged = remote.map((rb) =>
    dirtyIds.has(rb.id) && localById.has(rb.id) ? localById.get(rb.id)! : rb,
  );
  for (const lb of local) {
    if (dirtyIds.has(lb.id) && !remoteIds.has(lb.id)) merged.push(lb);
  }
  return merged;
}

/** Apply upserts/deletes/order onto a block list (LWW by id). */
export function applyBlockPatch(
  current: Block[],
  patch: {
    upserts?: Block[];
    deletes?: string[];
    order?: string[];
  },
): Block[] {
  const byId = new Map(current.map((b) => [b.id, b]));
  for (const id of patch.deletes ?? []) byId.delete(id);
  for (const b of patch.upserts ?? []) byId.set(b.id, b);

  if (patch.order?.length) {
    const ordered: Block[] = [];
    const seen = new Set<string>();
    for (const id of patch.order) {
      const b = byId.get(id);
      if (b) {
        ordered.push(b);
        seen.add(id);
      }
    }
    for (const [id, b] of byId) {
      if (!seen.has(id)) ordered.push(b);
    }
    return ordered;
  }

  // Keep prior order; append brand-new ids at end
  const next: Block[] = [];
  const seen = new Set<string>();
  for (const b of current) {
    if (!byId.has(b.id)) continue;
    next.push(byId.get(b.id)!);
    seen.add(b.id);
  }
  for (const [id, b] of byId) {
    if (!seen.has(id)) next.push(b);
  }
  return next;
}

/** Diff local vs baseline → upserts + deletes + order. */
export function diffBlocks(
  baseline: Block[],
  next: Block[],
): { upserts: Block[]; deletes: string[]; order: string[]; changed: boolean } {
  const baseById = new Map(baseline.map((b) => [b.id, b]));
  const nextIds = new Set(next.map((b) => b.id));
  const upserts: Block[] = [];
  for (const b of next) {
    const prev = baseById.get(b.id);
    if (!prev || JSON.stringify(prev) !== JSON.stringify(b)) upserts.push(b);
  }
  const deletes = baseline.map((b) => b.id).filter((id) => !nextIds.has(id));
  const order = next.map((b) => b.id);
  const orderChanged =
    baseline.length !== next.length ||
    baseline.some((b, i) => b.id !== next[i]?.id);
  return {
    upserts,
    deletes,
    order,
    changed: upserts.length > 0 || deletes.length > 0 || orderChanged,
  };
}
