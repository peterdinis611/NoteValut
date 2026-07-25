"use node";

import webpush from "web-push";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";

type PushResult = { sent: number };

/**
 * Send Web Push for a fired reminder.
 * Convex env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */
export const sendReminderPush = internalAction({
  args: {
    ownerId: v.string(),
    title: v.string(),
    body: v.string(),
    noteId: v.optional(v.string()),
    reminderId: v.string(),
  },
  handler: async (ctx, args): Promise<PushResult> => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT ?? "mailto:support@notevault.app";
    if (!publicKey || !privateKey) {
      console.warn("[push] VAPID keys not configured — skip");
      return { sent: 0 };
    }

    const subs = await ctx.runMutation(internal.push.loadSubsForOwner, {
      ownerId: args.ownerId,
    });
    if (!subs.length) return { sent: 0 };

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: args.noteId ? `/?note=${args.noteId}` : "/",
      tag: args.reminderId,
    });

    let sent = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        sent += 1;
      } catch (err: unknown) {
        const status =
          err && typeof err === "object" && "statusCode" in err
            ? Number((err as { statusCode: number }).statusCode)
            : 0;
        if (status === 404 || status === 410) {
          await ctx.runMutation(internal.push.removeEndpoint, {
            endpoint: sub.endpoint,
          });
        } else {
          console.warn("[push] send failed", err);
        }
      }
    }
    return { sent };
  },
});

/** Client-callable test ping from settings. */
export const sendTest = action({
  args: { ownerId: v.string() },
  handler: async (ctx, args): Promise<PushResult> => {
    await ctx.runMutation(internal.push.assertOwner, { ownerId: args.ownerId });
    return await ctx.runAction(internal.pushActions.sendReminderPush, {
      ownerId: args.ownerId,
      title: "NoteVault",
      body: "Push notifications are working.",
      reminderId: `test-${Date.now()}`,
    });
  },
});
