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

// Assuming these component imports are correct
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

// --- Interfaces (No Change) ---

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

// --- Empty State Component (No Change) ---
const EmptyState: React.FC<{
  message: string;
  linkPath?: string;
  linkText?: string;
}> = ({ message, linkPath, linkText }) => (
  <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-border rounded-lg bg-muted/50 p-4">
    <BookOpen className="h-8 w-8 text-muted-foreground" />
    <p className="text-muted-foreground mt-2 text-center">{message}</p>
    {linkPath && linkText && (
      <Button asChild variant="link" className="text-primary">
        <Link href={linkPath}>{linkText}</Link>
      </Button>
    )}
  </div>
);

// --- Tutor Public Profile Component ---
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
        console.error("Failed to load tutor profile:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTutorProfile();
  }, [username]);

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground font-medium">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto p-8 max-w-2xl mt-10">
        <EmptyState
            message="We couldn't find the tutor you are looking for. The profile may not exist or an error occurred."
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
    <div className="flex flex-col items-center p-2 sm:p-3 bg-muted/30 rounded-lg">
      <div className="text-xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
        {icon}
        {label}
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen pb-8">
      
    <div className="bg-card border-b border-border">
        <div className="container mx-auto p-4 md:p-8">
            
            <div className="flex flex-col items-center md:items-start md:flex-row gap-6">

                <div className="flex flex-col items-center md:items-start space-y-4 shrink-0">
                    <Avatar 
                        className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-sm shrink-0 rounded-md"
                    > 
                        <AvatarImage
                            src={profile.profile_image || undefined}
                            alt={profile.display_name}
                            className="object-cover rounded-md"
                        />
                        <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary rounded-md">
                            {profile.display_name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    
                    <Button className="w-full max-w-xs md:max-w-none">
                        <MessageSquare className="mr-2 h-4 w-4" /> Contact {profile.display_name}
                    </Button>
                </div>

                <div className="text-center md:text-left space-y-2 flex-1 min-w-0">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                            <h1 className="text-xl md:text-3xl font-bold text-foreground truncate">
                                {profile.display_name}
                            </h1>
                            {profile.is_verified && (
                                <span title="Verified Tutor" className="cursor-help flex items-center justify-center">
                                    <ShieldCheck className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
                                </span>
                            )}
                        </div>
                        <p className="text-base text-muted-foreground mt-1 leading-snug">
                            {profile.headline}
                        </p>
                    </div>

                    {profile.education && (
                        <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-muted-foreground/80">
                            <GraduationCap className="h-4 w-4 shrink-0" />
                            <span>{profile.education}</span>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-1 justify-center md:justify-start pt-1">
                        {profile.subjects.map((subject) => (
                            <Badge key={subject.slug} variant="secondary" className="px-2 py-0.5 font-normal text-xs">
                                {subject.name}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="container mx-auto px-4 md:px-8 pb-4 md:pb-8"> 
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-border pt-4 mt-4"> 
                <StatCard 
                    icon={<Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />} 
                    value={profile.average_rating.toFixed(1)} 
                    label="Avg. Rating" 
                />
                <StatCard 
                    icon={<Users className="h-3 w-3" />} 
                    value={profile.total_students} 
                    label="Total Students" 
                />
                <div className="col-span-2 sm:col-span-1"> 
                    <StatCard 
                        icon={<ClipboardList className="h-3 w-3" />} 
                        value={profile.total_reviews} 
                        label="Total Reviews" 
                    />
                </div>
            </div>
        </div>
    </div>

      <div className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"> {/* Reduced overall padding and gap */}
        
        <div className="lg:col-span-2 space-y-6">
          
         <Card className="p-0"> {/* 1. Set outer card padding to zero if CardHeader/CardContent fully manage padding */}
            <CardHeader className="p-4 pb-1 md:p-6 md:pb-2"> {/* 2. KEY CHANGE: Reduced bottom padding (pb-1 on mobile, pb-2 on md) */}
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    About Me
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0"> {/* 3. KEY CHANGE: Retained pt-0 to eliminate space from content side */}
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                    {profile.bio ? (
                        profile.bio.split("\n").map((p, i) => (
                            // Reduced paragraph margin, ensuring last paragraph has no bottom margin
                            p.trim() && <p key={i} className="mb-3 last:mb-0">{p}</p> 
                        ))
                    ) : (
                        <p className="italic text-muted-foreground/60">No biography provided.</p>
                    )}
                </div>
            </CardContent>
        </Card>

          <Card className="p-0">
            <CardHeader className="p-4 pb-2 md:p-6 md:pb-4">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Courses by {profile.display_name}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                {profile.courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Grid spacing remains compact */}
                        {profile.courses.map((course) => (
                            <CourseCard key={course.slug} course={course} />
                        ))}
                    </div>
                ) : (
                    <EmptyState message="This tutor has not published any courses yet." />
                )}
            </CardContent>
        </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
            {profile.intro_video && (
                <Card className="overflow-hidden p-0">
                    <CardHeader 
                        className="p-4 pb-1 md:p-6 md:pb-2"
                    >
                        <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                            <PlayCircle className="h-5 w-5 text-primary" /> Video Intro
                        </CardTitle>
                    </CardHeader>
                    <CardContent 
                        className="p-4 pt-0 md:p-6 md:pt-0"
                    > 
                        <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video relative shadow-sm">
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
        </div>
      </div>
    </div>
  );
}

// --- Helper: Course Card (Final Compact Size) ---
function CourseCard({ course }: { course: Course }) {
  const rating_avg = parseFloat(course.rating_avg.toString()) || 0;
  
  return (
    <Link 
      href={`/courses/${course.slug}`} 
      className="block group focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
    >
      <Card 
        className="overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col bg-card border border-border p-0"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted"> 
          <img
            src={course.thumbnail || "https://placehold.co/600x375/f5f7f9/2d3339?text=Course"}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-1 left-1">
            <Badge 
              variant="secondary" 
              className="bg-background/90 backdrop-blur-sm text-[10px] font-semibold border-0 py-0" 
            >
              {course.category}
            </Badge>
          </div>
        </div>

        <CardContent className="flex flex-col flex-1 p-4 pt-2 gap-1"> 
          <div className="flex-1 space-y-0.5">
            <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug"> 
                {course.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users size={10} /> {course.num_students} students
                </span>
                <span>•</span>
                <span>{course.level}</span>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/50">
            <div className="font-bold text-sm text-primary"> 
              {course.price > 0 ? (
                // KEY CHANGE: Changed currency format to KES
                new Intl.NumberFormat("en-KE", { 
                  style: "currency",
                  currency: "KES",
                  maximumFractionDigits: 0,
                }).format(course.price)
              ) : (
                <span className="text-green-600">Free</span>
              )}
            </div>
            
            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded-full border border-yellow-100 dark:border-yellow-900/50">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">
                {rating_avg.toFixed(1)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}