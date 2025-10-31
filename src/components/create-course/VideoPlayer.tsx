"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import PlaybackRateControl from "./PlaybackRateControl";

// --- ICONS ---
const PlayIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const PauseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const VolumeUpIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
    />
  </svg>
);
const VolumeOffIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2" />
  </svg>
);
const MaximizeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
  </svg>
);

// --- PROGRESS BAR ---
const ProgressBar = ({
  progressRef,
  progress,
  onSeek,
}: {
  progressRef: React.RefObject<HTMLDivElement | null>;
  progress: number;
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
}) => (
  <div ref={progressRef} onClick={onSeek} className="w-full h-1 bg-gray-600/50 cursor-pointer rounded-full mb-2">
    <div className="h-full bg-[#2694C6] rounded-full" style={{ width: `${progress}%` }}></div>
  </div>
);

// --- VOLUME CONTROL ---
const VolumeControl = ({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}: {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMute: () => void;
}) => (
  <div className="flex items-center group">
    <button onClick={onToggleMute}>{isMuted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}</button>
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={volume}
      onChange={onVolumeChange}
      className="w-0 group-hover:w-24 h-1 ml-2 transition-all duration-300 opacity-0 group-hover:opacity-100"
    />
  </div>
);

// --- MAIN COMPONENT ---
export default function TutorVideoPlayer({ videoUrl }: { videoUrl?: string | null }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isControlsVisible, setIsControlsVisible] = useState(true);

  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      setProgress((currentTime / duration) * 100);
      setCurrentTime(currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleProgressSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.pageX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * videoRef.current.duration;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleMouseMove = () => {
    setIsControlsVisible(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setIsControlsVisible(false);
    }, 3000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName.toLowerCase() === "textarea") return;
      const video = videoRef.current;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          handlePlayPause();
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          handleFullScreen();
          break;
        case "ArrowRight":
          if (video) video.currentTime += 5;
          break;
        case "ArrowLeft":
          if (video) video.currentTime -= 5;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePlayPause]);

  if (!videoUrl) {
    return (
      <div className="w-full bg-black aspect-video flex items-center justify-center rounded-md">
        <p className="text-white text-sm">No video selected. Choose a lesson to preview.</p>
      </div>
    );
  }

  return (
    <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black group rounded-md overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setIsControlsVisible(false)}
        >
      <video
        key={videoUrl}
        ref={videoRef}
        className="w-full h-full rounded-md"
        onClick={handlePlayPause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        src={videoUrl}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${
          isControlsVisible || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        <ProgressBar progressRef={progressRef} progress={progress} onSeek={handleProgressSeek} />
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            <button onClick={handlePlayPause}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
            <VolumeControl volume={volume} isMuted={isMuted} onVolumeChange={handleVolumeChange} onToggleMute={toggleMute} />
            <span className="text-xs font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <PlaybackRateControl playbackRate={playbackRate} onRateChange={handlePlaybackRateChange} />
            <button onClick={handleFullScreen}>
              <MaximizeIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper ---
function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
