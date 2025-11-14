"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Control } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api/axios";
import { Loader2, Plus, Save, Clock, Calendar, ArrowLeft } from "lucide-react";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const recurrenceDaySchema = z.object({
  enabled: z.boolean().default(false),
  time: z.string().default("09:00"),
});

// --- ZOD SCHEMA ---
const liveClassFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100),
  start_date: z.string().min(1, "Start date is required."), // We use string for <input type="date">
  end_date: z.string().optional(),
  lesson_duration: z.coerce.number().min(15, "Duration must be at least 15 minutes.").max(240),
  recurrence_type: z.enum(["none", "weekly"]).default("none"),
  
  recurrence_days: z.object({
    Monday: recurrenceDaySchema,
    Tuesday: recurrenceDaySchema,
    Wednesday: recurrenceDaySchema,
    Thursday: recurrenceDaySchema,
    Friday: recurrenceDaySchema,
    Saturday: recurrenceDaySchema,
    Sunday: recurrenceDaySchema,
  }).optional(),
});

type LiveClassFormValues = z.infer<typeof liveClassFormSchema>;

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// --- Sub-component for Weekly Recurrence ---
interface WeekdayRecurrenceProps {
  control: Control<any>; // Using 'any' for simplicity with dynamic fields
}

const WeekdayRecurrenceSelector: React.FC<WeekdayRecurrenceProps> = ({ control }) => {
  return (
    <div className="space-y-4 p-4 border rounded-md bg-gray-50">
      <FormLabel>Set Weekly Schedule</FormLabel>
      <FormDescription>Select the days and times this class will repeat.</FormDescription>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {weekdays.map((day) => (
          <div key={day} className="flex flex-row items-center gap-3">
            <FormField
              control={control}
              name={`recurrence_days.${day}.enabled`}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal w-24 pt-1">{day}</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`recurrence_days.${day}.time`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <ShadcnInput type="time" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function LiveClassCreatePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const params = useParams();
  const router = useRouter();
  const courseSlug = params.slug as string;

  // 1. Fetch Course ID from Slug
  useEffect(() => {
    if (!courseSlug) return;
    const fetchCourseId = async () => {
      try {
        const response = await api.get(`/tutor-courses/${courseSlug}/`);
        setCourseId(response.data.id); // Assuming your API returns 'id'
        setCourseTitle(response.data.title);
      } catch (error) {
        console.error("Failed to fetch course details:", error);
        toast.error("Could not load course data. Please go back and try again.");
      }
    };
    fetchCourseId();
  }, [courseSlug]);

  // 2. Form Setup
  const form = useForm<LiveClassFormValues>({
    resolver: zodResolver(liveClassFormSchema) as any,
    defaultValues: {
      title: "",
      start_date: "",
      end_date: "",
      lesson_duration: 60,
      recurrence_type: "none",

      recurrence_days: {
        Monday: { enabled: false, time: "09:00" },
        Tuesday: { enabled: false, time: "09:00" },
        Wednesday: { enabled: false, time: "09:00" },
        Thursday: { enabled: false, time: "09:00" },
        Friday: { enabled: false, time: "09:00" },
        Saturday: { enabled: false, time: "09:00" },
        Sunday: { enabled: false, time: "09:00" },
      },
    },
  });


  const watchedRecurrenceType = form.watch("recurrence_type");

  // 3. Form Submission
  // 3. Form Submission
  const handleFormSubmit = async (data: LiveClassFormValues) => {
    if (!courseId) {
      toast.error("Course ID is missing. Cannot create class.");
      return;
    }
    
    setIsLoading(true);

    // --- ✅ START: Updated Payload Construction ---
    let recurrenceDaysPayload = {};
    
    // 'data.recurrence_days' is now fully typed and available
    if (data.recurrence_type === "weekly" && data.recurrence_days) {
      const recurrenceDaysData = data.recurrence_days;

      // Use the 'weekdays' array to build the payload
      recurrenceDaysPayload = weekdays.reduce((acc, day) => {
        const dayKey = day as keyof typeof recurrenceDaysData; // Cast 'day' to a valid key
        
        if (recurrenceDaysData[dayKey].enabled && recurrenceDaysData[dayKey].time) {
          acc[dayKey] = recurrenceDaysData[dayKey].time;
        }
        return acc;
      }, {} as Record<string, string>);

      if (Object.keys(recurrenceDaysPayload).length === 0) {
        toast.error("Please select at least one day and time for your weekly schedule.");
        setIsLoading(false);
        return;
      }
    }

    const payload = {
      title: data.title,
      start_date: data.start_date,
      end_date: data.end_date,
      lesson_duration: Number(data.lesson_duration),
      recurrence_type: data.recurrence_type,
      course: courseId, // Link to the course
      recurrence_days: recurrenceDaysPayload, // Add the generated payload
    };
    // --- ✅ END: Updated Payload Construction ---
    
    if (!payload.end_date) {
      delete payload.end_date;
    }

    try {
      const response = await api.post("/live/classes/", payload);
      toast.success(`Live class "${response.data.title}" created successfully!`);
      router.push(`/courses/${courseSlug}/live-classes`);
    
    } catch (error: any) {
      console.error("Failed to create live class:", error);
      toast.error("Failed to create live class. Please check the form and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!courseId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-500">Loading course data...</p>
      </div>
    );
  }

  // --- Render ---
  return (
    <Card className="max-w-3xl mx-auto my-8 border border-gray-200 rounded text-black shadow-none">
      <CardHeader>
        <Button variant="outline" size="sm" className="mb-4 w-fit rounded" onClick={() => router.back()}>
          <ArrowLeft size={16} className="mr-2" /> Back to Course
        </Button>
        <CardTitle className="text-xl">Create a New Live Class</CardTitle>
        <CardDescription>
          Adding a live class schedule for your course: <strong>{courseTitle}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Title</FormLabel>
                  <FormControl>
                    <ShadcnInput placeholder="e.g., Weekly Q&A Session" {...field} />
                  </FormControl>
                  <FormDescription>This will be the main title for the class series.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <ShadcnInput type="date" {...field} />
                    </FormControl>
                    <FormDescription>When the first class will occur.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <ShadcnInput type="date" {...field} />
                    </FormControl>
                    <FormDescription>When the class series will stop. (Default: 8 weeks)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="lesson_duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Duration (in minutes)</FormLabel>
                  <FormControl>
                    <ShadcnInput type="number" min="15" step="15" {...field} />
                  </FormControl>
                  <FormDescription>How long each individual lesson will be (e.g., 60).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recurrence_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurrence Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded">
                        <SelectValue placeholder="Select how often this class repeats..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">One-Time (No Recurrence)</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional Recurrence Form */}
            {watchedRecurrenceType === "weekly" && (
              <WeekdayRecurrenceSelector control={form.control} />
            )}

            <div className="flex justify-end pt-6 border-t">
              <Button type="submit" disabled={isLoading} className="rounded bg-green-600 hover:bg-green-700">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "Saving..." : "Create Live Class"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}