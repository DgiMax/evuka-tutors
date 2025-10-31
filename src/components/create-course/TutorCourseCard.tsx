// components/courses/TutorCourseCard.tsx
"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Pencil } from "lucide-react";
import Link from "next/link";

export interface TutorCourse {
  slug: string;
  title: string;
  thumbnail?: string;
  short_description: string;
  status: string;
  status_display?: string;
  is_published?: boolean;
}

interface Props {
  course: TutorCourse;
  makeContextLink: (path: string) => string;
}

export default function TutorCourseCard({ course, makeContextLink }: Props) {
  return (
    <Card className="rounded border border-gray-200 bg-white overflow-hidden flex flex-col p-2">
      {/* Thumbnail */}
      {course.thumbnail ? (
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-36 object-cover"
        />
      ) : (
        <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400">
          <BookOpen className="h-6 w-6" />
        </div>
      )}

      {/* Content (no top/bottom whitespace) */}
      <CardContent className="p-1 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {course.title}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-2 mt-1">
            {course.short_description || "No description provided."}
          </p>
        </div>

        {/* Bottom row: status + buttons */}
        <div className="flex items-center justify-between mt-3">
          {/* Status */}
          <span
            className={`!text-[9px] font-medium px-3 py-1 rounded-full ${
                course.status === "published"
                ? "bg-green-100 text-green-700"
                : course.status === "pending_review"
                ? "bg-blue-100 text-blue-700"
                : course.status === "archived"
                ? "bg-gray-100 text-gray-600"
                : "bg-yellow-100 text-yellow-700"
            }`}
            >
            {course.status_display || course.status}
            </span>


          {/* Buttons (normal style) */}
          <div className="flex gap-2">
            <Link href={makeContextLink(`/courses/${course.slug}/preview-course`)}>
              <Button size="sm">View</Button>
            </Link>
            <Link href={makeContextLink(`/courses/${course.slug}/edit`)}>
              <Button variant="secondary" size="sm">
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
