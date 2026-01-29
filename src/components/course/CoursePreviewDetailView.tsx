"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { CourseModulesClient } from "@/components/course/CourseModulesClient";
import { CoursePreviewActions } from '@/components/course/CoursePreviewActions';
import api from "@/lib/api/axios";
import { cn } from "@/lib/utils";
import { 
  Star, ChevronDown, ChevronUp, PlayCircle, 
  CheckCircle2, BookOpen, Globe, Info, X, Users, Award, Verified,
  InboxIcon,
  UserCheck2,
  ArrowLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const PreviewStickySidebar = ({ course }: { course: any }) => (
  <div className="relative lg:sticky lg:top-20 border-2 border-border rounded-md bg-card overflow-hidden w-full">
    <div className={`aspect-video bg-muted relative border-b border-border flex items-center justify-center group ${course?.promo_video ? "cursor-pointer" : "cursor-default"}`}>
      {course?.thumbnail ? (
        <img src={course.thumbnail} alt="Preview" className="w-full h-full object-cover" />
      ) : (
        <BookOpen className="h-10 w-10 text-muted-foreground/20" />
      )}
      
      {course?.promo_video && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayCircle size={48} className="text-white" />
        </div>
      )}
    </div>
    
    <div className="p-4 md:p-6 space-y-6">
      <div className="space-y-1">
        <h3 className="text-2xl md:text-3xl font-black text-foreground">
          {Number(course?.price || 0) > 0 ? `KES ${Number(course.price).toLocaleString()}` : 'Free'}
        </h3>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#2694C6]">Full Lifetime Access</p>
      </div>

      <CoursePreviewActions slug={course?.slug} />
    </div>
  </div>
);

export default function CoursePreviewDetailView() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tutorProfile, setTutorProfile] = useState<any | null>(null);
  const [isTutorModalOpen, setIsTutorModalOpen] = useState(false);
  const [loadingTutor, setLoadingTutor] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const descriptionThreshold = 800;
  const isLongDescription = (course?.long_description?.length || 0) > descriptionThreshold;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/courses/${slug}/preview-details/`);
        setCourse(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const handleOpenTutorProfile = async () => {
    if (!course?.instructor?.username) return;
    setIsTutorModalOpen(true);
    setLoadingTutor(true);
    try {
      const res = await api.get(`/users/tutor/${course.instructor.username}/`);
      setTutorProfile(res.data);
    } catch (err) {
      console.error("Failed to load tutor profile");
    } finally {
      setLoadingTutor(false);
    }
  };

  if (loading) return <CourseDetailsSkeleton />;

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-[#1C1D1F] text-white py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button
              onClick={() => router.push(`/courses/${slug}`)}
              variant="ghost"
              className="group flex items-center gap-2 text-gray-300 hover:text-white p-0 hover:bg-transparent font-black uppercase text-[10px] tracking-widest transition-all"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Management
            </Button>
          </div>
          <div className="lg:w-2/3 space-y-4">
            <Badge className="bg-[#2694C6] text-white rounded-sm border-none font-black text-[10px] uppercase">
              {course?.category?.name || "Professional Course"}
            </Badge>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              {course?.title}
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-300 font-normal max-w-3xl">
              {course?.short_description}
            </p>
            
            <div className="flex flex-wrap items-center gap-x-4 md:gap-x-6 gap-y-3 pt-2 text-xs md:text-sm font-bold">
              <div className="flex items-center gap-1.5 text-amber-400">
                <span>{(course?.rating_avg ?? 0).toFixed(1)}</span>
                <Star size={14} className="fill-amber-400" />
                <span className="text-gray-400 underline decoration-dotted font-medium">
                  ({(course?.num_ratings ?? 0).toLocaleString()} ratings)
                </span>
              </div>
              <div className="text-white">
                {(course?.num_students ?? 0).toLocaleString()} students
              </div>
              <div className="text-gray-400">
                Created by <span onClick={handleOpenTutorProfile} className="text-[#2694C6] underline underline-offset-4 decoration-1 font-black cursor-pointer">{course?.instructor?.instructor_name}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[10px] md:text-xs font-bold text-gray-400">
               <div className="flex items-center gap-1.5"><Info size={14} /> Last updated {new Date(course?.updated_at).toLocaleDateString()}</div>
               <div className="flex items-center gap-1.5"><Globe size={14} /> English</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 lg:gap-12">
          
          <aside className="order-1 lg:order-2 lg:col-span-1 mt-6 lg:-mt-64 z-10 w-full max-w-md lg:max-w-none mx-auto lg:mx-0">
            <PreviewStickySidebar course={course} />
          </aside>

          <main className="order-2 lg:order-1 lg:col-span-2 py-8 md:py-12 space-y-10 md:space-y-12">
            <div className="border border-border rounded-md p-5 md:p-8 bg-card">
              <h2 className="text-lg md:text-xl font-black text-foreground mb-6">What you&apos;ll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course?.learning_objectives?.map((obj: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#2694C6] shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-muted-foreground leading-relaxed">{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full overflow-hidden">
              <CourseModulesClient modules={course?.modules || []} />
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-black text-foreground uppercase tracking-widest border-b border-border pb-4">
                Description
              </h2>

              <div className="relative">
                <div
                  className={cn(
                    "prose prose-sm max-w-none text-muted-foreground font-medium leading-relaxed transition-all duration-500 ease-in-out",
                    !isExpanded && isLongDescription ? "max-h-80 overflow-hidden" : "max-h-full"
                  )}
                >
                  <ReactMarkdown>
                    {course?.long_description || "No description provided."}
                  </ReactMarkdown>
                </div>

                {!isExpanded && isLongDescription && (
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
                )}
              </div>

              {isLongDescription && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-2 text-[#2694C6] font-black uppercase text-[11px] tracking-widest hover:text-[#1e7ca8] transition-colors group"
                >
                  {isExpanded ? (
                    <>
                      Show Less 
                      <ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                    </>
                  ) : (
                    <>
                      Read More 
                      <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="space-y-8 pt-6">
              <h2 className="text-xl font-black text-foreground uppercase tracking-widest border-b border-border pb-4">
                Instructor
              </h2>

              <div className="space-y-5">
                <div className="flex items-end gap-4">
                  <div
                    onClick={handleOpenTutorProfile}
                    className="h-16 w-16 md:h-20 md:w-20 rounded-md bg-muted border border-border flex items-center justify-center font-black text-xl text-[#2694C6] cursor-pointer overflow-hidden shrink-0"
                  >
                    {(tutorProfile?.profile_image || course?.instructor?.profile_image) ? (
                      <img 
                        src={tutorProfile?.profile_image || course?.instructor?.profile_image} 
                        className="w-full h-full object-cover" 
                        alt="" 
                      />
                    ) : (
                      <span className="text-2xl">
                        {(tutorProfile?.display_name || course?.instructor?.creator_name || course?.instructor?.display_name || "U")[0]}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 pb-1">
                    <h4
                      onClick={handleOpenTutorProfile}
                      className="font-black text-[#2694C6] text-lg hover:underline cursor-pointer leading-tight mb-1"
                    >
                      {tutorProfile?.display_name || course?.instructor?.creator_name || course?.instructor?.display_name || course?.instructor?.instructor_name || "Unknown Instructor"}
                    </h4>
                    <p className="text-xs text-muted-foreground font-bold">
                      Curriculum Lead & Industry Expert
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className={cn(
                    "text-sm text-muted-foreground font-medium leading-relaxed transition-all duration-300",
                    !isBioExpanded ? "line-clamp-3" : "line-clamp-none"
                  )}>
                    {tutorProfile?.bio || course?.instructor?.bio || "Professional instructor focused on practical, job-ready skills."}
                  </div>

                  {!isBioExpanded && (course?.instructor?.bio?.length > 150 || tutorProfile?.bio?.length > 150) && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                  )}
                </div>

                {(course?.instructor?.bio?.length > 150 || tutorProfile?.bio?.length > 150) && (
                  <button
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    className="flex items-center gap-2 text-[#2694C6] font-black uppercase text-[10px] tracking-widest hover:text-[#1e7ca8] transition-colors"
                  >
                    {isBioExpanded ? (
                      <>Show Less <ChevronUp size={14} /></>
                    ) : (
                      <>Read More <ChevronDown size={14} /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      <Dialog open={isTutorModalOpen} onOpenChange={setIsTutorModalOpen}>
        <DialogContent className="w-[95%] sm:max-w-[550px] lg:max-w-[650px] p-0 gap-0 h-[85vh] md:h-[80vh] flex flex-col border-border/80 shadow-2xl rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%]">
          
          <DialogHeader className="px-5 py-4 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-md border border-primary/20 shrink-0">
                <UserCheck2 className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm md:text-base font-bold tracking-tight text-foreground uppercase truncate">
                  Instructor Profile
                </DialogTitle>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.15em]">Verified Professional</p>
              </div>
            </div>
            <DialogClose className="rounded-md p-2 hover:bg-muted transition -mr-2" onClick={() => setIsTutorModalOpen(false)}>
              <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </DialogClose>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 md:px-8 py-6 space-y-8 custom-scrollbar">
            {loadingTutor ? (
              <div className="space-y-10 animate-pulse">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-5 rounded-md border border-border bg-muted/10">
                  <div className="h-24 w-24 rounded-md bg-muted shrink-0" />
                  <div className="flex-1 space-y-3 w-full">
                    <div className="h-6 bg-muted w-3/4 mx-auto sm:mx-0 rounded" />
                    <div className="h-3 bg-muted w-1/2 mx-auto sm:mx-0 rounded" />
                    <div className="flex gap-4 pt-2 justify-center sm:justify-start">
                      <div className="h-4 bg-muted w-20 rounded" />
                      <div className="h-4 bg-muted w-20 rounded" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="h-3 bg-muted w-32 rounded mb-6" />
                  <div className="space-y-3 border-l-2 border-muted pl-4">
                    <div className="h-3 bg-muted w-full rounded" />
                    <div className="h-3 bg-muted w-[95%] rounded" />
                    <div className="h-3 bg-muted w-[98%] rounded" />
                    <div className="h-3 bg-muted w-[90%] rounded" />
                    <div className="h-3 bg-muted w-[40%] rounded" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-3 bg-muted w-24 rounded" />
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-6 w-16 bg-muted rounded-sm" />
                    ))}
                  </div>
                </div>
              </div>
            ) : tutorProfile ? (
              <>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-5 rounded-md border border-border bg-muted/10">
                  <div className="h-24 w-24 rounded-md border-2 border-background shadow-sm overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                    {tutorProfile.profile_image ? (
                      <img src={tutorProfile.profile_image} className="w-full h-full object-cover" alt={tutorProfile.display_name} />
                    ) : (
                      <span className="text-3xl font-black text-primary">{tutorProfile.display_name?.[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-center sm:text-left space-y-2">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h3 className="text-xl font-black tracking-tight text-foreground truncate">{tutorProfile.display_name}</h3>
                      {tutorProfile.is_verified && <Verified size={18} className="text-primary shrink-0" />}
                    </div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.1em] leading-tight">
                      {tutorProfile.headline}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase">
                        <Users size={14} className="text-primary" /> 
                        {tutorProfile.total_students?.toLocaleString()} Students
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase">
                        <Award size={14} className="text-primary" /> 
                        {tutorProfile.average_rating} Rating
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[9px]">01</span>
                    Professional Biography
                  </h4>
                  <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed font-medium text-sm border-l-2 border-muted pl-4">
                    <ReactMarkdown>{tutorProfile.bio}</ReactMarkdown>
                  </div>
                </div>

                {tutorProfile.subjects?.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[9px]">02</span>
                      Areas of Expertise
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {tutorProfile.subjects.map((sub: any, index: number) => (
                        <Badge 
                          key={sub.id || `sub-${index}`} 
                          variant="secondary" 
                          className="rounded-sm bg-muted/50 border border-border/50 font-bold text-[9px] uppercase px-2.5 py-1 shadow-none text-foreground hover:bg-primary/10 hover:border-primary/30 transition-colors"
                        >
                          {sub.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20">
                <InboxIcon className="h-10 w-10 text-muted-foreground/20 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Profile details unavailable</p>
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t bg-muted/20 flex justify-end shrink-0">
            <Button 
              variant="secondary" 
              onClick={() => setIsTutorModalOpen(false)} 
              className="h-10 px-6 rounded-md font-black text-[10px] text-black uppercase tracking-widest shadow-none bg-muted hover:bg-muted/80 active:scale-[0.98] transition-all"
            >
              Close Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const CourseDetailsSkeleton = () => (
  <SkeletonTheme baseColor="#f3f4f6" highlightColor="#ffffff">
    <div className="min-h-screen">
      <div className="bg-[#1C1D1F] py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="lg:w-2/3 space-y-6">
            <Skeleton width={100} height={20} />
            <Skeleton height={80} width="80%" />
            <Skeleton height={40} width="60%" />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton height={200} borderRadius={6} />
            <Skeleton count={5} height={60} borderRadius={6} />
          </div>
          <div className="lg:col-span-1">
            <Skeleton height={450} borderRadius={6} />
          </div>
        </div>
      </div>
    </div>
  </SkeletonTheme>
);