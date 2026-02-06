"use client";

import { useState, ReactNode, useMemo } from "react";
import OrgContextUpdater from "@/components/OrgContextUpdater";
import { SidebarNav } from "@/components/layouts/Sidebar";
import TopNav from "@/components/layouts/Topbar";
import { Toaster } from "sonner";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { Loader2 } from "lucide-react";

export default function GlobalUILayout({ children, slug = null }: { children: ReactNode; slug?: string | null }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isVerifying, activeSlug } = useActiveOrg();

  const isAuthorized = useMemo(() => {
    if (!slug) return true;
    return activeSlug === slug && !isVerifying;
  }, [slug, activeSlug, isVerifying]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TopNav isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <SidebarNav isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col pt-14 w-full">
        <div className="flex-1 pb-4">
          <OrgContextUpdater slug={slug} />
          
          {!isAuthorized ? (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#2694C6]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                  Verifying Secure Session...
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              {children}
            </div>
          )}
        </div>
      </main>

      <Toaster richColors position="top-right" />
    </div>
  );
}