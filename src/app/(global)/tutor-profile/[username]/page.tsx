"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  PlayCircle,
  BookOpen,
  GraduationCap,
  Star,
  Users,
  Loader2,
  MessageSquare,
  ClipboardList,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import api from "@/lib/api/axios";

interface Subject {
  name: string;
  slug: string;
}

interface Course {
  slug: string;
  title: string;
  thumbnail: string | null;
  price: number;
  instructor_name: string;
  rating_avg: number;
  num_students: number;
  category: string;
  level: string;
  is_enrolled: boolean;
}

interface TutorProfile {
  username: string;
  display_name: string;
  bio: string;
  profile_image: string | null;
  headline: string;
  intro_video: string | null;
  education: string;
  subjects: Subject[];
  courses: Course[];
  is_verified: boolean;
  total_students: number;
  total_reviews: number;
  average_rating: number;
}

const EmptyState: React.FC<{
  message: string;
  linkPath?: string;
  linkText?: string;
}> = ({ message, linkPath, linkText }) => (
  <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-border rounded-md bg-muted/20 p-4">
    <BookOpen className="h-8 w-8 text-muted-foreground" />
    <p className="text-muted-foreground mt-2 text-center text-sm">{message}</p>
    {linkPath && linkText && (
      <Button asChild variant="link" className="text-primary mt-2">
        <Link href={linkPath}>{linkText}</Link>
      </Button>
    )}
  </div>
);

export default function TutorPublicProfileClient() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTutorProfile = async () => {
      if (!username) return;
      setIsLoading(true);
      setError(false);
      try {
        const response = await api.get(`/users/tutor/${username}/`);
        setProfile(response.data);
      } catch (err) {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTutorProfile();
  }, [username]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Loading Profile</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto p-8 max-w-2xl mt-10">
        <EmptyState
          message="We couldn't find the tutor you are looking for."
          linkPath="/"
          linkText="Browse all tutors"
        />
      </div>
    );
  }

  const StatCard: React.FC<{
    icon: React.ReactNode;
    value: string | number;
    label: string;
  }> = ({ icon, value, label }) => (
    <div className="flex flex-col items-center p-4 bg-muted/20 rounded-md border border-border/50">
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mt-1 flex items-center gap-1">
        {icon}
        {label}
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-8 md:px-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex flex-col items-center md:items-start space-y-4 shrink-0 w-full md:w-auto">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border border-border rounded-md">
                <AvatarImage
                  src={profile.profile_image || undefined}
                  alt={profile.display_name}
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl font-bold bg-muted text-muted-foreground">
                  {profile.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button className="w-full md:w-auto px-8 font-black uppercase text-[10px] tracking-widest h-11">
                <MessageSquare className="mr-2 h-4 w-4" /> Message
              </Button>
            </div>

            <div className="text-center md:text-left space-y-4 flex-1">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-4xl font-bold text-foreground">
                    {profile.display_name}
                  </h1>
                  {profile.is_verified && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10 border-0 flex items-center gap-1.5 py-1 px-3 rounded-md">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                    </Badge>
                  )}
                </div>
                <p className="text-lg text-muted-foreground mt-2 font-medium leading-tight">
                  {profile.headline}
                </p>
              </div>

              {profile.education && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold uppercase tracking-tight text-muted-foreground">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span>{profile.education}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
                {profile.subjects.map((subject) => (
                  <Badge key={subject.slug} variant="outline" className="px-3 py-1 font-bold text-[10px] uppercase tracking-widest rounded-md border-border/60">
                    {subject.name}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                <StatCard
                  icon={<Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                  value={profile.average_rating.toFixed(1)}
                  label="Rating"
                />
                <StatCard
                  icon={<Users className="h-3 w-3" />}
                  value={profile.total_students}
                  label="Students"
                />
                <div className="col-span-2 md:col-span-1">
                    <StatCard
                    icon={<ClipboardList className="h-3 w-3" />}
                    value={profile.total_reviews}
                    label="Reviews"
                    />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-xl font-bold uppercase tracking-tighter flex items-center gap-2">
                About The Instructor
              </h2>
            </div>
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
              {profile.bio ? (
                profile.bio.split("\n").map((p, i) => (
                  p.trim() && <p key={i} className="mb-4 last:mb-0">{p}</p>
                ))
              ) : (
                <p className="italic text-muted-foreground/50">No biography provided.</p>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-xl font-bold uppercase tracking-tighter">
                  Published Courses
                </h2>
              </div>
              <Badge variant="secondary" className="rounded-md font-black px-3 py-1 text-[10px] uppercase tracking-widest">
                {profile.courses.length} Items
              </Badge>
            </div>
            {profile.courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.courses.map((course) => (
                  <CourseCard key={course.slug} course={course} />
                ))}
              </div>
            ) : (
              <EmptyState message="No courses published yet." />
            )}
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
          {profile.intro_video && (
            <Card className="rounded-md border border-border shadow-none overflow-hidden bg-muted/10">
              <CardHeader className="p-5 border-b border-border/50">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-primary" /> Profile Intro
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="rounded-md overflow-hidden border border-border bg-black aspect-video relative">
                  <video
                    controls
                    className="w-full h-full object-contain"
                    src={profile.intro_video}
                    poster={profile.profile_image || undefined}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-md border border-border shadow-none bg-primary/5 border-primary/10">
            <CardContent className="p-6 text-center space-y-4">
              <GraduationCap className="h-10 w-10 text-primary mx-auto opacity-20" />
              <div>
                <h4 className="font-bold text-sm uppercase tracking-widest">Support The Instructor</h4>
                <p className="text-xs text-muted-foreground mt-2">Enroll in courses or follow for updates on new content.</p>
              </div>
              <Button variant="outline" className="w-full font-black text-[10px] uppercase tracking-widest h-10 border-primary/20 hover:bg-primary/5">
                Follow Instructor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  const rating_avg = parseFloat(course.rating_avg.toString()) || 0;
  
  return (
    <Link 
      href={`/courses/${course.slug}`} 
      className="group block"
    >
      <Card className="overflow-hidden border border-border hover:border-primary transition-all duration-300 shadow-none rounded-md bg-card flex flex-col h-full">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted"> 
          <img
            src={course.thumbnail || "https://placehold.co/600x375/f5f7f9/2d3339?text=Course"}
            alt={course.title}
            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
          />
          <Badge className="absolute top-3 left-3 bg-background/90 backdrop-blur-md text-foreground border-0 text-[10px] font-black uppercase tracking-widest py-0.5 px-2 rounded-md">
            {course.category}
          </Badge>
        </div>

        <CardContent className="flex flex-col flex-1 p-5 gap-4"> 
          <div className="space-y-2">
            <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight"> 
                {course.title}
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3 w-3" /> {course.num_students}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{course.level}</span>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
            <div className="font-black text-sm text-primary tracking-tight"> 
              {course.price > 0 ? (
                new Intl.NumberFormat("en-KE", { 
                  style: "currency",
                  currency: "KES",
                  maximumFractionDigits: 0,
                }).format(course.price)
              ) : (
                <span className="text-emerald-600 uppercase tracking-widest font-black text-[10px]">Free</span>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 border border-border/50">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span className="text-[10px] font-black text-foreground">
                {rating_avg.toFixed(1)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}