"use client";

import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Extension } from "../create-extension";
import type { BlockRenderProps } from "../types";
import { useOwnerId } from "@/hooks/use-owner-id";

function QueryBlockView(props: BlockRenderProps) {
  const ownerId = useOwnerId();
  const saved = useQuery(api.queries.list, ownerId ? { ownerId } : "skip");
  const [useSavedId, setUseSavedId] = useState<Id<"savedQueries"> | "">("");

  const queryText = props.block.text || props.block.label || "";
  const savedIdFromBlock = (props.block.url as Id<"savedQueries"> | undefined) || undefined;
  const effectiveSaved = useSavedId || savedIdFromBlock;

  const result = useQuery(
    api.queries.run,
    ownerId && (effectiveSaved || queryText.trim().length >= 2)
      ? effectiveSaved
        ? { ownerId, savedId: effectiveSaved as Id<"savedQueries">, limit: 12 }
        : { ownerId, query: queryText, limit: 12 }
      : "skip",
  );

  const hits = result?.results;

  const selectedSaved = useMemo(
    () => (saved ?? []).find((s) => s._id === effectiveSaved),
    [saved, effectiveSaved],
  );

  return (
    <div className="nv-query-block">
      {!props.readOnly && (
        <>
          {(saved?.length ?? 0) > 0 ? (
            <select
              className="nv-query-input"
              value={effectiveSaved ?? ""}
              onChange={(e) => {
                const id = e.target.value as Id<"savedQueries"> | "";
                setUseSavedId(id);
                props.commands.updateBlock(props.block.id, {
                  url: id || undefined,
                  text: id ? "" : props.block.text,
                  label: id
                    ? (saved ?? []).find((s) => s._id === id)?.name
                    : props.block.label,
                });
              }}
            >
              <option value="">Custom query…</option>
              {(saved ?? []).map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : null}
          {!effectiveSaved ? (
            <input
              className="nv-query-input"
              placeholder="status:Todo due:week assignee:me prop:priority=High …"
              value={queryText}
              onChange={(e) =>
                props.commands.updateBlock(props.block.id, {
                  text: e.target.value,
                  label: e.target.value,
                  url: undefined,
                })
              }
              onFocus={props.onFocus}
            />
          ) : null}
        </>
      )}
      <div className="nv-query-head">
        <Search className="size-3.5" />
        <span>{selectedSaved?.name || "Query"}</span>
        {hits && <span className="nv-query-count">{hits.length}</span>}
      </div>
      {hits === undefined ? (
        <p className="nv-query-empty">Run a query…</p>
      ) : hits.length === 0 ? (
        <p className="nv-query-empty">No matches</p>
      ) : (
        <ul className="nv-query-list">
          {hits.map((h) => (
            <li key={h._id}>
              <button type="button" onClick={() => props.onNavigate?.(h._id)}>
                <span>{h.icon}</span>
                <span className="truncate">{h.title || "Untitled"}</span>
                {h.status ? <em>{h.status}</em> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const QueryBlock = Extension({
  name: "query",
  types: ["query"],
  atom: true,
  slashCommands: [
    {
      id: "query",
      type: "query",
      label: "Query",
      description: "Live Dataview-style search block",
      icon: "🔎",
      keywords: ["query", "dataview", "filter", "search", "database"],
      group: "Database",
      seedText: "status:Todo",
    },
  ],
  render: (props) => <QueryBlockView {...props} />,
});
