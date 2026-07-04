"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import MobileHeader from "@/components/MobileHeader";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="bg-black text-white font-lexend font-light min-h-screen flex flex-col lg:flex-row relative overflow-x-clip">
        <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 min-h-screen overflow-x-hidden w-full lg:max-w-[calc(100vw-300px)]">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
