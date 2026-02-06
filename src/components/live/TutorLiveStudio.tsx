"use client";

import '@livekit/components-styles';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  useRoomContext,
  useLocalParticipant,
  useRemoteParticipants,
  useConnectionState,
  useTracks,
  LayoutContextProvider,
} from '@livekit/components-react';
import { RoomEvent, ConnectionState, RemoteParticipant, Track } from 'livekit-client';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Lock, Unlock, Hand, Clock, 
  FileText, Coffee, X, Maximize, Minimize, Download, Inbox, MessageSquare, 
  Mic, MicOff, Video, VideoOff, Monitor, Plus, Trash2, UploadCloud, Loader2, 
  CheckCircle2, XCircle, Eraser, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import api from '@/lib/api/axios';
import { toast } from 'sonner';
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { cn } from "@/lib/utils";

interface Resource {
  id: number;
  title: string;
  file: string;
}

interface JoinResponse {
    token: string;
    url: string;
    is_host: boolean;
    host_identity: string;
    effective_end_datetime: string;
    resources: Resource[];
    mic_locked: boolean;
    camera_locked: boolean;
    screen_locked: boolean;
    course_slug: string;
}

interface TutorLiveStudioProps {
  idOrSlug: string;
  type: 'lesson' | 'event';
}

function Modal({ title, isOpen, onClose, children }: { title: string, isOpen: boolean, onClose: () => void, children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 pointer-events-auto">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950 shrink-0">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-zinc-950 text-white font-sans">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function TutorLiveStudio({ idOrSlug, type }: TutorLiveStudioProps) {
  const router = useRouter();
  const { activeSlug } = useActiveOrg();
  
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");
  const [hostIdentity, setHostIdentity] = useState("");
  const [effectiveEndTime, setEffectiveEndTime] = useState<Date | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [initialMicLocked, setInitialMicLocked] = useState(false);
  const [initialCameraLocked, setInitialCameraLocked] = useState(false);
  const [initialScreenLocked, setInitialScreenLocked] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [waitInfo, setWaitInfo] = useState<{message: string, openAt: Date} | null>(null);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const baseApiUrl = type === 'lesson' 
    ? `/live/lessons/${idOrSlug}` 
    : `/events/tutor-events/${idOrSlug}`;

  const handleExit = useCallback(() => {
    const basePath = activeSlug ? `/${activeSlug}` : '';
    const target = type === 'lesson' ? 'live-classes' : 'events';
    router.push(`${basePath}/${target}`);
  }, [activeSlug, router, type]);

  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get<JoinResponse>(`${baseApiUrl}/join/`);
        if (!isMounted) return;

        if (!data.is_host) {
            toast.error("Unauthorized: Host Access Only");
            router.push('/'); 
            return;
        }
        setToken(data.token);
        setUrl(data.url);
        setHostIdentity(data.host_identity);
        setEffectiveEndTime(new Date(data.effective_end_datetime));
        setResources(data.resources || []);
        setInitialMicLocked(data.mic_locked);
        setInitialCameraLocked(data.camera_locked);
        setInitialScreenLocked(data.screen_locked || false);
        setIsLoading(false);
      } catch (e: any) {
        if (!isMounted) return;
        setIsLoading(false);
        if (e.response?.status === 403 && e.response?.data?.error === 'too_early') {
          setWaitInfo({ message: e.response.data.message, openAt: new Date(e.response.data.open_at) });
        } else {
          toast.error("Studio connection failed.");
        }
      }
    };
    if (idOrSlug) initSession();
    return () => { isMounted = false; };
  }, [idOrSlug, baseApiUrl, router]);

  useEffect(() => {
    const check = () => setIsMobilePortrait(window.innerWidth < window.innerHeight && window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center overflow-hidden z-[500]">
        <div className="relative h-20 w-20 flex items-center justify-center">
          <motion.div
            animate={{ rotate: [0, 90, 180, 270, 360], borderRadius: ["15%", "0%", "15%", "0%", "15%"] }}
            transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
            className="absolute h-14 w-14 border-2 border-[#2694C6]/30"
          />
          <motion.div
            animate={{ scale: [0.6, 1, 0.6], rotate: [0, -90, -180, -270, -360] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="h-7 w-7 bg-[#2694C6] rounded-sm shadow-xl shadow-[#2694C6]/20"
          />
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-[#2694C6]/90 animate-pulse font-sans">
          Launching Studio
        </motion.p>
      </div>
    );
  }

  if (waitInfo) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center text-white p-6 text-center z-[500] font-sans">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-md max-w-md w-full shadow-2xl">
          <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 uppercase tracking-tight">Studio Not Open</h2>
          <p className="text-zinc-400 text-sm mb-6">{waitInfo.message}</p>
          <div className="bg-blue-900/20 text-blue-400 py-2 px-4 rounded-md text-xs font-bold inline-block uppercase tracking-widest">
            Opens at {waitInfo.openAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          <button onClick={() => window.location.reload()} className="mt-8 w-full bg-zinc-800 hover:bg-zinc-700 py-3 rounded-md text-xs font-black uppercase transition-colors">Retry Connection</button>
        </div>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div 
      className={cn(
        "bg-zinc-950 overflow-hidden relative font-sans",
        isFullscreen ? "fixed inset-0 w-screen h-screen z-[200]" : "relative w-full h-screen overflow-hidden"
      )}
      style={isMobilePortrait && isFullscreen ? { width: "100vh", height: "100vw", transform: "rotate(90deg)", transformOrigin: "bottom left", position: "absolute", top: "-100vw", left: "0" } : {}}
    >
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={url}
        connect={true}
        onDisconnected={handleExit}
        className="h-full w-full relative flex flex-col overflow-hidden"
      >
        <LayoutContextProvider>
            <TutorStudioWrapper 
              baseApiUrl={baseApiUrl}
              initialEndTime={effectiveEndTime}
              resources={resources}
              setResources={setResources}
              onExit={handleExit}
              initialMicLocked={initialMicLocked}
              initialCameraLocked={initialCameraLocked}
              initialScreenLocked={initialScreenLocked}
              toggleFullscreen={toggleFullscreen}
              isFullscreen={isFullscreen}
            />
        </LayoutContextProvider>
      </LiveKitRoom>
    </div>
  );
}

function TutorStudioWrapper(props: any) {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false }
  ]);

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full bg-zinc-950 relative">
      <div className="relative flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <div className="flex-1 relative overflow-hidden bg-black">
           <GridLayout tracks={tracks}>
              <ParticipantTile />
           </GridLayout>
        </div>
        <TutorRoomManager {...props} />
      </div>
      <style jsx global>{`
        .lk-video-conference { height: 100% !important; border: none !important; }
        .lk-video-conference > .lk-control-bar { display: none !important; }
      `}</style>
    </div>
  );
}

function TutorRoomManager({ baseApiUrl, initialEndTime, resources, setResources, onExit, initialMicLocked, initialCameraLocked, initialScreenLocked, toggleFullscreen, isFullscreen }: any) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  
  const [endTime, setEndTime] = useState<Date | null>(initialEndTime);
  const [timeLeft, setTimeLeft] = useState("");
  const [isMicLocked, setIsMicLocked] = useState(initialMicLocked);
  const [isCameraLocked, setIsCameraLocked] = useState(initialCameraLocked);
  const [isScreenLocked, setIsScreenLocked] = useState(initialScreenLocked);
  
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [raisedHands, setRaisedHands] = useState<{identity: string, name: string}[]>([]);
  
  const alertedIdentitiesRef = useRef<Set<string>>(new Set());

  const toggleLock = async (target: 'mic' | 'camera' | 'screen') => {
    const currentState = target === 'mic' ? isMicLocked : target === 'camera' ? isCameraLocked : isScreenLocked;
    try {
      await api.post(`${baseApiUrl}/toggle_lock/`, { target, locked: !currentState });
      if (target === 'mic') setIsMicLocked(!currentState);
      if (target === 'camera') setIsCameraLocked(!currentState);
      if (target === 'screen') setIsScreenLocked(!currentState);
      toast.success(`${target} state updated for class`);
    } catch (e) { toast.error("Sync failed"); }
  };

  const acknowledgeStudent = async (studentIdentity: string, action: 'grant' | 'revoke') => {
    try {
      await api.post(`${baseApiUrl}/acknowledge_student/`, { student_identity: studentIdentity, action });
      if (action === 'revoke') {
        alertedIdentitiesRef.current.delete(studentIdentity);
        setRaisedHands(prev => prev.filter(h => h.identity !== studentIdentity));
      }
      toast.success(action === 'grant' ? "Granted permission" : "Permissions reset");
    } catch (e) { toast.error("Action failed"); }
  };

  const clearAllHands = useCallback(async () => {
    setRaisedHands([]);
    alertedIdentitiesRef.current.clear();
    const msg = JSON.stringify({ type: 'CLEAR_HANDS' });
    await localParticipant.publishData(new TextEncoder().encode(msg), { reliable: true });
    toast.success("Engagement reset");
  }, [localParticipant]);

  const uploadResource = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      const { data } = await api.post(`${baseApiUrl}/upload_resource/`, formData);
      setResources((prev: any) => [...prev, data]);
      setUploading(false);
      toast.success("Shared with class");
    } catch (e) {
      setUploading(false);
      toast.error("Upload failed");
    }
  };

  useEffect(() => {
    if (!room) return;
    const handleData = (payload: Uint8Array, participant?: any) => {
      const data = JSON.parse(new TextDecoder().decode(payload));
      if (data.type === 'RAISE_HAND') {
        const identity = participant?.identity;
        if (identity && !alertedIdentitiesRef.current.has(identity)) {
          alertedIdentitiesRef.current.add(identity);
          setRaisedHands(prev => [...prev, { identity, name: participant?.name || "Student" }]);
          toast.info(`${participant?.name || "Student"} raised a hand! ✋`);
        }
      }
    };
    room.on(RoomEvent.DataReceived, handleData);
    return () => { room.off(RoomEvent.DataReceived, handleData); };
  }, [room]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!endTime) return;
      const diff = endTime.getTime() - new Date().getTime();
      if (diff <= 30000 && diff > 0) setShowTimeWarning(true);
      if (diff <= 0) onExit();
      else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime, onExit]);

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden font-sans">
      
      <div className="absolute top-4 left-4 z-20 pointer-events-auto bg-black/60 backdrop-blur-md rounded-md p-2 text-white border border-white/10 flex items-center gap-2">
        <Clock className="h-3 w-3" />
        <span className="font-bold text-xs">{timeLeft}</span>
      </div>

      <div className="absolute top-4 right-4 z-20 pointer-events-auto flex items-center gap-2">
          <button onClick={toggleFullscreen} className="bg-black/60 backdrop-blur-md text-white p-2 rounded-md border border-white/10 hover:bg-zinc-800 transition-colors shadow-lg active:scale-95">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
          <button onClick={onExit} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-[10px] font-black uppercase shadow-xl transition-colors active:scale-95">End Session</button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-4 bg-black/40 backdrop-blur-xl p-3 px-6 rounded-2xl border border-white/10 shadow-2xl">
         <button onClick={() => localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled)} className={cn("p-3 rounded-full transition-all active:scale-90 shadow-md", localParticipant.isMicrophoneEnabled ? "bg-zinc-800 text-white" : "bg-red-500/20 text-red-500")}>
            {localParticipant.isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
         </button>
         <button onClick={() => localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled)} className={cn("p-3 rounded-full transition-all active:scale-90 shadow-md", localParticipant.isCameraEnabled ? "bg-zinc-800 text-white" : "bg-red-500/20 text-red-500")}>
            {localParticipant.isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
         </button>
         <button onClick={() => localParticipant.setScreenShareEnabled(!localParticipant.isScreenShareEnabled)} className={cn("p-3 rounded-full transition-all active:scale-90 shadow-md", localParticipant.isScreenShareEnabled ? "bg-blue-500 text-white" : "bg-zinc-800 text-white")}>
            <Monitor className="h-5 w-5" />
         </button>
         <div className="group relative">
           <button disabled className="p-3 rounded-full bg-zinc-900 text-zinc-600 cursor-not-allowed opacity-50"><MessageSquare className="h-5 w-5" /></button>
           <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10">Under Development</div>
         </div>
      </div>

      <div className="absolute top-20 left-4 z-20 pointer-events-auto flex flex-col gap-3 w-48 animate-in slide-in-from-left-4 fade-in duration-300">
          <div className="bg-zinc-950/90 backdrop-blur-md p-3 rounded-md border border-zinc-800 space-y-2 shadow-lg">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Permissions</h4>
            <button onClick={() => toggleLock('mic')} className={cn("w-full flex items-center justify-between px-3 py-2 rounded-md text-xs border transition-all", isMicLocked ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-zinc-900 text-zinc-400 border-transparent")}>
              <span className="flex items-center gap-2">{isMicLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />} Mics</span>
              <span className="text-[9px] uppercase font-bold opacity-60">{isMicLocked ? 'Locked' : 'On'}</span>
            </button>
            <button onClick={() => toggleLock('camera')} className={cn("w-full flex items-center justify-between px-3 py-2 rounded-md text-xs border transition-all", isCameraLocked ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-zinc-900 text-zinc-400 border-transparent")}>
              <span className="flex items-center gap-2">{isCameraLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />} Cam</span>
              <span className="text-[9px] uppercase font-bold opacity-60">{isCameraLocked ? 'Locked' : 'On'}</span>
            </button>
            <button onClick={() => toggleLock('screen')} className={cn("w-full flex items-center justify-between px-3 py-2 rounded-md text-xs border transition-all", isScreenLocked ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-zinc-900 text-zinc-400 border-transparent")}>
              <span className="flex items-center gap-2">{isScreenLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />} Screen</span>
              <span className="text-[9px] uppercase font-bold opacity-60">{isScreenLocked ? 'Locked' : 'On'}</span>
            </button>
          </div>

          {raisedHands.length > 0 && (
            <div className="bg-blue-950/90 backdrop-blur-md p-3 rounded-md border border-blue-900 space-y-2 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-[10px] font-bold text-blue-300 uppercase flex items-center gap-1"><Hand className="h-3 w-3" /> Requests</h4>
                <button onClick={clearAllHands} className="text-blue-300 hover:text-white transition-colors"><Eraser className="h-3 w-3"/></button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {raisedHands.map(h => (
                  <div key={h.identity} className="bg-blue-900/40 p-2 rounded border border-blue-500/10 flex flex-col gap-2">
                    <span className="text-[9px] text-white truncate font-bold">{h.name}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => acknowledgeStudent(h.identity, 'grant')} className="flex-1 bg-blue-500 hover:bg-blue-400 text-white p-1 rounded text-[8px] font-black uppercase flex items-center justify-center gap-1 transition-all"><CheckCircle2 className="h-2.5 w-2.5" /> Grant</button>
                      <button onClick={() => acknowledgeStudent(h.identity, 'revoke')} className="bg-zinc-800 hover:bg-red-500 text-white p-1 rounded transition-all"><XCircle className="h-2.5 w-2.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-zinc-950/90 backdrop-blur-md p-3 rounded-md border border-zinc-800 space-y-2 shadow-lg">
             <button onClick={() => setIsResourceModalOpen(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5 shadow-lg active:scale-95 transition-all font-bold"><FileText className="h-3.5 w-3.5 text-blue-500" /> Share Files</button>
             <button onClick={async () => {
                const { data } = await api.post(`${baseApiUrl}/extend_time/`, { minutes: 15 });
                setEndTime(new Date(data.new_end_time));
                setShowTimeWarning(false);
                toast.success("+15m Added");
             }} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5 shadow-lg active:scale-95 transition-all font-bold"><Plus className="h-3.5 w-3.5 text-green-500" /> Add Time</button>
          </div>
      </div>

      {showTimeWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto animate-in slide-in-from-top-4">
          <div className="bg-amber-500 text-black px-6 py-4 rounded-xl shadow-2xl border-2 border-white flex items-center gap-6">
             <div className="flex items-center gap-3">
               <AlertTriangle className="h-6 w-6" />
               <div>
                 <p className="font-black uppercase text-sm leading-tight">Class Closing</p>
                 <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">30 seconds remaining.</p>
               </div>
             </div>
             <button onClick={() => setShowTimeWarning(false)} className="bg-black text-white px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest shadow-md whitespace-nowrap">Acknowledge</button>
          </div>
        </div>
      )}

      <Modal title="Studio Materials" isOpen={isResourceModalOpen} onClose={() => setIsResourceModalOpen(false)}>
         <div className="h-full flex flex-col bg-zinc-950">
            {resources.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {resources.map((res: any) => (
                      <li key={res.id} className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-md border border-zinc-800 group hover:border-blue-500/50 transition-all">
                        <span className="flex items-center gap-3 text-xs text-zinc-200 font-bold truncate flex-1"><FileText className="h-4 w-4 text-blue-500" />{res.title}</span>
                        <button onClick={() => setResources((prev: any) => prev.filter((r: any) => r.id !== res.id))} className="text-zinc-600 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </li>
                  ))}
                </ul>
            )}
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer bg-zinc-950 hover:bg-zinc-900 transition-all group shrink-0">
                {uploading ? <Loader2 className="h-8 w-8 text-blue-500 animate-spin" /> : <UploadCloud className="w-8 h-8 mb-2 text-zinc-600 group-hover:text-blue-500 transition-all" />}
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Upload Resource</p>
                <input type="file" className="hidden" onChange={uploadResource} />
            </label>
         </div>
      </Modal>

      <style jsx global>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }`}</style>
    </div>
  );
}