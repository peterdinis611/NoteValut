function ref(name: string) {
  return Object.freeze({ _name: name });
}

/** Stable Convex API stubs for Storybook (mirrors app usage). */
export const api = {
  notes: {
    list: ref("notes:list"),
    listChildren: ref("notes:listChildren"),
    listTrashed: ref("notes:listTrashed"),
    listArchived: ref("notes:listArchived"),
    listTags: ref("notes:listTags"),
    listBacklinks: ref("notes:listBacklinks"),
    listDailyKeys: ref("notes:listDailyKeys"),
    get: ref("notes:get"),
    getBreadcrumbs: ref("notes:getBreadcrumbs"),
    getVaultStats: ref("notes:getVaultStats"),
    search: ref("notes:search"),
    exportVault: ref("notes:exportVault"),
    create: ref("notes:create"),
    update: ref("notes:update"),
    move: ref("notes:move"),
    trash: ref("notes:trash"),
    restoreFromTrash: ref("notes:restoreFromTrash"),
    emptyTrash: ref("notes:emptyTrash"),
    duplicate: ref("notes:duplicate"),
    bulkUpdate: ref("notes:bulkUpdate"),
    bulkTrash: ref("notes:bulkTrash"),
    bulkAddTag: ref("notes:bulkAddTag"),
    bulkRemoveTag: ref("notes:bulkRemoveTag"),
    renameTag: ref("notes:renameTag"),
    deleteTag: ref("notes:deleteTag"),
    getOrCreateDaily: ref("notes:getOrCreateDaily"),
    seedDemo: ref("notes:seedDemo"),
    importVault: ref("notes:importVault"),
    reindexSearch: ref("notes:reindexSearch"),
  },
  shares: {
    list: ref("shares:list"),
    create: ref("shares:create"),
    update: ref("shares:update"),
    remove: ref("shares:remove"),
    getSharedVault: ref("shares:getSharedVault"),
  },
  vaultSettings: {
    get: ref("vaultSettings:get"),
    update: ref("vaultSettings:update"),
  },
  versions: {
    listForNote: ref("versions:listForNote"),
    restore: ref("versions:restore"),
  },
  reminders: {
    listFired: ref("reminders:listFired"),
    listScheduledForKeys: ref("reminders:listScheduledForKeys"),
    schedule: ref("reminders:schedule"),
    cancel: ref("reminders:cancel"),
    dismiss: ref("reminders:dismiss"),
  },
  push: {
    getVapidPublicKey: ref("push:getVapidPublicKey"),
    listMine: ref("push:listMine"),
    subscribe: ref("push:subscribe"),
    unsubscribe: ref("push:unsubscribe"),
  },
  pushActions: {
    sendTest: ref("pushActions:sendTest"),
  },
  files: {
    generateUploadUrl: ref("files:generateUploadUrl"),
    resolveUrl: ref("files:resolveUrl"),
  },
};

export const internal = api;
export const components = {};
