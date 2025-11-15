"use client";

import React, { useState, ChangeEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/axios";
import {
  useForm,
  FormProvider,
  useFormContext,
  useFieldArray,
  FieldErrors,
  Path,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Edit2,
  Upload,
  User,
  Video,
  X,
  BookOpen,
  GraduationCap,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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

// ----------------------------
// SUBMISSION TYPE
// ----------------------------
interface SubmissionData {
  profileImage: File | null;
  displayName: string;
  headline: string;
  bio: string;
  introVideoFile: File | null;
  subjects: string[];
  education: string;
}

// ----------------------------
// VALIDATION SCHEMA
// ----------------------------
const tutorSchema = z.object({
  profileImage: z.any().nullable().optional(),
  displayName: z.string().min(3, "Display name is required (min 3 characters)."),
  headline: z.string().min(10, "Headline must be at least 10 characters."),
  bio: z.string().min(20, "Bio must be at least 20 characters."),
  introVideoFile: z.any().nullable().optional(),

  subjects: z
    .array(
      z.object({
        name: z.string().min(1, "Subject name is required."),
      })
    )
    .min(1, "You must list at least one subject."),

  education: z.string().min(5, "Education details must be at least 5 characters."),
});

type TutorOnboardingFormData = z.infer<typeof tutorSchema>;

// ----------------------------
// IMAGE UPLOADER
// ----------------------------
const RHFImageUploader = () => {
  const { watch, setValue } = useFormContext<TutorOnboardingFormData>();
  const profileImage = watch("profileImage");
  const imagePreview =
    profileImage instanceof File ? URL.createObjectURL(profileImage) : null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setValue("profileImage", file, { shouldValidate: true });
  };

  const removeImage = () => setValue("profileImage", null, { shouldValidate: true });

  return (
    <FormItem className="flex flex-col items-center gap-4">
      <div className="relative h-32 w-32">
        {imagePreview ? (
          <>
            <img
              src={imagePreview}
              alt="Profile Preview"
              className="h-full w-full rounded-full object-cover"
            />

            <label
              htmlFor="profileImage"
              className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-blue-500 p-2 text-white shadow hover:bg-blue-600"
            >
              <Edit2 className="h-4 w-4" />
            </label>

            <button
              type="button"
              onClick={removeImage}
              className="absolute top-0 right-0 -mr-2 -mt-2 cursor-pointer rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600 z-10"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <label
            htmlFor="profileImage"
            className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:bg-gray-100"
          >
            <Upload className="h-8 w-8" />
            <span className="mt-1 text-sm">Upload Photo</span>
          </label>
        )}
      </div>

      <input
        id="profileImage"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <FormMessage />
    </FormItem>
  );
};

// ----------------------------
// SUBJECT INPUT
// ----------------------------
const RHFSubjectInput = () => {
  const { control, formState } = useFormContext<TutorOnboardingFormData>();
  const [inputValue, setInputValue] = useState("");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subjects",
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      const subjectName = inputValue.trim();

      if (!fields.some((field) => field.name === subjectName)) {
        append({ name: subjectName });
      }

      setInputValue("");
    }
  };

  const subjectError =
    (formState.errors.subjects as any)?.root?.message ||
    (fields.length === 0 && (formState.errors.subjects as any)?.message);

  return (
    <FormItem>
      <div className="space-y-1">
        <FormLabel>Subjects Taught (press Enter to add)</FormLabel>

        <div
          className={`flex flex-wrap gap-2 rounded border p-2 bg-white ${
            subjectError ? "border-red-500" : "border-gray-300"
          }`}
        >
          {fields.map((field, index) => (
            <span
              key={field.id}
              className="flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-sm text-blue-700"
            >
              {field.name}

              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded-full hover:bg-blue-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              fields.length === 0
                ? "e.g., React, Django, Next.js"
                : "Add another subject..."
            }
            className="min-w-[100px] flex-1 border-none p-1 text-sm outline-none"
          />
        </div>

        {subjectError && <FormMessage>{subjectError}</FormMessage>}
        <FormDescription>List the main subjects you teach.</FormDescription>
      </div>
    </FormItem>
  );
};

// ----------------------------
// VIDEO PREVIEWER
// ----------------------------
const VideoFilePreviewer = () => {
  const { watch, setValue } = useFormContext<TutorOnboardingFormData>();
  const introVideoFile = watch("introVideoFile");

  if (!introVideoFile) return null;

  const videoUrl =
    introVideoFile instanceof File ? URL.createObjectURL(introVideoFile) : "";

  const removeVideo = () =>
    setValue("introVideoFile", null, { shouldValidate: true });

  return (
    <div className="mt-4 p-4 border rounded-md bg-gray-50 space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">Video Preview</p>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={removeVideo}
        >
          <Trash2 className="h-3 w-3 mr-1" /> Remove
        </Button>
      </div>

      <div className="aspect-video w-full border border-gray-300 rounded overflow-hidden">
        <video
          width="100%"
          height="100%"
          controls
          src={videoUrl}
          className="object-cover w-full h-full"
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Recommended aspect ratio: 16:9 (Landscape)
      </p>
    </div>
  );
};

// ----------------------------
// STEP 1
// ----------------------------
const Step1 = () => {
  const { control } = useFormContext<TutorOnboardingFormData>();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="md:col-span-1 flex justify-center">
        <RHFImageUploader />
      </div>

      <div className="space-y-6 md:col-span-2">
        <FormField
          control={control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" /> Display Name
              </FormLabel>
              <FormControl>
                <ShadcnInput placeholder="e.g., Jane D." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="headline"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gray-400" /> Headline
              </FormLabel>
              <FormControl>
                <ShadcnInput
                  placeholder="e.g., Senior Django & React Developer"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

// ----------------------------
// STEP 2
// ----------------------------
const Step2 = () => {
  const { control, setValue } = useFormContext<TutorOnboardingFormData>();

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Detailed Bio</FormLabel>
            <FormControl>
              <Textarea
                rows={5}
                placeholder="Tell students about your teaching style, experience, and passion..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="introVideoFile"
        render={() => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Video className="h-4 w-4 text-gray-400" /> Introductory Video
              (Optional)
            </FormLabel>
            <FormControl>
              <ShadcnInput
                type="file"
                accept="video/*"
                value={undefined}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setValue("introVideoFile", file, { shouldValidate: true });
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <VideoFilePreviewer />
    </div>
  );
};

// ----------------------------
// STEP 3
// ----------------------------
const Step3 = () => {
  const { control } = useFormContext<TutorOnboardingFormData>();

  return (
    <div className="space-y-6">
      <RHFSubjectInput />

      <FormField
        control={control}
        name="education"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-400" /> Top Education
            </FormLabel>
            <FormControl>
              <ShadcnInput
                placeholder="e.g., B.Sc. Computer Science at University of Nairobi"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

// ----------------------------
// MAIN COMPONENT
// ----------------------------
export default function TutorOnboardingForm() {
  const { fetchCurrentUser } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const methods = useForm<TutorOnboardingFormData>({
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

  const { handleSubmit, trigger, setFocus } = methods;

  const steps = [
    {
      id: 1,
      title: "Profile Basics",
      component: <Step1 />,
      fields: ["displayName", "headline"] as const,
    },
    {
      id: 2,
      title: "Details & Video",
      component: <Step2 />,
      fields: ["bio"] as const,
    },
    {
      id: 3,
      title: "Expertise & Education",
      component: <Step3 />,
      fields: ["subjects", "education"] as const,
    },
  ];

  const submitProfile = async (formData: SubmissionData) => {
    const data = new FormData();

    data.append("display_name", formData.displayName);
    data.append("headline", formData.headline);
    data.append("bio", formData.bio);
    data.append("education", formData.education);

    if (formData.introVideoFile)
      data.append("intro_video_file", formData.introVideoFile);

    if (formData.profileImage)
      data.append("profile_image", formData.profileImage);

    formData.subjects.forEach((subject) => {
      data.append("subjects", subject);
    });

    await api.post("/users/profile/tutor/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    await fetchCurrentUser();
  };

  const onInvalid = (errors: FieldErrors<TutorOnboardingFormData>) => {
    toast.error("Please correct the errors marked in red before submitting.");

    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
      setFocus(firstErrorKey as Path<TutorOnboardingFormData>);

      const stepIndex = steps.findIndex((step) =>
        (step.fields as readonly string[]).includes(firstErrorKey)
      );

      if (stepIndex !== -1) setCurrentStep(stepIndex);
    }
  };

  const onSubmit = async (data: TutorOnboardingFormData) => {
    setIsLoading(true);

    const subjectsForAPI = data.subjects
      .map((s) => s.name)
      .filter((name) => name.trim() !== "");

    const submittedData: SubmissionData = {
      profileImage: data.profileImage,
      displayName: data.displayName,
      headline: data.headline,
      bio: data.bio,
      introVideoFile: data.introVideoFile,
      subjects: subjectsForAPI,
      education: data.education,
    };

    try {
      await submitProfile(submittedData);
      toast.success("Tutor profile created successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to submit profile.";
      toast.error(message);
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

    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <Card className="max-w-2xl mx-auto my-8 border border-gray-200 rounded text-black shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Send className="mr-3 h-5 w-5 text-[#2694C6]" />
          Tutor Onboarding
        </CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          Step {currentStep + 1} of {steps.length}.
        </p>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="flex items-center mb-8 border-b border-gray-200 pb-2 overflow-x-auto">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center text-sm transition-colors ${
                  currentStep === index
                    ? "text-blue-600 font-semibold"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 mr-2 flex items-center justify-center ${
                    currentStep > index
                      ? "border-blue-600 bg-blue-500 text-white"
                      : currentStep === index
                      ? "border-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {currentStep > index ? <Check size={14} /> : step.id}
                </div>
                {step.title}
              </div>

              {index < steps.length - 1 && (
                <div className="flex-1 border-t-2 border-gray-200 mx-4" />
              )}
            </React.Fragment>
          ))}
        </div>

        <FormProvider {...methods}>
          <form
            id="onboarding-form"
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="space-y-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {steps[currentStep].component}
              </motion.div>
            </AnimatePresence>

            <CardFooter className="flex justify-between border-t pt-6">
        <Button
          onClick={prevStep}
          variant="outline"
          disabled={currentStep === 0 || isLoading}
        >
          <ArrowLeft className="mr-2" size={16} /> Previous
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            type="button"
            onClick={nextStep}
            disabled={isLoading}
            className="rounded bg-[#2694C6] hover:bg-[#1f7ba5]"
          >
            Next <ArrowRight className="ml-2" size={16} />
          </Button>
        ) : (
          <Button
            type="submit"
            form="onboarding-form"
            disabled={isLoading}
            className="rounded bg-green-600 hover:bg-green-700 w-[160px]"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Submitting..." : "Complete Profile"}
          </Button>
        )}
      </CardFooter>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
