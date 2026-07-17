import type { Extension } from "./types";

/** TipTap-style helper — define a NoteVault editor extension. */
export function Extension(config: Extension): Extension {
  return config;
}

export function mergeExtensions(extensions: Extension[]): Extension[] {
  const seen = new Set<string>();
  const result: Extension[] = [];
  for (const ext of extensions) {
    if (seen.has(ext.name)) {
      throw new Error(`Duplicate editor extension: ${ext.name}`);
    }
    seen.add(ext.name);
    result.push(ext);
  }
  return result;
}

export function getExtensionForType(
  extensions: Extension[],
  type: string,
): Extension | undefined {
  return extensions.find((ext) => ext.types?.includes(type as never));
}

export function collectSlashCommands(extensions: Extension[]) {
  return extensions.flatMap((ext) => ext.slashCommands ?? []);
}
