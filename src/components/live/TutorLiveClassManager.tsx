"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api/axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Edit, Trash2, Loader2, Calendar, Users } from "lucide-react";

// --- TYPE DEFINITIONS ---
// These match the data from your LiveClassSerializer
interface LiveLesson {
  id: number;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
}

interface LiveClass {
  id: number;
  slug: string;
  title: string;
  recurrence_type: "none" | "weekly";
  lessons: LiveLesson[];
  recurrence_days: Record<string, string>;
}

interface TutorLiveClassManagerProps {
  liveClasses: LiveClass[];
  courseSlug: string;
}

// --- HELPER FUNCTION ---
function formatRecurrence(liveClass: LiveClass): string {
  if (liveClass.recurrence_type === "none") {
    return "One-time class";
  }
  const days = Object.keys(liveClass.recurrence_days || {});
  if (days.length === 0) {
    return "Weekly (no days set)";
  }
  return `Weekly on ${days.join(", ")}`;
}

// --- MAIN COMPONENT ---
export default function TutorLiveClassManager({ liveClasses, courseSlug }: TutorLiveClassManagerProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleDelete = async (classToDelete: LiveClass) => {
    if (!window.confirm(`Are you sure you want to delete "${classToDelete.title}"? This will delete all ${classToDelete.lessons.length} of its scheduled lessons.`)) {
      return;
    }

    setIsDeleting(classToDelete.id);
    try {
      // Use the LiveClass API endpoint with its 'slug'
      await api.delete(`/live/${classToDelete.slug}/`);
      toast.success("Live class deleted successfully.");
      // Refresh the page data. router.refresh() is the standard Next.js way.
      router.refresh(); 
    } catch (error) {
      console.error("Failed to delete live class:", error);
      toast.error("Failed to delete class. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Card className="shadow-none border-0">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Live Class Schedules</CardTitle>
          <Link href={`/tutor/courses/${courseSlug}/live-classes/create`}>
            <Button variant="outline" className="rounded">
              <Plus size={16} className="mr-2" /> Create New
            </Button>
          </Link>
        </div>
        <CardDescription>
          Manage the recurring live classes associated with this course.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {liveClasses.length === 0 ? (
          <Alert variant="default" className="bg-gray-50">
            <Calendar className="h-4 w-4" />
            <AlertTitle>No Live Classes Scheduled</AlertTitle>
            <AlertDescription>
              Click "Create New" to add a weekly Q&A session, a cohort-based schedule, or a one-time webinar.
            </AlertDescription>
          </Alert>
        ) : (
          liveClasses.map((liveClass) => (
            <div key={liveClass.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">{liveClass.title}</h3>
                <p className="text-sm text-gray-600">
                  {formatRecurrence(liveClass)}
                </p>
                <p className="text-sm text-gray-500">
                  {liveClass.lessons.length} lessons generated
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded" disabled>
                  <Edit size={14} className="mr-2" /> Edit
                  {/* Note: You will need a new page for editing, e.g., /live-classes/[class_slug]/edit */}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded"
                  onClick={() => handleDelete(liveClass)}
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
  );
}