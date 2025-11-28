// src/app/(global)/courses/[slug]/live-classes/[class_slug]/manage/class/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from 'react';
import Link from "next/link";
import { Loader2, Video, Copy, Zap } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api/axios";

// --- Styling Constants ---
const PRIMARY_TEXT_CLASS: string = "text-[#2694C6]";
const PRIMARY_BUTTON_CLASS: string = "bg-[#2694C6] hover:bg-[#1f7ba5] transition-colors"; 
const HEADER_BG_CLASS: string = "bg-gray-900 border-b border-gray-700"; // Darker, premium header

// --- Helper function to copy text to clipboard ---
const fallbackCopy = (text: string): void => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed'; 
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        const successful = document.execCommand('copy');
        if (!successful) throw new Error('execCommand failed');
        toast.success("Link copied to clipboard!");
    } catch (err) {
        toast.error("Failed to copy link.");
    }
    document.body.removeChild(textarea);
};

const copyToClipboard = (text: string): void => {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            toast.success("Link copied to clipboard!");
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
};

// --- Core Component to fetch URL and render Jitsi ---
function JitsiClassHostContent() {
    const searchParams = useSearchParams();
    const lessonIdParam = searchParams.get("lessonId");
    const lessonId = lessonIdParam ? parseInt(lessonIdParam) : null;

    const [meetingUrl, setMeetingUrl] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // --- Fetch Meeting URL ---
    useEffect(() => {
        if (!lessonId) {
            setError("Error: Lesson ID is missing from the URL.");
            setLoading(false);
            return;
        }

        const fetchMeetingUrl = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/live/lessons/${lessonId}/join/`);
                const { meeting_url } = response.data;
                setMeetingUrl(meeting_url);
            } catch (err) {
                console.error("Jitsi URL fetch error:", err);
                setError("Failed to fetch meeting link. Please check your authentication status or lesson availability.");
            } finally {
                setLoading(false);
            }
        };

        fetchMeetingUrl();
    }, [lessonId]);

    const handleCopy = useCallback(() => {
        copyToClipboard(meetingUrl);
    }, [meetingUrl]);

    // --- Loading and Error States ---
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-[#2694C6]" />
                <p className="ml-3 text-lg font-medium text-gray-700">Securing meeting link...</p>
            </div>
        );
    }

    if (error || !meetingUrl) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-screen bg-gray-50">
                <Video size={48} className="text-red-500 mb-4"/>
                <p className="text-2xl font-semibold text-red-600 mb-2">Could Not Join Class</p>
                <p className="text-gray-600 mb-8 max-w-sm">{error || "Could not load meeting URL. Please ensure the lesson is currently joinable."}</p>
                <Link href="/tutor/courses" className={`text-white py-3 px-8 rounded-lg font-semibold ${PRIMARY_BUTTON_CLASS}`}>
                    Go to Courses
                </Link>
            </div>
        );
    }

    // --- Render Meeting ---
    const displayLink = meetingUrl.split('?')[0];
    const roomName = displayLink.substring(displayLink.lastIndexOf('/') + 1);

    return (
        // FIXED: Using h-screen/w-screen on the main wrapper
        <div className="h-screen w-screen flex flex-col bg-gray-50 font-sans antialiased">
            
            {/* Professional, Responsive Header */}
            <header className={`flex-shrink-0 ${HEADER_BG_CLASS} h-16 w-full`}>
                <div className="h-full px-4 flex items-center justify-between">
                    
                    {/* Meeting Info (Responsive Typography and Truncation) */}
                    <div className="flex items-center space-x-2 min-w-0 pr-2 sm:pr-4">
                        <Zap size={20} className={`text-yellow-400 flex-shrink-0`} />
                        <h1 className="text-sm sm:text-xl font-bold text-white truncate min-w-0">
                            {/* Hidden on small screens to prioritize room name */}
                            <span className="hidden md:inline text-gray-400 mr-2">Host:</span> 
                            <span className="truncate">
                                {roomName.replace(/-/g, ' ').toUpperCase()}
                            </span>
                        </h1>
                        {/* Live Status Badge */}
                        <span className="hidden sm:inline-flex items-center px-3 py-1 text-xs font-medium bg-green-500/20 text-green-300 rounded-full flex-shrink-0">
                            LIVE
                        </span>
                    </div>

                    {/* Share Link and Button (Fixed Spacing and Sizing) */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        {/* Hidden link on mobile, shown on large screens */}
                        <span className="hidden lg:inline text-sm text-gray-400 truncate max-w-xs xl:max-w-md">
                            {displayLink}
                        </span>
                        
                        <button
                            onClick={handleCopy}
                            className={`flex items-center text-white font-medium py-2 px-3 rounded-lg text-sm whitespace-nowrap shadow-md hover:opacity-90 transition-opacity ${PRIMARY_BUTTON_CLASS}`}
                        >
                            <Copy size={16} className="mr-1 sm:mr-2" />
                            {/* Text is hidden on XS screens */}
                            <span className="hidden sm:inline">Copy Invite Link</span>
                            <span className="sm:hidden">Invite</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Jitsi Iframe Container (FIXED: h-full w-full ensures it uses all available space) */}
            <main className="flex-grow w-full h-full">
                <iframe
                    src={meetingUrl}
                    allow="camera; microphone; display-capture; autoplay; fullscreen"
                    // FIXED: h-full and w-full are crucial here
                    className="w-full h-full border-none"
                    title="Jitsi Video Conference"
                />
            </main>
        </div>
    );
}

// Wrapper component required by Next.js to use useSearchParams
export default function JitsiClassHostPage() {
    return (
        // The outer wrapper is now strictly h-screen
        <div className="h-screen w-screen overflow-hidden"> 
            <Suspense fallback={
                <div className="flex justify-center items-center h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    <p className="ml-2 text-gray-500">Initializing class...</p>
                </div>
            }>
                <JitsiClassHostContent />
            </Suspense>
        </div>
    );
}