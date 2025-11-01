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
  UserCheck,
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
// SIDEBAR: Tutor Actions
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
    <div className="sticky top-2">
      <div className="border border-gray-200 rounded-lg bg-white p-6 shadow-sm">
        {/* Tutor Actions */}
        <div className="space-y-3">
          <Link href={makeContextLink(`/tutor/events/${event.slug}/edit`)} className="block w-full">
            <Button className="w-full font-bold">
              <Pencil className="w-4 h-4 mr-2" /> Edit Event
            </Button>
          </Link>

          <Link
            href={makeContextLink(`/tutor/events/${event.slug}/attendees`)}
            className="block w-full"
          >
            <Button variant="secondary" className="w-full font-bold">
              <UserCheck className="w-4 h-4 mr-2" /> View Attendees
            </Button>
          </Link>

          <Link
            href={makeContextLink(`/events/${event.slug}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
          >
            <Button variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" /> View Public Page
            </Button>
          </Link>
        </div>

        <hr className="my-6" />

        {/* Status */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900 mb-2">Event Status</p>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusClass(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
          </span>
        </div>

        {/* Price */}
        {event.is_paid ? (
          <p className="text-3xl font-bold text-gray-900 mb-4">
            {event.currency} {event.price}
          </p>
        ) : (
          <p className="text-lg font-semibold text-green-600 mb-4">Free Event</p>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm text-gray-700">
          <p className="flex items-start">
            <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-600 mt-0.5" />
            {new Date(event.start_time).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>

          <p className="flex items-start">
            <Clock3Icon className="w-4 h-4 mr-2 text-gray-600 mt-0.5" />
            {event.timezone}
          </p>

          <p className="flex items-start">
            <MapPinIcon className="w-4 h-4 mr-2 text-gray-600 mt-0.5" />
            {event.location || (event.meeting_link ? "Online" : event.event_type)}
          </p>

          <p className="flex items-start">
            <UsersIcon className="w-4 h-4 mr-2 text-gray-600 mt-0.5" />
            {event.registrations_count} Registered (
            {event.max_attendees ? `${event.max_attendees} Max` : "Unlimited"})
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
      <aside className="lg:order-1 order-2 mt-2 lg:mt-0">
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </aside>
      <main className="lg:col-span-2 lg:order-2 order-1">
        <div className="aspect-video bg-gray-200 rounded-md mb-6"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </main>
    </div>
  </div>
);

const RelatedCourseCard = ({ course }: { course: any }) => (
  <div className="border rounded-lg p-4 flex items-center gap-4">
    <img src={course.thumbnail} alt={course.title} className="w-32 h-20 object-cover rounded" />
    <div>
      <h3 className="font-semibold">{course.title}</h3>
      <Link href={`/courses/${course.slug}`} className="text-sm text-blue-600 hover:underline">
        View Course
      </Link>
    </div>
  </div>
);

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
        const res = await api.get(`/events/tutors/${slug}/`);
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
    if (path.startsWith(`/${activeSlug}`)) return path;
    return `/${activeSlug}${path}`;
  };

  if (loading)
    return (
      <div className="bg-white text-gray-800 font-sans">
        <EventDetailsLoading />
      </div>
    );

  if (error)
    return (
      <div className="bg-white text-gray-800 font-sans min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );

  if (!event)
    return (
      <div className="bg-white text-gray-800 font-sans min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Event details could not be loaded.</p>
      </div>
    );

  return (
    <div className="bg-white text-gray-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Preview Mode Banner */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center">
          <Eye className="w-5 h-5 mr-3 text-yellow-700" />
          <div className="text-yellow-800">
            <span className="font-semibold">Preview Mode:</span> This is how your event will look.
            Use the sidebar to edit or view attendees.
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-x-8 xl:gap-x-10">
          {/* Sidebar */}
          <aside className="mt-2 lg:mt-0 order-2 lg:order-1">
            <TutorActionSidebar event={event} makeContextLink={makeContextLink} />
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-2 order-1 lg:order-2">
            <div className="aspect-video bg-gray-100 rounded-md mb-6 overflow-hidden">
              <Image
                src={event.banner_image || "/placeholder.jpg"}
                alt={event.title}
                width={1280}
                height={720}
                className="w-full h-full object-cover rounded-md"
                priority
              />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
            <p className="text-lg text-gray-600 mb-4">{event.overview || "No overview available."}</p>

            <p className="text-sm text-gray-500 mb-6">
              Organizer:{" "}
              <span className="font-semibold text-[#2694C6]">
                {event.organizer_name || "Unknown"}
              </span>{" "}
              | Type: <span className="capitalize">{event.event_type}</span>
            </p>

            {event.agenda?.length > 0 && (
              <div className="border border-gray-200 rounded p-6 my-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Event Agenda</h2>
                <EventAgenda agenda={event.agenda} />
              </div>
            )}

            {event.learning_objectives?.length > 0 && (
              <div className="border border-gray-200 rounded p-6 my-8">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Learning Objectives</h2>
                <ul className="list-disc pl-5 text-gray-700 space-y-1">
                  {event.learning_objectives.map((obj) => (
                    <li key={obj.id}>{obj.text}</li>
                  ))}
                </ul>
              </div>
            )}

            {event.rules?.length > 0 && (
              <div className="border border-gray-200 rounded p-6 my-8">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Event Rules</h2>
                <ul className="list-disc pl-5 text-gray-700 space-y-2">
                  {event.rules.map((rule) => (
                    <li key={rule.id}>
                      <strong>{rule.title}: </strong>
                      {rule.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <EventDescription html={event.description} />

            {event.course && (
              <div className="mt-12">
                <h2 className="text-xl font-bold mb-4">Related Course:</h2>
                <RelatedCourseCard course={event.course} />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
