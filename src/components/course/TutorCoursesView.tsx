"use client";

import React, { useState, useEffect } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { useDebounce } from "@/lib/hooks/useDebounce"; // Using the shared hook
import api from "@/lib/api/axios";
import { Loader2, BookOpen, Plus, Search, AlertTriangle } from "lucide-react";
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

// --- Reusable Empty State component (themed) ---
const EmptyState: React.FC<{
  message: string;
  linkPath?: string;
  linkText?: string;
}> = ({ message, linkPath, linkText }) => (
  <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-border rounded-lg bg-muted/50 p-4">
    <BookOpen className="h-8 w-8 text-muted-foreground" />
    <p className="text-muted-foreground mt-2 text-center">{message}</p>
    {linkPath && linkText && (
      <Button asChild variant="link" className="text-primary">
        <Link href={linkPath}>{linkText}</Link>
      </Button>
    )}
  </div>
);

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

  // 1. Initial Loading State
  if (isLoading && !courses.length) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading courses...</p>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-destructive container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8">
        <AlertTriangle className="h-8 w-8" />
        <p className="mt-2 font-medium">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header / Toolbar */}
      <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title */}
        <h2 className="text-2xl font-semibold text-foreground self-start md:self-center">
          My Courses
        </h2>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
          <Button asChild className="w-full sm:w-auto">
            <Link href={createCourseHref} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Course
            </Link>
          </Button>
        </div>
      </div>

      {/* Content or Empty State */}
      {!courses.length ? (
        <EmptyState
          message={
            isDefaultView
              ? "You haven't created any courses yet."
              : "No courses found matching your criteria."
          }
          {...(isDefaultView && {
            linkPath: createCourseHref,
            linkText: "Create your first course",
          })}
        />
      ) : (
        <div className="relative grid gap-4 grid-cols-1 lg:grid-cols-2">
          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-full bg-background/80 z-10 flex justify-center items-start pt-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
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