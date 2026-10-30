import { Effect } from "effect";
import { requestPasswordRecovery } from "@/lib/auth/password-recovery";
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
  rateLimitedResponse,
  rateLimitPresets,
} from "@/lib/rate-limit";

type Body = {
  email?: string;
};

export async function POST(request: Request) {
  const limit = checkRateLimit(getClientIp(request), {
    name: "api:auth:forgot-password",
    ...rateLimitPresets.auth,
  });
  if (!limit.success) {
    return rateLimitedResponse(limit);
  }

  let payload: Body;
  try {
    payload = (await request.json()) as Body;
  } catch {
    return Response.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }

  const result = await Effect.runPromise(
    requestPasswordRecovery(payload.email ?? "").pipe(
      Effect.map((value) => ({ ok: true as const, value })),
      Effect.catch((error) =>
        Effect.succeed({
          ok: false as const,
          message:
            error && typeof error === "object" && "message" in error
              ? String((error as { message: unknown }).message)
              : "Could not start password recovery.",
        }),
      ),
    ),
  );

  if (!result.ok) {
    return Response.json(
      { error: result.message },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }

  return Response.json(
    { ok: true, message: result.value.message },
    { headers: rateLimitHeaders(limit) },
  );
}
