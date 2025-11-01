"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Pencil } from "lucide-react";
import Link from "next/link";

// 1. Define the data structure for the event card
export interface TutorEvent {
  slug: string;
  title: string;
  banner_image?: string;
  overview: string;
  start_time: string;
  computed_status: string; // From your EventListSerializer
}

interface Props {
  event: TutorEvent;
  makeContextLink: (path: string) => string;
}

// 2. Helper function to format the status badge
const getStatusClass = (status: string) => {
  switch (status) {
    case "scheduled":
    case "approved":
      return "bg-green-100 text-green-700";
    case "ongoing":
      return "bg-indigo-100 text-indigo-700";
    case "pending_approval":
      return "bg-blue-100 text-blue-700";
    case "draft":
      return "bg-yellow-100 text-yellow-700";
    case "cancelled":
    case "postponed":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export default function TutorEventCard({ event, makeContextLink }: Props) {
  
  const formattedStartDate = new Date(event.start_time).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="rounded border border-gray-200 bg-white overflow-hidden flex flex-col p-2">
      {/* Banner Image */}
      {event.banner_image ? (
        <img
          src={event.banner_image}
          alt={event.title}
          className="w-full h-36 object-cover"
        />
      ) : (
        <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400">
          <CalendarDays className="h-6 w-6" />
        </div>
      )}

      {/* Content */}
      <CardContent className="p-1 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {event.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {formattedStartDate}
          </p>
          <p className="text-xs text-gray-600 line-clamp-2 mt-1">
            {event.overview || "No overview provided."}
          </p>
        </div>

        {/* Bottom row: status + buttons */}
        <div className="flex items-center justify-between mt-3">
          {/* Status */}
          <span
            className={`!text-[9px] font-medium px-3 py-1 rounded-full ${getStatusClass(
              event.computed_status
            )}`}
          >
            {/* Capitalize first letter */}
            {event.computed_status.charAt(0).toUpperCase() + event.computed_status.slice(1).replace("_", " ")}
          </span>

          {/* Buttons */}
          <div className="flex gap-2">
            {/* Link to the public-facing event page */}
            <Link href={makeContextLink(`/events/${event.slug}`)}>
              <Button size="sm">View</Button>
            </Link>
            {/* Link to the edit page we created */}
            <Link href={makeContextLink(`/tutor/events/${event.slug}/edit`)}>
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