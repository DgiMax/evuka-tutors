"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CourseModulesClient } from "@/components/course/CourseModulesClient";
import { CoursePreviewActions } from '@/components/course/CoursePreviewActions';
import api from "@/lib/api/axios";
import { useAuth } from "@/context/AuthContext";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";

// --- ICONS ---
const StarIcon = ({ filled = true, className = "w-5 h-5" }: { filled?: boolean, className?: string }) => (
  <svg className={`${className} ${filled ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.368-2.448a1 1 0 00-1.176 0l-3.368 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
  </svg>
);

const PointIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0"/></svg>
);

// --- TYPES ---
type Lesson = {
  title: string;
  is_preview: boolean;
  estimated_duration_minutes: number;
};

type Module = {
  title: string;
  description: string;
  lessons_count: number;
  lessons: Lesson[];
};

export type CourseDetails = {
  slug: string;
  title: string;
  short_description: string;
  long_description: string;
  learning_objectives: string[];
  promo_video: string;
  thumbnail: string;
  instructor: {
    instructor_name: string;
    bio: string;
  };
  organization_name: string;
  category: { name: string; slug: string };
  level: { name: string };
  price: string;
  rating_avg: number;
  num_students: number;
  num_ratings: number;
  modules: Module[];
  is_enrolled: boolean;
  created_at: string;
  updated_at: string;
};

// --- SUB-COMPONENTS ---

const PreviewStickySidebar = ({ course }: { course: CourseDetails }) => (
  <div className="sticky top-16">
    <div className="border border-gray-200 rounded bg-white p-6 shadow">
      <div className="flex justify-between items-center mb-4">
         <p className="text-xs text-gray-500">
           Updated {new Date(course.updated_at).toLocaleDateString()}
         </p>
         <span className="px-2 py-1 text-xs font-medium uppercase tracking-wider text-gray-600 bg-gray-100 rounded-full">
             {course.level?.name || 'All Levels'}
         </span>
      </div>

      <div className="mb-4">
         <div className="flex items-center mb-2">
            <span className="text-3xl font-bold text-gray-900 mr-2">
               {Number(course.price) > 0 ? `KES ${course.price}` : 'Free'}
            </span>
         </div>
         <div className="flex items-center text-sm text-gray-600">
            <div className="flex items-center mr-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} filled={i < Math.round(course.rating_avg)} className="w-4 h-4" />
                ))}
                <span className="ml-1">({course.rating_avg.toFixed(1)})</span>
            </div>
            <span>{course.num_students} students</span>
         </div>
      </div>
      
      {/* Tutor Actions */}
      <CoursePreviewActions slug={course.slug} />
    </div>
  </div>
);

const LearningObjectives = ({ objectives }: { objectives: string[] }) => (
  <div className="border border-gray-200 rounded p-6 my-8 bg-white shadow">
    <h2 className="text-xl font-bold mb-4 text-gray-900">What students will learn</h2>
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-gray-700">
      {objectives?.length ? (
        objectives.map((obj, index) => (
          <li key={index} className="flex items-start">
            <PointIcon className="w-5 h-5 text-[#2694C6] mr-3 mt-0.5 flex-shrink-0" />
            <span>{obj}</span>
          </li>
        ))
      ) : (
        <li className="text-gray-500 italic">No learning objectives added yet.</li>
      )}
    </ul>
  </div>
);

const CourseDescription = ({ description }: { description: string }) => (
  <div className="bg-white rounded p-6 border border-gray-200 shadow mb-8">
    <h2 className="text-2xl font-bold mb-4 text-gray-900">Description</h2>
    <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
      {description || <span className="text-gray-500 italic">No description available.</span>}
    </div>
  </div>
);

const CourseDetailsLoading = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
    <div className="lg:grid lg:grid-cols-3 lg:gap-x-8 xl:gap-x-10">
      <aside className="mt-8 lg:mt-0 order-2 lg:order-1 lg:col-span-1">
         <div className="sticky top-4">
            <div className="h-16 bg-amber-50 rounded-md mb-4 w-full"></div>
            <div className="border border-gray-200 rounded-lg bg-white p-6 h-64">
               <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
               <div className="h-10 bg-gray-200 rounded w-3/4 mb-6"></div>
               <div className="h-12 bg-gray-200 rounded w-full mb-2"></div>
               <div className="h-12 bg-gray-200 rounded w-full"></div>
            </div>
         </div>
      </aside>
      <main className="lg:col-span-2 order-1 lg:order-2">
        <div className="aspect-video bg-gray-200 rounded-lg mb-8"></div>
        <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-full mb-8"></div>
        <div className="border border-gray-200 rounded-lg p-6 h-48 mb-8"></div>
      </main>
    </div>
  </div>
);

// --- MAIN PAGE COMPONENT ---

export default function CoursePreviewDetailView() {
  const params = useParams();
  const slug = params.slug as string;
  const { activeSlug } = useActiveOrg();

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (slug && !authLoading) {
      const fetchCourseData = async () => {
        setLoading(true);
        try {
          // Use the specific preview endpoint for tutors
          const res = await api.get(`/courses/${slug}/preview-details/`);
          setCourse(res.data);
        } catch (err: any) {
          console.error(err);
          if (err.response && err.response.status === 404) {
             setError("Course not found, or you do not have permission to preview it.");
          } else {
             setError("Failed to load course preview.");
          }
        } finally {
          setLoading(false);
        }
      };
      fetchCourseData();
    }
  }, [slug, authLoading, activeSlug]);

  if (loading || authLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <CourseDetailsLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-red-100 max-w-md text-center">
            <svg className="h-12 w-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Preview</h3>
            <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 pb-16">
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              {/* Info Icon */}
              <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700 font-medium">
                Tutor Preview Mode
              </p>
              <p className="text-xs text-amber-600 mt-1">
                This is how students will see your course landing page.
              </p>
            </div>
          </div>
        </div>
        <div className="lg:grid lg:grid-cols-3 lg:gap-x-8 xl:gap-x-10">
          
          {/* Right Sidebar for Tutor Actions */}
          <aside className="mt-8 lg:mt-0 order-2 lg:order-2 lg:col-span-1">
            <PreviewStickySidebar course={course} />
          </aside>

          {/* Main Content Left */}
          <main className="lg:col-span-2 order-1 lg:order-1">
             {/* Video/Thumbnail Area */}
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-8 shadow-sm flex items-center justify-center relative">
               {course.promo_video || course.thumbnail ? (
                   <img
                    src={course.promo_video || course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
               ) : (
                   <div className="text-gray-500 flex flex-col items-center">
                       <svg className="w-16 h-16 mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                       <span>No media uploaded</span>
                   </div>
               )}
            </div>

            {/* Header Info */}
            <div className="bg-white rounded p-8 shadow border border-gray-200 mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
                <p className="text-md text-gray-600 mb-6 leading-relaxed">{course.short_description}</p>
                
                <div className="flex flex-wrap items-center text-sm text-gray-500 pt-6 border-t border-gray-100">
                    <div className="mr-6 mb-2">
                        <span className="text-gray-400 mr-2">Instructor:</span>
                        <span className="font-semibold text-gray-900">{course.instructor?.instructor_name}</span>
                    </div>
                    <div className="mr-6 mb-2">
                        <span className="text-gray-400 mr-2">Category:</span>
                        <span className="font-semibold text-gray-900">{course.category?.name || 'Uncategorized'}</span>
                    </div>
                    {course.organization_name && (
                        <div className="mb-2">
                            <span className="text-gray-400 mr-2">Organization:</span>
                            <span className="font-semibold text-[#2694C6]">{course.organization_name}</span>
                        </div>
                    )}
                </div>
            </div>

            <LearningObjectives objectives={course.learning_objectives} />
            <CourseDescription description={course.long_description} />
            
            {/* Course Content */}
            <div className="bg-white rounded shadow">
                <CourseModulesClient modules={course.modules} />
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}