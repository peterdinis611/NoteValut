export type CustomBlockTemplate = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  body?: string;
};

const STORAGE_KEY = "notevault.custom-blocks";

export function loadCustomBlockTemplates(): CustomBlockTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomBlockTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomBlockTemplate(template: CustomBlockTemplate) {
  const list = loadCustomBlockTemplates().filter(
    (t) => t.label.toLowerCase() !== template.label.toLowerCase(),
  );
  list.unshift(template);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 24)));
}

export function removeCustomBlockTemplate(id: string) {
  const list = loadCustomBlockTemplates().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
