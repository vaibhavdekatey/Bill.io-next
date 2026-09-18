"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Link from "next/link";

type TimelineActivity = {
  id: string;
  type: "INVOICE_PAID" | "INVOICE_DUE" | "QUOTATION_EXPIRING" | "PROJECT_ACTIVE";
  title: string;
  description: string;
  amount?: string;
  date: string;
  badge: string;
  link: string;
};

type ProjectItem = {
  id: string;
  name: string;
  status: string;
  Client?: { name: string; companyName: string | null } | null;
  _count: { Invoice: number; ProjectItem: number };
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString("en-IN", { day: "numeric" }),
    month: d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase(),
    full: d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
};

export default function TimelinePage() {
  const [activities, setActivities] = useState<TimelineActivity[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "INVOICE" | "PROJECT" | "QUOTATION">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const res = await api.get("/timeline");
        setActivities(res.data?.data?.activities || []);
        setProjects(res.data?.data?.activeProjects || []);
      } catch (err) {
        console.error("Failed to load timeline:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, []);

  const filteredActivities = activities.filter((act) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "INVOICE") return act.type.startsWith("INVOICE");
    if (activeFilter === "QUOTATION") return act.type.startsWith("QUOTATION");
    if (activeFilter === "PROJECT") return act.type.startsWith("PROJECT");
    return true;
  });

  const overdueCount = activities.filter((a) => a.badge === "Overdue").length;
  const dueSoonCount = activities.filter((a) => a.badge === "Due Soon").length;

  return (
    <main className="w-full overflow-y-auto py-8 px-4 md:px-12">
      <div className="flex flex-col w-full max-w-5xl mx-auto gap-8">
        {/* Header */}
        <div className="flex flex-col">
          <h1 className="text-4xl font-light -tracking-[4%] text-white">Timeline &amp; Cash Flow</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Chronological schedule of payment due dates, quotation expirations, and active project milestones
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/60 flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500">Upcoming Bills</span>
            <span className="text-2xl font-light text-white">{dueSoonCount} Due Soon</span>
          </div>
          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/60 flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500">Attention Needed</span>
            <span className={`text-2xl font-light ${overdueCount > 0 ? "text-red-400" : "text-neutral-400"}`}>
              {overdueCount} Overdue
            </span>
          </div>
          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/60 flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500">Active Workflows</span>
            <span className="text-2xl font-light text-white">{projects.length} Active Projects</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: "ALL", label: "All Milestones" },
            { key: "INVOICE", label: "Invoices & Payments" },
            { key: "QUOTATION", label: "Quotations" },
            { key: "PROJECT", label: "Active Projects" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key as any)}
              className={`px-4 py-2 rounded-full text-xs font-light transition-colors whitespace-nowrap cursor-pointer ${
                activeFilter === tab.key
                  ? "bg-white text-black"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Timeline Schedule */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="text-neutral-500 text-sm py-12 text-center font-light">
              Aggregating milestones and schedule...
            </div>
          ) : activeFilter === "PROJECT" ? (
            /* Projects Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.length === 0 ? (
                <div className="col-span-2 text-neutral-500 text-sm py-8 text-center font-light">
                  No active projects found
                </div>
              ) : (
                projects.map((proj) => (
                  <Link
                    href={`/projects/${proj.id}`}
                    key={proj.id}
                    className="p-6 rounded-3xl bg-neutral-950 border border-neutral-800/70 hover:border-neutral-700 transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <h3 className="text-lg font-light text-white group-hover:text-neutral-200">
                          {proj.name}
                        </h3>
                        <span className="text-xs text-neutral-500">
                          {proj.Client?.name || proj.Client?.companyName || "Internal Project"}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        {proj.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-neutral-500 border-t border-neutral-900 pt-3">
                      <span>{proj._count.ProjectItem} deliverables</span>
                      <span>•</span>
                      <span>{proj._count.Invoice} invoices generated</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-neutral-500 text-sm py-12 text-center font-light border border-neutral-800/40 rounded-3xl p-8">
              No milestones scheduled in this category
            </div>
          ) : (
            /* Chronological Timeline List */
            <div className="relative flex flex-col gap-3">
              {filteredActivities.map((act) => {
                const dateObj = formatDate(act.date);
                const isOverdue = act.badge === "Overdue";
                const isPaid = act.badge === "Paid";
                const isDueSoon = act.badge === "Due Soon";

                return (
                  <Link
                    href={act.link}
                    key={act.id}
                    className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/60 hover:border-neutral-700 transition-all flex items-center justify-between gap-4 group"
                  >
                    {/* Left: Date badge + Details */}
                    <div className="flex items-center gap-5">
                      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 shrink-0">
                        <span className="text-sm font-semibold text-white leading-none">
                          {dateObj.day}
                        </span>
                        <span className="text-[9px] text-neutral-500 tracking-wider mt-0.5">
                          {dateObj.month}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm text-white font-light group-hover:text-neutral-200">
                            {act.title}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              isOverdue
                                ? "bg-red-500/10 text-red-300 border-red-500/30"
                                : isPaid
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                : isDueSoon
                                ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                                : "bg-neutral-800 text-neutral-300 border-neutral-700"
                            }`}
                          >
                            {act.badge}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500 mt-0.5">{act.description}</span>
                      </div>
                    </div>

                    {/* Right: Amount & Arrow */}
                    <div className="flex items-center gap-4">
                      {act.amount && (
                        <span className="text-sm text-white font-light">{act.amount}</span>
                      )}
                      <svg
                        className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
