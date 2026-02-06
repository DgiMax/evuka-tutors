"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  ChevronDown,
  CheckCircle,
  HelpCircle,
  FileText,
  Video,
  PlayCircle,
} from "lucide-react";

interface PreviewSidebarProps {
  course: any;
  activeContent: any;
  setActiveContent: (content: any) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function PreviewSidebar({
  course,
  activeContent,
  setActiveContent,
  isOpen,
  setIsOpen,
}: PreviewSidebarProps) {
  const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>({ 0: true });

  if (!course) return null;

  const toggleSection = (index: number) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleItemClick = (type: string, item: any) => {
    setActiveContent({ type, data: item });
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const renderItem = (item: any, type: string, isNested = false) => {
    const isActive = activeContent?.type === type && activeContent.data.id === item.id;
    
    let Icon = Video;
    if (type === "quiz") Icon = HelpCircle;
    if (type === "assignment") Icon = FileText;

    return (
      <li
        key={`${type}-${item.id}`}
        onClick={() => handleItemClick(type, item)}
        className={cn(
          "flex items-center justify-between border-l-4 cursor-pointer transition-all pr-4 text-sm group select-none",
          isActive
            ? "bg-[#2694C6]/10 border-[#2694C6] text-gray-900 font-bold"
            : "hover:bg-gray-50 border-transparent text-gray-600 hover:text-gray-900"
        )}
      >
        <span className={cn("py-3.5 flex-1 flex items-center min-w-0", isNested ? "pl-10" : "pl-4")}>
          <Icon className={cn(
            "mr-3 w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
            isActive ? "text-[#2694C6]" : "text-gray-400"
          )} />
          <span className="truncate block w-full tracking-tight text-[11px] uppercase font-bold">{item.title}</span>
        </span>

        {type === "lesson" && (
          <div className="flex items-center gap-2 shrink-0">
            <CheckCircle className="w-4 h-4 text-gray-200" />
          </div>
        )}
      </li>
    );
  };

  return (
    <aside
      className={cn(
        "fixed top-[72px] right-0 h-[calc(100vh-72px)] w-full bg-white border-l border-gray-200 flex flex-col z-[100] transition-transform duration-300 ease-in-out lg:w-80 lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="p-5 flex justify-between items-center border-b border-gray-200 bg-white shrink-0 h-[64px]">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Curriculum Preview</h2>
        <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-black">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5">
        {course.modules?.map((module: any, mIdx: number) => (
          <div key={module.id} className="border-b border-gray-100 last:border-0">
            <button
              onClick={() => toggleSection(mIdx)}
              className={cn(
                "w-full px-5 py-4 flex justify-between items-center text-left transition-all",
                openSections[mIdx] ? "bg-gray-50/50" : "bg-white hover:bg-gray-50"
              )}
            >
              <span className="font-black text-gray-900 text-[10px] uppercase tracking-[0.15em] truncate">
                {module.title}
              </span>
              <ChevronDown className={cn(
                "w-3.5 h-3.5 text-gray-400 transition-transform duration-300",
                openSections[mIdx] && "rotate-180"
              )} />
            </button>

            {openSections[mIdx] && (
              <ul className="bg-white animate-in slide-in-from-top-1 duration-200">
                {module.lessons?.map((lesson: any) => (
                  <React.Fragment key={lesson.id}>
                    {renderItem(lesson, "lesson")}
                    {lesson.quizzes?.map((quiz: any) => renderItem(quiz, "quiz", true))}
                  </React.Fragment>
                ))}
                {module.assignments?.map((assignment: any) => renderItem(assignment, "assignment"))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-200 shrink-0">
        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">
          <span>Preview Completion</span>
          <span className="text-[#2694C6]">0%</span>
        </div>
        <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gray-300 w-0 transition-all duration-500" />
        </div>
        <p className="mt-4 text-[8px] font-bold text-gray-400 uppercase tracking-tight text-center italic">
          Progress tracking disabled in preview
        </p>
      </div>
    </aside>
  );
}