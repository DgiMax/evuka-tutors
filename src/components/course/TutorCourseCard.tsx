// components/course/TutorCourseCard.tsx
"use client";

import React from "react";
import { Card } from "@/components/ui/card";
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
    <Card className="flex flex-row overflow-hidden border border-gray-200 rounded bg-white hover:shadow-sm transition-shadow p-2 h-32">
      {/* --- LEFT: Image --- */}
      <div className="w-42 h-full flex-shrink-0">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
            <BookOpen className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* --- RIGHT: Details --- */}
      <div className="flex flex-col justify-between flex-1 px-2 py-1 min-w-0">
        {/* Top section */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {course.title}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
            {course.short_description || "No description provided."}
          </p>
        </div>

        {/* Footer pinned bottom */}
        <div className="flex items-center justify-between mt-2">
          <span
            className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
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

          <div className="flex gap-1">
            <Link href={makeContextLink(`/courses/${course.slug}/preview-course`)}>
              <Button size="sm" className="h-7 px-3 text-[12px] rounded">
                View
              </Button>
            </Link>

            <Link href={makeContextLink(`/courses/${course.slug}/edit`)}>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 px-3 text-[12px] rounded"
              >
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            </Link>

            <Link
              href={makeContextLink(`/courses/${course.slug}/live-classes`)}
            >
              <Button variant="secondary" size="sm" className="h-7 px-3 text-[12px] rounded">
                Classes
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
