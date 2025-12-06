"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api/axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Trash2, Loader2, Calendar, ListVideo, Settings } from "lucide-react";

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

function formatRecurrence(liveClass: LiveClass): string {
  if (liveClass.recurrence_type === "none") {
    return "One-time class";
  }
  const days = Object.keys(liveClass.recurrence_days || {});
  if (days.length === 0) {
    return "Weekly";
  }
  return `Weekly on ${days.join(", ")}`;
}

export default function TutorLiveClassManager({ liveClasses, courseSlug }: TutorLiveClassManagerProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleDelete = async (classToDelete: LiveClass) => {
    if (!window.confirm(`Are you sure you want to delete "${classToDelete.title}"?`)) {
      return;
    }

    setIsDeleting(classToDelete.id);
    try {
      await api.delete(`/live/${classToDelete.slug}/`);
      toast.success("Live class deleted successfully.");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete live class:", error);
      toast.error("Failed to delete class.");
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
          Manage your live class series and one-time sessions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {liveClasses.length === 0 ? (
          <Alert variant="default" className="bg-gray-50">
            <Calendar className="h-4 w-4" />
            <AlertTitle>No Live Classes Scheduled</AlertTitle>
            <AlertDescription>
              Click "Create New" to add a session.
            </AlertDescription>
          </Alert>
        ) : (
          liveClasses.map((liveClass) => (
            <div key={liveClass.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{liveClass.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${liveClass.recurrence_type === 'none' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {liveClass.recurrence_type === 'none' ? 'One-time' : 'Recurring'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {formatRecurrence(liveClass)}
                </p>
                <p className="text-sm text-gray-500">
                  {liveClass.lessons.length} lesson{liveClass.lessons.length !== 1 ? 's' : ''} scheduled
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Link href={`/tutor/courses/${courseSlug}/live-classes/${liveClass.slug}`}>
                  <Button variant="secondary" size="sm" className="rounded">
                    <ListVideo size={14} className="mr-2" /> Manage Lessons
                  </Button>
                </Link>
                
                <Link href={`/tutor/courses/${courseSlug}/live-classes/${liveClass.slug}/edit`}>
                  <Button variant="outline" size="sm" className="rounded">
                    <Settings size={14} className="mr-2" /> Settings
                  </Button>
                </Link>

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