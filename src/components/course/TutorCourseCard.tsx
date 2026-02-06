"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Pencil,
  MoreVertical,
  View,
  CalendarCheck2, PlayCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
  const getStatusClass = () => {
    switch (course.status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "pending_review":
        return "bg-blue-100 text-blue-800";
      case "archived":
        return "bg-muted text-muted-foreground";
      case "draft":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const isPublished = course.status === "published";

  return (
    <Card className="flex flex-col sm:flex-row overflow-hidden border-border bg-card p-2 rounded-md transition-colors duration-200 hover:border-primary shadow-none">
      <div className="w-full h-32 sm:w-40 sm:h-full flex-shrink-0 relative rounded-t-md sm:rounded-l-md sm:rounded-t-none overflow-hidden">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between flex-1 p-2 min-w-0">
        <div>
          <h3 className="text-sm font-semibold text-foreground truncate">
            {course.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {course.short_description || "No description provided."}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${getStatusClass()}`}>
            {course.status_display || course.status}
          </span>

          <div className="flex items-center gap-1">
            <Button asChild size="sm" className="h-7 px-3 text-[12px] rounded-md">
              <Link href={makeContextLink(`/courses/${course.slug}`)}>
                Manage
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md bg-transparent hover:bg-transparent border-none focus-visible:ring-0 text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={makeContextLink(`/courses/${course.slug}/preview`)} className="flex items-center w-full">
                    <View className="h-3.5 w-3.5 mr-2" /> View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  asChild={isPublished} 
                  disabled={!isPublished}
                  className={!isPublished ? "opacity-50 cursor-not-allowed" : ""}
                >
                  {isPublished ? (
                    <Link href={makeContextLink(`/courses/${course.slug}/preview-learning`)} className="flex items-center w-full">
                      <PlayCircle className="h-3.5 w-3.5 mr-2 text-[#2694C6]" /> Preview Learning
                    </Link>
                  ) : (
                    <div className="flex items-center w-full">
                      <PlayCircle className="h-3.5 w-3.5 mr-2" /> Preview Learning
                    </div>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={makeContextLink(`/courses/${course.slug}/edit`)} className="flex items-center w-full">
                    <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  asChild={isPublished} 
                  disabled={!isPublished}
                  className={!isPublished ? "opacity-50 cursor-not-allowed" : ""}
                >
                  {isPublished ? (
                    <Link href={makeContextLink(`/courses/${course.slug}/live-classes`)} className="flex items-center w-full">
                      <CalendarCheck2 className="h-3.5 w-3.5 mr-2" /> Live Classes
                    </Link>
                  ) : (
                    <div className="flex items-center w-full">
                      <CalendarCheck2 className="h-3.5 w-3.5 mr-2" /> Live Classes
                    </div>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
}