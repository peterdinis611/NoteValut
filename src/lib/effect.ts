import { Effect } from "effect";

/** Run a sync Effect and surface tagged errors as thrown Error instances. */
export const runSync = <A, E extends { message: string }>(
  effect: Effect.Effect<A, E>,
): A =>
  Effect.runSync(
    effect.pipe(
      Effect.catch((error) =>
        Effect.die(new Error(error.message ?? String(error))),
      ),
    ),
  );

/** Run an async Effect and surface tagged errors as thrown Error instances. */
export const runPromise = <A, E extends { message: string }>(
  effect: Effect.Effect<A, E>,
): Promise<A> =>
  Effect.runPromise(
    effect.pipe(
      Effect.catch((error) =>
        Effect.die(new Error(error.message ?? String(error))),
      ),
    ),
  );
