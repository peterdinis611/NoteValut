"use client";

import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { Building2, Filter, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useToast } from "./toast";
import { TemplateEditorDialog } from "./template-editor-dialog";

type Props = { ownerId: string };

export function SettingsWorkspaces({ ownerId }: Props) {
  const toast = useToast();
  const workspaces = useQuery(api.workspaces.listForUser, { ownerId });
  const vaultRemote = useQuery(api.vaultSettings.get, { ownerId });
  const ensurePersonal = useMutation(api.workspaces.ensurePersonal);
  const linkOrg = useMutation(api.workspaces.linkOrg);
  const setActive = useMutation(api.workspaces.setActive);
  const orgList = useOrganizationList({
    userMemberships: { infinite: true },
  });
  const { organization } = useOrganization();
  const orgsLoaded = orgList.isLoaded;
  const userMemberships = orgList.userMemberships;
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    void ensurePersonal({ ownerId }).catch(() => undefined);
  }, [ownerId, ensurePersonal]);

  // Auto-link active Clerk org + memberships into Convex workspaces
  useEffect(() => {
    if (!orgsLoaded || !userMemberships?.data?.length) return;
    let cancelled = false;
    void (async () => {
      setSyncing(true);
      try {
        for (const m of userMemberships.data) {
          if (cancelled) return;
          await linkOrg({
            ownerId,
            orgId: m.organization.id,
            name: m.organization.name || "Team",
          });
        }
        // Only switch when Clerk already has an active org — never force away from personal
        if (organization?.id && !cancelled) {
          const wsId = `org:${organization.id}`;
          await linkOrg({
            ownerId,
            orgId: organization.id,
            name: organization.name || "Team",
          });
          await setActive({ ownerId, workspaceId: wsId });
        }
      } catch {
        /* Orgs may be disabled in Clerk Dashboard */
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    orgsLoaded,
    userMemberships?.data,
    organization?.id,
    organization?.name,
    ownerId,
    linkOrg,
    setActive,
  ]);

  const activeId = vaultRemote?.activeWorkspaceId ?? ownerId;
  const clerkOrgs = useMemo(() => userMemberships?.data ?? [], [userMemberships?.data]);

  return (
    <section className="settings-section">
      <div className="settings-section-head">
        <Building2 className="size-4 text-accent" />
        <div>
          <h2>Workspaces</h2>
          <p>Personal vault + Clerk organizations (picker syncs automatically)</p>
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
      {clerkOrgs.length > 0 ? (
        <div className="settings-inbox-form" style={{ marginTop: "0.75rem" }}>
          <p className="settings-hint">
            Your Clerk orgs {syncing ? "(syncing…)" : ""} — pick one to activate the team vault
          </p>
          <ul className="settings-template-list">
            {clerkOrgs.map((m) => {
              const wsId = `org:${m.organization.id}`;
              return (
                <li key={m.organization.id} className="settings-template-row">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {m.organization.name}
                    <span className="text-xs text-muted"> · {m.role}</span>
                  </span>
                  {activeId === wsId ? (
                    <span className="settings-template-badge">Active</span>
                  ) : (
                    <button
                      type="button"
                      className="settings-btn settings-btn-ghost"
                      onClick={() =>
                        void linkOrg({
                          ownerId,
                          orgId: m.organization.id,
                          name: m.organization.name || "Team",
                        })
                          .then(() => setActive({ ownerId, workspaceId: wsId }))
                          .then(
                            () => toast.success(`Team vault: ${m.organization.name}`),
                            () => toast.error("Couldn’t activate org"),
                          )
                      }
                    >
                      Use team
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="settings-hint" style={{ marginTop: "0.75rem" }}>
          Create or join an organization from the org switcher in the sidebar (Clerk →
          Organizations must be enabled).
        </p>
      )}
      <WorkspaceInvite ownerId={ownerId} workspaces={workspaces ?? []} />
    </section>
  );
}

function WorkspaceInvite({
  ownerId,
  workspaces,
}: {
  ownerId: string;
  workspaces: Array<{ workspaceId: string; name: string; kind: string; role: string; orgId?: string }>;
}) {
  const toast = useToast();
  const invite = useMutation(api.workspaces.inviteMember);
  const { organization } = useOrganization();
  const teams = workspaces.filter((w) => w.kind === "team");
  const [workspaceId, setWorkspaceId] = useState(teams[0]?.workspaceId ?? "");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const removeMember = useMutation(api.workspaces.removeMember);
  const setMemberRole = useMutation(api.workspaces.setMemberRole);
  const members = useQuery(
    api.workspaces.listMembers,
    workspaceId ? { ownerId, workspaceId } : "skip",
  );
  const directory = useQuery(
    api.workspaces.searchDirectory,
    workspaceId && search.trim().length >= 2
      ? { ownerId, workspaceId, q: search.trim() }
      : "skip",
  );

  useEffect(() => {
    if (!workspaceId && teams[0]) setWorkspaceId(teams[0].workspaceId);
  }, [teams, workspaceId]);

  if (teams.length === 0) return null;

  const selected = teams.find((t) => t.workspaceId === workspaceId);
  const orgMatchesSwitcher =
    organization?.id && selected?.orgId === organization.id;

  async function inviteByEmail() {
    const addr = email.trim().toLowerCase();
    if (!addr || !workspaceId) return;
    setBusy(true);
    try {
      if (orgMatchesSwitcher && organization) {
        await organization.inviteMember({
          emailAddress: addr,
          role: role === "admin" ? "org:admin" : "org:member",
        });
      }
      // Also record in Convex if we already know their user id from directory
      const known = directory?.find(
        (d) => d.name.toLowerCase().includes(addr) || d.userId.toLowerCase() === addr,
      );
      if (known) {
        await invite({
          ownerId,
          workspaceId,
          memberUserId: known.userId,
          role,
          displayName: known.name || addr,
        });
      }
      toast.success(
        orgMatchesSwitcher
          ? `Invite sent to ${addr}`
          : `Queued invite for ${addr} — switch to that org in the sidebar to send Clerk email`,
      );
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn’t invite");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-inbox-form" style={{ marginTop: "0.75rem" }}>
      <p className="settings-hint">Invite teammates by email (Clerk) or pick existing members</p>
      <select
        className="settings-select"
        value={workspaceId}
        onChange={(e) => setWorkspaceId(e.target.value)}
      >
        {teams.map((t) => (
          <option key={t.workspaceId} value={t.workspaceId}>
            {t.name}
          </option>
        ))}
      </select>
      <input
        className="settings-input"
        type="email"
        placeholder="teammate@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <select
        className="settings-select"
        value={role}
        onChange={(e) => setRole(e.target.value as "admin" | "member")}
      >
        <option value="member">member</option>
        <option value="admin">admin</option>
      </select>
      <button
        type="button"
        className="settings-btn"
        disabled={!email.trim() || !workspaceId || busy}
        onClick={() => void inviteByEmail()}
      >
        Invite by email
      </button>
      <input
        className="settings-input"
        placeholder="Search existing members…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {directory && directory.length > 0 ? (
        <ul className="settings-template-list">
          {directory.map((d) => (
            <li key={d.userId} className="settings-template-row">
              <span className="min-w-0 flex-1 truncate text-sm">
                {d.name} · {d.role}
              </span>
              <button
                type="button"
                className="settings-btn settings-btn-ghost"
                onClick={() =>
                  void invite({
                    ownerId,
                    workspaceId,
                    memberUserId: d.userId,
                    role,
                    displayName: d.name,
                  }).then(
                    () => toast.success(`Added ${d.name}`),
                    () => toast.error("Couldn’t add"),
                  )
                }
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {members && members.length > 0 ? (
        <ul className="settings-template-list">
          {members.map((m) => (
            <li key={m.userId} className="settings-template-row">
              <span className="min-w-0 flex-1 truncate text-sm">
                {m.name} · {m.role}
              </span>
              {m.role !== "owner" ? (
                <>
                  <select
                    className="settings-select"
                    value={m.role}
                    onChange={(e) =>
                      void setMemberRole({
                        ownerId,
                        workspaceId,
                        memberUserId: m.userId,
                        role: e.target.value as "admin" | "member",
                      }).then(
                        () => toast.success("Role updated"),
                        () => toast.error("Couldn’t update role"),
                      )
                    }
                  >
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                  <button
                    type="button"
                    className="settings-icon-btn"
                    aria-label={`Remove ${m.name}`}
                    onClick={() =>
                      void removeMember({
                        ownerId,
                        workspaceId,
                        memberUserId: m.userId,
                      }).then(
                        () => toast.success("Removed"),
                        () => toast.error("Couldn’t remove"),
                      )
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              ) : (
                <span className="text-xs text-muted truncate">{m.userId.slice(0, 12)}…</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
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
  const [editingId, setEditingId] = useState<Id<"inboxRules"> | null>(null);

  const collections =
    folders?.filter((n) => n.kind === "folder" && !n.trashed && !n.archived) ?? [];

  async function handleAdd() {
    try {
      await upsert({
        ownerId,
        id: editingId ?? undefined,
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
      toast.success(editingId ? "Rule updated" : "Inbox rule saved");
      setEditingId(null);
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
            .map((rule, index, arr) => (
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
                  className="settings-btn settings-btn-ghost"
                  title={rule.enabled ? "Disable" : "Enable"}
                  onClick={() =>
                    void upsert({
                      ownerId,
                      id: rule._id,
                      name: rule.name,
                      enabled: !rule.enabled,
                      matchType: rule.matchType,
                      matchValue: rule.matchValue,
                      addTags: rule.addTags,
                      setStatus: rule.setStatus,
                      moveToFolderId: rule.moveToFolderId,
                      remindInHours: rule.remindInHours,
                      sortOrder: rule.sortOrder,
                    }).then(
                      () => toast.success(rule.enabled ? "Disabled" : "Enabled"),
                      () => toast.error("Couldn’t update"),
                    )
                  }
                >
                  {rule.enabled ? "On" : "Off"}
                </button>
                <button
                  type="button"
                  className="settings-btn settings-btn-ghost"
                  disabled={index === 0}
                  aria-label="Move up"
                  onClick={() => {
                    const prev = arr[index - 1];
                    if (!prev) return;
                    void Promise.all([
                      upsert({
                        ownerId,
                        id: rule._id,
                        name: rule.name,
                        enabled: rule.enabled,
                        matchType: rule.matchType,
                        matchValue: rule.matchValue,
                        addTags: rule.addTags,
                        setStatus: rule.setStatus,
                        moveToFolderId: rule.moveToFolderId,
                        remindInHours: rule.remindInHours,
                        sortOrder: prev.sortOrder ?? index - 1,
                      }),
                      upsert({
                        ownerId,
                        id: prev._id,
                        name: prev.name,
                        enabled: prev.enabled,
                        matchType: prev.matchType,
                        matchValue: prev.matchValue,
                        addTags: prev.addTags,
                        setStatus: prev.setStatus,
                        moveToFolderId: prev.moveToFolderId,
                        remindInHours: prev.remindInHours,
                        sortOrder: rule.sortOrder ?? index,
                      }),
                    ]).then(
                      () => toast.success("Reordered"),
                      () => toast.error("Couldn’t reorder"),
                    );
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="settings-btn settings-btn-ghost"
                  onClick={() => {
                    setName(rule.name);
                    setMatchType(rule.matchType);
                    setMatchValue(rule.matchValue ?? "");
                    setAddTags((rule.addTags ?? []).join(", "));
                    setSetStatus(rule.setStatus ?? "");
                    setMoveTo(rule.moveToFolderId ?? "");
                    setRemindHours(rule.remindInHours ? String(rule.remindInHours) : "");
                    setEditingId(rule._id);
                  }}
                >
                  Edit
                </button>
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
          {editingId ? "Update rule" : "Add rule"}
        </button>
        {editingId ? (
          <button
            type="button"
            className="settings-btn settings-btn-ghost"
            onClick={() => setEditingId(null)}
          >
            Cancel edit
          </button>
        ) : null}
      </div>

      <InboxRulesPreview ownerId={ownerId} />
    </section>
  );
}

function InboxRulesPreview({ ownerId }: { ownerId: string }) {
  const [title, setTitle] = useState("Standup capture");
  const [tags, setTags] = useState("capture");
  const preview = useQuery(api.inboxRules.preview, {
    ownerId,
    title,
    tags: tags
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean),
  });

  return (
    <div className="settings-inbox-preview">
      <h3>Preview — what would happen</h3>
      <div className="settings-inbox-form">
        <input
          className="settings-input"
          placeholder="Sample title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="settings-input"
          placeholder="Sample tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>
      {preview ? (
        <div className="settings-inbox-preview-body">
          <p className="settings-hint">{preview.summary}</p>
          {preview.matched.map((m) => (
            <p key={m.id} className="text-sm">
              <strong>{m.name}</strong>
              {m.effects.length ? ` — ${m.effects.join("; ")}` : " — match, no changes"}
            </p>
          ))}
          {preview.matched.length > 0 ? (
            <p className="text-xs text-muted font-mono">
              → tags: [{preview.resulting.tags.join(", ")}]
              {preview.resulting.status ? ` · status: ${preview.resulting.status}` : ""}
              {preview.resulting.remindInHours
                ? ` · remind ${preview.resulting.remindInHours}h`
                : ""}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="settings-empty">Loading preview…</p>
      )}
    </div>
  );
}

export function SettingsSavedQueries({ ownerId }: Props) {
  const toast = useToast();
  const saved = useQuery(api.queries.list, { ownerId });
  const folders = useQuery(api.notes.list, { ownerId });
  const save = useMutation(api.queries.save);
  const remove = useMutation(api.queries.remove);
  const [editingId, setEditingId] = useState<Id<"savedQueries"> | null>(null);
  const [name, setName] = useState("Todos this week");
  const [query, setQuery] = useState("status:Todo due:week");
  const [folderId, setFolderId] = useState("");
  const [viewMode, setViewMode] = useState("");

  const collections =
    folders?.filter((n) => n.kind === "folder" && !n.trashed && !n.archived) ?? [];

  function resetForm() {
    setEditingId(null);
    setName("Todos this week");
    setQuery("status:Todo due:week");
    setFolderId("");
    setViewMode("");
  }

  return (
    <section className="settings-section">
      <div className="settings-section-head">
        <Filter className="size-4 text-accent" />
        <div>
          <h2>Saved searches</h2>
          <p>Dataview-style queries — sidebar + /query block</p>
        </div>
      </div>
      {saved && saved.length > 0 && (
        <ul className="settings-template-list">
          {saved.map((q) => (
            <li key={q._id} className="settings-template-row">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{q.name}</span>
                <span className="block truncate text-xs text-muted font-mono">{q.query}</span>
                {(q.folderId || q.viewMode) && (
                  <span className="block truncate text-xs text-muted">
                    {q.viewMode ? `view:${q.viewMode}` : ""}
                    {q.folderId ? " · folder" : ""}
                  </span>
                )}
              </span>
              <button
                type="button"
                className="settings-btn settings-btn-ghost"
                onClick={() => {
                  setEditingId(q._id);
                  setName(q.name);
                  setQuery(q.query);
                  setFolderId(q.folderId ?? "");
                  setViewMode(q.viewMode ?? "");
                }}
              >
                Edit
              </button>
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
          placeholder="status:Todo due:week assignee:me"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="settings-select"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
        >
          <option value="">Any collection</option>
          {collections.map((c) => (
            <option key={c._id} value={c._id}>
              {c.icon} {c.title || "Untitled"}
            </option>
          ))}
        </select>
        <select
          className="settings-select"
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
        >
          <option value="">Default list</option>
          <option value="table">table</option>
          <option value="kanban">kanban</option>
          <option value="gallery">gallery</option>
          <option value="calendar">calendar</option>
        </select>
        <button
          type="button"
          className="settings-btn"
          disabled={!query.trim()}
          onClick={() =>
            void save({
              ownerId,
              id: editingId ?? undefined,
              name,
              query,
              folderId: folderId ? (folderId as Id<"notes">) : undefined,
              viewMode: viewMode || undefined,
            }).then(
              () => {
                toast.success(editingId ? "Query updated" : "Query saved");
                resetForm();
              },
              () => toast.error("Couldn’t save"),
            )
          }
        >
          <Plus className="size-3.5" />
          {editingId ? "Update query" : "Save query"}
        </button>
        {editingId ? (
          <button type="button" className="settings-btn settings-btn-ghost" onClick={resetForm}>
            Cancel
          </button>
        ) : null}
      </div>
    </section>
  );
}

const WEEKDAYS = [
  { v: 1 as const, label: "Mon" },
  { v: 2 as const, label: "Tue" },
  { v: 3 as const, label: "Wed" },
  { v: 4 as const, label: "Thu" },
  { v: 5 as const, label: "Fri" },
  { v: 6 as const, label: "Sat" },
  { v: 0 as const, label: "Sun" },
];

export function SettingsRecurringTemplates({ ownerId }: Props) {
  const toast = useToast();
  const items = useQuery(api.recurringTemplates.list, { ownerId });
  const folders = useQuery(api.notes.list, { ownerId });
  const upsert = useMutation(api.recurringTemplates.upsert);
  const remove = useMutation(api.recurringTemplates.remove);
  const runDue = useMutation(api.recurringTemplates.runDue);
  const [editingId, setEditingId] = useState<Id<"recurringTemplates"> | null>(null);
  const [name, setName] = useState("Monday standup");
  const [titleTemplate, setTitleTemplate] = useState("Standup {{date}}");
  const [weekday, setWeekday] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(1);
  const [parentId, setParentId] = useState("");
  const [blocks, setBlocks] = useState<
    Array<{ id: string; type: string; text: string; checked?: boolean; level?: number }>
  >([]);
  const [bodyOpen, setBodyOpen] = useState(false);

  const collections =
    folders?.filter((n) => n.kind === "folder" && !n.trashed && !n.archived) ?? [];

  useEffect(() => {
    void runDue({ ownerId }).catch(() => undefined);
  }, [ownerId, runDue]);

  function loadEdit(t: NonNullable<typeof items>[number]) {
    setEditingId(t._id);
    setName(t.name);
    setTitleTemplate(t.titleTemplate);
    setWeekday(t.weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6);
    setParentId(t.parentId ?? "");
    setBlocks((t.blocks as typeof blocks) ?? []);
  }

  return (
    <section className="settings-section">
      <div className="settings-section-head">
        <Filter className="size-4 text-accent" />
        <div>
          <h2>Recurring templates</h2>
          <p>Hourly cron + weekday match — edit body, folder, enable/disable</p>
        </div>
      </div>
      {items && items.length > 0 ? (
        <ul className="settings-template-list">
          {items.map((t) => (
            <li key={t._id} className="settings-template-row">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {t.enabled ? "" : "(off) "}
                  {t.name}
                </span>
                <span className="block truncate text-xs text-muted">
                  {WEEKDAYS.find((w) => w.v === t.weekday)?.label ?? t.weekday} ·{" "}
                  {t.titleTemplate}
                </span>
              </span>
              <button
                type="button"
                className="settings-btn settings-btn-ghost"
                onClick={() =>
                  void upsert({
                    ownerId,
                    id: t._id,
                    name: t.name,
                    titleTemplate: t.titleTemplate,
                    weekday: t.weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6,
                    enabled: !t.enabled,
                    parentId: t.parentId,
                    blocks: t.blocks,
                    tags: t.tags,
                  }).then(
                    () => toast.success(t.enabled ? "Disabled" : "Enabled"),
                    () => toast.error("Couldn’t update"),
                  )
                }
              >
                {t.enabled ? "On" : "Off"}
              </button>
              <button
                type="button"
                className="settings-btn settings-btn-ghost"
                onClick={() => loadEdit(t)}
              >
                Edit
              </button>
              <button
                type="button"
                className="settings-icon-btn"
                aria-label={`Delete ${t.name}`}
                onClick={() =>
                  void remove({ ownerId, id: t._id }).then(
                    () => toast.success("Removed"),
                    () => toast.error("Couldn’t remove"),
                  )
                }
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="settings-empty">No recurring templates yet.</p>
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
          placeholder="Title template ({{name}} {{date}})"
          value={titleTemplate}
          onChange={(e) => setTitleTemplate(e.target.value)}
        />
        <select
          className="settings-select"
          value={weekday}
          onChange={(e) => setWeekday(Number(e.target.value) as typeof weekday)}
        >
          {WEEKDAYS.map((w) => (
            <option key={w.v} value={w.v}>
              Every {w.label}
            </option>
          ))}
        </select>
        <select
          className="settings-select"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">Root (no folder)</option>
          {collections.map((c) => (
            <option key={c._id} value={c._id}>
              {c.icon} {c.title || "Untitled"}
            </option>
          ))}
        </select>
        <button type="button" className="settings-btn settings-btn-ghost" onClick={() => setBodyOpen(true)}>
          {blocks.length ? `Edit body (${blocks.length} blocks)` : "Edit body…"}
        </button>
        <button
          type="button"
          className="settings-btn"
          onClick={() =>
            void upsert({
              ownerId,
              id: editingId ?? undefined,
              name,
              titleTemplate,
              weekday,
              enabled: true,
              parentId: parentId ? (parentId as Id<"notes">) : undefined,
              tags: ["recurring"],
              blocks: (blocks.length
                ? blocks
                : [
                    { id: crypto.randomUUID(), type: "heading2", text: name },
                    { id: crypto.randomUUID(), type: "todo", text: "Wins", checked: false },
                    { id: crypto.randomUUID(), type: "todo", text: "Blockers", checked: false },
                    { id: crypto.randomUUID(), type: "paragraph", text: "" },
                  ]) as never,
            }).then(
              () => {
                toast.success(editingId ? "Updated" : "Recurring template saved");
                setEditingId(null);
              },
              () => toast.error("Couldn’t save"),
            )
          }
        >
          <Plus className="size-3.5" />
          {editingId ? "Update" : "Add recurring"}
        </button>
        <button
          type="button"
          className="settings-btn settings-btn-ghost"
          onClick={() =>
            void runDue({ ownerId }).then(
              (r) =>
                toast.success(
                  r.created ? `Created ${r.created} page(s)` : "Nothing due today",
                ),
              () => toast.error("Couldn’t run"),
            )
          }
        >
          Run due now
        </button>
      </div>
      <TemplateEditorDialog
        open={bodyOpen}
        onClose={() => setBodyOpen(false)}
        title="Recurring page body"
        subtitle="Blocks inserted when the template fires"
        initial={{ name, blocks: blocks as never }}
        onSaveBlocks={(data) => {
          setName(data.name);
          setBlocks(data.blocks as typeof blocks);
          toast.success("Body saved — click Update/Add to persist");
        }}
      />
    </section>
  );
}
