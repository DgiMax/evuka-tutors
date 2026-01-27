"use client";

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Save, 
  Loader2, 
  Building2, 
  Upload
} from "lucide-react";

import api from "@/lib/api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { orgFormSchema, OrgFormValues } from "@/components/org/create/OrgFormSchema";
import { StepBranding, StepPolicies, StepFinalize } from "@/components/org/create/OrgFormComponents";
import { OrganizationManagementData } from "./OrgSharedTypes";

export default function OrgSettingsTab({ org, activeTab }: { org: OrganizationManagementData; activeTab: string }) {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(org.logo);

  const methods = useForm<OrgFormValues>({
    resolver: zodResolver(orgFormSchema) as any,
    defaultValues: {
      name: org.name || "",
      status: org.status,
      org_type: org.org_type || "",
      description: org.description || "",
      membership_price: Number(org.membership_price) || 0,
      membership_period: org.membership_period || "free",
      membership_duration_value: org.membership_duration_value || 1,
      payout_frequency: org.payout_frequency || "monthly",
      payout_anchor_day: org.payout_anchor_day || 1,
      auto_distribute: org.auto_distribute ?? true,
      branding: org.branding || {},
      policies: org.policies || {},
      levels: [], 
      categories: [], 
    },
  });

  const { handleSubmit, control, setValue } = methods;

  const { mutate } = useMutation({
    mutationFn: async (data: OrgFormValues) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("status", data.status);
      formData.append("org_type", data.org_type);
      formData.append("description", data.description || "");
      formData.append("membership_price", (data.membership_price || 0).toString());
      formData.append("membership_period", data.membership_period);
      formData.append("membership_duration_value", (data.membership_duration_value || 1).toString());
      formData.append("payout_frequency", data.payout_frequency);
      formData.append("payout_anchor_day", data.payout_anchor_day.toString());
      formData.append("auto_distribute", data.auto_distribute ? "true" : "false");
      formData.append("branding", JSON.stringify(data.branding || {}));
      formData.append("policies", JSON.stringify(data.policies || {}));

      if (data.logo instanceof File) {
        formData.append("logo", data.logo);
      }

      const res = await api.patch(`/organizations/${org.slug}/current/`, formData);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Organization settings updated.");
      queryClient.setQueryData(["orgManagement", org.slug], data);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update settings.");
    },
    onSettled: () => setIsUpdating(false),
  });

  const onSubmit = (data: OrgFormValues) => {
    setIsUpdating(true);
    mutate(data);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("logo", file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const missingFields: string[] = [];
  const canSubmit = true; 

  const labelClasses = "uppercase text-xs font-bold text-muted-foreground tracking-wider";
  const inputClasses = "rounded-md shadow-none w-full font-medium text-zinc-600";

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <TabsContent value="general" className="space-y-6 mt-0 outline-none focus-visible:ring-0">
            <Card className="rounded-md border shadow-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary"/> Organization Identity</CardTitle>
                    <CardDescription>Manage profile and institution-wide settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 space-y-4">
                            <FormField control={control} name="name" render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel className={labelClasses}>Organization Name</FormLabel>
                                    <FormControl><Input className={inputClasses} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                <FormField control={control} name="org_type" render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel className={labelClasses}>Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                              <SelectTrigger className={inputClasses}>
                                                <div className="truncate w-full text-left font-medium">
                                                  <SelectValue />
                                                </div>
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-md shadow-none">
                                                <SelectItem value="school" className="rounded-md">School</SelectItem>
                                                <SelectItem value="homeschool" className="rounded-md">Homeschool Network</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={control} name="status" render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel className={labelClasses}>Visibility Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                              <SelectTrigger className={inputClasses}>
                                                <div className="truncate w-full text-left font-medium">
                                                  <SelectValue />
                                                </div>
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-md shadow-none">
                                                <SelectItem value="draft" className="rounded-md">Draft (Hidden)</SelectItem>
                                                <SelectItem value="pending_approval" className="rounded-md">Pending Approval</SelectItem>
                                                <SelectItem value="approved" className="rounded-md">Approved</SelectItem>
                                                <SelectItem value="suspended" className="rounded-md text-destructive">Suspended</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                        
                        <div className="w-full md:w-auto flex flex-col items-center gap-4 pt-2 shrink-0">
                            <Avatar className="h-32 w-32 border border-border overflow-hidden rounded-md shadow-none bg-muted/20">
                                <AvatarImage src={logoPreview || ""} className="h-full w-full object-cover" alt="Logo" />
                                <AvatarFallback className="text-4xl rounded-md bg-primary/5 text-primary">{org.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex items-center">
                                <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md text-[11px] font-bold uppercase tracking-wider border border-input bg-background hover:bg-accent h-9 px-4 transition-all shadow-none">
                                    <Upload className="mr-2 h-4 w-4" /> Change Logo
                                </label>
                                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                            </div>
                        </div>
                    </div>

                    <FormField control={control} name="description" render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel className={labelClasses}>Description</FormLabel>
                            <FormControl>
                                <Textarea rows={5} className={`${inputClasses} resize-none leading-relaxed h-40`} {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="structure" className="mt-0 animate-in fade-in slide-in-from-bottom-2 outline-none focus-visible:ring-0">
            <StepFinalize control={control} canSubmit={canSubmit} missingFields={missingFields} />
        </TabsContent>

        <TabsContent value="branding" className="mt-0 animate-in fade-in slide-in-from-bottom-2 outline-none focus-visible:ring-0">
            <StepBranding />
        </TabsContent>

        <TabsContent value="policies" className="mt-0 animate-in fade-in slide-in-from-bottom-2 outline-none focus-visible:ring-0">
            <StepPolicies />
        </TabsContent>

        <div className="flex justify-end sticky bottom-6 z-10">
          <Button type="submit" disabled={isUpdating} size="lg" className="rounded-md shadow-none min-w-[160px]">
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Update Configuration
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}