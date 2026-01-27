"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Send,
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  Loader2,
  X,
  LogOut,
  FileDown,
  AlertTriangle,
} from "lucide-react";

import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox"; 
import { Label } from "@/components/ui/label"; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  courseFormSchema,
  type CourseFormValues,
  type FormOptionsData,
  type CourseStatus,
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

const STORAGE_KEY_PREFIX = "course_draft_";

export default function CourseCreatePage({
  isEditMode = false,
  courseSlug,
}: CreateCourseViewProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [formOptions, setFormOptions] = useState<FormOptionsData | null>(null);
  const [isFetchingOptions, setIsFetchingOptions] = useState(true);
  
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exitSaveAsDraft, setExitSaveAsDraft] = useState(true);
  const [isProcessingExit, setIsProcessingExit] = useState(false);
  
  const isNavigatingAway = useRef(false);

  const { user } = useAuth();
  const { activeSlug } = useActiveOrg();

  const storageKey = useMemo(() => {
    return isEditMode
      ? `${STORAGE_KEY_PREFIX}edit_${courseSlug}`
      : `${STORAGE_KEY_PREFIX}new`;
  }, [isEditMode, courseSlug]);

  const dashboardUrl = useMemo(() => {
    return activeSlug ? `/${activeSlug}/` : "/";
  }, [activeSlug]);

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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isNavigatingAway.current) return;

      if (isDataLoaded) {
        e.preventDefault();
        e.returnValue = ""; 
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDataLoaded]);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema) as any,
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
      instructors: [],
      modules: [],
    },
    mode: "onBlur",
  });

  const { reset, watch, control, setValue, getValues } = form;
  const watchedGlobalCategoryFromForm = watch("global_category");
  const allFormValues = watch();
  const watchedTitle = watch("title");

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
        toast.error("Failed to load form data. Please try refreshing.");
      } finally {
        setIsFetchingOptions(false);
      }
    };
    fetchOptions();
  }, [activeSlug]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);

      const savedStep = localStorage.getItem(`${storageKey}_step`);
      if (savedStep) {
        setCurrentStep(parseInt(savedStep));
      }

      const savedData = localStorage.getItem(storageKey);

      if (!isEditMode && savedData) {
        try {
          const parsed = JSON.parse(savedData);
          reset(parsed);
          setIsDataLoaded(true);
          setIsLoading(false);
          
          if (parsed.title) {
              toast.info("Restored your draft from where you left off.");
          }
          return;
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }

      if (isEditMode && courseSlug) {
        try {
          const response = await api.get(`/tutor-courses/${courseSlug}/`);
          const course = response.data;
          reset({
            title: course.title || "",
            short_description: course.short_description || "",
            long_description: course.long_description || "",
            learning_objectives:
              course.learning_objectives?.map((obj: string) => ({
                value: obj,
              })) || [{ value: "" }, { value: "" }],
            global_category: course.global_category?.toString() || "",
            global_subcategory: course.global_subcategory?.toString() || "",
            global_level: course.global_level?.toString() || "",
            org_category: course.org_category?.toString() || "",
            org_level: course.org_level?.toString() || "",
            status: course.status || "draft",
            price: course.price ? parseFloat(course.price) : undefined,
            promo_video: getExistingFileUrl(course.promo_video),
            thumbnail: getExistingFileUrl(course.thumbnail),
            instructors: course.instructors || [],
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
                    content: les.content || "",
                    video_file: getExistingFileUrl(les.video_file),
                    resources:
                      les.resources?.map((res: any) => ({
                        id: res.id,
                        title: res.title,
                        description: res.description,
                        resource_type: res.resource_type,
                        external_url: res.external_url,
                        course_book: res.course_book,
                        reading_instructions: res.reading_instructions,
                        file: getExistingFileUrl(res.file),
                      })) || [],
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
                  })) || [],
              })) || [],
          });
        } catch (err) {
          console.error("Failed to fetch course:", err);
          toast.error("Could not load course details.");
        }
      }

      setIsDataLoaded(true);
      setIsLoading(false);
    };

    if (formOptions) {
      loadInitialData();
    }
  }, [isEditMode, courseSlug, formOptions, reset, storageKey]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const subscription = watch((value) => {
      localStorage.setItem(storageKey, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [watch, storageKey, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem(`${storageKey}_step`, currentStep.toString());
  }, [currentStep, storageKey, isDataLoaded]);

  const validationResult = useMemo(() => {
    return courseFormSchema.safeParse({
      ...allFormValues,
      status: "published",
    });
  }, [allFormValues]);

  const canPublish = validationResult.success;

  const missingFields = useMemo(() => {
    if (validationResult.success) return [];
    const errors = validationResult.error.issues.map((issue) =>
      String(issue.path[0])
    );
    return [...new Set(errors)];
  }, [validationResult]);

  useEffect(() => {
    if (!canPublish && allFormValues.status !== "draft") {
      const timer = setTimeout(() => {
        setValue("status", "draft", { shouldValidate: true });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [canPublish, allFormValues.status, setValue]);

  const filteredSubCategories = useMemo(() => {
    if (!formOptions || !watchedGlobalCategoryFromForm) {
      return [];
    }
    return formOptions.globalSubCategories.filter(
      (sub) => sub.parent_id === watchedGlobalCategoryFromForm
    );
  }, [formOptions, watchedGlobalCategoryFromForm]);

  const handleFormSubmit = async (
    data: CourseFormValues,
    status: CourseStatus,
    validate: boolean = true
  ) => {
    setIsLoading(true);

    if (validate) {
      if (activeSlug) {
        if (!data.org_category || !data.org_level) {
          toast.error("Organization category and level are required.");
          setCurrentStep(1);
          if (!data.org_category)
            form.setError("org_category", {
              type: "manual",
              message: "Required.",
            });
          if (!data.org_level)
            form.setError("org_level", {
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
    formData.append("short_description", data.short_description || "");
    formData.append("long_description", data.long_description || "");

    if (data.global_category)
      formData.append("global_category", data.global_category);
    if (data.global_subcategory)
      formData.append("global_subcategory", data.global_subcategory);
    if (data.global_level) formData.append("global_level", data.global_level);
    if (data.org_category) formData.append("org_category", data.org_category);
    if (data.org_level) formData.append("org_level", data.org_level);

    formData.append("price", data.price != null ? data.price.toString() : "0");
    formData.append("status", status);
    formData.append("is_published", status === "published" ? "true" : "false");

    if (data.instructors && data.instructors.length > 0) {
      data.instructors.forEach((id) =>
        formData.append("instructors", id.toString())
      );
    }

    if (data.thumbnail instanceof File) {
      formData.append("thumbnail", data.thumbnail);
    }
    if (data.promo_video) {
      formData.append("promo_video", data.promo_video);
    }

    const modulesToSubmit = (data.modules || []).map((mod, modIndex) => ({
      ...mod,
      assignments: mod.assignments || [],
      lessons: (mod.lessons || []).map((les, lesIndex) => {
        const quizzesToSubmit = les.quizzes || [];
        const resourcesToSubmit = (les.resources || []).map(
          (res, resIndex) => {
            const resData = { ...res };
            if (res.file instanceof File) {
              const uniqueResKey = `res_file_m${modIndex}_l${lesIndex}_r${resIndex}`;
              formData.append(uniqueResKey, res.file);
              resData.file = uniqueResKey;
            }
            return resData;
          }
        );

        const lessonData: any = {
          title: les.title,
          content: les.content || "",
          quizzes: quizzesToSubmit,
          resources: resourcesToSubmit,
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

    formData.append(
      "learning_objectives",
      JSON.stringify(data.learning_objectives || [])
    );
    formData.append("modules", JSON.stringify(modulesToSubmit));

    try {
      const response = isEditMode
        ? await api.put(`/tutor-courses/${courseSlug}/`, formData)
        : await api.post("/tutor-courses/", formData);

      const { title: courseTitle } = response.data;

      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}_step`);

      toast.success(isEditMode ? "Course Updated" : "Course Created", {
        description:
          status === "published"
            ? `${courseTitle} is now live.`
            : `${courseTitle} saved as draft.`,
      });
        
      isNavigatingAway.current = true;

      if (!isEditMode && status !== "draft") {
        form.reset();
        setCurrentStep(1);
        router.push(dashboardUrl);
      } else {
        router.push(dashboardUrl);
      }

    } catch (error: any) {
      console.error("Submission failed:", error);
      toast.error("An error occurred during submission.");
    } finally {
      setIsLoading(false);
    }
  };

  const processForm: SubmitHandler<CourseFormValues> = async (data) => {
    if (data.status !== "draft" && !canPublish) {
      toast.error("Please fill in all required fields before publishing.");
      return;
    }
    await handleFormSubmit(data, data.status, true);
  };

  const onSaveDraft = async () => {
    const data = form.getValues();
    if(!data.title) {
        toast.error("Please enter a Title to save a draft.");
        return;
    }
    await handleFormSubmit(data, "draft", false);
  };

  const handleConfirmExit = async () => {
    setIsProcessingExit(true);
    
    isNavigatingAway.current = true;

    if (watchedTitle && exitSaveAsDraft) {
        const data = getValues();
        try {
            await handleFormSubmit(data, "draft", false);
        } catch(e) {
            setIsProcessingExit(false);
            isNavigatingAway.current = false; 
        }
        return;
    }

    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}_step`);
    toast.info("Course creation cancelled. Draft discarded.");
    
    router.push(dashboardUrl);
  };

  const nextStep = async () => {
    const currentFields = steps[currentStep - 1].fields;
    const fieldsToValidate = activeSlug
      ? currentFields
      : currentFields.filter((f) => f !== "org_category" && f !== "org_level");

    const output = await form.trigger(fieldsToValidate as any, {
      shouldFocus: true,
    });

    if (!output) {
      toast.warning("Please fill required fields.");
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

  if (isFetchingOptions || isLoading) {
    return (
      <SkeletonTheme baseColor="#f0f0f0" highlightColor="#f8f8f8">
        <div className="min-h-screen bg-white flex flex-col font-sans text-foreground px-2 md:px-8 py-2 md:py-8">
          <div className="flex-1 flex flex-col md:flex-row container mx-auto gap-4 md:gap-8 pt-6 pb-48 md:pb-32 px-2 md:px-4 sm:px-0">
            <aside className="w-full md:w-64 shrink-0 hidden md:block">
              <div className="space-y-6 mt-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton circle height={32} width={32} />
                    <div className="flex-1">
                      <Skeleton height={16} width="70%" />
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <main className="flex-1 max-w-4xl w-full">
              <div className="mb-6">
                <Skeleton height={32} width={250} className="mb-2" />
                <Skeleton height={16} width={350} />
              </div>

              <div className="rounded-md border bg-card text-card-foreground p-4 md:p-6 space-y-6">
                <div>
                  <Skeleton height={16} width={100} className="mb-2" />
                  <Skeleton height={40} className="w-full" />
                </div>
                
                <div>
                  <Skeleton height={16} width={120} className="mb-2" />
                  <Skeleton height={120} className="w-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <Skeleton height={16} width={100} className="mb-2" />
                      <Skeleton height={40} className="w-full" />
                   </div>
                   <div>
                      <Skeleton height={16} width={100} className="mb-2" />
                      <Skeleton height={40} className="w-full" />
                   </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </SkeletonTheme>
    );
  }

  if (!formOptions) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <p className="text-destructive font-medium">Error loading form data.</p>
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
  const watchedStatus = watch("status");

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-foreground px-0 px-2 md:px-8 py-2 md:py-8">
      <div className="flex-1 flex flex-col md:flex-row container mx-auto gap-4 md:gap-8 pt-6 pb-16 md:pb-20 px-4 sm:px-0">
        <aside className="w-full md:w-64 shrink-0"> 
            <div className="md:sticky md:top-16 bg-transparent rounded-md p-0">
                <CourseFormStepper steps={steps} currentStep={currentStep} />
            </div>
        </aside>

        <main className="flex-1 max-w-4xl w-full">
          <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {isEditMode ? "Edit Course" : "Create New Course"}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                  {isEditMode ? "Update your course content and settings." : "Follow the steps to set up your new course."}
              </p>
          </div>

          <Form {...form}>
            <form
              id="course-create-form"
              onSubmit={form.handleSubmit(processForm)}
              className="space-y-8"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
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
                      control={control}
                      watch={watch}
                      setValue={setValue}
                    />
                  )}
                  {currentStep === 3 && (
                    <Step3Media control={control} form={form} />
                  )}
                  {currentStep === 4 && (
                    <Step4Pricing
                      control={control}
                      availableStatusOptions={availableStatusOptions}
                      activeSlug={activeSlug}
                      isOrgAdminOrOwner={isOrgAdminOrOwner}
                      canPublish={canPublish}
                      missingFields={missingFields}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </form>
          </Form>
        </main>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur z-40 supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between p-3 md:p-4 gap-2">
          <div className="flex items-center shrink-0">
            <Button
              onClick={() => setShowExitDialog(true)}
              variant="ghost"
              type="button"
              className="text-muted-foreground hover:text-destructive px-2 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm"
            >
              <X className="mr-1 sm:mr-2 h-4 w-4" /> 
              <span className="hidden xs:inline">Cancel & Exit</span>
              <span className="xs:hidden">Exit</span>
            </Button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 justify-end flex-1 min-w-0">
            {currentStep > 1 && (
              <Button
                onClick={prevStep}
                variant="outline"
                type="button"
                disabled={isLoading}
                className="rounded-md h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm shrink-0"
              >
                <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" /> Back
              </Button>
            )}

            {currentStep < steps.length ? (
              <>
                <Button
                  onClick={onSaveDraft}
                  variant="secondary"
                  type="button"
                  disabled={isLoading}
                  className="rounded-md h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm shrink-0"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-1 sm:mr-2 h-4 w-4" />}
                  <span className="hidden sm:inline">Save Draft</span>
                  <span className="sm:hidden">Save</span>
                </Button>
                
                <Button
                  onClick={nextStep}
                  className="rounded-md h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm shrink-0"
                  type="button"
                  disabled={isLoading}
                >
                  Next <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-md h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm" type="button">
                      <Eye className="mr-1 sm:mr-2 h-4 w-4" /> 
                      <span className="hidden sm:inline">Preview</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] md:max-w-lg rounded-md">
                    <DialogHeader>
                      <DialogTitle>Course Preview (Basic)</DialogTitle>
                      <DialogDescription>Quick look before publishing.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 mt-4">
                      <h3 className="font-bold text-lg break-words">{form.watch("title")}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">{form.watch("short_description")}</p>
                      <p className="font-bold text-xl text-primary">
                      {form.watch("price") != null && Number(form.watch("price")) > 0
                        ? `KSh ${form.watch("price")}`
                        : "Free"}
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>

                {watchedStatus === 'draft' ? (
                  <Button
                    onClick={onSaveDraft}
                    disabled={isLoading}
                    type="button"
                    className="rounded-md h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm min-w-[100px] sm:min-w-[140px]"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-1 sm:mr-2 h-4 w-4" />
                    )}
                    Save Draft
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    form="course-create-form"
                    disabled={isLoading || !canPublish}
                    className="rounded-md h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm min-w-[100px] sm:min-w-[140px]"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-1 sm:mr-2 h-4 w-4" />
                    )}
                    <span className="whitespace-nowrap">
                      {watchedStatus === "published" ? "Publish" : "Submit"}
                    </span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </footer>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="rounded-md max-w-[95vw] md:max-w-md">
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    {watchedTitle ? "Unsaved Progress" : "Exit Creation Wizard?"}
                </AlertDialogTitle>
                <AlertDialogDescription className="pt-2">
                    {watchedTitle 
                        ? "You are about to leave the course editor. You can save your progress as a draft to finish later, or discard your changes."
                        : "Are you sure you want to exit? Any information you have entered will be lost."}
                </AlertDialogDescription>
            </AlertDialogHeader>

            {watchedTitle && (
                <div className="flex items-center space-x-2 py-4 px-1">
                    <Checkbox 
                        id="save-draft-mode" 
                        checked={exitSaveAsDraft}
                        onCheckedChange={(checked) => setExitSaveAsDraft(checked as boolean)}
                    />
                    <Label htmlFor="save-draft-mode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Save as draft before exiting
                    </Label>
                </div>
            )}

            <AlertDialogFooter className="gap-2 sm:gap-0 flex-col-reverse sm:flex-row">
                <AlertDialogCancel disabled={isProcessingExit} className="rounded-md mt-2 sm:mt-0">Cancel</AlertDialogCancel>
                
                <AlertDialogAction 
                    onClick={(e) => {
                        e.preventDefault(); 
                        handleConfirmExit();
                    }} 
                    disabled={isProcessingExit}
                    className={`${watchedTitle && exitSaveAsDraft 
                        ? "bg-primary hover:bg-primary/90" 
                        : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    } rounded-md`}
                >
                    {isProcessingExit ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : watchedTitle && exitSaveAsDraft ? (
                         <>
                            <FileDown className="mr-2 h-4 w-4" />
                            Save & Exit
                         </>
                    ) : (
                        <>
                            <LogOut className="mr-2 h-4 w-4" />
                            {watchedTitle ? "Discard & Exit" : "Exit"}
                        </>
                    )}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}