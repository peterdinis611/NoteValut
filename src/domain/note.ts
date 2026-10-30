import { Effect, Schema } from "effect";
import { sanitizeEditorHtml } from "@/lib/editor/sanitize";
import { FolderId, WorkspaceId } from "./shelf";

export class NoteValidationError extends Schema.TaggedError<NoteValidationError>()(
  "NoteValidationError",
  {
    message: Schema.String,
  },
) {}

export const NoteId = Schema.String.pipe(Schema.brand("NoteId"));
export type NoteId = typeof NoteId.Type;

export const NoteTag = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(24),
);

export const Note = Schema.Struct({
  id: NoteId,
  workspaceId: WorkspaceId,
  folderId: Schema.NullOr(FolderId),
  title: Schema.NonEmptyString.check(Schema.isMaxLength(120)),
  body: Schema.String.check(Schema.isMaxLength(100_000)),
  tags: Schema.Array(NoteTag).check(Schema.isMaxLength(8)),
  /** Other page ids this note is connected to (same workspace). */
  linkedNoteIds: Schema.Array(NoteId).check(Schema.isMaxLength(12)),
  createdAt: Schema.Number,
  updatedAt: Schema.Number,
  /** Soft-delete timestamp; null means active. */
  deletedAt: Schema.NullOr(Schema.Number),
});
export type Note = typeof Note.Type;

export const CreateNoteInput = Schema.Struct({
  workspaceId: WorkspaceId,
  folderId: Schema.optional(Schema.NullOr(FolderId)),
  title: Schema.String,
  body: Schema.String,
  tags: Schema.optional(Schema.Array(Schema.String)),
});

export type CreateNoteInput = typeof CreateNoteInput.Type;

export const UpdateNoteInput = Schema.Struct({
  id: NoteId,
  title: Schema.String,
  body: Schema.String,
  tags: Schema.optional(Schema.Array(Schema.String)),
  linkedNoteIds: Schema.optional(Schema.Array(Schema.String)),
  folderId: Schema.optional(Schema.NullOr(FolderId)),
});

export type UpdateNoteInput = typeof UpdateNoteInput.Type;

const normalizeTags = (tags: readonly string[] | undefined) =>
  (tags ?? [])
    .map((tag) => tag.trim().replace(/^#/, "").toLowerCase())
    .filter(Boolean)
    .slice(0, 8);

const normalizeLinkedIds = (
  ids: readonly string[] | undefined,
  selfId?: string,
) =>
  [...new Set((ids ?? []).map((id) => id.trim()).filter(Boolean))]
    .filter((id) => id !== selfId)
    .slice(0, 12);

export const createNote = Effect.fn("createNote")(function* (
  input: CreateNoteInput,
) {
  const title = input.title.trim();
  const body = sanitizeEditorHtml(input.body.trim());
  const tags = normalizeTags(input.tags);

  if (title.length === 0) {
    return yield* new NoteValidationError({
      message: "Title cannot be empty.",
    });
  }

  if (title.length > 120) {
    return yield* new NoteValidationError({
      message: "Title must be 120 characters or fewer.",
    });
  }

  if (body.length > 100_000) {
    return yield* new NoteValidationError({
      message: "Body must be 100,000 characters or fewer.",
    });
  }

  const now = Date.now();

  return yield* Schema.decodeUnknownEffect(Note)({
    id: crypto.randomUUID(),
    workspaceId: input.workspaceId,
    folderId: input.folderId ?? null,
    title,
    body,
    tags,
    linkedNoteIds: [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }).pipe(
    Effect.mapError(
      () =>
        new NoteValidationError({
          message: "Could not create a valid note.",
        }),
    ),
  );
});

export const updateNote = Effect.fn("updateNote")(function* (
  input: UpdateNoteInput,
  existing: Note,
) {
  const title = input.title.trim();
  const body = sanitizeEditorHtml(input.body.trim());
  const tags = normalizeTags(input.tags ?? existing.tags);
  const linkedNoteIds = normalizeLinkedIds(
    input.linkedNoteIds ?? existing.linkedNoteIds,
    existing.id,
  );

  if (title.length === 0) {
    return yield* new NoteValidationError({
      message: "Title cannot be empty.",
    });
  }

  if (title.length > 120) {
    return yield* new NoteValidationError({
      message: "Title must be 120 characters or fewer.",
    });
  }

  if (body.length > 100_000) {
    return yield* new NoteValidationError({
      message: "Body must be 100,000 characters or fewer.",
    });
  }

  return yield* Schema.decodeUnknownEffect(Note)({
    ...existing,
    title,
    body,
    tags,
    linkedNoteIds,
    folderId:
      input.folderId === undefined ? existing.folderId : input.folderId,
    updatedAt: Date.now(),
    deletedAt: existing.deletedAt ?? null,
  }).pipe(
    Effect.mapError(
      () =>
        new NoteValidationError({
          message: "Could not update the note.",
        }),
    ),
  );
});

export const softDeleteNote = Effect.fn("softDeleteNote")(function* (
  existing: Note,
) {
  return yield* Schema.decodeUnknownEffect(Note)({
    ...existing,
    deletedAt: Date.now(),
    updatedAt: Date.now(),
  }).pipe(
    Effect.mapError(
      () =>
        new NoteValidationError({
          message: "Could not move note to trash.",
        }),
    ),
  );
});

export const restoreNote = Effect.fn("restoreNote")(function* (existing: Note) {
  return yield* Schema.decodeUnknownEffect(Note)({
    ...existing,
    deletedAt: null,
    updatedAt: Date.now(),
  }).pipe(
    Effect.mapError(
      () =>
        new NoteValidationError({
          message: "Could not restore note.",
        }),
    ),
  );
});

export const summarizeNotes = (notes: readonly Note[]) =>
  Effect.succeed({
    count: notes.length,
    words: notes.reduce((total, note) => {
      const plain = note.body
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .trim();
      return total + plain.split(/\s+/).filter(Boolean).length;
    }, 0),
  });
