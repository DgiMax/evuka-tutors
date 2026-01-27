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
    <div className="flex min-h-screen bg-gray-50">
      <TopNav isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <SidebarNav isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col pt-14 w-full">
        <div className="flex-1 pb-4">
            <OrgContextUpdater slug={slug} />
            {children}
        </div>
      </main>

      <Toaster richColors position="top-right" />
    </div>
  );
}