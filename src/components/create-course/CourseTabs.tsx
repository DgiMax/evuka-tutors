"use client";

import React from "react";

export type TabType = "Overview" | "Q&A" | "Notes" | "Announcements";

interface CourseContentTabsProps {
  activeTab: TabType;
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
}

const CourseContentTabs = ({ activeTab, setActiveTab }: CourseContentTabsProps) => {
  const tabs: TabType[] = ["Overview", "Q&A", "Notes", "Announcements"];

  return (
    <div className="sticky top-[64px] z-30 bg-white border-b border-gray-200 shadow-sm">
      <nav className="flex space-x-6 px-4 md:px-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === tab
                ? "border-[#2694C6] text-[#2694C6]"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default CourseContentTabs;
