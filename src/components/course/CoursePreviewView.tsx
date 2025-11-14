"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import CourseSidebar from "@/components/course/CourseSidebar";
import VideoPlayer from "@/components/course/VideoPlayer";
import CourseHeader from "@/components/course/CourseHeader";
import CourseContentTabs, { TabType } from "@/components/course/CourseTabs";
import TabContent from "@/components/course/TabContent";
import api from "@/lib/api/axios";

// --- Interfaces ---
interface Lesson {
  id: number;
  title: string;
  content: string;
  video_link: string;
  resources: any;
  estimated_duration_minutes: number;
  is_completed?: boolean;
  last_watched_timestamp?: number;
}
interface Module {
  title: string;
  description: string;
  lessons: Lesson[];
}
interface Course {
  title: string;
  slug: string;
  modules: Module[];
}

export default function TutorCoursePreview() {
  const params = useParams();
  const slug = params.slug as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("Overview");
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setFetching(true);
        const res = await api.get(`/courses/${slug}/preview-learning/`);
        const data: Course = res.data;
        setCourse(data);

        const allLessons = data.modules.flatMap((m) => m.lessons);
        if (allLessons.length > 0) setActiveLesson(allLessons[0]);
      } catch (err: any) {
        console.error("Failed to load course preview:", err);
        setError("Failed to load course preview data.");
      } finally {
        setFetching(false);
      }
    };
    fetchCourse();
  }, [slug]);

  const handleGoToNextLesson = useCallback(() => {
    if (!course || !activeLesson) return;
    const allLessons = course.modules.flatMap((module) => module.lessons);
    const currentIndex = allLessons.findIndex((lesson) => lesson.id === activeLesson.id);
    if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
      setActiveLesson(allLessons[currentIndex + 1]);
    }
  }, [course, activeLesson]);

  const handleProgressUpdate = useCallback(async (lessonId: number, timestamp: number, completed?: boolean) => {
      // Dummy function for preview
  }, []);

  const handleToggleComplete = useCallback((lessonId: number) => {
      // Dummy function for preview
      console.log("Preview: Toggled complete for lesson", lessonId);
  }, []);


  if (fetching) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 bg-gray-300 rounded-full mb-4"></div>
            <p className="text-gray-500 font-medium">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <p className="text-red-500 font-medium">{error || "Preview not available."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full flex bg-gray-50 font-sans text-gray-900 sticky top-[56px] overflow-hidden">
      
      {/* --- LEFT SIDE: Header + Main Content --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
          {/* Fixed Header Area */}
          <div className="flex-shrink-0 z-40 bg-white border-b border-gray-200 relative">
             {showBanner && (
              <div className="bg-amber-50 border-b border-amber-100 text-amber-800 px-4 py-2 text-xs font-medium flex justify-between items-center">
                <div className="flex items-center">
                    <span className="mr-2">⚠️</span>
                    <span><strong>Student View Preview</strong> — Progress is not saved.</span>
                </div>
                <button onClick={() => setShowBanner(false)} className="text-amber-800 hover:bg-amber-100 rounded p-1">✕</button>
              </div>
            )}
            <CourseHeader courseTitle={course.title} setIsSidebarOpen={setIsSidebarOpen} />
          </div>

          {/* Scrollable Main Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <main className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
              <div className="bg-black rounded-xl overflow-hidden shadow-md aspect-video">
                   <VideoPlayer
                      videoUrl={activeLesson?.video_link}
                      lessonId={activeLesson?.id}
                      onProgressUpdate={handleProgressUpdate}
                      onLessonComplete={handleGoToNextLesson}
                   />
              </div>
              <div className="shadow rounded bg-white border border-gray-200">
                <CourseContentTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabContent
                    activeTab={activeTab}
                    course={course}
                    activeLesson={activeLesson}
                    onToggleComplete={handleToggleComplete}
                />
              </div>
            </main>
          </div>
      </div>

      {/* --- RIGHT SIDE: Sidebar (Fixed Desktop) --- */}
        <CourseSidebar
          course={course}
          activeLesson={activeLesson}
          setActiveLesson={setActiveLesson}
          isSidebarOpen={true}
          setIsSidebarOpen={setIsSidebarOpen}
          onToggleComplete={handleToggleComplete}
        />

       {/* Mobile Sidebar Overlay */}
       {isSidebarOpen && (
         <div className="fixed inset-0 z-50 lg:hidden">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
           <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white shadow-2xl overflow-y-auto">
              <CourseSidebar
                  course={course}
                  activeLesson={activeLesson}
                  setActiveLesson={(lesson) => { setActiveLesson(lesson); setIsSidebarOpen(false); }}
                  isSidebarOpen={true}
                  setIsSidebarOpen={setIsSidebarOpen}
                  onToggleComplete={handleToggleComplete}
              />
           </div>
         </div>
       )}

    </div>
  );
}