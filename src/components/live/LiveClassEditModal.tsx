"use client";

import React, { useState, useEffect } from "react";
import { useForm, Control }from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api/axios";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { LiveClass } from "./ManageLiveClassesPage"; // Reuse the type

// --- ZOD SCHEMA ---
// This is the same schema as your create page
const recurrenceDaySchema = z.object({
  enabled: z.boolean().default(false),
  time: z.string().default("09:00"),
});

const liveClassFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100),
  start_date: z.string().min(1, "Start date is required."),
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
  // For edit mode, we need the update mode
  recurrence_update_mode: z.enum(["none", "future", "all"]).default("none"),
});

type LiveClassFormValues = z.infer<typeof liveClassFormSchema>;

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// This is the same sub-component from your create page
interface WeekdayRecurrenceProps { control: Control<any>; }
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

interface LiveClassEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveClass: LiveClass | null;
  onSuccess: () => void;
}

export const LiveClassEditModal: React.FC<LiveClassEditModalProps> = ({ isOpen, onClose, liveClass, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

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
      recurrence_update_mode: "none",
    },
  });

  // Pre-fill the form when the modal opens
  useEffect(() => {
    if (liveClass) {
      // 1. Format recurrence_days from {Monday: "10:00"} to {Monday: {enabled: true, time: "10:00"}}
      const formattedRecurrenceDays = weekdays.reduce((acc, day) => {
        const time = liveClass.recurrence_days?.[day];
        if (time) {
          acc[day] = { enabled: true, time: time };
        } else {
          acc[day] = { enabled: false, time: "09:00" };
        }
        return acc;
      }, {} as any);
      
      form.reset({
        title: liveClass.title,
        start_date: liveClass.start_date,
        end_date: liveClass.end_date || "",
        lesson_duration: liveClass.lesson_duration,
        recurrence_type: liveClass.recurrence_type,
        recurrence_days: formattedRecurrenceDays,
        recurrence_update_mode: "none", // Default this to none
      });
    }
  }, [liveClass, form]);
  
  const watchedRecurrenceType = form.watch("recurrence_type");

  const handleFormSubmit = async (data: LiveClassFormValues) => {
    if (!liveClass) return;
    setIsLoading(true);

    let recurrenceDaysPayload = {};
    if (data.recurrence_type === "weekly" && data.recurrence_days) {
      const recurrenceDaysData = data.recurrence_days;
      recurrenceDaysPayload = weekdays.reduce((acc, day) => {
        const dayKey = day as keyof typeof recurrenceDaysData; 
        if (recurrenceDaysData[dayKey].enabled && recurrenceDaysData[dayKey].time) {
          acc[dayKey] = recurrenceDaysData[dayKey].time;
        }
        return acc;
      }, {} as Record<string, string>);
    }

    const payload = {
      ...data,
      recurrence_days: recurrenceDaysPayload,
    };
    
    if (!payload.end_date) {
      delete (payload as any).end_date;
    }

    try {
      await api.patch(`/live/classes/${liveClass.slug}/`, payload);
      toast.success(`"${payload.title}" updated successfully!`);
      onSuccess(); // This will close the modal and refresh the list
    } catch (error) {
      console.error("Failed to update live class:", error);
      toast.error("Failed to update. Please check the form.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Live Class Schedule</DialogTitle>
          <DialogDescription>
            Make changes to your class series. This may regenerate lessons.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            
            {/* ... (Paste all your FormField components from the create page here) ... */}
            {/* Title, Start Date, End Date, Duration, Recurrence Type */}
            
            {watchedRecurrenceType === "weekly" && (
              <>
                <WeekdayRecurrenceSelector control={form.control} />
                <FormField
                  control={form.control}
                  name="recurrence_update_mode"
                  render={({ field }) => (
                    <FormItem className="!mt-4">
                      <FormLabel>Update Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Do not regenerate lessons</SelectItem>
                          <SelectItem value="future">Regenerate future lessons only</SelectItem>
                          <SelectItem value="all">Regenerate all lessons</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Choose how updates affect existing lessons.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="rounded bg-green-600 hover:bg-green-700">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};