"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api/axios";
import { X, Loader2, Save, CalendarPlus } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogClose 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const lessonCreateSchema = z.object({
  title: z.string().min(3, "Title is required.").max(100),
  description: z.string().optional(),
  start_datetime: z.string().min(1, "Start date and time are required."),
  end_datetime: z.string().min(1, "End date and time are required."),
});

type LessonCreateFormValues = z.infer<typeof lessonCreateSchema>;

interface LessonCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveClassId: number;
  onSuccess: () => void;
}

const inputStyles = "h-12 px-4 rounded-md border-border bg-background transition-colors hover:border-secondary focus-visible:ring-0 focus-visible:border-secondary shadow-none outline-none w-full text-base";

export function LessonCreateModal({ 
  isOpen, 
  onClose, 
  liveClassId, 
  onSuccess 
}: LessonCreateModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LessonCreateFormValues>({
    resolver: zodResolver(lessonCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      start_datetime: "",
      end_datetime: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: "",
        description: "",
        start_datetime: "",
        end_datetime: "",
      });
    }
  }, [isOpen, form]);

  const handleFormSubmit = async (data: LessonCreateFormValues) => {
    setIsLoading(true);
    try {
      await api.post(`/live/lessons/`, {
        ...data,
        live_class: liveClassId,
      });

      toast.success("New lesson scheduled!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to schedule lesson.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] sm:max-w-[480px] lg:max-w-[650px] p-0 gap-0 max-h-[90vh] md:max-h-[85vh] h-auto min-h-[300px] flex flex-col border-border/80 shadow-2xl rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[5%] md:top-[10%] translate-y-0">
        
        <DialogHeader className="px-4 py-3 md:py-4 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
          <DialogTitle className="text-base md:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-primary" />
            Schedule Extra Session
          </DialogTitle>
          <DialogClose className="rounded-md p-2 hover:bg-muted transition">
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Form {...form}>
            <form id="lesson-create-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="h-full flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-thumb]:border-x-[1px] [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content">
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Lesson Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Special Revision Session" {...field} className={inputStyles} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <FormField
                    control={form.control}
                    name="start_datetime"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Starts At</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} className={inputStyles} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_datetime"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Ends At</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} className={inputStyles} />
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
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Agenda (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Briefly describe what will be covered..." 
                          {...field} 
                          className="resize-none text-base border-border bg-background transition-colors hover:border-secondary focus-visible:ring-0 focus-visible:border-secondary shadow-none outline-none w-full min-h-[100px] md:min-h-[120px] p-4" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        <div className="px-4 md:px-6 py-3 md:py-4 border-t bg-background shrink-0 mt-auto">
          <Button 
            type="submit" 
            form="lesson-create-form" 
            disabled={isLoading} 
            className="w-full h-12 text-sm md:text-base font-bold shadow-sm transition-all active:scale-[0.98] bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )} 
            Schedule Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}