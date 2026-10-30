import { Effect, Schema } from "effect";

export class ShelfValidationError extends Schema.TaggedError<ShelfValidationError>()(
  "ShelfValidationError",
  {
    message: Schema.String,
  },
) {}

export const WorkspaceId = Schema.String.pipe(Schema.brand("WorkspaceId"));
export type WorkspaceId = typeof WorkspaceId.Type;

export const FolderId = Schema.String.pipe(Schema.brand("FolderId"));
export type FolderId = typeof FolderId.Type;

export const CalendarEventId = Schema.String.pipe(
  Schema.brand("CalendarEventId"),
);
export type CalendarEventId = typeof CalendarEventId.Type;

export const Workspace = Schema.Struct({
  id: WorkspaceId,
  name: Schema.NonEmptyString.check(Schema.isMaxLength(80)),
  emoji: Schema.String.check(Schema.isMaxLength(8)),
  createdAt: Schema.Number,
});
export type Workspace = typeof Workspace.Type;

export const Folder = Schema.Struct({
  id: FolderId,
  workspaceId: WorkspaceId,
  name: Schema.NonEmptyString.check(Schema.isMaxLength(80)),
  emoji: Schema.String.check(Schema.isMaxLength(8)),
  createdAt: Schema.Number,
  /** Soft-delete timestamp; null means active. */
  deletedAt: Schema.NullOr(Schema.Number),
});
export type Folder = typeof Folder.Type;

/** Visual priority / category for calendar chips. */
export const EventTone = Schema.Literals([
  "normal",
  "focus",
  "urgent",
  "calm",
]);
export type EventTone = typeof EventTone.Type;

export const CalendarEvent = Schema.Struct({
  id: CalendarEventId,
  workspaceId: WorkspaceId,
  title: Schema.NonEmptyString.check(Schema.isMaxLength(120)),
  /** Local calendar day as YYYY-MM-DD */
  day: Schema.String.check(Schema.isMaxLength(10)),
  noteId: Schema.NullOr(Schema.String),
  tone: EventTone,
  createdAt: Schema.Number,
});
export type CalendarEvent = typeof CalendarEvent.Type;

export const createWorkspace = Effect.fn("createWorkspace")(function* (input: {
  name: string;
  emoji?: string;
}) {
  const name = input.name.trim();
  if (!name) {
    return yield* new ShelfValidationError({
      message: "Workspace name cannot be empty.",
    });
  }
  if (name.length > 80) {
    return yield* new ShelfValidationError({
      message: "Workspace name must be 80 characters or fewer.",
    });
  }

  return yield* Schema.decodeUnknownEffect(Workspace)({
    id: crypto.randomUUID(),
    name,
    emoji: (input.emoji ?? "🗂").slice(0, 8),
    createdAt: Date.now(),
  }).pipe(
    Effect.mapError(
      () =>
        new ShelfValidationError({
          message: "Could not create workspace.",
        }),
    ),
  );
});

export const createFolder = Effect.fn("createFolder")(function* (input: {
  workspaceId: WorkspaceId;
  name: string;
  emoji?: string;
}) {
  const name = input.name.trim();
  if (!name) {
    return yield* new ShelfValidationError({
      message: "Folder name cannot be empty.",
    });
  }

  return yield* Schema.decodeUnknownEffect(Folder)({
    id: crypto.randomUUID(),
    workspaceId: input.workspaceId,
    name,
    emoji: (input.emoji ?? "📁").slice(0, 8),
    createdAt: Date.now(),
    deletedAt: null,
  }).pipe(
    Effect.mapError(
      () =>
        new ShelfValidationError({
          message: "Could not create folder.",
        }),
    ),
  );
});

export const softDeleteFolder = Effect.fn("softDeleteFolder")(function* (
  existing: Folder,
) {
  return yield* Schema.decodeUnknownEffect(Folder)({
    ...existing,
    deletedAt: Date.now(),
  }).pipe(
    Effect.mapError(
      () =>
        new ShelfValidationError({
          message: "Could not move folder to trash.",
        }),
    ),
  );
});

export const restoreFolder = Effect.fn("restoreFolder")(function* (
  existing: Folder,
) {
  return yield* Schema.decodeUnknownEffect(Folder)({
    ...existing,
    deletedAt: null,
  }).pipe(
    Effect.mapError(
      () =>
        new ShelfValidationError({
          message: "Could not restore folder.",
        }),
    ),
  );
});

export const createCalendarEvent = Effect.fn("createCalendarEvent")(
  function* (input: {
    workspaceId: WorkspaceId;
    title: string;
    day: string;
    noteId?: string | null;
    tone?: EventTone;
  }) {
    const title = input.title.trim();
    if (!title) {
      return yield* new ShelfValidationError({
        message: "Event title cannot be empty.",
      });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.day)) {
      return yield* new ShelfValidationError({
        message: "Event day must be YYYY-MM-DD.",
      });
    }

    return yield* Schema.decodeUnknownEffect(CalendarEvent)({
      id: crypto.randomUUID(),
      workspaceId: input.workspaceId,
      title,
      day: input.day,
      noteId: input.noteId ?? null,
      tone: input.tone ?? "normal",
      createdAt: Date.now(),
    }).pipe(
      Effect.mapError(
        () =>
          new ShelfValidationError({
            message: "Could not create calendar event.",
          }),
      ),
    );
  },
);
