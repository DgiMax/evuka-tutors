"use client";

import React, { useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Users,
  Settings,
  ClipboardList,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  Eye,
  Lock,
} from "lucide-react";
import Link from "next/link";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import api from "@/lib/api/axios";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";

import CurriculumManagerTab from "./CurriculumManagerTab";
import AssessmentsManagerTab from "./AssessmentsManagerTab";
import EnrollmentManagerTab from "./EnrollmentManagerTab";
import LiveClassManagerTab from "./LiveClassManagerTab";
import SettingsTab from "./SettingsTab";

import { CourseManagementData, FormOptionsData } from "./SharedTypes";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getMissingFields = (course: CourseManagementData) => {
  if (!course) return [];
  const missing = [];
  
  if (course.status === 'draft') {
      if (!course.short_description || course.short_description.length < 10) missing.push("Short Description");
      if (!course.long_description || course.long_description.length < 50) missing.push("Long Description");
      
      const validObjectives = course.learning_objectives?.filter((o: string) => o.trim().length > 0) || [];
      if (validObjectives.length < 2) missing.push("Learning Objectives (min 2)");

      if (!course.global_category) missing.push("Category");
      if (!course.global_subcategory) missing.push("Subcategory");
      if (!course.global_level) missing.push("Level");
      if (!course.thumbnail) missing.push("Thumbnail");
      
      if (!course.modules || course.modules.length === 0) {
          missing.push("Modules");
      } else {
          const hasEmptyModule = course.modules.some(m => !m.lessons || m.lessons.length === 0);
          if (hasEmptyModule) missing.push("Lessons (in every module)");
      }
  }
  return missing;
};

const navItems = [
  { value: "curriculum", label: "Curriculum", icon: BookOpen, restricted: false },
  { value: "assessments", label: "Assessments", icon: ClipboardList, restricted: true },
  { value: "enrollments", label: "Enrollments", icon: Users, restricted: true },
  { value: "live-classes", label: "Live Classes", icon: Calendar, restricted: true },
  { value: "settings", label: "Settings", icon: Settings, restricted: false },
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

export default function CourseManagerDashboard() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const courseSlug = params.slug as string;
  const { activeSlug: activeOrgSlug } = useActiveOrg();

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError,
  } = useQuery<CourseManagementData>({
    queryKey: ["courseManagement", courseSlug],
    queryFn: async () => {
      const { data } = await api.get(`/manage-course/${courseSlug}/`);
      return data;
    },
    enabled: !!courseSlug,
  });

  const { data: formOptions, isLoading: isFormOptionsLoading } =
    useQuery<FormOptionsData>({
      queryKey: ["formOptions", activeOrgSlug],
      queryFn: async () => {
        const url = activeOrgSlug
          ? `/courses/form-options/?slug=${activeOrgSlug}`
          : "/courses/form-options/";
        const { data } = await api.get(url);
        return data;
      },
      staleTime: Infinity,
    });

  const isRestrictedMode = useMemo(() => {
    if (!dashboardData) return false;
    return dashboardData.status === 'draft' || dashboardData.status === 'archived';
  }, [dashboardData]);

  const activeTab = useMemo(() => {
    if (!dashboardData) return "curriculum";
    
    const tabFromUrl = searchParams.get("tab");
    
    if (isRestrictedMode && tabFromUrl) {
      const targetItem = navItems.find(item => item.value === tabFromUrl);
      if (targetItem?.restricted) {
        return "curriculum";
      }
    }

    const isValid = navItems.some((item) => item.value === tabFromUrl);
    return isValid && tabFromUrl ? tabFromUrl : "curriculum";
  }, [searchParams, dashboardData, isRestrictedMode]);

  const handleTabChange = useCallback((value: string) => {
    if (isRestrictedMode) {
      const targetItem = navItems.find(item => item.value === value);
      if (targetItem?.restricted) return;
    }

    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("tab", value);
    router.push(`${pathname}?${current.toString()}`, { scroll: false });
  }, [pathname, router, searchParams, isRestrictedMode]);

  if (isDashboardLoading || isFormOptionsLoading) return <DashboardSkeleton />;

  if (isError || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4 px-4 text-center">
        <div className="bg-destructive/10 p-4 rounded-full">
            <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div>
            <p className="text-lg font-semibold text-foreground">Course not found</p>
            <p className="text-muted-foreground text-sm mt-1">Access denied or the course may have been deleted.</p>
        </div>
        <Button variant="outline" onClick={() => router.push(activeOrgSlug ? `/${activeOrgSlug}` : "/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const missingFields = getMissingFields(dashboardData);
  const isPublishable = missingFields.length === 0;

  return (
    <div className="container mx-auto px-4 md:px-12 py-12 max-w-7xl space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2 flex-1 min-w-0">
          <Link 
            href={activeOrgSlug ? `/${activeOrgSlug}/` : "/"} 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
             <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground truncate leading-tight">
              {dashboardData.title}
            </h1>
            <Badge 
                variant={dashboardData.status === "published" ? "default" : "secondary"} 
                className="capitalize w-fit"
            >
              {dashboardData.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Manage your curriculum, students, and course settings.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 md:pt-0">
          <Button variant="outline" asChild size="sm" className="w-full md:w-auto shadow-none">
            <Link href={`/courses/${dashboardData.slug}/preview`}>
              <Eye className="mr-2 h-4 w-4" /> Preview Page
            </Link>
          </Button>
        </div>
      </div>

      {isRestrictedMode && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-4 rounded-lg flex items-start gap-3 animate-in fade-in-50">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
                <p className="font-semibold text-sm">
                    {dashboardData.status === 'archived' 
                        ? "Course is Archived" 
                        : "Course is in Draft Mode"}
                </p>
                <p className="text-sm opacity-90">
                    Assessments, Enrollments, and Live Classes are disabled while the course is {dashboardData.status}. 
                    {dashboardData.status === 'draft' ? " Please publish the course to enable these features." : " Please republish the course to restore full functionality."}
                </p>
                
                {dashboardData.status === 'draft' && !isPublishable && (
                    <div className="pt-2 mt-2 border-t border-amber-200/60">
                         <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">Missing Requirements to Publish:</p>
                         <p className="text-sm font-medium">{missingFields.join(", ")}</p>
                    </div>
                )}
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
                <SelectItem 
                    key={item.value} 
                    value={item.value} 
                    disabled={isRestrictedMode && item.restricted}
                    className="py-3"
                >
                  <div className="flex items-center gap-2">
                    {isRestrictedMode && item.restricted ? (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                    )}
                    {item.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden md:block">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted/50 rounded-lg">
            {navItems.map((item) => (
                <TabsTrigger 
                    key={item.value} 
                    value={item.value}
                    disabled={isRestrictedMode && item.restricted}
                    className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm group"
                >
                    <div className="flex items-center gap-2">
                        {isRestrictedMode && item.restricted ? (
                             <Lock className="h-3.5 w-3.5 opacity-50" />
                        ) : (
                             <item.icon className="h-4 w-4 mr-2" />
                        )}
                        {item.label}
                    </div>
                </TabsTrigger>
            ))}
            </TabsList>
        </div>

        <div className="mt-2 min-h-[400px]">
          <TabsContent value="curriculum" className="outline-none focus-visible:ring-0 mt-0">
            <CurriculumManagerTab
              courseSlug={courseSlug}
              modules={dashboardData!.modules}
            />
          </TabsContent>

          <TabsContent value="assessments" className="outline-none focus-visible:ring-0 mt-0">
            <AssessmentsManagerTab
              courseSlug={courseSlug}
              assignmentsSummary={dashboardData!.assignments_summary}
              quizzesSummary={dashboardData!.quizzes_summary}
            />
          </TabsContent>

          <TabsContent value="enrollments" className="outline-none focus-visible:ring-0 mt-0">
            <EnrollmentManagerTab
              courseSlug={courseSlug}
              enrollments={dashboardData!.enrollments}
            />
          </TabsContent>

          <TabsContent value="live-classes" className="outline-none focus-visible:ring-0 mt-0">
            <LiveClassManagerTab
              courseSlug={courseSlug}
              liveClasses={dashboardData!.live_classes}
            />
          </TabsContent>

          <TabsContent value="settings" className="outline-none focus-visible:ring-0 mt-0">
            <SettingsTab
              courseSlug={courseSlug}
              initialData={dashboardData!}
              formOptions={formOptions!}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}