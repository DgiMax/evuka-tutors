"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api/axios";
import { format, parseISO, isPast, differenceInMinutes } from "date-fns";
import { 
  Loader2, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  CalendarOff, 
  Clock, 
  Video, 
  Plus, 
  Calendar 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { LessonEditModal } from "@/components/live/LessonEditModal";
import { LessonCreateModal } from "@/components/live/LessonCreateModal";
import { ConfirmDeleteModal } from "@/components/live/ConfirmDeleteModal";

// --- TYPE DEFINITIONS ---
interface LiveLesson {
  id: number;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  description: string;
}

interface LiveClass {
  id: number;
  slug: string;
  title: string;
  recurrence_type: "none" | "weekly";
  lessons: LiveLesson[];
}

// --- HELPER FUNCTIONS ---
function combineDateTime(date: string, time: string): Date {
  return parseISO(`${date}T${time}`);
}

// Hook to get stable client-side time (Prevents hydration errors)
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    // Optional: Update every minute to keep buttons active live
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export default function ManageLessonsPage() {
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isCreating, setIsCreating] = useState(false);
  const [lessonToEdit, setLessonToEdit] = useState<LiveLesson | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<LiveLesson | null>(null);
  
  const params = useParams();
  const router = useRouter();
  const now = useNow(); // Safe client-side time
  
  const class_slug = params.class_slug as string;

  const fetchClassDetails = useCallback(async () => {
    if (!class_slug) return;
    try {
      setLoading(true);
      const response = await api.get(`/live/classes/${class_slug}/`);
      // Sort by date/time
      response.data.lessons.sort((a: LiveLesson, b: LiveLesson) => 
        combineDateTime(a.date, a.start_time).getTime() - 
        combineDateTime(b.date, b.start_time).getTime()
      );
      setLiveClass(response.data);
    } catch (error) {
      toast.error("Failed to load class details.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [class_slug]);

  useEffect(() => {
    fetchClassDetails();
  }, [fetchClassDetails]);
  
  const refreshData = async () => {
    try {
      const response = await api.get(`/live/classes/${class_slug}/`);
      response.data.lessons.sort((a: LiveLesson, b: LiveLesson) => 
        combineDateTime(a.date, a.start_time).getTime() - 
        combineDateTime(b.date, b.start_time).getTime()
      );
      setLiveClass(response.data);
    } catch (error) {
      toast.error("Failed to refresh data.");
    }
  };

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;
    try {
      await api.delete(`/live/lessons/${lessonToDelete.id}/`);
      toast.success("Lesson deleted successfully.");
      setLessonToDelete(null);
      refreshData();
    } catch (error) {
      toast.error("Failed to delete lesson.");
    }
  };

  const handleJoin = (lessonId: number) => {
    router.push(`/live-session/${lessonId}`); 
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading lessons...</p>
      </div>
    );
  }

  if (!liveClass) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p className="text-destructive">Could not load class details.</p>
      </div>
    );
  }

  // Filter lessons
  const upcomingLessons = liveClass.lessons.filter(l => !isPast(combineDateTime(l.date, l.end_time)));
  const pastLessons = liveClass.lessons.filter(l => isPast(combineDateTime(l.date, l.end_time)));

  return (
    <>
      <Card className="max-w-5xl mx-auto my-8 border-0 shadow-none">
        <CardHeader className="px-0 pb-6">
          <div className="flex justify-between items-start mb-4">
            <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent hover:text-primary" onClick={() => router.back()}>
              <ArrowLeft size={16} className="mr-2" /> Back to Schedules
            </Button>
            
            <Button onClick={() => setIsCreating(true)}>
              <Plus size={16} className="mr-2" /> Add Lesson
            </Button>
          </div>

          <CardTitle className="text-2xl">Manage Lessons: {liveClass.title}</CardTitle>
          <CardDescription>
            {liveClass.recurrence_type === 'none' 
              ? "Manage your one-time session details." 
              : "View, edit, or add lessons to this recurring series."}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0 space-y-8">
          {liveClass.lessons.length === 0 ? (
            <Alert className="bg-muted/50 border-muted">
              <CalendarOff className="h-4 w-4 text-muted-foreground" />
              <AlertTitle>No Lessons Scheduled</AlertTitle>
              <AlertDescription className="mt-2">
                This class currently has no lessons. 
                <Button variant="link" className="px-1 h-auto font-semibold" onClick={() => setIsCreating(true)}>
                  Click here to add one.
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {upcomingLessons.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center text-foreground">
                    <Clock size={18} className="mr-2 text-primary" /> Upcoming Lessons
                  </h3>
                  <div className="space-y-3">
                    {upcomingLessons.map((lesson) => {
                      const startTime = combineDateTime(lesson.date, lesson.start_time);
                      
                      let isJoinable = false;
                      if (now) {
                         const minutesToStart = differenceInMinutes(startTime, now);
                         // Join allowed: 30 mins before start until 2 hours after start (roughly ongoing)
                         isJoinable = minutesToStart <= 30 && minutesToStart > -120;
                      }

                      return (
                        <div key={lesson.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-xl bg-card gap-4 transition-all hover:border-primary/50">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{lesson.title}</h3>
                              {/* Show Badge if starting soon/ongoing */}
                              {isJoinable && (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700 animate-pulse">
                                  {isPast(startTime) ? "Ongoing" : "Starting Soon"}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar size={14} className="mr-1.5" />
                              {format(startTime, "EEEE, MMMM d, yyyy")}
                              <span className="mx-2">•</span>
                              <Clock size={14} className="mr-1.5" />
                              {format(startTime, "h:mm a")}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
                            {/* --- JOIN BUTTON --- */}
                            {isJoinable && (
                              <Button 
                                size="sm" 
                                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm" 
                                onClick={() => handleJoin(lesson.id)}
                              >
                                <Video size={14} className="mr-2" /> Join Now
                              </Button>
                            )}
                            {/* ------------------- */}

                            <Button variant="outline" size="sm" className="w-full md:w-auto" onClick={() => setLessonToEdit(lesson)}>
                              <Edit size={14} className="mr-2" /> Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full md:w-auto text-destructive hover:bg-destructive/10" 
                              onClick={() => setLessonToDelete(lesson)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {pastLessons.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center text-muted-foreground">
                    <Clock size={18} className="mr-2" /> Past Lessons
                  </h3>
                  <div className="space-y-3">
                    {pastLessons.map((lesson) => (
                      <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl bg-muted/30 opacity-75 gap-2">
                        <div>
                          <h3 className="font-medium text-foreground/80">{lesson.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(combineDateTime(lesson.date, lesson.start_time), "eee, MMM d, yyyy • h:mm a")}
                          </p>
                        </div>
                        <Badge variant="outline" className="w-fit">Completed</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* --- Modals --- */}
      {/* Ensure LessonCreateModal is imported and created based on my previous response */}
      <LessonCreateModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        liveClassId={liveClass.id}
        onSuccess={() => {
          setIsCreating(false);
          refreshData();
        }}
      />

      <LessonEditModal
        isOpen={!!lessonToEdit}
        onClose={() => setLessonToEdit(null)}
        lesson={lessonToEdit}
        onSuccess={() => {
          setLessonToEdit(null);
          refreshData();
        }}
      />
      
      <ConfirmDeleteModal
        isOpen={!!lessonToDelete}
        onClose={() => setLessonToDelete(null)}
        onConfirm={handleDeleteLesson}
        title="Delete Lesson"
        description={`Are you sure you want to delete "${lessonToDelete?.title}"? This cannot be undone.`}
      />
    </>
  );
}