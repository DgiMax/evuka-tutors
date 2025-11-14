"use client";

import { ShieldCheck, PlayCircle, BookOpen, GraduationCap, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// --- Interfaces (can be moved to a shared types file) ---
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
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto p-6 md:p-10 flex flex-col md:flex-row items-center gap-8">
          <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
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
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.display_name}
              </h1>
              {profile.is_verified && (
                <ShieldCheck
                  className="h-6 w-6 text-blue-500"
                />
              )}
            </div>
            <p className="text-lg text-gray-600 mt-1">{profile.headline}</p>
            {profile.education && (
              <div className="flex items-center gap-2 text-gray-500 mt-3 justify-center md:justify-start">
                <GraduationCap className="h-4 w-4" />
                <span className="text-sm">{profile.education}</span>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
              {profile.subjects.map((subject) => (
                <Badge
                  key={subject.slug}
                  variant="secondary"
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
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
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              About Me
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              {profile.bio ? (
                profile.bio
                  .split("\n")
                  .map((p, i) => <p key={i}>{p || <br />}</p>)
              ) : (
                <p className="italic text-gray-500">No bio provided.</p>
              )}
            </div>
          </div>

          {/* Courses */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Courses ({profile.courses.length})
            </h2>
            {profile.courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.courses.map((course) => (
                  <CourseCard key={course.slug} course={course} />
                ))}
              </div>
            ) : (
              <p className="italic text-gray-500">
                This tutor has not published any courses yet.
              </p>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1">
          {profile.intro_video && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Introduction
              </h2>
              <video
                controls
                className="w-full rounded-lg"
                src={profile.intro_video}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// A placeholder CourseCard. Replace this with your actual CourseCard component.
function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/courses/${course.slug}`}>
      <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
        <div
          className="h-40 bg-gray-200 bg-cover bg-center"
          style={{ backgroundImage: `url(${course.thumbnail || 'https://placehold.co/600x400/eee/ccc?text=Course'})` }}
        />
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate">
            {course.title}
          </h3>
          <p className="text-sm text-gray-500 mb-2">{course.category}</p>
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-blue-600">
              {course.price > 0 ? `$${course.price}` : "Free"}
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