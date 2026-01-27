"use client";

import React, { useState, useEffect } from "react";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { 
  Plus, Trash2, MapPin, Link as LinkIcon, AlertCircle, 
  ExternalLink, Search, Check, ChevronsUpDown, Loader2, BookOpen 
} from "lucide-react";
import { 
  FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import api from "@/lib/api/axios";
import { EventFormData } from "./EventFormSchema";

interface CourseResult {
  id: number;
  title: string;
  thumbnail: string | null;
}

interface StepBasicInfoProps {
    formOptions: any;
    activeSlug: string | null;
    onExitToCreateCourse: () => void;
}

export function StepBasicInfo({ formOptions, activeSlug, onExitToCreateCourse }: StepBasicInfoProps) {
  const { control, setValue } = useFormContext<EventFormData>();
  
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CourseResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState("");
  const [hasNoCoursesEver, setHasNoCoursesEver] = useState(false);

  const selectedCourseId = useWatch({ control, name: "course" });

  useEffect(() => {
    const fetchCourses = async () => {
      setIsSearching(true);
      try {
        let url = `/courses/search-selector/?q=${searchQuery}`;
        if (activeSlug) url += `&org_slug=${activeSlug}`;
        
        const { data } = await api.get(url);
        setSearchResults(data);
        
        if (searchQuery === "" && data.length === 0) {
            setHasNoCoursesEver(true);
        } else {
            setHasNoCoursesEver(false);
        }

        if (selectedCourseId && !selectedCourseTitle) {
            const current = data.find((c: any) => c.id === Number(selectedCourseId));
            if (current) setSelectedCourseTitle(current.title);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchCourses, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeSlug, open, selectedCourseId, selectedCourseTitle]);

  return (
    <div className="space-y-6">
      <Card className="rounded-md border shadow-none">
        <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Basic details about your event.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <FormField control={control} name="title" render={({ field }) => (
                <FormItem className="w-full">
                <FormLabel>Event Title <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input className="rounded-md shadow-none w-full" placeholder="e.g., Annual Tech Summit" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />

            <FormField control={control} name="course" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Related Course <span className="text-destructive">*</span></FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    disabled={hasNoCoursesEver}
                                    className={cn(
                                        "w-full justify-between rounded-md shadow-none font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {selectedCourseTitle || field.value ? (
                                        <div className="flex items-center gap-2 truncate text-foreground">
                                            <BookOpen className="h-4 w-4 text-primary" />
                                            {selectedCourseTitle || "Course Selected"}
                                        </div>
                                    ) : (
                                        hasNoCoursesEver ? "No courses available" : "Search and select course..."
                                    )}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-md border-border" align="start">
                            <Command shouldFilter={false}>
                                <CommandInput 
                                    placeholder="Type course name..." 
                                    onValueChange={setSearchQuery}
                                />
                                <CommandList>
                                    {isSearching && (
                                        <div className="flex items-center justify-center py-6">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        </div>
                                    )}
                                    {!isSearching && searchResults.length === 0 && (
                                        <CommandEmpty>No courses found.</CommandEmpty>
                                    )}
                                    <CommandGroup>
                                        {searchResults.map((course) => (
                                            <CommandItem
                                                key={course.id}
                                                value={String(course.id)}
                                                onSelect={() => {
                                                    setValue("course", course.id);
                                                    setSelectedCourseTitle(course.title);
                                                    setOpen(false);
                                                }}
                                                className="rounded-sm cursor-pointer"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4 text-primary",
                                                        course.id === Number(field.value) ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {course.title}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {hasNoCoursesEver && (
                        <Alert variant="destructive" className="mt-2 bg-destructive/5 border-destructive/20 text-destructive rounded-md shadow-none">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="mb-1 text-sm">Action Required</AlertTitle>
                            <AlertDescription className="flex flex-col gap-2">
                                <span className="text-xs opacity-90">Events must be linked to a <strong>Published</strong> course. You currently have no published courses.</span>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={onExitToCreateCourse}
                                    className="w-fit border-destructive/30 hover:bg-destructive/10 text-destructive h-8 text-xs rounded-md shadow-none"
                                >
                                    Create New Course <ExternalLink className="ml-2 h-3 w-3" />
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}
                    <FormMessage />
                </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <FormField control={control} name="event_type" render={({ field }) => (
                <FormItem className="w-full">
                    <FormLabel>Event Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                        <SelectTrigger className="rounded-md shadow-none w-full text-left">
                            <div className="truncate w-full text-left">
                                <SelectValue placeholder="Select Type" />
                            </div>
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-md shadow-none">
                        {formOptions?.form_options?.event_types?.map((o: any) => (
                        <SelectItem key={o.value} value={o.value} className="rounded-md">{o.label}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )} />

                <FormField control={control} name="who_can_join" render={({ field }) => (
                <FormItem className="w-full">
                    <FormLabel>Audience</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                        <SelectTrigger className="rounded-md shadow-none w-full text-left">
                            <div className="truncate w-full text-left">
                                <SelectValue placeholder="Select Audience" />
                            </div>
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-md shadow-none">
                        {formOptions?.form_options?.who_can_join?.map((o: any) => (
                        <SelectItem key={o.value} value={o.value} className="rounded-md">{o.label}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )} />
            </div>

            <FormField control={control} name="overview" render={({ field }) => (
                <FormItem className="w-full">
                <FormLabel>Short Overview</FormLabel>
                <FormControl><Textarea className="rounded-md shadow-none w-full" maxLength={250} placeholder="Brief summary (max 250 chars)" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />

            <FormField control={control} name="description" render={({ field }) => (
                <FormItem className="w-full">
                <FormLabel>Full Description</FormLabel>
                <FormControl><Textarea className="rounded-md shadow-none w-full" rows={6} placeholder="Detailed agenda, expectations..." {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
        </CardContent>
      </Card>
    </div>
  );
}

export function StepEventDetails() {
  const { control } = useFormContext<EventFormData>();
  const { fields: objs, append: appendObj, remove: removeObj } = useFieldArray({ control, name: "learning_objectives" });
  const { fields: agenda, append: appendAgenda, remove: removeAgenda } = useFieldArray({ control, name: "agenda" });

  return (
    <div className="space-y-6">
      <Card className="rounded-md border shadow-none">
        <CardHeader>
            <CardTitle>Learning Objectives</CardTitle>
            <CardDescription>What will attendees gain from this event?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {objs.map((field, index) => (
            <div key={field.id} className="flex gap-2 w-full">
                <FormField control={control} name={`learning_objectives.${index}.text`} render={({ field }) => (
                    <FormItem className="flex-1 w-full"><FormControl><Input className="rounded-md shadow-none w-full" placeholder="Objective..." {...field} /></FormControl></FormItem>
                )} />
                <Button type="button" variant="ghost" size="icon" className="rounded-md shadow-none" onClick={() => removeObj(index)}><Trash2 size={16} className="text-destructive"/></Button>
            </div>
            ))}
            <Button type="button" size="sm" variant="outline" className="rounded-md shadow-none" onClick={() => appendObj({ text: "" })}><Plus size={14} className="mr-2"/> Add Objective</Button>
        </CardContent>
      </Card>

      <Card className="rounded-md border shadow-none">
        <CardHeader>
            <CardTitle>Agenda & Schedule</CardTitle>
            <CardDescription>Outline the timeline of the event.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {agenda.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-md bg-muted/20 space-y-3 relative shadow-none">
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 rounded-md shadow-none" onClick={() => removeAgenda(index)}><Trash2 size={16} className="text-destructive"/></Button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                    <FormField control={control} name={`agenda.${index}.time`} render={({ field }) => (
                        <FormItem className="col-span-1 w-full"><FormLabel className="text-xs">Time</FormLabel><FormControl><Input className="rounded-md shadow-none w-full" placeholder="10:00 AM" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={control} name={`agenda.${index}.title`} render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2 w-full"><FormLabel className="text-xs">Title</FormLabel><FormControl><Input className="rounded-md shadow-none w-full" placeholder="Opening Keynote" {...field} /></FormControl></FormItem>
                    )} />
                </div>
                <FormField control={control} name={`agenda.${index}.description`} render={({ field }) => (
                    <FormItem className="w-full"><FormControl><Textarea className="rounded-md shadow-none w-full h-16 resize-none" placeholder="Details (optional)..." {...field} /></FormControl></FormItem>
                )} />
            </div>
            ))}
            <Button type="button" size="sm" variant="outline" className="rounded-md shadow-none" onClick={() => appendAgenda({ time: "", title: "", description: "" })}><Plus size={14} className="mr-2"/> Add Agenda Item</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function StepSchedule() {
  const { control, watch } = useFormContext<EventFormData>();
  const eventType = watch("event_type");

  const showLocation = eventType === 'physical' || eventType === 'hybrid';
  const showLink = eventType === 'online' || eventType === 'hybrid';

  return (
    <div className="space-y-6">
      <Card className="rounded-md border shadow-none">
        <CardHeader>
            <CardTitle>Date & Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <FormField control={control} name="start_time" render={({ field }) => (
                <FormItem className="w-full">
                    <FormLabel>Start Time</FormLabel>
                    <FormControl><Input type="datetime-local" className="rounded-md shadow-none w-full" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField control={control} name="end_time" render={({ field }) => (
                <FormItem className="w-full">
                    <FormLabel>End Time</FormLabel>
                    <FormControl><Input type="datetime-local" className="rounded-md shadow-none w-full" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
            </div>

            <FormField control={control} name="timezone" render={({ field }) => (
                <FormItem className="w-full">
                <FormLabel>Timezone</FormLabel>
                <FormControl><Input className="rounded-md shadow-none w-full" placeholder="e.g., Africa/Nairobi" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )} />
        </CardContent>
      </Card>

      {(showLocation || showLink) && (
        <Card className="rounded-md border shadow-none">
            <CardHeader>
                <CardTitle>Venue & Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {(!eventType) && <p className="text-sm text-muted-foreground flex items-center gap-2"><AlertCircle size={16}/> Select an Event Type in Step 1 to see options.</p>}
                
                {showLocation && (
                    <FormField control={control} name="location" render={({ field }) => (
                    <FormItem className="w-full">
                        <FormLabel className="flex items-center gap-2"><MapPin size={16} /> Physical Location</FormLabel>
                        <FormControl><Input className="rounded-md shadow-none w-full" placeholder="e.g., KICC, Nairobi, Room 4B" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />
                )}

                {showLink && (
                    <FormField control={control} name="meeting_link" render={({ field }) => (
                    <FormItem className="w-full">
                        <FormLabel className="flex items-center gap-2"><LinkIcon size={16} /> External Meeting Link (Optional)</FormLabel>
                        <FormControl><Input className="rounded-md shadow-none w-full" placeholder="https://zoom.us/..." {...field} /></FormControl>
                        <FormDescription>Leave empty to use the platform's native streaming.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )} />
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}

export function StepRegistration({ formOptions }: { formOptions: any }) {
    const { control, watch } = useFormContext<EventFormData>();
    const isPaid = watch("is_paid");
    const bannerImage = watch("banner_image");
  
    return (
      <div className="space-y-6">
        <Card className="rounded-md border shadow-none">
            <CardHeader>
                <CardTitle>Registration Logic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <FormField control={control} name="max_attendees" render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Max Attendees</FormLabel>
                            <FormControl><Input type="number" min={1} className="rounded-md shadow-none w-full" {...field} onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={control} name="registration_deadline" render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Registration Deadline</FormLabel>
                            <FormControl><Input type="datetime-local" className="rounded-md shadow-none w-full" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-md bg-muted/20 shadow-none">
                    <div className="space-y-0.5">
                        <FormLabel>Registration Open</FormLabel>
                        <FormDescription>Allow users to register immediately.</FormDescription>
                    </div>
                    <FormField control={control} name="registration_open" render={({ field }) => (
                        <FormControl><Switch className="rounded-md" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    )} />
                </div>
            </CardContent>
        </Card>

        <Card className="rounded-md border shadow-none">
            <CardHeader>
                <CardTitle>Pricing & Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <FormLabel>Paid Event</FormLabel>
                            <FormDescription>Does this event require a ticket purchase?</FormDescription>
                        </div>
                        <FormField control={control} name="is_paid" render={({ field }) => (
                            <FormControl><Switch className="rounded-md" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        )} />
                    </div>

                    {isPaid && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 pt-4 border-t w-full">
                            <FormField control={control} name="price" render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Price</FormLabel>
                                    <FormControl><Input type="number" min={0} className="rounded-md shadow-none w-full" {...field} onChange={e => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={control} name="currency" render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Currency</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="rounded-md shadow-none w-full text-left">
                                                <div className="truncate w-full text-left">
                                                    <SelectValue />
                                                </div>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-md shadow-none">
                                            <SelectItem value="KES" className="rounded-md">KES</SelectItem>
                                            <SelectItem value="USD" className="rounded-md">USD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    )}
                </div>

                <FormField control={control} name="banner_image" render={({ field }) => (
                    <FormItem className="w-full">
                        <FormLabel>Banner Image</FormLabel>
                        <FormControl>
                            <Input type="file" accept="image/*" className="rounded-md shadow-none w-full cursor-pointer" onChange={(e) => field.onChange(e.target.files?.[0] || null)} />
                        </FormControl>
                        {bannerImage && (
                            <div className="mt-4 relative w-full h-48 bg-muted rounded-md overflow-hidden border shadow-none">
                                <img src={typeof bannerImage === 'string' ? bannerImage : URL.createObjectURL(bannerImage)} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <FormDescription>Recommended 1200x600px.</FormDescription>
                    </FormItem>
                )} />
            </CardContent>
        </Card>
      </div>
    );
}