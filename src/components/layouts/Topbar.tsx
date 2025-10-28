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
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white border-b h-14 px-4">
      {/* LEFT: Burger + Logo */}
      <div className="flex items-center gap-3">
        <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="p-2 text-black rounded focus:outline-none focus:ring-0 active:outline-none hover:bg-transparent transition-none"
        >
        {isSidebarOpen ? (
            <X className="h-5 w-5 text-black" />
        ) : (
            <Menu className="h-5 w-5 text-black" />
        )}
        </button>

        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Logo"
            width={100}
            height={24}
            className="object-contain"
          />
        </div>
      </div>

      {/* RIGHT: Organization Switcher */}
      <OrganizationSwitcher triggerClassName="min-w-[180px] text-sm text-black" />
    </nav>
  );
}
