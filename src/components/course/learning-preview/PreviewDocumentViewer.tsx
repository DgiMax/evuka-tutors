"use client";

import React, { useState } from "react";
import { 
  X, 
  FileText, 
  Plus, 
  Minus, 
  RotateCw, 
  BookOpen, 
  Headphones,
  List,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Resource {
  id: number | string;
  title: string;
  resource_type: 'file' | 'link' | 'book_ref';
  file?: string | null;
  book_details?: any;
}

export default function PreviewDocumentViewer({ resource, onClose }: { resource: Resource, onClose: () => void }) {
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const isBook = resource.resource_type === 'book_ref';
    const bookData = isBook ? resource.book_details : null;
    const rawUrl = isBook ? bookData?.book_file : resource.file;
    
    const normalizeUrl = (url: string | null | undefined) => {
        if (!url || url.trim() === "") return null;
        const cleanPath = url.replace(/\\/g, '/').replace(/%5C/g, '/');
        if (cleanPath.startsWith('http')) return cleanPath;
        return `${process.env.NEXT_PUBLIC_API_URL}${cleanPath}`;
    };

    const absoluteUrl = normalizeUrl(rawUrl);
    const format = isBook ? bookData?.book_format : absoluteUrl?.split('.').pop()?.toLowerCase();
    
    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(format || '');
    const isAudio = format === 'audio';
    const isPdf = format === 'pdf';
    const hasToc = isBook && bookData?.table_of_contents?.length > 0;

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 20, 300));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 20, 20));
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);

    return (
        <div className="w-full bg-[#1a1a1a] rounded-md border border-gray-800 overflow-hidden flex flex-col h-[80vh] animate-in slide-in-from-bottom-4 duration-500">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#262626] shrink-0 text-white z-10">
                <div className="flex items-center gap-3 overflow-hidden">
                    {hasToc && (
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={cn(
                                "p-2 rounded-md transition-all",
                                isSidebarOpen ? "bg-[#2694C6] text-white" : "hover:bg-white/10 text-gray-400"
                            )}
                        >
                            <List size={18} />
                        </button>
                    )}
                    <div className="p-2 bg-[#2694C6] rounded text-white shrink-0">
                        {isAudio ? <Headphones size={16} /> : isBook ? <BookOpen size={16} /> : <FileText size={16} />}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h3 className="text-[11px] font-black uppercase tracking-widest truncate max-w-[150px] md:max-w-xs">
                            {isBook ? bookData?.title : resource.title}
                        </h3>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                            {format || 'Unknown'} {isBook ? "Edition" : "Preview Mode"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    {isImage && absoluteUrl && (
                        <>
                            <div className="flex items-center bg-black/20 rounded-md p-1 border border-white/5">
                                <button onClick={handleZoomOut} className="p-1.5 hover:bg-white/10 rounded transition-colors"><Minus size={14} /></button>
                                <span className="text-[10px] font-bold w-12 text-center">{zoom}%</span>
                                <button onClick={handleZoomIn} className="p-1.5 hover:bg-white/10 rounded transition-colors"><Plus size={14} /></button>
                            </div>
                            <button onClick={handleRotate} className="p-2 hover:bg-white/10 rounded-md transition-colors border border-white/5">
                                <RotateCw size={16} />
                            </button>
                        </>
                    )}

                    <div className="h-6 w-px bg-white/10 mx-1" />

                    <button onClick={onClose} className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-md transition-all">
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {hasToc && (
                    <div className={cn(
                        "absolute md:relative z-20 h-full bg-[#1e1e1e] border-r border-white/5 transition-all duration-300 ease-in-out overflow-y-auto",
                        isSidebarOpen ? "w-64 translate-x-0 opacity-100" : "w-0 -translate-x-full opacity-0"
                    )}>
                        <div className="p-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2694C6] mb-6">Table of Contents</h4>
                            <nav className="space-y-1">
                                {bookData.table_of_contents.map((item: any, idx: number) => (
                                    <button 
                                        key={idx}
                                        className="w-full text-left p-3 rounded-md text-[11px] font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
                                    >
                                        <span className="text-[#2694C6]/40 mr-2 tabular-nums">{(idx + 1).toString().padStart(2, '0')}</span>
                                        {item.title || item}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                )}

                <div className="flex-1 relative bg-[#121212] overflow-auto flex items-center justify-center">
                    {absoluteUrl && isPdf ? (
                        <iframe 
                            src={`${absoluteUrl}#toolbar=0&view=FitH`} 
                            className="w-full h-full border-none bg-white" 
                            title="Document Preview"
                        />
                    ) : absoluteUrl && isImage ? (
                        <div 
                            className="transition-all duration-300 ease-out p-8"
                            style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
                        >
                            <img 
                                src={absoluteUrl} 
                                alt="Preview" 
                                className="max-w-full max-h-[70vh] rounded border border-white/10" 
                            />
                        </div>
                    ) : absoluteUrl && isAudio ? (
                        <div className="flex flex-col items-center gap-8 p-12 text-center">
                            <div className="w-56 h-56 rounded-xl overflow-hidden border-4 border-white/10 bg-[#1a1a1a]">
                                <img src={bookData?.cover_image || "/placeholder-cover.jpg"} className="w-full h-full object-cover" alt="Cover" />
                            </div>
                            <audio controls className="w-full max-w-md accent-[#2694C6]" controlsList="nodownload">
                                <source src={absoluteUrl} />
                            </audio>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <FileText className="h-10 w-10 text-white/20" />
                            </div>
                            <h4 className="text-white font-black uppercase tracking-[0.2em] text-sm">
                                {absoluteUrl ? "Preview Unavailable" : "Resource Missing"}
                            </h4>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 mb-8 max-w-xs">
                                {absoluteUrl 
                                    ? `This ${format || 'unsupported'} format cannot be viewed directly here.`
                                    : "No valid file found for this resource."
                                }
                            </p>
                            {absoluteUrl && !isBook && (
                                <a href={absoluteUrl} download className="bg-[#2694C6] text-white px-10 py-4 rounded-md text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#1e7ca8] transition-all flex items-center gap-2">
                                    <Download size={14} /> Download for Review
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}