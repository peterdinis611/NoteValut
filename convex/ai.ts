import { v } from "convex/values";
import { action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { embedText } from "./lib/embed";

type NoteSnippet = {
  _id: Id<"notes">;
  title: string;
  icon: string;
  preview: string;
  tags: string[];
};

type ChatCite = { id: Id<"notes">; title: string; icon: string };
type ChatResult = { answer: string; cites: ChatCite[] };

/** Pull note snippets for RAG (internal). */
export const gatherNotes = internalQuery({
  args: {
    ownerId: v.string(),
    ids: v.optional(v.array(v.id("notes"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<NoteSnippet[]> => {
    if (args.ids?.length) {
      const out: NoteSnippet[] = [];
      for (const id of args.ids) {
        const n = await ctx.db.get(id);
        if (n && n.ownerId === args.ownerId && !n.trashed && n.kind !== "folder") {
          out.push({
            _id: n._id,
            title: n.title,
            icon: n.icon,
            preview: (n.searchText || n.content || "").slice(0, 600),
            tags: n.tags,
          });
        }
      }
      return out;
    }
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_owner_updated", (q) => q.eq("ownerId", args.ownerId))
      .order("desc")
      .take(args.limit ?? 80);
    return notes
      .filter((n) => !n.trashed && n.kind !== "folder")
      .map((n) => ({
        _id: n._id,
        title: n.title,
        icon: n.icon,
        preview: (n.searchText || n.content || "").slice(0, 600),
        tags: n.tags,
      }));
  },
});

function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  return dot / ((Math.sqrt(na) || 1) * (Math.sqrt(nb) || 1));
}

function summarize(text: string, maxSentences = 3): string {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40);
  if (!sentences.length) return text.slice(0, 280);
  return sentences.slice(0, maxSentences).join(" ");
}

/**
 * AI over vault — local RAG (embeddings) + extractive summary / link suggestions.
 * Uses OPENAI_API_KEY when present for generative answers; otherwise local extractive.
 */
export const chat = action({
  args: {
    ownerId: v.string(),
    message: v.string(),
    mode: v.optional(
      v.union(v.literal("chat"), v.literal("summary"), v.literal("links")),
    ),
    noteId: v.optional(v.id("notes")),
  },
  handler: async (ctx, args): Promise<ChatResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== args.ownerId) {
      throw new Error("Forbidden");
    }
    const mode = args.mode ?? "chat";
    const message = args.message.trim();
    if (!message && mode === "chat") {
      return { answer: "Ask something about your vault.", cites: [] };
    }

    const vector = embedText(message || "overview");
    let citeIds: Id<"notes">[] = [];
    try {
      const hits = await ctx.vectorSearch("notes", "by_embedding", {
        vector,
        limit: 8,
        filter: (f) => f.eq("ownerId", args.ownerId),
      });
      citeIds = hits.map((h) => h._id);
    } catch {
      citeIds = [];
    }

    const notes: NoteSnippet[] = await ctx.runQuery(internal.ai.gatherNotes, {
      ownerId: args.ownerId,
      ids: citeIds.length ? citeIds : args.noteId ? [args.noteId] : undefined,
      limit: 12,
    });

    if (mode === "summary") {
      const target = args.noteId
        ? (notes.find((n) => n._id === args.noteId) ?? notes[0])
        : notes[0];
      if (!target) return { answer: "No notes to summarize.", cites: [] };
      return {
        answer: summarize(target.preview || target.title, 4),
        cites: [{ id: target._id, title: target.title, icon: target.icon }],
      };
    }

    if (mode === "links") {
      const qVec = embedText(message || notes[0]?.title || "");
      const scored = notes
        .map((n) => ({
          n,
          score: cosine(qVec, embedText(`${n.title}\n${n.preview}`)),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
      const lines = scored.map(
        (s, i) => `${i + 1}. [[${s.n.title}]] — related (score ${s.score.toFixed(2)})`,
      );
      return {
        answer:
          lines.length > 0
            ? `Suggested links:\n${lines.join("\n")}`
            : "No link suggestions yet — add more notes.",
        cites: scored.map((s) => ({ id: s.n._id, title: s.n.title, icon: s.n.icon })),
      };
    }

    const context = notes
      .map((n, i) => `[${i + 1}] ${n.title}\n${n.preview}`)
      .join("\n\n");
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey && context) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.3,
            messages: [
              {
                role: "system",
                content:
                  "You answer questions about the user's NoteVault notes. Cite sources as [n]. Be concise.",
              },
              {
                role: "user",
                content: `Notes:\n${context}\n\nQuestion: ${message}`,
              },
            ],
          }),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const answer = json.choices?.[0]?.message?.content?.trim();
          if (answer) {
            return {
              answer,
              cites: notes.map((n) => ({ id: n._id, title: n.title, icon: n.icon })),
            };
          }
        }
      } catch {
        // fall through to extractive
      }
    }

    const best = notes[0];
    const answer = best
      ? `Based on “${best.title}”: ${summarize(best.preview, 2)}\n\n(Related: ${notes
          .slice(0, 3)
          .map((n) => n.title)
          .join(", ")})`
      : "I couldn’t find matching notes. Try rebuilding the semantic index in Settings.";
    return {
      answer,
      cites: notes.slice(0, 5).map((n) => ({ id: n._id, title: n.title, icon: n.icon })),
    };
  },
});
