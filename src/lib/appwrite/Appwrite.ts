import "server-only";

import { Context, Effect, Layer } from "effect";
import { createAppwriteServer } from "./server";
import { AppwriteError, AppwriteUnauthenticated } from "./errors";
import { AppwriteUser } from "./user";

const toAppwriteUser = (user: {
  $id: string;
  email: string;
  name: string;
}): AppwriteUser => ({
  id: user.$id,
  email: user.email || null,
  name: user.name,
});

/**
 * Server-only Appwrite seam for RSC / server actions.
 * Cookie session reads stay inside the layer — callers just use Effects.
 */
export class Appwrite extends Context.Service<
  Appwrite,
  {
    currentUser(): Effect.Effect<AppwriteUser | null, AppwriteError>;
    requireUser(): Effect.Effect<
      AppwriteUser,
      AppwriteError | AppwriteUnauthenticated
    >;
  }
>()("notevalut/lib/appwrite/Appwrite") {
  static readonly layer = Layer.effect(
    Appwrite,
    Effect.sync(() => {
      const helpers = createAppwriteServer();

      const currentUser = Effect.fn("Appwrite.currentUser")(function* () {
        const user = yield* Effect.tryPromise({
          try: () => helpers.getLoggedInUser(),
          catch: (cause) =>
            new AppwriteError({
              message: "Failed to load Appwrite session user.",
              cause,
            }),
        });

        return user ? toAppwriteUser(user) : null;
      });

      const requireUser = Effect.fn("Appwrite.requireUser")(function* () {
        const user = yield* currentUser();
        if (!user) {
          return yield* new AppwriteUnauthenticated({
            message: "Sign in required.",
          });
        }
        return user;
      });

      return Appwrite.of({ currentUser, requireUser });
    }),
  );
}

export type AppwriteService = Appwrite["Service"];
