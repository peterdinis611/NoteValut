"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  CircleAlert,
  FilePlus2,
  FolderPlus,
  LayoutTemplate,
  Link2,
  Mail,
} from "lucide-react";
import { useState } from "react";
import type { Note } from "@/domain/note";
import { toSafePageUrl } from "@/lib/editor/safe-url";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmailPageDialog } from "./email-page-dialog";
import { NotionEditor } from "./editor/notion-editor";
import { PageLinks } from "./page-links";
import { SaveTemplateDialog } from "./save-template-dialog";
import { ScrollPane } from "./scroll-to-top";
import { VaultProfile } from "./vault-profile";

const ease = [0.22, 1, 0.36, 1] as const;

export function VaultEditor({
  note,
  notes = [],
  mark,
  error,
  saving,
  accountLabel,
  fontSize = "md",
  density = "comfortable",
  spellCheck = true,
  showLinkedNotes = true,
  onChange,
  onCreatePage,
  onCreateFolder,
  onOpenNote,
  onLinkNote,
  onUnlinkNote,
}: {
  note?: Note;
  notes?: readonly Note[];
  mark: string;
  error: string | null;
  saving: boolean;
  accountLabel?: string | null;
  fontSize?: "sm" | "md" | "lg";
  density?: "comfortable" | "compact";
  spellCheck?: boolean;
  showLinkedNotes?: boolean;
  onChange: (patch: {
    title?: string;
    body?: string;
    tags?: string[];
    linkedNoteIds?: string[];
  }) => void;
  onCreatePage?: () => void;
  onCreateFolder?: () => void;
  onOpenNote?: (noteId: string) => void;
  onLinkNote?: (targetId: string) => void;
  onUnlinkNote?: (targetId: string) => void;
}) {
  const titleClass =
    fontSize === "sm"
      ? "text-[34px] md:text-[40px]"
      : fontSize === "lg"
        ? "text-[48px] md:text-[56px]"
        : "text-[42px] md:text-[48px]";
  const reduceMotion = useReducedMotion();
  const [copiedSafeUrl, setCopiedSafeUrl] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);

  const copySafeUrl = async () => {
    if (!note) return;
    const url = toSafePageUrl({
      noteId: note.id,
      title: note.title || "Untitled",
    });
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSafeUrl(true);
      window.setTimeout(() => setCopiedSafeUrl(false), 1400);
    } catch {
      setCopiedSafeUrl(false);
    }
  };

  if (!note) {
    return (
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="relative mx-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
      >
        <header className="flex items-center justify-end px-6 pt-5 md:px-10">
          <VaultProfile accountLabel={accountLabel} />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
          <motion.div
            initial={reduceMotion ? false : { scale: 0.86, opacity: 0, rotate: -6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.55, ease }}
            className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-2xl ring-1 ring-primary/25"
          >
            📝
          </motion.div>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4, ease }}
            className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground"
          >
            Nothing open yet
          </motion.p>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.4, ease }}
            className="mt-2 max-w-sm text-sm leading-relaxed text-foreground/65"
          >
            Create a folder or page below — or use{" "}
            <span className="font-semibold text-foreground">+</span> in the
            sidebar — then start writing.
          </motion.p>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease }}
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
          >
            {onCreateFolder ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-border text-foreground transition-transform hover:-translate-y-0.5"
                onClick={onCreateFolder}
              >
                <FolderPlus data-icon="inline-start" />
                Create folder
              </Button>
            ) : null}
            {onCreatePage ? (
              <Button
                type="button"
                className="rounded-xl transition-transform hover:-translate-y-0.5"
                onClick={onCreatePage}
              >
                <FilePlus2 data-icon="inline-start" />
                Create page
              </Button>
            ) : null}
          </motion.div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      layout={false}
      className="relative mx-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
    >
        <header className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-2 md:px-10">
          <div className="flex min-w-0 items-center gap-2 text-[13px] text-muted-foreground">
            <motion.span
              key={mark}
              initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="text-base"
              aria-hidden
            >
              {mark}
            </motion.span>
            <span className="truncate font-medium text-foreground/80">
              {note.title || "Untitled"}
            </span>
            <AnimatePresence>
              {saving ? (
                <motion.span
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
                >
                  <Badge variant="secondary" className="text-[10px]">
                    Saving
                  </Badge>
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap items-center gap-1 text-[13px] text-muted-foreground">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => void copySafeUrl()}
                  />
                }
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={copiedSafeUrl ? "copied" : "idle"}
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                    className="inline-flex items-center gap-1.5"
                  >
                    {copiedSafeUrl ? (
                      <Check className="size-3.5 stroke-[1.5]" />
                    ) : (
                      <Link2 className="size-3.5 stroke-[1.5]" />
                    )}
                    {copiedSafeUrl ? "Copied" : "Safe URL"}
                  </motion.span>
                </AnimatePresence>
              </TooltipTrigger>
              <TooltipContent>
                Copy a URL-safe vault link from this page title
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setEmailOpen(true)}
                  />
                }
              >
                <Mail className="size-3.5 stroke-[1.5]" />
                Email
              </TooltipTrigger>
              <TooltipContent>
                Send this page via Appwrite Messaging
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setTemplateOpen(true)}
                  />
                }
              >
                <LayoutTemplate className="size-3.5 stroke-[1.5]" />
                {templateSaved ? "Saved" : "Template"}
              </TooltipTrigger>
              <TooltipContent>
                Save this page as a custom template
              </TooltipContent>
            </Tooltip>
            <VaultProfile accountLabel={accountLabel} />
          </div>
        </header>

        <EmailPageDialog
          open={emailOpen}
          onOpenChange={setEmailOpen}
          note={note}
        />
        <SaveTemplateDialog
          open={templateOpen}
          onOpenChange={setTemplateOpen}
          title={note.title}
          body={note.body}
          tags={note.tags}
          onSaved={() => {
            setTemplateSaved(true);
            window.setTimeout(() => setTemplateSaved(false), 1600);
          }}
        />

        <Separator className="bg-border" />

        <ScrollPane className="px-6 pb-24 md:px-10 md:pb-28">
          <div>
            <motion.div
              key={`title-${note.id}`}
              initial={reduceMotion ? false : { opacity: 0.55, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease }}
            >
              <Input
                value={note.title}
                onChange={(event) => onChange({ title: event.target.value })}
                onBlur={() => {
                  const trimmed = note.title.trim();
                  if (trimmed !== note.title) {
                    onChange({ title: trimmed || note.title });
                  }
                }}
                aria-label="Note title"
                className={`mt-4 h-auto border-0 bg-transparent px-0 font-display leading-[1.1] font-semibold tracking-[-0.03em] text-foreground shadow-none focus-visible:ring-0 ${titleClass}`}
                placeholder="Untitled"
              />
            </motion.div>

            <div className="mt-3 flex flex-wrap gap-2">
              <AnimatePresence initial={false}>
                {(note.tags ?? []).map((tag, index) => (
                  <motion.span
                    key={tag}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
                    transition={{ delay: reduceMotion ? 0 : index * 0.03 }}
                  >
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-accent text-accent-foreground hover:bg-accent/80"
                    >
                      #{tag}
                    </Badge>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            {showLinkedNotes && onLinkNote && onUnlinkNote && onOpenNote ? (
              <PageLinks
                note={note}
                candidates={notes}
                onLink={onLinkNote}
                onUnlink={onUnlinkNote}
                onOpen={onOpenNote}
              />
            ) : null}

            <NotionEditor
              noteId={note.id}
              content={note.body}
              spellCheck={spellCheck}
              className={
                density === "compact"
                  ? "mt-4 max-w-[44rem] [&_.nv-editor]:text-[0.95rem] [&_.nv-editor]:leading-relaxed"
                  : "mt-6 max-w-[44rem]"
              }
              onChange={(body) => onChange({ body })}
            />

            {error ? (
              <Alert variant="destructive" className="mt-4 max-w-[42rem]">
                <CircleAlert />
                <AlertTitle>Could not save</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <p className="mt-6 text-[11px] text-muted-foreground/60">
              {saving ? "Saving…" : "TipTap · type / for blocks"}
            </p>
          </div>
        </ScrollPane>
      </motion.section>
  );
}
