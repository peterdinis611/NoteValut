"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { useToast } from "./toast";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type Props = { ownerId: string };

export function PushNotificationSettings({ ownerId }: Props) {
  const toast = useToast();
  const vapidKey = useQuery(api.push.getVapidPublicKey);
  const subs = useQuery(api.push.listMine, { ownerId });
  const subscribe = useMutation(api.push.subscribe);
  const unsubscribe = useMutation(api.push.unsubscribe);
  const sendTest = useAction(api.pushActions.sendTest);
  const [busy, setBusy] = useState(false);

  const enabled = (subs?.length ?? 0) > 0;
  const pushSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  async function enable() {
    if (!pushSupported) {
      toast.error("Push isn’t supported in this browser");
      return;
    }
    const key =
      vapidKey || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
    if (!key) {
      toast.error("VAPID public key missing — set VAPID_PUBLIC_KEY on Convex");
      return;
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
      }
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Invalid subscription");
      }
      await subscribe({
        ownerId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        userAgent: navigator.userAgent,
      });
      toast.success("Push reminders enabled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn’t enable push");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribe({ ownerId, endpoint: sub.endpoint });
        await sub.unsubscribe().catch(() => {});
      } else if (subs?.[0]) {
        await unsubscribe({ ownerId, endpoint: subs[0].endpoint });
      }
      toast.success("Push reminders disabled");
    } catch {
      toast.error("Couldn’t disable push");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    try {
      const res = await sendTest({ ownerId });
      if (res.sent === 0) {
        toast.error("No push sent — check VAPID keys / subscription");
      } else {
        toast.success(`Test push sent (${res.sent})`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test push failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-push-actions">
      {!pushSupported ? (
        <p className="settings-hint">This browser doesn’t support Web Push.</p>
      ) : (
        <>
          <button
            type="button"
            className="settings-btn"
            disabled={busy || vapidKey === undefined}
            onClick={() => void (enabled ? disable() : enable())}
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : enabled ? (
              <BellOff className="size-3.5" />
            ) : (
              <Bell className="size-3.5" />
            )}
            {enabled ? "Disable push" : "Enable push"}
          </button>
          {enabled && (
            <button
              type="button"
              className="settings-btn settings-btn-ghost"
              disabled={busy}
              onClick={() => void test()}
            >
              Send test
            </button>
          )}
          <span className="settings-hint">
            {enabled
              ? `${subs?.length ?? 0} device(s) subscribed`
              : vapidKey
                ? "Ready to subscribe"
                : "Set VAPID_PUBLIC_KEY on Convex to enable"}
          </span>
        </>
      )}
    </div>
  );
}
