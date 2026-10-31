"use client";

import { Trash2 } from "lucide-react";
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
  deleteCustomTemplate,
  getPageTemplate,
  listPageTemplates,
  PAGE_TEMPLATES,
  type PageTemplate,
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
  initialTemplateId = "blank",
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
  initialTemplateId?: PageTemplateId;
  /** When true, show page template chips and pass templateId with the name. */
  templates?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    name: string,
    meta?: { templateId: PageTemplateId },
  ) => void;
}) {
  const [name, setName] = useState(defaultValue);
  const [templateId, setTemplateId] = useState<PageTemplateId>(initialTemplateId);
  const [titleTouched, setTitleTouched] = useState(false);
  const [catalog, setCatalog] = useState<PageTemplate[]>([...PAGE_TEMPLATES]);

  useEffect(() => {
    if (!open) return;
    const starter = getPageTemplate(initialTemplateId);
    setTemplateId(starter.id);
    setName(
      defaultValue && defaultValue !== "Untitled"
        ? defaultValue
        : starter.suggestedTitle,
    );
    setTitleTouched(false);
    setCatalog(listPageTemplates());
  }, [defaultValue, initialTemplateId, open]);

  const selectTemplate = (id: PageTemplateId) => {
    setTemplateId(id);
    const template = getPageTemplate(id);
    if (!titleTouched) {
      setName(template.suggestedTitle);
    }
  };

  const removeCustom = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    deleteCustomTemplate(id);
    const next = listPageTemplates();
    setCatalog(next);
    if (templateId === id) {
      setTemplateId("blank");
      if (!titleTouched) setName(getPageTemplate("blank").suggestedTitle);
    }
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed, templates ? { templateId } : undefined);
    onOpenChange(false);
  };

  const builtins = catalog.filter((template) => !template.custom);
  const customs = catalog.filter((template) => template.custom);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={templates ? "sm:max-w-lg" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {templates ? (
          <div className="max-h-[min(50vh,22rem)] space-y-3 overflow-y-auto pr-0.5">
            <TemplateGrid
              templates={builtins}
              activeId={templateId}
              onSelect={selectTemplate}
            />
            {customs.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  Yours
                </p>
                <TemplateGrid
                  templates={customs}
                  activeId={templateId}
                  onSelect={selectTemplate}
                  onDelete={removeCustom}
                />
              </div>
            ) : null}
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

function TemplateGrid({
  templates,
  activeId,
  onSelect,
  onDelete,
}: {
  templates: readonly PageTemplate[];
  activeId: PageTemplateId;
  onSelect: (id: PageTemplateId) => void;
  onDelete?: (id: string, event: React.MouseEvent) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {templates.map((template) => {
        const active = template.id === activeId;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={cn(
              "relative rounded-xl border px-3 py-2.5 text-left transition-colors",
              active
                ? "border-primary/50 bg-accent text-accent-foreground"
                : "border-border bg-card/60 text-foreground hover:bg-muted/70",
            )}
          >
            {onDelete && template.custom ? (
              <span
                role="button"
                tabIndex={0}
                aria-label={`Delete ${template.label}`}
                className="absolute top-1.5 right-1.5 rounded-md p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                onClick={(event) => onDelete(template.id, event)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onDelete(template.id, event as unknown as React.MouseEvent);
                  }
                }}
              >
                <Trash2 className="size-3" />
              </span>
            ) : null}
            <span className="block pr-5 text-sm font-medium tracking-tight">
              {template.label}
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
              {template.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
