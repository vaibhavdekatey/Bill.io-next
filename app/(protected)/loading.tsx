import React from "react";

export default function ProtectedLoading() {
  return (
    <div className="w-full py-8 px-4 md:px-12 flex flex-col gap-8 animate-pulse font-lexend">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-9 w-48 bg-neutral-800 rounded-xl" />
        <div className="h-4 w-64 bg-neutral-800/60 rounded" />
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-48 rounded-2xl bg-neutral-900/60 border border-neutral-800/80" />
        <div className="h-48 rounded-2xl bg-neutral-900/60 border border-neutral-800/80" />
        <div className="h-48 rounded-2xl bg-neutral-900/60 border border-neutral-800/80" />
      </div>

      {/* Content Area Skeleton */}
      <div className="h-64 rounded-3xl bg-neutral-900/40 border border-neutral-800/80" />
    </div>
  );
}
