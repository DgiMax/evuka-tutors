// app/(tutor)/courses/create/page.tsx

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler, type Resolver } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Plus,
  Send,
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  Loader2,
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
import { Form } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// --- Refactored Imports ---
import {
  courseFormSchema,
  type CourseFormValues,
  type FormOptionsData,
  type CourseStatus,
  statusOptions,
  steps,
  getExistingFileUrl,
} from "./CourseFormTypes";
import CourseFormStepper from "./CourseFormStepper";
import Step1BasicInfo from "./forms/Step1_BasicInfo";
import Step2Curriculum from "./forms/Step2_Curriculum";
import Step3Media from "./forms/Step3_Media";
import Step4Pricing from "./forms/Step4_Pricing";

interface CreateCourseViewProps {
  isEditMode?: boolean;
  courseSlug?: string;
}

export default function CourseCreatePage({
  isEditMode = false,
  courseSlug,
}: CreateCourseViewProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formOptions, setFormOptions] = useState<FormOptionsData | null>(null);
  const [isFetchingOptions, setIsFetchingOptions] = useState(true);

  const { user } = useAuth();
  const { activeSlug } = useActiveOrg();

  // --- Logic ---
  const isOrgAdminOrOwner = useMemo(() => {
    if (!user || !activeSlug || !user.organizations) {
      return false;
    }
    const activeOrgMembership = user.organizations.find(
      (org) => org.organization_slug === activeSlug
    );
    if (activeOrgMembership && activeOrgMembership.role) {
      const role = activeOrgMembership.role.toLowerCase();
      return role === "admin" || role === "owner";
    }
    return false;
  }, [user, activeSlug]);

  useEffect(() => {
    const fetchOptions = async () => {
      setIsFetchingOptions(true);
      try {
        const url = activeSlug
          ? `/courses/form-options/?slug=${activeSlug}`
          : "/courses/form-options/";
        const response = await api.get(url);
        const data = response.data;
        const normalized = {
          globalCategories: data.globalCategories || [],
          globalSubCategories: data.globalSubCategories || [],
          globalLevels: data.globalLevels || [],
          orgCategories: data.orgCategories || [],
          orgLevels: data.orgLevels || [],
          context: data.context || "global",
        };
        setFormOptions(normalized);
      } catch (error) {
        console.error("Failed to fetch form options:", error);
        toast.error("Failed to load form data. Please try refreshing.", {
          duration: 5000,
        });
      } finally {
        setIsFetchingOptions(false);
      }
    };
    fetchOptions();
  }, [activeSlug]);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(
      courseFormSchema
    ) as unknown as Resolver<CourseFormValues>,
    defaultValues: {
      title: "",
      short_description: "",
      long_description: "",
      learning_objectives: [{ value: "" }, { value: "" }],
      global_category: "",
      global_subcategory: "",
      global_level: "",
      org_category: "",
      org_level: "",
      status: "draft",
      price: undefined,
      promo_video: null,
      thumbnail: null,
      modules: [
        {
          title: "",
          description: "",
          lessons: [{ title: "", video_file: null, quizzes: [] }],
          assignments: [],
        },
      ],
    },
    mode: "onBlur",
    shouldUnregister: false,
  });

  const { reset } = form;

  const watchedGlobalCategoryFromForm = form.watch("global_category");

  const filteredSubCategories = useMemo(() => {
    if (!formOptions || !watchedGlobalCategoryFromForm) {
      return [];
    }
    return formOptions.globalSubCategories.filter(
      (sub) => sub.parent_id === watchedGlobalCategoryFromForm
    );
  }, [formOptions, watchedGlobalCategoryFromForm]);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!isEditMode || !formOptions || !courseSlug) return;
      setIsLoading(true);
      try {
        const response = await api.get(`/tutor-courses/${courseSlug}/`);
        const course = response.data;
        reset({
          title: course.title || "",
          short_description: course.short_description || "",
          long_description: course.long_description || "",
          learning_objectives:
            course.learning_objectives?.map((obj: string) => ({ value: obj })) ||
            [{ value: "" }, { value: "" }],
          global_category: course.global_category?.toString() || "",
          global_subcategory: course.global_subcategory?.toString() || "",
          global_level: course.global_level?.toString() || "",
          org_category: course.org_category?.toString() || "",
          org_level: course.org_level?.toString() || "",
          status: course.status || "draft",
          price: course.price ? parseFloat(course.price) : undefined,
          promo_video: getExistingFileUrl(course.promo_video),
          thumbnail: getExistingFileUrl(course.thumbnail),
          modules:
            course.modules?.map((mod: any) => ({
              id: mod.id,
              title: mod.title,
              description: mod.description,
              assignments:
                mod.assignments?.map((assignment: any) => ({
                  id: assignment.id,
                  title: assignment.title,
                  description: assignment.description,
                  due_date: assignment.due_date,
                  max_score: assignment.max_score,
                })) || [],
              lessons:
                mod.lessons?.map((les: any) => ({
                  id: les.id,
                  title: les.title,
                  video_file: getExistingFileUrl(les.video_file),
                  quizzes:
                    les.quizzes?.map((quiz: any) => ({
                      id: quiz.id,
                      title: quiz.title,
                      description: quiz.description,
                      max_score: quiz.max_score,
                      time_limit_minutes: quiz.time_limit_minutes,
                      max_attempts: quiz.max_attempts,
                      questions:
                        quiz.questions?.map((question: any) => ({
                          id: question.id,
                          text: question.text,
                          question_type: question.question_type,
                          score_weight: question.score_weight,
                          instructor_hint: question.instructor_hint,
                          options:
                            question.options?.map((option: any) => ({
                              id: option.id,
                              text: option.text,
                              is_correct: option.is_correct,
                            })) || [],
                        })) || [],
                    })) || [],
                })) || [{ title: "", video_file: null }],
            })) || [
              {
                title: "",
                description: "",
                assignments: [],
                lessons: [{ title: "", video_file: null }],
              },
            ],
        });
      } catch (err) {
        console.error("❌ Failed to fetch course:", err);
        toast.error("Could not load course details for editing.");
      } finally {
        setIsLoading(false);
      }
    };

    if (isEditMode && formOptions) {
      fetchCourse();
    } else {
      setIsLoading(false);
    }
  }, [isEditMode, courseSlug, formOptions, reset]);

  // --- Form Submission Handler ---
  const handleFormSubmit = async (
    data: CourseFormValues,
    status: CourseStatus,
    validate: boolean = true
  ) => {
    setIsLoading(true);

    if (validate) {
      if (activeSlug) {
        if (!data.org_category || !data.org_level) {
          toast.error(
            "Organization category and level are required for organization courses.",
            { duration: 4000 }
          );
          setCurrentStep(1);
          if (!data.org_category)
            form.setError("org_category" as any, {
              type: "manual",
              message: "Required.",
            });
          if (!data.org_level)
            form.setError("org_level" as any, {
              type: "manual",
              message: "Required.",
            });
          setIsLoading(false);
          return;
        }
      }
    }

    const formData = new FormData();

    formData.append("title", data.title);
    formData.append("short_description", data.short_description);
    formData.append("long_description", data.long_description);
    formData.append("global_category", data.global_category || "");
    formData.append("global_subcategory", data.global_subcategory || "");
    formData.append("global_level", data.global_level || "");
    formData.append("org_category", data.org_category || "");
    formData.append("org_level", data.org_level || "");
    // 3. Reverted price logic to send "0" for free courses, matching your original code.
    formData.append("price", data.price?.toString() || "0"); 
    formData.append("status", status);
    formData.append("is_published", status === "published" ? "true" : "false");

    // Handle File fields
    if (data.thumbnail instanceof File) {
      formData.append("thumbnail", data.thumbnail);
    }
    if (data.promo_video) {
      formData.append("promo_video", data.promo_video);
    } else {
      formData.append("promo_video", "");
    }

    // Handle nested lesson files
    const modulesToSubmit = data.modules.map((mod, modIndex) => ({
      ...mod,
      assignments: mod.assignments || [],
      lessons: mod.lessons.map((les, lesIndex) => {
        const quizzesToSubmit = les.quizzes || [];
        const lessonData: any = {
          title: les.title,
          quizzes: quizzesToSubmit,
        };
        const videoFileValue = les.video_file;
        if (videoFileValue instanceof File) {
          const uniqueKey = `video_file_m${modIndex}_l${lesIndex}`;
          formData.append(uniqueKey, videoFileValue);
          lessonData.video_file = uniqueKey;
        } else if (typeof videoFileValue === "string" && videoFileValue) {
          lessonData.video_file = videoFileValue;
        } else {
          lessonData.video_file = null;
        }
        return lessonData;
      }),
    }));

    // Append JSON fields
    formData.append(
      "learning_objectives",
      JSON.stringify(data.learning_objectives)
    );
    formData.append("modules", JSON.stringify(modulesToSubmit));

    try {
      const response = isEditMode
        ? await api.put(`/tutor-courses/${courseSlug}/`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        : await api.post("/tutor-courses/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
      
      // (Rest of the try/catch/finally block is unchanged)
      const { title: courseTitle, slug } = response.data;
      let message = "";
      let description = "";
      let toastContent: React.ReactNode;

      if (isEditMode) {
        if (status === "published") {
          message = "✅ Course Updated & Published!";
          description = `Your course "${courseTitle}" changes are live.`;
        } else if (status === "pending_review") {
          message = "🕓 Course Update Submitted for Review!";
          description = `Your updates to "${courseTitle}" have been submitted to admins.`;
        } else {
          message = "💾 Changes Saved!";
          description = `Updates to your course "${courseTitle}" have been saved as a draft.`;
        }
        toastContent = (
          <div className="flex flex-col gap-1">
            <p>{message}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
            {slug && (
              <a
                href={`/courses/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary font-medium"
              >
                🔗 View Course
              </a>
            )}
          </div>
        );
      } else {
        if (status === "published") {
          message = "🎉 Course Published!";
          description = `Your course "${courseTitle}" is now live.`;
        } else if (status === "pending_review") {
          message = "👍 Submitted for Review!";
          description = `Your course "${courseTitle}" has been submitted to admins.`;
        } else {
          message = "💾 Draft Saved!";
          description = `Your course "${courseTitle}" has been saved as a draft.`;
        }
        toastContent = (
          <div className="flex flex-col gap-2">
            <p>{message}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
            <div className="border-t border-border pt-2 mt-1">
              <p className="font-semibold text-sm">What's next?</p>
              <p className="text-sm text-muted-foreground mb-2">
                Do you want to add a live class schedule (e.g., for weekly Q&A)
                to this course?
              </p>
              <Link href={`/courses/${slug}/live-classes/create`} passHref>
                <Button className="w-full">
                  <Plus className="mr-2" size={16} /> Add Live Classes
                </Button>
              </Link>
            </div>
          </div>
        );
      }
      toast.success(toastContent, { duration: 10000 });
      if (!isEditMode && status !== "draft") {
        form.reset();
        setCurrentStep(1);
      }
    } catch (error: any) {
      console.error("Submission failed:", error);
      if (error.response) {
        console.error("Server responded with:", error.response.data);
      }
      toast.error(
        "An error occurred during submission. Please check your network."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const processForm: SubmitHandler<CourseFormValues> = async (data) => {
    await handleFormSubmit(data, data.status, true);
  };

  const onSaveDraft = async () => {
    const data = form.getValues();
    await handleFormSubmit(data, "draft", false);
  };

  const nextStep = async () => {
    const currentFields = steps[currentStep - 1].fields;
    const fieldsToValidate = activeSlug
      ? currentFields
      : currentFields.filter(
          (f) => f !== "org_category" && f !== "org_level"
        );
    const output = await form.trigger(fieldsToValidate as any, {
      shouldFocus: true,
    });
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

  if (isFetchingOptions || (isEditMode && isLoading)) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading form...</p>
      </div>
    );
  }
  if (!formOptions) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-destructive font-medium">
          Error loading form data. Please refresh the page.
        </p>
      </div>
    );
  }

  const getAvailableStatusOptions = (): CourseStatus[] => {
    if (activeSlug) {
      return isOrgAdminOrOwner
        ? ["draft", "pending_review", "published"]
        : ["draft", "pending_review"];
    }
    return ["draft", "published"];
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
    <Card className="max-w-4xl mx-4 sm:mx-auto my-8 p-0">
      <CardHeader className="p-6 bg-muted/10 border-b border-border">
        <CardTitle className="text-xl">
          {isEditMode ? "Edit Course" : "Create a New Course"}{" "}
          {activeSlug ? "for Organization" : "(Independent)"}
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? "Update your course details below."
            : "Fill out the details step-by-step."}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 p-6">
        <CourseFormStepper steps={steps} currentStep={currentStep} />

        <Form {...form}>
          <form
            id="course-create-form"
            onSubmit={form.handleSubmit(processForm)}
            className="space-y-6 mt-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* --- Render Form Steps --- */}
                {currentStep === 1 && (
                  <Step1BasicInfo
                    form={form}
                    formOptions={formOptions}
                    filteredSubCategories={filteredSubCategories}
                    activeSlug={activeSlug}
                  />
                )}
                {currentStep === 2 && (
                  <Step2Curriculum
                    form={form}
                    control={form.control}
                    watch={form.watch}
                    setValue={form.setValue}
                  />
                )}
                {currentStep === 3 && (
                  <Step3Media control={form.control} form={form} />
                )}
                {currentStep === 4 && (
                  <Step4Pricing
                    control={form.control}
                    availableStatusOptions={availableStatusOptions}
                    activeSlug={activeSlug}
                    isOrgAdminOrOwner={isOrgAdminOrOwner}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col-reverse sm:flex-row justify-between border-t border-border p-6 gap-2">
        <div className="w-full sm:w-auto">
          {currentStep > 1 && (
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
          <Button
            onClick={onSaveDraft}
            variant="outline"
            disabled={isLoading}
            className="rounded-md"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2" size={16} />
            )}
            {isLoading ? "Saving..." : "Save Draft"}
          </Button>

          {currentStep < steps.length && (
            <Button
              onClick={nextStep}
              variant="secondary"
              disabled={isLoading}
              className="rounded-md"
            >
              Next <ArrowRight className="ml-2" size={16} />
            </Button>
          )}

          {currentStep === steps.length && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-md">
                  <Eye className="mr-2" size={16} /> Preview
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Course Preview (Basic)</DialogTitle>
                  <DialogDescription>
                    Quick look before publishing.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 mt-4">
                  <h3 className="font-bold text-lg text-foreground">
                    {form.watch("title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {form.watch("short_description")}
                  </p>
                  <p className="font-bold text-xl text-primary">
                    {form.watch("price") != null &&
                    Number(form.watch("price")) > 0
                      ? `KSh ${form.watch("price")}`
                      : "Free"}
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {currentStep === steps.length && (
            <Button
              type="submit"
              form="course-create-form"
              disabled={isLoading}
              className="rounded-md w-full sm:w-[180px]"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : watchedStatus === "published" ||
                watchedStatus === "pending_review" ? (
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