"use client";

import { useState, ReactNode } from "react";
import OrgContextUpdater from "@/components/OrgContextUpdater";
import { SidebarNav } from "@/components/layouts/Sidebar";
import TopNav from "@/components/layouts/Topbar";
import { Toaster } from "sonner";

interface GlobalUILayoutProps {
  children: ReactNode;
  slug?: string | null;
}

export default function GlobalUILayout({ children, slug = null }: GlobalUILayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Top Navbar */}
      <TopNav isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Sidebar */}
      <SidebarNav isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Main content */}
      <main className="flex-1 pt-14">
        <div className="bg-gray-50 min-h-screen">
        <OrgContextUpdater slug={slug} />
        {children}
        </div>
      </main>

      {/* Toaster */}
      <Toaster richColors position="top-right" />
    </div>
  );
}
