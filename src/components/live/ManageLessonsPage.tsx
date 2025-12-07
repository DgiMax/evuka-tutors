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
  const now = useNow();
  
  const class_slug = params.class_slug as string;

  const fetchClassDetails = useCallback(async () => {
    if (!class_slug) return;
    try {
      setLoading(true);
      const response = await api.get(`/live/classes/${class_slug}/`);
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

  const upcomingLessons = liveClass.lessons.filter(l => !isPast(combineDateTime(l.date, l.end_time)));
  const pastLessons = liveClass.lessons.filter(l => isPast(combineDateTime(l.date, l.end_time)));

  return (
    <>
      <Card className="max-w-5xl mx-4 sm:mx-auto my-8 p-0 border border-border shadow-none sm:shadow-sm">
        <CardHeader className="p-6 p-6 bg-muted/10 border-b">
          <div className="flex flex-col gap-4">
             <div>
                <Button variant="ghost" size="sm" className="mb-4 w-fit pl-0 hover:bg-transparent hover:text-primary" onClick={() => router.back()}>
                    <ArrowLeft size={16} className="mr-2" /> Back to Schedules
                </Button>
             </div>

             <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <CardTitle className="text-2xl font-bold">{liveClass.title}</CardTitle>
                    <CardDescription className="mt-1 max-w-2xl">
                    {liveClass.recurrence_type === 'none' 
                        ? "Manage your one-time session details." 
                        : "View, edit, or add lessons to this recurring series."}
                    </CardDescription>
                </div>
                
                <Button onClick={() => setIsCreating(true)} className="w-full md:w-auto shrink-0">
                    <Plus size={16} className="mr-2" /> Add Lesson
                </Button>
             </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 py-2 space-y-8">
          {liveClass.lessons.length === 0 ? (
            <Alert className="bg-muted/30 border-dashed border-muted p-8 flex flex-col items-center text-center justify-center">
              <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <CalendarOff className="h-6 w-6 text-muted-foreground" />
              </div>
              <AlertTitle className="text-lg font-semibold">No Lessons Scheduled</AlertTitle>
              <AlertDescription className="mt-2 text-muted-foreground max-w-sm mx-auto">
                This class currently has no lessons. 
                <br />
                <Button variant="link" className="px-1 h-auto font-semibold mt-2" onClick={() => setIsCreating(true)}>
                   Schedule your first lesson now
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {upcomingLessons.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center text-foreground px-1">
                    <Clock size={18} className="mr-2 text-primary" /> Upcoming Lessons
                  </h3>
                  <div className="space-y-4">
                    {upcomingLessons.map((lesson) => {
                      const startTime = combineDateTime(lesson.date, lesson.start_time);
                      
                      let isJoinable = false;
                      if (now) {
                          const minutesToStart = differenceInMinutes(startTime, now);
                          isJoinable = minutesToStart <= 30 && minutesToStart > -120;
                      }

                      return (
                        <div key={lesson.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 border rounded-xl bg-card gap-6 transition-all hover:border-primary/50">
                          {/* Lesson Info */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-semibold text-base text-foreground">{lesson.title}</h3>
                              {isJoinable && (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700 animate-pulse border-0">
                                  {isPast(startTime) ? "Ongoing" : "Starting Soon"}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-y-1">
                              <div className="flex items-center">
                                <Calendar size={14} className="mr-1.5" />
                                {format(startTime, "EEEE, MMMM d, yyyy")}
                              </div>
                              <span className="mx-2 hidden sm:inline">•</span>
                              <div className="flex items-center w-full sm:w-auto mt-1 sm:mt-0">
                                <Clock size={14} className="mr-1.5" />
                                {format(startTime, "h:mm a")}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons - Inline & Compact */}
                          <div className="flex items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0">
                            {isJoinable && (
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-auto" 
                                onClick={() => handleJoin(lesson.id)}
                              >
                                <Video size={14} className="mr-2" /> Join
                              </Button>
                            )}

                            <Button variant="outline" size="sm" className="w-auto" onClick={() => setLessonToEdit(lesson)}>
                              <Edit size={14} className="mr-2" /> Edit
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:bg-destructive/10 w-auto hover:text-destructive" 
                              onClick={() => setLessonToDelete(lesson)}
                            >
                              <Trash2 size={14} className="mr-2 sm:mr-0" />
                              <span className="sm:hidden">Delete</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {pastLessons.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold flex items-center text-muted-foreground px-1">
                    <Clock size={18} className="mr-2" /> Past Lessons
                  </h3>
                  <div className="space-y-3">
                    {pastLessons.map((lesson) => (
                      <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl bg-muted/20 gap-2 opacity-80 hover:opacity-100 transition-opacity">
                        <div>
                          <h3 className="font-medium text-foreground/80">{lesson.title}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {format(combineDateTime(lesson.date, lesson.start_time), "eee, MMM d, yyyy • h:mm a")}
                          </p>
                        </div>
                        <Badge variant="secondary" className="w-fit bg-muted text-muted-foreground border-muted-foreground/20">Completed</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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