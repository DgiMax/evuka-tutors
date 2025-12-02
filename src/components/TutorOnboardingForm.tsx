"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/axios";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  GraduationCap,
  Info,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";

import {
  tutorSchema,
  TutorOnboardingFormData,
  steps,
} from "./TutorFormTypes";

import Step1Basics from "./steps/Step1_Basics";
import Step2Details from "./steps/Step2_Details";
import Step3Expertise from "./steps/Step3_Expertise";

// --- Info Banner Component ---
const InfoBanner = () => (
  <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-2xl mx-4 sm:mx-auto">
    <div className="flex gap-3">
      <div className="bg-blue-100 p-2 rounded-full h-fit">
        <Info className="h-5 w-5 text-blue-600" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-blue-900">
          Create Your Tutor Profile
        </h3>
        <p className="text-sm text-blue-700 mt-1 leading-relaxed">
          Before you can teach or create an organization on <strong>e-vuka</strong>, you must set up your professional tutor profile.
        </p>
      </div>
    </div>
    <Button 
      variant="outline" 
      size="sm"
      className="shrink-0 bg-white hover:bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap"
      onClick={() => window.location.href = "https://e-vuka.com"} 
    >
      <LogOut className="h-4 w-4 mr-2" />
      Return to Student Site
    </Button>
  </div>
);

export default function TutorOnboardingPage() {
  const { fetchCurrentUser } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

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
    
    if (data.introVideoFile instanceof File) submission.append("intro_video_file", data.introVideoFile);
    if (data.profileImage instanceof File) submission.append("profile_image", data.profileImage);
    
    data.subjects.forEach((subject) => {
      submission.append("subjects", subject.name);
    });

    try {
      await api.post("/users/profile/tutor/", submission, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchCurrentUser();
      toast.success("Tutor profile created successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || "Failed to submit profile.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    const fields = steps[currentStep - 1].fields;
    const valid = await form.trigger(fields as any, { shouldFocus: true });
    
    if (!valid) return;
    
    if (currentStep < steps.length) {
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  return (
    <div className="w-full">
      <InfoBanner />

      <Card className="max-w-4xl mx-4 sm:mx-auto my-8 p-0">
        <CardHeader className="p-6 bg-muted/10 border-b border-border">
          <CardTitle className="text-xl flex items-center">
            <GraduationCap className="mr-3 h-6 w-6 text-primary" />
            Tutor Onboarding
          </CardTitle>
          <div className="pt-2">
            <p className="text-sm font-semibold text-primary">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
            </p>
          </div>
        </CardHeader>

        <CardContent className="pt-0 p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6 min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 1 && <Step1Basics form={form} />}
                  {currentStep === 2 && <Step2Details form={form} />}
                  {currentStep === 3 && <Step3Expertise form={form} />}
                </motion.div>
              </AnimatePresence>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col-reverse sm:flex-row justify-between border-t border-border p-6 gap-3 bg-muted/10">
          <div className="w-full sm:w-auto">
            <Button
              type="button"
              onClick={prevStep}
              variant="outline"
              disabled={currentStep === 1 || isLoading}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
          </div>

          <div className="w-full sm:w-auto">
            {currentStep < steps.length ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isLoading}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Complete Profile
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}