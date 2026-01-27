"use client";

import React, { useState, useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { useDebounce } from "@/lib/hooks/useDebounce";
import api from "@/lib/api/axios";
import { Loader2, CalendarDays, Plus, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import TutorEventCard, { TutorEvent } from "@/components/events/TutorEventCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EventSkeleton = () => (
  <div className="flex flex-col sm:flex-row border border-border p-0 rounded-md h-[200px] sm:h-36 overflow-hidden">
    <div className="w-full h-32 sm:w-32 sm:h-full flex-shrink-0">
      <Skeleton height="100%" borderRadius="0px" />
    </div>
    <div className="flex flex-col justify-between flex-1 p-4">
      <div>
        <Skeleton width="50%" height={16} />
        <Skeleton width="30%" height={12} className="mt-1" />
        <div className="mt-2">
          <Skeleton count={2} height={10} />
        </div>
      </div>
      <div className="flex justify-between items-center mt-2">
        <Skeleton width={60} height={18} borderRadius={10} />
        <div className="flex gap-2">
          <Skeleton width={50} height={28} />
          <Skeleton width={28} height={28} />
        </div>
      </div>
    </div>
  </div>
);

const EmptyState: React.FC<{
  message: string;
  linkPath?: string;
  linkText?: string;
}> = ({ message, linkPath, linkText }) => (
  <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-border rounded-lg bg-muted/50 p-4">
    <CalendarDays className="h-8 w-8 text-muted-foreground" />
    <p className="text-muted-foreground mt-2 text-center">{message}</p>
    {linkPath && linkText && (
      <Button asChild variant="link" className="text-primary">
        <Link href={linkPath}>{linkText}</Link>
      </Button>
    )}
  </div>
);

export default function TutorEventsClient() {
  const { activeSlug } = useActiveOrg();
  const [events, setEvents] = useState<TutorEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append("view", "manage");
        if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
        if (statusFilter !== "all") params.append("status", statusFilter);

        const res = await api.get(`/events/tutor-events/?${params.toString()}`);
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setEvents(data);
      } catch (err) {
        setError("Failed to load your events.");
        toast.error("Failed to load your events.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [activeSlug, debouncedSearchTerm, statusFilter]);

  const makeContextLink = (path: string) => {
    if (!activeSlug) return path;
    if (path.startsWith(`/${activeSlug}`)) return path;
    return `/${activeSlug}${path}`;
  };

  const createEventHref = activeSlug
    ? `/${activeSlug}/events/create`
    : "/events/create";

  const isDefaultView = statusFilter === "all" && searchTerm === "";

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-destructive container mx-auto px-4 py-8">
        <AlertTriangle className="h-8 w-8" />
        <p className="mt-2 font-medium">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-foreground self-start md:self-center">
          My Events
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Button asChild className="w-full sm:w-auto">
            <Link href={createEventHref} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Event
            </Link>
          </Button>
        </div>
      </div>

      {isLoading && !events.length ? (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => <EventSkeleton key={i} />)}
        </div>
      ) : !events.length ? (
        <EmptyState
          message={
            isDefaultView
              ? "You haven't created any events yet."
              : "No events found matching your criteria."
          }
          {...(isDefaultView && {
            linkPath: createEventHref,
            linkText: "Create your first event",
          })}
        />
      ) : (
        <div className="relative grid gap-4 grid-cols-1 lg:grid-cols-2">
          {isLoading && (
            <div className="absolute inset-0 bg-background/40 z-10 flex justify-center items-start pt-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {events.map((event) => (
            <TutorEventCard
              key={event.slug}
              event={event}
              makeContextLink={makeContextLink}
            />
          ))}
        </div>
      )}
    </div>
  );
}