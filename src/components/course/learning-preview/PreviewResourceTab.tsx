"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { FileText, Image as ImageIcon, Link as LinkIcon, BookOpen, Download, File } from "lucide-react";

export default function PreviewResourceTab({ lesson, onOpenResource }: any) {
    const resources = lesson?.resources || [];

    if (resources.length === 0) {
        return (
            <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-md bg-gray-50/30">
                <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No materials uploaded for this lesson</p>
            </div>
        );
    }

    const getFileMetadata = (res: any) => {
        if (res.resource_type === 'link') return { icon: <LinkIcon size={18} />, color: "bg-blue-50 border-blue-100 text-blue-600" };
        if (res.resource_type === 'book_ref') return { icon: <BookOpen size={18} />, color: "bg-orange-50 border-orange-100 text-orange-600" };
        
        const ext = res.file?.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return { icon: <ImageIcon size={18} />, color: "bg-emerald-50 border-emerald-100 text-emerald-600" };
        if (ext === 'pdf') return { icon: <FileText size={18} />, color: "bg-rose-50 border-rose-100 text-rose-600" };
        
        return { icon: <Download size={18} />, color: "bg-cyan-50 border-cyan-100 text-cyan-600" };
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((res: any) => {
                const meta = getFileMetadata(res);
                return (
                    <div key={res.id} className="flex flex-col bg-white border border-gray-100 rounded-md overflow-hidden hover:border-[#2694C6] transition-all group">
                        <div className="p-4 flex-1">
                            <div className="flex items-start gap-3 mb-3">
                                <div className={cn("p-2 rounded-md border shrink-0", meta.color)}>
                                    {meta.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-gray-900 truncate text-[12px] uppercase tracking-tight leading-tight">{res.title}</p>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">{res.resource_type.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 pb-4">
                            <button 
                                onClick={() => onOpenResource(res)}
                                className="w-full py-2.5 bg-gray-50 border border-gray-100 text-gray-900 rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-[#2694C6] hover:text-white hover:border-[#2694C6] transition-all"
                            >
                                Preview Material
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}