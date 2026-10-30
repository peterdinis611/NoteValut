import { Schema } from "effect";

/** Slim account shape for server components / domain use. */
export const AppwriteUser = Schema.Struct({
  id: Schema.String,
  email: Schema.NullOr(Schema.String),
  name: Schema.String,
});

export type AppwriteUser = typeof AppwriteUser.Type;
