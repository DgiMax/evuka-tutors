"use client";
import React from "react";

const MenuIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

interface HeaderProps {
  courseTitle: string;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CourseHeader = ({ courseTitle, setIsSidebarOpen }: HeaderProps) => {
  return (
    <header className="bg-white p-4 flex items-center justify-between sticky top-[64px] border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <h1 className="text-xl font-bold text-gray-900 truncate">{courseTitle}</h1>
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
          Preview Mode
        </span>
      </div>

      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden text-gray-800 hover:text-[#2694C6] transition"
      >
        <MenuIcon />
      </button>
    </header>
  );
};

export default CourseHeader;
