"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Menu } from "lucide-react";

interface PreviewHeaderProps {
  title: string;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function PreviewHeader({ title, setIsSidebarOpen }: PreviewHeaderProps) {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <header className="bg-white h-[64px] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40 border-b border-gray-200 shrink-0">
      <div className="flex items-center gap-4 min-w-0">
        <Link
          href={`/courses/${slug}`}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all group shrink-0 border border-transparent hover:border-gray-100"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="hidden md:inline text-[11px] font-black uppercase tracking-widest">
            Back to Edit
          </span>
        </Link>

        <div className="h-6 w-[1px] bg-gray-200 hidden md:block" />

        <div className="flex flex-col min-w-0">
          <p className="hidden md:block text-[8px] font-black uppercase tracking-[0.3em] text-[#2694C6] leading-none mb-1">Previewing Content</p>
          <h1 className="text-sm md:text-base font-black text-gray-900 truncate uppercase tracking-tight">
            {title || "Untitled Course"}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end mr-4">
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Status</p>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Instructor View</p>
        </div>

        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-2 text-gray-800 hover:bg-gray-50 rounded-md transition-colors border border-gray-100"
        >
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}