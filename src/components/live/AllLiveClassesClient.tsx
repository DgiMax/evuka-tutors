"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { 
  Plus, Settings2, Video, Clock, LayoutGrid, ChevronRight, ExternalLink, CalendarOff
} from "lucide-react";
import api from "@/lib/api/axios";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LiveClassFormModal } from "./LiveClassFormModal";

const Loader2 = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

export default function AllLiveClassesClient() {
  const { activeSlug } = useActiveOrg();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = activeSlug ? { "X-Organization-Slug": activeSlug } : {};
      const response = await api.get("/live/hub/", { headers });
      setData(response.data);
    } catch {
      toast.error("Failed to sync schedules.");
    } finally {
      setIsLoading(false);
    }
  }, [activeSlug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = (course: any) => {
    setSelectedCourse(course);
    setSelectedClass(null);
    setIsModalOpen(true);
  };

  const handleEdit = (course: any, cls: any) => {
    setSelectedCourse(course);
    setSelectedClass(cls);
    setIsModalOpen(true);
  };

  const getPath = (path: string) => (activeSlug ? `/${activeSlug}${path}` : path);

  if (isLoading) return <HubSkeleton />;

  return (
    <div className="container mx-auto max-w-5xl py-6 md:py-8 px-4 space-y-8 md:space-y-10">
      <div className="border-b border-border pb-6 flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Live Hub</h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">
          Management Console
        </p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground/60 px-1">
          <LayoutGrid size={14} />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Course Curriculums</h3>
        </div>

        <div className="space-y-12">
          {!data?.courses || data.courses.length === 0 ? (
            <div className="p-16 text-center border border-dashed border-border rounded-md bg-muted/5 flex flex-col items-center">
              <CalendarOff className="h-8 w-8 text-muted-foreground/20 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">No live courses found.</p>
              <Button asChild variant="outline" size="sm" className="rounded-md font-bold h-8 border-border shadow-none"><Link href={getPath("/")}>Return to Dashboard</Link></Button>
            </div>
          ) : (
            data.courses.map((course: any) => (
              <div key={course.id}>
                
                <Card className="hidden md:block rounded-md border border-border shadow-none overflow-hidden group p-0 pb-2">
                  <div className="flex flex-col sm:flex-row bg-muted/20 p-4 gap-4 border-b border-border items-start sm:items-center">
                    <div className="flex items-center gap-4 flex-1 w-full">
                      <div className="relative h-12 w-12 md:h-14 md:w-14 shrink-0 overflow-hidden rounded-md border border-border bg-background">
                        {course.thumbnail ? <Image src={course.thumbnail} alt="" fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-muted-foreground opacity-20"><Video size={20} /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-base font-bold text-foreground truncate">{course.title}</h3>
                        <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{course.live_classes?.length || 0} active series</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                      <Button onClick={() => handleCreate(course)} size="sm" variant="outline" className="flex-1 sm:flex-none rounded-md h-8 text-[10px] font-bold bg-background border-border shadow-none px-3 uppercase tracking-wider"><Plus size={14} className="mr-1" /> New Schedule</Button>
                      <Button asChild size="sm" className="flex-1 sm:flex-none rounded-md h-8 text-[10px] font-bold shadow-none px-4 uppercase tracking-wider"><Link href={getPath(`/courses/${course.slug}/live-classes`)}>Course Hub</Link></Button>
                    </div>
                  </div>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {course.live_classes?.length > 0 ? (
                        course.live_classes.map((cls: any) => (
                          <div key={cls.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-muted/10 transition-colors">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs md:text-sm text-foreground truncate">{cls.title}</span>
                                <Badge variant="outline" className="text-[8px] md:text-[9px] uppercase font-bold h-4 rounded-sm border-border bg-background px-1 shrink-0">{cls.recurrence_type}</Badge>
                              </div>
                              <div className="flex items-center gap-3 text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                                <span className="flex items-center gap-1 shrink-0"><Clock size={11}/> Starts: {cls.start_date}</span>
                                <span className="opacity-30">•</span>
                                <span className="shrink-0">{cls.lessons_count || 0} Sessions</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button asChild variant="ghost" size="sm" className="flex-1 sm:flex-none h-8 rounded-md text-[10px] md:text-[11px] font-bold border border-transparent hover:border-border bg-muted/20 sm:bg-transparent">
                                <Link href={getPath(`/courses/${course.slug}/live-classes/${cls.slug}/manage`)}>Manage Lessons</Link>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(course, cls)} className="h-8 w-8 rounded-md hover:bg-background hover:border-border shrink-0">
                                <Settings2 size={14} className="text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center text-[11px] text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-50 bg-muted/5">
                          No live series defined for this curriculum.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="block md:hidden">
                  <div className="flex items-center justify-between bg-muted/20 p-3 rounded-t-md border-x border-t border-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded bg-background border border-border flex items-center justify-center shrink-0">
                        {course.thumbnail ? <Image src={course.thumbnail} alt="" width={40} height={40} className="object-cover rounded" /> : <Video size={16} className="text-muted-foreground/30" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[13px] font-bold text-foreground truncate leading-tight">{course.title}</h3>
                        <Link href={getPath(`/courses/${course.slug}/live-classes`)} className="text-[9px] font-black text-primary uppercase flex items-center gap-1 mt-1 tracking-wider">
                          Hub <ExternalLink size={10} />
                        </Link>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleCreate(course)} 
                      size="icon" 
                      className="h-9 w-9 rounded-md bg-primary text-primary-foreground shadow-none shrink-0"
                    >
                      <Plus size={20} />
                    </Button>
                  </div>

                  <div className="divide-y divide-border border border-border rounded-b-md overflow-hidden bg-card">
                    {course.live_classes?.length > 0 ? (
                      course.live_classes.map((cls: any) => (
                        <div key={cls.id} className="p-4 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5">
                              <Badge variant="outline" className="text-[8px] font-black h-4 px-1.5 uppercase rounded-sm border-border">
                                {cls.recurrence_type}
                              </Badge>
                              <h4 className="font-bold text-[14px] text-foreground leading-tight">{cls.title}</h4>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(course, cls)} className="h-8 w-8 rounded-md bg-muted/20 shrink-0">
                              <Settings2 size={15} className="text-muted-foreground" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-dashed border-border/60">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                <Clock size={11} className="opacity-60" /> {cls.start_date}
                              </div>
                              <div className="text-[9px] font-bold text-muted-foreground/40 uppercase ml-4">
                                {cls.lessons_count || 0} Scheduled Sessions
                              </div>
                            </div>
                            <Button asChild variant="secondary" className="h-8 px-4 rounded-md text-[10px] font-black uppercase tracking-widest bg-foreground text-background shadow-none">
                              <Link href={getPath(`/courses/${course.slug}/live-classes/${cls.slug}/manage`)}>Manage</Link>
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center bg-muted/5">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                          No active schedules defined.
                        </p>
                        <p className="text-[9px] text-muted-foreground/40 font-medium mt-1">
                          Click the plus icon to create your first session.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </section>

      <LiveClassFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} courseId={selectedCourse?.id} selectedClass={selectedClass} onSuccess={fetchData} />
    </div>
  );
}

const HubSkeleton = () => (
  <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
    <div className="container mx-auto max-w-5xl py-8 px-4 space-y-10">
      <div className="border-b border-border pb-6 space-y-2">
        <Skeleton width={200} height={32} />
        <Skeleton width={300} height={16} />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="space-y-2 mb-10">
          <Skeleton height={50} borderRadius={6} />
          <Skeleton height={120} borderRadius={6} />
        </div>
      ))}
    </div>
  </SkeletonTheme>
);