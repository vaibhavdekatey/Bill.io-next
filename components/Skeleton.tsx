import React from "react";

export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-neutral-800/60 ${className}`}
      {...props}
    />
  );
}

// Table rows skeleton
export function TableSkeleton({
  rows = 5,
  cols = 6,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="w-full divide-y divide-neutral-800/60 overflow-hidden">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-6 py-4.5">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className={`h-4.5 rounded bg-neutral-800/60 animate-pulse ${
                c === 0 ? "w-1/4" : c === cols - 1 ? "w-20 ml-auto" : "flex-1"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Recent clients cards skeleton on Dashboard
export function RecentClientsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 border border-white/5 bg-neutral-800/10 rounded-xl flex items-center gap-3.5 animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-neutral-800 shrink-0" />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="h-4 w-28 bg-neutral-800 rounded" />
            <div className="h-3 w-40 bg-neutral-800/60 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Cards grid skeleton
export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 animate-pulse flex flex-col justify-between h-[18em]"
        >
          <div className="flex flex-col gap-3">
            <div className="h-4 w-28 bg-neutral-800 rounded" />
            <div className="h-12 w-16 bg-neutral-800/80 rounded" />
            <div className="h-4 w-44 bg-neutral-800/60 rounded" />
          </div>
          <div className="h-9 w-32 bg-neutral-800 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Document skeleton (for Invoices, Quotations, and Public Views)
export function DocumentSkeleton({
  isPublic = false,
}: {
  isPublic?: boolean;
}) {
  return (
    <div className={`w-full max-w-4xl mx-auto flex flex-col gap-6 animate-pulse ${isPublic ? "py-10 px-4" : "py-8 px-4 md:px-12"}`}>
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-36 bg-neutral-800 rounded-xl" />
          <div className="h-6 w-20 bg-neutral-800/80 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-neutral-800 rounded-xl" />
          <div className="h-10 w-32 bg-neutral-800 rounded-xl" />
        </div>
      </div>

      {/* Main Document Paper */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-10 flex flex-col gap-8 shadow-2xl">
        {/* Document Top Details */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-neutral-800/80">
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-xl bg-neutral-800" />
            <div className="h-5 w-36 bg-neutral-800 rounded" />
            <div className="h-3 w-48 bg-neutral-800/60 rounded" />
            <div className="h-3 w-40 bg-neutral-800/60 rounded" />
          </div>
          <div className="flex flex-col sm:items-end gap-2.5">
            <div className="h-7 w-32 bg-neutral-800 rounded" />
            <div className="h-3.5 w-44 bg-neutral-800/60 rounded" />
            <div className="h-3.5 w-40 bg-neutral-800/60 rounded" />
          </div>
        </div>

        {/* Client & Issuer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-8 border-b border-neutral-800/80">
          <div className="flex flex-col gap-2">
            <div className="h-3 w-20 bg-neutral-800/60 rounded uppercase" />
            <div className="h-4.5 w-36 bg-neutral-800 rounded" />
            <div className="h-3.5 w-48 bg-neutral-800/60 rounded" />
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <div className="h-3 w-24 bg-neutral-800/60 rounded uppercase" />
            <div className="h-4.5 w-32 bg-neutral-800 rounded" />
            <div className="h-3.5 w-40 bg-neutral-800/60 rounded" />
          </div>
        </div>

        {/* Items Table */}
        <div className="flex flex-col gap-3">
          <div className="h-10 bg-neutral-900/60 rounded-xl" />
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-12 bg-neutral-900/30 border border-neutral-800/60 rounded-xl" />
          ))}
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end pt-4">
          <div className="w-full sm:w-72 flex flex-col gap-3 p-4 bg-neutral-900/40 rounded-2xl border border-neutral-800/60">
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-neutral-800/70 rounded" />
              <div className="h-4 w-20 bg-neutral-800/70 rounded" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-12 bg-neutral-800/70 rounded" />
              <div className="h-4 w-16 bg-neutral-800/70 rounded" />
            </div>
            <div className="border-t border-neutral-800 my-1" />
            <div className="flex justify-between items-center">
              <div className="h-5 w-20 bg-neutral-800 rounded" />
              <div className="h-6 w-28 bg-neutral-800 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Client profile page skeleton
export function ClientProfileSkeleton() {
  return (
    <div className="w-full py-8 px-4 md:px-12 flex flex-col gap-8 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-neutral-800 shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="h-7 w-48 bg-neutral-800 rounded" />
            <div className="h-4 w-32 bg-neutral-800/60 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-neutral-800 rounded-xl" />
          <div className="h-10 w-32 bg-neutral-800 rounded-xl" />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col gap-3">
            <div className="h-3 w-24 bg-neutral-800/60 rounded uppercase" />
            <div className="h-5 w-40 bg-neutral-800 rounded" />
            <div className="h-4 w-32 bg-neutral-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Activity / Invoices Table */}
      <div className="rounded-3xl bg-neutral-950 border border-neutral-800 p-6 flex flex-col gap-4">
        <div className="h-6 w-36 bg-neutral-800 rounded" />
        <div className="h-11 bg-neutral-900/60 rounded-xl" />
        <div className="h-14 bg-neutral-900/30 rounded-xl border border-neutral-800/60" />
        <div className="h-14 bg-neutral-900/30 rounded-xl border border-neutral-800/60" />
      </div>
    </div>
  );
}

// Project detail page skeleton
export function ProjectDetailSkeleton() {
  return (
    <div className="w-full py-8 px-4 md:px-12 flex flex-col gap-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-800">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-56 bg-neutral-800 rounded" />
          <div className="h-4 w-36 bg-neutral-800/60 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-neutral-800 rounded-xl" />
          <div className="h-10 w-36 bg-neutral-800 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col gap-2">
          <div className="h-3 w-16 bg-neutral-800/60 rounded uppercase" />
          <div className="h-6 w-24 bg-neutral-800 rounded" />
        </div>
        <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col gap-2">
          <div className="h-3 w-16 bg-neutral-800/60 rounded uppercase" />
          <div className="h-6 w-32 bg-neutral-800 rounded" />
        </div>
        <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col gap-2">
          <div className="h-3 w-20 bg-neutral-800/60 rounded uppercase" />
          <div className="h-6 w-28 bg-neutral-800 rounded" />
        </div>
      </div>

      <div className="rounded-3xl bg-neutral-950 border border-neutral-800 p-6 flex flex-col gap-4">
        <div className="h-6 w-40 bg-neutral-800 rounded" />
        <div className="h-48 bg-neutral-900/40 rounded-2xl border border-neutral-800/60" />
      </div>
    </div>
  );
}

// Form skeleton (for Settings & Profile)
export function FormSkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <div className="w-full flex flex-col gap-8 animate-pulse">
      {Array.from({ length: sections }).map((_, i) => (
        <div
          key={i}
          className="p-6 md:p-8 rounded-3xl bg-neutral-950 border border-neutral-800/80 flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <div className="h-6 w-40 bg-neutral-800 rounded" />
            <div className="h-3.5 w-64 bg-neutral-800/60 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-12 bg-neutral-900 border border-neutral-800/80 rounded-xl" />
            <div className="h-12 bg-neutral-900 border border-neutral-800/80 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Timeline skeleton
export function TimelineSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-3xl bg-neutral-950 border border-neutral-800/70 flex flex-col justify-between gap-4 h-48"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <div className="h-5 w-40 bg-neutral-800 rounded" />
              <div className="h-3.5 w-28 bg-neutral-800/60 rounded" />
            </div>
            <div className="h-6 w-20 bg-neutral-800 rounded-full" />
          </div>
          <div className="h-3 w-48 bg-neutral-800/50 rounded" />
        </div>
      ))}
    </div>
  );
}
