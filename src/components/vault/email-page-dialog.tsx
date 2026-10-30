"use client";

import { useUser } from "@appwrite.io/react";
import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import type { Note } from "@/domain/note";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function EmailPageDialog({
  open,
  onOpenChange,
  note,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note;
}) {
  const { user } = useUser();
  const [email, setEmail] = useState("");
  useEffect(() => {
    if (open && !email && user?.email) {
      setEmail(user.email);
    }
  }, [open, email, user?.email]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const send = async () => {
    setPending(true);
    setError(null);
    setSentTo(null);
    try {
      const response = await fetch("/api/vault/email-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId: note.id,
          title: note.title,
          body: note.body,
          recipientEmail: email,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        recipient?: string;
      };
      if (!response.ok) {
        setError(data.error || "Could not send email.");
        return;
      }
      setSentTo(data.recipient ?? email);
    } catch {
      setError("Network error while sending email.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setError(null);
          setSentTo(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email this page</DialogTitle>
          <DialogDescription>
            Sends “{note.title || "Untitled"}” via Appwrite Messaging. Recipient
            can be any email; NoteValut users are matched automatically.
          </DialogDescription>
        </DialogHeader>

        <label className="block space-y-1.5">
          <span className="text-[12px] text-muted-foreground">To</span>
          <Input
            type="email"
            autoComplete="email"
            placeholder="friend@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void send();
              }
            }}
          />
        </label>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not send</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {sentTo ? (
          <Alert>
            <AlertTitle>Sent</AlertTitle>
            <AlertDescription>
              Page emailed to {sentTo}. Check Messaging logs in the Appwrite
              Console if it doesn’t arrive.
            </AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            disabled={pending || !email.trim()}
            onClick={() => void send()}
          >
            <Mail data-icon="inline-start" />
            {pending ? "Sending…" : "Send email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
