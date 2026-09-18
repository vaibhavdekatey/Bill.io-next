"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import PillButton from "@/components/PillButton";

type TeamMember = {
  id: string;
  userId: string;
  role: string;
  title: string | null;
  User: {
    id: string;
    name: string | null;
    email: string;
    phoneNumber: string | null;
    createdAt: string;
  };
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  title: string | null;
  token: string;
  expiresAt: string;
  createdAt: string;
};

const getInitials = (name: string | null | undefined, email: string) => {
  if (name && name.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const inputCls =
  "bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-neutral-600 rounded-xl px-4 py-3 text-sm transition-colors placeholder:text-neutral-600 w-full";

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState("MEMBER");
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteTitle, setInviteTitle] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Edit member modal
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState("MEMBER");
  const [editTitle, setEditTitle] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete/Remove confirm modal
  const [targetToRemove, setTargetToRemove] = useState<{ id: string; name: string; isInvite: boolean } | null>(null);
  const [removing, setRemoving] = useState(false);

  const isManager = ["OWNER", "ADMIN"].includes(currentUserRole.toUpperCase());

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await api.get("/team");
      setMembers(res.data?.data?.members || []);
      setInvites(res.data?.data?.invites || []);
      setCurrentUserRole(res.data?.data?.currentUserRole || "MEMBER");
    } catch (err) {
      console.error("Failed to load team:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setInviteError("Email address is required");
      return;
    }

    try {
      setInviting(true);
      setInviteError("");

      await api.post("/team/invite", {
        email: inviteEmail.trim(),
        role: inviteRole,
        title: inviteTitle.trim() || null,
      });

      setIsInviteModalOpen(false);
      setInviteEmail("");
      setInviteRole("MEMBER");
      setInviteTitle("");
      await fetchTeam();
    } catch (err: any) {
      console.error("Invite failed:", err);
      setInviteError(err?.response?.data?.message || "Failed to create invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleSaveMemberEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      setSavingEdit(true);
      await api.patch(`/team/${editingMember.id}`, {
        role: editRole,
        title: editTitle.trim() || null,
      });

      setEditingMember(null);
      await fetchTeam();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update member");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRemoveTarget = async () => {
    if (!targetToRemove) return;
    try {
      setRemoving(true);
      await api.delete(`/team/${targetToRemove.id}`);
      setTargetToRemove(null);
      await fetchTeam();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to remove member");
    } finally {
      setRemoving(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  return (
    <main className="w-full overflow-y-auto py-8 px-4 md:px-12">
      <div className="flex flex-col w-full max-w-5xl mx-auto gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-4xl font-light -tracking-[4%] text-white">Team &amp; Collaboration</h1>
            <p className="text-neutral-400 text-sm mt-1">
              {members.length} team {members.length === 1 ? "member" : "members"} in this workspace
            </p>
          </div>

          {isManager && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-neutral-950 text-sm p-2.5 px-4 border border-neutral-800 hover:border-neutral-400 rounded-full hover:bg-white hover:text-black flex flex-row items-center justify-center cursor-pointer gap-2 transition-all duration-300"
            >
              <span>+</span>
              <span>Invite Teammate</span>
            </button>
          )}
        </div>

        {/* Active Members Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-light text-white">Active Members</h2>
            <p className="text-xs text-neutral-500">
              Teammates with access to your shared clients, projects, quotations, and bills
            </p>
          </div>

          {loading ? (
            <div className="text-neutral-500 text-sm py-8 text-center font-light">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="text-neutral-500 text-sm py-8 text-center font-light">No members found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800/80 text-[10px] uppercase tracking-wider text-neutral-500">
                    <th className="py-3 px-2">Member</th>
                    <th className="py-3 px-2">Role</th>
                    <th className="py-3 px-2">Job Title</th>
                    <th className="py-3 px-2 hidden sm:table-cell">Joined</th>
                    {isManager && <th className="py-3 px-2 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {members.map((member) => {
                    const isOwner = member.role.toUpperCase() === "OWNER";
                    const isAdmin = member.role.toUpperCase() === "ADMIN";

                    return (
                      <tr key={member.id} className="hover:bg-neutral-900/40 transition-colors">
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 border border-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-200 shrink-0">
                              {getInitials(member.User.name, member.User.email)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-white font-light">
                                {member.User.name || member.User.email.split("@")[0]}
                              </span>
                              <span className="text-xs text-neutral-500">{member.User.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              isOwner
                                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                : isAdmin
                                ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                                : "bg-neutral-800 text-neutral-300 border-neutral-700"
                            }`}
                          >
                            {member.role}
                          </span>
                        </td>

                        <td className="py-4 px-2 text-sm text-neutral-400 font-light">
                          {member.title || <span className="text-neutral-600">—</span>}
                        </td>

                        <td className="py-4 px-2 text-xs text-neutral-500 font-light hidden sm:table-cell">
                          {formatDate(member.User.createdAt)}
                        </td>

                        {isManager && (
                          <td className="py-4 px-2 text-right">
                            {!isOwner && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingMember(member);
                                    setEditRole(member.role);
                                    setEditTitle(member.title || "");
                                  }}
                                  className="text-xs text-neutral-400 hover:text-white px-3 py-1 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    setTargetToRemove({
                                      id: member.id,
                                      name: member.User.name || member.User.email,
                                      isInvite: false,
                                    })
                                  }
                                  className="text-xs text-red-400/80 hover:text-red-300 px-3 py-1 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending Invites Card */}
        {invites.length > 0 && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xl">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-light text-white">Pending Invitations ({invites.length})</h2>
              <p className="text-xs text-neutral-500">
                Invitation links expire in 7 days. Share the link directly with your teammate if needed.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800/80 text-[10px] uppercase tracking-wider text-neutral-500">
                    <th className="py-3 px-2">Invited Email</th>
                    <th className="py-3 px-2">Assigned Role</th>
                    <th className="py-3 px-2">Job Title</th>
                    <th className="py-3 px-2">Expires</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {invites.map((invite) => (
                    <tr key={invite.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="py-4 px-2 text-sm text-white font-light">{invite.email}</td>
                      <td className="py-4 px-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {invite.role}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-sm text-neutral-400 font-light">
                        {invite.title || <span className="text-neutral-600">—</span>}
                      </td>
                      <td className="py-4 px-2 text-xs text-neutral-500 font-light">
                        {formatDate(invite.expiresAt)}
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => copyInviteLink(invite.token)}
                            className="text-xs text-neutral-300 hover:text-white px-3 py-1 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
                          >
                            {copiedToken === invite.token ? "✓ Link Copied" : "Copy Invite Link"}
                          </button>
                          {isManager && (
                            <button
                              onClick={() =>
                                setTargetToRemove({
                                  id: invite.id,
                                  name: invite.email,
                                  isInvite: true,
                                })
                              }
                              className="text-xs text-red-400/80 hover:text-red-300 px-3 py-1 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Roles & Permissions Reference */}
        <div className="bg-neutral-950/60 border border-neutral-900 rounded-2xl p-6 flex flex-col gap-3">
          <span className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
            Role Permissions Overview
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-400 font-light">
            <div className="flex flex-col gap-1 p-3 bg-neutral-900/30 rounded-xl border border-white/5">
              <span className="text-white font-normal text-sm">Owner</span>
              <span>Full control over organization finances, banking settings, team members, and deletion.</span>
            </div>
            <div className="flex flex-col gap-1 p-3 bg-neutral-900/30 rounded-xl border border-white/5">
              <span className="text-white font-normal text-sm">Admin</span>
              <span>Can manage invoices, send quotations, invite teammates, and manage project workflows.</span>
            </div>
            <div className="flex flex-col gap-1 p-3 bg-neutral-900/30 rounded-xl border border-white/5">
              <span className="text-white font-normal text-sm">Member</span>
              <span>Can view and update active projects, client details, and drafts without seeing bank settings.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal: Invite Teammate ── */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800/40 rounded-3xl w-full max-w-md p-8 flex flex-col gap-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-light text-white">Invite Teammate</h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {inviteError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  Workspace Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className={inputCls}
                >
                  <option value="MEMBER" className="bg-neutral-900 text-white">
                    Member — Can collaborate on projects &amp; clients
                  </option>
                  <option value="ADMIN" className="bg-neutral-900 text-white">
                    Admin — Can manage team &amp; billing
                  </option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  Job Title / Designation
                </label>
                <input
                  type="text"
                  value={inviteTitle}
                  onChange={(e) => setInviteTitle(e.target.value)}
                  placeholder="e.g. Lead Designer, Frontend Engineer"
                  className={inputCls}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-5 py-3 cursor-pointer rounded-full border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 text-sm font-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-6 py-3 cursor-pointer rounded-full bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 text-sm font-light transition-colors"
                >
                  {inviting ? "Sending..." : "Create Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Member Role / Title ── */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800/40 rounded-3xl w-full max-w-md p-8 flex flex-col gap-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-light text-white">Edit Member</h3>
              <button
                onClick={() => setEditingMember(null)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMemberEdit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500 uppercase tracking-wider">Member</span>
                <span className="text-sm text-white">{editingMember.User.name || editingMember.User.email}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className={inputCls}
                >
                  <option value="MEMBER" className="bg-neutral-900 text-white">Member</option>
                  <option value="ADMIN" className="bg-neutral-900 text-white">Admin</option>
                  {currentUserRole.toUpperCase() === "OWNER" && (
                    <option value="OWNER" className="bg-neutral-900 text-white">Owner (Transfer Ownership)</option>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  Job Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Lead Designer"
                  className={inputCls}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-5 py-3 cursor-pointer rounded-full border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 text-sm font-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-3 cursor-pointer rounded-full bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 text-sm font-light transition-colors"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm Remove / Revoke ── */}
      {targetToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="text-2xl font-light text-white">
              {targetToRemove.isInvite ? "Revoke Invitation?" : "Remove Member?"}
            </h3>
            <p className="text-sm text-neutral-400 font-light">
              Are you sure you want to {targetToRemove.isInvite ? "cancel the invitation for" : "remove"}{" "}
              <strong className="text-white font-normal">{targetToRemove.name}</strong> from this workspace?
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setTargetToRemove(null)}
                className="px-4 py-2 cursor-pointer rounded-full border border-neutral-800 text-neutral-300 hover:text-white text-sm transition-colors"
              >
                Keep
              </button>
              <button
                onClick={handleRemoveTarget}
                disabled={removing}
                className="px-5 py-2 cursor-pointer rounded-full bg-red-600 hover:bg-red-700 text-white text-sm transition-colors disabled:opacity-50"
              >
                {removing ? "Removing..." : targetToRemove.isInvite ? "Revoke Invite" : "Remove Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
