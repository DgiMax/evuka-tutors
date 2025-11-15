// src/components/tutor/CourseManagerDashboard.tsx

"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Users, Settings, Loader2, ClipboardList, Calendar } from "lucide-react";

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

// Utility component for loading state
const LoaderState: React.FC = () => (
    <div className="flex justify-center items-center h-[300px] bg-white rounded-lg border">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      <p className="ml-2 text-gray-500">Loading data...</p>
    </div>
);


export default function CourseManagerDashboard() {
    const params = useParams();
    const courseSlug = params.slug as string;

    const { activeSlug: activeOrgSlug } = useActiveOrg();
    const [activeTab, setActiveTab] = useState("curriculum");
    // Removed local state [formOptions, setFormOptions]

    // --- 1. DASHBOARD DATA FETCH ---
    const {
        data: dashboardData,
        isLoading: isDashboardLoading,
        isError
    } = useQuery<CourseManagementData>({
        queryKey: ["courseManagement", courseSlug],
        queryFn: async () => {
            const { data } = await api.get(`/manage-course/${courseSlug}/`);
            return data;
        },
        enabled: !!courseSlug,
    });

    // --- 2. FORM OPTIONS FETCH (Optimization: Destructure data directly) ---
    const { 
        data: formOptions, // Destructure data as formOptions
        isLoading: isFormOptionsLoading 
    } = useQuery<FormOptionsData>({
        queryKey: ["formOptions", activeOrgSlug],
        queryFn: async () => {
            const url = activeOrgSlug ? `/courses/form-options/?slug=${activeOrgSlug}` : "/courses/form-options/";
            const { data } = await api.get(url);
            return data;
        },
        staleTime: Infinity,
    });


    if (isError) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-red-600 font-medium">
                    Error loading course management data. Ensure the course exists and you have permission.
                </p>
            </div>
        );
    }

    const courseTitle = dashboardData?.title || "Course Management";
    
    // Check loading for EITHER dashboard data or form options (for the Settings tab)
    const combinedLoading = isDashboardLoading || isFormOptionsLoading;

    // Show loading state if the main dashboard data is being fetched (client-side)
    if (combinedLoading) {
        return <LoaderState />;
    }
    
    // At this point, combinedLoading is false, and dashboardData/formOptions are available.

    return (
        <div className="max-w-7xl mx-auto my-8 space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">
                Management: {courseTitle}
            </h1>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 h-auto">
                    <TabsTrigger value="curriculum">
                        <BookOpen className="h-4 w-4 mr-2" /> Curriculum
                    </TabsTrigger>
                    <TabsTrigger value="assessments">
                        <ClipboardList className="h-4 w-4 mr-2" /> Assessments
                    </TabsTrigger>
                    <TabsTrigger value="enrollments">
                        <Users className="h-4 w-4 mr-2" /> Enrollments
                    </TabsTrigger>
                    <TabsTrigger value="live-classes">
                        <Calendar className="h-4 w-4 mr-2" /> Live Classes
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        <Settings className="h-4 w-4 mr-2" /> Settings
                    </TabsTrigger>
                </TabsList>

                {/* Tab Content Components (Data is now guaranteed to exist here) */}
                <TabsContent value="curriculum">
                    <CurriculumManagerTab
                        courseSlug={courseSlug}
                        modules={dashboardData!.modules}
                    />
                </TabsContent>

                <TabsContent value="assessments">
                    <AssessmentsManagerTab
                        courseSlug={courseSlug}
                        assignmentsSummary={dashboardData!.assignments_summary}
                        quizzesSummary={dashboardData!.quizzes_summary}
                    />
                </TabsContent>

                <TabsContent value="enrollments">
                    <EnrollmentManagerTab
                        courseSlug={courseSlug}
                        enrollments={dashboardData!.enrollments}
                    />
                </TabsContent>

                <TabsContent value="live-classes">
                    <LiveClassManagerTab
                        courseSlug={courseSlug}
                        liveClasses={dashboardData!.live_classes}
                    />
                </TabsContent>

                <TabsContent value="settings">
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