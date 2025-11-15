"use client";

import { Menu, X } from "lucide-react";
import OrganizationSwitcher from "@/components/ui/OrganizationSwitcher";
import Image from "next/image";

type TopNavProps = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
};

export default function TopNav({ isSidebarOpen, setIsSidebarOpen }: TopNavProps) {
  return (
    // UPDATED: Themed with bg-background and border-border
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-background border-b border-border h-14 px-4">
      
      {/* LEFT: Burger + Logo */}
      <div className="flex items-center gap-3">
        {/* UPDATED: Themed button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          // UPDATED: Removed all hover, focus, and background styles
          className="p-2 text-foreground rounded-md focus:outline-none focus:ring-0"
        >
          {isSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <Image
            src="/logo.png" // Assuming /logo.png is in your /public folder
            alt="Logo"
            width={100}
            height={24}
            className="object-contain"
          />
        </div>
      </div>

      <OrganizationSwitcher
        triggerClassName="text-sm text-foreground rounded-md"
      />
    </nav>
  );
}