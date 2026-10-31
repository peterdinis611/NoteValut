"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { saveCustomTemplate } from "@/lib/vault/page-templates";

export function SaveTemplateDialog({
  open,
  onOpenChange,
  title,
  body,
  tags,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  tags?: readonly string[];
  onSaved?: () => void;
}) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLabel(title.trim() || "My template");
    setDescription("Saved from a vault page");
    setError(null);
  }, [open, title]);

  const submit = () => {
    try {
      saveCustomTemplate({
        label,
        description,
        suggestedTitle: title.trim() || label.trim(),
        tags: tags?.length ? [...tags] : ["custom"],
        body,
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save template.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Save as template
          </DialogTitle>
          <DialogDescription>
            Keep this page’s structure for new pages. Stored on this device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            autoFocus
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Template name"
            className="h-10 rounded-xl"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
          />
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Short description"
            className="min-h-20 rounded-xl"
          />
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={!label.trim()}>
            Save template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
