"use client";

import { useMutation, useQuery } from "convex/react";
import { Shield, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useToast } from "./toast";

type Props = {
  ownerId: string;
  noteId: Id<"notes">;
  workspaceId?: string | null;
  /** Compact mode for embedding inside SharePanel */
  compact?: boolean;
};

export function NoteAclControls({ ownerId, noteId, workspaceId, compact }: Props) {
  const toast = useToast();
  const setAcl = useMutation(api.workspaces.setNoteAcl);
  const assignWs = useMutation(api.workspaces.assignNoteWorkspace);
  const grantAccess = useMutation(api.workspaces.grantNoteAccess);
  const revokeAccess = useMutation(api.workspaces.revokeNoteAccess);
  const workspaces = useQuery(api.workspaces.listForUser, { ownerId });
  const vaultRemote = useQuery(api.vaultSettings.get, { ownerId });
  const acl = useQuery(api.workspaces.getNoteAcl, { ownerId, noteId });
  const grants = useQuery(api.workspaces.listNoteGrants, { ownerId, noteId });
  const activeWs = vaultRemote?.activeWorkspaceId ?? ownerId;
  const teams = (workspaces ?? []).filter((w) => w.kind === "team");
  const effectiveWs = workspaceId?.startsWith("org:")
    ? workspaceId
    : activeWs.startsWith("org:")
      ? activeWs
      : null;
  const members = useQuery(
    api.workspaces.listMembers,
    effectiveWs ? { ownerId, workspaceId: effectiveWs } : "skip",
  );
  const [role, setRole] = useState<"owner" | "admin" | "member">("member");
  const [grantUserId, setGrantUserId] = useState("");
  const [grantRole, setGrantRole] = useState<"viewer" | "editor">("editor");

  useEffect(() => {
    if (acl?.minEditRole) setRole(acl.minEditRole);
  }, [acl?.minEditRole]);

  const isTeamNote = Boolean(workspaceId?.startsWith("org:"));

  return (
    <div className={`note-acl ${compact ? "note-acl-compact" : ""}`}>
      <div className="note-acl-head">
        <Shield className="size-3.5" />
        <span>Share with teammates</span>
      </div>

      {!isTeamNote && teams.length > 0 ? (
        <div className="note-acl-row note-acl-stack">
          <span>Move into team workspace</span>
          <div className="note-acl-actions">
            {teams.map((t) => (
              <button
                key={t.workspaceId}
                type="button"
                className="settings-btn settings-btn-ghost"
                onClick={() =>
                  void assignWs({
                    ownerId,
                    noteId,
                    workspaceId: t.workspaceId,
                  }).then(
                    () => toast.success(`Moved to ${t.name}`),
                    () => toast.error("Couldn’t move"),
                  )
                }
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {isTeamNote ? (
        <label className="note-acl-row">
          <span>Min role to edit</span>
          <select
            className="settings-select"
            value={role}
            onChange={(e) => {
              const next = e.target.value as "owner" | "admin" | "member";
              setRole(next);
              void setAcl({ ownerId, noteId, minEditRole: next }).then(
                () => toast.success("ACL updated"),
                () => toast.error("Couldn’t update ACL"),
              );
            }}
          >
            <option value="member">Any member</option>
            <option value="admin">Admin+</option>
            <option value="owner">Owner only</option>
          </select>
        </label>
      ) : null}

      <div className="note-acl-row note-acl-stack">
        <span>
          <UserPlus className="mr-1 inline size-3" />
          Grant access
        </span>
        <div className="note-acl-actions">
          <select
            className="settings-select"
            value={grantUserId}
            onChange={(e) => setGrantUserId(e.target.value)}
          >
            <option value="">Select teammate…</option>
            {(members ?? [])
              .filter((m) => m.userId !== ownerId)
              .map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name}
                </option>
              ))}
          </select>
          <select
            className="settings-select"
            value={grantRole}
            onChange={(e) => setGrantRole(e.target.value as "viewer" | "editor")}
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="button"
            className="settings-btn"
            disabled={!grantUserId}
            onClick={() =>
              void grantAccess({
                ownerId,
                noteId,
                userId: grantUserId,
                role: grantRole,
              }).then(
                () => {
                  toast.success("Access granted");
                  setGrantUserId("");
                },
                () => toast.error("Couldn’t grant access"),
              )
            }
          >
            Share
          </button>
        </div>
        {!members?.length ? (
          <p className="settings-hint">Invite teammates in Settings → Workspaces first</p>
        ) : null}
      </div>

      {grants && grants.length > 0 ? (
        <ul className="note-acl-members">
          {grants.map((g) => {
            const name =
              members?.find((m) => m.userId === g.userId)?.name ?? g.userId.slice(0, 12);
            return (
              <li key={g.userId}>
                <span>
                  {name} · {g.role}
                </span>
                <button
                  type="button"
                  className="settings-btn settings-btn-ghost"
                  onClick={() =>
                    void revokeAccess({ ownerId, noteId, userId: g.userId }).then(
                      () => toast.success("Access revoked"),
                      () => toast.error("Couldn’t revoke"),
                    )
                  }
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {isTeamNote && members && members.length > 0 ? (
        <ul className="note-acl-members">
          {members.map((m) => (
            <li key={m.userId}>
              <span>{m.name}</span>
              <em>{m.role}</em>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
