"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api/axios";

import {
  Loader2,
  Building,
  Send,
  School,
  Home,
  Info,
  Image,
  FileText,
  ArrowLeft,
  ArrowRight,
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

// 1. Define the Zod schema for Organization creation
const orgFormSchema = z.object({
  // Step 1: Basic Info
  name: z
    .string()
    .min(5, "Organization name must be at least 5 characters.")
    .max(100),
  org_type: z.enum(["school", "homeschool"]),
  description: z.string().optional(),

  // Step 2: Branding (all fields are optional URLs)
  branding: z.object({
    logo_url: z.string().url("Must be a valid URL.").or(z.literal("")).optional(),
    website: z.string().url("Must be a valid URL.").or(z.literal("")).optional(),
    linkedin: z.string().url("Must be a valid URL.").or(z.literal("")).optional(),
    facebook: z.string().url("Must be a valid URL.").or(z.literal("")).optional(),
    twitter: z.string().url("Must be a valid URL.").or(z.literal("")).optional(),
  }),

  // Step 3: Policies (all fields are optional text)
  policies: z.object({
    terms_of_service: z.string().optional(),
    privacy_policy: z.string().optional(),
    refund_policy: z.string().optional(),
  }),
});

type OrgFormValues = z.infer<typeof orgFormSchema>;

// 2. Define the steps, similar to the course creator
const steps = [
  {
    id: 1,
    name: "Basic Info",
    icon: Info,
    fields: ["name", "org_type", "description"] as const,
  },
  {
    id: 2,
    name: "Branding",
    icon: Image,
    fields: ["branding.logo_url", "branding.website", "branding.linkedin", "branding.facebook", "branding.twitter"] as const,
  },
  {
    id: 3,
    name: "Policies",
    icon: FileText,
    fields: ["policies.terms_of_service", "policies.privacy_policy", "policies.refund_policy"] as const,
  },
];

export default function OrgCreateClient() {
  const router = useRouter();
  const { fetchCurrentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgFormSchema),
    defaultValues: {
      name: "",
      org_type: "school",
      description: "",
      branding: {
        logo_url: "",
        website: "",
        linkedin: "",
        facebook: "",
        twitter: "",
      },
      policies: {
        terms_of_service: "",
        privacy_policy: "",
        refund_policy: "",
      },
    },
    mode: "onBlur",
  });

  const processForm: SubmitHandler<OrgFormValues> = async (data) => {
    setIsLoading(true);
    try {
      // POST the full nested form data
      const res = await api.post("/organizations/create/", data);
      const newOrgSlug = res.data.slug;

      toast.success(
        "Organization created successfully! You are now the owner. It will be publicly listed once approved by an admin."
      );
      
      await fetchCurrentUser();
      router.push(`/${newOrgSlug}`);

    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        const errorData = error.response.data;
        if (errorData.name) {
             form.setError("name", { type: "manual", message: errorData.name[0] });
             setCurrentStep(1); // FIX: Was setCurrentTab("basic")
             toast.error("Please correct the error on the Basic Info tab.");
        } else {
            toast.error("An error occurred. Please check the form.");
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    const currentFields = steps[currentStep - 1].fields;
    const output = await form.trigger(currentFields as any, { shouldFocus: true });

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

  return (
    <Card className="max-w-4xl mx-auto my-8 border border-gray-200 rounded text-black shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">
          Create a New Organization
        </CardTitle>
        <CardDescription>
          Fill out the details step-by-step.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Stepper UI */}
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
          <form id="org-create-form" onSubmit={form.handleSubmit(processForm)} className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* --- STEP 1: BASIC INFO --- */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name *</FormLabel>
                        <FormControl><ShadcnInput placeholder="e.g., CodeHive Learning Hub" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="org_type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="school"><div className="flex items-center gap-3"><School className="h-5 w-5" /><span>School</span></div></SelectItem>
                            <SelectItem value="homeschool"><div className="flex items-center gap-3"><Home className="h-5 w-5" /><span>Homeschool Network</span></div></SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl><Textarea rows={6} placeholder="What is your organization about?" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}

                {/* --- STEP 2: BRANDING --- */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormDescription>
                      Add links to your organization's logo and social media pages. (Optional)
                    </FormDescription>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="branding.logo_url" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl><ShadcnInput placeholder="https://..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="branding.website" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website URL</FormLabel>
                          <FormControl><ShadcnInput placeholder="https://..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="branding.linkedin" render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn URL</FormLabel>
                          <FormControl><ShadcnInput placeholder="https://linkedin.com/..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="branding.facebook" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook URL</FormLabel>
                          <FormControl><ShadcnInput placeholder="https://facebook.com/..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="branding.twitter" render={({ field }) => (
                        <FormItem>
                          <FormLabel>X (Twitter) URL</FormLabel>
                          <FormControl><ShadcnInput placeholder="https://x.com/..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}

                {/* --- STEP 3: POLICIES --- */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <FormDescription>
                      Add your organization's policies. These will be shown to users and tutors. (Optional)
                    </FormDescription>
                    <FormField control={form.control} name="policies.terms_of_service" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Terms of Service</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={8}
                            placeholder="e.g., '1. Acceptance of Terms...&#10;2. User Conduct...'"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Paste your full Terms of Service text. Line breaks will be preserved.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="policies.privacy_policy" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Privacy Policy</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={8}
                            placeholder="e.g., '1. Information We Collect...&#10;2. How We Use Your Information...'"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Paste your full Privacy Policy text. Line breaks will be preserved.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="policies.refund_policy" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Refund Policy</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={5}
                            placeholder="e.g., '1. Full Refunds...&#10;2. Partial Refunds...'"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Paste your full Refund Policy text. Line breaks will be preserved.
                        </FormDescription>
                        <FormMessage />
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
          {currentStep < steps.length && (
            <Button onClick={nextStep} disabled={isLoading} className="rounded bg-blue-600 hover:bg-blue-700">
              Next <ArrowRight className="ml-2" size={16} />
            </Button>
          )}

          {currentStep === steps.length && (
            <Button
              type="submit"
              form="org-create-form"
              disabled={isLoading}
              className="rounded bg-green-600 hover:bg-green-700 w-[200px]"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isLoading ? "Submitting..." : "Create Organization"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}