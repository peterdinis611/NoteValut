"use client";

import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Extension } from "../create-extension";
import type { BlockRenderProps } from "../types";
import { useOwnerId } from "@/hooks/use-owner-id";

function QueryBlockView(props: BlockRenderProps) {
  const ownerId = useOwnerId();
  const queryText = props.block.text || props.block.label || "";
  const hits = useQuery(
    api.queries.run,
    ownerId && queryText.trim().length >= 2
      ? { ownerId, query: queryText, limit: 12 }
      : "skip",
  );

  return (
    <div className="nv-query-block">
      {!props.readOnly && (
        <input
          className="nv-query-input"
          placeholder="status:Todo tag:work prop:priority=High …"
          value={queryText}
          onChange={(e) =>
            props.commands.updateBlock(props.block.id, {
              text: e.target.value,
              label: e.target.value,
            })
          }
          onFocus={props.onFocus}
        />
      )}
      <div className="nv-query-head">
        <Search className="size-3.5" />
        <span>Query</span>
        {hits && <span className="nv-query-count">{hits.length}</span>}
      </div>
      {hits === undefined ? (
        <p className="nv-query-empty">Run a query…</p>
      ) : hits.length === 0 ? (
        <p className="nv-query-empty">No matches</p>
      ) : (
        <ul className="nv-query-list">
          {hits.map((h: { _id: Id<"notes">; icon: string; title: string; status?: string }) => (
            <li key={h._id}>
              <button
                type="button"
                onClick={() => props.onNavigate?.(h._id)}
              >
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
