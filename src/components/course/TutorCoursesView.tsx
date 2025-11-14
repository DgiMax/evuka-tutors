"use client";

import React, { useState, useEffect } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";
import { Loader2, BookOpen, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import TutorCourseCard, { TutorCourse } from "@/components/course/TutorCourseCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const statusOptions = {
  all: "All Statuses",
  draft: "Draft",
  pending_review: "Pending Review",
  published: "Published",
};

// ✅ Custom hook for debouncing
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function TutorCoursesClient() {
  const { activeSlug } = useActiveOrg();
  const [courses, setCourses] = useState<TutorCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.append("status", statusFilter);
        if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);

        const url = `/tutor-courses/?${params.toString()}`;
        const res = await api.get(url);
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
  }, [activeSlug, statusFilter, debouncedSearchTerm]);

  const makeContextLink = (path: string) => {
    if (!activeSlug) return path;
    if (path.startsWith(`/${activeSlug}`)) return path;
    return `/${activeSlug}${path}`;
  };

  const createCourseHref = activeSlug
    ? `/${activeSlug}/create-course`
    : "/create-course";

  const isDefaultView = statusFilter === "all" && searchTerm === "";

  if (isLoading && !courses.length) {
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
    <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8">
      {/* ✅ Header / Toolbar */}
      <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-gray-900">My Courses</h2>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search courses..."
              className="pl-10 rounded bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white rounded">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusOptions).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* New Course Button */}
          <Button asChild className="w-full sm:w-auto rounded">
            <Link href={createCourseHref} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Course
            </Link>
          </Button>
        </div>
      </div>

      {/* ✅ Course List / Empty State */}
      {!courses.length ? (
        <div className="text-center py-16">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-gray-400" />
          <p className="text-gray-600">
            {isDefaultView
              ? "You haven’t created any courses yet."
              : "No courses found matching your criteria."}
          </p>
          <div className="mt-4">
            <Link href={createCourseHref}>
              <Button>Create Course</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="relative grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-full bg-white/50 z-10 flex justify-center items-start pt-32">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          )}
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
