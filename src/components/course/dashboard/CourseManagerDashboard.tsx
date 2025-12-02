// src/components/tutor/CourseManagerDashboard.tsx

"use client";

import React, { useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Users,
  Settings,
  Loader2,
  ClipboardList,
  Calendar,
} from "lucide-react";

import api from "@/lib/api/axios";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";

// --- Import Sub-Components ---
import CurriculumManagerTab from "./CurriculumManagerTab";
import AssessmentsManagerTab from "./AssessmentsManagerTab";
import EnrollmentManagerTab from "./EnrollmentManagerTab";
import LiveClassManagerTab from "./LiveClassManagerTab";
import SettingsTab from "./SettingsTab";
// --- Import Shared Types ---
import { CourseManagementData, FormOptionsData } from "./SharedTypes";

// --- UI Components ---
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LoaderState: React.FC = () => (
  <div className="flex flex-col justify-center items-center h-screen bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="ml-2 text-muted-foreground">Loading data...</p>
  </div>
);

const navItems = [
  { value: "curriculum", label: "Curriculum", icon: BookOpen },
  { value: "assessments", label: "Assessments", icon: ClipboardList },
  { value: "enrollments", label: "Enrollments", icon: Users },
  { value: "live-classes", label: "Live Classes", icon: Calendar },
  { value: "settings", label: "Settings", icon: Settings },
];

export default function CourseManagerDashboard() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const courseSlug = params.slug as string;
  const { activeSlug: activeOrgSlug } = useActiveOrg();

  // --- 1. DERIVE ACTIVE TAB FROM URL (Source of Truth) ---
  // If ?tab=settings exists, use it. Otherwise default to 'curriculum'.
  const activeTab = useMemo(() => {
    const tabFromUrl = searchParams.get("tab");
    // Validate that the tab exists in our list, otherwise fallback to default
    const isValid = navItems.some((item) => item.value === tabFromUrl);
    return isValid && tabFromUrl ? tabFromUrl : "curriculum";
  }, [searchParams]);

  // --- 2. HANDLE TAB CHANGE (Update URL) ---
  const handleTabChange = useCallback((value: string) => {
    // Create a new URLSearchParams object to keep other params if they exist
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("tab", value);

    // Cast to string
    const search = current.toString();
    const query = search ? `?${search}` : "";

    // Push new URL. 
    // scroll: false prevents the page from jumping to top on tab switch.
    router.push(`${pathname}${query}`, { scroll: false });
  }, [pathname, router, searchParams]);


  // --- 3. DASHBOARD DATA FETCH ---
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

  // --- 4. FORM OPTIONS FETCH ---
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

  if (isError) {
    return (
      <div className="flex justify-center items-center h-screen px-4">
        <p className="text-destructive font-medium text-center">
          Error loading course management data. Ensure the course exists and you
          have permission.
        </p>
      </div>
    );
  }

  const courseTitle = dashboardData?.title || "Course Management";
  const combinedLoading = isDashboardLoading || isFormOptionsLoading;

  if (combinedLoading) {
    return <LoaderState />;
  }

  return (
    <div className="max-w-7xl mx-auto my-8 space-y-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">
        Management: {courseTitle}
      </h1>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange} // 🟢 Use our new handler
        className="space-y-4"
      >
        {/* Mobile Select Navigation */}
        <div className="md:hidden">
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger className="w-full h-12 px-4 py-3 text-base">
              <SelectValue placeholder="Select a section..." />
            </SelectTrigger>
            <SelectContent className="w-[--radix-select-trigger-width]">
              {navItems.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="py-3 text-base"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Tabs Navigation */}
        <TabsList className="hidden md:grid w-full grid-cols-5 h-auto">
          {navItems.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content Components */}
        <TabsContent value="curriculum" className="mt-0 md:mt-6">
          <CurriculumManagerTab
            courseSlug={courseSlug}
            modules={dashboardData!.modules}
          />
        </TabsContent>

        <TabsContent value="assessments" className="mt-0 md:mt-6">
          <AssessmentsManagerTab
            courseSlug={courseSlug}
            assignmentsSummary={dashboardData!.assignments_summary}
            quizzesSummary={dashboardData!.quizzes_summary}
          />
        </TabsContent>

        <TabsContent value="enrollments" className="mt-0 md:mt-6">
          <EnrollmentManagerTab
            courseSlug={courseSlug}
            enrollments={dashboardData!.enrollments}
          />
        </TabsContent>

        <TabsContent value="live-classes" className="mt-0 md:mt-6">
          <LiveClassManagerTab
            courseSlug={courseSlug}
            liveClasses={dashboardData!.live_classes}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-0 md:mt-6">
          <SettingsTab
            courseSlug={courseSlug}
            initialData={dashboardData!}
            formOptions={formOptions!}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}