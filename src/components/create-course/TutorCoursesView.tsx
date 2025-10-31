"use client";

import React, { useState, useEffect } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";
import { Loader2, BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import TutorCourseCard, { TutorCourse } from "@/components/create-course/TutorCourseCard";

export default function TutorCoursesClient() {
  const { activeSlug } = useActiveOrg();
  const [courses, setCourses] = useState<TutorCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get("/tutor-courses/");
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setCourses(data);
      } catch (err) {
        console.error("Error loading tutor/admin courses:", err);
        setError("Failed to load your courses.");
        toast.error("Failed to load your courses.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [activeSlug]);

  const makeContextLink = (path: string) => {
    if (!activeSlug) return path;
    if (path.startsWith(`/${activeSlug}`)) return path;
    return `/${activeSlug}${path}`;
  };

  const createCourseHref = activeSlug
    ? `/${activeSlug}/create-course`
    : "/create-course";

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center mt-10">{error}</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          My Courses
        </h2>

        <Link
          href={createCourseHref}
          className="flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
          New Course
        </Link>
      </div>

      {/* Empty State */}
      {!courses.length ? (
        <div className="text-center py-16">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-gray-400" />
          <p className="text-gray-600">
            You haven’t created any courses yet.
          </p>
          <div className="mt-4">
            <Link href={createCourseHref}>
              <Button>Create Course</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {courses.map((course) => (
            <TutorCourseCard
              key={course.slug}
              course={course}
              makeContextLink={makeContextLink}
            />
          ))}
        </div>
      )}
    </div>
  );
}
