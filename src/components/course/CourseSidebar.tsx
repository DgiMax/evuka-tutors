"use client";
import React, { useState } from "react";

const XIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 384 512">
    <path
      fill="#000"
      d="M55.1 73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L147.2 256 9.9 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l137.3-137.4 137.4 137.3c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.8 256l137.3-137.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192.5 210.7z"
    />
  </svg>
);

const ChevronDownIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
    <path
      fill="#000"
      d="M12.707 15.707a1 1 0 0 1-1.414 0L5.636 10.05A1 1 0 1 1 7.05 8.636l4.95 4.95 4.95-4.95a1 1 0 0 1 1.414 1.414z"
    />
  </svg>
);

interface Lesson {
  id: number;
  title: string;
}

interface Module {
  title: string;
  lessons: Lesson[];
}

interface Course {
  modules: Module[];
}

interface CourseSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  course: Course | null;
  activeLesson: Lesson | null;
  setActiveLesson: (lesson: Lesson) => void;
}

const CourseSidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  course,
  activeLesson,
  setActiveLesson,
}: CourseSidebarProps) => {
  const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>({ 0: true });

  const toggleSection = (index: number) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (!course) return null;

  return (
    <aside
        className={`
            w-[400px] h-full
            bg-white border-l border-gray-200
            flex flex-col
            transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}
        >

      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-200 bg-white">
        <h2 className="text-lg font-bold text-gray-900">Course content</h2>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden text-gray-700 hover:text-gray-900 transition"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Modules */}
      <div className="flex-1 overflow-y-auto">
        {course.modules.map((module, moduleIndex) => (
          <div key={moduleIndex} className="border-b border-gray-200">
            <button
              onClick={() => toggleSection(moduleIndex)}
              className="w-full p-4 flex justify-between items-center text-left text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <span className="font-semibold">{module.title}</span>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-600 transform transition-transform duration-200 ${
                  openSections[moduleIndex] ? "rotate-180" : ""
                }`}
              />
            </button>

            {openSections[moduleIndex] && (
              <ul className="bg-white">
                {module.lessons.map((lesson, lessonIndex) => {
                  const isActive = activeLesson?.id === lesson.id;
                  return (
                    <li
                      key={lessonIndex}
                      onClick={() => {
                        setActiveLesson(lesson);
                        setIsSidebarOpen(false);
                      }}
                      className={`flex items-center justify-between cursor-pointer pr-4 ${
                        isActive
                          ? "bg-[#2694C6]/10 border-l-4 border-[#2694C6]"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <span className="px-4 py-3 text-sm flex-1">{lesson.title}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default CourseSidebar;
