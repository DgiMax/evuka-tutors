"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  Eye,
  ArrowLeft,
  CheckCircle2,
  Info,
  Globe,
  PlayCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Heart,
  ShieldCheck,
  Target
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/lib/api/axios";
import { cn } from "@/lib/utils";

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
  organizer_name?: string;
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

export const EventAgenda = ({ agenda }: { agenda: any[] }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!agenda?.length) return null;

  return (
    <div className="divide-y divide-border border-y border-border">
      {agenda.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="group">
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between py-5 px-2 text-left transition-colors"
            >
              <div className="flex items-center gap-6">
                <span className="text-[11px] font-black text-[#2694C6] uppercase tracking-tighter w-16">
                  {item.time}
                </span>
                <span className="font-bold text-sm text-foreground group-hover:text-[#2694C6] transition-colors">
                  {item.title}
                </span>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
            </button>
            <div className={cn("grid transition-all duration-300 ease-in-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
              <div className="overflow-hidden">
                <div className="pb-6 pl-[88px] pr-4 text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PreviewStickySidebar = ({ event }: { event: EventDetails }) => (
  <div className="relative lg:sticky lg:top-20 border-2 border-border rounded-md bg-card overflow-hidden w-full">
    <div className="aspect-video bg-muted relative border-b border-border flex items-center justify-center group">
      {event.banner_image ? (
        <Image src={event.banner_image} alt="Banner" fill className="object-cover" />
      ) : (
        <BookOpen className="h-10 w-10 text-muted-foreground/20" />
      )}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <PlayCircle size={48} className="text-white" />
      </div>
    </div>

    <div className="p-4 md:p-6 space-y-6">
      <div className="space-y-1">
        <h3 className="text-2xl md:text-3xl font-black text-foreground">
          {event.is_paid ? `${event.currency} ${Number(event.price).toLocaleString()}` : "Free"}
        </h3>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#2694C6]">Full Event Access</p>
      </div>

      <div className="space-y-3">
        <button className="w-full font-black uppercase text-[12px] tracking-widest py-4 px-4 rounded-md bg-[#2694C6]/50 text-white cursor-not-allowed shadow-none">
          Register Now
        </button>
        <div className="flex items-center space-x-3">
          <button className="flex-grow bg-white text-gray-400 font-black uppercase text-[12px] tracking-widest py-4 px-4 rounded-md border-2 border-gray-200 cursor-not-allowed transition-colors duration-200">
            Add to Cart
          </button>
          <button className="p-4 rounded-md border-2 border-gray-200 text-gray-300 cursor-not-allowed">
            <Heart size={20} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default function TutorEventPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [openRuleIndex, setOpenRuleIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/tutor-events/${slug}/`);
        setEvent(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  if (loading) return <EventDetailsSkeleton />;
  if (!event) return null;

  const isLongDescription = (event.description?.length || 0) > 800;

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-[#1C1D1F] text-white pt-10 pb-20 md:pt-16 md:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="group flex items-center gap-2 text-gray-300 hover:text-white p-0 hover:bg-transparent font-black uppercase text-[10px] tracking-widest transition-all w-fit"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back
            </Button>
            <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-md flex items-center gap-2">
              <Eye size={16} className="text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Preview Mode</span>
            </div>
          </div>

          <div className="lg:w-2/3 space-y-6">
            <Badge className="bg-[#2694C6] text-white rounded-sm border-none font-black text-[10px] uppercase">
              {event.event_type} Event
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              {event.title}
            </h1>
            <p className="text-lg md:text-xl text-gray-300 font-normal max-w-3xl leading-relaxed">
              {event.overview}
            </p>

            <div className="flex flex-wrap items-center gap-8 pt-4">
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Event Date</span>
                  <div className="flex items-center gap-2 font-bold">
                    <CalendarDays size={16} className="text-[#2694C6]" />
                    <span>{new Date(event.start_time).toLocaleDateString()}</span>
                  </div>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Location</span>
                  <div className="flex items-center gap-2 font-bold">
                    <MapPin size={16} className="text-[#2694C6]" />
                    <span className="capitalize">{event.location || "Online"}</span>
                  </div>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Organized By</span>
                  <div className="flex items-center gap-2 font-bold">
                    <Users size={16} className="text-[#2694C6]" />
                    <span>{event.organizer_name || "Event Host"}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 md:-mt-16 relative z-20 mb-12">
         <div className="bg-white border border-border rounded-md p-6 grid grid-cols-2 md:grid-cols-4 gap-6 shadow-sm">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-muted rounded-md"><Users size={18} className="text-[#2694C6]" /></div>
               <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Registrations</p>
                  <p className="text-sm font-bold">{event.registrations_count} / {event.max_attendees || "∞"}</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="p-2 bg-muted rounded-md"><Clock size={18} className="text-[#2694C6]" /></div>
               <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Start Time</p>
                  <p className="text-sm font-bold">{new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="p-2 bg-muted rounded-md"><Info size={18} className="text-[#2694C6]" /></div>
               <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Deadline</p>
                  <p className="text-sm font-bold">{event.registration_deadline ? new Date(event.registration_deadline).toLocaleDateString() : "Open"}</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="p-2 bg-muted rounded-md"><Globe size={18} className="text-[#2694C6]" /></div>
               <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Access</p>
                  <p className="text-sm font-bold capitalize">{event.who_can_join.replace("_", " ")}</p>
               </div>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 lg:gap-12">
          <aside className="order-1 lg:order-2 lg:col-span-1 mt-6 lg:mt-0 z-10 w-full max-w-md lg:max-w-none mx-auto lg:mx-0">
            <PreviewStickySidebar event={event} />
          </aside>

          <main className="order-2 lg:order-1 lg:col-span-2 py-8 space-y-16">
            {event.learning_objectives?.length > 0 && (
              <div className="border border-border rounded-md p-6 md:p-8 bg-card shadow-none">
                <div className="flex items-center gap-3 mb-8">
                  <Target size={22} className="text-[#2694C6]" />
                  <h2 className="text-xl font-black text-foreground uppercase tracking-widest">Target Outcomes</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {event.learning_objectives.map((obj) => (
                    <div key={obj.id} className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-[#2694C6] shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-muted-foreground leading-relaxed">{obj.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
  <h2 className="text-xl font-black text-foreground uppercase tracking-widest">
    About Event
  </h2>
  
  <div className="relative">
    <div className={cn(
      "prose prose-sm max-w-none text-muted-foreground font-medium leading-relaxed transition-all duration-700 ease-in-out overflow-hidden",
      !isExpanded && isLongDescription ? "max-h-32" : "max-h-[2000px]"
    )}>
      <ReactMarkdown>{event.description || "No description provided."}</ReactMarkdown>
    </div>

    {!isExpanded && isLongDescription && (
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
    )}
  </div>

  {isLongDescription && (
    <button
      onClick={() => setIsExpanded(!isExpanded)}
      className="flex items-center gap-2 text-[#2694C6] font-black uppercase text-[11px] tracking-widest hover:text-[#1e7ca8] transition-colors mt-2"
    >
      {isExpanded ? (
        <>Show Less <ChevronUp size={14} /></>
      ) : (
        <>Read More <ChevronDown size={14} /></>
      )}
    </button>
  )}
</div>

            <div className="space-y-8">
              <h2 className="text-xl font-black text-foreground uppercase tracking-widest">
                Itinerary
              </h2>
              <EventAgenda agenda={event.agenda || []} />
            </div>

            {event.rules?.length > 0 && (
              <div className="space-y-8">
                <h2 className="text-xl font-black text-foreground uppercase tracking-widest">
                  Participation Rules
                </h2>
                <div className="divide-y divide-border border-y border-border">
                  {event.rules.map((rule, idx) => {
                    const isRuleOpen = openRuleIndex === idx;
                    return (
                      <div key={rule.id} className="group">
                        <button 
                          onClick={() => setOpenRuleIndex(isRuleOpen ? null : idx)}
                          className="w-full flex items-center justify-between py-5 px-2 text-left"
                        >
                          <div className="flex items-center gap-4">
                            <ShieldCheck size={18} className={cn("transition-colors", isRuleOpen ? "text-[#2694C6]" : "text-muted-foreground")} />
                            <span className="font-bold text-sm uppercase tracking-wider">{rule.title}</span>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isRuleOpen && "rotate-180")} />
                        </button>
                        <div className={cn("grid transition-all duration-300 ease-in-out", isRuleOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                          <div className="overflow-hidden">
                            <div className="pb-6 pl-10 pr-4 text-sm text-muted-foreground leading-relaxed">
                              <ReactMarkdown>{rule.text}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {event.course && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-foreground uppercase tracking-widest">
                  Course Connection
                </h2>
                <div className="flex flex-row items-center gap-6 p-6 rounded-md border border-border bg-card shadow-none max-w-xl">
                  <div className="h-20 w-32 rounded bg-muted overflow-hidden shrink-0 relative">
                    {event.course.thumbnail ? (
                       <Image src={event.course.thumbnail} alt={event.course.title} fill className="object-cover" />
                    ) : (
                      <BookOpen size={24} className="absolute inset-0 m-auto text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-left min-w-0">
                    <h4 className="font-black text-foreground text-base truncate mb-1">{event.course.title}</h4>
                    <p className="text-[10px] text-[#2694C6] font-black uppercase tracking-widest">Curriculum Linked</p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

const EventDetailsSkeleton = () => (
  <SkeletonTheme baseColor="#f3f4f6" highlightColor="#ffffff">
    <div className="min-h-screen">
      <div className="bg-[#1C1D1F] py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="lg:w-2/3 space-y-6">
            <Skeleton width={100} height={20} />
            <Skeleton height={80} width="80%" />
            <Skeleton height={40} width="60%" />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton height={200} borderRadius={6} />
            <Skeleton count={5} height={60} borderRadius={6} />
          </div>
          <div className="lg:col-span-1">
            <Skeleton height={450} borderRadius={6} />
          </div>
        </div>
      </div>
    </div>
  </SkeletonTheme>
);