"use client";

import React, { useState, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2, Upload } from "lucide-react";
import { useParams } from "next/navigation";

import api from "@/lib/api/axios";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TabsContent } from "@/components/ui/tabs";

import { orgSettingsSchema, OrgSettingsValues, OrganizationManagementData } from "./OrgSharedTypes";
import { 
  ManageBasics, 
  ManageBranding, 
  ManagePolicies, 
  ManageStructure 
} from "./ManageOrgComponents";

export default function OrgSettingsTab({ org, activeTab }: { org: OrganizationManagementData; activeTab: string }) {
  const params = useParams();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(org.logo);

  // Use URL param as fallback if serialized data is missing slug
  const orgSlug = org?.slug || (params.slug as string);

  const methods = useForm<OrgSettingsValues>({
    resolver: zodResolver(orgSettingsSchema) as any,
    defaultValues: {
      name: org.name || "",
      status: org.status,
      org_type: org.org_type || "school",
      description: org.description || "",
      membership_price: Number(org.membership_price) || 0,
      membership_period: org.membership_period || "free",
      membership_duration_value: org.membership_duration_value || 1,
      payout_frequency: org.payout_frequency || "monthly",
      payout_anchor_day: org.payout_anchor_day || 1,
      auto_distribute: org.auto_distribute ?? true,
      founder_commission_percent: org.founder_commission_percent || 40,
      branding: {
        website: org.branding?.website || "",
        linkedin: org.branding?.linkedin || "",
        facebook: org.branding?.facebook || "",
        twitter: org.branding?.twitter || "",
      },
      policies: {
        terms_of_service: org.policies?.terms_of_service || "",
        privacy_policy: org.policies?.privacy_policy || "",
        refund_policy: org.policies?.refund_policy || "",
      },
      levels: org.levels || [],
      categories: org.categories || [],
    },
  });

  const { handleSubmit, control, setValue, watch } = methods;
  const watchedFields = watch();

  const missingRequirements = useMemo(() => {
    const missing = [];
    if (!watchedFields.name || watchedFields.name.length < 3) missing.push("Name");
    if (!watchedFields.org_type) missing.push("Type");
    if (!watchedFields.description || watchedFields.description.length < 10) missing.push("Description (min 10 chars)");
    if (watchedFields.membership_period !== "free" && (!watchedFields.membership_price || watchedFields.membership_price <= 0)) missing.push("Pricing");
    if (!watchedFields.policies?.terms_of_service || !watchedFields.policies?.privacy_policy || !watchedFields.policies?.refund_policy) missing.push("All Policies");
    return missing;
  }, [watchedFields]);

  const canRequestApproval = missingRequirements.length === 0;

  const { mutate } = useMutation({
    mutationFn: async (data: OrgSettingsValues) => {
      if (!orgSlug) throw new Error("Organization identifier missing.");

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
      formData.append("founder_commission_percent", data.founder_commission_percent?.toString() || "40");
      formData.append("branding", JSON.stringify(data.branding || {}));
      formData.append("policies", JSON.stringify(data.policies || {}));
      formData.append("levels", JSON.stringify(data.levels || []));
      formData.append("categories", JSON.stringify(data.categories || []));

      if (data.logo instanceof File) {
        formData.append("logo", data.logo);
      }

      const res = await api.patch(`/organizations/${orgSlug}/manage/`, formData);
      return res.data;
    },
    onSuccess: (data) => {
      // Using a unique ID prevents the double-toast issue
      toast.success("Organization settings updated successfully.", {
        id: "org-update-success"
      });
      queryClient.setQueryData(["orgManagement", orgSlug], data);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Backend update failed.", {
        id: "org-update-error"
      });
    },
    onSettled: () => setIsUpdating(false),
  });

  const onSubmit = (data: OrgSettingsValues) => {
    setIsUpdating(true);
    mutate(data);
  };

  const onInvalid = (errors: any) => {
    toast.error("Please check the form for errors.", {
      id: "org-validation-error"
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("logo", file, { shouldValidate: true });
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <TabsContent value="general" className="space-y-6 mt-0 outline-none">
          <div className="flex flex-col md:flex-row gap-8 items-start mb-2">
            <div className="flex flex-col items-center gap-4 pt-2 shrink-0">
              <Avatar className="h-32 w-32 rounded-md border bg-muted/20">
                <AvatarImage src={logoPreview || ""} className="object-cover" />
                <AvatarFallback className="text-4xl">{org.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <label htmlFor="logo-upload" className="cursor-pointer border rounded-md h-9 px-4 flex items-center text-[11px] font-bold uppercase tracking-wider bg-background hover:bg-accent">
                <Upload className="mr-2 h-4 w-4" /> Change Logo
              </label>
              <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
            <div className="flex-1 w-full">
              <ManageBasics canSubmit={canRequestApproval} missingFields={missingRequirements} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="structure" className="mt-0 outline-none">
          <ManageStructure control={control as any} canSubmit={canRequestApproval} missingFields={missingRequirements} />
        </TabsContent>

        <TabsContent value="branding" className="mt-0 outline-none"><ManageBranding /></TabsContent>
        <TabsContent value="policies" className="mt-0 outline-none"><ManagePolicies /></TabsContent>

        <div className="flex justify-end sticky bottom-6 z-10">
          <Button type="submit" disabled={isUpdating} size="lg" className="rounded-md shadow-none min-h-[48px] px-8">
            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Update Configuration
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}