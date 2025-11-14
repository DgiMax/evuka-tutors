"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  CalendarDaysIcon,
  MapPinIcon,
  Clock3Icon,
  UsersIcon,
  Eye,
  Pencil,
} from "lucide-react";

import { EventAgenda } from "@/components/events/EventAgenda";
import api from "@/lib/api/axios";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------
// TYPES
// ---------------------------------------------------

export type EventDetails = {
  id: number;
  slug: string;
  title: string;
  overview: string;
  description: string;
  event_type: string;
  location: string;
  meeting_link?: string;
  start_time: string;
  end_time: string;
  timezone: string;
  who_can_join: string;
  banner_image: string;
  is_paid: boolean;
  price: string;
  currency: string;
  max_attendees: number;
  registration_open: boolean;
  registration_deadline: string;
  course?: {
    id: number;
    slug: string;
    title: string;
    thumbnail: string;
  };
  organizer_name: string;
  registrations_count: number;
  is_full: boolean;
  is_registered: boolean;
  attachments: any[];
  agenda: { id: number; time: string; title: string; description: string; order: number }[];
  learning_objectives: { id: number; text: string }[];
  rules: { id: number; title: string; text: string }[];
  created_at: string;
  updated_at: string;
  computed_status: string;
};

// ---------------------------------------------------
// SIDEBAR: Tutor Actions (EDIT ONLY + STATUS)
// ---------------------------------------------------

const TutorActionSidebar = ({
  event,
  makeContextLink,
}: {
  event: EventDetails;
  makeContextLink: (path: string) => string;
}) => {
  const status = event.computed_status || "draft";

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
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="sticky top-16">
      <div className="border border-gray-200 rounded bg-white p-6 shadow">
        
        {/* ONLY EDIT ACTION requested */}
        <div className="mb-6">
          <Link href={makeContextLink(`/tutor/events/${event.slug}/edit`)} className="block w-full">
            <Button className="w-full font-bold bg-[#2694C6] hover:bg-[#227fa8] rounded">
              <Pencil className="w-4 h-4 mr-2" /> Edit Event
            </Button>
          </Link>
        </div>

        <hr className="my-6 border-gray-100" />

        {/* Status Display */}
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Event Status</p>
          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${getStatusClass(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
          </span>
        </div>

        {/* Key Details Summary */}
        <div className="space-y-3 text-sm text-gray-700">
            {event.is_paid ? (
                <p className="text-2xl font-bold text-gray-900 mb-4">
                {event.currency} {event.price}
                </p>
            ) : (
                <p className="text-lg font-semibold text-green-600 mb-4">Free Event</p>
            )}

          <p className="flex items-start">
            <CalendarDaysIcon className="w-4 h-4 mr-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <span>
                {new Date(event.start_time).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
                })}
            </span>
          </p>

          <p className="flex items-start">
            <Clock3Icon className="w-4 h-4 mr-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <span>{event.timezone}</span>
          </p>

          <p className="flex items-start">
            <MapPinIcon className="w-4 h-4 mr-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="capitalize">
                {event.location || (event.meeting_link ? "Online" : event.event_type)}
            </span>
          </p>

          <p className="flex items-start">
            <UsersIcon className="w-4 h-4 mr-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <span>
                {event.registrations_count} Registered 
                <span className="text-gray-500 ml-1">
                    ({event.max_attendees ? `${event.max_attendees} max` : "Unlimited"})
                </span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------

const EventDescription = ({ html }: { html: string }) => (
  <div className="prose prose-gray max-w-none text-gray-700">
    <h2 className="text-2xl font-bold mb-4 text-gray-900">About this Event</h2>
    <div dangerouslySetInnerHTML={{ __html: html || "No description available." }} />
  </div>
);

const EventDetailsLoading = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
    <div className="lg:grid lg:grid-cols-3 lg:gap-x-8 xl:gap-x-10">
      <aside className="lg:order-2 order-1 mt-8 lg:mt-0">
         <div className="sticky top-2 border border-gray-200 rounded bg-white p-6 h-96">
             <div className="h-10 bg-gray-200 rounded mb-6"></div>
             <div className="h-px bg-gray-200 mb-6"></div>
             <div className="space-y-4">
                 <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                 <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                 <div className="h-4 bg-gray-200 rounded w-2/3"></div>
             </div>
         </div>
      </aside>
      <main className="lg:col-span-2 lg:order-1 order-2">
        <div className="aspect-video bg-gray-200 rounded-md mb-8"></div>
        <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="space-y-6">
          <div className="h-32 bg-gray-200 rounded border border-gray-100"></div>
          <div className="h-48 bg-gray-200 rounded border border-gray-100"></div>
        </div>
      </main>
    </div>
  </div>
);

const RelatedCourseCard = ({ course }: { course: any }) => {
    // Helper to build the correct link based on context if needed, 
    // or just link to the public course page.
    return (
        <div className="border border-gray-200 rounded p-4 flex items-center gap-4 bg-white hover:shadow transition-shadow">
            {course.thumbnail ? (
                 <img src={course.thumbnail} alt={course.title} className="w-24 h-16 object-cover rounded" />
            ) : (
                <div className="w-24 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
            )}
            <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1">{course.title}</h3>
            <Link href={`/courses/${course.slug}`} target="_blank" className="text-sm font-medium text-[#2694C6] hover:underline">
                View Course Page
            </Link>
            </div>
        </div>
    );
};

// ---------------------------------------------------
// MAIN PAGE: Tutor Event Preview
// ---------------------------------------------------

export default function TutorEventPreviewPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { activeSlug } = useActiveOrg();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchEventDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // ✅ CORRECTED API ENDPOINT to match backend router
        const res = await api.get(`/events/tutor-events/${slug}/`);
        setEvent(res.data);
      } catch (err: any) {
        console.error("Failed to fetch event:", err);
        setError(err.response?.status === 404 ? "Event not found." : "Failed to load event details.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [slug, activeSlug]);

  const makeContextLink = (path: string) => {
    if (!activeSlug) return path;
    // If path already has org prefix, don't add it again
    if (path.startsWith(`/org/${activeSlug}`)) return path;
    // Ensure we don't double-slash
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/org/${activeSlug}${cleanPath}`;
  };

  if (loading)
    return (
      <div className="bg-gray-50 min-h-screen">
        <EventDetailsLoading />
      </div>
    );

  if (error)
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm text-center max-w-md">
             <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             </div>
            <p className="text-gray-900 font-medium text-lg">{error}</p>
        </div>
      </div>
    );

  if (!event) return null;

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 pb-16">
        
        {/* Preview Mode Banner */}
        <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 flex items-start sm:items-center shadow">
          <Eye className="w-5 h-5 mr-3 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
          <div className="text-amber-800 text-sm">
            <strong>Tutor Preview Mode:</strong> This is exactly how learners will see your event page.
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-x-8 xl:gap-x-10">
          
          {/* Sidebar (Right on Desktop) */}
          <aside className="lg:col-span-1 lg:order-2 order-1 mb-8 lg:mb-0">
            <TutorActionSidebar event={event} makeContextLink={makeContextLink} />
          </aside>

          {/* Main Content (Left on Desktop) */}
          <main className="lg:col-span-2 lg:order-1 order-2">
            <div className="aspect-video bg-gray-900 rounded-md mb-8 overflow-hidden shadow">
                {event.banner_image ? (
                    <Image
                        src={event.banner_image}
                        alt={event.title}
                        width={1280}
                        height={720}
                        className="w-full h-full object-cover"
                        priority
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                         <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                )}
            </div>

            <div className="bg-white rounded p-8 shadow border border-gray-200 mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">{event.overview || "No overview available."}</p>

                <div className="flex flex-wrap items-center text-sm text-gray-500 pt-6 border-t border-gray-100">
                    <div className="mr-6 mb-2">
                        <span className="text-gray-400 mr-2">Organizer:</span>
                        <span className="font-semibold text-gray-900">{event.organizer_name || "Unknown"}</span>
                    </div>
                    <div className="mb-2">
                        <span className="text-gray-400 mr-2">Type:</span>
                        <span className="font-semibold text-gray-900 capitalize">{event.event_type}</span>
                    </div>
                </div>
            </div>

            {event.agenda?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded p-8 mb-8 shadow">
                <h2 className="text-xl font-bold mb-6 text-gray-900">Event Agenda</h2>
                <EventAgenda agenda={event.agenda} />
              </div>
            )}

            {event.learning_objectives?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded p-8 mb-8 shadow">
                <h2 className="text-xl font-bold mb-4 text-gray-900">What You'll Learn</h2>
                <ul className="space-y-3">
                  {event.learning_objectives.map((obj) => (
                    <li key={obj.id} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-gray-700">{obj.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {event.rules?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded p-8 mb-8 shadow">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Event Rules</h2>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {event.rules.map((rule) => (
                    <li key={rule.id}>
                      <strong>{rule.title}: </strong>{rule.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded p-8 mb-8 shadow">
                 <EventDescription html={event.description} />
            </div>

            {event.course && (
              <div className="mt-10">
                <h2 className="text-lg font-bold mb-4 text-gray-900">Related Course</h2>
                <RelatedCourseCard course={event.course} />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}