"use client";

import {
  ShieldCheck,
  PlayCircle,
  BookOpen,
  GraduationCap,
  Star,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// NEW: Import Card components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// --- Interfaces (Unchanged) ---
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
  display_name: string;
  bio: string;
  profile_image: string | null;
  headline: string;
  intro_video: string | null;
  education: string;
  subjects: Subject[];
  courses: Course[];
  is_verified: boolean;
}

interface TutorPublicProfileClientProps {
  profile: TutorProfile;
}

export default function TutorPublicProfileClient({
  profile,
}: TutorPublicProfileClientProps) {
  return (
    // UPDATED: Use theme background
    <div className="bg-background min-h-screen">
      {/* Header */}
      {/* UPDATED: Use theme card and border */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto p-6 md:p-10 flex flex-col md:flex-row items-center gap-8">
          {/* UPDATED: Border now matches card for seamless look */}
          <Avatar className="h-32 w-32 border-4 border-card shadow-lg">
            <AvatarImage
              src={profile.profile_image || undefined}
              alt={profile.display_name}
            />
            <AvatarFallback className="text-4xl">
              {profile.display_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              {/* UPDATED: Use theme text */}
              <h1 className="text-3xl font-bold text-foreground">
                {profile.display_name}
              </h1>
              {profile.is_verified && (
                // UPDATED: Use theme primary (purple)
                <ShieldCheck className="h-6 w-6 text-primary" />
              )}
            </div>
            {/* UPDATED: Use theme muted text */}
            <p className="text-lg text-muted-foreground mt-1">
              {profile.headline}
            </p>
            {profile.education && (
              // UPDATED: Use theme muted text
              <div className="flex items-center gap-2 text-muted-foreground mt-3 justify-center md:justify-start">
                <GraduationCap className="h-4 w-4" />
                <span className="text-sm">{profile.education}</span>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
              {profile.subjects.map((subject) => (
                // UPDATED: Use theme secondary (teal)
                <Badge key={subject.slug} variant="secondary">
                  {subject.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* About Me */}
          {/* UPDATED: Converted to <Card> component */}
          <Card className="p-0">
            <CardHeader className="p-6 sm:p-8">
              <CardTitle className="text-xl">About Me</CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 pt-0">
              {/* UPDATED: Themed prose styles */}
              <div
                className={cn(
                  "prose prose-sm max-w-none",
                  "prose-p:text-foreground prose-headings:text-foreground",
                  "dark:prose-invert"
                )}
              >
                {profile.bio ? (
                  profile.bio
                    .split("\n")
                    .map((p, i) => <p key={i}>{p || <br />}</p>)
                ) : (
                  <p className="italic text-muted-foreground">
                    No bio provided.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Courses */}
          {/* UPDATED: Converted to <Card> component */}
          <Card className="p-0">
            <CardHeader className="p-6 sm:p-8">
              <CardTitle className="text-xl">
                Courses ({profile.courses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 pt-0">
              {profile.courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile.courses.map((course) => (
                    <CourseCard key={course.slug} course={course} />
                  ))}
                </div>
              ) : (
                <p className="italic text-muted-foreground">
                  This tutor has not published any courses yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1">
          {profile.intro_video && (
            // UPDATED: Converted to <Card> component
            <Card className="p-0">
              <CardHeader className="p-6">
                <CardTitle className="text-xl">Introduction</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <video
                  controls
                  className="w-full rounded-lg"
                  src={profile.intro_video}
                >
                  Your browser does not support the video tag.
                </video>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// UPDATED: A themed placeholder CourseCard
function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/courses/${course.slug}`}>
      <div className="border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-card h-full flex flex-col">
        <div
          className="h-40 bg-muted bg-cover bg-center"
          style={{
            backgroundImage: `url(${
              course.thumbnail ||
              "https://placehold.co/600x400/f5f7f9/2d3339?text=Course" // Themed placeholder
            })`,
          }}
        />
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-foreground truncate">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">{course.category}</p>
          <div className="flex items-center justify-between text-sm mt-auto">
            {/* UPDATED: Use theme primary (purple) */}
            <span className="font-bold text-primary">
              {course.price > 0
                ? new Intl.NumberFormat("en-KE", {
                    style: "currency",
                    currency: "KES",
                    maximumFractionDigits: 0,
                  }).format(course.price)
                : "Free"}
            </span>
            <span className="flex items-center gap-1 text-yellow-500">
              <Star className="h-4 w-4" />
              {course.rating_avg.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}