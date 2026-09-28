"use client";

import { useMutation, useQuery } from "convex/react";
import { Building2, Filter, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useToast } from "./toast";

type Props = { ownerId: string };

export function SettingsWorkspaces({ ownerId }: Props) {
  const toast = useToast();
  const workspaces = useQuery(api.workspaces.listForUser, { ownerId });
  const vaultRemote = useQuery(api.vaultSettings.get, { ownerId });
  const ensurePersonal = useMutation(api.workspaces.ensurePersonal);
  const linkOrg = useMutation(api.workspaces.linkOrg);
  const setActive = useMutation(api.workspaces.setActive);
  const [orgId, setOrgId] = useState("");
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    void ensurePersonal({ ownerId }).catch(() => undefined);
  }, [ownerId, ensurePersonal]);

  const activeId = vaultRemote?.activeWorkspaceId ?? ownerId;

  return (
    <section className="settings-section">
      <div className="settings-section-head">
        <Building2 className="size-4 text-accent" />
        <div>
          <h2>Workspaces</h2>
          <p>Personal vault + Clerk org team vaults (foundation)</p>
        </div>
      </div>
      <ul className="settings-template-list">
        {(workspaces ?? []).map((ws) => (
          <li key={ws.workspaceId} className="settings-template-row">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{ws.name}</span>
              <span className="block truncate text-xs text-muted">
                {ws.kind} · {ws.role}
                {ws.orgId ? ` · ${ws.orgId}` : ""}
              </span>
            </span>
            {activeId === ws.workspaceId ? (
              <span className="settings-template-badge">Active</span>
            ) : (
              <button
                type="button"
                className="settings-btn settings-btn-ghost"
                onClick={() =>
                  void setActive({ ownerId, workspaceId: ws.workspaceId }).then(
                    () => toast.success(`Switched to ${ws.name}`),
                    () => toast.error("Couldn’t switch workspace"),
                  )
                }
              >
                Switch
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="settings-inbox-form">
        <input
          className="settings-input"
          placeholder="Clerk org ID"
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
        />
        <input
          className="settings-input"
          placeholder="Team name"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
        />
        <button
          type="button"
          className="settings-btn"
          disabled={!orgId.trim()}
          onClick={() => {
            void linkOrg({
              ownerId,
              orgId: orgId.trim(),
              name: orgName.trim() || "Team",
            }).then(
              () => {
                toast.success("Team workspace linked");
                setOrgId("");
                setOrgName("");
              },
              () => toast.error("Couldn’t link org"),
            );
          }}
        >
          Link Clerk org
        </button>
      </div>
      <p className="settings-hint">
        Team notes are partitioned by <code>workspaceId</code>. Full org ACL lands next.
      </p>
    </section>
  );
}

export function SettingsInboxRules({ ownerId }: Props) {
  const toast = useToast();
  const rules = useQuery(api.inboxRules.list, { ownerId });
  const folders = useQuery(api.notes.list, { ownerId });
  const upsert = useMutation(api.inboxRules.upsert);
  const remove = useMutation(api.inboxRules.remove);

  const [name, setName] = useState("Capture → triage");
  const [matchType, setMatchType] = useState<"always" | "titleContains" | "hasTag">("hasTag");
  const [matchValue, setMatchValue] = useState("capture");
  const [addTags, setAddTags] = useState("inbox");
  const [setStatus, setSetStatus] = useState("Todo");
  const [moveTo, setMoveTo] = useState<string>("");
  const [remindHours, setRemindHours] = useState("");

  const collections =
    folders?.filter((n) => n.kind === "folder" && !n.trashed && !n.archived) ?? [];

  async function handleAdd() {
    try {
      await upsert({
        ownerId,
        name,
        enabled: true,
        matchType,
        matchValue: matchType === "always" ? undefined : matchValue,
        addTags: addTags
          .split(/[,\s]+/)
          .map((t) => t.trim())
          .filter(Boolean),
        setStatus: setStatus || undefined,
        moveToFolderId: moveTo ? (moveTo as Id<"notes">) : undefined,
        remindInHours: remindHours ? Number(remindHours) : undefined,
      });
      toast.success("Inbox rule saved");
    } catch {
      toast.error("Couldn’t save rule");
    }
  }

  return (
    <section className="settings-section">
      <div className="settings-section-head">
        <Filter className="size-4 text-accent" />
        <div>
          <h2>Inbox rules</h2>
          <p>Auto-tag, move, status, and remind on quick capture</p>
        </div>
      </div>

      {rules === undefined ? (
        <p className="settings-empty">Loading…</p>
      ) : rules.length === 0 ? (
        <p className="settings-empty">No rules yet — captures stay as tagged.</p>
      ) : (
        <ul className="settings-template-list">
          {rules
            .slice()
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((rule) => (
              <li key={rule._id} className="settings-template-row">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {rule.enabled ? "" : "(off) "}
                    {rule.name}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {rule.matchType}
                    {rule.matchValue ? `: ${rule.matchValue}` : ""}
                    {rule.addTags?.length ? ` · +${rule.addTags.join(",")}` : ""}
                    {rule.setStatus ? ` · ${rule.setStatus}` : ""}
                    {rule.remindInHours ? ` · remind ${rule.remindInHours}h` : ""}
                  </span>
                </span>
                <button
                  type="button"
                  className="settings-icon-btn"
                  aria-label={`Delete ${rule.name}`}
                  onClick={() =>
                    void remove({ ownerId, id: rule._id }).then(
                      () => toast.success("Rule removed"),
                      () => toast.error("Couldn’t remove"),
                    )
                  }
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
        </ul>
      )}

      <div className="settings-inbox-form">
        <input
          className="settings-input"
          placeholder="Rule name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="settings-select"
          value={matchType}
          onChange={(e) => setMatchType(e.target.value as typeof matchType)}
        >
          <option value="always">Always</option>
          <option value="titleContains">Title contains</option>
          <option value="hasTag">Has tag</option>
        </select>
        {matchType !== "always" && (
          <input
            className="settings-input"
            placeholder={matchType === "hasTag" ? "tag" : "substring"}
            value={matchValue}
            onChange={(e) => setMatchValue(e.target.value)}
          />
        )}
        <input
          className="settings-input"
          placeholder="Add tags (comma)"
          value={addTags}
          onChange={(e) => setAddTags(e.target.value)}
        />
        <input
          className="settings-input"
          placeholder="Set status (optional)"
          value={setStatus}
          onChange={(e) => setSetStatus(e.target.value)}
        />
        <select
          className="settings-select"
          value={moveTo}
          onChange={(e) => setMoveTo(e.target.value)}
        >
          <option value="">Don’t move</option>
          {collections.map((c) => (
            <option key={c._id} value={c._id}>
              {c.icon} {c.title || "Untitled"}
            </option>
          ))}
        </select>
        <input
          className="settings-input"
          placeholder="Remind in hours (optional)"
          inputMode="numeric"
          value={remindHours}
          onChange={(e) => setRemindHours(e.target.value)}
        />
        <button type="button" className="settings-btn" onClick={() => void handleAdd()}>
          <Plus className="size-3.5" />
          Add rule
        </button>
      </div>
    </section>
  );
}

export function SettingsSavedQueries({ ownerId }: Props) {
  const toast = useToast();
  const saved = useQuery(api.queries.list, { ownerId });
  const save = useMutation(api.queries.save);
  const remove = useMutation(api.queries.remove);
  const [name, setName] = useState("Todos this week");
  const [query, setQuery] = useState("status:Todo");

  return (
    <section className="settings-section">
      <div className="settings-section-head">
        <Filter className="size-4 text-accent" />
        <div>
          <h2>Saved searches</h2>
          <p>Dataview-style queries — also insert a /query block in any page</p>
        </div>
      </div>
      {saved && saved.length > 0 && (
        <ul className="settings-template-list">
          {saved.map((q) => (
            <li key={q._id} className="settings-template-row">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{q.name}</span>
                <span className="block truncate text-xs text-muted font-mono">{q.query}</span>
              </span>
              <button
                type="button"
                className="settings-icon-btn"
                aria-label={`Delete ${q.name}`}
                onClick={() =>
                  void remove({ ownerId, id: q._id }).then(
                    () => toast.success("Query removed"),
                    () => toast.error("Couldn’t remove"),
                  )
                }
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="settings-inbox-form">
        <input
          className="settings-input"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="settings-input"
          placeholder="status:Todo tag:work prop:priority=High"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className="settings-btn"
          disabled={!query.trim()}
          onClick={() =>
            void save({ ownerId, name, query }).then(
              () => toast.success("Query saved"),
              () => toast.error("Couldn’t save"),
            )
          }
        >
          <Plus className="size-3.5" />
          Save query
        </button>
      </div>
    </section>
  );
}
