"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api/axios";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

// --- ZOD SCHEMA ---
const lessonEditSchema = z.object({
  title: z.string().min(3, "Title is required.").max(100),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required."),
  start_time: z.string().min(1, "Start time is required."),
  end_time: z.string().min(1, "End time is required."),
});

type LessonEditFormValues = z.infer<typeof lessonEditSchema>;

interface LessonEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: { id: number; title: string; description: string; date: string; start_time: string; end_time: string; } | null;
  onSuccess: () => void;
}

export const LessonEditModal: React.FC<LessonEditModalProps> = ({ isOpen, onClose, lesson, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LessonEditFormValues>({
    resolver: zodResolver(lessonEditSchema),
  });

  // Pre-fill the form when the modal opens
  useEffect(() => {
    if (lesson) {
      form.reset({
        title: lesson.title,
        description: lesson.description || "",
        date: lesson.date,
        start_time: lesson.start_time,
        end_time: lesson.end_time,
      });
    }
  }, [lesson, form]);
  
  const handleFormSubmit = async (data: LessonEditFormValues) => {
    if (!lesson) return;
    setIsLoading(true);

    try {
      await api.patch(`/live/lessons/${lesson.id}/`, data);
      toast.success("Lesson updated successfully!");
      onSuccess(); // This will close the modal and refresh the list
    } catch (error) {
      console.error("Failed to update lesson:", error);
      toast.error("Failed to update lesson.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Lesson</DialogTitle>
          <DialogDescription>
            Postpone, rename, or update details for this single lesson.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <ShadcnInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="col-span-3 sm:col-span-1">
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <ShadcnInput type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem className="col-span-3 sm:col-span-1">
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <ShadcnInput type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem className="col-span-3 sm:col-span-1">
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <ShadcnInput type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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