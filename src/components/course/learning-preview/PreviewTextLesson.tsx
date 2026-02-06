"use client";

import React, { useRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { BookOpen, CheckCircle2, Lock, Clock, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PreviewTextLessonProps {
  title: string;
  content: string;
}

export default function PreviewTextLesson({
  title,
  content,
}: PreviewTextLessonProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isContentLoading, setIsContentLoading] = useState(true);

  useEffect(() => {
    setIsContentLoading(true);
    const timeout = setTimeout(() => setIsContentLoading(false), 400);
    return () => clearTimeout(timeout);
  }, [title]);

  useEffect(() => {
    const handleScroll = () => {
      const element = scrollContainerRef.current;
      if (!element) return;
      const { scrollTop, scrollHeight, clientHeight } = element;
      const totalHeight = scrollHeight - clientHeight;
      const status = totalHeight > 0 ? (scrollTop / totalHeight) * 100 : 0;
      setReadingProgress(status);
    };

    const container = scrollContainerRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [title]);

  return (
    <div className="w-full bg-white rounded-md border border-gray-200 overflow-hidden flex flex-col h-[75vh] animate-in fade-in duration-500 relative">
      <div className="h-1 w-full bg-gray-50 shrink-0">
        <div 
          className="h-full bg-[#2694C6] transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="px-6 py-2 border-b border-gray-100 flex items-center justify-between bg-white shrink-0 min-h-[52px]">
        <div className="flex items-center gap-3 min-w-0">
          <BookOpen className="w-4 h-4 text-[#2694C6] shrink-0 hidden sm:block" />
          <h2 className="text-[12px] font-black text-gray-900 truncate tracking-tight uppercase">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-sm border border-gray-100">
            <Clock size={12} />
            <span>Preview Mode</span>
          </div>
          
          <button
            disabled
            className="flex items-center gap-2 px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all border border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed shrink-0"
          >
            <Lock size={12} />
            Mark Done
          </button>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 md:px-10 pt-8 pb-12 scroll-smooth bg-white
        [&::-webkit-scrollbar]:w-1.5 
        [&::-webkit-scrollbar-thumb]:bg-gray-200 
        hover:[&::-webkit-scrollbar-thumb]:bg-gray-300"
      >
        <AnimatePresence mode="wait">
          {isContentLoading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-white z-10"
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#2694C6]/40" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">Rendering Draft</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="prose prose-slate max-w-none"
            >
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({...p}) => <h1 className="text-3xl font-black text-gray-900 mt-2 mb-6 tracking-tighter uppercase" {...p} />,
                  h2: ({...p}) => <h2 className="text-xl font-black text-gray-900 mt-10 mb-4 tracking-tight border-b border-gray-100 pb-2 uppercase" {...p} />,
                  h3: ({...p}) => <h3 className="text-lg font-bold text-gray-900 mt-8 mb-3 uppercase" {...p} />,
                  p: ({...p}) => <p className="text-[15px] leading-[1.7] mb-6 text-gray-600 font-medium" {...p} />,
                  ul: ({...p}) => <ul className="list-disc pl-5 mb-6 space-y-2 text-gray-600 font-medium" {...p} />,
                  ol: ({...p}) => <ol className="list-decimal pl-5 mb-6 space-y-2 text-gray-600 font-medium" {...p} />,
                  blockquote: ({...p}) => (
                    <blockquote className="border-l-4 border-[#2694C6] bg-gray-50 p-5 italic rounded-r-md my-8 text-gray-700 font-medium" {...p} />
                  ),
                  code: ({node, inline, className, children, ...p}: any) => (
                    <code className={cn(
                      "bg-gray-100 text-[#2694C6] px-1.5 py-0.5 rounded font-mono text-xs font-bold",
                      !inline && "block p-5 bg-gray-900 text-gray-100 border border-gray-800 overflow-x-auto my-8 rounded-md leading-relaxed"
                    )} {...p}>
                      {children}
                    </code>
                  ),
                  a: ({...p}) => <a className="text-[#2694C6] font-black underline underline-offset-4 hover:text-[#1e7ca8]" target="_blank" rel="noopener noreferrer" {...p} />,
                  img: ({...p}) => <img className="rounded-md border border-gray-100 shadow-sm mx-auto my-10 max-h-[450px] object-contain" alt="" {...p} />,
                  hr: () => <hr className="my-10 border-gray-100" />,
                }}
              >
                {content || "_No descriptive content provided for this lesson._"}
              </ReactMarkdown>

              <div className="mt-12 py-8 border-t border-gray-100 flex flex-col items-center opacity-30">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">Preview End</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}