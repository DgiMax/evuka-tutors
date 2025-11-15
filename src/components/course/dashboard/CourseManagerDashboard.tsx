// src/components/tutor/CourseManagerDashboard.tsx

"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";

// --- Import Sub-Components ---
import CurriculumManagerTab from "./CurriculumManagerTab";
import AssessmentsManagerTab from "./AssessmentsManagerTab";
import EnrollmentManagerTab from "./EnrollmentManagerTab";
import LiveClassManagerTab from "./LiveClassManagerTab";
import SettingsTab from "./SettingsTab";
// --- Import Shared Types ---
import { CourseManagementData, FormOptionsData } from "./SharedTypes";

// --- UI Components (Assumed to be imported) ---
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// UPDATED: Loader is now full-screen for a cleaner initial load
const LoaderState: React.FC = () => (
  <div className="flex flex-col justify-center items-center h-screen bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="ml-2 text-muted-foreground">Loading data...</p>
  </div>
);

// NEW: Define nav items in one place for DRY code
const navItems = [
  { value: "curriculum", label: "Curriculum", icon: BookOpen },
  { value: "assessments", label: "Assessments", icon: ClipboardList },
  { value: "enrollments", label: "Enrollments", icon: Users },
  { value: "live-classes", label: "Live Classes", icon: Calendar },
  { value: "settings", label: "Settings", icon: Settings },
];

export default function CourseManagerDashboard() {
  const params = useParams();
  const courseSlug = params.slug as string;

  const { activeSlug: activeOrgSlug } = useActiveOrg();
  const [activeTab, setActiveTab] = useState("curriculum");

  // --- 1. DASHBOARD DATA FETCH (Unchanged) ---
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

  // --- 2. FORM OPTIONS FETCH (Unchanged) ---
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
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        {/* --- NEW: Mobile Select (Dropdown) Navigation --- */}
        <div className="md:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            {/* ✅ UPDATED: 
              1. w-full: Makes it full width.
              2. h-12: Increases height for better tappability.
              3. px-4 py-3: Explicit padding.
              4. text-base: Slightly larger font.
            */}
            <SelectTrigger className="w-full h-12 px-4 py-3 text-base">
              <SelectValue placeholder="Select a section..." />
            </SelectTrigger>
            {/*
              ✅ UPDATED: 
              1. w-[--radix-select-trigger-width]: Makes dropdown match trigger width.
            */}
            <SelectContent className="w-[--radix-select-trigger-width]">
              {navItems.map((item) => (
                // ✅ UPDATED: Added py-3 and text-base for larger tap targets
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

        {/* --- UPDATED: Desktop Tabs Navigation (Hidden on mobile) --- */}
        <TabsList className="hidden md:grid w-full grid-cols-5 h-auto">
          {navItems.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* --- Tab Content Components (Data is now guaranteed to exist here) --- */}
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