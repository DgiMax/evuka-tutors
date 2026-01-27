"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2, Settings, DollarSign, Users } from "lucide-react";

import api from "@/lib/api/axios";
import { EventManagementData, SettingsSchema, SettingsValues } from "./EventSharedTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EventSettingsTab({ event }: { event: EventManagementData }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<SettingsValues>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      event_status: event.event_status,
      max_attendees: event.max_attendees,
      registration_open: event.registration_open,
      registration_deadline: event.registration_deadline?.slice(0, 16) || "",
      is_paid: event.is_paid,
      price: event.price ? Number(parseFloat(String(event.price)).toFixed(2)) : 0,
      currency: event.currency || "KES",
    },
  });

  const { mutate } = useMutation({
    mutationFn: (data: SettingsValues) => api.patch(`/events/tutor-events/${event.slug}/`, data),
    onSuccess: (res) => {
      toast.success("Event settings updated.");
      queryClient.setQueryData(["eventManagement", event.slug], res.data);
    },
    onError: () => toast.error("Failed to update settings."),
    onSettled: () => setIsUpdating(false),
  });

  const onSubmit = (data: SettingsValues) => {
    setIsUpdating(true);
    mutate(data);
  };

  const isPaid = form.watch("is_paid");
  const labelClasses = "uppercase text-xs font-bold text-muted-foreground tracking-wider";
  const inputClasses = "rounded-md shadow-none w-full font-medium text-zinc-600";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <Card className="rounded-md border shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary"/> Status & Visibility</CardTitle>
                <CardDescription>Control when your event is visible to the public.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="event_status" render={({ field }) => (
                    <FormItem className="w-full">
                        <FormLabel className={labelClasses}>Event Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger className={inputClasses}>
                                    <div className="truncate w-full text-left">
                                        <SelectValue placeholder="Select status" />
                                    </div>
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-md shadow-none">
                                <SelectItem value="draft" className="rounded-md">Draft (Hidden)</SelectItem>
                                <SelectItem value="pending_approval" className="rounded-md">Pending Approval</SelectItem>
                                <SelectItem value="approved" className="rounded-md">Approved (Public)</SelectItem>
                                <SelectItem value="cancelled" className="text-destructive rounded-md">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormDescription>Draft events are not visible on the marketplace.</FormDescription>
                    </FormItem>
                )} />
            </CardContent>
        </Card>

        <Card className="rounded-md border shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> Registration & Capacity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <FormField control={form.control} name="max_attendees" render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel className={labelClasses}>Maximum Attendees</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number" 
                                    className={inputClasses} 
                                    {...field} 
                                    onChange={e => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))} 
                                />
                            </FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="registration_deadline" render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel className={labelClasses}>Registration Deadline</FormLabel>
                            <FormControl><Input type="datetime-local" className={inputClasses} {...field} /></FormControl>
                        </FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="registration_open" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-md border p-4 bg-muted/20 shadow-none">
                        <div className="space-y-0.5">
                            <FormLabel className={labelClasses}>Registration Open</FormLabel>
                            <FormDescription>Toggle to pause or resume new sign-ups.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="rounded-md" /></FormControl>
                    </FormItem>
                )} />
            </CardContent>
        </Card>

        <Card className="rounded-md border shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary"/> Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="is_paid" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-md border p-4 shadow-none">
                        <div className="space-y-0.5">
                            <FormLabel className={labelClasses}>Paid Event</FormLabel>
                            <FormDescription>Does this event require a ticket purchase?</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="rounded-md" /></FormControl>
                    </FormItem>
                )} />

                {isPaid && (
                    <div className="grid grid-cols-2 gap-4 pt-4 animate-in fade-in w-full border-t">
                        <FormField control={form.control} name="price" render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel className={labelClasses}>Price</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        step="0.01"
                                        className={inputClasses} 
                                        {...field} 
                                        onChange={e => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))} 
                                    />
                                </FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="currency" render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel className={labelClasses}>Currency</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className={inputClasses}>
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
                            </FormItem>
                        )} />
                    </div>
                )}
            </CardContent>
        </Card>

        <div className="flex justify-end sticky bottom-6 z-10">
            <Button type="submit" disabled={isUpdating} size="lg" className="rounded-md shadow-none min-w-[160px]">
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Update Configuration
            </Button>
        </div>
      </form>
    </Form>
  );
}