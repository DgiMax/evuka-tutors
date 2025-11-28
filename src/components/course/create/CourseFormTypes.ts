// app/(tutor)/courses/create/CourseFormTypes.ts

import * as z from "zod";
import { Info, BookOpen, FileImage, DollarSign } from "lucide-react";

// --- Form Options ---
export interface DropdownOption {
  id: string;
  name: string;
}
export interface SubCategoryOption {
  id: string;
  name: string;
  parent_id: string;
  slug: string;
}
export interface FormOptionsData {
  globalCategories: DropdownOption[];
  globalSubCategories: SubCategoryOption[];
  globalLevels: DropdownOption[];
  orgCategories: DropdownOption[];
  orgLevels: DropdownOption[];
  context: "global" | "organization";
}

// --- Status ---
export type CourseStatus = "draft" | "pending_review" | "published";

export const statusOptions: Record<CourseStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  published: "Published",
};

// --- Helper ---
export const getExistingFileUrl = (fieldValue: string | null): string | null => {
  if (
    typeof fieldValue === "string" &&
    (fieldValue.startsWith("http") || fieldValue.startsWith("/media"))
  ) {
    return fieldValue;
  }
  return null;
};

// --- Zod Schemas ---

const OptionSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(1, "Option text is required."),
  is_correct: z.boolean().default(false),
});

const QuestionSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(1, "Question text is required."),
  question_type: z.enum(["mcq", "text"]).default("mcq"),
  score_weight: z.number().min(1, "Score must be at least 1.").default(1),
  order: z.number().optional(),
  instructor_hint: z.string().optional(),
  options: z.array(OptionSchema).optional(),
});

const QuizSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(3, "Quiz title is required."),
  description: z.string().max(500).optional(),
  order: z.number().optional(),
  max_score: z.number().min(1, "Max score must be at least 1.").default(10),
  time_limit_minutes: z.number().optional().nullable(),
  max_attempts: z.number().min(1, "Attempts must be at least 1.").default(3),
  questions: z
    .array(QuestionSchema)
    .min(1, "A quiz must have at least one question."),
});

const AssignmentSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(5, "Assignment title is required."),
  description: z.string().min(10, "Description is required."),
  due_date: z.string().optional().nullable(),
  max_score: z.number().min(1, "Max score is required.").default(100),
});

export const courseFormSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters.")
    .max(100),
  short_description: z
    .string()
    .min(10, "Too short!")
    .max(200, "Keep it under 200 characters."),
  long_description: z
    .string()
    .min(50, "Please provide a detailed description."),
  learning_objectives: z
    .array(z.object({ value: z.string().min(10, "Objective is too short.") }))
    .min(2, "Add at least 2 objectives.")
    .max(10, "Maximum 10 objectives allowed."),
  global_category: z.string().min(1, "Marketplace category is required."),
  global_subcategory: z.string().min(1, "Marketplace subcategory is required."),
  global_level: z.string().min(1, "Difficulty level is required."),
  org_category: z.string().optional(),
  org_level: z.string().optional(),
  thumbnail: z.any().optional(),
  promo_video: z.any().optional(),
  price: z.number().optional(),
  status: z.enum(["draft", "pending_review", "published"]).default("draft"),
  modules: z
    .array(
      z.object({
        id: z.number().optional(), // Keep ID for edits
        title: z.string().min(3, "Module title is required.").max(100),
        description: z.string().max(500).optional(),
        assignments: z.array(AssignmentSchema).optional(),
        lessons: z
          .array(
            z.object({
              id: z.number().optional(), // Keep ID for edits
              title: z.string().min(3, "Lesson title is required.").max(100),
              video_file: z.any().optional(),
              quizzes: z.array(QuizSchema).optional(),
            })
          )
          .min(1, "Module must have at least one lesson."),
      })
    )
    .min(1, "Course must have at least one module."),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

// --- Stepper Config ---
export const steps = [
  {
    id: 1,
    name: "Basic Info",
    icon: Info,
    fields: [
      "title",
      "short_description",
      "long_description",
      "learning_objectives",
      "global_category",
      "global_subcategory",
      "global_level",
      "org_category",
      "org_level",
    ] as const,
  },
  { id: 2, name: "Curriculum", icon: BookOpen, fields: ["modules"] as const },
  {
    id: 3,
    name: "Media",
    icon: FileImage,
    fields: ["thumbnail", "promo_video"] as const,
  },
  {
    id: 4,
    name: "Pricing & Publish",
    icon: DollarSign,
    fields: ["price", "status"] as const,
  },
];