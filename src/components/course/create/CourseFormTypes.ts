import * as z from "zod";
import { Info, BookOpen, FileImage, DollarSign } from "lucide-react";

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

export type CourseStatus = "draft" | "pending_review" | "published";

export const statusOptions: Record<CourseStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  published: "Published",
};

export const getExistingFileUrl = (fieldValue: string | null): string | null => {
  if (
    typeof fieldValue === "string" &&
    (fieldValue.startsWith("http") || fieldValue.startsWith("/media"))
  ) {
    return fieldValue;
  }
  return null;
};

const OptionSchema = z.object({
  id: z.number().optional(),
  text: z.string().optional().nullable(),
  is_correct: z.boolean().default(false),
});

const QuestionSchema = z.object({
  id: z.number().optional(),
  text: z.string().optional().nullable(),
  question_type: z.enum(["mcq", "text"]).default("mcq"),
  score_weight: z.number().min(0).default(1),
  order: z.number().optional(),
  instructor_hint: z.string().optional().nullable(),
  options: z.array(OptionSchema).optional().nullable(),
});

const QuizSchema = z.object({
  id: z.number().optional(),
  title: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  order: z.number().optional(),
  max_score: z.number().min(0).default(10),
  time_limit_minutes: z.number().optional().nullable(),
  max_attempts: z.number().min(0).default(3),
  questions: z.array(QuestionSchema).optional().nullable(),
});

const AssignmentSchema = z.object({
  id: z.number().optional(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  max_score: z.number().min(0).default(100),
});

const ResourceSchema = z.object({
  id: z.number().optional(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  resource_type: z.enum(['file', 'link', 'book_ref']),
  file: z.any().optional().nullable(),
  external_url: z.string().optional().nullable().or(z.literal("")),
  
  // UPDATED: Changed from number to string to support UUIDs
  course_book: z.string().optional().nullable(), 
  // ADDED: To match the backend's write_only field requirement
  book_id: z.string().optional().nullable(),
  
  reading_instructions: z.string().optional().nullable(),
});

export const courseFormSchema = z.object({
  title: z.string().min(1, "Title is required for drafts.").max(100),
  short_description: z.string().optional().nullable(),
  long_description: z.string().optional().nullable(),
  learning_objectives: z.array(z.object({ value: z.string() })).optional(),
  
  global_category: z.string().optional().nullable(),
  global_subcategory: z.string().optional().nullable(),
  global_level: z.string().optional().nullable(),
  org_category: z.string().optional().nullable(),
  org_level: z.string().optional().nullable(),
  
  thumbnail: z.any().optional().nullable(),
  promo_video: z.any().optional().nullable(),
  
  price: z.number().min(0).optional().default(0),
  status: z.enum(["draft", "pending_review", "published"]).default("draft"),
  
  instructors: z.array(z.number()).optional(),

  modules: z
    .array(
      z.object({
        id: z.number().optional(),
        title: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        assignments: z.array(AssignmentSchema).optional(),
        lessons: z
          .array(
            z.object({
              id: z.number().optional(),
              title: z.string().optional().nullable(),
              content: z.string().optional().nullable(),
              video_file: z.any().optional().nullable(),
              quizzes: z.array(QuizSchema).optional(),
              resources: z.array(ResourceSchema).optional(),
            })
          )
          .optional(),
      })
    )
    .optional(),
})
.superRefine((data, ctx) => {
  if (data.status !== 'draft') {
    if (!data.short_description || data.short_description.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Short description is required for publishing (min 10 chars).",
        path: ["short_description"],
      });
    }
    if (!data.long_description || data.long_description.length < 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Detailed description is required for publishing (min 50 chars).",
        path: ["long_description"],
      });
    }
    if (!data.global_category) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Category is required.", path: ["global_category"] });
    }
    if (!data.global_subcategory) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Subcategory is required.", path: ["global_subcategory"] });
    }
    if (!data.global_level) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Level is required.", path: ["global_level"] });
    }
    if (!data.learning_objectives || data.learning_objectives.length < 2 || data.learning_objectives.some(o => o.value.length < 5)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least 2 valid learning objectives are required.",
        path: ["learning_objectives"],
      });
    }
    if (!data.thumbnail) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Thumbnail is required.", path: ["thumbnail"] });
    }
    
    if (!data.modules || data.modules.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Course must have at least one module.", path: ["modules"] });
    } else {
      data.modules.forEach((mod, mIndex) => {
        if (!mod.title || mod.title.length < 3) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Module title is required for publishing.",
              path: ["modules", mIndex, "title"],
            });
        }
        if (!mod.lessons || mod.lessons.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Module "${mod.title}" must have at least one lesson.`,
            path: ["modules", mIndex, "lessons"],
          });
        } else {
            mod.lessons.forEach((lesson, lIndex) => {
                if (!lesson.title || lesson.title.length < 3) {
                    ctx.addIssue({
                      code: z.ZodIssueCode.custom,
                      message: "Lesson title is required for publishing.",
                      path: ["modules", mIndex, "lessons", lIndex, "title"],
                    });
                }
            })
        }
      });
    }
  }
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

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
      "instructors"
    ] as const,
  },
  { 
    id: 2, 
    name: "Curriculum", 
    icon: BookOpen, 
    fields: ["modules"] as const 
  },
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