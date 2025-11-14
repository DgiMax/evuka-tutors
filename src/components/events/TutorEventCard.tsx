"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Pencil } from "lucide-react";
import Link from "next/link";

export interface TutorEvent {
  slug: string;
  title: string;
  banner_image?: string;
  overview: string;
  start_time: string;
  computed_status: string;
}

interface Props {
  event: TutorEvent;
  makeContextLink: (path: string) => string;
}

// ✅ Helper for badge colors
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
  const formattedStartDate = new Date(event.start_time).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <Card className="flex flex-row overflow-hidden border border-gray-200 rounded bg-white hover:shadow-sm transition-shadow h-36">
      {/* --- LEFT: Banner / Icon */}
      <div className="w-32 h-full flex-shrink-0">
        {event.banner_image ? (
          <img
            src={event.banner_image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
            <CalendarDays className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* --- RIGHT: Details */}
      <div className="flex flex-col justify-between flex-1 px-2 py-1 min-w-0">
        {/* Title & Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {event.title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{formattedStartDate}</p>
          <p className="text-xs text-gray-600 line-clamp-2 mt-1">
            {event.overview || "No overview provided."}
          </p>
        </div>

        {/* Footer: Status + Actions */}
        <div className="flex items-center justify-between mt-2">
          <span
            className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${getStatusClass(
              event.computed_status
            )}`}
          >
            {event.computed_status
              .charAt(0)
              .toUpperCase() +
              event.computed_status.slice(1).replace("_", " ")}
          </span>

          <div className="flex gap-1.5">
            <Link href={makeContextLink(`/events/${event.slug}`)}>
              <Button size="sm" className="h-7 px-3 text-[12px] rounded">
                View
              </Button>
            </Link>
            <Link href={makeContextLink(`/events/${event.slug}/edit`)}>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 px-3 text-[12px] rounded"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
