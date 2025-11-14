"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api/axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Edit, Trash2, Loader2, Calendar, ListChecks, ArrowLeft } from "lucide-react";

// Make sure these import paths are correct for your project
import { LiveClassEditModal } from "@/components/live/LiveClassEditModal";
import { ConfirmDeleteModal } from "@/components/live/ConfirmDeleteModal";

// --- TYPE DEFINITIONS ---
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
}

// --- Helper Function ---
function formatRecurrence(liveClass: LiveClass): string {
  if (liveClass.recurrence_type === "none") {
    return "One-time class";
  }
  const days = Object.keys(liveClass.recurrence_days || {});
  if (days.length === 0) return "Weekly (no days set)";
  return `Weekly on ${days.join(", ")}`;
}

// --- Main Page Component ---
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

  // Data fetching function
  const fetchLiveClasses = useCallback(async () => {
    if (!courseSlug) return;
    try {
      const response = await api.get(`/tutor-courses/${courseSlug}/`);
      setLiveClasses(response.data.live_classes || []);
      setCourseTitle(response.data.title || "Course");
    } catch (error) {
      toast.error("Failed to load live classes for this course.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [courseSlug]);

  // Fetch data on component mount
  useEffect(() => {
    fetchLiveClasses();
  }, [fetchLiveClasses]);

  // Delete handler
  const handleDelete = async () => {
    if (!classToDelete) return;
    setIsDeleting(classToDelete.id);
    try {
      await api.delete(`/live/classes/${classToDelete.slug}/`);
      toast.success("Live class deleted successfully.");
      setClassToDelete(null);
      fetchLiveClasses(); // Re-fetch data
    } catch (error) {
      toast.error("Failed to delete class.");
    } finally {
      setIsDeleting(null);
    }
  };
  
  // Edit success handler
  const onEditSuccess = () => {
    setClassToEdit(null);
    fetchLiveClasses(); // Re-fetch data
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-500">Loading classes...</p>
      </div>
    );
  }

  return (
    <>
      <Card className="max-w-4xl mx-auto my-8 border border-gray-200 rounded text-black shadow-none">
        <CardHeader>
          <Button variant="outline" size="sm" className="mb-4 w-fit rounded" onClick={() => router.back()}>
            <ArrowLeft size={16} className="mr-2" /> Go Back
          </Button>

          <div className="flex justify-between items-center">
            <CardTitle>Live Class Schedules</CardTitle>
            <Link href={`/courses/${courseSlug}/live-classes/create`}>
              <Button variant="outline" className="rounded">
                <Plus size={16} className="mr-2" /> Create New
              </Button>
            </Link>
          </div>
          <CardDescription>
            Manage the recurring live classes for: <strong>{courseTitle}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {liveClasses.length === 0 ? (
            <Alert variant="default" className="bg-gray-50">
              <Calendar className="h-4 w-4" />
              <AlertTitle>No Live Classes Scheduled</AlertTitle>
              <AlertDescription>
                Click "Create New" to add a weekly Q&A session.
              </AlertDescription>
            </Alert>
          ) : (
            liveClasses.map((liveClass) => (
              <div key={liveClass.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4">
                <div>
                  <h3 className="font-semibold">{liveClass.title}</h3>
                  <p className="text-sm text-gray-600">
                    {formatRecurrence(liveClass)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {liveClass.lessons.length} lessons generated
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/courses/${courseSlug}/live-classes/${liveClass.slug}/manage`}>
                    <Button variant="outline" size="sm" className="rounded">
                      <ListChecks size={14} className="mr-2" /> Manage Lessons
                    </Button>
                  </Link>
                  <Button variant="secondary" size="sm" className="rounded" onClick={() => setClassToEdit(liveClass)}>
                    <Edit size={14} className="mr-2" /> Edit Series
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded"
                    onClick={() => setClassToDelete(liveClass)}
                    disabled={isDeleting === liveClass.id}
                  >
                    {isDeleting === liveClass.id ? (
                      <Loader2 size={14} className="mr-2 animate-spin" />
                    ) : (
                      <Trash2 size={14} className="mr-2" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      
      {/* --- Modals --- */}
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
        title="Delete Live Class Series"
        description={`Are you sure you want to delete "${classToDelete?.title}"? This will delete all ${classToDelete?.lessons.length} of its lessons.`}
        isLoading={!!isDeleting}
      />
    </>
  );
}