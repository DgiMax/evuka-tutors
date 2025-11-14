"use client";
import { useState, useEffect, useRef } from "react";

const PlaybackRateControl = ({
  playbackRate,
  onRateChange,
}: {
  playbackRate: number;
  onRateChange: (rate: number) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="text-sm hover:text-[#2694C6] transition"
      >
        {playbackRate}x
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 p-2 bg-black/80 rounded-md z-10">
          {[0.5, 0.75, 1, 1.5, 2].map((rate) => (
            <button
              key={rate}
              onClick={() => {
                onRateChange(rate);
                setIsOpen(false);
              }}
              className={`block w-full text-left px-3 py-1 text-sm text-white hover:bg-gray-700 rounded ${
                playbackRate === rate ? "text-[#2694C6]" : ""
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaybackRateControl;
