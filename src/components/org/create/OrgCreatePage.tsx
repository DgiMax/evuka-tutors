"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { 
  Send, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Loader2, 
  X, 
  Info, 
  Layers, 
  Image as ImageIcon, 
  FileText,
  AlertTriangle,
  LogOut,
  FileDown
} from "lucide-react";

import api from "@/lib/api/axios";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

import { orgFormSchema, OrgFormValues } from "./OrgFormSchema";
import { StepBasics, StepBranding, StepPolicies, StepFinalize } from "./OrgFormComponents";
import OrgFormStepper from "./OrgFormStepper";

const steps = [
  { id: 1, title: "Basics", icon: Info },
  { id: 2, title: "Branding", icon: ImageIcon },
  { id: 3, title: "Policies", icon: FileText },
  { id: 4, title: "Structure & Publish", icon: Layers },
];

const STORAGE_KEY_PREFIX = "org_draft_";

export default function OrgCreatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exitSaveAsDraft, setExitSaveAsDraft] = useState(true);
  const [isProcessingExit, setIsProcessingExit] = useState(false);
  
  const isNavigatingAway = useRef(false);

  const storageKey = `${STORAGE_KEY_PREFIX}new`;

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

  const methods = useForm<OrgFormValues>({
    resolver: zodResolver(orgFormSchema) as any,
    defaultValues: {
      name: "",
      status: "draft",
      org_type: "", 
      membership_period: "", 
      membership_duration_value: 1,
      membership_price: 0,
      levels: [],
      categories: [],
      branding: {},
      policies: {},
    },
    mode: "onBlur",
  });

  const { handleSubmit, reset, trigger, getValues, watch } = methods;
  const allValues = watch();
  const watchedName = watch("name");
  const watchedStatus = watch("status");

  const missingFields = useMemo(() => {
    const missing = [];
    
    if (!allValues.name || allValues.name.length < 3) missing.push("Name");
    if (!allValues.org_type) missing.push("Organization Type");
    if (!allValues.description || allValues.description.length < 10) missing.push("Description");
    
    if (!allValues.membership_period) {
        missing.push("Membership Period");
    } else if (allValues.membership_period !== 'free') {
        if (allValues.membership_price === undefined || allValues.membership_price === null || allValues.membership_price <= 0) {
            missing.push("Membership Price");
        }
    }

    if (!allValues.levels || allValues.levels.length === 0) missing.push("Levels");
    if (!allValues.categories || allValues.categories.length === 0) missing.push("Categories");

    const policies = allValues.policies || {};
    if (!policies.terms_of_service || policies.terms_of_service.length < 10) missing.push("Terms of Service");
    if (!policies.privacy_policy || policies.privacy_policy.length < 10) missing.push("Privacy Policy");

    return missing;
  }, [allValues]);

  const canSubmit = missingFields.length === 0;

  useEffect(() => {
    const loadDraft = () => {
        const savedStep = localStorage.getItem(`${storageKey}_step`);
        if (savedStep) setCurrentStep(parseInt(savedStep));

        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                reset(parsed);
                if (parsed.name) {
                    toast.info("Draft restored.");
                }
            } catch (e) {
                console.error("Draft parse error", e);
            }
        }
        setIsDataLoaded(true);
    };
    loadDraft();
  }, [reset, storageKey]);

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

  const submitData = async (data: OrgFormValues, status: string, validate: boolean = true) => {
    setIsLoading(true);
    const formData = new FormData();

    formData.append("status", status);
    formData.append("name", data.name);
    if (data.org_type) formData.append("org_type", data.org_type);
    if (data.description) formData.append("description", data.description);
    
    formData.append("membership_price", (data.membership_price || 0).toString());
    if (data.membership_period) formData.append("membership_period", data.membership_period);
    if (data.membership_duration_value) formData.append("membership_duration_value", data.membership_duration_value.toString());

    formData.append("levels", JSON.stringify(data.levels || []));
    formData.append("categories", JSON.stringify(data.categories || []));
    formData.append("branding", JSON.stringify(data.branding || {}));
    formData.append("policies", JSON.stringify(data.policies || {}));

    if (data.logo instanceof File) {
        formData.append("logo", data.logo);
    }

    try {
        const res = await api.post("/organizations/create/", formData);
        localStorage.removeItem(storageKey);
        localStorage.removeItem(`${storageKey}_step`);
        
        toast.success(status === 'draft' ? "Organization saved as Draft" : "Organization Submitted!");
        
        isNavigatingAway.current = true;
        router.push(`/${res.data.slug}`);
    } catch (error: any) {
        console.error("Creation Error:", error.response?.data);
        let msg = "Failed to save organization.";
        if (error.response?.data) {
            const keys = Object.keys(error.response.data);
            if (keys.length > 0) {
                const firstError = error.response.data[keys[0]];
                msg = `${keys[0]}: ${Array.isArray(firstError) ? firstError[0] : firstError}`;
            }
        }
        toast.error(msg);
    } finally {
        setIsLoading(false);
    }
  };

  const onSubmitFull = async (data: OrgFormValues) => {
    if (!canSubmit) {
        toast.error("Please fill in all required fields.");
        return;
    }
    submitData(data, data.status); 
  };

  const onSaveDraft = async () => {
    const isValid = await trigger("name");
    if (!isValid) {
        toast.error("Organization Name is required to save a draft.");
        return;
    }
    const data = getValues();
    submitData(data, "draft", false);
  };

  const handleConfirmExit = async () => {
    setIsProcessingExit(true);
    isNavigatingAway.current = true;

    if (watchedName && exitSaveAsDraft) {
        const data = getValues();
        try {
            await submitData(data, "draft", false);
        } catch(e) {
            setIsProcessingExit(false);
            isNavigatingAway.current = false;
        }
        return;
    }

    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}_step`);
    toast.info("Draft discarded.");
    router.push("/dashboard");
  };

  const nextStep = async () => {
    let isValid = false;
    if (currentStep === 1) isValid = await trigger("name"); 
    else isValid = true; 

    if (isValid && currentStep < steps.length) {
        setCurrentStep(s => s + 1);
    }
  };

  const renderStep = () => {
    switch(currentStep) {
        case 1: return <StepBasics />;
        case 2: return <StepBranding />;
        case 3: return <StepPolicies />;
        case 4: return <StepFinalize control={methods.control} canSubmit={canSubmit} missingFields={missingFields} />;
        default: return <StepBasics />;
    }
  };

  if (!isDataLoaded) {
    return (
      <SkeletonTheme baseColor="#f0f0f0" highlightColor="#f8f8f8">
        <div className="min-h-screen bg-background flex flex-col font-sans text-foreground px-0 sm:px-8">
          <div className="flex-1 flex flex-col md:flex-row container mx-auto gap-4 md:gap-8 pt-6 pb-48 md:pb-32 px-2 md:px-4 sm:px-0">
            <aside className="w-full md:w-60 shrink-0 hidden md:block">
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

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-foreground px-0 px-2 md:px-8 py-2 md:py-8">
      <div className="flex-1 flex flex-col md:flex-row container mx-auto gap-4 md:gap-8 pt-6 pb-16 md:pb-20 px-4 sm:px-0">
        <aside className="w-full md:w-60 shrink-0">
            <div className="md:sticky md:top-16 bg-transparent rounded-md p-0">
                <OrgFormStepper steps={steps} currentStep={currentStep} />
            </div>
        </aside>

        <main className="flex-1 max-w-4xl w-full">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create Organization</h1>
                <p className="text-sm md:text-base text-muted-foreground mt-2">Setup your school or network profile details.</p>
            </div>

            <FormProvider {...methods}>
                <Form {...methods}>
                    <form id="org-form" onSubmit={handleSubmit(onSubmitFull)} className="space-y-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderStep()}
                            </motion.div>
                        </AnimatePresence>
                    </form>
                </Form>
            </FormProvider>
        </main>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-md z-40 supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex items-center justify-between p-2 sm:p-4 gap-2">
                
                <div className="flex items-center shrink-0">
                    <Button
                        onClick={() => setShowExitDialog(true)}
                        variant="ghost"
                        type="button"
                        className="text-muted-foreground hover:text-destructive px-2 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm font-medium rounded-md"
                    >
                        <X className="mr-1 sm:mr-2 h-4 w-4" /> 
                        <span className="hidden xs:inline">Cancel & Exit</span>
                        <span className="xs:hidden">Exit</span>
                    </Button>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-3 justify-end flex-1 min-w-0">
                    {currentStep > 1 && (
                        <Button
                            onClick={() => setCurrentStep(s => s - 1)}
                            variant="outline"
                            type="button"
                            disabled={isLoading}
                            className="rounded-md h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm shrink-0 font-medium border shadow-none"
                        >
                            <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" /> 
                            <span className="hidden xs:inline">Back</span>
                        </Button>
                    )}

                    {currentStep < steps.length && (
                        <Button
                            onClick={onSaveDraft}
                            variant="secondary"
                            type="button"
                            disabled={isLoading}
                            className="rounded-md h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm shrink-0 font-medium shadow-none"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-1 sm:mr-2 h-4 w-4" />}
                            <span className="hidden sm:inline ml-1">Save Draft</span>
                            <span className="sm:hidden ml-1">Save</span>
                        </Button>
                    )}

                    {currentStep < steps.length && (
                        <Button
                            onClick={nextStep}
                            type="button"
                            disabled={isLoading}
                            className="rounded-md h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm shrink-0 font-semibold shadow-none"
                        >
                            <span className="hidden xs:inline">Next Step</span>
                            <span className="xs:hidden">Next</span>
                            <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
                        </Button>
                    )}

                    {currentStep === steps.length && (
                        <Button
                            type="submit"
                            form="org-form"
                            disabled={isLoading || (watchedStatus !== 'draft' && !canSubmit)}
                            className={cn(
                                "rounded-md h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm min-w-[80px] sm:min-w-[140px] font-semibold shrink-0 shadow-none", 
                                (canSubmit && watchedStatus !== 'draft') ? "bg-green-600 hover:bg-green-700 text-white" : ""
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-1 sm:mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-1 sm:mr-2 h-4 w-4" />
                            )}
                            <span className="whitespace-nowrap">
                                {isLoading ? "..." : (
                                    <>
                                        <span>{watchedStatus === 'draft' ? "Save" : "Submit"}</span>
                                        <span className="hidden xs:inline"> {watchedStatus === 'draft' ? "Draft" : "Organization"}</span>
                                    </>
                                )}
                            </span>
                        </Button>
                    )}
                </div>
            </div>
        </footer>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="rounded-md max-w-[95vw] md:max-w-md">
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    {watchedName ? "Unsaved Progress" : "Exit Creation Wizard?"}
                </AlertDialogTitle>
                <AlertDialogDescription className="pt-2">
                    {watchedName 
                        ? "You are about to leave the organization editor. You can save your progress as a draft to finish later, or discard your changes."
                        : "Are you sure you want to exit? Any information you have entered will be lost."}
                </AlertDialogDescription>
            </AlertDialogHeader>

            {watchedName && (
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
                    className={`${watchedName && exitSaveAsDraft 
                        ? "bg-primary hover:bg-primary/90" 
                        : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    } rounded-md`}
                >
                    {isProcessingExit ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : watchedName && exitSaveAsDraft ? (
                         <>
                            <FileDown className="mr-2 h-4 w-4" />
                            Save & Exit
                         </>
                    ) : (
                        <>
                            <LogOut className="mr-2 h-4 w-4" />
                            {watchedName ? "Discard & Exit" : "Exit"}
                        </>
                    )}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}