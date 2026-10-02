"use client";

import { useMutation, useQuery } from "convex/react";
import { Shield } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useToast } from "./toast";

type Props = {
  ownerId: string;
  noteId: Id<"notes">;
  workspaceId?: string | null;
};

export function NoteAclControls({ ownerId, noteId, workspaceId }: Props) {
  const toast = useToast();
  const setAcl = useMutation(api.workspaces.setNoteAcl);
  const members = useQuery(
    api.workspaces.listMembers,
    workspaceId && workspaceId.startsWith("org:")
      ? { ownerId, workspaceId }
      : "skip",
  );

  if (!workspaceId?.startsWith("org:")) return null;

  return (
    <div className="note-acl">
      <div className="note-acl-head">
        <Shield className="size-3.5" />
        <span>Team access</span>
      </div>
      <label className="note-acl-row">
        <span>Min role to edit</span>
        <select
          className="settings-select"
          defaultValue="member"
          onChange={(e) =>
            void setAcl({
              ownerId,
              noteId,
              minEditRole: e.target.value as "owner" | "admin" | "member",
            }).then(
              () => toast.success("ACL updated"),
              () => toast.error("Couldn’t update ACL"),
            )
          }
        >
          <option value="member">Any member</option>
          <option value="admin">Admin+</option>
          <option value="owner">Owner only</option>
        </select>
      </label>
      {members && members.length > 0 ? (
        <ul className="note-acl-members">
          {members.map((m) => (
            <li key={m.userId}>
              <span>{m.name}</span>
              <em>{m.role}</em>
            </li>
          ))}
        </ul>
      ) : (
        <p className="settings-hint">Invite teammates in Settings → Workspaces</p>
      )}
    </div>
  );
}
