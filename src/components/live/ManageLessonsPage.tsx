// app/tutor/courses/[slug]/live-classes/[class_slug]/manage/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api/axios";
import { format, parseISO, isPast, differenceInMinutes } from "date-fns";
import { Loader2, Edit, Trash2, ArrowLeft, CalendarOff, CheckCircle, Clock, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Make sure these paths are correct for your project
import { LessonEditModal } from "@/components/live/LessonEditModal";
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
  lessons: LiveLesson[];
}

// --- Helper Function ---
function combineDateTime(date: string, time: string): Date {
  // Handles both "HH:MM" and "HH:MM:SS"
  return parseISO(`${date}T${time}`);
}


export default function ManageLessonsPage() {
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonToEdit, setLessonToEdit] = useState<LiveLesson | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<LiveLesson | null>(null);
  
  const params = useParams();
  const router = useRouter();
  const { slug, class_slug } = params;

  // --- (Fetch and refresh data logic) ---
  const fetchClassDetails = useCallback(async () => {
    if (!class_slug) return;
    try {
      setLoading(true);
      const response = await api.get(`/live/classes/${class_slug}/`);
      // Sort lessons by date
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

  // --- (Delete logic) ---
  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;
    try {
      await api.delete(`/live/lessons/${lessonToDelete.id}/`);
      toast.success("Lesson cancelled successfully.");
      setLessonToDelete(null);
      refreshData();
    } catch (error) {
      toast.error("Failed to cancel lesson.");
    }
  };

  // 2. Add a Join function
  const handleJoin = async (lessonId: number) => {
    const toastId = toast.loading("Generating secure join link...");
    try {
      // Call the 'join' action on the LiveLesson endpoint
      const response = await api.get(`/live/lessons/${lessonId}/join/`);
      const { meeting_url } = response.data;
      
      toast.success("Redirecting to meeting...", { id: toastId });
      window.open(meeting_url, "_blank"); // Open in a new tab

    } catch (error) {
      console.error("Failed to join lesson:", error);
      toast.error("Failed to get join link. Are you the correct tutor?", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-500">Loading lessons...</p>
      </div>
    );
  }

  if (!liveClass) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-600">Could not load class details.</p>
      </div>
    );
  }

  const upcomingLessons = liveClass.lessons.filter(l => !isPast(combineDateTime(l.date, l.end_time)));
  const pastLessons = liveClass.lessons.filter(l => isPast(combineDateTime(l.date, l.end_time)));
  const now = new Date();

  return (
    <>
      <Card className="max-w-4xl mx-auto my-8 border border-gray-200 rounded text-black shadow-none">
        <CardHeader>
          <Button variant="outline" size="sm" className="mb-4 w-fit rounded" onClick={() => router.back()}>
            <ArrowLeft size={16} className="mr-2" /> Go Back
          </Button>
          <CardTitle>Manage Lessons: {liveClass.title}</CardTitle>
          <CardDescription>
            View, edit, or cancel individual lessons from this series.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {liveClass.lessons.length === 0 ? (
            <Alert variant="default" className="bg-gray-50">
              <CalendarOff className="h-4 w-4" />
              <AlertTitle>No Lessons Found</AlertTitle>
              <AlertDescription>
                This class series has no lessons. You may need to edit the series to regenerate them.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* --- Upcoming Lessons --- */}
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center"><Clock size={18} className="mr-2 text-blue-600" /> Upcoming Lessons</h3>
                <div className="space-y-3">
                  {upcomingLessons.length > 0 ? (
                    upcomingLessons.map((lesson) => {
                      const startTime = combineDateTime(lesson.date, lesson.start_time);
                      const minutesToStart = differenceInMinutes(startTime, now);
                      // Tutors can join 30 mins before and up to 2 hours after start
                      const isJoinable = minutesToStart <= 30 && minutesToStart > -120;
                      
                      return (
                        <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
                          <div>
                            <h3 className="font-semibold">{lesson.title}</h3>
                            <p className="text-sm text-gray-600">
                              {format(startTime, "eee, MMM d, yyyy 'at' h:mm a")}
                            </p>
                            {isJoinable && !isPast(startTime) && (
                              <p className="text-xs text-blue-600 font-medium">Starting soon</p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {/* Add this Join Button */}
                            {isJoinable && (
                              <Button size="sm" className="rounded" onClick={() => handleJoin(lesson.id)}>
                                <Video size={14} className="mr-2" /> Join Now
                              </Button>
                            )}
                            <Button variant="secondary" size="sm" className="rounded" onClick={() => setLessonToEdit(lesson)}>
                              <Edit size={14} className="mr-2" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" className="rounded" onClick={() => setLessonToDelete(lesson)}>
                              <Trash2 size={14} className="mr-2" /> Cancel
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 italic">No upcoming lessons.</p>
                  )}
                </div>
              </div>

              {/* --- Past Lessons --- */}
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center"><CheckCircle size={18} className="mr-2 text-green-600" /> Past Lessons</h3>
                <div className="space-y-3">
                  {pastLessons.length > 0 ? (
                    pastLessons.map((lesson) => (
                      <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 opacity-70">
                        <div>
                          <h3 className="font-semibold text-gray-700">{lesson.title}</h3>
                          <p className="text-sm text-gray-500">
                            {format(combineDateTime(lesson.date, lesson.start_time), "eee, MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No past lessons yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* --- Modals --- */}
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
        title="Cancel Lesson"
        description={`Are you sure you want to cancel the lesson "${lessonToDelete?.title}"? This cannot be undone.`}
      />
    </>
  );
}