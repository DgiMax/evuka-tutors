"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api/axios";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, Edit, Trash2, Calendar, 
  ArrowLeft, Clock, CalendarOff, LayoutGrid, Settings2, AlertCircle, BookCheck
} from "lucide-react";

import { LiveClassFormModal } from "./LiveClassFormModal";
import { ConfirmDeleteModal } from "@/components/live/ConfirmDeleteModal";

const Loader2 = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

export default function ManageLiveClassesPage() {
  const router = useRouter();
  const params = useParams();
  const courseSlug = params.slug as string;

  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [courseId, setCourseId] = useState<number | null>(null);
  const [courseStatus, setCourseStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [classToDelete, setClassToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!courseSlug) return;
    setIsLoading(true);
    try {
      const courseRes = await api.get(`/tutor-courses/${courseSlug}/`);
      setCourseTitle(courseRes.data.title);
      setCourseId(courseRes.data.id);
      setCourseStatus(courseRes.data.status);

      if (courseRes.data.status === "published") {
        const response = await api.get(`/live/manage/classes/?course_slug=${courseSlug}`);
        setLiveClasses(response.data || []);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("Course repository not found.");
        router.push("/tutor/courses");
      } else {
        toast.error("Failed to sync live schedules.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [courseSlug, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateNew = () => {
    if (courseStatus !== "published") {
      toast.error("You must publish this course before scheduling live classes.");
      return;
    }
    setSelectedClass(null);
    setIsModalOpen(true);
  };

  const handleEditClass = (lc: any) => {
    setSelectedClass({ ...lc, duration_minutes: lc.lesson_duration });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!classToDelete) return;
    setIsDeleting(classToDelete.id);
    try {
      await api.delete(`/live/manage/classes/${classToDelete.slug}/`);
      toast.success("Schedule series removed.");
      setClassToDelete(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete schedule.");
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) return <PageSkeleton />;

  const isUnpublished = courseStatus !== "published";

  return (
    <div className="container mx-auto max-w-5xl py-6 md:py-8 px-4 space-y-8 md:space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-2 -ml-2 h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-transparent hover:text-primary"
            onClick={() => router.back()}
          >
            <ArrowLeft size={14} className="mr-2" /> Back to Curriculum
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground capitalize">
            {courseTitle || "Course Curriculum"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">
              Series Management Dashboard
            </p>
            {isUnpublished && (
              <Badge variant="outline" className="text-[8px] h-4 border-amber-200 bg-amber-50 text-amber-600 font-black uppercase">
                Draft Mode
              </Badge>
            )}
          </div>
        </div>
        
        {!isUnpublished && (
          <Button onClick={handleCreateNew} className="hidden md:flex rounded-md font-bold h-10 shadow-none px-6 text-xs uppercase tracking-wider">
            <Plus size={16} className="mr-2" /> New Schedule
          </Button>
        )}
      </div>

      {isUnpublished ? (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="border-amber-200 bg-amber-50/30 shadow-none overflow-hidden">
            <CardContent className="p-8 md:p-12 flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-amber-900 mb-2">Publishing Required</h2>
              <p className="text-sm text-amber-800/70 max-w-md mb-8 leading-relaxed">
                To prevent scheduling conflicts and ensure student access, live classes can only be configured for <b>published courses</b>. Please complete your curriculum setup and publish the course first.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold h-11 px-8 shadow-none text-xs uppercase tracking-wider">
                  <Link href={`/tutor/courses/${courseSlug}/edit`}>
                    <Edit size={16} className="mr-2" /> Return to Editor
                  </Link>
                </Button>
                <Button variant="outline" asChild className="border-amber-200 bg-white text-amber-700 hover:bg-amber-50 rounded-md font-bold h-11 px-8 shadow-none text-xs uppercase tracking-wider">
                  <Link href={`/tutor/courses`}>
                    <BookCheck size={16} className="mr-2" /> View All Courses
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-muted-foreground/60 px-1">
            <LayoutGrid size={14} />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Scheduled Series</h3>
          </div>

          <div className="hidden md:grid gap-3">
            {liveClasses.length === 0 ? (
              <div className="p-20 text-center border border-dashed border-border rounded-md bg-muted/5 flex flex-col items-center">
                <CalendarOff className="h-8 w-8 text-muted-foreground opacity-20 mb-4" />
                <p className="text-sm text-muted-foreground font-medium mb-4 text-center">
                  No live series found for this curriculum.
                </p>
                <Button variant="outline" size="sm" onClick={handleCreateNew} className="rounded-md font-bold h-8 border-border">Create First Series</Button>
              </div>
            ) : (
              liveClasses.map((lc) => (
                <Card key={lc.id} className="rounded-md border border-border shadow-none overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-5 gap-6 hover:bg-muted/10 transition-colors">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-foreground truncate">{lc.title}</span>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold h-4 rounded-sm bg-muted/20 border-border px-1">{lc.recurrence_type}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                          <span className="flex items-center gap-1.5"><Calendar size={13} className="opacity-50" /> Starts: {lc.start_date}</span>
                          <span className="opacity-30">•</span>
                          <span className="flex items-center gap-1.5"><Clock size={13} className="opacity-50" /> {lc.lesson_duration} Mins</span>
                          <span className="opacity-30">•</span>
                          <span>{lc.lessons_count || 0} Sessions</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button asChild variant="ghost" size="sm" className="h-8 rounded-md text-[11px] font-bold border border-transparent hover:border-border">
                          <Link href={`/courses/${courseSlug}/live-classes/${lc.slug}/manage`}>Manage Lessons</Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:border-border" onClick={() => handleEditClass(lc)}><Edit size={16} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-md" onClick={() => setClassToDelete(lc)} disabled={isDeleting === lc.id}>
                          {isDeleting === lc.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="block md:hidden">
            <div className="flex items-center justify-between bg-muted/10 p-3 rounded-t-md border-x border-t border-border">
              <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Series List</h3>
              <Button onClick={handleCreateNew} size="icon" className="h-9 w-9 rounded-md bg-primary text-primary-foreground shadow-none"><Plus size={20} /></Button>
            </div>

            <div className="divide-y divide-border border border-border rounded-b-md overflow-hidden bg-card">
              {liveClasses.length === 0 ? (
                <div className="p-10 text-center bg-muted/5">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">No series scheduled</p>
                  <p className="text-[9px] text-muted-foreground/40 font-medium mt-1">Tap the plus to start</p>
                </div>
              ) : (
                liveClasses.map((lc) => (
                  <div key={lc.id} className="p-4 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <Badge variant="outline" className="text-[8px] font-black h-4 px-1.5 uppercase rounded-sm border-border">{lc.recurrence_type}</Badge>
                        <h4 className="font-bold text-[14px] text-foreground leading-tight truncate">{lc.title}</h4>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClass(lc)} className="h-8 w-8 rounded-md bg-muted/20"><Settings2 size={15} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setClassToDelete(lc)} className="h-8 w-8 rounded-md bg-red-50 text-red-600"><Trash2 size={15} /></Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-dashed border-border/60">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Clock size={11} /> {lc.start_date}</div>
                        <div className="text-[9px] font-bold text-muted-foreground/40 uppercase ml-4">{lc.lessons_count || 0} Sessions</div>
                      </div>
                      <Button asChild size="sm" className="h-8 px-4 rounded-md text-[10px] font-black uppercase tracking-widest bg-foreground text-background">
                        <Link href={`/courses/${courseSlug}/live-classes/${lc.slug}/manage`}>Manage</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      <LiveClassFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} courseId={courseId} selectedClass={selectedClass} onSuccess={fetchData} />
      <ConfirmDeleteModal isOpen={!!classToDelete} onClose={() => setClassToDelete(null)} onConfirm={handleDelete} title="Remove Series" description={`Delete "${classToDelete?.title}"?`} isLoading={!!isDeleting} />
    </div>
  );
}

const PageSkeleton = () => (
  <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      <div className="space-y-4">
        <Skeleton width={150} height={20} />
        <div className="flex justify-between items-center"><Skeleton width={300} height={32} /><Skeleton width={140} height={40} /></div>
      </div>
      <div className="space-y-3">
        <Skeleton width={120} height={14} />
        {[1, 2, 3].map((i) => <Skeleton key={i} height={80} borderRadius={8} />)}
      </div>
    </div>
  </SkeletonTheme>
);