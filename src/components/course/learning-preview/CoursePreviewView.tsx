"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api/axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Maximize2, Play, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import PreviewHeader from "./PreviewHeader";
import PreviewSidebar from "./PreviewSidebar";
import PreviewContentTabs, { TabType } from "./PreviewContentTabs";
import PreviewTabContent from "./PreviewTabContent";
import PreviewVideoPlayer from "./PreviewVideoPlayer";
import PreviewTextLesson from "./PreviewTextLesson";
import PreviewDocumentViewer from "./PreviewDocumentViewer";

interface Resource {
    id: number | string;
    title: string;
    resource_type: 'file' | 'link' | 'book_ref';
    file?: string | null;
    external_url?: string | null;
    [key: string]: any;
}

export default function CoursePreviewView() {
    const params = useParams();
    const slug = params.slug as string;

    const [course, setCourse] = useState<any>(null);
    const [activeContent, setActiveContent] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<TabType>("Overview");
    const [isFetching, setIsFetching] = useState(true);
    const [activeResource, setActiveResource] = useState<Resource | null>(null);
    const [viewMode, setViewMode] = useState<'full' | 'pip'>('full');
    const [isPipHidden, setIsPipHidden] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showBanner, setShowBanner] = useState(true);

    useEffect(() => {
        const fetchPreviewData = async () => {
            try {
                const res = await api.get(`/courses/${slug}/learn/`);
                setCourse(res.data);
                if (res.data.modules?.[0]?.lessons?.[0]) {
                    setActiveContent({ type: "lesson", data: res.data.modules[0].lessons[0] });
                }
            } catch (err) {
                toast.error("Preview data unavailable");
            } finally {
                setIsFetching(false);
            }
        };
        fetchPreviewData();
    }, [slug]);

    const handleContentSwitch = useCallback((content: any) => {
        setActiveResource(null);
        setViewMode('full');
        setIsPipHidden(false);
        setActiveContent(content);
        if (["lesson", "quiz", "assignment"].includes(content.type)) setActiveTab("Content");
    }, []);

    const handleCloseResource = () => {
        setActiveResource(null);
        setViewMode('full');
    };

    if (isFetching) return (
        <div className="h-[calc(100vh-72px)] flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 border-2 border-[#2694C6] border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Loading Preview</p>
            </div>
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-72px)] w-full bg-background font-sans overflow-hidden text-gray-900">
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                <AnimatePresence>
                    {showBanner && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-amber-600 text-white shrink-0 overflow-hidden z-[60]"
                        >
                            <div className="px-6 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle size={16} className="text-amber-200" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">Instructor Preview Mode</p>
                                        <p className="text-[9px] font-bold opacity-80 uppercase mt-1">Completion tracking and student interactions are disabled in this view.</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowBanner(false)} className="hover:bg-black/10 p-1 rounded-md transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <PreviewHeader title={course?.title} setIsSidebarOpen={setIsSidebarOpen} />

                <main className="flex-1 overflow-y-auto bg-background 
                    [&::-webkit-scrollbar]:w-2 
                    [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 
                    hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 
                    [&::-webkit-scrollbar-track]:bg-transparent 
                    [&::-webkit-scrollbar-thumb]:rounded-none 
                    [&::-webkit-scrollbar-thumb]:border-x-[1px] 
                    [&::-webkit-scrollbar-thumb]:border-transparent 
                    [&::-webkit-scrollbar-thumb]:bg-clip-content"
                >
                    <div className="max-w-[1600px] mx-auto p-4 md:p-6 pb-20">
                        <div className="min-h-[45vh] flex flex-col relative">
                            {activeContent?.type === 'lesson' && activeContent.data.video_url && (
                                <>
                                    <div className={cn(
                                        "transition-all duration-500 ease-in-out z-[100]",
                                        viewMode === 'pip' 
                                            ? cn(
                                                "fixed bottom-8 left-8 w-[420px] aspect-video shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-md border-2 border-white/10 overflow-hidden bg-black",
                                                isPipHidden ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100"
                                            )
                                            : "relative w-full aspect-video rounded-md overflow-hidden mb-6 border border-gray-100"
                                    )}>
                                        <div className="relative group w-full h-full">
                                            <PreviewVideoPlayer
                                                videoUrl={activeContent.data.video_url.replace(/\\/g, '/')} 
                                                isMini={viewMode === 'pip'}
                                            />
                                            {viewMode === 'pip' && (
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-4">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setIsPipHidden(true)} className="bg-white/10 backdrop-blur-md text-white p-3 rounded-full hover:bg-[#2694C6] border border-white/10 transition-all"><EyeOff size={18} /></button>
                                                        <button onClick={handleCloseResource} className="bg-white/10 backdrop-blur-md text-white p-3 rounded-full hover:bg-[#2694C6] border border-white/10 transition-all"><Maximize2 size={18} /></button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isPipHidden && (
                                            <motion.button
                                                initial={{ scale: 0.5, opacity: 0, x: -20 }}
                                                animate={{ scale: 1, opacity: 1, x: 0 }}
                                                exit={{ scale: 0.5, opacity: 0, x: -20 }}
                                                onClick={() => setIsPipHidden(false)}
                                                className="fixed bottom-8 left-8 z-[110] bg-[#2694C6] text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all border-4 border-white group"
                                            >
                                                <Play size={20} className="fill-current animate-pulse" />
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}

                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={(activeContent?.data?.id || '') + (activeResource?.id || 'main')} 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full flex-1"
                                >
                                    {activeResource ? (
                                        <PreviewDocumentViewer resource={activeResource} onClose={handleCloseResource} />
                                    ) : (
                                        <>
                                            {activeContent?.type === "lesson" && !activeContent.data.video_url && (
                                                <PreviewTextLesson title={activeContent.data.title} content={activeContent.data.content} />
                                            )}
                                            {["quiz", "assignment", "live"].includes(activeContent?.type) && (
                                                <div className="bg-gray-50 border border-gray-100 rounded-md p-20 text-center flex flex-col items-center">
                                                    <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center border border-gray-100 mb-6 text-gray-300">
                                                        <Play size={24} />
                                                    </div>
                                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Interaction Preview</h3>
                                                    <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Interactive logic is disabled for instructors.</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="mt-8">
                            <PreviewContentTabs activeTab={activeTab} setActiveTab={setActiveTab} activeContent={activeContent} />
                            <PreviewTabContent 
                                activeTab={activeTab} 
                                course={course} 
                                activeContent={activeContent} 
                                onOpenResource={(res: Resource) => {
                                    setActiveResource(res);
                                    if (activeContent?.type === 'lesson' && activeContent.data.video_url) setViewMode('pip');
                                }}
                            />
                        </div>
                    </div>
                </main>
            </div>
            
            <PreviewSidebar 
                course={course} 
                activeContent={activeContent} 
                setActiveContent={handleContentSwitch} 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen} 
            />
        </div>
    );
}