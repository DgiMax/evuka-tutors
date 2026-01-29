"use client";

import { useState } from "react";
import { ChevronDown, PlayCircle, Lock, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const CourseModulesClient = ({ modules }: { modules: any[] }) => {
  const [openModule, setOpenModule] = useState<number | null>(0);

  const totalLessons = modules?.reduce((acc, m) => acc + (m.lessons_count || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-foreground tracking-tight">Course content</h2>
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <span>{modules?.length || 0} sections</span>
          <span className="opacity-30">•</span>
          <span>{totalLessons} lectures</span>
        </div>
      </div>

      <div className="border border-border rounded-md divide-y divide-border bg-card">
        {modules?.map((module, index) => {
          const isOpen = openModule === index;
          return (
            <div key={index}>
              <button
                onClick={() => setOpenModule(isOpen ? null : index)}
                className={cn(
                  "w-full px-6 py-4 flex items-center justify-between transition-colors bg-muted/20 hover:bg-muted/40",
                  isOpen && "border-b border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-180")} />
                  <span className="font-black text-sm text-foreground">{module.title}</span>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {module.lessons_count || 0} lectures
                </span>
              </button>

              {isOpen && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  {module.lessons?.map((lesson: any, i: number) => (
                    <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-border last:border-none group hover:bg-muted/5 transition-colors">
                      <div className="flex items-center gap-3">
                        {lesson.is_preview ? (
                          <PlayCircle size={14} className="text-foreground" />
                        ) : (
                          <Lock size={14} className="text-muted-foreground/30" />
                        )}
                        <span className={cn(
                          "text-sm font-medium",
                          lesson.is_preview ? "text-foreground cursor-pointer hover:underline underline-offset-4" : "text-muted-foreground/70"
                        )}>
                          {lesson.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {lesson.is_preview && (
                          <span className="text-[10px] font-black text-[#2694C6] uppercase border-b border-[#2694C6]">Preview</span>
                        )}
                        <span className="text-[11px] font-medium text-muted-foreground">{lesson.estimated_duration_minutes || 0}:00</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};