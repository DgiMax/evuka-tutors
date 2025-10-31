"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider, useFormContext, useFieldArray } from "react-hook-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api/axios";
import { AxiosError } from "axios";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Send,
  Loader2,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ----------------------------
// Validation Schema
// ----------------------------
const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  overview: z.string().min(5, "Overview must be at least 5 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  event_type: z.string().min(1, "Event type is required."),
  who_can_join: z.string().optional(),
  course: z.string().min(1, "Course is required."),

  start_time: z.string().min(1, "Start time is required."),
  end_time: z.string().min(1, "End time is required."),
  timezone: z.string().min(1, "Timezone is required."),
  location: z.string().optional(),
  meeting_link: z.string().url("Must be a valid URL.").or(z.literal("")).optional(),

  max_attendees: z.number().min(1, "Must allow at least 1 attendee."),
  registration_open: z.boolean().default(true),
  registration_deadline: z.string().min(1, "Registration deadline is required."),
  is_paid: z.boolean().default(false),
  event_status: z.string().min(1, "Status is required").default("draft"),
  price: z.number().optional(),
  currency: z.string().optional(),
  banner_image: z.any().optional(),

  agenda: z
    .array(
      z.object({
        time: z.string().min(1, "Time is required."),
        title: z.string().min(1, "Title is required."),
        description: z.string().min(1, "Description is required."),
      })
    )
    .optional(),
  learning_objectives: z
    .array(
      z.object({
        text: z.string().min(10, "Objective is too short."),
      })
    )
    .min(1, "Add at least 1 objective.")
    .optional(),
  rules: z
    .array(
      z.object({
        title: z.string().min(1, "Rule title is required."),
        text: z.string().min(1, "Rule text is required."),
      })
    )
    .optional(),
  attachments: z.array(z.any()).optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

// ----------------------------
// Step Components
// ----------------------------
function StepBasicInfo({ formOptions }: { formOptions: any }) {
  const { control } = useFormContext<EventFormData>();

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Title</FormLabel>
            <FormControl>
              <ShadcnInput placeholder="e.g., Live Q&A with the CEO" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="overview"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Short Overview</FormLabel>
            <FormControl>
              <Textarea maxLength={200} placeholder="A brief, catchy summary..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Detailed Description</FormLabel>
            <FormControl>
              <Textarea rows={5} placeholder="Provide details about the event..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Dropdown */}
        <FormField
          control={control}
          name="course"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Related Course</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {formOptions?.courses?.map((course: any) => (
                    <SelectItem key={course.id} value={String(course.id)}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Which course is this event for?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Event Type Dropdown */}
        <FormField
          control={control}
          name="event_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {formOptions?.form_options?.event_types?.map((option: any) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Who Can Join */}
      <FormField
        control={control}
        name="who_can_join"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Who Can Join</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select who can join" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {formOptions?.form_options?.who_can_join?.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function StepEventDetails() {
  const { control } = useFormContext<EventFormData>();

  // 1. Learning Objectives
  const { fields: objectives, append: appendObjective, remove: removeObjective } = useFieldArray({
    control,
    name: "learning_objectives",
  });

  // 2. Agenda
  const { fields: agendaItems, append: appendAgenda, remove: removeAgenda } = useFieldArray({
    control,
    name: "agenda",
  });

  // 3. Rules
  const { fields: rules, append: appendRule, remove: removeRule } = useFieldArray({
    control,
    name: "rules",
  });

  return (
    <div className="space-y-8">
      {/* --- Section 1: Learning Objectives --- */}
      <div className="space-y-2">
        <FormLabel className="text-lg font-semibold">Learning Objectives</FormLabel>
        <FormDescription>What will attendees learn?</FormDescription>
        {objectives.map((field, index) => (
          <FormField
            key={field.id}
            control={control}
            name={`learning_objectives.${index}.text`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <ShadcnInput placeholder={`Objective #${index + 1}`} {...field} />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeObjective(index)}
                >
                  <Trash2 size={16} className="text-gray-500 hover:text-red-600" />
                </Button>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 rounded"
          onClick={() => appendObjective({ text: "" })}
        >
          <Plus className="mr-2" size={16} /> Add Objective
        </Button>
      </div>

      {/* --- Section 2: Event Agenda --- */}
      <div className="space-y-2">
        <FormLabel className="text-lg font-semibold">Event Agenda</FormLabel>
        <FormDescription>Outline the event's schedule.</FormDescription>
        {agendaItems.map((field, index) => (
          <Accordion key={field.id} type="single" collapsible className="w-full mb-2">
            <AccordionItem value={`agenda-${field.id}`} className="border rounded bg-white">
              <AccordionTrigger className="px-4 py-2 text-sm hover:no-underline">
                Agenda Item {index + 1}
              </AccordionTrigger>
              <AccordionContent className="space-y-3 p-4 border-t">
                <FormField
                  control={control}
                  name={`agenda.${index}.time`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Time</FormLabel>
                      <FormControl>
                        <ShadcnInput placeholder="e.g., 10:00 AM - 10:30 AM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`agenda.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Title</FormLabel>
                      <FormControl>
                        <ShadcnInput placeholder="e.g., Introduction" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`agenda.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="What will happen..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="text-right mt-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeAgenda(index)}
                  >
                    <Trash2 size={14} className="mr-1" /> Remove Item
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 rounded"
          onClick={() => appendAgenda({ time: "", title: "", description: "" })}
        >
          <Plus className="mr-2" size={16} /> Add Agenda Item
        </Button>
      </div>

      {/* --- Section 3: Event Rules --- */}
      <div className="space-y-2">
        <FormLabel className="text-lg font-semibold">Event Rules</FormLabel>
        <FormDescription>Set guidelines for attendees.</FormDescription>
        {rules.map((field, index) => (
           <Card key={field.id} className="bg-gray-50 border rounded shadow-none p-4">
             <div className="space-y-3">
               <FormField
                  control={control}
                  name={`rules.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Rule Title</FormLabel>
                      <FormControl>
                        <ShadcnInput placeholder="e.g., Be Respectful" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`rules.${index}.text`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Rule Text</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Details about the rule..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="text-right mt-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeRule(index)}
                  >
                    <Trash2 size={14} className="mr-1" /> Remove Rule
                  </Button>
                </div>
             </div>
           </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 rounded"
          onClick={() => appendRule({ title: "", text: "" })}
        >
          <Plus className="mr-2" size={16} /> Add Rule
        </Button>
      </div>
    </div>
  );
}

function StepSchedule() {
  const { control } = useFormContext<EventFormData>();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="start_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time</FormLabel>
              <FormControl>
                <ShadcnInput type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="end_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Time</FormLabel>
              <FormControl>
                <ShadcnInput type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="timezone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Timezone</FormLabel>
            <FormControl>
              <ShadcnInput placeholder="e.g., Africa/Nairobi" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <ShadcnInput placeholder="e.g., Online or venue address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="meeting_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meeting Link</FormLabel>
              <FormControl>
                <ShadcnInput placeholder="https://zoom.us/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function StepRegistrationPricing({ formOptions }: { formOptions: any }) {
  const { control, watch } = useFormContext<EventFormData>();
  const isPaid = watch("is_paid");

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="max_attendees"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Max Attendees</FormLabel>
            <FormControl>
              <ShadcnInput
                type="number"
                min={1}
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="registration_open"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div>
                <FormLabel className="text-base">Registration Open</FormLabel>
                <FormDescription>
                  Toggle to open or close event registration.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="registration_deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration Closes</FormLabel>
              <FormControl>
                <ShadcnInput type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="event_status"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Event Status</FormLabel>
                <FormDescription>
                  Save as draft or submit for approval.
                </FormDescription>
              </div>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions?.form_options?.event_statuses?.map((option: any) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="is_paid"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div>
              <FormLabel className="text-base">Paid Event?</FormLabel>
              <FormDescription>Toggle if the event requires payment.</FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {isPaid && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md">
          <FormField
            control={control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <ShadcnInput
                    type="number"
                    min={0}
                    {...field}
                    // 1. Use an empty string if value is undefined
                    value={field.value ?? ''}
                    // 2. Convert empty string back to undefined for Zod
                    onChange={e => {
                      const val = e.target.value;
                      field.onChange(val === '' ? undefined : Number(val));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {formOptions?.form_options?.currencies?.map((option: any) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <FormField
        control={control}
        name="banner_image"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Banner Image</FormLabel>
            <FormControl>
              <ShadcnInput
                type="file"
                accept="image/*"
                onChange={(e) =>
                  field.onChange((e.target as HTMLInputElement).files?.[0] || null)
                }
              />
            </FormControl>
            <FormDescription>Recommended size: 1200x600px</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// ----------------------------
// Main Component
// ----------------------------
export default function CreateEventPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formOptions, setFormOptions] = useState<any>(null);

  // Fetch form options
  useEffect(() => {
    api
      .get("/events/form-options/")
      .then((res) => setFormOptions(res.data))
      .catch(() => toast.error("Failed to load form options."));
  }, []);

  const methods = useForm<EventFormData>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: {
      // Step 1 Fields
      title: "",
      overview: "",
      description: "",
      event_type: "",
      who_can_join: "", // Use "" for optional selects too
      course: "",

      // Step 2 Fields
      start_time: "",
      end_time: "",
      timezone: "Africa/Nairobi", // This was good
      location: "",
      meeting_link: "",

      // Step 3 Fields
      max_attendees: 50, // This was good
      registration_open: true,
      registration_deadline: "",
      is_paid: false, // This was good
      event_status: "draft", 
      price: undefined, // This is fine, as it's conditional
      currency: "KES", // This was good
      banner_image: null, // Use null for file/any types

      // Arrays
      agenda: [],
      learning_objectives: [],
      rules: [],
      attachments: [],
    },
    mode: "onBlur",
  });

  const { handleSubmit, trigger } = methods;

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "banner_image" && value instanceof File) {
          formData.append(key, value);
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value != null) {
          formData.append(key, String(value));
        }
      });

      await api.post("events/create/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Event created successfully!");
      methods.reset();
      setCurrentStep(0);
    } catch (err) {
      const error = err as AxiosError<{ detail?: string }>;
      toast.error(
        error.response?.data?.detail ||
          "Something went wrong while creating the event."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Define field names for each step
  const steps = [
    {
      id: 1,
      title: "Basic Info",
      component: <StepBasicInfo formOptions={formOptions} />,
      fields: ["title", "overview", "description", "event_type", "course", "who_can_join"] as const,
    },
    {
      id: 2,
      title: "Event Details",
      component: <StepEventDetails />,
      fields: ["learning_objectives", "agenda", "rules"] as const,
    },
    {
      id: 3,
      title: "Schedule",
      component: <StepSchedule />,
      fields: ["start_time", "end_time", "timezone", "location", "meeting_link"] as const,
    },
    {
      id: 4,
      title: "Registration & Pricing",
      component: <StepRegistrationPricing formOptions={formOptions} />,
      fields: ["max_attendees", "registration_open", "registration_deadline", "is_paid", "price", "currency", "banner_image", "event_status"] as const,
    },
  ];

  const nextStep = async () => {
    // Get the fields for the *current* step
    const currentFields = steps[currentStep].fields;
    
    const valid = await trigger(currentFields, {
      shouldFocus: true,
    });

    if (!valid) {
      toast.warning("Please fix errors before proceeding.");
      return;
    }
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  return (
    <Card className="max-w-4xl mx-auto my-8 border border-gray-200 rounded text-black shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">Create New Event</CardTitle>
        <CardDescription>Fill out the event details step-by-step.</CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Stepper */}
        <div className="flex items-center mb-8 border-b border-gray-200 pb-2 overflow-x-auto">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center text-sm transition-colors ${
                  currentStep === index ? "text-blue-600 font-semibold" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 mr-2 flex items-center justify-center ${
                    currentStep === index ? "border-blue-600" : "border-gray-300"
                  }`}
                >
                  {currentStep > index ? <Check size={14} /> : step.id}
                </div>
                {step.title}
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 border-t-2 border-gray-200 mx-4"></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Content */}
        <FormProvider {...methods}>
          <form id="event-create-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {steps[currentStep].component}
              </motion.div>
            </AnimatePresence>
          </form>
        </FormProvider>
      </CardContent>

      {/* Card Footer (from reference) */}
      <CardFooter className="flex justify-between border-t pt-6">
        <div>
          {currentStep > 0 && (
            <Button onClick={prevStep} variant="outline" disabled={isLoading} className="rounded">
              <ArrowLeft className="mr-2" size={16} /> Previous
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {currentStep < steps.length - 1 ? (
            <Button onClick={nextStep} disabled={isLoading} className="rounded bg-[#2694C6] hover:bg-[#1f7ba5]">
              Next <ArrowRight className="ml-2" size={16} />
            </Button>
          ) : (
            <Button
              type="submit"
              form="event-create-form"
              disabled={isLoading}
              className="rounded bg-green-600 hover:bg-green-700 w-[160px]"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isLoading ? "Submitting..." : "Submit Event"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
