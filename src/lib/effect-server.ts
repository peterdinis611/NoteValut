import "server-only";

import { connection } from "next/server";
import { Effect } from "effect";
import { Appwrite } from "@/lib/appwrite/Appwrite";

/**
 * Run an Effect in a Next.js server component / server action.
 * Provides the Appwrite session layer (cookie + Node SDK helpers).
 *
 * Awaits `connection()` first so Effect's internal clocks (Date.now) and
 * Appwrite session reads run at request time, not during prerender.
 */
export const runServer = async <A, E extends { message: string }>(
  effect: Effect.Effect<A, E, Appwrite>,
): Promise<A> => {
  await connection();

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(Appwrite.layer),
      Effect.catch((error) =>
        Effect.die(new Error(error.message ?? String(error))),
      ),
    ),
  );
};
