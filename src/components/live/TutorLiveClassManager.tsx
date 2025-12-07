"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api/axios";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Calendar, 
  ListVideo, 
  Settings, 
  Clock, 
  CalendarOff 
} from "lucide-react";

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
    <Card className="max-w-5xl mx-4 sm:mx-auto my-8 p-0 border border-border shadow-none sm:shadow-sm">
      <CardHeader className="p-6 p-6 bg-muted/10 border-b">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">Live Class Schedules</CardTitle>
            <CardDescription className="mt-1">
              Manage your live class series and one-time sessions.
            </CardDescription>
          </div>
          <Link href={`/tutor/courses/${courseSlug}/live-classes/create`} className="w-full md:w-auto">
            <Button className="w-full md:w-auto">
              <Plus size={16} className="mr-2" /> Create New
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 py-2 space-y-8">
        {liveClasses.length === 0 ? (
          <Alert className="bg-muted/30 border-dashed border-muted p-8 flex flex-col items-center text-center justify-center">
            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
               <CalendarOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <AlertTitle className="text-lg font-semibold">No Live Classes Scheduled</AlertTitle>
            <AlertDescription className="mt-2 text-muted-foreground">
              Click "Create New" to add a session.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {liveClasses.map((liveClass) => (
              <div 
                key={liveClass.id} 
                className="flex flex-col md:flex-row md:items-center justify-between p-6 border rounded-xl bg-card gap-6 hover:border-primary/50 transition-all"
              >
                {/* Info Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-lg text-foreground">{liveClass.title}</h3>
                    <Badge variant={liveClass.recurrence_type === 'none' ? "secondary" : "default"} className="border-0">
                      {liveClass.recurrence_type === 'none' ? 'One-time' : 'Recurring'}
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
                            {liveClass.lessons.length} lesson{liveClass.lessons.length !== 1 ? 's' : ''} scheduled
                        </span>
                    </div>
                  </div>
                </div>
                
                {/* Actions Section */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0">
                  <Link href={`/tutor/courses/${courseSlug}/live-classes/${liveClass.slug}`} className="w-auto">
                    <Button variant="secondary" size="sm" className="w-auto shadow-sm">
                      <ListVideo size={14} className="mr-2" /> Manage Lessons
                    </Button>
                  </Link>
                  
                  <Link href={`/tutor/courses/${courseSlug}/live-classes/${liveClass.slug}/edit`} className="w-auto">
                    <Button variant="outline" size="sm" className="w-auto">
                      <Settings size={14} className="mr-2" /> Settings
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(liveClass)}
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
  );
}