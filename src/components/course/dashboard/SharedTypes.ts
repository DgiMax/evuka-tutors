import * as z from "zod";

// --- CORE TYPES ---

export type CourseStatus = "draft" | "pending_review" | "published" | "archived";
export const statusOptions: Record<CourseStatus, string> = {
    draft: "Draft",
    pending_review: "Pending Review",
    published: "Published",
    archived: "Archived",
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

// --- DASHBOARD DATA INTERFACES ---

export interface OptionDetail {
    id?: number;
    text: string;
    is_correct: boolean;
}

export interface QuestionDetail {
    id?: number;
    text: string;
    question_type: "mcq" | "text";
    score_weight: number;
    order: number;
    options: OptionDetail[];
}

export interface QuizDetail {
    id: number;
    title: string;
    description: string;
    max_score: number;
    time_limit_minutes: number;
    max_attempts: number;
    questions: QuestionDetail[];
}

export interface LessonDetail { 
    id: number; 
    title: string;
    content: string; 
    video_file: string | null; 
    quizzes: QuizDetail[];
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
    learning_objectives: string[]; 
    thumbnail: string | null;
    promo_video: string | null;
    global_subcategory: string | null;
    global_level: string | null;
    global_category: string | null; 
    org_category: string | null;
    org_level: string | null;
    is_public: boolean;
    
    modules: ModuleDetail[];
    assignments_summary: AssignmentSummary[];
    quizzes_summary: QuizSummary[];
    enrollments: EnrollmentManager[];
    live_classes: LiveClassMinimal[];
}

// --- ZOD SCHEMAS ---

export const ModuleAddSchema = z.object({
    title: z.string().min(3, "Title is required."),
    description: z.string().optional(),
});
export type ModuleAddValues = z.infer<typeof ModuleAddSchema>;

export const LessonCreateSchema = z.object({
    title: z.string().min(3, "Title is required."),
    content: z.string().optional(),
    video_file: z.any().optional(), 
});
export type LessonCreateValues = z.infer<typeof LessonCreateSchema>;

export const OptionSchema = z.object({
    id: z.number().optional(),
    text: z.string().min(1, "Option text required"),
    is_correct: z.boolean(),
});

export const QuestionSchema = z.object({
    id: z.number().optional(),
    text: z.string().min(3, "Question text required"),
    question_type: z.enum(["mcq", "text"]),
    score_weight: z.number().min(1).default(1),
    order: z.number().default(0),
    options: z.array(OptionSchema).optional(),
});

export const QuizCreateSchema = z.object({
    title: z.string().min(3, "Title is required"),
    description: z.string().optional(),
    max_score: z.number().min(1).default(10),
    time_limit_minutes: z.number().min(1).default(30),
    max_attempts: z.number().min(1).default(3),
    questions: z.array(QuestionSchema).optional(),
});
export type QuizCreateValues = z.infer<typeof QuizCreateSchema>;

export const AssignmentCreateSchema = z.object({
    title: z.string().min(5, "Title is required.").max(255),
    description: z.string().min(10, "Description is required."),
    due_date: z.string().optional().nullable(),
    max_score: z.number().min(1, "Max score is required.").default(100),
});
export type AssignmentCreateValues = z.infer<typeof AssignmentCreateSchema>;

export const GradeSubmissionSchema = z.object({
    grade: z.number().nullable().refine(val => val === null || val >= 0, "Grade must be non-negative."),
    feedback: z.string().optional(),
    submission_status: z.enum(['pending', 'graded', 'resubmit']),
});
export type GradeSubmissionValues = z.infer<typeof GradeSubmissionSchema>;

export const UpdateEnrollmentSchema = z.object({
    status: z.enum(["active", "dropped", "suspended", "completed"]),
    role: z.enum(["student", "teacher", "ta"]),
});
export type UpdateEnrollmentValues = z.infer<typeof UpdateEnrollmentSchema>;

export const SettingsSchema = z.object({
    title: z.string().min(5).max(100),
    short_description: z.string().min(10).max(200),
    long_description: z.string().min(50),
    learning_objectives: z.array(z.object({ value: z.string().min(10, "Objective is too short.") })).min(2).max(10),
    
    global_category: z.string().min(1, "Required."),
    global_subcategory: z.string().min(1, "Required."),
    global_level: z.string().min(1, "Required."),

    org_category: z.string().optional().nullable(),
    org_level: z.string().optional().nullable(),

    thumbnail: z.any().optional(), 
    promo_video: z.string().url("Must be a valid URL link.").or(z.literal("")).optional().nullable(), 
    
    price: z.coerce.number().min(0).optional().nullable(), 
    
    status: z.enum(["draft", "pending_review", "published", "archived"]), 
    is_public: z.boolean().optional() 
});

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
    is_public: boolean;
}