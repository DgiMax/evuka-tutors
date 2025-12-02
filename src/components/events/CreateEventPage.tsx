"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  useFieldArray,
  Control,
  UseFormWatch,
  SubmitHandler,
  type Resolver,
  FormProvider,
  useFormContext,
  Path,
} from "react-hook-form";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Info,
  BookOpen,
  FileImage,
  DollarSign,
  Send,
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  Loader2,
  Check,
  School,
  Home,
  Image as ImageIcon,
  FileText as FileTextIcon,
  Calendar,
  Layers,
  Link as LinkIcon,
  Facebook,
  Linkedin,
  Twitter,
  Scale,
  Users,
  Building,
} from "lucide-react";

import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";

// --- UI Components ---
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
        description: z.string().optional(),
      })
    )
    .optional(),
  learning_objectives: z
    .array(
      z.object({
        text: z.string().min(10, "Objective is too short."),
      })
    )
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

// Helper function
const formatDateTimeForInput = (isoString: string | null | undefined) => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    const localISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    return localISO;
  } catch (error) {
    console.warn("Invalid date string provided:", isoString);
    return "";
  }
};

// ----------------------------
// Step Components (Themed)
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
              <ShadcnInput placeholder="e.g., Live Q&A" {...field} />
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
              <Textarea
                maxLength={200}
                placeholder="A brief summary..."
                {...field}
              />
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
              <Textarea
                rows={5}
                placeholder="Details about the event..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="course"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Related Course</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="truncate">
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

        <FormField
          control={control}
          name="event_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="truncate">
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

      <FormField
        control={control}
        name="who_can_join"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Who Can Join</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl>
                <SelectTrigger className="truncate">
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

  const {
    fields: objectives,
    append: appendObjective,
    remove: removeObjective,
  } = useFieldArray({ control, name: "learning_objectives" });

  const {
    fields: agendaItems,
    append: appendAgenda,
    remove: removeAgenda,
  } = useFieldArray({ control, name: "agenda" });

  const {
    fields: rules,
    append: appendRule,
    remove: removeRule,
  } = useFieldArray({ control, name: "rules" });

  return (
    <div className="space-y-6">
      {/* Section 1: Learning Objectives */}
      <div className="space-y-2">
        <FormLabel className="text-lg font-semibold">
          Learning Objectives
        </FormLabel>
        <FormDescription>What will attendees learn?</FormDescription>

        {objectives.map((field, index) => (
          <FormField
            key={field.id}
            control={control}
            name={`learning_objectives.${index}.text`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <ShadcnInput
                    placeholder={`Objective #${index + 1}`}
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeObjective(index)}
                  className="text-destructive/70 hover:text-destructive"
                >
                  <Trash2 size={16} />
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
          className="mt-2 rounded-md"
          onClick={() => appendObjective({ text: "" })}
        >
          <Plus className="mr-2" size={16} /> Add Objective
        </Button>
      </div>

      {/* Section 2: Event Agenda */}
      <div className="space-y-2">
        <FormLabel className="text-lg font-semibold">Event Agenda</FormLabel>
        <FormDescription>Outline the event's schedule.</FormDescription>

        {agendaItems.map((field, index) => (
          <Accordion
            key={field.id}
            type="single"
            collapsible
            className="w-full mb-2"
          >
            <AccordionItem
              value={`agenda-${field.id}`}
              className="border border-border rounded-md bg-card"
            >
              <AccordionTrigger className="px-4 py-2 text-sm hover:no-underline">
                Agenda Item {index + 1}
              </AccordionTrigger>
              <AccordionContent className="space-y-3 p-4 border-t border-border">
                <FormField
                  control={control}
                  name={`agenda.${index}.time`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Time</FormLabel>
                      <FormControl>
                        <ShadcnInput
                          placeholder="e.g., 10:00 AM - 10:30 AM"
                          {...field}
                        />
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
                        <ShadcnInput
                          placeholder="e.g., Introduction"
                          {...field}
                        />
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
                      <FormLabel className="text-xs font-medium">
                        Description (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What will happen..."
                          {...field}
                        />
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
          className="mt-2 rounded-md"
          onClick={() => appendAgenda({ time: "", title: "", description: "" })}
        >
          <Plus className="mr-2" size={16} /> Add Agenda Item
        </Button>
      </div>

      {/* Section 3: Event Rules */}
      <div className="space-y-2">
        <FormLabel className="text-lg font-semibold">Event Rules</FormLabel>
        <FormDescription>Set guidelines for attendees.</FormDescription>

        {rules.map((field, index) => (
          <Card
            key={field.id}
            className="bg-muted/50 border rounded-md shadow-none p-4"
          >
            <div className="space-y-3">
              <FormField
                control={control}
                name={`rules.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">
                      Rule Title
                    </FormLabel>
                    <FormControl>
                      <ShadcnInput
                        placeholder="e.g., Be Respectful"
                        {...field}
                      />
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
                    <FormLabel className="text-xs font-medium">
                      Rule Text
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Details about the rule..."
                        {...field}
                      />
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
          className="mt-2 rounded-md"
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
                <ShadcnInput
                  placeholder="e.g., Online or venue address"
                  {...field}
                />
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
  const bannerImage = watch("banner_image");

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="event_status"
        // UPDATED: Themed
        render={({ field }) => (
          <FormItem className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-md border border-border p-4 bg-muted/50">
            <div className="space-y-0.5 mb-2 sm:mb-0">
              <FormLabel className="text-base">Event Status</FormLabel>
              <FormDescription>
                Save as draft or submit for approval.
              </FormDescription>
            </div>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full sm:w-[180px] truncate">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {formOptions?.form_options?.event_statuses?.map(
                    (option: any) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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
            <FormItem className="flex flex-row items-center justify-between rounded-md border border-border p-4">
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
      </div>

      <FormField
        control={control}
        name="is_paid"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-md border border-border p-4">
            <div>
              <FormLabel className="text-base">Paid Event?</FormLabel>
              <FormDescription>
                Toggle if the event requires payment.
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {isPaid && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-border rounded-md">
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
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? undefined : Number(val));
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
                    <SelectTrigger className="truncate">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {formOptions?.form_options?.currencies?.map(
                      (option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      )
                    )}
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
                value={undefined}
                onChange={(e) =>
                  field.onChange(
                    (e.target as HTMLInputElement).files?.[0] || null
                  )
                }
              />
            </FormControl>

            {bannerImage && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Image Preview:
                </p>
                <img
                  src={
                    typeof bannerImage === "string"
                      ? bannerImage
                      : URL.createObjectURL(bannerImage)
                  }
                  alt="Banner preview"
                  className="w-full h-auto max-h-48 object-cover rounded-md border border-border"
                />
              </div>
            )}

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
const steps = [
  {
    id: 1,
    title: "Basic Info",
    component: StepBasicInfo,
    fields: [
      "title",
      "overview",
      "description",
      "event_type",
      "course",
      "who_can_join",
    ] as const,
  },
  {
    id: 2,
    title: "Event Details",
    component: StepEventDetails,
    fields: ["learning_objectives", "agenda", "rules"] as const,
  },
  {
    id: 3,
    title: "Schedule",
    component: StepSchedule,
    fields: [
      "start_time",
      "end_time",
      "timezone",
      "location",
      "meeting_link",
    ] as const,
  },
  {
    id: 4,
    title: "Registration & Pricing",
    component: StepRegistrationPricing,
    fields: [
      "max_attendees",
      "registration_open",
      "registration_deadline",
      "is_paid",
      "price",
      "currency",
      "banner_image",
      "event_status",
    ] as const,
  },
];

interface CreateEventPageProps {
  isEditMode?: boolean;
  eventSlug?: string;
}

export default function CreateEventPage({
  isEditMode = false,
  eventSlug,
}: CreateEventPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formOptions, setFormOptions] = useState<any>(null);

  const [isFetchingOptions, setIsFetchingOptions] = useState(true);
  const [isFetchingEvent, setIsFetchingEvent] = useState(isEditMode);

  useEffect(() => {
    setIsFetchingOptions(true);
    api
      .get("/events/tutor-events/form_options/")
      .then((res) => setFormOptions(res.data))
      .catch(() => toast.error("Failed to load form options."))
      .finally(() => setIsFetchingOptions(false));
  }, []);

  const methods = useForm<EventFormData>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: {
      title: "",
      overview: "",
      description: "",
      event_type: "",
      who_can_join: "",
      course: "",
      start_time: "",
      end_time: "",
      timezone: "Africa/Nairobi",
      location: "",
      meeting_link: "",
      max_attendees: 50,
      registration_open: true,
      registration_deadline: "",
      is_paid: false,
      event_status: "draft",
      price: undefined,
      currency: "KES",
      banner_image: null,
      agenda: [],
      learning_objectives: [],
      rules: [],
      attachments: [],
    },
    mode: "onBlur",
  });

  const { handleSubmit, trigger, reset } = methods;

  useEffect(() => {
    if (!isEditMode || !eventSlug) return;

    const fetchEvent = async () => {
      setIsFetchingEvent(true);
      try {
        const response = await api.get(`/events/tutor-events/${eventSlug}/`);
        const eventData = response.data;

        reset({
          title: eventData.title || "",
          overview: eventData.overview || "",
          description: eventData.description || "",
          event_type: eventData.event_type || "",
          who_can_join: eventData.who_can_join || "",
          course: eventData.course?.id?.toString() || "",
          start_time: formatDateTimeForInput(eventData.start_time),
          end_time: formatDateTimeForInput(eventData.end_time),
          timezone: eventData.timezone || "Africa/Nairobi",
          location: eventData.location || "",
          meeting_link: eventData.meeting_link || "",
          max_attendees: eventData.max_attendees || 50,
          registration_open: eventData.registration_open ?? true,
          registration_deadline: formatDateTimeForInput(
            eventData.registration_deadline
          ),
          is_paid: eventData.is_paid || false,
          event_status: eventData.event_status || "draft",
          price: eventData.price ? Number(eventData.price) : undefined,
          currency: eventData.currency || "KES",
          banner_image: eventData.banner_image || null,
          agenda: eventData.agenda || [],
          learning_objectives: eventData.learning_objectives || [],
          rules: eventData.rules || [],
          attachments: eventData.attachments || [],
        });
      } catch (err) {
        console.error("Failed to fetch event data:", err);
        toast.error("Could not load event data for editing.");
      } finally {
        setIsFetchingEvent(false);
      }
    };

    fetchEvent();
  }, [isEditMode, eventSlug, reset]);

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (key === "banner_image") {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (!value) {
          formData.append(key, "");
        }
      } else if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (value != null) {
        formData.append(key, String(value));
      }
    });

    try {
      if (isEditMode) {
        await api.put(`/events/tutor-events/${eventSlug}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Event updated successfully!");
      } else {
        await api.post("events/tutor-events/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Event created successfully!");
        reset();
        setCurrentStep(0);
      }
    } catch (err) {
      const error = err as AxiosError<{ detail?: string; [key: string]: any }>;
      const errorData = error.response?.data || {};
      console.error("Backend validation error:", errorData);

      let errorMessage = errorData.detail;
      if (!errorMessage) {
        const firstErrorKey = Object.keys(errorData)[0];
        const firstErrorValue = errorData[firstErrorKey];
        if (Array.isArray(firstErrorValue) && firstErrorValue.length > 0) {
          if (
            typeof firstErrorValue[0] === "object" &&
            firstErrorValue[0] !== null
          ) {
            const nestedErrorKey = Object.keys(firstErrorValue[0])[0];
            errorMessage = firstErrorValue[0][nestedErrorKey][0];
          } else {
            errorMessage = firstErrorValue[0];
          }
        } else if (firstErrorKey) {
          errorMessage = `Please check the '${firstErrorKey}' field for errors.`;
        }
      }
      toast.error(
        errorMessage || "Something went wrong while saving the event."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    const currentFields = steps[currentStep].fields;
    const valid = await trigger(currentFields, { shouldFocus: true });
    if (!valid) {
      toast.warning("Please fix errors before proceeding.");
      return;
    }
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (isFetchingOptions || isFetchingEvent) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        {/* UPDATED: Themed loader */}
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">
          {isFetchingEvent ? "Loading event data..." : "Loading form options..."}
        </p>
      </div>
    );
  }

  return (
    // UPDATED: Responsive and themed card
    <Card className="max-w-4xl mx-4 sm:mx-auto my-8 p-0">
      <CardHeader className="p-6 bg-muted/10 border-b border-border">
        <CardTitle className="text-xl">
          {isEditMode ? "Edit Event" : "Create New Event"}
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? "Update your event details below."
            : "Fill out the event details step-by-step."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 p-6">
        {/* --- Responsive Stepper --- */}
        {/* Mobile Stepper */}
        <div className="md:hidden mb-6">
          <p className="text-sm font-semibold text-primary">
            Step {currentStep + 1} of {steps.length}
          </p>
          <h2 className="text-lg font-semibold text-foreground">
            {steps[currentStep].title}
          </h2>
        </div>

        {/* Desktop Stepper (Themed) */}
        <div className="hidden md:flex items-center mb-8 border-b border-border pb-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={cn(
                  "flex items-center text-sm transition-colors duration-300",
                  currentStep > index
                    ? "text-primary"
                    : currentStep === index
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border-2 mr-2",
                    currentStep > index
                      ? "bg-primary border-primary text-primary-foreground"
                      : currentStep === index
                      ? "border-primary"
                      : "border-border"
                  )}
                >
                  {currentStep > index ? <Check size={14} /> : step.id}
                </div>
                {step.title}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 border-t-2 mx-4 transition-colors",
                    currentStep > index ? "border-primary" : "border-border"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Content */}
        <FormProvider {...methods}>
          <form
            id="event-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* Render the component for the current step */}
                {React.createElement(steps[currentStep].component, {
                  formOptions,
                })}
              </motion.div>
            </AnimatePresence>
          </form>
        </FormProvider>
      </CardContent>

      {/* UPDATED: Themed and Responsive Footer */}
      <CardFooter className="flex flex-col-reverse sm:flex-row justify-between border-t border-border p-6 gap-2">
        <div className="w-full sm:w-auto">
          {currentStep > 0 && (
            <Button
              onClick={prevStep}
              variant="outline"
              disabled={isLoading}
              className="rounded-md w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2" size={16} /> Previous
            </Button>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={isLoading}
              variant="secondary" // Use Teal
              className="rounded-md"
            >
              Next <ArrowRight className="ml-2" size={16} />
            </Button>
          ) : (
            <Button
              type="submit"
              form="event-form"
              disabled={isLoading}
              className="rounded-md w-full sm:w-[160px]"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isEditMode ? (
                <Save className="mr-2 h-4 w-4" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isLoading
                ? "Submitting..."
                : isEditMode
                ? "Save Changes"
                : "Submit Event"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}