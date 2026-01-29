"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api/axios";
import { format, parseISO, isPast, addMinutes, isBefore } from "date-fns";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { 
  Edit, Trash2, ArrowLeft, CalendarOff, 
  Clock, Video, Plus, Calendar, Ban, LayoutGrid
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { LessonEditModal } from "@/components/live/LessonEditModal";
import { LessonCreateModal } from "@/components/live/LessonCreateModal";
import { ConfirmDeleteModal } from "@/components/live/ConfirmDeleteModal";

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export default function ManageLessonsPage() {
  const [liveClass, setLiveClass] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [lessonToEdit, setLessonToEdit] = useState<any | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<any | null>(null);
  
  const params = useParams();
  const router = useRouter();
  const now = useNow();
  
  const class_slug = params.class_slug as string;

  const fetchClassDetails = useCallback(async () => {
    if (!class_slug) return;
    try {
      setLoading(true);
      const response = await api.get(`/live/manage/classes/${class_slug}/`);
      setLiveClass(response.data);
    } catch (error) {
      toast.error("Failed to load session details.");
    } finally {
      setLoading(false);
    }
  }, [class_slug]);

  useEffect(() => { fetchClassDetails(); }, [fetchClassDetails]);
  
  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;
    try {
      await api.post(`/live/lessons/${lessonToDelete.id}/cancel/`);
      toast.success("Session cancelled successfully.");
      setLessonToDelete(null);
      fetchClassDetails();
    } catch (error) {
      toast.error("Failed to cancel lesson.");
    }
  };

  const handleJoin = (lessonId: number) => {
    router.push(`/live-session/${lessonId}`); 
  };

  if (loading) return <LessonSkeleton />;
  if (!liveClass) return null;

  const allLessons = liveClass.lessons || liveClass.lessons_preview || [];
  
  const upcomingLessons = allLessons.filter((l: any) => {
    const endTime = parseISO(l.end_datetime);
    return !isPast(endTime) && !l.is_cancelled;
  }).sort((a: any, b: any) => parseISO(a.start_datetime).getTime() - parseISO(b.start_datetime).getTime());

  const pastLessons = allLessons.filter((l: any) => {
    const endTime = parseISO(l.end_datetime);
    return isPast(endTime) || l.is_cancelled;
  }).sort((a: any, b: any) => parseISO(b.start_datetime).getTime() - parseISO(a.start_datetime).getTime());

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
            <ArrowLeft size={14} className="mr-2" /> Back to Schedule
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{liveClass.title}</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">
            {liveClass.recurrence_type === 'none' ? "Single Session Series" : "Recurring Lesson Series"}
          </p>
        </div>
        
        <Button onClick={() => setIsCreating(true)} className="hidden md:flex rounded-md font-bold h-10 shadow-none px-6 text-xs uppercase tracking-wider">
          <Plus size={16} className="mr-2" /> Add Session
        </Button>
      </div>

      <section className="space-y-6">
        {allLessons.length === 0 ? (
          <div className="p-20 text-center border border-dashed border-border rounded-md bg-muted/5 flex flex-col items-center">
            <CalendarOff className="h-8 w-8 text-muted-foreground opacity-20 mb-4" />
            <p className="text-sm text-muted-foreground font-medium mb-4">No sessions scheduled for this series.</p>
            <Button variant="outline" size="sm" onClick={() => setIsCreating(true)} className="rounded-md font-bold h-8 border-border shadow-none">Create First Session</Button>
          </div>
        ) : (
          <>
            <div className="hidden md:block space-y-8">
              {upcomingLessons.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary px-1">
                    <Clock size={14} />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Active & Upcoming</h3>
                  </div>
                  <div className="grid gap-3">
                    {upcomingLessons.map((lesson: any) => {
                      const start = parseISO(lesson.start_datetime);
                      const isJoinable = now ? isBefore(addMinutes(start, -20), now) : false;
                      return (
                        <Card key={lesson.id} className="rounded-md border border-border shadow-none overflow-hidden group">
                          <CardContent className="p-0">
                            <div className="flex items-center justify-between p-5 gap-6 hover:bg-muted/10 transition-colors">
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-base text-foreground truncate">{lesson.title}</span>
                                  {isJoinable && <Badge className="bg-emerald-600 text-white border-none rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase animate-pulse">Join Ready</Badge>}
                                </div>
                                <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                                  <span className="flex items-center gap-1.5"><Calendar size={13} className="opacity-50" /> {format(start, "MMM dd, yyyy")}</span>
                                  <span className="opacity-30">•</span>
                                  <span className="flex items-center gap-1.5"><Clock size={13} className="opacity-50" /> {format(start, "p")}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isJoinable && (
                                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-none rounded-md font-bold h-8 text-[11px] px-4" onClick={() => handleJoin(lesson.id)}>
                                    <Video size={16} className="mr-2" /> Start Class
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md border border-transparent hover:border-border hover:bg-background" onClick={() => setLessonToEdit(lesson)}><Edit size={16} /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-md" onClick={() => setLessonToDelete(lesson)}><Ban size={16} /></Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="block md:hidden space-y-6">
              <div className="flex items-center justify-between bg-muted/10 p-3 rounded-t-md border-x border-t border-border">
                <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest">Sessions Manager</h3>
                <Button onClick={() => setIsCreating(true)} size="icon" className="h-9 w-9 rounded-md bg-primary text-primary-foreground shadow-none"><Plus size={20} /></Button>
              </div>

              <div className="divide-y divide-border border border-border rounded-b-md overflow-hidden bg-card">
                {upcomingLessons.map((lesson: any) => {
                  const start = parseISO(lesson.start_datetime);
                  const isJoinable = now ? isBefore(addMinutes(start, -20), now) : false;
                  return (
                    <div key={lesson.id} className="p-4 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          {isJoinable && <Badge className="bg-emerald-600 text-white border-none text-[8px] font-black h-4 px-1.5 uppercase rounded-sm mb-1">Join Ready</Badge>}
                          <h4 className="font-bold text-[14px] text-foreground leading-tight">{lesson.title}</h4>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setLessonToEdit(lesson)} className="h-8 w-8 rounded-md bg-muted/20"><Edit size={15} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setLessonToDelete(lesson)} className="h-8 w-8 rounded-md bg-red-50 text-red-600"><Ban size={15} /></Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-dashed border-border/60">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                          <div className="flex items-center gap-1"><Calendar size={11} /> {format(start, "MMM dd")}</div>
                          <div className="flex items-center gap-1 mt-0.5"><Clock size={11} /> {format(start, "p")}</div>
                        </div>
                        {isJoinable ? (
                          <Button onClick={() => handleJoin(lesson.id)} size="sm" className="h-8 px-4 rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white shadow-none">
                            Start
                          </Button>
                        ) : (
                          <Badge variant="outline" className="h-7 text-[9px] font-bold border-border text-muted-foreground uppercase px-2">Upcoming</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {pastLessons.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-border/50">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">History & Cancelled</h3>
                <div className="grid gap-2 opacity-60">
                  {pastLessons.map((lesson: any) => (
                    <div key={lesson.id} className="flex items-center justify-between p-4 border border-border rounded-md bg-muted/20">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-foreground/70 truncate">{lesson.title}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{format(parseISO(lesson.start_datetime), "MMM dd, yyyy • p")}</p>
                      </div>
                      <Badge variant="outline" className="rounded-sm text-[9px] uppercase font-bold bg-background border-border shrink-0 ml-4">{lesson.is_cancelled ? "Cancelled" : "Archived"}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <LessonCreateModal isOpen={isCreating} onClose={() => setIsCreating(false)} liveClassId={liveClass.id} onSuccess={fetchClassDetails} />
      <LessonEditModal isOpen={!!lessonToEdit} onClose={() => setLessonToEdit(null)} lesson={lessonToEdit} onSuccess={fetchClassDetails} />
      <ConfirmDeleteModal isOpen={!!lessonToDelete} onClose={() => setLessonToDelete(null)} onConfirm={handleDeleteLesson} title="Cancel Session" description={`Cancel "${lessonToDelete?.title}"?`} />
    </div>
  );
}

const LessonSkeleton = () => (
  <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
    <div className="container mx-auto max-w-5xl py-8 px-4 space-y-10">
      <div className="border-b border-border pb-6 space-y-4"><Skeleton width={120} height={20} /><Skeleton width={300} height={32} /></div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} height={80} borderRadius={8} />)}
      </div>
    </div>
  </SkeletonTheme>
);