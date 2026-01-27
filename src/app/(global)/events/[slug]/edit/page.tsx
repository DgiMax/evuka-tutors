"use client";

import { useParams } from "next/navigation";
import CreateEventPage from "@/components/events/CreateEventPage";
import { Loader2 } from "lucide-react";

export default function EventEditPage() {
  const params = useParams();
  const slug = params.slug as string;

  if (!slug) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-500">Loading...</p>
      </div>
    );
  }

  return <CreateEventPage isEditMode={true} eventSlug={slug} />;
}