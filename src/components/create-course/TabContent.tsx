"use client";

import React from "react";
import type { TabType } from "./CourseTabs";

interface Lesson {
  id: number;
  title: string;
  content: string;
  resources?: { links?: string[]; files?: string[] };
}

interface Course {
  long_description?: string;
  learning_objectives?: string[];
}

interface TabContentProps {
  activeTab: TabType;
  course: Course | null;
  activeLesson: Lesson | null;
}

const TabContent = ({ activeTab, course, activeLesson }: TabContentProps) => {
  const content: Record<TabType, React.ReactNode> = {
    Overview: (
      <div>
        {activeLesson ? (
          <>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {activeLesson.title}
            </h3>

            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {activeLesson.content || "No content available for this lesson."}
            </div>

            {activeLesson.resources && (
              <div className="mt-6">
                <h4 className="text-xl font-semibold mb-2 text-gray-900">Resources</h4>
                <ul className="list-disc list-inside text-[#2694C6] space-y-1">
                  {activeLesson.resources.links?.map((link, i) => (
                    <li key={`link-${i}`}>
                      <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {link}
                      </a>
                    </li>
                  ))}
                  {activeLesson.resources.files?.map((file, i) => (
                    <li key={`file-${i}`}>
                      <a href={file} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Download File
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-700">Select a lesson to preview its content.</p>
        )}
      </div>
    ),
    "Q&A": <></>,
    Notes: <></>,
    Announcements: <></>,
  };

  return <div className="p-4 md:p-8 bg-white">{content[activeTab]}</div>;
};

export default TabContent;
