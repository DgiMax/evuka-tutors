"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import CourseSidebar from "@/components/create-course/CourseSidebar";
import VideoPlayer from "@/components/create-course/VideoPlayer";
import CourseHeader from "@/components/create-course/CourseHeader";
import CourseContentTabs, { TabType } from "@/components/create-course/CourseTabs";
import TabContent from "@/components/create-course/TabContent";
import api from "@/lib/api/axios";

interface Lesson {
  id: number;
  title: string;
  content: string;
  video_link: string;
  resources: any;
  estimated_duration_minutes: number;
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

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">Loading preview...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">{error || "Preview not available."}</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen font-sans text-gray-900 flex flex-col">
      {/* MAIN LAYOUT */}
      <div className="flex flex-1 w-full relative">
        {/* LEFT CONTENT AREA */}
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)] overflow-y-auto bg-gray-50">
          {/* Header */}
          <CourseHeader courseTitle={course.title} setIsSidebarOpen={setIsSidebarOpen} />

          {/* Banner (closable) */}
          {showBanner && (
            <div className="bg-yellow-100 text-yellow-800 flex justify-between items-center px-4 py-2 text-sm font-medium sticky top-[64px] z-30">
              <span>Tutor Preview Mode — This is how learners will see your course.</span>
              <button
                onClick={() => setShowBanner(false)}
                className="text-yellow-800 hover:text-yellow-900 ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Scrollable course content */}
          <main className="flex-1 p-6 md:p-8 space-y-6">
            <VideoPlayer videoUrl={activeLesson?.video_link} />

            <div className="mt-4">
              <CourseContentTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            <TabContent activeTab={activeTab} course={course} activeLesson={activeLesson} />
          </main>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-[400px] h-[calc(100vh-64px)] sticky top-[64px] flex-shrink-0 z-30 bg-white border-l border-gray-200 overflow-y-auto">
          <CourseSidebar
            course={course}
            activeLesson={activeLesson}
            setActiveLesson={setActiveLesson}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        </div>
      </div>
    </div>
  );
}
