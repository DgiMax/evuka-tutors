"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarDays, Pencil, MoreVertical, Eye, Video, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface TutorEvent {
  slug: string;
  title: string;
  banner_image?: string;
  overview: string;
  start_time: string;
  computed_status: string;
  event_type: string;
  chat_room_id?: string;
  meeting_link?: string;
}

interface Props {
  event: TutorEvent;
  makeContextLink: (path: string) => string;
}

const getStatusClass = (status: string) => {
  switch (status) {
    case "scheduled":
    case "approved":
      return "bg-green-100 text-green-800";
    case "ongoing":
      return "bg-blue-100 text-blue-800";
    case "pending_approval":
      return "bg-yellow-100 text-yellow-800";
    case "draft":
    case "cancelled":
    case "postponed":
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function TutorEventCard({ event, makeContextLink }: Props) {
  const router = useRouter();
  const [canJoin, setCanJoin] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const startTime = new Date(event.start_time);
      const bufferTime = new Date(startTime.getTime() - 60 * 60 * 1000);
      setCanJoin(now >= bufferTime && event.event_type !== 'physical');
    };

    checkTime();
    const timer = setInterval(checkTime, 30000);
    return () => clearInterval(timer);
  }, [event.start_time, event.event_type]);

  const handleLaunch = () => {
    if (event.chat_room_id && event.chat_room_id.trim() !== "") {
      const targetPath = makeContextLink(`/live-events/${event.slug}`);
      toast.success("Opening event page...");
      router.push(targetPath);
    } 
    else if (event.meeting_link && event.meeting_link.trim() !== "") {
      toast.success("Rediresting you to Event Page...");
      window.open(event.meeting_link, '_blank');
    } 
    else {
      toast.error("Failed to join Meeting.");
    }
  };

  const formattedStartDate = new Date(event.start_time).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  const isOnline = event.event_type === 'online' || event.event_type === 'hybrid';

  return (
    <Card className="flex flex-col sm:flex-row overflow-hidden border-border bg-card p-0 rounded-md transition-colors duration-200 hover:border-primary shadow-none">
      <div className="w-full h-32 sm:w-32 sm:h-full flex-shrink-0 relative rounded-t-md sm:rounded-l-md sm:rounded-t-none overflow-hidden">
        {event.banner_image ? (
          <Image
            src={event.banner_image}
            alt={event.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
            <CalendarDays className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between flex-1 p-4 min-w-0">
        <div>
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

        <div className="flex items-center justify-between mt-2">
          <span
            className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${getStatusClass(
              event.computed_status
            )}`}
          >
            {event.computed_status.charAt(0).toUpperCase() +
              event.computed_status.slice(1).replace("_", " ")}
          </span>

          <div className="flex items-center gap-1">
            {canJoin && isOnline && (
              <Button
                onClick={handleLaunch}
                size="sm"
                className="h-7 px-3 text-[10px] font-black uppercase tracking-tighter rounded-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all active:scale-95"
              >
                {event.chat_room_id ? <Video className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
                Launch
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 px-3 text-[12px] rounded-md border-border hover:bg-primary hover:text-white"
            >
              <Link href={makeContextLink(`/events/${event.slug}`)}>Manage</Link>
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
                  <Link
                    href={makeContextLink(`/events/${event.slug}/edit`)}
                    className="flex items-center w-full"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Edit All
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={makeContextLink(`/events/${event.slug}/preview`)}
                    className="flex items-center w-full"
                  >
                    <Eye className="h-3.5 w-3.5 mr-2" />
                    Preview
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