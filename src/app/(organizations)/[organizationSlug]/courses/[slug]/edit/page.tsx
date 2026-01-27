'use client';

import CreateCourseView from "@/components/course/create/CreateCourseView";

import { useParams } from "next/navigation";

export default function CourseEditPage() {
  const params = useParams();
  const slug = params.slug as string;

  return <CreateCourseView isEditMode={true} courseSlug={slug} />;
}
