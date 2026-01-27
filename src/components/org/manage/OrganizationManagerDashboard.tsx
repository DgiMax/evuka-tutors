"use client";

import React, { useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Layers,
  Globe,
  Shield,
  Eye,
} from "lucide-react";
import Link from "next/link";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import api from "@/lib/api/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import OrgSettingsTab from "./OrgSettingsTab";
import { OrganizationManagementData } from "./OrgSharedTypes";

const navItems = [
  { value: "general", label: "General", icon: Building2 },
  { value: "structure", label: "Access & Billing", icon: Layers },
  { value: "branding", label: "Branding", icon: Globe },
  { value: "policies", label: "Policies", icon: Shield },
];

const DashboardSkeleton = () => (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
      <div className="max-w-7xl mx-auto my-6 md:my-8 space-y-8 px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-border pb-6">
          <div className="space-y-3 flex-1 w-full">
             <Skeleton width={100} height={20} />
             <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Skeleton height={32} className="w-3/4 sm:w-1/2 md:w-1/3" />
                <Skeleton width={80} height={24} />
             </div>
             <Skeleton height={20} className="w-full sm:w-2/3" />
          </div>
          <div className="w-full md:w-auto pt-2 md:pt-0">
             <Skeleton height={40} width={140} className="w-full md:w-[140px]" />
          </div>
        </div>
        <div className="space-y-6">
            <Skeleton height={48} borderRadius={8} />
            <Skeleton height={400} borderRadius={8} />
        </div>
      </div>
    </SkeletonTheme>
);

export default function OrganizationManagerDashboard() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const orgSlug = params.slug as string;

  const { data: orgData, isLoading, isError } = useQuery<OrganizationManagementData>({
    queryKey: ["orgManagement", orgSlug],
    queryFn: async () => {
      const { data } = await api.get(`/organizations/${orgSlug}/`, {
          headers: { "X-Organization-Slug": orgSlug } 
      });
      return data;
    },
    enabled: !!orgSlug,
  });

  const activeTab = useMemo(() => {
    const tabFromUrl = searchParams.get("tab");
    const isValid = navItems.some((item) => item.value === tabFromUrl);
    return isValid && tabFromUrl ? tabFromUrl : "general";
  }, [searchParams]);

  const handleTabChange = useCallback((value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("tab", value);
    router.push(`${pathname}?${current.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !orgData) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4 px-4 text-center">
        <div className="bg-destructive/10 p-4 rounded-full">
            <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div>
            <p className="text-lg font-semibold text-foreground">Organization not found</p>
            <p className="text-muted-foreground text-sm mt-1">Access denied or deleted.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/organizations")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Organizations
        </Button>
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
      if (status === 'approved') return "default";
      if (status === 'suspended') return "destructive";
      return "secondary";
  };

  return (
    <div className="container mx-auto px-2 md:px-6 py-8 max-w-7xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2 flex-1 min-w-0">
          <Link 
            href="/organizations" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
             <ArrowLeft className="h-4 w-4 mr-1" /> Back to Organizations
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground truncate leading-tight">
              {orgData.name}
            </h1>
            <Badge 
                variant={getStatusVariant(orgData.status)} 
                className="capitalize w-fit"
            >
              {orgData.status?.replace("_", " ") || "Unknown"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Manage institution profile, branding, and legal policies.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 md:pt-0">
          {orgData.status === 'approved' && (
            <Button variant="outline" asChild size="sm" className="w-full md:w-auto shadow-none">
                <Link href={`/${orgData.slug}`} target="_blank">
                    <Eye className="mr-2 h-4 w-4" /> Preview Page
                </Link>
            </Button>
          )}
        </div>
      </div>

      {orgData.status === 'draft' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-4 rounded-lg flex items-start gap-3 animate-in fade-in-50">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
                <p className="font-semibold text-sm">Organization is in Draft Mode</p>
                <p className="text-sm opacity-90">
                    Your organization is hidden. Complete setup and change status to <strong>Pending Approval</strong> to publish.
                </p>
            </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="md:hidden">
          <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">
            Current View
          </label>
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger className="w-full h-12 text-base font-medium shadow-none bg-background rounded-md border-border">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent position="popper">
              {navItems.map((item) => (
                <SelectItem key={item.value} value={item.value} className="py-3">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden md:block">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50 rounded-lg">
                {navItems.map((item) => (
                    <TabsTrigger 
                        key={item.value} 
                        value={item.value}
                        className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm group"
                    >
                        <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4 mr-2" />
                            {item.label}
                        </div>
                    </TabsTrigger>
                ))}
            </TabsList>
        </div>

        <div className="mt-2 min-h-[400px]">
          <OrgSettingsTab org={orgData} activeTab={activeTab} />
        </div>
      </Tabs>
    </div>
  );
}