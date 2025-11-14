"use client";

import React, { useState, useEffect } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { useDebounce } from "@/lib/hooks/useDebounce";
import api from "@/lib/api/axios";
import { Loader2, CalendarDays, Plus, Search } from "lucide-react";
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
        console.error("Error loading tutor/admin events:", err);
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
    ? `/${activeSlug}/create-event`
    : "/create-event";

  const isDefaultView = statusFilter === "all" && searchTerm === "";

  if (isLoading && !events.length) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center mt-10">{error}</p>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8">
      {/* Header / Toolbar */}
      <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-900">My Events</h2>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              className="pl-10 rounded bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white rounded">
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

          {/* New Event Button */}
          <Button asChild className="w-full sm:w-auto rounded">
            <Link href={createEventHref} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Event
            </Link>
          </Button>
        </div>
      </div>

      {/* Content or Empty State */}
      {!events.length ? (
        <div className="text-center py-16">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-gray-400" />
          <p className="text-gray-600">
            {isDefaultView
              ? "You haven't created any events yet."
              : "No events found matching your criteria."}
          </p>
          <div className="mt-4">
            <Link href={createEventHref}>
              <Button>Create Event</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="relative grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-full bg-white/50 z-10 flex justify-center items-start pt-32">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
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
