"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  CalendarDays,
  FileCode2,
  ImageIcon,
  KeyRound,
  Link2,
  Type,
  Wrench,
} from "lucide-react";
import type { Note } from "@/domain/note";
import type { CalendarEvent } from "@/domain/shelf";
import { Badge } from "@/components/ui/badge";
import { DayBriefWidget } from "./lab/day-brief-widget";
import { LabSection } from "./lab/lab-widget-shell";
import { LinksWidget } from "./lab/links-widget";
import { MarkdownWidget } from "./lab/markdown-widget";
import { PicsumWidget } from "./lab/picsum-widget";
import { TextWidget } from "./lab/text-widget";
import { UuidWidget } from "./lab/uuid-widget";
import { ScrollPane } from "./scroll-to-top";

const NAV = [
  { id: "day", label: "Day", icon: CalendarDays },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "copy", label: "Copy", icon: Type },
  { id: "markdown", label: "Markdown", icon: FileCode2 },
  { id: "ids", label: "IDs", icon: KeyRound },
  { id: "links", label: "Links", icon: Link2 },
] as const;

export function VaultLab({
  events,
  notes,
  onOpenNote,
}: {
  events: readonly CalendarEvent[];
  notes: readonly Note[];
  onOpenNote: (noteId: string) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-0 flex min-w-0 flex-1 flex-col overflow-hidden bg-background"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-55"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 50% 40% at 8% 0%, color-mix(in oklch, var(--primary) 12%, transparent), transparent 55%)",
        }}
      />

      <header className="relative z-10 border-b border-border px-6 py-5 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-foreground/55 uppercase">
              Developer helpers
            </p>
            <h1 className="mt-1 flex items-center gap-2.5 font-display text-3xl tracking-tight text-foreground md:text-4xl">
              <Wrench className="size-7 stroke-[1.5] text-foreground/70" />
              Lab
            </h1>
            <p className="mt-2 max-w-xl text-[14px] text-foreground/65">
              Small utilities for placeholders, fixtures, and design checks —
              kept out of the main vault product UI.
            </p>
          </div>
          <Badge
            variant="secondary"
            className="rounded-[6px] font-mono text-[11px]"
          >
            {NAV.length} widgets
          </Badge>
        </div>

        <nav className="mt-5 flex flex-wrap gap-1.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-[12px] text-foreground/75 transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="size-3.5" />
                {item.label}
              </a>
            );
          })}
        </nav>
      </header>

      <ScrollPane className="relative z-10 px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-12">
          <LabSection
            id="day"
            eyebrow="01 · Day"
            title="Day brief"
            description="One click for what matters on a day — calendar events, touched pages, and trash."
          >
            <DayBriefWidget
              events={events}
              notes={notes}
              onOpenNote={onOpenNote}
            />
          </LabSection>

          <LabSection
            id="media"
            eyebrow="02 · Media"
            title="Image placeholders"
            description="Pull frames from Lorem Picsum for covers, empty states, and layout mocks."
          >
            <PicsumWidget />
          </LabSection>

          <LabSection
            id="copy"
            eyebrow="03 · Copy"
            title="Text placeholders"
            description="Seeded lorem for page bodies, briefs, and paste tests."
          >
            <TextWidget />
          </LabSection>

          <LabSection
            id="markdown"
            eyebrow="04 · Markdown"
            title="Markdown playground"
            description="Live preview with TanStack Markdown — source on the left, rendered output on the right."
          >
            <MarkdownWidget />
          </LabSection>

          <LabSection
            id="ids"
            eyebrow="05 · IDs"
            title="UUID / ID factory"
            description="Batch NoteId-style UUIDs, short shelf codes, and Appwrite-friendly IDs for fixtures."
          >
            <UuidWidget />
          </LabSection>

          <LabSection
            id="links"
            eyebrow="06 · Links"
            title="Important links"
            description="Pin console, docs, and staging URLs — saved in this browser only."
          >
            <LinksWidget />
          </LabSection>
        </div>
      </ScrollPane>
    </motion.section>
  );
}
