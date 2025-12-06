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
const lessonCreateSchema = z.object({
  title: z.string().min(3, "Title is required.").max(100),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required."),
  start_time: z.string().min(1, "Start time is required."),
  end_time: z.string().min(1, "End time is required."),
});

type LessonCreateFormValues = z.infer<typeof lessonCreateSchema>;

interface LessonCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveClassId: number; // Required to link the lesson to the parent class
  onSuccess: () => void;
}

export const LessonCreateModal: React.FC<LessonCreateModalProps> = ({ isOpen, onClose, liveClassId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LessonCreateFormValues>({
    resolver: zodResolver(lessonCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      start_time: "",
      end_time: "",
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: "",
        description: "",
        date: "",
        start_time: "",
        end_time: "",
      });
    }
  }, [isOpen, form]);

  const handleFormSubmit = async (data: LessonCreateFormValues) => {
    setIsLoading(true);

    try {
      // We must pass 'live_class' ID to the backend serializer
      await api.post(`/live/lessons/`, {
        ...data,
        live_class: liveClassId,
      });

      toast.success("Lesson scheduled successfully!");
      onSuccess(); // Closes modal and refreshes list
    } catch (error) {
      console.error("Failed to create lesson:", error);
      toast.error("Failed to schedule lesson.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule New Lesson</DialogTitle>
          <DialogDescription>
            Add a new session to this class series.
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
                    <ShadcnInput placeholder="e.g. Q&A Session - Week 1" {...field} />
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
                    <Textarea placeholder="What will be covered in this session?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="rounded bg-blue-600 hover:bg-blue-700">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Lesson
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};