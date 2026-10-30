import { Schema } from "effect";

export class AppwriteError extends Schema.TaggedError<AppwriteError>()(
  "AppwriteError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Defect()),
  },
) {}

export class AppwriteUnauthenticated extends Schema.TaggedError<AppwriteUnauthenticated>()(
  "AppwriteUnauthenticated",
  {
    message: Schema.String,
  },
) {}
