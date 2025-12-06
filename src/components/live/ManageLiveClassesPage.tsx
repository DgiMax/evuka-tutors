"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api/axios";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Calendar,
  ListVideo,
  ArrowLeft,
  Clock
} from "lucide-react";

import { LiveClassEditModal } from "@/components/live/LiveClassEditModal";
import { ConfirmDeleteModal } from "@/components/live/ConfirmDeleteModal";

export interface LiveLesson {
  id: number;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  description: string;
}

export interface LiveClass {
  id: number;
  slug: string;
  title: string;
  recurrence_type: "none" | "weekly";
  lessons: LiveLesson[];
  recurrence_days: Record<string, string>;
  start_date: string;
  end_date?: string;
  lesson_duration: number;
  lessons_count?: number;
}

export interface CourseWithLiveClasses {
  id: number;
  slug: string;
  title: string;
  thumbnail: string;
  live_classes: LiveClass[];
}

function formatRecurrence(liveClass: LiveClass): string {
  if (liveClass.recurrence_type === "none") {
    return "One-time session";
  }
  const days = Object.keys(liveClass.recurrence_days || {});
  if (days.length === 0) return "Weekly";
  return `Weekly on ${days.join(", ")}`;
}

export default function ManageLiveClassesPage() {
  const router = useRouter();
  const params = useParams();
  const courseSlug = params.slug as string;

  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [classToEdit, setClassToEdit] = useState<LiveClass | null>(null);
  const [classToDelete, setClassToDelete] = useState<LiveClass | null>(null);

  const fetchLiveClasses = useCallback(async () => {
    if (!courseSlug) return;
    try {
      const response = await api.get<CourseWithLiveClasses[]>(`/live/all-classes/`);
      const courseData = response.data.find((course) => course.slug === courseSlug);

      if (courseData) {
        setLiveClasses(courseData.live_classes || []);
        setCourseTitle(courseData.title || "Course");
      } else {
        setLiveClasses([]);
        setCourseTitle("Course");
      }
    } catch (error) {
      toast.error("Failed to load live classes.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [courseSlug]);

  useEffect(() => {
    fetchLiveClasses();
  }, [fetchLiveClasses]);

  const handleDelete = async () => {
    if (!classToDelete) return;
    setIsDeleting(classToDelete.id);
    try {
      await api.delete(`/live/${classToDelete.slug}/`);
      toast.success("Live class deleted successfully.");
      setClassToDelete(null);
      fetchLiveClasses();
    } catch (error) {
      toast.error("Failed to delete class.");
    } finally {
      setIsDeleting(null);
    }
  };

  const onEditSuccess = () => {
    setClassToEdit(null);
    fetchLiveClasses();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading classes...</p>
      </div>
    );
  }

  return (
    <>
      <Card className="max-w-5xl mx-4 sm:mx-auto my-8 shadow-none border-0">
        <CardHeader className="px-0">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 w-fit pl-0 hover:bg-transparent hover:text-primary"
            onClick={() => router.back()}
          >
            <ArrowLeft size={16} className="mr-2" /> Back to Course
          </Button>

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Live Classes</CardTitle>
              <CardDescription className="mt-1">
                Manage schedules for <span className="font-medium text-foreground">{courseTitle}</span>
              </CardDescription>
            </div>
            <Link href={`/tutor/courses/${courseSlug}/live-classes/create`}>
              <Button>
                <Plus size={16} className="mr-2" /> Create New Class
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="px-0 space-y-4">
          {liveClasses.length === 0 ? (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertTitle>No Live Classes Scheduled</AlertTitle>
              <AlertDescription>
                Create a weekly series or a one-time webinar to engage with your students.
              </AlertDescription>
            </Alert>
          ) : (
            liveClasses.map((liveClass) => (
              <div
                key={liveClass.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-5 border rounded-xl bg-card gap-4 hover:border-primary/50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{liveClass.title}</h3>
                    <Badge variant={liveClass.recurrence_type === 'none' ? "secondary" : "default"}>
                      {liveClass.recurrence_type === 'none' ? 'One-Time' : 'Recurring'}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{formatRecurrence(liveClass)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>
                        {liveClass.lesson_duration} mins • {liveClass.lessons_count || liveClass.lessons?.length || 0} sessions
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
                  <Link href={`/tutor/courses/${courseSlug}/live-classes/${liveClass.slug}`}>
                    <Button variant="secondary" size="sm" className="w-full md:w-auto">
                      <ListVideo size={14} className="mr-2" /> Manage Lessons
                    </Button>
                  </Link>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full md:w-auto"
                    onClick={() => setClassToEdit(liveClass)}
                  >
                    <Edit size={14} className="mr-2" /> Settings
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full md:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setClassToDelete(liveClass)}
                    disabled={isDeleting === liveClass.id}
                  >
                    {isDeleting === liveClass.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <LiveClassEditModal
        isOpen={!!classToEdit}
        onClose={() => setClassToEdit(null)}
        liveClass={classToEdit}
        onSuccess={onEditSuccess}
      />

      <ConfirmDeleteModal
        isOpen={!!classToDelete}
        onClose={() => setClassToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Live Class"
        description={`Are you sure you want to delete "${classToDelete?.title}"? This will delete all scheduled lessons within this class.`}
        isLoading={!!isDeleting}
      />
    </>
  );
}