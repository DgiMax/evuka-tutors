"use client";

import React, { useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Users,
  Settings,
  Layers,
  AlertTriangle,
  ArrowLeft,
  Eye,
  Lock,
} from "lucide-react";
import Link from "next/link";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import api from "@/lib/api/axios";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";

import EventEssentialsTab from "./EventEssentialsTab";
import EventProgramTab from "./EventProgramTab";
import EventAttendeesTab from "./EventAttendeesTab";
import EventSettingsTab from "./EventSettingsTab";

import { EventManagementData } from "./EventSharedTypes";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getMissingFields = (event: EventManagementData) => {
  if (!event) return [];
  const missing = [];
  
  if (event.event_status === 'draft') {
      if (!event.title) missing.push("Title");
      if (!event.start_time) missing.push("Start Date");
      if (!event.end_time) missing.push("End Date");
      if (event.event_type === 'physical' && !event.location) missing.push("Location");
      if (event.event_type !== 'physical' && !event.meeting_link && !event.location) missing.push("Meeting Link or Location"); 
  }
  return missing;
};

const navItems = [
  { value: "essentials", label: "Essentials", icon: BookOpen, restricted: false },
  { value: "program", label: "Program", icon: Layers, restricted: false },
  { value: "attendees", label: "Attendees", icon: Users, restricted: false },
  { value: "settings", label: "Settings", icon: Settings, restricted: false },
];

const DashboardSkeleton = () => (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
      <div className="max-w-7xl mx-auto my-6 md:my-8 space-y-8 px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-border pb-6">
          <div className="space-y-3 flex-1 w-full">
             <Skeleton width={100} height={20} />
             <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Skeleton height={32} className="w-3/4 sm:w-1/2 md:w-1/3" />
                <Skeleton width={80} height={24} />
             </div>
             <Skeleton height={20} className="w-full sm:w-2/3" />
          </div>
          <div className="w-full md:w-auto pt-2 md:pt-0">
             <Skeleton height={40} width={140} className="w-full md:w-[140px]" />
          </div>
        </div>
        <div className="space-y-6">
            <Skeleton height={48} borderRadius={8} />
            <Skeleton height={400} borderRadius={8} />
        </div>
      </div>
    </SkeletonTheme>
);

export default function EventManagerDashboard() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const eventSlug = params.slug as string;
  const { activeSlug: activeOrgSlug } = useActiveOrg();

  const {
    data: eventData,
    isLoading,
    isError,
  } = useQuery<EventManagementData>({
    queryKey: ["eventManagement", eventSlug],
    queryFn: async () => {
      const { data } = await api.get(`/events/tutor-events/${eventSlug}/`);
      return data;
    },
    enabled: !!eventSlug,
  });

  const isRestrictedMode = useMemo(() => {
    if (!eventData) return false;
    return false; 
  }, [eventData]);

  const activeTab = useMemo(() => {
    if (!eventData) return "essentials";
    
    const tabFromUrl = searchParams.get("tab");
    
    if (isRestrictedMode && tabFromUrl) {
      const targetItem = navItems.find(item => item.value === tabFromUrl);
      if (targetItem?.restricted) {
        return "essentials";
      }
    }

    const isValid = navItems.some((item) => item.value === tabFromUrl);
    return isValid && tabFromUrl ? tabFromUrl : "essentials";
  }, [searchParams, eventData, isRestrictedMode]);

  const handleTabChange = useCallback((value: string) => {
    if (isRestrictedMode) {
      const targetItem = navItems.find(item => item.value === value);
      if (targetItem?.restricted) return;
    }

    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("tab", value);
    router.push(`${pathname}?${current.toString()}`, { scroll: false });
  }, [pathname, router, searchParams, isRestrictedMode]);

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !eventData) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4 px-4 text-center">
        <div className="bg-destructive/10 p-4 rounded-full">
            <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div>
            <p className="text-lg font-semibold text-foreground">Event not found</p>
            <p className="text-muted-foreground text-sm mt-1">Access denied or the event may have been deleted.</p>
        </div>
        <Button variant="outline" onClick={() => router.push(activeOrgSlug ? `/${activeOrgSlug}/events` : "/events")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
        </Button>
      </div>
    );
  }

  const missingFields = getMissingFields(eventData);
  const isPublishable = missingFields.length === 0;

  const getStatusVariant = (status: string) => {
      if (status === 'approved' || status === 'scheduled' || status === 'ongoing') return "default";
      if (status === 'cancelled') return "destructive";
      return "secondary";
  };

  return (
    <div className="container mx-auto px-2 md:px-6 py-8 max-w-7xl space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2 flex-1 min-w-0">
          <Link 
            href={activeOrgSlug ? `/${activeOrgSlug}/events` : "/events"} 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
             <ArrowLeft className="h-4 w-4 mr-1" /> Back to Events
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground truncate leading-tight">
              {eventData.title}
            </h1>
            <Badge 
                variant={getStatusVariant(eventData.event_status)} 
                className="capitalize w-fit"
            >
              {eventData.event_status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Manage your event logistics, program schedule, and attendee list.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 md:pt-0">
          <Button variant="outline" asChild size="sm" className="w-full md:w-auto shadow-none">
            <Link href={`/events/${eventData.slug}`} target="_blank">
              <Eye className="mr-2 h-4 w-4" /> Preview Page
            </Link>
          </Button>
        </div>
      </div>

      {eventData.event_status === 'draft' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-4 rounded-lg flex items-start gap-3 animate-in fade-in-50">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
                <p className="font-semibold text-sm">Event is in Draft Mode</p>
                <p className="text-sm opacity-90">
                    This event is hidden from the public marketplace.
                </p>
                
                {!isPublishable && (
                    <div className="pt-2 mt-2 border-t border-amber-200/60">
                         <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">Missing Requirements to Publish:</p>
                         <p className="text-sm font-medium">{missingFields.join(", ")}</p>
                    </div>
                )}
            </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">

        <div className="md:hidden">
          <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">
            Current View
          </label>
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger className="w-full h-12 text-base font-medium shadow-none bg-background rounded-md border-border">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent position="popper">
              {navItems.map((item) => (
                <SelectItem 
                    key={item.value} 
                    value={item.value} 
                    disabled={isRestrictedMode && item.restricted}
                    className="py-3"
                >
                  <div className="flex items-center gap-2">
                    {isRestrictedMode && item.restricted ? (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                    )}
                    {item.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden md:block">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50 rounded-lg">
            {navItems.map((item) => (
                <TabsTrigger 
                    key={item.value} 
                    value={item.value}
                    disabled={isRestrictedMode && item.restricted}
                    className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm group"
                >
                    <div className="flex items-center gap-2">
                        {isRestrictedMode && item.restricted ? (
                             <Lock className="h-3.5 w-3.5 opacity-50" />
                        ) : (
                             <item.icon className="h-4 w-4 mr-2" />
                        )}
                        {item.label}
                    </div>
                </TabsTrigger>
            ))}
            </TabsList>
        </div>

        <div className="mt-2 min-h-[400px]">
          <TabsContent value="essentials" className="outline-none focus-visible:ring-0 mt-0">
            <EventEssentialsTab event={eventData} />
          </TabsContent>

          <TabsContent value="program" className="outline-none focus-visible:ring-0 mt-0">
            <EventProgramTab event={eventData} />
          </TabsContent>

          <TabsContent value="attendees" className="outline-none focus-visible:ring-0 mt-0">
            <EventAttendeesTab eventSlug={eventSlug} />
          </TabsContent>

          <TabsContent value="settings" className="outline-none focus-visible:ring-0 mt-0">
            <EventSettingsTab event={eventData} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}