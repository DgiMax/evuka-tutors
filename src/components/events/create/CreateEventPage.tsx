"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Send,
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  X,
  LogOut,
  FileDown,
  AlertTriangle,
} from "lucide-react";

import api from "@/lib/api/axios";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

import { eventSchema, EventFormData } from "./EventFormSchema";
import { StepBasicInfo, StepEventDetails, StepSchedule, StepRegistration } from "./EventFormComponents";
import EventFormStepper from "./EventFormStepper";

interface CreateEventPageProps {
  isEditMode?: boolean;
  eventSlug?: string;
}

const STORAGE_KEY_PREFIX = "event_draft_";

const steps = [
  { id: 1, title: "Basic Info", component: StepBasicInfo, fields: ["title", "course", "event_type", "who_can_join", "overview", "description"] },
  { id: 2, title: "Details & Agenda", component: StepEventDetails, fields: ["learning_objectives", "agenda", "rules"] },
  { id: 3, title: "Schedule & Location", component: StepSchedule, fields: ["start_time", "end_time", "timezone", "location", "meeting_link"] },
  { id: 4, title: "Registration", component: StepRegistration, fields: ["max_attendees", "registration_deadline", "is_paid", "price", "currency", "banner_image"] },
];

export default function CreateEventPage({
  isEditMode = false,
  eventSlug,
}: CreateEventPageProps) {
  const router = useRouter();
  const { activeSlug } = useActiveOrg();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [formOptions, setFormOptions] = useState<any>(null);
  const [isFetchingOptions, setIsFetchingOptions] = useState(true);

  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exitSaveAsDraft, setExitSaveAsDraft] = useState(true);
  const [isProcessingExit, setIsProcessingExit] = useState(false);
  
  const isNavigatingAway = useRef(false);

  const storageKey = useMemo(() => {
    return isEditMode
      ? `${STORAGE_KEY_PREFIX}edit_${eventSlug}`
      : `${STORAGE_KEY_PREFIX}new`;
  }, [isEditMode, eventSlug]);

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

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: {
      title: "",
      course: undefined,
      event_status: "draft",
      timezone: "Africa/Nairobi",
      registration_open: true,
      is_paid: false,
      currency: "KES",
      agenda: [],
      learning_objectives: [],
      rules: [],
      attachments: [],
    },
    mode: "onBlur",
  });

  const { reset, watch, control, setValue, trigger, getValues } = form;
  const allFormValues = watch();
  const watchedTitle = watch("title");
  const watchedStatus = watch("event_status");

  const handleExitToCreateCourse = () => {
    isNavigatingAway.current = true;
    toast.info("Redirecting to create a course...");
    router.push("/courses/create");
  };

  useEffect(() => {
    const fetchOptions = async () => {
      setIsFetchingOptions(true);
      try {
        const response = await api.get("/events/tutor-events/form_options/");
        setFormOptions(response.data);
      } catch (error) {
        console.error("Failed to fetch form options:", error);
        toast.error("Failed to load form data. Please try refreshing.");
      } finally {
        setIsFetchingOptions(false);
      }
    };
    fetchOptions();
  }, []);

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
        if (isEditMode && eventSlug) {
            try {
                const response = await api.get(`/events/tutor-events/${eventSlug}/`);
                const data = response.data;
                reset({
                    ...data,
                    course: data.course?.id,
                    start_time: data.start_time?.slice(0, 16),
                    end_time: data.end_time?.slice(0, 16),
                    registration_deadline: data.registration_deadline?.slice(0, 16),
                    price: data.price ? Number(data.price) : 0,
                    max_attendees: data.max_attendees ? Number(data.max_attendees) : undefined,
                });
            } catch (err) {
                console.error("Failed to fetch event:", err);
                toast.error("Could not load event details.");
            }
        }
        setIsDataLoaded(true);
        setIsLoading(false);
    };
    if (formOptions) {
        loadInitialData();
    }
  }, [isEditMode, eventSlug, formOptions, reset, storageKey]);

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
    return eventSchema.safeParse({ ...allFormValues, event_status: "pending_approval" });
  }, [allFormValues]);

  const canPublish = validationResult.success;

  const handleFormSubmit = async (
    data: EventFormData,
    status: string,
    validate: boolean = true
  ) => {
    setIsLoading(true);
    const formData = new FormData();

    const cleanAgenda = (data.agenda || []).filter(item => item.time.trim() !== "" || item.title.trim() !== "");
    const cleanObjectives = (data.learning_objectives || []).filter(item => item.text.trim() !== "");
    const cleanRules = (data.rules || []).filter(item => item.title.trim() !== "" || item.text.trim() !== "");

    Object.entries(data).forEach(([key, value]) => {
        if (key === "banner_image") {
            if (value instanceof File) {
                formData.append(key, value);
            }
        } else if (key === "agenda") {
            formData.append(key, JSON.stringify(cleanAgenda));
        } else if (key === "learning_objectives") {
            formData.append(key, JSON.stringify(cleanObjectives));
        } else if (key === "rules") {
            formData.append(key, JSON.stringify(cleanRules));
        } else if (key === "price" || key === "max_attendees" || key === "course") {
            if (value !== undefined && value !== null && value !== "") {
              formData.append(key, String(value));
            }
        } else if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });

    formData.set("event_status", status);

    try {
      const response = isEditMode
        ? await api.put(`/events/tutor-events/${eventSlug}/`, formData)
        : await api.post("/events/tutor-events/", formData);
      
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}_step`);

      toast.success(isEditMode ? "Event Updated" : "Event Created", {
          description: status === 'draft' ? "Event saved as draft." : "Event submitted successfully."
      });

      isNavigatingAway.current = true;
      router.push("/events");
    } catch (error: any) {
      console.error("Submission failed:", error.response?.data);
      const serverErrors = error.response?.data;
      if (serverErrors && typeof serverErrors === 'object') {
        Object.entries(serverErrors).forEach(([field, msg]) => {
          toast.error(`${field}: ${msg}`);
        });
      } else {
        toast.error(error.response?.data?.detail || "An error occurred during submission.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const processForm: SubmitHandler<EventFormData> = async (data) => {
    if (data.event_status !== 'draft' && !canPublish) {
        toast.error("Please fill in all required fields before submitting.");
        return;
    }
    await handleFormSubmit(data, "pending_approval", true);
  };

  const onSaveDraft = async () => {
    const data = form.getValues();
    const isValid = await trigger(["title", "course"]);
    if (!isValid) {
        toast.error("Title and Course are required to save a draft.");
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
    toast.info("Event creation cancelled. Draft discarded.");
    router.push("/events");
  };

  const nextStep = async () => {
    const currentFields = steps[currentStep - 1].fields as any;
    const output = await trigger(currentFields, { shouldFocus: true });
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
        <div className="min-h-screen bg-background flex flex-col font-sans text-foreground px-0 sm:px-8">
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
              </div>
            </main>
          </div>
        </div>
      </SkeletonTheme>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-foreground px-0 px-2 md:px-8 py-2 md:py-8">
      <div className="flex-1 flex flex-col md:flex-row container mx-auto gap-4 md:gap-8 pt-6 pb-16 md:pb-20 px-4 sm:px-0">
        <aside className="w-full md:w-64 shrink-0">
            <div className="md:sticky md:top-16 bg-transparent rounded-md p-0">
                <EventFormStepper steps={steps as any} currentStep={currentStep} />
            </div>
        </aside>
        <main className="flex-1 max-w-4xl w-full">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {isEditMode ? "Edit Event" : "Create New Event"}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mt-2">
                    {isEditMode ? "Update your event details below." : "Fill out the details step-by-step."}
                </p>
            </div>
            <Form {...form}>
                <form
                    id="event-create-form"
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
                            {React.createElement(steps[currentStep - 1].component, {
                                formOptions,
                                activeSlug,
                                onExitToCreateCourse: handleExitToCreateCourse
                            })}
                        </motion.div>
                    </AnimatePresence>
                </form>
            </Form>
        </main>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-md z-40 supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between p-3 sm:p-4 gap-2">
          <div className="flex items-center shrink-0">
            <Button
              onClick={() => setShowExitDialog(true)}
              variant="ghost"
              type="button"
              className="text-muted-foreground hover:text-destructive px-2 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm font-medium"
            >
              <X className="mr-1 sm:mr-2 h-4 w-4" /> Cancel & Exit
            </Button>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 justify-end flex-1 min-w-0">
            {currentStep > 1 && (
              <Button
                onClick={prevStep}
                variant="outline"
                type="button"
                disabled={isLoading}
                className="rounded-md h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm shrink-0 font-medium"
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
                  className="rounded-md h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm shrink-0 font-medium"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-1 sm:mr-2 h-4 w-4" />}
                  Save Draft
                </Button>
                <Button
                  onClick={nextStep}
                  className="rounded-md h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm shrink-0 font-semibold"
                  type="button"
                  disabled={isLoading}
                >
                  Next Step <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <Button
                  type="submit"
                  form="event-create-form"
                  disabled={isLoading || (watchedStatus !== 'draft' && !canPublish)}
                  className="rounded-md h-9 sm:h-10 px-3 sm:px-6 text-xs sm:text-sm min-w-[100px] sm:min-w-[140px] font-semibold shadow-sm"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-1 sm:mr-2 h-4 w-4" />
                  )}
                  {isLoading ? "Submitting..." : (watchedStatus === 'draft' ? "Save Draft" : "Submit Event")}
                </Button>
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
                        ? "You are about to leave the event editor. You can save your progress as a draft to finish later, or discard your changes."
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