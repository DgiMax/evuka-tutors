// src/components/tutor/dashboard/SharedTypes.ts

import * as z from "zod";

// --- CORE TYPES ---

export type CourseStatus = "draft" | "pending_review" | "published";
export const statusOptions: Record<CourseStatus, string> = {
    draft: "Draft",
    pending_review: "Pending Review",
    published: "Published",
};

export interface DropdownOption { id: string; name: string; }
export interface SubCategoryOption { id: string; name: string; parent_id: string; slug: string; }
export interface FormOptionsData {
    globalCategories: DropdownOption[];
    globalSubCategories: SubCategoryOption[];
    globalLevels: DropdownOption[];
    orgCategories: DropdownOption[];
    orgLevels: DropdownOption[];
    context: "global" | "organization";
}

// --- DASHBOARD DATA INTERFACES (From Backend Fetch) ---

export interface LessonDetail { 
    id: number; 
    title: string; 
    video_file: string | null; 
    quizzes: any[];
}
export interface AssignmentDetail {
    id: number; 
    title: string; 
    description: string; 
    max_score: number; 
    due_date: string | null;
}
export interface ModuleDetail { 
    id: number; 
    title: string; 
    description: string; 
    lessons: LessonDetail[];
    assignments: AssignmentDetail[];
}
export interface LiveClassMinimal { 
    id: number; 
    slug: string; 
    title: string; 
    recurrence_type: string; 
    start_date: string; 
    lessons_count: number; 
}
export interface EnrollmentManager { 
    id: number; 
    user_name: string; 
    user_email: string; 
    role: "student" | "teacher" | "ta"; 
    status: "active" | "dropped" | "suspended" | "completed"; 
    date_joined: string; 
}
export interface AssignmentSummary { 
    id: number; 
    title: string; 
    module_title: string; 
    total_submissions: number; 
    pending_review: number; 
}
export interface QuizSummary { 
    id: number; 
    title: string; 
    lesson_title: string; 
    total_attempts: number; 
    requires_review: number; 
}

export interface CourseManagementData {
    id: number;
    slug: string;
    title: string;
    status: CourseStatus;
    price: number | null;
    short_description: string;
    long_description: string;
    learning_objectives: string[]; // Array of strings from the backend
    thumbnail: string | null;
    promo_video: string | null;
    global_subcategory: string | null;
    global_level: string | null;
    global_category: string | null; // Parent ID
    org_category: string | null;
    org_level: string | null;
    
    // Nested dashboard data
    modules: ModuleDetail[];
    assignments_summary: AssignmentSummary[];
    quizzes_summary: QuizSummary[];
    enrollments: EnrollmentManager[];
    live_classes: LiveClassMinimal[];
}

// --- ZOD SCHEMAS for ATOMIC UPDATES ---

// Schemas for CurriculumManagerTab
export const ModuleAddSchema = z.object({
    title: z.string().min(3, "Title is required."),
    description: z.string().optional(),
});
export type ModuleAddValues = z.infer<typeof ModuleAddSchema>;

export const LessonCreateSchema = z.object({
    title: z.string().min(3, "Title is required."),
    video_file: z.any().optional(), // File or string
});
export type LessonCreateValues = z.infer<typeof LessonCreateSchema>;

export const AssignmentCreateSchema = z.object({
    title: z.string().min(5, "Title is required.").max(255),
    description: z.string().min(10, "Description is required."),
    due_date: z.string().optional().nullable(),
    max_score: z.number().min(1, "Max score is required.").default(100),
});
export type AssignmentCreateValues = z.infer<typeof AssignmentCreateSchema>;


// Schema for AssessmentsManagerTab: Grade Submission
export const GradeSubmissionSchema = z.object({
    grade: z.number().nullable().refine(val => val === null || val >= 0, "Grade must be non-negative."),
    feedback: z.string().optional(),
    submission_status: z.enum(['pending', 'graded', 'resubmit']),
});
export type GradeSubmissionValues = z.infer<typeof GradeSubmissionSchema>;


// Schema for EnrollmentManagerTab: Update Enrollment
export const UpdateEnrollmentSchema = z.object({
    status: z.enum(["active", "dropped", "suspended", "completed"]),
    role: z.enum(["student", "teacher", "ta"]),
});
export type UpdateEnrollmentValues = z.infer<typeof UpdateEnrollmentSchema>;


// Schema for SettingsTab: Global Course Update
export const SettingsSchema = z.object({
    title: z.string().min(5).max(100),
    short_description: z.string().min(10).max(200),
    long_description: z.string().min(50),
    // Frontend structure requires object with 'value', backend expects array of strings
    learning_objectives: z.array(z.object({ value: z.string().min(10, "Objective is too short.") })).min(2).max(10),
    global_category: z.string().min(1, "Required."),
    global_subcategory: z.string().min(1, "Required."),
    global_level: z.string().min(1, "Required."),
    org_category: z.string().optional().nullable(),
    org_level: z.string().optional().nullable(),
    thumbnail: z.any().optional(), 
    promo_video: z.string().url("Must be a valid URL link, or empty.").or(z.literal("")).optional().nullable(), 
    price: z.number().optional().nullable(),
    status: z.enum(["draft", "pending_review", "published"]),
});

// Used to reset the form internally
export interface SettingsFormInitialValues {
    title: string;
    short_description: string;
    long_description: string;
    learning_objectives: { value: string }[];
    global_category: string;
    global_subcategory: string;
    global_level: string;
    org_category: string | null;
    org_level: string | null;
    price: number | undefined;
    status: CourseStatus;
    thumbnail: File | string | null;
    promo_video: string | null;
}