"use client";

import React, { useState, useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { useDebounce } from "@/lib/hooks/useDebounce";
import api from "@/lib/api/axios";
import { BookOpen, Plus, Search, AlertTriangle, Loader2 } from "lucide-react";
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

const CourseSkeleton = () => (
  <div className="flex flex-col sm:flex-row border border-border p-2 rounded-md h-[148px] sm:h-36">
    <div className="w-full h-32 sm:w-40 sm:h-full flex-shrink-0">
      <Skeleton height="100%" borderRadius="4px" />
    </div>
    <div className="flex flex-col justify-between flex-1 p-2">
      <div>
        <Skeleton width="60%" height={16} />
        <div className="mt-2">
          <Skeleton count={2} height={10} />
        </div>
      </div>
      <div className="flex justify-between items-center mt-2">
        <Skeleton width={60} height={18} borderRadius={10} />
        <div className="flex gap-2">
          <Skeleton width={70} height={28} />
          <Skeleton width={28} height={28} />
        </div>
      </div>
    </div>
  </div>
);

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

  const createCourseHref = activeSlug ? `/${activeSlug}/courses/create` : "/courses/create";
  const isDefaultView = statusFilter === "all" && searchTerm === "";

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-destructive container mx-auto px-4 py-8">
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
      <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-foreground self-start md:self-center">
          My Courses
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusOptions).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button asChild className="w-full sm:w-auto">
            <Link href={createCourseHref} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Course
            </Link>
          </Button>
        </div>
      </div>

      {isLoading && !courses.length ? (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => <CourseSkeleton key={i} />)}
        </div>
      ) : !courses.length ? (
        <EmptyState
          message={isDefaultView ? "You haven't created any courses yet." : "No courses found."}
          {...(isDefaultView && { linkPath: createCourseHref, linkText: "Create your first course" })}
        />
      ) : (
        <div className="relative grid gap-4 grid-cols-1 lg:grid-cols-2">
          {/* Sub-loading overlay for subsequent searches/filters */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/40 z-10 flex justify-center items-start pt-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {courses.map((course) => (
            <TutorCourseCard key={course.slug} course={course} makeContextLink={makeContextLink} />
          ))}
        </div>
      )}
    </div>
  );
}