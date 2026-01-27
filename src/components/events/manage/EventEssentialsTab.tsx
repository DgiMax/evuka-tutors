"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
    Save, Loader2, MapPin, Video, Calendar, 
    Image as ImageIcon, BookOpen, ChevronsUpDown, Check, Users 
} from "lucide-react";

import api from "@/lib/api/axios";
import { cn } from "@/lib/utils";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { EventManagementData, EssentialsSchema, EssentialsValues } from "./EventSharedTypes";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export default function EventEssentialsTab({ event }: { event: EventManagementData }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  const { activeSlug } = useActiveOrg();

  const [openCoursePicker, setOpenCoursePicker] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState("");
  const [courseResults, setCourseResults] = useState<any[]>([]);
  const [isSearchingCourses, setIsSearchingCourses] = useState(false);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState(event.course?.title || "");

  const form = useForm<EssentialsValues>({
    resolver: zodResolver(EssentialsSchema),
    defaultValues: {
      title: event.title,
      course: String(event.course?.id || ""),
      event_type: event.event_type,
      who_can_join: event.who_can_join,
      overview: event.overview,
      description: event.description,
      start_time: event.start_time?.slice(0, 16),
      end_time: event.end_time?.slice(0, 16),
      timezone: event.timezone,
      location: event.location || "",
      meeting_link: event.meeting_link || "",
      banner_image: event.banner_image || null,
    },
  });

  const eventType = form.watch("event_type");

  useEffect(() => {
    const fetchCourses = async () => {
      if (courseSearchQuery.length < 2 && !openCoursePicker) return;
      setIsSearchingCourses(true);
      try {
        let url = `/courses/search-selector/?q=${courseSearchQuery}`;
        if (activeSlug) url += `&org_slug=${activeSlug}`;
        const { data } = await api.get(url);
        setCourseResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingCourses(false);
      }
    };
    const timer = setTimeout(fetchCourses, 400);
    return () => clearTimeout(timer);
  }, [courseSearchQuery, activeSlug, openCoursePicker]);

  const { mutate } = useMutation({
    mutationFn: (data: FormData) => api.patch(`/events/tutor-events/${event.slug}/`, data),
    onSuccess: (res) => {
      toast.success("Event details updated.");
      queryClient.setQueryData(["eventManagement", event.slug], res.data);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed to update details."),
    onSettled: () => setIsUpdating(false),
  });

  const onSubmit = (data: EssentialsValues) => {
    setIsUpdating(true);
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === "banner_image") {
        if (value instanceof File) formData.append(key, value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    mutate(formData);
  };

  const bannerPreview = form.watch("banner_image");
  const labelClasses = "uppercase text-xs font-bold text-muted-foreground tracking-wider";
  const inputClasses = "rounded-md shadow-none w-full font-medium text-zinc-600";

  return (
    <div className="grid grid-cols-1 gap-6 pb-20">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <Card className="rounded-md border shadow-none">
            <CardHeader>
                <CardTitle>Core Configuration</CardTitle>
                <CardDescription>Primary associations and event format.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="course" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className={labelClasses}>Related Course</FormLabel>
                            <Popover open={openCoursePicker} onOpenChange={setOpenCoursePicker}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant="outline" role="combobox" className={cn("w-full justify-between rounded-md shadow-none font-medium", !field.value && "text-muted-foreground")}>
                                            <div className="flex items-center gap-2 truncate">
                                                <BookOpen className="h-4 w-4 text-primary" />
                                                {selectedCourseTitle || "Select course..."}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput placeholder="Search courses..." onValueChange={setCourseSearchQuery} />
                                        <CommandList>
                                            {isSearchingCourses && <div className="flex items-center justify-center py-6"><Loader2 className="h-4 w-4 animate-spin" /></div>}
                                            {!isSearchingCourses && courseResults.length === 0 && <CommandEmpty>No courses found.</CommandEmpty>}
                                            <CommandGroup>
                                                {courseResults.map((c) => (
                                                    <CommandItem key={c.id} value={String(c.id)} onSelect={() => {
                                                        form.setValue("course", String(c.id));
                                                        setSelectedCourseTitle(c.title);
                                                        setOpenCoursePicker(false);
                                                    }}>
                                                        <Check className={cn("mr-2 h-4 w-4 text-primary", String(c.id) === field.value ? "opacity-100" : "opacity-0")} />
                                                        {c.title}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="event_type" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelClasses}>Event Format</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className={inputClasses}>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="online">Online Only</SelectItem>
                                    <SelectItem value="physical">Physical Only</SelectItem>
                                    <SelectItem value="hybrid">Hybrid (Both)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="who_can_join" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelClasses}>Audience Restriction</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger className={inputClasses}>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Who can join?" />
                                    </div>
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="anyone">Open to Anyone</SelectItem>
                                <SelectItem value="course_students">Students enrolled in the linked course</SelectItem>
                                {activeSlug && <SelectItem value="org_students">All members of this organization</SelectItem>}
                            </SelectContent>
                        </Select>
                        <FormDescription>Determines who is allowed to see the registration button.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
            </CardContent>
          </Card>

          <Card className="rounded-md border shadow-none">
            <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Event title and descriptions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelClasses}>Event Title</FormLabel>
                        <FormControl><Input className={inputClasses} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="overview" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelClasses}>Short Overview</FormLabel>
                        <FormControl><Textarea className={inputClasses} rows={2} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelClasses}>Full Description</FormLabel>
                        <FormControl><Textarea className={inputClasses} rows={6} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </CardContent>
          </Card>

          <Card className="rounded-md border shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5"/> Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="start_time" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelClasses}>Start</FormLabel>
                            <FormControl><Input type="datetime-local" className={inputClasses} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="end_time" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelClasses}>End</FormLabel>
                            <FormControl><Input type="datetime-local" className={inputClasses} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="timezone" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelClasses}>Timezone</FormLabel>
                        <FormControl><Input className={inputClasses} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </CardContent>
          </Card>

          {(eventType !== "online") && (
            <Card className="rounded-md border shadow-none animate-in fade-in slide-in-from-top-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5"/> Physical Location</CardTitle>
                </CardHeader>
                <CardContent>
                    <FormField control={form.control} name="location" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelClasses}>Venue Address</FormLabel>
                            <FormControl><Input className={inputClasses} placeholder="e.g. KICC, Nairobi" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
            </Card>
          )}

          {(eventType !== "physical") && (
             <Card className="rounded-md border shadow-none animate-in fade-in slide-in-from-top-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5"/> Virtual Access</CardTitle>
                </CardHeader>
                <CardContent>
                    <FormField control={form.control} name="meeting_link" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelClasses}>Meeting Link (Zoom/Google Meet)</FormLabel>
                            <FormControl><Input className={inputClasses} placeholder="https://zoom.us/..." {...field} /></FormControl>
                            <FormDescription>If left empty, the platform will use built-in LiveKit rooms.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
            </Card>
          )}

          <Card className="rounded-md border shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5"/> Media</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField control={form.control} name="banner_image" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelClasses}>Banner Image</FormLabel>
                        <FormControl>
                            <Input type="file" accept="image/*" className={`${inputClasses} cursor-pointer file:text-primary`} onChange={e => field.onChange(e.target.files?.[0])} />
                        </FormControl>
                        {bannerPreview && (
                            <div className="mt-4 border rounded-md overflow-hidden h-48 bg-muted shadow-none">
                                <img src={typeof bannerPreview === 'string' ? bannerPreview : URL.createObjectURL(bannerPreview)} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <FormMessage />
                    </FormItem>
                )} />
            </CardContent>
          </Card>

          <div className="flex justify-end sticky bottom-6 z-10">
            <Button type="submit" disabled={isUpdating} size="lg" className="rounded-md shadow-lg min-w-[160px]">
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}