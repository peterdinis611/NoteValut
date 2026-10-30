import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getAppwriteApiKey } from "@/lib/appwrite/env";

/** Password-reset links are valid for 30 minutes. */
export const RECOVERY_TTL_MS = 30 * 60 * 1000;

export const RECOVERY_PREF_KEY = "nvRecovery";

type RecoveryPref = {
  nonce: string;
  exp: number;
};

function recoverySecret(): string {
  return (
    process.env.AUTH_RECOVERY_SECRET?.trim() ||
    createHmac("sha256", "notevalut-recovery")
      .update(getAppwriteApiKey())
      .digest("hex")
  );
}

function sign(payload: string): string {
  return createHmac("sha256", recoverySecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createRecoverySecret(userId: string): {
  secret: string;
  pref: RecoveryPref;
} {
  const nonce = randomBytes(16).toString("base64url");
  const exp = Date.now() + RECOVERY_TTL_MS;
  const payload = `${userId}.${exp}.${nonce}`;
  const secret = `${exp}.${nonce}.${sign(payload)}`;
  return { secret, pref: { nonce, exp } };
}

export function verifyRecoverySecret(
  userId: string,
  secret: string,
  pref: RecoveryPref | null,
): { ok: true } | { ok: false; reason: "invalid" | "expired" | "used" } {
  const parts = secret.split(".");
  if (parts.length !== 3) return { ok: false, reason: "invalid" };

  const [expRaw, nonce, sig] = parts;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || !nonce || !sig) {
    return { ok: false, reason: "invalid" };
  }

  const expected = sign(`${userId}.${exp}.${nonce}`);
  if (!safeEqual(expected, sig)) return { ok: false, reason: "invalid" };

  if (Date.now() > exp) return { ok: false, reason: "expired" };

  if (!pref || pref.nonce !== nonce || pref.exp !== exp) {
    return { ok: false, reason: "used" };
  }

  if (Date.now() > pref.exp) return { ok: false, reason: "expired" };

  return { ok: true };
}

export function parseRecoveryPref(value: unknown): RecoveryPref | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const nonce = typeof record.nonce === "string" ? record.nonce : null;
  const exp = typeof record.exp === "number" ? record.exp : null;
  if (!nonce || exp == null || !Number.isFinite(exp)) return null;
  return { nonce, exp };
}

export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return "http://localhost:3000";
}

export function buildResetPasswordUrl(userId: string, secret: string): string {
  const url = new URL("/reset-password", getAppOrigin());
  url.searchParams.set("userId", userId);
  url.searchParams.set("secret", secret);
  return url.toString();
}
