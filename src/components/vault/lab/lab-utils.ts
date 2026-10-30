export function clampSize(value: number) {
  if (!Number.isFinite(value)) return 640;
  return Math.min(1600, Math.max(64, Math.round(value)));
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}

export function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed: string) {
  let state = hashSeed(seed) || 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
