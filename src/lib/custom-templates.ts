/** Re-export TanStack DB template helpers (no raw localStorage API). */
export {
  type CustomPageTemplate,
  getCustomTemplate,
  loadCustomTemplates,
  migrateLegacyTemplates,
  removeCustomTemplate,
  saveCustomTemplate,
  templatesCollection,
} from "@/db/templates-collection";
