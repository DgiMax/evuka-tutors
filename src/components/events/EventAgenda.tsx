"use client";

import React, { useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type AgendaItem = {
  id?: number;
  time: string;
  title: string;
  description: string;
};

export const EventAgenda = ({ agenda }: { agenda: AgendaItem[] }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) =>
    setOpenIndex(openIndex === index ? null : index);

  if (!agenda?.length) {
    return (
      <div className="p-8 border-2 border-dashed border-border rounded-md text-center">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          No agenda items scheduled
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {agenda.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div 
            key={index} 
            className={cn(
              "border rounded-md transition-all duration-200",
              isOpen ? "border-[#2694C6] bg-muted/5" : "border-border hover:border-border/80"
            )}
          >
            <button
              onClick={() => toggle(index)}
              className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-black uppercase tracking-tighter border transition-colors",
                  isOpen 
                    ? "bg-[#2694C6] text-white border-[#2694C6]" 
                    : "bg-muted text-muted-foreground border-border"
                )}>
                  <Clock size={12} />
                  {item.time}
                </div>
                <span className="font-black text-sm uppercase tracking-wider text-foreground">
                  {item.title}
                </span>
              </div>
              
              <ChevronDown 
                size={18} 
                className={cn(
                  "text-muted-foreground transition-transform duration-300 shrink-0 self-end sm:self-center",
                  isOpen ? "rotate-180 text-[#2694C6]" : "group-hover:text-foreground"
                )} 
              />
            </button>

            <div className={cn(
              "grid transition-all duration-300 ease-in-out",
              isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}>
              <div className="overflow-hidden">
                <div className="px-4 pb-4 pt-0">
                  <div className="p-4 rounded-sm bg-muted/30 border-l-2 border-[#2694C6] text-sm text-muted-foreground font-medium leading-relaxed">
                    {item.description || "No further details provided for this segment."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};