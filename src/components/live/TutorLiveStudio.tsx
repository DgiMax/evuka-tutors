"use client";

import '@livekit/components-styles';
import {
  LiveKitRoom,
  VideoConference,
  useRoomContext,
  useLocalParticipant,
} from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Loader2, RotateCcw, Lock, Unlock, Clock, 
  FileText, Plus, X, Trash2, UploadCloud, AlertTriangle
} from 'lucide-react';
import api from '@/lib/api/axios';
import { toast } from 'sonner';
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";

interface Resource {
  id: number;
  title: string;
  file: string;
}

interface WaitInfo {
  message: string;
  openAt: Date;
}

interface JoinResponse {
  token: string;
  url: string;
  is_host: boolean;
  effective_end_time: string;
  resources: Resource[];
}

// 1. Fixed Interface: Renamed 'initialResources' to 'resources' to match usage
interface TutorClassroomProps {
  lessonId: string;
  initialEndTime: Date | null;
  resources: Resource[]; 
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
}

// --- Reusable Modal Component ---
function Modal({ title, isOpen, onClose, children }: { title: string, isOpen: boolean, onClose: () => void, children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function TutorLiveStudio() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params?.lessonId as string;
  const { activeSlug } = useActiveOrg();
  
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");
  const [effectiveEndTime, setEffectiveEndTime] = useState<Date | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [waitInfo, setWaitInfo] = useState<WaitInfo | null>(null);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get<JoinResponse>(`/live/lessons/${lessonId}/join/`);
        
        if (!data.is_host) {
            toast.error("Unauthorized: This view is for Tutors only.");
            router.push('/'); 
            return;
        }

        setToken(data.token);
        setUrl(data.url);
        setEffectiveEndTime(new Date(data.effective_end_time));
        setResources(data.resources || []);
        setIsLoading(false);

      } catch (e: any) {
        setIsLoading(false);
        if (e.response?.status === 403 && e.response?.data?.error === 'too_early') {
          setWaitInfo({
            message: e.response.data.message,
            openAt: new Date(e.response.data.open_at)
          });
        } else {
          toast.error("Failed to join session");
        }
      }
    };

    if (lessonId) initSession();
  }, [lessonId, router]);

  useEffect(() => {
    const checkOrientation = () => {
      if (window.innerWidth < window.innerHeight && window.innerWidth < 768) {
        setIsMobilePortrait(true);
      } else {
        setIsMobilePortrait(false);
      }
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const handleDisconnect = () => {
    const basePath = activeSlug ? `/${activeSlug}` : '';
    router.push(`${basePath}`);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-zinc-400 animate-pulse text-sm">Preparing classroom environment...</p>
      </div>
    );
  }

  if (waitInfo) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-md max-w-md w-full shadow-2xl">
          <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Class Not Started</h2>
          <p className="text-zinc-400 mb-6">{waitInfo.message}</p>
          <div className="bg-blue-900/20 text-blue-400 py-2 px-4 rounded-md text-sm inline-block">
            Opens at {waitInfo.openAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 w-full bg-zinc-800 hover:bg-zinc-700 py-3 rounded-md font-medium transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div 
      className="relative bg-zinc-950 overflow-hidden"
      data-lk-theme="default"
      style={
        isMobilePortrait ? {
          width: "100vh", height: "100vw", transform: "rotate(90deg)",
          transformOrigin: "bottom left", position: "absolute",
          top: "-100vw", left: "0", zIndex: 50,
        } : { width: "100%", height: "100vh" }
      }
    >
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={url}
        connect={true}
        onDisconnected={handleDisconnect}
        className="h-full w-full"
      >
        {/* 2. Fixed Props Passing: Passed 'resources' instead of 'initialResources' */}
        <TutorClassroomWrapper 
          lessonId={lessonId}
          initialEndTime={effectiveEndTime}
          resources={resources}
          setResources={setResources}
        />
      </LiveKitRoom>
    </div>
  );
}

// 3. Updated Destructuring to match the Interface
function TutorClassroomWrapper({ lessonId, initialEndTime, resources, setResources }: TutorClassroomProps) {
  return (
    <div className="relative h-full w-full">
      <VideoConference />
      <TutorRoomManager 
        lessonId={lessonId} 
        initialEndTime={initialEndTime}
        resources={resources}
        setResources={setResources}
      />
    </div>
  );
}

function TutorRoomManager({ lessonId, initialEndTime, resources, setResources }: TutorClassroomProps) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  
  const [endTime, setEndTime] = useState<Date | null>(initialEndTime);
  const [timeLeft, setTimeLeft] = useState("");
  const [isMicLocked, setIsMicLocked] = useState(false);
  const [isCameraLocked, setIsCameraLocked] = useState(false);
  
  // Modal States
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [uploading, setUploading] = useState(false);

  // --- Logic ---

  useEffect(() => {
    if (!room) return;

    // 1. Listen for Lock States (To sync UI)
    const handleMetadata = (metadata: string | undefined) => {
      if (metadata) {
        try {
          const data = JSON.parse(metadata);
          setIsMicLocked(data.mic_locked);
          setIsCameraLocked(data.camera_locked);
        } catch(e) { console.error(e); }
      }
    };

    // 2. Listen for Student Events (Raise Hand)
    const handleData = (payload: Uint8Array, participant: any) => {
      const decoder = new TextDecoder();
      const strData = decoder.decode(payload);
      const data = JSON.parse(strData);

      if (data.type === 'RAISE_HAND') {
        // Tutor sees who raised hand
        toast.info(`${participant.identity} raised their hand! ✋`, {
            duration: 5000,
            position: 'top-center'
        });
      }
      
      if (data.type === 'TIME_EXTENDED') {
        setEndTime(new Date(data.new_end_time));
        setShowTimeWarning(false);
      }
    };

    handleMetadata(room.metadata);

    room.on(RoomEvent.RoomMetadataChanged, handleMetadata);
    room.on(RoomEvent.DataReceived, handleData);

    return () => {
      room.off(RoomEvent.RoomMetadataChanged, handleMetadata);
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, localParticipant]);

  // Timer & Warning Logic
  useEffect(() => {
    const timer = setInterval(() => {
      if (!endTime) return;
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Ended");
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
        
        // Exact 10 minute warning for Tutor
        if (mins === 10 && secs === 0) {
           setShowTimeWarning(true);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);
  
  const toggleLock = async (target: 'mic' | 'camera') => {
    const currentState = target === 'mic' ? isMicLocked : isCameraLocked;
    
    try {
      await api.post(`/live/lessons/${lessonId}/toggle_lock/`, {
        target,
        locked: !currentState
      });
      // Optimistic update
      if (target === 'mic') setIsMicLocked(!currentState);
      if (target === 'camera') setIsCameraLocked(!currentState);
      toast.success(`${target === 'mic' ? 'Microphone' : 'Camera'} ${!currentState ? 'Locked' : 'Unlocked'}`);
    } catch (e) {
      toast.error("Failed to toggle lock");
    }
  };

  const extendTime = async () => {
    try {
      const { data } = await api.post(`/live/lessons/${lessonId}/extend_time/`, { minutes: 15 });
      setEndTime(new Date(data.new_end_time));
      
      const msg = JSON.stringify({ 
        type: 'TIME_EXTENDED', 
        new_end_time: data.new_end_time,
        minutes: 15 
      });
      const encoder = new TextEncoder();
      localParticipant.publishData(encoder.encode(msg), { reliable: true });
      setShowTimeWarning(false);
      toast.success("Class extended by 15 minutes");
      
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed to extend time");
    }
  };

  const uploadResource = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setUploading(true);
      const { data } = await api.post(`/live/lessons/${lessonId}/upload_resource/`, formData);
      setResources(prev => [...prev, data]);
      setUploading(false);
      toast.success("Resource uploaded successfully");
    } catch (e) {
      setUploading(false);
      toast.error("Upload failed");
    }
  };

  const deleteResource = async (id: number) => {
    setResources(prev => prev.filter(r => r.id !== id));
    toast.success("Resource removed");
  };

  // Logic to hide controls when a modal is open
  const areControlsVisible = !isResourceModalOpen && !showTimeWarning;

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      
      {/* 1. Timer Display (Top Left) */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto bg-black/60 backdrop-blur-md rounded-md p-2 text-white flex items-center gap-4 border border-white/10">
        <div className={`flex items-center gap-2 font-mono ${timeLeft === 'Ended' ? 'text-red-500' : 'text-green-400'}`}>
          <Clock className="h-4 w-4" />
          <span className="font-bold">{timeLeft}</span>
        </div>
      </div>

      {/* 2. Tutor Control Panel (Left Side - Fixed Position) */}
      {areControlsVisible && (
        <div className="absolute top-20 left-4 z-20 pointer-events-auto flex flex-col gap-3 w-48 animate-in slide-in-from-left-4 fade-in duration-300">
          
          {/* Lock Controls */}
          <div className="bg-zinc-950/90 backdrop-blur-md p-3 rounded-md border border-zinc-800 space-y-2 shadow-lg">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Class Controls</h4>
            <button 
              onClick={() => toggleLock('mic')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${isMicLocked ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            >
              <span className="flex items-center gap-2">
                {isMicLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                Mic
              </span>
              <span className="text-[10px] uppercase font-bold">{isMicLocked ? 'Locked' : 'Open'}</span>
            </button>
            
            <button 
              onClick={() => toggleLock('camera')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${isCameraLocked ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            >
              <span className="flex items-center gap-2">
                {isCameraLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                Camera
              </span>
              <span className="text-[10px] uppercase font-bold">{isCameraLocked ? 'Locked' : 'Open'}</span>
            </button>
          </div>

          {/* Tools */}
          <div className="bg-zinc-950/90 backdrop-blur-md p-3 rounded-md border border-zinc-800 space-y-2 shadow-lg">
             <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Tools</h4>
             
             <button 
               onClick={() => setIsResourceModalOpen(true)}
               className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors"
             >
               <FileText className="h-3 w-3" /> Resources
             </button>

             <button 
               onClick={extendTime}
               className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
             >
               <Plus className="h-3 w-3" /> Add 15m
             </button>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* A. 10 Minute Warning Modal */}
      {showTimeWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto animate-in slide-in-from-top-4">
          <div className="bg-amber-500 text-black px-6 py-4 rounded-md shadow-2xl border-2 border-white flex items-center gap-6">
             <div className="flex items-center gap-3">
               <AlertTriangle className="h-6 w-6" />
               <div>
                 <p className="font-bold text-lg leading-tight">Class ending in 10 minutes</p>
                 <p className="text-sm opacity-90">Would you like to extend the session?</p>
               </div>
             </div>
             <div className="flex items-center gap-2">
               <button onClick={() => setShowTimeWarning(false)} className="px-3 py-1.5 text-sm font-semibold hover:bg-black/10 rounded">Dismiss</button>
               <button onClick={extendTime} className="bg-black text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-zinc-800 shadow-md whitespace-nowrap">
                 + Add 15 Min
               </button>
             </div>
          </div>
        </div>
      )}

      {/* B. Resource Manager Modal */}
      <Modal 
        title="Manage Class Resources" 
        isOpen={isResourceModalOpen} 
        onClose={() => setIsResourceModalOpen(false)}
      >
         <div className="space-y-6">
            {/* List */}
            {resources.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-800 rounded-md bg-zinc-900/50">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No resources uploaded yet.</p>
              </div>
            ) : (
              <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {/* 4. Resolved Implicit Any: Typescript now knows 'res' is 'Resource' */}
                {resources.map((res) => (
                  <li key={res.id} className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-md border border-zinc-800 hover:border-zinc-700 transition-colors">
                    <a href={res.file} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-zinc-200 hover:text-blue-400 font-medium truncate flex-1">
                      <FileText className="h-4 w-4 shrink-0" />
                      {res.title}
                    </a>
                    <button 
                      onClick={() => deleteResource(res.id)}
                      className="text-zinc-500 hover:text-red-400 p-1 rounded-md hover:bg-zinc-800 transition-colors ml-2"
                      title="Remove file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Upload Area */}
            <div className="pt-6 border-t border-zinc-800">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-700 border-dashed rounded-md cursor-pointer bg-zinc-900 hover:bg-zinc-800/50 transition-colors group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                  ) : (
                    <UploadCloud className="w-8 h-8 mb-3 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                  )}
                  <p className="mb-1 text-sm text-zinc-400"><span className="font-semibold text-blue-500">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-zinc-500">PDF, DOCX, IMG (Max 10MB)</p>
                </div>
                <input type="file" className="hidden" onChange={uploadResource} disabled={uploading} />
              </label>
            </div>
         </div>
      </Modal>

    </div>
  );
}