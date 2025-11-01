"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Control, UseFormWatch, SubmitHandler, type Resolver } from "react-hook-form";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
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
} from "lucide-react";

// Context and API
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CreateCourseViewProps {
  isEditMode?: boolean;
  courseSlug?: string;
}

// --- TYPE DEFINITIONS ---
interface DropdownOption {
  id: string;
  name: string;
}

interface FormOptionsData {
  globalCategories: DropdownOption[];
  globalLevels: DropdownOption[];
  orgCategories: DropdownOption[];
  orgLevels: DropdownOption[];
  context: "global" | "organization";
}

// ✅ NEW: Define course status types
type CourseStatus = "draft" | "pending_review" | "published";

const statusOptions: Record<CourseStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  published: "Published",
};

// ZOD SCHEMA
const courseFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100),
  short_description: z.string().min(10, "Too short!").max(200, "Keep it under 200 characters."),
  long_description: z.string().min(50, "Please provide a detailed description."),
  learning_objectives: z
    .array(z.object({ value: z.string().min(10, "Objective is too short.") }))
    .min(2, "Add at least 2 objectives.")
    .max(10, "Maximum 10 objectives allowed."),
  global_category: z.string().min(1, "Global category is required."),
  global_level: z.string().min(1, "Global level is required."),
  org_category: z.string().optional(),
  org_level: z.string().optional(),
  thumbnail: z.any().optional(),
  promo_video: z.union([z.string().url("Must be a valid URL."), z.literal("")]).optional(),
  price: z.number().optional(),
  status: z.enum(["draft", "pending_review", "published"]).default("draft"),
  modules: z
    .array(
      z.object({
        title: z.string().min(3, "Module title is required.").max(100),
        description: z.string().max(500).optional(),
        lessons: z
          .array(
            z.object({
              title: z.string().min(3, "Lesson title is required.").max(100),
              video_link: z.union([z.string().url("Must be a valid URL."), z.literal("")]).optional(),
            })
          )
          .min(1, "Module must have at least one lesson."),
      })
    )
    .min(1, "Course must have at least one module."),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

// --- Subcomponent: ModuleLessons ---
type ModuleLessonsProps = {
  moduleIndex: number;
  control: Control<CourseFormValues>;
  watch: UseFormWatch<CourseFormValues>;
};

const ModuleLessons = ({ moduleIndex, control, watch }: ModuleLessonsProps) => {
  const { fields: lessons, append: appendLesson, remove: removeLesson } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.lessons`,
  } as const);

  return (
    <div className="pl-4 border-l border-gray-300 ml-2">
      <h4 className="font-medium text-sm mb-2 text-gray-700">Lessons</h4>
      {lessons.map((lesson, lessonIndex) => (
        <Accordion key={lesson.id} type="single" collapsible className="w-full mb-2">
          <AccordionItem value={`lesson-${lesson.id}`} className="border rounded bg-white">
            <AccordionTrigger className="px-4 py-2 text-sm hover:no-underline">
              Lesson {lessonIndex + 1}: {watch(`modules.${moduleIndex}.lessons.${lessonIndex}.title`) || "New Lesson"}
            </AccordionTrigger>
            <AccordionContent className="space-y-3 p-4 border-t">
              <FormField
                control={control}
                name={`modules.${moduleIndex}.lessons.${lessonIndex}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Lesson Title</FormLabel>
                    <FormControl>
                      <ShadcnInput placeholder="e.g., Setting up your project" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`modules.${moduleIndex}.lessons.${lessonIndex}.video_link`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Video URL (Optional)</FormLabel>
                    <FormControl>
                      <ShadcnInput placeholder="https://youtube.com/watch?v=..." {...field} />
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
                  onClick={() => removeLesson(lessonIndex)}
                  disabled={lessons.length <= 1}
                >
                  <Trash2 size={14} className="mr-1" /> Remove Lesson
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ))}
      <Button type="button" variant="outline" size="sm" className="mt-2 rounded" onClick={() => appendLesson({ title: "", video_link: "" })}>
        <Plus className="mr-2" size={16} /> Add Lesson
      </Button>
    </div>
  );
};

// --- Main Component ---
const steps = [
  {
    id: 1,
    name: "Basic Info",
    icon: Info,
    fields: ["title", "short_description", "long_description", "learning_objectives", "global_category", "global_level", "org_category", "org_level"] as const,
  },
  { id: 2, name: "Curriculum", icon: BookOpen, fields: ["modules"] as const },
  { id: 3, name: "Media", icon: FileImage, fields: ["thumbnail", "promo_video"] as const },
  { id: 4, name: "Pricing & Publish", icon: DollarSign, fields: ["price", "status"] as const },
];

export default function CourseCreatePage({ isEditMode = false, courseSlug }: CreateCourseViewProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formOptions, setFormOptions] = useState<FormOptionsData | null>(null);
  const [isFetchingOptions, setIsFetchingOptions] = useState(true);

  const { user } = useAuth();
  const { activeSlug } = useActiveOrg();

  const isOrgAdminOrOwner = useMemo(() => {
      // If no user, no active org, or no organizations list, they can't be an admin
      if (!user || !activeSlug || !user.organizations) {
        return false;
      }
  
      // Find the user's membership for the *active* organization
      const activeOrgMembership = user.organizations.find(
        (org) => org.organization_slug === activeSlug
      );
  
      // Check if they have an 'admin' or 'owner' role
      if (activeOrgMembership && activeOrgMembership.role) {
        const role = activeOrgMembership.role.toLowerCase();
        return role === 'admin' || role === 'owner';
      }
  
      // Default to false
      return false;
    }, [user, activeSlug]);

  useEffect(() => {
  const fetchOptions = async () => {
    setIsFetchingOptions(true);
    try {
      console.log("=== FETCHING FORM OPTIONS ===", activeSlug || "(no active slug)");

      const url = activeSlug
        ? `/courses/form-options/?slug=${activeSlug}`
        : "/courses/form-options/";

      const response = await api.get(url);

      console.log("=== RAW RESPONSE FROM BACKEND ===");
      console.log(JSON.stringify(response.data, null, 2));

      const data = response.data;

      // ✅ Detect both camelCase and snake_case
      const normalized = {
        globalCategories:
          data.globalCategories || data.global_categories || [],
        globalLevels:
          data.globalLevels || data.global_levels || [],
        orgCategories:
          data.orgCategories || data.org_categories || [],
        orgLevels:
          data.orgLevels || data.org_levels || [],
        context: data.context || "global",
      };

      console.log("=== NORMALIZED FRONTEND DATA ===");
      console.log(JSON.stringify(normalized, null, 2));

      setFormOptions(normalized);
    } catch (error) {
      console.error("Failed to fetch form options:", error);
      toast.error("Failed to load form data. Please try refreshing.", { duration: 5000 });
    } finally {
      setIsFetchingOptions(false);
    }
  };

  fetchOptions();
}, [activeSlug]);



// Form setup
  // ---- NOTE: cast the resolver to the react-hook-form Resolver type to avoid the type incompatibility
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema) as unknown as Resolver<CourseFormValues>,
    defaultValues: {
      title: "",
      short_description: "",
      long_description: "",
      learning_objectives: [{ value: "" }, { value: "" }],
      global_category: "",
      global_level: "",
      org_category: "",
      org_level: "",
      status: "draft",
      price: undefined,
      promo_video: "",
      thumbnail: null,
      modules: [{ title: "", description: "", lessons: [{ title: "", video_link: "" }] }],
    },
    mode: "onBlur",
    shouldUnregister: false,
  });

  // ✅ 1. Destructure reset here to get a stable function reference
  const { reset } = form;

  useEffect(() => {
    const fetchCourse = async () => {
      if (!isEditMode || !formOptions) return;
      try {
        const response = await api.get(`/tutor-courses/${courseSlug}/`);
        const course = response.data;

        // ✅ 2. Use the destructure 'reset' function
        reset({
          title: course.title || "",
          short_description: course.short_description || "",
          long_description: course.long_description || "",
          learning_objectives:
            course.learning_objectives?.map((obj: string) => ({ value: obj })) || [{ value: "" }, { value: "" }],
          global_category: course.global_category?.toString() || "",
          global_level: course.global_level?.toString() || "",
          org_category: course.org_category?.toString() || "",
          org_level: course.org_level?.toString() || "",
          status: course.status || "draft",
          price: course.price ? parseFloat(course.price) : undefined,
          promo_video: course.promo_video || "",
          thumbnail: course.thumbnail || null,
          modules:
            course.modules?.map((mod: any) => ({
              title: mod.title,
              description: mod.description,
              lessons:
                mod.lessons?.map((les: any) => ({
                  title: les.title,
                  // ✅ 3. FIX: Convert null video_link to an empty string
                  video_link: les.video_link || "",
                })) || [],
            })) || [{ title: "", description: "", lessons: [{ title: "", video_link: "" }] }],
        });

      } catch (err) {
        console.error("❌ Failed to fetch course:", err);
        toast.error("Could not load course details for editing.");
      }
    };

    fetchCourse();
  // ✅ 4. Use the stable 'reset' function in the dependency array
  }, [isEditMode, courseSlug, formOptions, reset]);
  const { fields: objectives, append: appendObjective, remove: removeObjective } = useFieldArray({
    control: form.control,
    name: "learning_objectives",
  });

  const { fields: modules, append: appendModule, remove: removeModule } = useFieldArray({
    control: form.control,
    name: "modules",
  });

  const handleFormSubmit = async (data: CourseFormValues, status: CourseStatus, validate: boolean = true) => {
      setIsLoading(true);
      console.log(`Submitting course with status: ${status}`, data);
  
      // 1. Validation
      if (validate) {
        if (activeSlug) {
          if (!data.org_category || !data.org_level) {
            toast.error("Organization category and level are required for organization courses.", { duration: 4000 });
            setCurrentStep(1);
            if (!data.org_category) form.setError("org_category" as any, { type: "manual", message: "Required." });
            if (!data.org_level) form.setError("org_level" as any, { type: "manual", message: "Required." });
            setIsLoading(false);
            return;
          }
        }
      }

  const formData = new FormData();

    // Append simple fields
    formData.append("title", data.title);
    formData.append("short_description", data.short_description);
    formData.append("long_description", data.long_description);
    formData.append("global_category", data.global_category || "");
    formData.append("global_level", data.global_level || "");
    formData.append("org_category", data.org_category || "");
    formData.append("org_level", data.org_level || "");
    formData.append("promo_video", data.promo_video || "");
    formData.append("price", data.price?.toString() || "0");

    // ✅ UPDATED: Send status AND is_published for backend
    formData.append("status", status);
    formData.append("is_published", status === "published" ? "true" : "false");

    // 🧠 Handle arrays (stringify nested lists)
    formData.append("learning_objectives", JSON.stringify(data.learning_objectives));
    formData.append("modules", JSON.stringify(data.modules));

    // 🖼️ Append file if available
    if (data.thumbnail instanceof File) {
      formData.append("thumbnail", data.thumbnail);
    }

    // 3. API Call
    try {
    const response = isEditMode
    ? await api.put(`/tutor-courses/${courseSlug}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    : await api.post("/tutor-courses/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

    const { title: courseTitle, slug } = response.data;

    // ✅ Determine toast message
    let message = "";
    let description = "";

    if (isEditMode) {
      // --- Editing an existing course ---
      if (status === "published") {
        message = "✅ Course Updated & Published!";
        description = `Your course "${courseTitle}" changes are live.`;
        console.log("Course updated and published successfully:", response.data);
      } else if (status === "pending_review") {
        message = "🕓 Course Update Submitted for Review!";
        description = `Your updates to "${courseTitle}" have been submitted to admins.`;
        console.log("Course update submitted for review:", response.data);
      } else {
        message = "💾 Changes Saved!";
        description = `Updates to your course "${courseTitle}" have been saved as a draft.`;
        console.log("Course draft updated successfully:", response.data);
      }
    } else {
      // --- Creating a new course ---
      if (status === "published") {
        message = "🎉 Course Published!";
        description = `Your course "${courseTitle}" is now live.`;
        console.log("Course published successfully:", response.data);
      } else if (status === "pending_review") {
        message = "👍 Submitted for Review!";
        description = `Your course "${courseTitle}" has been submitted to admins.`;
        console.log("Course submitted for review:", response.data);
      } else {
        message = "💾 Draft Saved!";
        description = `Your course "${courseTitle}" has been saved as a draft.`;
        console.log("Course draft saved successfully:", response.data);
      }
    }

    // ✅ Use Sonner toast
    toast.success(
      <div className="flex flex-col gap-1">
        <p>{message}</p>
        <p className="text-sm text-gray-600">{description}</p>
        {slug && (
          <a
            href={`/courses/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600 font-medium"
          >
            🔗 View Course
          </a>
        )}
      </div>,
      { duration: 6000 }
    );


    // ✅ Reset form fields
    form.reset({
        title: "",
        short_description: "",
        long_description: "",
        learning_objectives: [{ value: "" }, { value: "" }],
        global_category: "",
        global_level: "",
        org_category: "",
        org_level: "",
        status: "draft",
        price: undefined,
        promo_video: "",
        thumbnail: null,
        modules: [
        { title: "", description: "", lessons: [{ title: "", video_link: "" }] },
        ],
    });

    // ✅ Go back to Step 1 (this triggers AnimatePresence to show the first form step)
    setCurrentStep(1);

    } catch (error: any) {
    console.error("❌ Course creation failed:", error);
    const errorData = error.response?.data;
    let message = "Something went wrong while saving your course.";

    if (errorData) {
        let mappedError = false;
        Object.keys(errorData).forEach((field) => {
        try {
            form.setError(field as any, {
            type: "server",
            message: Array.isArray(errorData[field])
                ? errorData[field].join(", ")
                : String(errorData[field]),
            });
            mappedError = true;
        } catch {
            // ignore mapping issues
        }
        });

        if (mappedError) message = "Please correct the errors highlighted below.";
        else if (errorData.detail) message = errorData.detail;
    }

    toast.error(message, { duration: 6000 });
    } finally {
    setIsLoading(false);
    }
  };

  const processForm: SubmitHandler<CourseFormValues> = async (data) => {
    await handleFormSubmit(data, data.status, true);
  };

  // ✅ NEW: Draft handler (no validation)
  const onSaveDraft = async () => {
    const data = form.getValues();
    await handleFormSubmit(data, "draft", false);
  };

  // Stepper Logic
  const nextStep = async () => {
    const currentFields = steps[currentStep - 1].fields;
    const fieldsToValidate = activeSlug ? currentFields : currentFields.filter((f) => f !== "org_category" && f !== "org_level");
    const output = await form.trigger(fieldsToValidate as any, { shouldFocus: true });
    if (!output) {
      toast.warning("Please correct the errors before proceeding.");
      return;
    }
    if (currentStep < steps.length) {
      setCurrentStep((step) => step + 1);
    }
  };
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((step) => step - 1);
    }
  };

  // Loading/Error States for Options
  if (isFetchingOptions) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-500">Loading form...</p>
      </div>
    );
  }
  if (!formOptions) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-600 font-medium">Error loading form data. Please refresh the page.</p>
      </div>
    );
  }

  const getAvailableStatusOptions = (): CourseStatus[] => {
    if (activeSlug) {
      return isOrgAdminOrOwner
        ? ["draft", "pending_review", "published"] // Admin can do all
        : ["draft", "pending_review"]; // Tutor can only draft or submit
    }
    return ["draft", "published"]; // Global user can draft or publish
  };
  const availableStatusOptions = getAvailableStatusOptions();

  const watchedStatus = form.watch("status");
    const getSubmitButtonText = (status: CourseStatus) => {
      if (isLoading) return "Submitting...";
      switch (status) {
        case "published":
          return "Publish Course";
        case "pending_review":
          return "Submit for Review";
        case "draft":
        default:
          return "Save as Draft";
      }
    };

  // --- Render ---
  return (
    <Card className="max-w-4xl mx-auto my-8 border border-gray-200 rounded text-black shadow-none">
      <CardTitle className="text-xl">
        {isEditMode ? "Edit Course" : "Create a New Course"} {activeSlug ? "for Organization" : "(Independent)"}
      </CardTitle>
      <CardDescription>
        {isEditMode ? "Update your course details below." : "Fill out the details step-by-step."}
      </CardDescription>

      <CardContent className="pt-6">
        {/* Stepper */}
        <div className="flex items-center mb-8 border-b border-gray-200 pb-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center text-sm transition-colors duration-300 ${
                  currentStep > index + 1 ? "text-blue-600" : currentStep === index + 1 ? "text-blue-600 font-semibold" : "text-gray-400"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full border-2 mr-2 ${
                    currentStep > index + 1 ? "bg-blue-600 border-blue-600 text-white" : currentStep === index + 1 ? "border-blue-600" : "border-gray-300"
                  }`}
                >
                  {currentStep > index + 1 ? <Check size={14} /> : step.id}
                </div>
                {step.name}
              </div>
              {index < steps.length - 1 && <div className="flex-1 border-t-2 border-gray-200 mx-4"></div>}
            </React.Fragment>
          ))}
        </div>

        {/* Form Content */}
        <Form {...form}>
          <form id="course-create-form" onSubmit={form.handleSubmit(processForm)} className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* STEP 1: Basic Info */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    {/* ✅ All FormFields below should now have the correct structure */}
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title</FormLabel>
                        <FormControl><ShadcnInput placeholder="e.g., The Ultimate Next.js Bootcamp" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="short_description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Description (Max 200 chars)</FormLabel>
                        <FormControl><Textarea maxLength={200} placeholder="A brief, catchy summary..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="long_description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Course Description</FormLabel>
                        <FormControl><Textarea rows={5} placeholder="Provide details about what students will learn..." {...field} /></FormControl>
                        <FormDescription>Markdown is supported.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div>
                      <FormLabel>Learning Objectives (Min 2)</FormLabel>
                      <FormDescription className="mb-2">What will students be able to do after this course?</FormDescription>
                      <div className="space-y-2">
                        {objectives.map((objField, index) => (
                          <FormField
                            key={objField.id}
                            control={form.control}
                            name={`learning_objectives.${index}.value`}
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2">
                                <FormControl><ShadcnInput placeholder={`Objective #${index + 1}`} {...field} /></FormControl>
                                <Button type="button" variant="ghost" size="icon" onClick={() => objectives.length > 2 && removeObjective(index)} disabled={objectives.length <= 2}>
                                  <Trash2 size={16} className="text-gray-500 hover:text-red-600"/>
                                </Button>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <Button type="button" variant="outline" size="sm" className="mt-2 rounded" onClick={() => appendObjective({ value: "" })}>
                        <Plus className="mr-2" size={16} /> Add Objective
                      </Button>
                      {form.formState.errors.learning_objectives?.message && <FormMessage className="mt-1">{String(form.formState.errors.learning_objectives.message)}</FormMessage>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-4 border-t">
                      {/* Global Category */}
                      <FormField
                        control={form.control}
                        name="global_category"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Marketplace Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                              <FormControl>
                                <SelectTrigger className="rounded">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {formOptions.globalCategories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id.toString()}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Global Level */}
                      <FormField
                        control={form.control}
                        name="global_level"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Difficulty Level</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                              <FormControl>
                                <SelectTrigger className="rounded">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {formOptions.globalLevels.map((lvl) => (
                                  <SelectItem key={lvl.id} value={lvl.id.toString()}>
                                    {lvl.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Organization Fields (Conditional) */}
                      {activeSlug && (
                        <>
                          <FormField
                            control={form.control}
                            name="org_category"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <FormLabel>Organization Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                                  <FormControl>
                                    <SelectTrigger className="rounded">
                                      <SelectValue placeholder="Select for organization..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {formOptions.orgCategories.length > 0 ? (
                                      formOptions.orgCategories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                          {cat.name}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <div className="p-2 text-sm text-gray-500">No org categories found.</div>
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="org_level"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <FormLabel>Organization Level</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                                  <FormControl>
                                    <SelectTrigger className="rounded">
                                      <SelectValue placeholder="Select for organization..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {formOptions.orgLevels.length > 0 ? (
                                      formOptions.orgLevels.map((lvl) => (
                                        <SelectItem key={lvl.id} value={lvl.id.toString()}>
                                          {lvl.name}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <div className="p-2 text-sm text-gray-500">No org levels found.</div>
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 2: Curriculum */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormDescription>Organize your course content into modules and lessons.</FormDescription>
                    {modules.map((moduleField, moduleIndex) => (
                      <Card key={moduleField.id} className="bg-gray-50 border rounded shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
                          <FormField
                            control={form.control}
                            name={`modules.${moduleIndex}.title`}
                            render={({ field }) => (
                              <FormItem className="flex-grow mr-2">
                                <FormControl>
                                  <ShadcnInput
                                    placeholder={`Module ${moduleIndex + 1} Title`}
                                    {...field}
                                    className="text-md font-semibold border-none shadow-none focus-visible:ring-1 focus-visible:ring-ring h-auto p-0 bg-transparent"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => modules.length > 1 && removeModule(moduleIndex)} disabled={modules.length <= 1}>
                            <Trash2 className="text-gray-500 hover:text-red-600" size={18} />
                          </Button>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <ModuleLessons moduleIndex={moduleIndex} control={form.control} watch={form.watch} />
                        </CardContent>
                      </Card>
                    ))}
                    <Button type="button" variant="outline" className="rounded" onClick={() => appendModule({ title: "", description: "", lessons: [{ title: "", video_link: "" }] })}>
                      <Plus className="mr-2" size={16} /> Add Module
                    </Button>
                    {form.formState.errors.modules?.message && <FormMessage>{String(form.formState.errors.modules.message)}</FormMessage>}
                  </div>
                )}

                {/* STEP 3: Media */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <FormField
                    control={form.control}
                    name="thumbnail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Course Thumbnail (Image)</FormLabel>
                        <FormControl>
                            <ShadcnInput
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                field.onChange(file);
                            }}
                            />
                        </FormControl>

                        {field.value && (
                          <div className="mt-2">
                            <img
                              src={typeof field.value === "string" ? field.value : URL.createObjectURL(field.value)}
                              alt="Preview"
                              className="h-32 w-auto rounded border object-cover"
                            />
                          </div>
                        )}

                        <FormDescription>Recommended: 720x405px.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField control={form.control} name="promo_video" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Promotional Video URL (Optional)</FormLabel>
                        <FormControl><ShadcnInput className="rounded" placeholder="e.g., https://vimeo.com/123456" {...field} /></FormControl>
                        <FormDescription>Link to Vimeo or YouTube.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}

                {/* STEP 4: Pricing & Publish */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (KES)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">KSh</span>
                            <ShadcnInput
                              type="number"
                              step="1"
                              min="0"
                              placeholder="0 (Free) or e.g., 1500"
                              className="pl-12 rounded"
                              {...field}
                              value={field.value ?? ''}
                              onChange={e => {
                                const val = e.target.value;
                                field.onChange(val === '' ? undefined : Number(val));
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Enter 0 or leave blank for a free course.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded border p-4 bg-gray-50">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Course Status</FormLabel>
                          <FormDescription>
                            {activeSlug && !isOrgAdminOrOwner
                              ? "Save as draft or submit for review."
                              : "Set the course status."}
                          </FormDescription>
                        </div>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-[180px] rounded">
                              <SelectValue placeholder="Select status..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableStatusOptions.map((statusKey) => (
                              <SelectItem key={statusKey} value={statusKey}>
                                {statusOptions[statusKey]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </Form>
      </CardContent>
      {/* Card Footer */}
      <CardFooter className="flex justify-between border-t pt-6">
        <div>
          {currentStep > 1 && (
            <Button onClick={prevStep} variant="outline" disabled={isLoading} className="rounded">
              <ArrowLeft className="mr-2" size={16} /> Previous
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={onSaveDraft} variant="secondary" disabled={isLoading} className="rounded">
            <Save className="mr-2" size={16} /> {isLoading ? "Saving..." : "Save Draft"}
          </Button>

          {currentStep < steps.length && (
            <Button onClick={nextStep} disabled={isLoading} className="rounded bg-[#2694C6] hover:bg-[#1f7ba5]">
              Next <ArrowRight className="ml-2" size={16} />
            </Button>
          )}

          {currentStep === steps.length && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded"><Eye className="mr-2" size={16} /> Preview</Button>
              </DialogTrigger>
              <DialogContent className="rounded">
                <DialogHeader>
                  <DialogTitle>Course Preview (Basic)</DialogTitle>
                  <DialogDescription>Quick look before publishing.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 mt-4">
                  <h3 className="font-bold text-lg">{form.watch("title")}</h3>
                  <p className="text-sm text-muted-foreground">{form.watch("short_description")}</p>
                  <p className="font-bold text-xl">{form.watch("price") != null && Number(form.watch("price")) > 0 ? `KSh ${form.watch("price")}` : "Free"}</p>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {currentStep === steps.length && (
            <Button
              type="submit"
              form="course-create-form"
              disabled={isLoading}
              className="rounded bg-green-600 hover:bg-green-700 w-[180px]"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : watchedStatus === "published" || watchedStatus === "pending_review" ? (
                <Send className="mr-2 h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {getSubmitButtonText(watchedStatus)}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
