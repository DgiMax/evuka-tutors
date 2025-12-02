"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/axios";
import { 
  Loader2, Send, School, Home, Info, Image as ImageIcon, 
  FileText, ArrowLeft, ArrowRight, Check, Plus, X, Upload, DollarSign, Layers 
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// --- 1. Zod Schema (Major Updates) ---
const orgFormSchema = z.object({
  // Step 1: Basic
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  org_type: z.enum(["school", "homeschool"]),
  description: z.string().optional(),

  // Step 2: Structure & Pricing
  membership_price: z.coerce.number().min(0, "Price cannot be negative"),
  membership_period: z.enum(["monthly", "yearly", "lifetime", "free"]),
  membership_duration_value: z.coerce.number().optional(), // e.g. "1" year
  
  // Arrays for "Setup Wizard"
  levels: z.array(z.object({
    name: z.string(),
    order: z.number()
  })).optional(),
  
  categories: z.array(z.object({
    name: z.string()
  })).optional(),

  // Step 3: Branding
  // Note: Logo file is handled by local state to avoid complex Zod file validation issues
  branding: z.object({
    website: z.string().url("Invalid URL").or(z.literal("")).optional(),
    linkedin: z.string().url("Invalid URL").or(z.literal("")).optional(),
    facebook: z.string().url("Invalid URL").or(z.literal("")).optional(),
    twitter: z.string().url("Invalid URL").or(z.literal("")).optional(),
  }),

  // Step 4: Policies
  policies: z.object({
    terms_of_service: z.string().optional(),
    privacy_policy: z.string().optional(),
    refund_policy: z.string().optional(),
  }),
});

type OrgFormValues = z.infer<typeof orgFormSchema>;

// --- 2. Steps Definition ---
const steps = [
  { id: 1, name: "Basics", icon: Info, fields: ["name", "org_type", "description"] },
  { id: 2, name: "Structure", icon: Layers, fields: ["membership_price", "membership_period"] },
  { id: 3, name: "Branding", icon: ImageIcon, fields: ["branding.website"] },
  { id: 4, name: "Policies", icon: FileText, fields: ["policies.terms_of_service"] },
];

export default function OrgCreateClient() {
  const router = useRouter();
  const { fetchCurrentUser } = useAuth();
  
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // File Handling State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Array Inputs State
  const [newLevel, setNewLevel] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgFormSchema) as any,
    defaultValues: {
      name: "",
      org_type: "school",
      description: "",
      membership_price: 0,
      membership_period: "free",
      membership_duration_value: 1,
      levels: [],
      categories: [],
      branding: { website: "", linkedin: "", facebook: "", twitter: "" },
      policies: { terms_of_service: "", privacy_policy: "", refund_policy: "" },
    },
    mode: "onBlur",
  });

  // --- Handlers ---

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const addLevel = () => {
    if (!newLevel.trim()) return;
    const currentLevels = form.getValues("levels") || [];
    const newOrder = currentLevels.length + 1;
    form.setValue("levels", [...currentLevels, { name: newLevel, order: newOrder }]);
    setNewLevel("");
  };

  const removeLevel = (index: number) => {
    const currentLevels = form.getValues("levels") || [];
    form.setValue("levels", currentLevels.filter((_, i) => i !== index));
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    const currentCats = form.getValues("categories") || [];
    form.setValue("categories", [...currentCats, { name: newCategory }]);
    setNewCategory("");
  };
  
// --- Helper Component for "Add One by One" Policies ---
const PolicyBuilder = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder: string }) => {
  const [input, setInput] = useState("");

  // Convert current text block to array (split by double newline for clear separation)
  const items = value ? value.split('\n\n').filter(Boolean) : [];

  const handleAdd = () => {
    if (!input.trim()) return;
    const newItems = [...items, input.trim()];
    // Join with double newline to create paragraphs in the backend
    onChange(newItems.join('\n\n')); 
    setInput("");
  };

  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems.join('\n\n'));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button 
          type="button" 
          onClick={handleAdd} 
          variant="secondary"
          className="shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Clause
        </Button>
      </div>

      {/* List Display */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {items.length === 0 && (
          <div className="text-sm text-muted-foreground italic border border-dashed rounded-lg p-4 text-center">
            No policies added yet. Type above to add one.
          </div>
        )}
        {items.map((item, idx) => (
          <div key={idx} className="group flex items-start justify-between gap-3 bg-card border p-3 rounded-md text-sm shadow-sm">
            <div className="flex gap-3">
              <span className="text-muted-foreground font-mono bg-muted w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="whitespace-pre-wrap leading-relaxed">{item}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemove(idx)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};


  const removeCategory = (index: number) => {
    const currentCats = form.getValues("categories") || [];
    form.setValue("categories", currentCats.filter((_, i) => i !== index));
  };

  const processForm: SubmitHandler<OrgFormValues> = async (data) => {
    setIsLoading(true);
    
    // Create FormData for Multipart upload
    const formData = new FormData();
    
    // 1. Basic Fields
    formData.append("name", data.name);
    formData.append("org_type", data.org_type);
    if(data.description) formData.append("description", data.description);

    // 2. Pricing
    formData.append("membership_price", data.membership_price.toString());
    formData.append("membership_period", data.membership_period);
    if(data.membership_duration_value) 
      formData.append("membership_duration_value", data.membership_duration_value.toString());

    // 3. Arrays (Must be JSON stringified)
    if (data.levels && data.levels.length > 0) {
      formData.append("levels", JSON.stringify(data.levels));
    }
    if (data.categories && data.categories.length > 0) {
      formData.append("categories", JSON.stringify(data.categories));
    }

    formData.append("branding", JSON.stringify(data.branding));
    if (logoFile) formData.append("logo", logoFile);

    formData.append("policies", JSON.stringify(data.policies));

    try {
      // Must set Content-Type to undefined or multipart/form-data so browser sets boundary
      const res = await api.post("/organizations/create/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newOrgSlug = res.data.slug;
      toast.success("Organization created successfully!");
      await fetchCurrentUser();
      router.push(`/${newOrgSlug}`);

    } catch (error: any) {
      if (error.response?.data) {
        // Handle specific field errors
        const errData = error.response.data;
        if (errData.name) {
             form.setError("name", { message: errData.name[0] });
             setCurrentStep(1);
        }
        toast.error("Failed to create organization. Check the form for errors.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    // Basic trigger validation for current fields
    // (In a real scenario, you might want more precise field validation per step)
    const isValid = await form.trigger(); 
    // We allow proceeding if fields are valid, BUT trigger validates ALL fields.
    // Ideally, validate only current step fields. Keeping it simple here:
    if (currentStep < steps.length) {
        setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  // Watchers for conditional UI
  const watchedPeriod = form.watch("membership_period");
  const watchedLevels = form.watch("levels") || [];
  const watchedCategories = form.watch("categories") || [];

  return (
    <Card className="max-w-4xl mx-4 sm:mx-auto my-8 p-0 shadow-lg border-muted/40">
      <CardHeader className="p-6 bg-muted/5 border-b border-border">
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="text-xl">Create Organization</CardTitle>
                <CardDescription>Setup your school or network profile</CardDescription>
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 min-h-[400px]">
        {/* Stepper Visual */}
        <div className="flex items-center mb-8 px-2">
            {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                    <div className={cn("flex items-center gap-2 text-sm transition-colors", currentStep >= step.id ? "text-primary font-medium" : "text-muted-foreground")}>
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border-2",
                            currentStep > step.id ? "bg-primary border-primary text-primary-foreground" :
                            currentStep === step.id ? "border-primary text-primary" : "border-muted-foreground/30"
                        )}>
                            {currentStep > step.id ? <Check size={14} /> : <step.icon size={14} />}
                        </div>
                        <span className="hidden sm:inline">{step.name}</span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={cn("flex-1 h-[2px] mx-4", currentStep > step.id ? "bg-primary" : "bg-muted")} />
                    )}
                </React.Fragment>
            ))}
        </div>

        <Form {...form}>
          <form id="org-create-form" onSubmit={form.handleSubmit(processForm)} className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -10, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                
                {/* --- STEP 1: BASICS --- */}
                {currentStep === 1 && (
                  <div className="space-y-6 max-w-2xl mx-auto">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl><Input placeholder="e.g. Springfield Academy" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="org_type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="school">
                                <div className="flex items-center gap-2"><School className="h-4 w-4"/> School / Institution</div>
                            </SelectItem>
                            <SelectItem value="homeschool">
                                <div className="flex items-center gap-2"><Home className="h-4 w-4"/> Homeschool Network</div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Textarea rows={5} placeholder="Tell us about your mission..." {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                )}

                {/* --- STEP 2: STRUCTURE & PRICING (NEW) --- */}
                {currentStep === 2 && (
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column: Pricing */}
                    <div className="space-y-6 border-r pr-0 md:pr-8 border-border">
                        <div className="mb-4">
                            <h3 className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4"/> Membership & Pricing</h3>
                            <p className="text-xs text-muted-foreground">How do students access your organization?</p>
                        </div>

                        <FormField control={form.control} name="membership_period" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Billing Period</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="free">Free Access</SelectItem>
                                        <SelectItem value="monthly">Monthly Subscription</SelectItem>
                                        <SelectItem value="yearly">Yearly Subscription</SelectItem>
                                        <SelectItem value="lifetime">One-time (Lifetime)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />

                        {watchedPeriod !== "free" && (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="membership_price" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input type="number" className="pl-8" {...field} />
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="membership_duration_value" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duration ({watchedPeriod === 'monthly' ? 'Months' : 'Years'})</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                    </FormItem>
                                )} />
                            </div>
                        )}
                    </div>

                    {/* Right Column: Structure */}
                    <div className="space-y-6">
                        <div className="mb-4">
                            <h3 className="font-semibold flex items-center gap-2"><Layers className="h-4 w-4"/> Structure</h3>
                            <p className="text-xs text-muted-foreground">Define your hierarchy immediately.</p>
                        </div>

                        {/* Levels Input */}
                        <div className="space-y-3">
                            <FormLabel>Levels (e.g. Grade 1, Year 10)</FormLabel>
                            <div className="flex gap-2">
                                <Input 
                                    value={newLevel} 
                                    onChange={(e) => setNewLevel(e.target.value)} 
                                    placeholder="Add a level..."
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLevel())}
                                />
                                <Button type="button" size="icon" variant="outline" onClick={addLevel}><Plus size={16}/></Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {watchedLevels.map((lvl, idx) => (
                                    <Badge key={idx} variant="secondary" className="px-3 py-1">
                                        {lvl.name} <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => removeLevel(idx)} />
                                    </Badge>
                                ))}
                                {watchedLevels.length === 0 && <span className="text-xs text-muted-foreground italic">No levels added yet.</span>}
                            </div>
                        </div>

                        {/* Categories Input */}
                        <div className="space-y-3 pt-4 border-t">
                            <FormLabel>Subject Categories</FormLabel>
                            <div className="flex gap-2">
                                <Input 
                                    value={newCategory} 
                                    onChange={(e) => setNewCategory(e.target.value)} 
                                    placeholder="e.g. Math, Science..."
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                                />
                                <Button type="button" size="icon" variant="outline" onClick={addCategory}><Plus size={16}/></Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {watchedCategories.map((cat, idx) => (
                                    <Badge key={idx} variant="outline" className="px-3 py-1">
                                        {cat.name} <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => removeCategory(idx)} />
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                  </div>
                )}

                {/* --- STEP 3: BRANDING --- */}
                {currentStep === 3 && (
                  <div className="space-y-8 max-w-2xl mx-auto">
                    {/* Logo Upload */}
                    <div className="space-y-4">
                        <FormLabel>Organization Logo</FormLabel>
                        <div className="flex items-center gap-6">
                            <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/20 relative">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                )}
                            </div>
                            <div className="space-y-2">
                                <Input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleLogoChange} 
                                    className="cursor-pointer file:text-primary"
                                />
                                <p className="text-xs text-muted-foreground">Recommended: 500x500px, PNG or JPG.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <FormField control={form.control} name="branding.website" render={({ field }) => (
                            <FormItem><FormLabel>Website</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage/></FormItem>
                        )} />
                        <FormField control={form.control} name="branding.linkedin" render={({ field }) => (
                            <FormItem><FormLabel>LinkedIn</FormLabel><FormControl><Input placeholder="https://linkedin.com/..." {...field} /></FormControl><FormMessage/></FormItem>
                        )} />
                        <FormField control={form.control} name="branding.facebook" render={({ field }) => (
                            <FormItem><FormLabel>Facebook</FormLabel><FormControl><Input placeholder="https://facebook.com/..." {...field} /></FormControl><FormMessage/></FormItem>
                        )} />
                        <FormField control={form.control} name="branding.twitter" render={({ field }) => (
                            <FormItem><FormLabel>X (Twitter)</FormLabel><FormControl><Input placeholder="https://x.com/..." {...field} /></FormControl><FormMessage/></FormItem>
                        )} />
                    </div>
                  </div>
                )}

                {/* --- STEP 4: POLICIES (UPDATED) --- */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="mb-4">
                        <h3 className="font-semibold text-lg">Legal & Policies</h3>
                        <p className="text-sm text-muted-foreground">
                          Build your policies by adding clauses one by one. We will format them for you.
                        </p>
                    </div>

                    <Tabs defaultValue="terms" className="w-full">
                        {/* Scrollable Tabs List for Mobile Responsiveness */}
                        <div className="overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:px-0">
                            <TabsList className="inline-flex w-full md:grid md:grid-cols-3 min-w-[300px]">
                                <TabsTrigger value="terms">Terms of Service</TabsTrigger>
                                <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
                                <TabsTrigger value="refund">Refund Policy</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="terms" className="space-y-4 mt-4">
                            <FormField control={form.control} name="policies.terms_of_service" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Terms of Service Clauses</FormLabel>
                                    <FormControl>
                                        <PolicyBuilder 
                                            value={field.value || ""} 
                                            onChange={field.onChange}
                                            placeholder="e.g. 'Users must be respectful to tutors at all times.'" 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </TabsContent>

                        <TabsContent value="privacy" className="space-y-4 mt-4">
                              <FormField control={form.control} name="policies.privacy_policy" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Privacy Statements</FormLabel>
                                    <FormControl>
                                        <PolicyBuilder 
                                            value={field.value || ""} 
                                            onChange={field.onChange}
                                            placeholder="e.g. 'We do not share your personal data with third parties.'" 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </TabsContent>

                        <TabsContent value="refund" className="space-y-4 mt-4">
                              <FormField control={form.control} name="policies.refund_policy" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Refund Conditions</FormLabel>
                                    <FormControl>
                                        <PolicyBuilder 
                                            value={field.value || ""} 
                                            onChange={field.onChange}
                                            placeholder="e.g. 'Full refund available if cancelled within 24 hours.'" 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </TabsContent>
                    </Tabs>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex justify-between border-t border-border p-6 bg-muted/5 rounded-b-lg">
        <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 1 || isLoading}
        >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>

        {currentStep < steps.length ? (
            <Button onClick={nextStep} variant="default" className="bg-primary hover:bg-primary/90">
                Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        ) : (
            <Button 
                onClick={form.handleSubmit(processForm)} 
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]"
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Create Organization
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}