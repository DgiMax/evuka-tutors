"use client";

import React, { useState, useEffect } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";
import { Loader2, CalendarDays, Plus } from "lucide-react"; // Changed icon
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
// Import the new card and interface
import TutorEventCard, { TutorEvent } from "@/components/events/TutorEventCard"; // ⬅️ Adjust this import path

export default function TutorEventsClient() {
  const { activeSlug } = useActiveOrg();
  const [events, setEvents] = useState<TutorEvent[]>([]); // Renamed
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => { // Renamed
      setIsLoading(true);
      setError(null);
      try {
        // ⚠️ ASSUMPTION:
        // Your course page uses "/tutor-courses/".
        // This assumes you have an equivalent endpoint "/events/"
        // that returns a list of events for the authenticated tutor.
        const res = await api.get("/events/"); 
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setEvents(data); // Renamed
      } catch (err) {
        console.error("Error loading tutor/admin events:", err); // Renamed
        setError("Failed to load your events."); // Renamed
        toast.error("Failed to load your events."); // Renamed
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents(); // Renamed
  }, [activeSlug]);

  const makeContextLink = (path: string) => {
    if (!activeSlug) return path;
    if (path.startsWith(`/${activeSlug}`)) return path;
    return `/${activeSlug}${path}`;
  };

  // Updated to point to the event create page
  const createEventHref = activeSlug
    ? `/${activeSlug}/events/create`
    : "/events/create";

  if (isLoading) {
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
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          My Events
        </h2>

        <Link
          href={createEventHref}
          className="flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
          New Event
        </Link>
      </div>

      {/* Empty State */}
      {!events.length ? (
        <div className="text-center py-16">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-gray-400" />
          <p className="text-gray-600">
            You haven’t created any events yet.
          </p>
          <div className="mt-4">
            <Link href={createEventHref}>
              <Button>Create Event</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
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