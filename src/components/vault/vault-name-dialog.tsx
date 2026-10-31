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
import {
  getPageTemplate,
  PAGE_TEMPLATES,
  type PageTemplateId,
} from "@/lib/vault/page-templates";
import { cn } from "cn";

export function VaultNameDialog({
  open,
  title,
  description,
  placeholder,
  confirmLabel,
  defaultValue = "",
  templates = false,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  placeholder: string;
  confirmLabel: string;
  defaultValue?: string;
  /** When true, show page template chips and pass templateId with the name. */
  templates?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    name: string,
    meta?: { templateId: PageTemplateId },
  ) => void;
}) {
  const [name, setName] = useState(defaultValue);
  const [templateId, setTemplateId] = useState<PageTemplateId>("blank");
  const [titleTouched, setTitleTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(defaultValue);
    setTemplateId("blank");
    setTitleTouched(false);
  }, [defaultValue, open]);

  const selectTemplate = (id: PageTemplateId) => {
    setTemplateId(id);
    const template = getPageTemplate(id);
    if (!titleTouched) {
      setName(template.suggestedTitle);
    }
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(
      trimmed,
      templates ? { templateId } : undefined,
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={templates ? "sm:max-w-lg" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {templates ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PAGE_TEMPLATES.map((template) => {
              const active = template.id === templateId;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => selectTemplate(template.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-primary/50 bg-accent text-accent-foreground"
                      : "border-border bg-card/60 text-foreground hover:bg-muted/70",
                  )}
                >
                  <span className="block text-sm font-medium tracking-tight">
                    {template.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                    {template.description}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        <Input
          autoFocus
          value={name}
          onChange={(event) => {
            setTitleTouched(true);
            setName(event.target.value);
          }}
          placeholder={placeholder}
          className="h-10 rounded-xl"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={!name.trim()}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
