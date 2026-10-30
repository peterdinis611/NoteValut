import { Effect } from "effect";
import { Appwrite } from "@/lib/appwrite/Appwrite";

/** Load the signed-in Appwrite account for a server component (or null). */
export const getSessionAccount = Effect.fn("getSessionAccount")(function* () {
  const appwrite = yield* Appwrite;
  return yield* appwrite
    .currentUser()
    .pipe(Effect.catchTag("AppwriteError", () => Effect.succeed(null)));
});
