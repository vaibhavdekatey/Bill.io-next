"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import Link from "next/link";

export default function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const router = useRouter();
  const { user, loading: authLoading, update } = useAuth();

  const [inviteData, setInviteData] = useState<{
    organizationName: string;
    logoUrl?: string | null;
    role: string;
    title?: string | null;
    email: string;
  } | null>(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) return;
    api
      .get(`/team/invite?token=${token}`)
      .then((res) => {
        if (res.data?.success) {
          setInviteData(res.data.data);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Invalid or expired invitation link");
      })
      .finally(() => {
        setInviteLoading(false);
      });
  }, [token]);

  const handleJoin = async () => {
    try {
      setJoining(true);
      setError("");

      const res = await api.post("/team/join", { token });
      setSuccess(res.data?.message || "Successfully joined organization!");

      await update({ trigger: "update" });

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error("Join failed:", err);
      setError(err?.response?.data?.message || "Failed to join organization with this link.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-lexend">
      <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl p-8 flex flex-col items-center text-center gap-6 shadow-2xl">
        <div className="h-12 flex items-center justify-center">
          {inviteData?.logoUrl ? (
            <img
              src={inviteData.logoUrl}
              alt={inviteData.organizationName}
              className="h-12 w-auto max-w-[140px] object-contain rounded-lg"
            />
          ) : (
            <img src="/bill.io_ico.svg" alt="Bill.io" className="h-10 w-auto" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-light -tracking-[3%] text-white">
            {inviteData ? `Join ${inviteData.organizationName}` : "Workspace Invitation"}
          </h1>
          <p className="text-sm text-neutral-400 font-light">
            {inviteData
              ? `You've been invited to join as an ${inviteData.role.toLowerCase()}`
              : "You have been invited to collaborate with a team on Bill.io"}
          </p>
        </div>

        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-xl">
            {success}
          </div>
        )}

        {inviteLoading || authLoading ? (
          <div className="text-sm text-neutral-500 font-light py-4">Verifying invitation...</div>
        ) : error ? (
          <div className="w-full flex flex-col gap-3">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="w-full py-3 text-center cursor-pointer rounded-full bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800 text-sm font-medium transition-colors"
            >
              {user ? "Go to Dashboard" : "Return to Login"}
            </Link>
          </div>
        ) : user ? (
          <div className="w-full flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-left flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500">Signed in as</span>
              <span className="text-sm text-white font-light">{user.name || user.email}</span>
              <span className="text-xs text-neutral-400 font-light">{user.email}</span>
            </div>

            <button
              onClick={handleJoin}
              disabled={joining || !!success}
              className="w-full py-3.5 cursor-pointer rounded-full bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 text-sm font-medium transition-colors"
            >
              {joining ? "Joining Workspace..." : success ? "Redirecting..." : `Accept & Join ${inviteData?.organizationName || "Workspace"}`}
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <Link
              href={`/login?callbackUrl=/invite/${token}`}
              className="w-full py-3.5 text-center cursor-pointer rounded-full bg-white text-black hover:bg-neutral-200 text-sm font-medium transition-colors"
            >
              Log in to Accept
            </Link>
            <Link
              href={`/register?callbackUrl=/invite/${token}`}
              className="w-full py-3.5 text-center cursor-pointer rounded-full border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 text-sm font-light transition-colors"
            >
              Create an Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
