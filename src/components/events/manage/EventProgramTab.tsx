import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2, List, CheckCircle, ShieldAlert } from "lucide-react";

import api from "@/lib/api/axios";
import { EventManagementData, ProgramSchema, ProgramValues } from "./EventSharedTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function EventProgramTab({ event }: { event: EventManagementData }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ProgramValues>({
    resolver: zodResolver(ProgramSchema),
    defaultValues: {
      learning_objectives: event.learning_objectives?.length ? event.learning_objectives : [],
      agenda: event.agenda?.length ? event.agenda : [],
      rules: event.rules?.length ? event.rules : [],
    },
  });

  const { fields: objectives, append: appendObj, remove: removeObj } = useFieldArray({ control: form.control, name: "learning_objectives" });
  const { fields: agenda, append: appendAgenda, remove: removeAgenda } = useFieldArray({ control: form.control, name: "agenda" });
  const { fields: rules, append: appendRule, remove: removeRule } = useFieldArray({ control: form.control, name: "rules" });

  const { mutate } = useMutation({
    mutationFn: (data: ProgramValues) => api.patch(`/events/tutor-events/${event.slug}/`, data),
    onSuccess: (res) => {
      toast.success("Event program updated.");
      queryClient.setQueryData(["eventManagement", event.slug], res.data);
    },
    onError: () => toast.error("Failed to update program."),
    onSettled: () => setIsUpdating(false),
  });

  const onSubmit = (data: ProgramValues) => {
    setIsUpdating(true);
    mutate(data);
  };

  const labelClasses = "uppercase text-xs font-bold text-muted-foreground tracking-wider";
  const inputClasses = "rounded-md shadow-none w-full font-medium text-zinc-600";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <Card className="rounded-md border shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary"/> Learning Objectives</CardTitle>
                <CardDescription>What will attendees take away?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {objectives.map((field, index) => (
                    <div key={field.id} className="flex gap-2 w-full">
                        <FormField control={form.control} name={`learning_objectives.${index}.text`} render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl><Input className={inputClasses} placeholder="Objective..." {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="icon" className="rounded-md shrink-0" onClick={() => removeObj(index)}><Trash2 size={16} className="text-destructive"/></Button>
                    </div>
                ))}
                <Button type="button" size="sm" variant="outline" className="rounded-md shadow-none" onClick={() => appendObj({ text: "" })}><Plus size={14} className="mr-2"/> Add Objective</Button>
            </CardContent>
        </Card>

        <Card className="rounded-md border shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><List className="h-5 w-5 text-primary"/> Agenda</CardTitle>
                <CardDescription>Outline the timeline of the event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {agenda.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md bg-muted/10 space-y-3 relative shadow-none">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 rounded-md" onClick={() => removeAgenda(index)}><Trash2 size={16} className="text-destructive"/></Button>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                            <FormField control={form.control} name={`agenda.${index}.time`} render={({ field }) => (
                                <FormItem className="col-span-1">
                                    <FormLabel className={labelClasses}>Time</FormLabel>
                                    <FormControl><Input className={inputClasses} placeholder="10:00 AM" {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name={`agenda.${index}.title`} render={({ field }) => (
                                <FormItem className="col-span-1 md:col-span-2">
                                    <FormLabel className={labelClasses}>Title</FormLabel>
                                    <FormControl><Input className={inputClasses} placeholder="Opening Keynote" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name={`agenda.${index}.description`} render={({ field }) => (
                            <FormItem className="w-full">
                                <FormControl><Textarea className={`${inputClasses} h-16 resize-none`} placeholder="Description..." {...field} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                ))}
                <Button type="button" size="sm" variant="outline" className="rounded-md shadow-none" onClick={() => appendAgenda({ time: "", title: "", description: "" })}><Plus size={14} className="mr-2"/> Add Agenda Item</Button>
            </CardContent>
        </Card>

        <Card className="rounded-md border shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary"/> Rules & Guidelines</CardTitle>
                <CardDescription>Define the rules for your organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {rules.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md space-y-3 relative shadow-none">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 rounded-md" onClick={() => removeRule(index)}><Trash2 size={16} className="text-destructive"/></Button>
                        <FormField control={form.control} name={`rules.${index}.title`} render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel className={labelClasses}>Title</FormLabel>
                                <FormControl><Input className={inputClasses} placeholder="e.g. No Recording" {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name={`rules.${index}.text`} render={({ field }) => (
                            <FormItem className="w-full">
                                <FormControl><Textarea className={`${inputClasses} h-16 resize-none`} placeholder="Details..." {...field} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                ))}
                <Button type="button" size="sm" variant="outline" className="rounded-md shadow-none" onClick={() => appendRule({ title: "", text: "" })}><Plus size={14} className="mr-2"/> Add Rule</Button>
            </CardContent>
        </Card>

        <div className="flex justify-end sticky bottom-6 z-10">
            <Button type="submit" disabled={isUpdating} size="lg" className="rounded-md shadow-none min-w-[160px]">
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Program
            </Button>
        </div>
      </form>
    </Form>
  );
}