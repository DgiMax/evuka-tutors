"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Calendar, Plus, ListVideo, ArrowRight } from "lucide-react";

import api from "@/lib/api/axios";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

function formatRecurrence(liveClass: LiveClassMinimal): string {
  if (liveClass.recurrence_type === "none") {
    return "One-time session";
  }
  const days = Object.keys(liveClass.recurrence_days || {});
  if (days.length === 0) return "Weekly";
  return `Weekly on ${days.join(", ")}`;
}

export default function AllLiveClassesClient() {
  const router = useRouter();
  const { activeSlug } = useActiveOrg();

  const [courses, setCourses] = useState<CourseWithLiveClasses[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const getPath = (path: string) => (activeSlug ? `/${activeSlug}${path}` : path);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading schedules...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl my-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3 mb-8">Live Classes Dashboard</h1>
        <p className="text-muted-foreground">
          Manage all your live class schedules, grouped by course.
        </p>
      </div>

      {courses.length === 0 ? (
        <Alert variant="default" className="mt-6">
          <Calendar className="h-4 w-4" />
          <AlertTitle>No Courses Found</AlertTitle>
          <AlertDescription>
            You haven't created any courses yet. Create a course to start adding live sessions.
            <div className="mt-4">
              <Button asChild size="sm">
                <Link href={getPath("/create-course")}>
                  <Plus size={16} className="mr-2" /> Create Course
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-8">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden border shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/30 border-b p-6">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-background">
                    <Image
                      src={course.thumbnail || "/images/placeholder-course.jpg"}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{course.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {course.live_classes.length} active series
                    </p>
                  </div>
                </div>
                <Button asChild variant="default" size="sm" className="w-full sm:w-auto">
                  <Link href={getPath(`/courses/${course.slug}/live-classes`)}>
                    Manage Course Schedule <ArrowRight size={16} className="ml-2" />
                  </Link>
                </Button>
              </div>

              <CardContent className="p-6">
                {course.live_classes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                    <Calendar className="h-8 w-8 mb-2 opacity-50" />
                    <p>No live classes scheduled yet.</p>
                    <Button asChild variant="link" size="sm" className="mt-1">
                      <Link href={getPath(`/courses/${course.slug}/live-classes/create`)}>
                        Schedule your first class
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                    {course.live_classes.map((liveClass) => (
                      <div
                        key={liveClass.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card"
                      >
                        <div className="space-y-1 mb-3 sm:mb-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{liveClass.title}</h4>
                            <Badge variant={liveClass.recurrence_type === 'none' ? "secondary" : "outline"}>
                              {liveClass.recurrence_type === 'none' ? 'One-Time' : 'Recurring'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar size={14} />
                            {formatRecurrence(liveClass)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-sm text-muted-foreground mr-2 hidden sm:block">
                            {liveClass.lessons_count} sessions
                          </div>
                          <Button asChild variant="secondary" size="sm" className="w-full sm:w-auto">
                            <Link href={getPath(`/courses/${course.slug}/live-classes/${liveClass.slug}/manage`)}>
                              <ListVideo size={14} className="mr-2" /> Manage Lessons
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