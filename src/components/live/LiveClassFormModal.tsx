"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api/axios";
import { X, Loader2, Save, Calendar } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose 
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const recurrenceDaySchema = z.object({
  enabled: z.boolean().default(false),
  time: z.string().default("09:00"),
});

const liveClassFormSchema = z.object({
  title: z.string().min(5).max(100),
  start_date: z.string().min(1),
  end_date: z.string().optional(),
  duration_minutes: z.coerce.number().min(15).max(300),
  recurrence_type: z.enum(["none", "weekly"]),
  single_session_start: z.string().optional(),
  recurrence_days: z.record(z.string(), recurrenceDaySchema).optional(),
  recurrence_update_mode: z.enum(["none", "future", "all"]).default("none"),
}).refine(data => data.recurrence_type !== "none" || !!data.single_session_start, {
  message: "Time is required.",
  path: ["single_session_start"],
});

type FormValues = z.infer<typeof liveClassFormSchema>;
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const inputStyles = "h-12 px-4 rounded-md border-border bg-background transition-colors hover:border-secondary focus-visible:ring-0 focus-visible:border-secondary shadow-none outline-none w-full text-base";

export function LiveClassFormModal({ isOpen, onClose, courseId, selectedClass, onSuccess }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");

  const form = useForm<FormValues>({
    resolver: zodResolver(liveClassFormSchema) as any,
    defaultValues: {
      title: "", start_date: "", duration_minutes: 60, recurrence_type: "none",
      single_session_start: "09:00", recurrence_update_mode: "none",
      recurrence_days: weekdays.reduce((acc, day) => ({ ...acc, [day]: { enabled: false, time: "09:00" } }), {})
    }
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab("settings");
      if (selectedClass) {
        const formattedDays = weekdays.reduce((acc, day) => {
          const time = selectedClass.recurrence_days?.[day];
          return { ...acc, [day]: { enabled: !!time, time: time || "09:00" } };
        }, {});
        form.reset({
          ...selectedClass,
          duration_minutes: selectedClass.duration_minutes || 60,
          end_date: selectedClass.end_date || "",
          recurrence_days: formattedDays,
          recurrence_update_mode: "none"
        });
      } else {
        form.reset({
          title: "", start_date: "", duration_minutes: 60, recurrence_type: "none",
          single_session_start: "09:00",
          recurrence_days: weekdays.reduce((acc, day) => ({ ...acc, [day]: { enabled: false, time: "09:00" } }), {})
        });
      }
    }
  }, [selectedClass, isOpen, form]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const recurrence_days: Record<string, string> = {};
      if (values.recurrence_type === "weekly" && values.recurrence_days) {
        Object.entries(values.recurrence_days).forEach(([day, cfg]) => {
          if (cfg.enabled) recurrence_days[day] = cfg.time;
        });
      }

      const payload = { 
        title: values.title,
        start_date: values.start_date,
        end_date: values.end_date || null,
        duration_minutes: values.duration_minutes,
        recurrence_type: values.recurrence_type,
        single_session_start: values.recurrence_type === "none" ? values.single_session_start : null,
        recurrence_days: recurrence_days,
        recurrence_update_mode: values.recurrence_update_mode,
        course: courseId, 
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone 
      };

      if (selectedClass) {
        await api.patch(`/live/manage/classes/${selectedClass.slug}/`, payload);
      } else {
        await api.post("/live/manage/classes/", payload);
      }
      
      toast.success(selectedClass ? "Schedule updated" : "Schedule created");
      onSuccess();
      onClose();
    } catch (error: any) {
      const errors = error.response?.data;
      console.error(errors);
      toast.error(typeof errors === 'string' ? errors : "Validation error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] sm:max-w-[480px] lg:max-w-[800px] p-0 gap-0 max-h-[90vh] md:max-h-[85vh] h-auto min-h-[300px] flex flex-col border-border/80 shadow-2xl rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[5%] md:top-[10%] translate-y-0">
        <DialogHeader className="px-4 py-3 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
          <DialogTitle className="text-base md:text-lg font-semibold tracking-tight text-foreground">
            {selectedClass ? "Manage Class Series" : "Schedule New Live Class"}
          </DialogTitle>
          <DialogClose className="rounded-md p-2 hover:bg-muted transition">
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Form {...form}>
            <form id="live-class-form" onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col min-h-0">
              
              <div className="px-4 md:px-6 pt-6 pb-2 shrink-0 bg-background z-10">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="flex w-full h-11 p-1 bg-muted/50 rounded-lg gap-1">
                    <TabsTrigger 
                      value="settings" 
                      className="flex-1 rounded-md transition-all text-[11px] md:text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Basic Setup
                    </TabsTrigger>
                    <TabsTrigger 
                      value="schedule" 
                      className="flex-1 rounded-md transition-all text-[11px] md:text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Recurrence & Logic
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-thumb]:border-x-[1px] [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content">
                {activeTab === "settings" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Class Title</FormLabel>
                        <FormControl><Input placeholder="e.g. Weekly Q&A Session" {...field} className={inputStyles} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="start_date" render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Start Date</FormLabel>
                          <FormControl><Input type="date" {...field} className={inputStyles} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="duration_minutes" render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Duration (Mins)</FormLabel>
                          <FormControl><Input type="number" {...field} className={inputStyles} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="recurrence_type" render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Frequency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={inputStyles}>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-md border-border shadow-none">
                            <SelectItem value="none">One-Time Event</SelectItem>
                            <SelectItem value="weekly">Weekly Recurrence</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {form.watch("recurrence_type") === "none" && (
                      <FormField control={form.control} name="single_session_start" render={({ field }) => (
                        <FormItem className="space-y-1 sm:max-w-[200px]">
                          <FormLabel className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Start Time</FormLabel>
                          <FormControl><Input type="time" {...field} className={inputStyles} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}
                  </div>
                )}

                {activeTab === "schedule" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-200">
                    {form.watch("recurrence_type") === "weekly" ? (
                      <div className="space-y-3 p-3 md:p-4 border border-border rounded-md bg-muted/10">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Weekly Schedule Grid</FormLabel>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {weekdays.map(day => (
                            <div key={day} className="flex items-center justify-between gap-4 p-3 bg-background border border-border rounded-md transition-all hover:border-primary/30">
                              <div className="flex items-center gap-3">
                                <Checkbox 
                                  checked={form.watch(`recurrence_days.${day}.enabled` as any)} 
                                  onCheckedChange={(val) => form.setValue(`recurrence_days.${day}.enabled` as any, !!val)} 
                                  className="h-5 w-5"
                                />
                                <span className="text-sm font-bold">{day}</span>
                              </div>
                              <Input 
                                type="time" 
                                disabled={!form.watch(`recurrence_days.${day}.enabled` as any)} 
                                className="w-28 md:w-32 h-10 text-sm shadow-none border-border" 
                                {...form.register(`recurrence_days.${day}.time` as any)} 
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 md:p-12 text-center border-2 border-dashed rounded-md bg-muted/5">
                        <Calendar className="h-10 w-10 text-muted-foreground opacity-20 mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">Switch frequency to "Weekly" to enable recurrence options.</p>
                      </div>
                    )}

                    {selectedClass && (
                      <FormField control={form.control} name="recurrence_update_mode" render={({ field }) => (
                        <FormItem className="bg-amber-50/40 p-4 md:p-5 border border-amber-100 rounded-md flex flex-col items-start gap-3">
                          <div className="space-y-1">
                            <FormLabel className="text-amber-800 text-[10px] font-bold uppercase tracking-widest">Update Strategy</FormLabel>
                            <FormDescription className="text-[10px] text-amber-700/70">Determines how changes affect existing sessions.</FormDescription>
                          </div>
                          
                          <div className="w-full lg:w-1/2">
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 text-sm border-amber-200 bg-white shadow-none focus:ring-0">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-md border-border shadow-none">
                                <SelectItem value="none">Update Metadata Only</SelectItem>
                                <SelectItem value="future">Regenerate Future Sessions</SelectItem>
                                <SelectItem value="all">Regenerate All Sessions</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </FormItem>
                      )} />
                    )}
                  </div>
                )}
              </div>
            </form>
          </Form>
        </div>

        <div className="px-4 md:px-6 py-4 border-t bg-background shrink-0 mt-auto">
          <Button 
            type="submit" 
            form="live-class-form" 
            disabled={isLoading} 
            className="w-full h-12 text-sm md:text-base font-bold shadow-sm transition-all active:scale-[0.98] bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )} 
            {selectedClass ? "Save Changes" : "Create Schedule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}