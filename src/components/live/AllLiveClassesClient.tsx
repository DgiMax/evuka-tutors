"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api/axios";
import { Badge } from "@/components/ui/badge";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg"; // Context-aware hook

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, ListChecks, Calendar, Loader2 } from "lucide-react";
import Image from "next/image";

// --- TYPE DEFINITIONS ---
interface LiveClassMinimal {
  id: number;
  slug: string;
  title: string;
  recurrence_type: "none" | "weekly";
  recurrence_days: Record<string, string>;
  start_date: string;
  lessons_count: number;
}

interface CourseWithLiveClasses {
  id: number;
  slug: string;
  title: string;
  thumbnail: string | null;
  live_classes: LiveClassMinimal[];
}

// --- Helper Function ---
function formatRecurrence(liveClass: LiveClassMinimal): string {
  if (liveClass.recurrence_type === "none") {
    return "One-time class";
  }
  const days = Object.keys(liveClass.recurrence_days || {});
  if (days.length === 0) return "Weekly (no days set)";
  return `Weekly on ${days.join(", ")}`;
}

// --- Main Page Component ---
export default function AllLiveClassesClient() {
  const router = useRouter();
  const { activeSlug } = useActiveOrg();

  const [courses, setCourses] = useState<CourseWithLiveClasses[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Data fetching function
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = activeSlug ? { "X-Organization-Slug": activeSlug } : {};
      const response = await api.get("/live/all-classes/", { headers });
      setCourses(response.data.results || response.data || []);
    } catch (error) {
      toast.error("Failed to load live class data.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [activeSlug]);

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Helper to build context-aware links
  const getPath = (path: string) => (activeSlug ? `/${activeSlug}${path}` : path);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading all schedules...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl my-8 px-4">
      <CardHeader className="px-0">
        <CardTitle className="text-3xl font-bold">Live Classes Dashboard</CardTitle>
        <CardDescription>
          Manage all your live class schedules, grouped by course.
        </CardDescription>
      </CardHeader>

      {courses.length === 0 ? (
        <Alert variant="default" className="mt-6">
          <Calendar className="h-4 w-4" />
          <AlertTitle>No Courses Found</AlertTitle>
          <AlertDescription>
            You haven't created any courses yet. Once you create a course, you can
            add live classes to it.
            <Button asChild size="sm" className="ml-4 rounded">
              <Link href={getPath("/create-course")}>
                <Plus size={16} className="mr-2" /> Create Course
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-8 mt-6">
          {courses.map((course) => (
            // ✅ CORRECTION: Added 'p-0' to the Card to remove its default padding.
            <Card
              key={course.id}
              className="shadow-sm rounded-lg overflow-hidden p-0"
            >
              {/* --- Course Header --- */}
              {/* ✅ CORRECTION: Added padding (p-6) back to the header itself. */}
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/50 border-b p-6">
                <div className="flex items-center gap-4">
                  <Image
                    src={
                      course.thumbnail ||
                      "https://placehold.co/100x75/f5f7f9/2d3339?text=Course"
                    }
                    alt={course.title}
                    width={100}
                    height={75}
                    className="rounded-md border object-cover w-[100px] h-[75px] flex-shrink-0"
                  />
                  <div>
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    <CardDescription>Course Slug: {course.slug}</CardDescription>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="rounded w-full sm:w-auto"
                >
                  <Link href={getPath(`/courses/${course.slug}/live-classes`)}>
                    <Plus size={16} className="mr-2" /> Add/Manage Schedule
                  </Link>
                </Button>
              </CardHeader>

              {/* --- List of Live Classes for this Course --- */}
              {/* ✅ CORRECTION: Added padding (p-6) back to the content area. */}
              <CardContent className="p-6">
                {course.live_classes.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No live class series scheduled for this course yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {course.live_classes.map((liveClass) => (
                      <div
                        key={liveClass.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-md gap-3"
                      >
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {liveClass.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {formatRecurrence(liveClass)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="secondary">
                            {liveClass.lessons_count} lessons
                          </Badge>
                          <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="rounded"
                          >
                            <Link
                              href={getPath(
                                `/courses/${course.slug}/live-classes/${liveClass.slug}/manage`
                              )}
                            >
                              <ListChecks size={14} className="mr-2" /> Manage
                              Lessons
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}