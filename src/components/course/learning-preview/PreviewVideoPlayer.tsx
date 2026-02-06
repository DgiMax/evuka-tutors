"use client";

import React, {
    useRef,
    useState,
    useEffect,
    useCallback,
} from "react";
import { cn } from "@/lib/utils";

const Icon = {
    Play: ({ className = "w-6 h-6" }) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Pause: ({ className = "w-6 h-6" }) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    VolumeUp: ({ className = "w-6 h-6" }) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
    ),
    VolumeOff: ({ className = "w-6 h-6" }) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round"
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2" />
        </svg>
    ),
    Fullscreen: ({ className = "w-6 h-6" }) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
        </svg>
    ),
    LoadingState: () => (
        <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
            <div className="relative h-10 w-10 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                <div className="absolute inset-0 rounded-full border-t-2 border-white animate-spin" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Syncing Stream</p>
        </div>
    )
};

const formatTime = (t: number) =>
    `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

const ProgressBar = ({ progressRef, progress, onSeek, isMini }: any) => (
    <div
        ref={progressRef}
        onClick={onSeek}
        className={cn(
            "w-full bg-white/20 cursor-pointer rounded-full relative group/progress",
            isMini ? "h-0.5 mb-1" : "h-1 mb-2"
        )}
    >
        <div className="absolute inset-0 group-hover/progress:h-2 group-hover/progress:-top-0.5 transition-all"></div>
        <div className="h-full bg-[#2694C6] rounded-full relative transition-all" style={{ width: `${progress}%` }}>
            {!isMini && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#2694C6] rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-md" />}
        </div>
    </div>
);

const VolumeControl = ({ volume, isMuted, onVolumeChange, onToggleMute, isMini }: any) => (
    <div className="flex items-center group">
        <button onClick={onToggleMute}>
            {isMuted || volume === 0 ? <Icon.VolumeOff className={isMini ? "w-4 h-4" : "w-6 h-6"} /> : <Icon.VolumeUp className={isMini ? "w-4 h-4" : "w-6 h-6"} />}
        </button>
        {!isMini && (
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={onVolumeChange}
                className="w-0 group-hover:w-24 h-1 ml-2 transition-all duration-300 opacity-0 group-hover:opacity-100 accent-[#2694C6] cursor-pointer"
            />
        )}
    </div>
);

const PlaybackRateControl = ({ playbackRate, onRateChange }: any) => {
    const rates = [0.5, 1, 1.5, 2];
    return (
        <div className="flex items-center gap-1.5 bg-white/5 rounded-md p-1 border border-white/5">
            {rates.map((rate) => (
                <button
                    key={rate}
                    onClick={() => onRateChange(rate)}
                    className={cn(
                        "px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter transition-all",
                        playbackRate === rate ? "bg-[#2694C6] text-white" : "text-white/40 hover:text-white"
                    )}
                >
                    {rate}x
                </button>
            ))}
        </div>
    );
};

export default function PreviewVideoPlayer({
    videoUrl,
    isMini = false,
}: {
    videoUrl: string | null;
    isMini?: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentUrlRef = useRef<string | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

    const isTypingInInput = (el: HTMLElement | null): boolean => {
        if (!el) return false;
        const tag = el.tagName.toLowerCase();
        return (tag === "input" || tag === "textarea" || tag === "select" || el.getAttribute("contenteditable") === "true");
    };

    const togglePlay = useCallback(() => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) v.play().catch(() => {});
        else v.pause();
    }, []);

    const handleTimeUpdate = () => {
        const v = videoRef.current;
        if (!v) return;
        setProgress((v.currentTime / v.duration) * 100);
        setCurrentTime(v.currentTime);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const bar = progressRef.current;
        const v = videoRef.current;
        if (!bar || !v) return;
        const rect = bar.getBoundingClientRect();
        v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
    };

    const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        setIsMuted(val === 0);
        if (videoRef.current) {
            videoRef.current.volume = val;
            videoRef.current.muted = val === 0;
        }
    };

    const toggleMute = useCallback(() => {
        const v = videoRef.current;
        if (!v) return;
        v.muted = !v.muted;
        setIsMuted(v.muted);
    }, []);

    const changeRate = (rate: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
            setPlaybackRate(rate);
        }
    };

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
        else document.exitFullscreen();
    }, []);

    const showControls = () => {
        setIsControlsVisible(true);
        if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
        hideControlsTimeout.current = setTimeout(() => {
            if (isPlaying) setIsControlsVisible(false);
        }, isMini ? 1500 : 3000);
    };

    useEffect(() => {
        const v = videoRef.current;
        if (!v || !videoUrl || currentUrlRef.current === videoUrl) return;
        currentUrlRef.current = videoUrl;
        setIsLoading(true);
        v.load();
        v.play().catch(() => setIsPlaying(false));
    }, [videoUrl]);

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (isTypingInInput(e.target as HTMLElement)) return;
            switch (e.key) {
                case " ": case "k": e.preventDefault(); togglePlay(); break;
                case "m": toggleMute(); break;
                case "f": if (!isMini) toggleFullscreen(); break;
                case "ArrowRight": if (videoRef.current) videoRef.current.currentTime += 5; break;
                case "ArrowLeft": if (videoRef.current) videoRef.current.currentTime -= 5; break;
            }
        };
        window.addEventListener("keydown", handleKeys);
        return () => window.removeEventListener("keydown", handleKeys);
    }, [togglePlay, toggleMute, toggleFullscreen, isMini]);

    if (!videoUrl) {
        return (
            <div className="w-full bg-black aspect-video flex items-center justify-center rounded-md border border-white/5">
                <p className="text-white text-[10px] font-black uppercase tracking-widest opacity-20 text-center px-6">
                    Stream Source Preview Unavailable
                </p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn("relative w-full bg-black rounded-md group aspect-video overflow-hidden", isMini ? "shadow-2xl" : "border border-white/5")}
            onMouseMove={showControls}
            onMouseLeave={() => isPlaying && setIsControlsVisible(false)}
        >
            {isLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-md">
                    <Icon.LoadingState />
                </div>
            )}

            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                src={videoUrl} 
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onWaiting={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                muted={isMuted}
                playsInline
            />

            <div className={cn(
                "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500",
                isMini ? "p-3" : "p-6",
                isControlsVisible || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
                <ProgressBar progressRef={progressRef} progress={progress} onSeek={handleSeek} isMini={isMini} />

                <div className="flex items-center justify-between text-white mt-2">
                    <div className="flex items-center space-x-4 md:space-x-6">
                        <button onClick={togglePlay} className={cn("hover:text-[#2694C6] transition-colors", isMini ? "scale-100" : "scale-125")}>
                            {isPlaying ? <Icon.Pause className={isMini ? "w-4 h-4" : "w-6 h-6"} /> : <Icon.Play className={isMini ? "w-4 h-4" : "w-6 h-6"} />}
                        </button>

                        <VolumeControl volume={volume} isMuted={isMuted} onVolumeChange={changeVolume} onToggleMute={toggleMute} isMini={isMini} />

                        {!isMini && (
                            <span className="text-[11px] font-black uppercase tracking-widest tabular-nums text-white/80">
                                {formatTime(currentTime)} <span className="text-white/20 mx-1">|</span> {formatTime(duration)}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center space-x-4 md:space-x-6">
                        {!isMini && <PlaybackRateControl playbackRate={playbackRate} onRateChange={changeRate} />}
                        {!isMini && <button onClick={toggleFullscreen} className="hover:text-[#2694C6] transition-colors"><Icon.Fullscreen /></button>}
                        {isMini && <span className="text-[9px] font-black uppercase tracking-widest text-white/60">{formatTime(currentTime)}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}