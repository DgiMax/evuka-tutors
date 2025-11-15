"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Control } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api/axios";
import { Loader2, Save, Clock, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// --- Schema (Unchanged) ---
const recurrenceDaySchema = z.object({
  enabled: z.boolean().default(false),
  time: z.string().default("09:00"),
});

const liveClassFormSchema = z
  .object({
    title: z.string().min(5, "Title must be at least 5 characters.").max(100),
    start_date: z.string().min(1, "Start date is required."),
    end_date: z.string().optional(),
    lesson_duration: z.coerce
      .number()
      .min(15, "Duration must be at least 15 minutes.")
      .max(240),
    recurrence_type: z.enum(["none", "weekly"]).default("none"),

    single_lesson_time: z.string().optional(),

    recurrence_days: z
      .object({
        Monday: recurrenceDaySchema,
        Tuesday: recurrenceDaySchema,
        Wednesday: recurrenceDaySchema,
        Thursday: recurrenceDaySchema,
        Friday: recurrenceDaySchema,
        Saturday: recurrenceDaySchema,
        Sunday: recurrenceDaySchema,
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.recurrence_type === "weekly" ||
      (data.recurrence_type === "none" && data.single_lesson_time),
    {
      message: "Time is required for a one-time class.",
      path: ["single_lesson_time"],
    }
  );

type LiveClassFormValues = z.infer<typeof liveClassFormSchema>;

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface WeekdayRecurrenceProps {
  control: Control<LiveClassFormValues>;
}

// --- Weekday Selector (Styles Updated) ---
const WeekdayRecurrenceSelector: React.FC<WeekdayRecurrenceProps> = ({
  control,
}) => {
  return (
    // UPDATED: Uses theme muted bg and border
    <div className="space-y-4 p-4 border rounded-md bg-muted">
      <FormLabel>Set Weekly Schedule</FormLabel>
      <FormDescription>
        Select the days and times this class will repeat.
      </FormDescription>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {weekdays.slice(1).map((day) => ( // start from Monday
          <div key={day} className="flex flex-row items-center gap-3">
            <FormField
              control={control}
              name={`recurrence_days.${day}.enabled` as any}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal w-24 pt-1">{day}</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`recurrence_days.${day}.time` as any}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <ShadcnInput type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Page Component (Styles Updated) ---
export default function LiveClassCreatePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const params = useParams();
  const router = useRouter();
  const courseSlug = params.slug as string;

  useEffect(() => {
    if (!courseSlug) return;
    const fetchCourseId = async () => {
      try {
        const response = await api.get(`/tutor-courses/${courseSlug}/`);
        setCourseId(response.data.id);
        setCourseTitle(response.data.title);
      } catch (error) {
        console.error("Failed to fetch course details:", error);
        toast.error("Could not load course data. Please go back and try again.");
      }
    };
    fetchCourseId();
  }, [courseSlug]);

  // --- Form & Logic (Unchanged) ---
  const form = useForm<LiveClassFormValues>({
    resolver: zodResolver(liveClassFormSchema) as any,
    defaultValues: {
      title: "",
      start_date: "",
      end_date: "",
      lesson_duration: 60,
      recurrence_type: "none",
      single_lesson_time: "09:00",
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
  const watchedStartDate = form.watch("start_date");

  const handleFormSubmit = async (data: LiveClassFormValues) => {
    if (!courseId) {
      toast.error("Course ID is missing. Cannot create class.");
      return;
    }

    setIsLoading(true);

    let recurrenceDaysPayload: Record<string, string> = {};
    let end_date_payload = {};

    if (data.recurrence_type === "weekly" && data.recurrence_days) {
      const recurrenceDaysData = data.recurrence_days;

      recurrenceDaysPayload = weekdays.reduce((acc, day) => {
        const dayKey = day as keyof typeof recurrenceDaysData;

        if (
          recurrenceDaysData[dayKey].enabled &&
          recurrenceDaysData[dayKey].time
        ) {
          acc[dayKey] = recurrenceDaysData[dayKey].time;
        }
        return acc;
      }, {} as Record<string, string>);

      if (Object.keys(recurrenceDaysPayload).length === 0) {
        toast.error(
          "Please select at least one day and time for your weekly schedule."
        );
        setIsLoading(false);
        return;
      }

      if (data.end_date) {
        end_date_payload = { end_date: data.end_date };
      }
    }
    // Logic for one-time class
    else if (
      data.recurrence_type === "none" &&
      data.start_date &&
      data.single_lesson_time
    ) {
      const date = new Date(data.start_date);
      const dayName = weekdays[date.getDay()];

      recurrenceDaysPayload = {
        [dayName]: data.single_lesson_time,
      };
      end_date_payload = {};
    }

    const payload = {
      title: data.title,
      start_date: data.start_date,
      lesson_duration: Number(data.lesson_duration),
      recurrence_type: data.recurrence_type,
      course: courseId,
      recurrence_days: recurrenceDaysPayload,
      ...end_date_payload,
    };

    try {
      const response = await api.post("/live/classes/", payload);
      toast.success(`Live class "${response.data.title}" created successfully!`);
      router.push(`/courses/${courseSlug}/live-classes`);
    } catch (error: any) {
      console.error("Failed to create live class:", error);
      toast.error(
        "Failed to create live class. Please check the form and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- Loading State (Styles Updated) ---
  if (!courseId) {
    return (
      <div className="flex justify-center items-center h-screen">
        {/* UPDATED: Uses theme primary color */}
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {/* UPDATED: Uses theme muted text */}
        <p className="ml-2 text-muted-foreground">Loading course data...</p>
      </div>
    );
  }

  // --- Render (Styles Updated) ---
  return (
    // ✅ CORRECTION: Added 'mx-4' for mobile and 'sm:mx-auto' for desktop
    <Card className="max-w-3xl mx-4 sm:mx-auto my-8 overflow-hidden p-0">
      {/* UPDATED: Added 'p-6' */}
      <CardHeader className="p-6">
        <Button
          variant="outline"
          size="sm"
          className="mb-4 w-fit"
          onClick={() => router.back()}
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Course
        </Button>
        <CardTitle className="text-xl">Create a New Live Class</CardTitle>
        <CardDescription>
          Adding a live class schedule for your course:{" "}
          {/* UPDATED: Uses theme text for emphasis */}
          <strong className="text-foreground">{courseTitle}</strong>
        </CardDescription>
      </CardHeader>

      {/* UPDATED: Added 'p-6' */}
      <CardContent className="pt-0 p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Title</FormLabel>
                  <FormControl>
                    <ShadcnInput
                      placeholder="e.g., Weekly Q&A Session"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be the main title for the class series.
                  </FormDescription>
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
                    <FormDescription>
                      When the first class will occur.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedRecurrenceType === "weekly" && (
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <ShadcnInput type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        When the class series will stop. (Default: 8 weeks)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
                  <FormDescription>
                    How long each individual lesson will be (e.g., 60).
                  </FormDescription>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select how often this class repeats..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        One-Time (No Recurrence)
                      </SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedRecurrenceType === "none" && (
              // UPDATED: Uses theme muted bg and border
              <div className="space-y-4 p-4 border rounded-md bg-muted">
                <FormLabel className="flex items-center gap-2">
                  <Clock size={16} /> Set Class Time
                </FormLabel>
                <FormDescription>
                  This single class will start on{" "}
                  {/* UPDATED: Uses theme text for emphasis */}
                  <strong className="text-foreground">
                    {watchedStartDate
                      ? new Date(watchedStartDate).toLocaleDateString(
                          undefined,
                          { weekday: "long" }
                        )
                      : "[Start Date]"}
                  </strong>{" "}
                  at the time specified below.
                </FormDescription>
                <FormField
                  control={form.control}
                  name="single_lesson_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ShadcnInput
                          type="time"
                          className="max-w-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {watchedRecurrenceType === "weekly" && (
              <WeekdayRecurrenceSelector control={form.control} />
            )}

            {/* UPDATED: Uses theme border */}
            <div className="flex justify-end pt-6 border-t">
              {/* UPDATED: Button is now primary (purple) by default */}
              <Button type="submit" disabled={isLoading}>
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