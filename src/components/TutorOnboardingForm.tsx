"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/axios";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  LogOut,
  Info,
  X,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  tutorSchema,
  TutorOnboardingFormData,
  steps,
} from "./TutorFormTypes";

import Step1Basics from "./steps/Step1_Basics";
import Step2Details from "./steps/Step2_Details";
import Step3Expertise from "./steps/Step3_Expertise";

const DiscardWarningModal = ({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-[95%] sm:max-w-[420px] p-0 gap-0 border-border/80 rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[5%] md:top-[10%] translate-y-0 shadow-none"
      >
        <DialogHeader className="px-4 md:px-6 py-4 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-red-100/50 flex items-center justify-center shrink-0 border border-red-200/60">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <DialogTitle className="text-base md:text-lg font-bold tracking-tight text-foreground">
              Discard Setup?
            </DialogTitle>
          </div>
          <DialogClose className="rounded-md p-2 hover:bg-muted transition -mr-2">
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </DialogClose>
        </DialogHeader>

        <div className="p-4 md:p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                Are you sure you want to leave the onboarding process?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All information entered will be permanently discarded and you will be redirected to the main platform.
              </p>
            </div>

            <div className="bg-red-50/50 border border-red-100 rounded-md p-3 flex gap-3 items-start">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-[10px] md:text-[11px] text-red-700 font-bold uppercase tracking-wider leading-normal">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 py-4 border-t bg-muted/20 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0 mt-auto">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="h-11 md:h-10 w-full sm:w-auto px-6 rounded-md font-bold text-[11px] md:text-xs uppercase tracking-widest border-border shadow-none bg-background"
          >
            Stay & Continue
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            className="h-11 md:h-10 w-full sm:w-auto px-6 rounded-md font-bold text-[11px] md:text-xs uppercase tracking-widest shadow-none bg-red-600 hover:bg-red-700"
          >
            Discard & Exit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const InternalStepper = ({ currentStep }: { currentStep: number }) => {
  return (
    <div className="flex flex-col w-full h-full p-0 md:p-6">
      <div className="md:hidden mb-6 w-full">
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
              Step {currentStep} of {steps.length}
            </span>
            <h2 className="text-lg font-bold text-foreground leading-none mt-1">
              {steps[currentStep - 1].title}
            </h2>
          </div>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="hidden md:flex flex-col gap-8 relative">
        <div className="absolute left-4 top-4 bottom-4 w-px bg-border -z-10" />
        {steps.map((step, index) => {
          const isActive = currentStep === index + 1;
          const isCompleted = currentStep > index + 1;

          return (
            <div key={step.id} className="flex items-center gap-4 group">
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 z-10 ${
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                    ? "border-primary bg-white text-primary"
                    : "border-muted-foreground/20 bg-white text-muted-foreground/40"
                }`}
              >
                {isCompleted ? <Check size={14} strokeWidth={3} /> : <span className="text-xs font-bold">{step.id}</span>}
              </div>
              <div className="flex flex-col">
                <span className={`text-sm transition-colors duration-300 ${
                  isActive || isCompleted ? "text-foreground" : "text-muted-foreground/40"
                }`}>
                  {step.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const OnboardingSkeleton = () => (
  <SkeletonTheme baseColor="#f0f0f0" highlightColor="#f8f8f8">
    <div className="min-h-screen bg-white flex flex-col px-2 md:px-8 py-2 md:py-8">
      <div className="flex-1 flex flex-col md:flex-row container mx-auto gap-4 md:gap-8 pt-6 pb-20 px-4">
        <aside className="w-full md:w-64 shrink-0 hidden md:block">
          <div className="space-y-8 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton circle height={32} width={32} />
                <Skeleton height={14} width="60%" />
              </div>
            ))}
          </div>
        </aside>
        <main className="flex-1 max-w-4xl w-full">
          <Skeleton height={32} width={250} className="mb-2" />
          <Skeleton height={16} width={400} className="mb-10" />
          <div className="rounded-md border border-border p-8 space-y-8">
            <Skeleton height={45} />
            <Skeleton height={180} />
            <Skeleton height={45} />
          </div>
        </main>
      </div>
    </div>
  </SkeletonTheme>
);

export default function TutorOnboardingPage() {
  const { fetchCurrentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const form = useForm<TutorOnboardingFormData>({
    resolver: zodResolver(tutorSchema),
    defaultValues: {
      profileImage: null,
      displayName: "",
      headline: "",
      bio: "",
      introVideoFile: null,
      subjects: [],
      education: "",
    },
    mode: "onBlur",
  });

  const onSubmit: SubmitHandler<TutorOnboardingFormData> = async (data) => {
    setIsLoading(true);
    const submission = new FormData();
    submission.append("display_name", data.displayName);
    submission.append("headline", data.headline);
    submission.append("bio", data.bio);
    submission.append("education", data.education);
    
    if (data.introVideoFile instanceof File) submission.append("intro_video", data.introVideoFile);
    if (data.profileImage instanceof File) submission.append("profile_image", data.profileImage);
    
    data.subjects.forEach((subject) => {
      submission.append("subjects", subject.name);
    });

    try {
      await api.post("/users/profile/tutor/", submission, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchCurrentUser();
      toast.success("Identity established");
      router.push("/");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Submission failed");
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    const fields = steps[currentStep - 1].fields;
    const valid = await form.trigger(fields as any, { shouldFocus: true });
    if (valid && currentStep < steps.length) {
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  if (authLoading) return <OnboardingSkeleton />;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-foreground px-2 md:px-8 py-2 md:py-8">
      <DiscardWarningModal 
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => window.location.href = "https://e-vuka.com"}
      />

      <div className="flex-1 flex flex-col md:flex-row container mx-auto gap-4 md:gap-8 pt-6 pb-24 md:pb-20 px-4 sm:px-0">
        
        <aside className="w-full md:w-64 shrink-0">
          <div className="md:sticky md:top-16">
            <InternalStepper currentStep={currentStep} />
          </div>
        </aside>

        <main className="flex-1 max-w-4xl w-full">
          <div className="bg-blue-50/30 border border-blue-100 rounded-md p-4 mb-8 flex items-start gap-4">
             <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
             <p className="text-[13px] text-blue-700 leading-relaxed">
               You are setting up a professional account. This profile will be visible to students and organizations across the platform.
             </p>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Professional Identity
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2">
              Follow the steps to establish your tutor profile.
            </p>
          </div>

          <Form {...form}>
            <form id="tutor-onboarding-form" className="space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-md border border-border p-6 md:p-10 bg-white"
                >
                  {currentStep === 1 && <Step1Basics form={form} />}
                  {currentStep === 2 && <Step2Details form={form} />}
                  {currentStep === 3 && <Step3Expertise form={form} />}
                </motion.div>
              </AnimatePresence>
            </form>
          </Form>
        </main>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-white/95 backdrop-blur z-40 shadow-none">
        <div className="container mx-auto flex items-center justify-between p-4 px-6 md:px-8">
          <Button
            variant="ghost"
            onClick={() => setShowExitModal(true)}
            className="text-muted-foreground hover:text-destructive font-bold text-[10px] uppercase tracking-[0.2em] shadow-none"
          >
            <LogOut className="mr-2 h-4 w-4" /> Discard & Exit
          </Button>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isLoading}
                className="rounded-md h-11 px-6 font-bold text-[10px] uppercase tracking-[0.2em] shadow-none border-border"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            )}

            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                disabled={isLoading}
                className="rounded-md h-11 px-8 font-bold text-[10px] uppercase tracking-[0.2em] shadow-none bg-primary hover:bg-primary/90"
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={isLoading}
                className="rounded-md h-11 px-8 font-bold text-[10px] uppercase tracking-[0.2em] shadow-none bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Finish Setup
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}