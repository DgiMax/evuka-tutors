"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { Loader2, Maximize2, Minimize2, ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api/axios";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- TYPES ---
interface JitsiConfig {
  domain: string;
  room_name: string;
  jwt: string;
  user_info: {
    displayName: string;
    email: string;
  };
  config_overwrite?: {
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
    toolbarButtons?: string[];
  };
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function JitsiClassHostPage() {
  const router = useRouter();
  const params = useParams();

  // Robust ID Extraction
  const lessonId = 
    (params?.lessonId as string) || 
    (params?.id as string) || 
    (params?.slug as string) || 
    "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<JitsiConfig | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  // 1. Fetch Data
  useEffect(() => {
    if (!lessonId) {
        setError("Error: Lesson ID is missing from URL.");
        setLoading(false);
        return;
    }

    const fetchConnectionDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/live/lessons/${lessonId}/join/`);
        
        // Debugging: Check what the backend actually returned
        console.log("Backend Response:", response.data); 
        
        setConfig(response.data);
      } catch (err: any) {
        console.error("API Error:", err);
        const msg = err.response?.data?.error || "Failed to join session.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchConnectionDetails();
  }, [lessonId]);

  // 2. Initialize Jitsi
  const initJitsi = () => {
    if (!window.JitsiMeetExternalAPI || !config || !jitsiContainerRef.current) return;

    if (apiRef.current) apiRef.current.dispose();

    // FAILSAFE: If backend didn't send buttons, use this default list
    const defaultButtons = [
        'microphone', 'camera', 'desktop', 'fullscreen',
        'fodeviceselection', 'hangup', 'chat', 'raisehand',
        'videoquality', 'tileview', 'settings'
    ];

    const toolbarButtons = config.config_overwrite?.toolbarButtons || defaultButtons;

    const options = {
      roomName: config.room_name,
      width: "100%",
      height: "100%",
      parentNode: jitsiContainerRef.current,
      jwt: config.jwt,
      configOverwrite: {
        ...(config.config_overwrite || {}),
        // Force buttons here for modern Jitsi versions
        toolbarButtons: toolbarButtons 
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        // Legacy support
        TOOLBAR_BUTTONS: toolbarButtons,
      },
      userInfo: {
        displayName: config.user_info?.displayName || "Tutor",
        email: config.user_info?.email || "",
      },
    };

    try {
        const api = new window.JitsiMeetExternalAPI(config.domain, options);
        apiRef.current = api;

        api.addEventListeners({
            readyToClose: () => handleExit(),
            videoConferenceLeft: () => handleExit(),
        });
    } catch (e) {
        console.error("Jitsi Init Error:", e);
        toast.error("Failed to load video engine.");
    }
  };

  // 3. Trigger Init
  useEffect(() => {
    if (config && window.JitsiMeetExternalAPI) {
      initJitsi();
    }
    return () => {
      if (apiRef.current) apiRef.current.dispose();
    };
  }, [config]);

  const handleExit = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-950 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
        <p>Connecting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="max-w-md w-full p-6 bg-white rounded shadow text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Connection Failed</h3>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={handleExit} variant="outline">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col bg-black transition-all duration-300 ${isExpanded ? "fixed inset-0 z-[100] h-screen w-screen" : "h-screen w-full"}`}>
      
      {/* Change this URL to your custom domain if needed */}
      <Script 
        src="https://meet.e-vuka.com/external_api.js" 
        strategy="afterInteractive"
        onLoad={() => { if(config) initJitsi(); }}
      />

      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {!isExpanded && (
          <Button onClick={handleExit} variant="secondary" size="sm" className="bg-black/50 text-white border-none">
            <ArrowLeft className="mr-2 h-4 w-4" /> Exit
          </Button>
        )}
      </div>

      <div className="absolute top-4 right-4 z-10">
        <Button onClick={() => setIsExpanded(!isExpanded)} variant="secondary" size="sm" className="bg-black/50 text-white border-none">
          {isExpanded ? <Minimize2 className="mr-2 h-4 w-4" /> : <Maximize2 className="mr-2 h-4 w-4" />}
          {isExpanded ? "Exit Focus" : "Focus Mode"}
        </Button>
      </div>

      <div ref={jitsiContainerRef} className="w-full h-full bg-[#040404]" />
    </div>
  );
}