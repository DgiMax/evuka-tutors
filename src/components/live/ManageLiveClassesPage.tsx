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
  Clock,
  CalendarOff
} from "lucide-react";

import { LiveClassEditModal } from "@/components/live/LiveClassEditModal";
import { ConfirmDeleteModal } from "@/components/live/ConfirmDeleteModal";

// --- TYPES ---
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

// --- HELPER ---
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
      <Card className="max-w-5xl mx-4 sm:mx-auto my-8 border border-border shadow-none sm:shadow-sm">
        <CardHeader className="p-6 p-6 bg-muted/10 border-b">
          <div className="flex flex-col gap-4">
             <div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="mb-4 w-fit pl-0 hover:bg-transparent hover:text-primary"
                    onClick={() => router.back()}
                >
                    <ArrowLeft size={16} className="mr-2" /> Back to Course
                </Button>
             </div>

             {/* Title & Add Button */}
             <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <CardTitle className="text-2xl font-bold text-foreground">Live Classes</CardTitle>
                    <CardDescription className="mt-1">
                        Manage schedules for <span className="font-medium text-foreground">{courseTitle}</span>
                    </CardDescription>
                </div>
                
                <Link href={`/courses/${courseSlug}/live-classes/create`} className="w-full md:w-auto">
                    <Button className="w-full md:w-auto">
                        <Plus size={16} className="mr-2" /> Create New Class
                    </Button>
                </Link>
             </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 py-2 space-y-8">
          {liveClasses.length === 0 ? (
            <Alert className="bg-muted/30 border-dashed border-muted p-8 flex flex-col items-center text-center justify-center">
              <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <CalendarOff className="h-6 w-6 text-muted-foreground" />
              </div>
              <AlertTitle className="text-lg font-semibold">No Live Classes Scheduled</AlertTitle>
              <AlertDescription className="mt-2 text-muted-foreground max-w-sm mx-auto">
                Create a weekly series or a one-time webinar to engage with your students.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
                {liveClasses.map((liveClass) => (
                <div
                    key={liveClass.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-6 border rounded-xl bg-card gap-6 transition-all hover:border-primary/50"
                >
                    {/* Info Section */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-lg text-foreground">{liveClass.title}</h3>
                            <Badge variant={liveClass.recurrence_type === 'none' ? "secondary" : "default"} className="border-0">
                                {liveClass.recurrence_type === 'none' ? 'One-Time' : 'Recurring'}
                            </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Calendar size={14} />
                                <span>{formatRecurrence(liveClass)}</span>
                            </div>
                            <div className="hidden sm:block text-muted-foreground/30">•</div>
                            <div className="flex items-center gap-1.5">
                                <Clock size={14} />
                                <span>
                                    {liveClass.lesson_duration} mins • {liveClass.lessons_count || liveClass.lessons?.length || 0} sessions
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0">
                        <Link href={`/courses/${courseSlug}/live-classes/${liveClass.slug}/manage`} className="w-auto">
                            <Button variant="secondary" size="sm" className="w-auto shadow-sm">
                                <ListVideo size={14} className="mr-2" /> Manage Lessons
                            </Button>
                        </Link>
                        
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-auto"
                            onClick={() => setClassToEdit(liveClass)}
                        >
                            <Edit size={14} className="mr-2" /> Settings
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setClassToDelete(liveClass)}
                            disabled={isDeleting === liveClass.id}
                        >
                            {isDeleting === liveClass.id ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Trash2 size={14} className="mr-2 sm:mr-0" />
                            )}
                            <span className="sm:hidden">Delete</span>
                        </Button>
                    </div>
                </div>
                ))}
            </div>
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