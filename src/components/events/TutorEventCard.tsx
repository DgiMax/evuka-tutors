// components/events/TutorEventCard.tsx
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
import { CalendarDays, Pencil, MoreVertical, View } from "lucide-react";
import Link from "next/link";
import Image from "next/image"; // Use next/image

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

// ✅ Helper for badge colors (Updated to use theme-friendly classes)
const getStatusClass = (status: string) => {
  switch (status) {
    case "scheduled":
    case "approved":
      return "bg-green-100 text-green-800"; // Good contrast
    case "ongoing":
      return "bg-blue-100 text-blue-800"; // Switched to blue
    case "pending_approval":
      return "bg-yellow-100 text-yellow-800"; // Good contrast
    case "draft":
    case "cancelled":
    case "postponed":
    default:
      return "bg-muted text-muted-foreground"; // Uses theme colors
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
    // UPDATED:
    // 1. Responsive: flex-col sm:flex-row
    // 2. Theme: Uses bg-card and border-border
    // 3. Style: p-0 and rounded-md for consistent look
    <Card className="flex flex-col sm:flex-row overflow-hidden border-border bg-card hover:shadow transition-shadow p-0 rounded-md">
      {/* --- LEFT: Banner / Icon --- */}
      {/* UPDATED:
        1. Responsive: w-full h-32 sm:w-32 sm:h-full
        2. Style: Added rounding to match card edges
      */}
      <div className="w-full h-32 sm:w-32 sm:h-full flex-shrink-0 relative rounded-t-md sm:rounded-l-md sm:rounded-t-none">
        {event.banner_image ? (
          <Image
            src={event.banner_image}
            alt={event.title}
            layout="fill"
            className="object-cover"
          />
        ) : (
          // UPDATED: Uses theme bg-muted and text-muted-foreground
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
            <CalendarDays className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* --- RIGHT: Details --- */}
      {/* UPDATED: Uses p-4 for consistent internal padding */}
      <div className="flex flex-col justify-between flex-1 p-4 min-w-0">
        {/* Title & Info */}
        <div>
          {/* UPDATED: Uses theme text colors */}
          <h3 className="text-sm font-semibold text-foreground truncate">
            {event.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formattedStartDate}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
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
            {event.computed_status.charAt(0).toUpperCase() +
              event.computed_status.slice(1).replace("_", " ")}
          </span>

          {/* UPDATED: Actions now a visible button + dropdown */}
          <div className="flex items-center gap-1">
            <Button
              asChild
              variant="outline" // Use outline for "View"
              size="sm"
              className="h-7 px-3 text-[12px] rounded-md"
            >
              <Link href={makeContextLink(`/events/${event.slug}`)}>View</Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md bg-transparent hover:bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={makeContextLink(`/events/${event.slug}/edit`)}
                    className="flex items-center w-full"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
}