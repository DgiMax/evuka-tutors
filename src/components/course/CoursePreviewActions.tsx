"use client";

import React from "react";
import Link from "next/link";
import { Edit, Eye, Video } from "lucide-react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";

interface CoursePreviewActionsProps {
  slug: string;
}

export const CoursePreviewActions = ({ slug }: CoursePreviewActionsProps) => {
  const { activeSlug } = useActiveOrg();

  // Base URL prefix for routing depending on organization context
  const basePrefix = activeSlug ? `${activeSlug}` : '';

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Edit Course Button */}
      <Link
        href={`${basePrefix}/courses/${slug}/edit`}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2694C6] text-white text-sm font-bold rounded hover:bg-[#227fa8] transition-colors"
      >
        <Edit className="w-4 h-4" />
        Edit Course
      </Link>

      {/* Preview Learning Button */}
      <Link
        href={`${basePrefix}/courses/${slug}/preview-learning`}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#2694C6] text-[#2694C6] text-sm font-bold rounded hover:bg-blue-50 transition-colors"
      >
        <Eye className="w-4 h-4" />
        Preview Learning
      </Link>

      {/* View Live Classes Button */}
       <Link
        href={`${basePrefix}/courses/${slug}/live-classes`}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 text-sm font-bold rounded hover:bg-gray-50 transition-colors"
      >
        <Video className="w-4 h-4" />
        Manage Live Classes
      </Link>
    </div>
  );
};