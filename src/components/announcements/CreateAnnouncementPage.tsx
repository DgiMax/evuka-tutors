// app/(tutor)/announcements/create/page.tsx OR
// app/(tutor)/announcements/[id]/edit/page.tsx (when using this component)

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  Save,
  Send,
  Loader2,
  Users,
  Megaphone,
  Calendar,
} from "lucide-react";

// Context and API
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UiCalendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useRouter } from "next/navigation"; // Import useRouter

// --- TYPE DEFINITIONS ---

// ✅ NEW: Props to handle create/edit mode
interface CreateAnnouncementPageProps {
  isEditMode?: boolean;
  announcementId?: string;
}

interface TargetCourse {
  id: string;
  title: string;
}

type AnnouncementStatus = "draft" | "pending_approval" | "scheduled" | "published";

const statusOptions: Record<AnnouncementStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  scheduled: "Scheduled",
  published: "Published",
};

// ZOD SCHEMA
const announcementFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100),
  content: z.string().min(20, "Content is too short. Please provide more detail."),
  audience_type: z.string().min(1, "Please select an audience."),
  courses: z.array(z.string()).optional(), // Array of course IDs
  status: z.enum(["draft", "pending_approval", "scheduled", "published"]).default("draft"),
  publish_at: z.date().optional(),
})
.refine(data => {
    if (data.status === 'scheduled' && !data.publish_at) {
        return false;
    }
    return true;
}, {
    message: "A 'Publish Date' is required when status is 'Scheduled'.",
    path: ["publish_at"],
})
.refine(data => {
    if (data.audience_type === 'specific_courses' && (!data.courses || data.courses.length === 0)) {
        return false;
    }
    return true;
}, {
    message: "You must select at least one course for this audience type.",
    path: ["courses"],
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

// ✅ NEW: Component accepts props
export default function CreateAnnouncementPage({ 
  isEditMode = false, 
  announcementId 
}: CreateAnnouncementPageProps) {

  const [isLoading, setIsLoading] = useState(false);
  const [targetableCourses, setTargetableCourses] = useState<TargetCourse[]>([]);
  const [isFetchingCourses, setIsFetchingCourses] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(false); // ✅ NEW: Loader for edit mode

  const { user } = useAuth();
  const { activeSlug } = useActiveOrg();
  const router = useRouter(); // ✅ NEW: For redirecting after create

  const isOrgAdminOrOwner = useMemo(() => {
    if (!user || !activeSlug || !user.organizations) return false;
    const activeOrgMembership = user.organizations.find(
      (org) => org.organization_slug === activeSlug
    );
    if (activeOrgMembership && activeOrgMembership.role) {
      const role = activeOrgMembership.role.toLowerCase();
      return role === "admin" || role === "owner";
    }
    return false;
  }, [user, activeSlug]);

  // Fetch targetable courses (runs for both modes)
  useEffect(() => {
    const fetchCourses = async () => {
      setIsFetchingCourses(true);
      try {
        const response = await api.get("/announcements/tutor/target-courses/");

        const courses = response.data.map((course: any) => ({
          id: course.id.toString(), 
          title: course.title,
        }));
        setTargetableCourses(courses);
      } catch (error) {
        console.error("Failed to fetch targetable courses:", error);
        toast.error("Could not load your courses list.");
      } finally {
        setIsFetchingCourses(false);
      }
    };

    fetchCourses();
  }, [activeSlug]);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema) as any,
    defaultValues: {
      title: "",
      content: "",
      audience_type: "",
      courses: [],
      status: "draft",
      publish_at: undefined,
    },
    mode: "onBlur",
  });

  // ✅ NEW: Get stable 'reset' function
  const { reset } = form;

  // ✅ NEW: useEffect to fetch data in EDIT mode
  useEffect(() => {
    const fetchAnnouncementData = async () => {
      if (isEditMode && announcementId && !isFetchingCourses) {
        setIsFetchingData(true);
        try {
          const response = await api.get(`/announcements/tutor/manage/${announcementId}/`);
          const data = response.data;

          // Populate the form with fetched data
          reset({
            title: data.title || "",
            content: data.content || "",
            audience_type: data.audience_type || "",
            // Ensure courses is an array of strings
            courses: data.courses?.map(String) || [], 
            status: data.status || "draft",
            // Convert ISO date string back to Date object for the calendar
            publish_at: data.publish_at ? new Date(data.publish_at) : undefined,
          });

        } catch (error) {
          console.error("Failed to fetch announcement for editing:", error);
          toast.error("Could not load announcement data.");
        } finally {
          setIsFetchingData(false);
        }
      }
    };

    fetchAnnouncementData();
    // Dependency array: run when mode flags are set AND course list is ready
  }, [isEditMode, announcementId, isFetchingCourses, reset]);


  const watchedAudienceType = form.watch("audience_type");
  const watchedStatus = form.watch("status");

  // Determine available audience types
  const availableAudienceTypes = useMemo(() => {
    if (activeSlug) {
      if (isOrgAdminOrOwner) {
        return [
          { id: "all_org_courses", name: "All Students in this Organization" },
          { id: "my_org_courses", name: "Students in My Courses (in this Org)" },
          { id: "specific_courses", name: "Students in Specific Courses" },
        ];
      } else {
        return [
          { id: "my_org_courses", name: "Students in My Courses (in this Org)" },
          { id: "specific_courses", name: "Students in Specific Courses" },
        ];
      }
    } else {
      return [
        { id: "all_personal_courses", name: "All Students in My Courses" },
        { id: "specific_courses", name: "Students in Specific Courses" },
      ];
    }
  }, [activeSlug, isOrgAdminOrOwner]);

  // Determine available status options
  const availableStatusOptions = useMemo(() => {
    // In edit mode, if the status is 'published', allow it to be selected
    // even if the user is only a tutor (they can't set it TO published, but they can edit it)
    const currentStatus = form.getValues("status");

    if (activeSlug) {
      const options = isOrgAdminOrOwner
        ? ["draft", "pending_approval", "scheduled", "published"]
        : ["draft", "pending_approval"];
      
      if (isEditMode && currentStatus === 'published' && !options.includes('published')) {
          options.push('published');
      }
      return options;
    }
    
    return ["draft", "scheduled", "published"]; // Personal user
  }, [activeSlug, isOrgAdminOrOwner, isEditMode, form]);

  // Reset audience type if context changes (but not in edit mode on load)
  useEffect(() => {
    if (!isEditMode) {
      form.resetField("audience_type");
      form.resetField("courses");
    }
  }, [activeSlug, form, isEditMode]);

  const onSaveDraft = async () => {
    const data = form.getValues();
    // Cannot save a published post as a draft
    if (data.status === 'published') {
        toast.error("Cannot save a 'Published' announcement as a 'Draft'.");
        return;
    }
    await handleFormSubmit({ ...data, status: "draft" }, false);
  };

  const processForm: SubmitHandler<AnnouncementFormValues> = async (data: AnnouncementFormValues) => {
    await handleFormSubmit(data, true);
    };

  // ✅ UPDATED: handlesubmit for both create (POST) and edit (PUT)
  const handleFormSubmit = async (data: AnnouncementFormValues, validate: boolean) => {
    setIsLoading(true);

    if (validate) {
        const isValid = await form.trigger();
        if (!isValid) {
            toast.error("Please correct the errors in the form.");
            setIsLoading(false);
            return;
        }
    }

    const payload = {
      ...data,
      courses: data.audience_type === 'specific_courses' ? data.courses : [],
      publish_at: data.publish_at ? data.publish_at.toISOString() : null,
    };

    // ✅ NEW: Determine URL and Method
    const url = isEditMode 
      ? `/announcements/tutor/manage/${announcementId}/` 
      : "/announcements/tutor/manage/";
    const method = isEditMode ? "PUT" : "POST";

    try {
      const response = await api({ method, url, data: payload });

      if (isEditMode) {
        // --- EDIT SUCCESS ---
        toast.success(
          <div className="flex flex-col gap-1">
            <p>✅ Announcement Updated!</p>
            <p className="text-sm text-gray-600">
              Changes to "{response.data.title}" have been saved.
            </p>
          </div>,
          { duration: 6000 }
        );
        // In edit mode, we stay on the page with the populated form
        // We can re-set to ensure data is fresh (e.g., if backend changed something)
        reset({
            ...data,
            publish_at: data.publish_at ? new Date(data.publish_at) : undefined,
        });

      } else {
        // --- CREATE SUCCESS ---
        toast.success(
          <div className="flex flex-col gap-1">
            <p>🎉 Announcement Created!</p>
            <p className="text-sm text-gray-600">
                "{response.data.title}" is now set to: {statusOptions[response.data.status as AnnouncementStatus]}
            </p>

          </div>,
          { duration: 6000 }
        );
        
        // After creating, reset form and redirect to list page
        form.reset({
          title: "",
          content: "",
          audience_type: "",
          courses: [],
          status: "draft",
          publish_at: undefined,
        });
        router.push("/announcements"); // Redirect to the list page
      }

    } catch (error: any) {
      console.error(`❌ Announcement ${isEditMode ? 'update' : 'creation'} failed:`, error);
      const errorData = error.response?.data;
      let message = "Something went wrong while saving.";

      if (errorData) {
        let mappedError = false;
        Object.keys(errorData).forEach((field) => {
          try {
            form.setError(field as any, {
              type: "server",
              message: Array.isArray(errorData[field])
                ? errorData[field].join(", ")
                : String(errorData[field]),
            });
            mappedError = true;
          } catch {}
        });
        if (mappedError) message = "Please correct the errors highlighted below.";
        else if (errorData.detail) message = errorData.detail;
      }
      toast.error(message, { duration: 6000 });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NEW: Show main loader if fetching data for editing
  if (isFetchingData) {
    return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="ml-2 text-gray-500">Loading announcement...</p>
        </div>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto my-8 border border-gray-200 rounded text-black shadow-none">
      <CardHeader>
        {/* ✅ NEW: Dynamic Title */}
        <CardTitle className="text-xl flex items-center gap-2">
          <Megaphone size={20} />
          {isEditMode ? "Edit Announcement" : "Create New Announcement"}
        </CardTitle>
        <CardDescription>
          Compose a message for your students. Context:{" "}
          <span className="font-semibold text-blue-600">
            {activeSlug ? "Organization" : "Personal"}
          </span>
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(processForm)} className="space-y-8">
          <CardContent className="space-y-6">
            {/* --- Step 1: Content --- */}
            <div className="space-y-4 p-4 border rounded bg-gray-50/50">
              <h3 className="font-medium text-gray-800">1. Message</h3>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <ShadcnInput placeholder="e.g., Welcome to the Course!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea rows={6} placeholder="Write your announcement here..." {...field} />
                    </FormControl>
                    <FormDescription>Markdown is supported.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* --- Step 2: Audience --- */}
            <div className="space-y-4 p-4 border rounded bg-gray-50/50">
              <h3 className="font-medium text-gray-800">2. Audience</h3>
              <FormField
                control={form.control}
                name="audience_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Send To</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isEditMode}>
                      <FormControl>
                        <SelectTrigger className="rounded" disabled={isEditMode}>
                          <SelectValue placeholder="Select an audience..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableAudienceTypes.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isEditMode && <FormDescription>Audience cannot be changed after creation.</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- DYNAMIC COURSE SELECTOR --- */}
              {watchedAudienceType === "specific_courses" && (
                <FormField
                  control={form.control}
                  name="courses"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Specific Courses</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={isEditMode} // ✅ Disable changing courses in edit mode
                              className={cn(
                                "w-full justify-between rounded",
                                !field.value?.length && "text-muted-foreground",
                                isEditMode && "bg-gray-200"
                              )}
                            >
                              {field.value?.length
                                ? `${field.value.length} course(s) selected`
                                : "Select courses..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Search courses..." />
                            <CommandEmpty>
                                {isFetchingCourses ? "Loading courses..." : "No courses found."}
                            </CommandEmpty>
                            <CommandGroup className="max-h-60 overflow-y-auto">
                              {targetableCourses.map((course) => (
                                <CommandItem
                                  value={course.title}
                                  key={course.id}
                                  onSelect={() => {
                                    const currentValues = field.value || [];
                                    const newValue = currentValues.includes(course.id)
                                      ? currentValues.filter((id) => id !== course.id)
                                      : [...currentValues, course.id];
                                    field.onChange(newValue);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value?.includes(course.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {course.title}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        {isEditMode 
                            ? "Courses cannot be changed after creation."
                            : "Select one or more courses to send this announcement to."
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            {/* --- Step 3: Publish --- */}
            <div className="space-y-4 p-4 border rounded bg-gray-50/50">
              <h3 className="font-medium text-gray-800">3. Status & Scheduling</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        // ✅ FIX 4: Corrected disabled logic
                        disabled={isEditMode && field.value === 'published'} 
                      >
                        <FormControl>
                          <SelectTrigger className="rounded" disabled={isEditMode && field.value === 'published'}>
                            <SelectValue placeholder="Select status..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableStatusOptions.map((statusKey) => (
                            <SelectItem key={statusKey} value={statusKey}>
                              {statusOptions[statusKey as AnnouncementStatus]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {(field.value as AnnouncementStatus) === 'published'
                            ? "A published announcement cannot be reverted to draft."
                            : (activeSlug && !isOrgAdminOrOwner &&
                                ((field.value as AnnouncementStatus) === "scheduled" ||
                                (field.value as AnnouncementStatus) === "published")
                                ? "This will be set to 'Pending Approval'."
                                : "Select the announcement status.")
                        }
                        </FormDescription>


                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="publish_at"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Publish Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal rounded",
                                    !field.value && "text-muted-foreground",
                                    ((watchedStatus as AnnouncementStatus) !== "scheduled" ||
                                    (watchedStatus as AnnouncementStatus) === "published") && "bg-gray-200"
                                )}
                                disabled={
                                    (watchedStatus as AnnouncementStatus) !== "scheduled" ||
                                    (watchedStatus as AnnouncementStatus) === "published"
                                }
                                >

                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <UiCalendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Only used if status is 'Scheduled'.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>

          {/* --- Footer --- */}
          <CardFooter className="flex justify-end gap-2 border-t pt-6">
            {/* ✅ Don't show 'Save Draft' if it's already published */}
            {watchedStatus !== 'published' && (
                <Button onClick={onSaveDraft} type="button" variant="secondary" disabled={isLoading} className="rounded">
                    <Save className="mr-2" size={16} /> 
                    {isLoading ? "Saving..." : (isEditMode ? "Save Changes as Draft" : "Save Draft")}
                </Button>
            )}
            <Button
              type="submit"
              // ✅ FIX 5: Corrected disabled logic (matches CreateCoursePage)
              disabled={isLoading}
              className="rounded bg-green-600 hover:bg-green-700 w-[180px]"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {/* ✅ FIX 6: Corrected text logic */}
              {getSubmitButtonText(watchedStatus, isEditMode)}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

// ✅ NEW: Added isEditMode to change button text
const getSubmitButtonText = (status: AnnouncementStatus, isEditMode: boolean) => {
    switch (status) {
      case "published":
        return isEditMode ? "Publish Changes" : "Publish Now";
      case "pending_approval":
        return isEditMode ? "Submit Changes" : "Submit for Review";
      case "scheduled":
        return isEditMode ? "Update Schedule" : "Schedule Post";
      case "draft":
      default:
        return isEditMode ? "Save Changes" : "Save as Draft";
    }
  };