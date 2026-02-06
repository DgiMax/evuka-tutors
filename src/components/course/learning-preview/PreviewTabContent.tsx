"use client";

import React from "react";
import PreviewResourceTab from "./PreviewResourceTab";
import PreviewTextLesson from "./PreviewTextLesson";
import { Lock, Play } from "lucide-react";

export default function PreviewTabContent({ activeTab, course, activeContent, onOpenResource }: any) {
    if (!course) return null;

    const Placeholder = ({ title }: { title: string }) => (
        <div className="py-24 text-center bg-gray-50 border border-gray-100 rounded-md flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center border border-gray-100 mb-4 text-gray-300">
                <Lock size={18} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">{title} Disabled</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Only available in active student sessions</p>
        </div>
    );

    switch (activeTab) {
        case 'Overview':
            return (
                <div className="p-8 md:p-10 bg-white border border-gray-200 border-t-0 rounded-b-md">
                    <h3 className="text-xl font-black tracking-tight mb-6 text-gray-900 uppercase">Course Description</h3>
                    <div className="text-gray-600 text-sm font-medium leading-relaxed max-w-4xl">
                        {course.long_description || "No description provided."}
                    </div>
                </div>
            );
        case 'Content':
            if (activeContent?.type === 'lesson' && !activeContent.data.video_url) {
                return (
                    <div className="p-8 md:p-10 bg-white border border-gray-200 border-t-0 rounded-b-md">
                        <PreviewTextLesson title={activeContent.data.title} content={activeContent.data.content} />
                    </div>
                );
            }
            if (["quiz", "assignment", "live"].includes(activeContent?.type)) {
                return (
                    <div className="p-8 md:p-10 bg-white border border-gray-200 border-t-0 rounded-b-md">
                        <div className="bg-gray-50 border border-gray-100 rounded-md p-20 text-center flex flex-col items-center">
                            <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center border border-gray-100 mb-6 text-gray-300">
                                <Play size={24} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Interaction Preview</h3>
                            <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Logic disabled for instructors.</p>
                        </div>
                    </div>
                );
            }
            return (
                <div className="p-20 text-center bg-white border border-gray-200 border-t-0 rounded-b-md">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Video active in stage above</p>
                </div>
            );
        case 'Resources':
            return (
                <div className="p-8 md:p-10 bg-white border border-gray-200 border-t-0 rounded-b-md">
                    <PreviewResourceTab lesson={activeContent?.data} onOpenResource={onOpenResource} />
                </div>
            );
        case 'Notes':
            return <div className="p-8 md:p-10 bg-white border border-gray-200 border-t-0 rounded-b-md"><Placeholder title="Personal Notes" /></div>;
        case 'Announcements':
            return <div className="p-8 md:p-10 bg-white border border-gray-200 border-t-0 rounded-b-md"><Placeholder title="Announcements" /></div>;
        case 'Q&A':
            return <div className="p-8 md:p-10 bg-white border border-gray-200 border-t-0 rounded-b-md"><Placeholder title="Discussion Board" /></div>;
        default:
            return null;
    }
}