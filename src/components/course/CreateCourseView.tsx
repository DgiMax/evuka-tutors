"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  useFieldArray,
  Control,
  UseFormWatch,
  SubmitHandler,
  type Resolver,
} from "react-hook-form";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Path } from "react-hook-form";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Info,
  BookOpen,
  FileImage,
  DollarSign,
  Send,
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  Loader2,
  Check,
} from "lucide-react";

import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CreateCourseViewProps {
  isEditMode?: boolean;
  courseSlug?: string;
}

interface DropdownOption {
  id: string;
  name: string;
}

interface SubCategoryOption {
  id: string;
  name: string;
  parent_id: string;
  slug: string;
}

interface FormOptionsData {
  globalCategories: DropdownOption[];
  globalSubCategories: SubCategoryOption[];
  globalLevels: DropdownOption[];
  orgCategories: DropdownOption[];
  orgLevels: DropdownOption[];
  context: "global" | "organization";
}

type CourseStatus = "draft" | "pending_review" | "published";

const statusOptions: Record<CourseStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  published: "Published",
};

const getExistingFileUrl = (fieldValue: string | null): string | null => {
  if (
    typeof fieldValue === "string" &&
    (fieldValue.startsWith("http") || fieldValue.startsWith("/media"))
  ) {
    return fieldValue;
  }
  return null;
};

const OptionSchema = z.object({
  id: z.number().optional(), // Used for editing existing options
  text: z.string().min(1, "Option text is required."),
  is_correct: z.boolean().default(false),
});

const QuestionSchema = z.object({
  id: z.number().optional(), // Used for editing existing questions
  text: z.string().min(1, "Question text is required."),
  question_type: z.enum(["mcq", "text"]).default("mcq"),
  score_weight: z.number().min(1, "Score must be at least 1.").default(1),
  order: z.number().optional(),
  instructor_hint: z.string().optional(),
  options: z.array(OptionSchema).optional(), // Required for MCQ type
});

const QuizSchema = z.object({
  id: z.number().optional(), // Used for editing existing quizzes
  title: z.string().min(3, "Quiz title is required."),
  description: z.string().max(500).optional(),
  order: z.number().optional(),
  max_score: z.number().min(1, "Max score must be at least 1.").default(10),
  time_limit_minutes: z.number().optional().nullable(),
  max_attempts: z.number().min(1, "Attempts must be at least 1.").default(3),
  questions: z.array(QuestionSchema).min(1, "A quiz must have at least one question."),
});

// --- 📝 ASSIGNMENT SCHEMA DEFINITION ---

const AssignmentSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(5, "Assignment title is required."),
  description: z.string().min(10, "Description is required."),
  due_date: z.string().optional().nullable(),
  max_score: z.number().min(1, "Max score is required.").default(100),
});

const courseFormSchema = z.object({
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
        title: z.string().min(3, "Module title is required.").max(100),
        description: z.string().max(500).optional(),
        assignments: z.array(AssignmentSchema).optional(),
        lessons: z
          .array(
            z.object({
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
type CourseFormValues = z.infer<typeof courseFormSchema>;

type ModuleLessonsProps = {
  moduleIndex: number;
  control: Control<CourseFormValues>;
  watch: UseFormWatch<CourseFormValues>;
  setValue: (
    name: Path<CourseFormValues>,
    value: any,
    options?: { shouldValidate?: boolean; shouldDirty?: boolean }
  ) => void;
};

const ModuleLessons = ({
  moduleIndex,
  control,
  watch,
  setValue,
}: ModuleLessonsProps) => {
  const { fields: lessons, append: appendLesson, remove: removeLesson } =
    useFieldArray({
      control,
      name: `modules.${moduleIndex}.lessons`,
    });

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    lessonIndex: number
  ) => {
    const file = event.target.files?.[0] || null;
    const fieldPath = `modules.${moduleIndex}.lessons.${lessonIndex}.video_file` as Path<CourseFormValues>;

    if (file) {
      setValue(fieldPath, file, { shouldValidate: true });
    } else {
      setValue(fieldPath, null);
    }
  };

  return (
    <div className="pl-4 border-l border-gray-300 ml-2">
      <h4 className="font-medium text-sm mb-2 text-gray-700">Lessons</h4>

      {lessons.map((lesson, lessonIndex) => {
        const videoFileValue = watch(
          `modules.${moduleIndex}.lessons.${lessonIndex}.video_file`
        );
        const isNewFile = videoFileValue instanceof File;
        const previewUrl =
          isNewFile
            ? URL.createObjectURL(videoFileValue)
            : typeof videoFileValue === "string"
            ? videoFileValue
            : null;

        return (
          <Accordion
            key={lesson.id}
            type="single"
            collapsible
            className="w-full mb-2"
          >
            <AccordionItem
              value={`lesson-${lesson.id}`}
              className="border rounded bg-white"
            >
              <AccordionTrigger className="px-4 py-2 text-sm hover:no-underline">
                Lesson {lessonIndex + 1}:{" "}
                {watch(
                  `modules.${moduleIndex}.lessons.${lessonIndex}.title`
                ) || "New Lesson"}
              </AccordionTrigger>

              <AccordionContent className="space-y-3 p-4 border-t">
                <FormField
                  control={control}
                  name={`modules.${moduleIndex}.lessons.${lessonIndex}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">
                        Lesson Title
                      </FormLabel>
                      <FormControl>
                        <ShadcnInput
                          placeholder="e.g., Setting up your project"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel className="text-xs font-medium">
                    Video File (MP4/WebM)
                  </FormLabel>
                  <FormControl>
                    <ShadcnInput
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={(e) => handleFileChange(e, lessonIndex)}
                      className="rounded"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {previewUrl
                      ? `Currently loaded: ${
                          isNewFile ? videoFileValue.name : "Existing Video"
                        }`
                      : "Upload a file for this lesson."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>

                {previewUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 bg-black">
                    <video
                      controls
                      playsInline
                      src={previewUrl}
                      className="w-full h-auto"
                    />
                  </div>
                )}

                <QuizBuilder
                    moduleIndex={moduleIndex}
                    lessonIndex={lessonIndex}
                    control={control}
                    watch={watch}
                    setValue={setValue}
                />

                <div className="text-right mt-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeLesson(lessonIndex)}
                    disabled={lessons.length <= 1}
                  >
                    <Trash2 size={14} className="mr-1" /> Remove Lesson
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 rounded"
        onClick={() => appendLesson({ title: "", video_file: null })}
      >
        <Plus className="mr-2" size={16} /> Add Lesson
      </Button>
    </div>
  );
};

type AssignmentBuilderProps = {
  moduleIndex: number;
  control: Control<CourseFormValues>;
};

const AssignmentBuilder = ({ moduleIndex, control }: AssignmentBuilderProps) => {
  const {
    fields: assignments,
    append: appendAssignment,
    remove: removeAssignment,
  } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.assignments`,
  });

  return (
    <div className="pt-3 border-t mt-4 space-y-3">
      <h4 className="font-medium text-sm text-gray-700 flex items-center">
        <Send size={16} className="mr-1" /> Module Assignment (Optional)
      </h4>
      
      {assignments.map((assignment, index) => (
        <Card key={assignment.id} className="p-3 bg-white border shadow-sm">
          <div className="flex justify-between items-start mb-2 border-b pb-2">
            <h5 className="font-semibold text-sm">Assignment {index + 1}: {assignment.title || "New Assignment"}</h5>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeAssignment(index)}>
              <Trash2 size={14} className="text-red-500 hover:text-red-600" />
            </Button>
          </div>
          
          <FormField
            control={control}
            name={`modules.${moduleIndex}.assignments.${index}.title`}
            render={({ field }) => (
              <FormItem className="mb-2">
                <FormLabel className="text-xs">Title</FormLabel>
                <FormControl><ShadcnInput placeholder="Project Name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`modules.${moduleIndex}.assignments.${index}.description`}
            render={({ field }) => (
              <FormItem className="mb-2">
                <FormLabel className="text-xs">Description</FormLabel>
                <FormControl><Textarea placeholder="Full instructions for the student." {...field} rows={3} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`modules.${moduleIndex}.assignments.${index}.max_score`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Max Score</FormLabel>
                <FormControl>
                    <ShadcnInput 
                        type="number" 
                        min={1} 
                        placeholder="100" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded"
        onClick={() => appendAssignment({ title: "", description: "", max_score: 100 })}
        disabled={assignments.length > 0} // Only allow one assignment per module for simplicity
      >
        <Plus className="mr-2" size={16} /> Add Module Assignment
      </Button>
    </div>
  );
};

// --- 2.1 OPTION BUILDER COMPONENT ---

type OptionBuilderProps = {
  moduleIndex: number;
  lessonIndex: number;
  quizIndex: number;
  questionIndex: number;
  control: Control<CourseFormValues>;

  setValue: (
    name: Path<CourseFormValues>,
    value: any,
    options?: { shouldValidate?: boolean; shouldDirty?: boolean }
  ) => void;
};

const OptionBuilder = ({
  moduleIndex,
  lessonIndex,
  quizIndex,
  questionIndex,
  control,
  setValue,
}: OptionBuilderProps) => {
  const {
    fields: options,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions.${questionIndex}.options`,
  });

  const handleCorrectChange = (newIndex: number) => {
    // Logic to ensure only one option is correct
    options.forEach((_, index) => {
      setValue( 
        `modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions.${questionIndex}.options.${index}.is_correct` as Path<CourseFormValues>,
        index === newIndex,
        { shouldValidate: true }
      );
    });
  };

  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      <h6 className="text-xs font-semibold">Options (Select Correct)</h6>
      {options.map((optionField, optionIndex) => (
        <div key={optionField.id} className="flex items-center gap-2">
          <FormField
            control={control}
            name={`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions.${questionIndex}.options.${optionIndex}.is_correct`}
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleCorrectChange(optionIndex);
                      }
                    }}
                    aria-label={`Mark Option ${optionIndex + 1} as Correct`}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions.${questionIndex}.options.${optionIndex}.text`}
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormControl><ShadcnInput placeholder={`Option ${optionIndex + 1}`} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeOption(optionIndex)}
            disabled={options.length <= 2}
          >
            <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-6 text-xs p-0"
        onClick={() => appendOption({ text: `Option ${options.length + 1}`, is_correct: false })}
        disabled={options.length >= 6}
      >
        <Plus size={14} className="mr-1" /> Add Option
      </Button>
    </div>
  );
};


// --- 2.2 QUESTION BUILDER COMPONENT ---

type QuestionBuilderProps = {
  moduleIndex: number;
  lessonIndex: number;
  quizIndex: number;
  control: Control<CourseFormValues>;
  watch: UseFormWatch<CourseFormValues>;

  setValue: (
    name: Path<CourseFormValues>,
    value: any,
    options?: { shouldValidate?: boolean; shouldDirty?: boolean }
  ) => void;
};

const QuestionBuilder = ({
  moduleIndex,
  lessonIndex,
  quizIndex,
  control,
  watch,
  setValue,
}: QuestionBuilderProps) => {
  const {
    fields: questions,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions`,
  });

  return (
    <div className="pt-3 border-t space-y-3">
      <h5 className="font-medium text-sm text-gray-700">Questions</h5>

      {questions.map((questionField, questionIndex) => {
        const fieldPath = `modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions.${questionIndex}` as Path<CourseFormValues>;
        const watchedType = watch(`${fieldPath}.question_type` as Path<CourseFormValues>);
        
        return (
          <Card key={questionField.id} className="p-3 bg-gray-50 border shadow-none">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-sm">Question {questionIndex + 1}</span>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(questionIndex)} disabled={questions.length <= 1}>
                <Trash2 size={14} className="text-gray-500 hover:text-red-600" />
              </Button>
            </div>

            <FormField control={control} name={`${fieldPath}.text` as Path<CourseFormValues>} render={({ field }) => (
                <FormItem className="mb-2">
                  <FormLabel className="text-xs">Question Text</FormLabel>
                  <FormControl><Textarea placeholder="What is the main topic of this lesson?" {...field} rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={control} name={`${fieldPath}.question_type` as Path<CourseFormValues>} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                        <SelectItem value="text">Text Answer (Manual Grading)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={control} name={`${fieldPath}.score_weight` as Path<CourseFormValues>} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Score</FormLabel>
                    <FormControl>
                      <ShadcnInput type="number" min={1} placeholder="1" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchedType === "mcq" && (
              <OptionBuilder
                moduleIndex={moduleIndex}
                lessonIndex={lessonIndex}
                quizIndex={quizIndex}
                questionIndex={questionIndex}
                control={control}
                setValue={setValue}
              />
            )}
            
            {watchedType === "text" && (
                <FormField control={control} name={`${fieldPath}.instructor_hint` as Path<CourseFormValues>} render={({ field }) => (
                        <FormItem className="mt-3">
                            <FormLabel className="text-xs">Instructor Hint (for grading)</FormLabel>
                            <FormControl><ShadcnInput placeholder="Expected short answer or notes for grader" {...field} /></FormControl>
                        </FormItem>
                    )}
                />
            )}
          </Card>
        );
      })}
      <Button type="button" variant="outline" size="sm" className="rounded w-full" onClick={() => appendQuestion({
            text: `New Question ${questions.length + 1}`,
            question_type: "mcq",
            score_weight: 1,
            options: [{ text: "Correct Option", is_correct: true }, { text: "Wrong Option", is_correct: false }],
          })}
      >
        <Plus className="mr-2" size={16} /> Add Question
      </Button>
    </div>
  );
};


// --- 2.3 QUIZ BUILDER COMPONENT (Lesson-Level) ---

type QuizBuilderProps = {
  moduleIndex: number;
  lessonIndex: number;
  control: Control<CourseFormValues>;
  watch: UseFormWatch<CourseFormValues>;

  setValue: (
        name: Path<CourseFormValues>,
        value: any,
        options?: { shouldValidate?: boolean; shouldDirty?: boolean }
    ) => void;
};

const QuizBuilder = ({
  moduleIndex,
  lessonIndex,
  control,
  watch,
  setValue,
}: QuizBuilderProps) => {
  const {
    fields: quizzes,
    append: appendQuiz,
    remove: removeQuiz,
  } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.lessons.${lessonIndex}.quizzes`,
  });

  return (
    <div className="pl-4 border-l border-gray-300 ml-2 mt-4 space-y-4">
      <h4 className="font-medium text-sm text-gray-700 flex items-center">
        <BookOpen size={16} className="mr-1" /> Lesson Quiz (Optional)
      </h4>

      {quizzes.map((quizField, quizIndex) => (
        <Card key={quizField.id} className="bg-white border rounded shadow-sm p-4 space-y-3">
          
          <div className="flex justify-between items-start border-b pb-2 mb-2">
            <FormField control={control} name={`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.title`} render={({ field }) => (
                <FormItem className="flex-grow mr-2">
                  <FormLabel className="text-sm">Quiz Title</FormLabel>
                  <FormControl><ShadcnInput placeholder="e.g., Chapter 1 Knowledge Check" {...field} className="text-md font-semibold h-auto" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeQuiz(quizIndex)}>
              <Trash2 className="text-red-500" size={16} />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField control={control} name={`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.max_attempts`} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Max Attempts</FormLabel>
                  <FormControl><ShadcnInput type="number" min={1} placeholder="3" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={control} name={`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.time_limit_minutes`} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Time Limit (Mins, Optional)</FormLabel>
                  <FormControl><ShadcnInput type="number" min={1} placeholder="60" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <QuestionBuilder
            moduleIndex={moduleIndex}
            lessonIndex={lessonIndex}
            quizIndex={quizIndex}
            control={control}
            watch={watch}
            setValue={setValue}
          />
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded"
        onClick={() => appendQuiz({
            title: `New Quiz ${quizzes.length + 1}`,
            max_score: 10,
            max_attempts: 3,
            questions: [{
                text: "Sample Question",
                question_type: "mcq",
                score_weight: 1,
                options: [{ text: "Option A", is_correct: true }, { text: "Option B", is_correct: false }],
            }],
        })}
        disabled={quizzes.length > 0} // Only allow one quiz per lesson for simplicity
      >
        <Plus className="mr-2" size={16} /> Add Lesson Quiz
      </Button>
    </div>
  );
};

// --- END 1.2 QUIZ BUILDERS ---


// --- Main Component ---
const steps = [
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
      "global_level",
      "org_category",
      "org_level",
    ] as const,
  },
  { id: 2, name: "Curriculum", icon: BookOpen, fields: ["modules"] as const },
  { id: 3, name: "Media", icon: FileImage, fields: ["thumbnail", "promo_video"] as const },
  { id: 4, name: "Pricing & Publish", icon: DollarSign, fields: ["price", "status"] as const },
];

export default function CourseCreatePage({
  isEditMode = false,
  courseSlug,
}: CreateCourseViewProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formOptions, setFormOptions] = useState<FormOptionsData | null>(null);
  const [isFetchingOptions, setIsFetchingOptions] = useState(true);

  const { user } = useAuth();
  const { activeSlug } = useActiveOrg();

  const isOrgAdminOrOwner = useMemo(() => {
    if (!user || !activeSlug || !user.organizations) {
      return false;
    }

    const activeOrgMembership = user.organizations.find(
      (org) => org.organization_slug === activeSlug
    );

    if (activeOrgMembership && activeOrgMembership.role) {
      const role = activeOrgMembership.role.toLowerCase();
      return role === "admin" || role === "owner";
    }

    return false;
  }, [user, activeSlug]);

  useEffect(() => {
    const fetchOptions = async () => {
      setIsFetchingOptions(true);
      try {
        console.log(
          "=== FETCHING FORM OPTIONS ===",
          activeSlug || "(no active slug)"
        );

        const url = activeSlug
          ? `/courses/form-options/?slug=${activeSlug}`
          : "/courses/form-options/";

        const response = await api.get(url);
        const data = response.data;

        const normalized = {
          globalCategories: data.globalCategories || [],
          globalSubCategories: data.globalSubCategories || [],
          globalLevels: data.globalLevels || [],
          orgCategories: data.orgCategories || [],
          orgLevels: data.orgLevels || [],
          context: data.context || "global",
        };

        setFormOptions(normalized);
      } catch (error) {
        console.error("Failed to fetch form options:", error);
        toast.error("Failed to load form data. Please try refreshing.", {
          duration: 5000,
        });
      } finally {
        setIsFetchingOptions(false);
      }
    };

    fetchOptions();
  }, [activeSlug]);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema) as unknown as Resolver<CourseFormValues>,
    defaultValues: {
      title: "",
      short_description: "",
      long_description: "",
      learning_objectives: [{ value: "" }, { value: "" }],
      global_category: "",
      global_subcategory: "",
      global_level: "",
      org_category: "",
      org_level: "",
      status: "draft",
      price: undefined,
      promo_video: null,
      thumbnail: null,
      modules: [
        {
          title: "",
          description: "",
          lessons: [{ title: "", video_file: null }],
        },
      ],
    },
    mode: "onBlur",
    shouldUnregister: false,
  });


const watchedGlobalCategoryFromForm = form.watch("global_category");

    // 2. FILTER the subcategories based on the watched category
    const filteredSubCategories = useMemo(() => {
        if (!formOptions || !watchedGlobalCategoryFromForm) {
            return [];
        }
        // Filter the full list of subcategories by the selected parent ID
        return formOptions.globalSubCategories.filter(
            (sub) => sub.parent_id === watchedGlobalCategoryFromForm
        );
    }, [formOptions, watchedGlobalCategoryFromForm]);

  // ✅ 1. Destructure reset here to get a stable function reference

const { reset } = form; // Assuming reset is destructured from form

useEffect(() => {
  const fetchCourse = async () => {
    if (!isEditMode || !formOptions) return;

    try {
      const response = await api.get(`/tutor-courses/${courseSlug}/`);
      const course = response.data;

      // ✅ Reset the form with fetched data
      reset({
        title: course.title || "",
        short_description: course.short_description || "",
        long_description: course.long_description || "",
        learning_objectives:
          course.learning_objectives?.map((obj: string) => ({ value: obj })) ||
          [{ value: "" }, { value: "" }],
        global_category: course.global_category?.toString() || "",
        global_subcategory: course.global_subcategory?.toString() || "",
        global_level: course.global_level?.toString() || "",
        org_category: course.org_category?.toString() || "",
        org_level: course.org_level?.toString() || "",
        status: course.status || "draft",
        price: course.price ? parseFloat(course.price) : undefined,
        promo_video: getExistingFileUrl(course.promo_video),
        thumbnail: getExistingFileUrl(course.thumbnail),
        
        modules:
          course.modules?.map((mod: any) => ({
            // --- MODULE LEVEL FIELDS ---
            id: mod.id, // Ensure module ID is preserved for editing
            title: mod.title,
            description: mod.description,

            // 1. MAP ASSIGNMENTS (Module Level)
            assignments: mod.assignments?.map((assignment: any) => ({
              id: assignment.id,
              title: assignment.title,
              description: assignment.description,
              due_date: assignment.due_date,
              max_score: assignment.max_score,
            })) || [],

            // 2. MAP LESSONS (Lesson Level)
            lessons:
              mod.lessons?.map((les: any) => ({
                id: les.id, // Ensure lesson ID is preserved
                title: les.title,
                video_file: getExistingFileUrl(les.video_file),

                // 3. MAP QUIZZES (Lesson Level)
                quizzes: les.quizzes?.map((quiz: any) => ({
                  id: quiz.id,
                  title: quiz.title,
                  description: quiz.description,
                  max_score: quiz.max_score,
                  time_limit_minutes: quiz.time_limit_minutes,
                  max_attempts: quiz.max_attempts,

                  // 4. MAP QUESTIONS (Quiz Level)
                  questions: quiz.questions?.map((question: any) => ({
                    id: question.id,
                    text: question.text,
                    question_type: question.question_type,
                    score_weight: question.score_weight,
                    instructor_hint: question.instructor_hint,

                    // 5. MAP OPTIONS (Question Level - for MCQ)
                    options: question.options?.map((option: any) => ({
                      id: option.id,
                      text: option.text,
                      is_correct: option.is_correct,
                    })) || [],
                  })) || [],
                })) || [], // End Quizzes mapping
              })) || [{ title: "", video_file: null }], // Default Lesson if none found
          })) || [ // End Module mapping
            { title: "", description: "", assignments: [], lessons: [{ title: "", video_file: null }] },
          ],
      });
    } catch (err) {
      console.error("❌ Failed to fetch course:", err);
      toast.error("Could not load course details for editing.");
    } finally {
      // ✅ Code here runs no matter what — success or error
      // You typically clear loading states here
      setIsLoading(false);
    }
  };

  if (isEditMode && formOptions) {
    // Only fetch if we are in edit mode AND options are loaded
    fetchCourse();
  } else {
    // We are in create mode, or options aren't ready.
    // We are NOT loading a course, so ensure isLoading is false.
    setIsLoading(false); 
  }

}, [isEditMode, courseSlug, formOptions, reset]);

  const { fields: objectives, append: appendObjective, remove: removeObjective } = useFieldArray({
    control: form.control,
    name: "learning_objectives",
  });

  const { fields: modules, append: appendModule, remove: removeModule } = useFieldArray({
    control: form.control,
    name: "modules",
  });

 const handleFormSubmit = async (
  data: CourseFormValues,
  status: CourseStatus,
  validate: boolean = true
) => {
  setIsLoading(true);

  // 1. Validation (This is still critical, but the backend now handles the finer details)
  if (validate) {
    if (activeSlug) {
      // Frontend check for mandatory Org fields is good, but rely on backend for full validation
      if (!data.org_category || !data.org_level) {
        toast.error(
          "Organization category and level are required for organization courses.",
          { duration: 4000 }
        );
        setCurrentStep(1);
        if (!data.org_category)
          form.setError("org_category" as any, { type: "manual", message: "Required." });
        if (!data.org_level)
          form.setError("org_level" as any, { type: "manual", message: "Required." });
        setIsLoading(false);
        return;
      }
    }
    // NOTE: We rely on the Zod/DRF validation for global_category/global_subcategory presence.
  }

  const formData = new FormData();

  // Append text fields
  formData.append("title", data.title);
  formData.append("short_description", data.short_description);
  formData.append("long_description", data.long_description);

  // --- 👇 TAXONOMY UPDATE IN SUBMISSION: ADD PARENT CATEGORY FIELD 👇 ---
  formData.append("global_category", data.global_category || ""); // ✅ NEW: Parent Category ID
  formData.append("global_subcategory", data.global_subcategory || ""); // Child Subcategory ID (The one saved on the model)
  formData.append("global_level", data.global_level || "");
  formData.append("org_category", data.org_category || "");
  formData.append("org_level", data.org_level || "");
  // --- 👆 END TAXONOMY UPDATE ---

formData.append("price", data.price?.toString() || "0");
  formData.append("status", status);
  formData.append("is_published", status === "published" ? "true" : "false");

  // 🖼️ Append file fields (only if new files exist)
  if (data.thumbnail instanceof File) {
    formData.append("thumbnail", data.thumbnail);
  }
  if (data.promo_video instanceof File) {
    formData.append("promo_video", data.promo_video);
  }

  // 🧠 Handle nested lesson files
  const modulesToSubmit = data.modules.map((mod, modIndex) => ({
    ...mod,
    assignments: mod.assignments || [],

    lessons: mod.lessons.map((les, lesIndex) => {
      const quizzesToSubmit = les.quizzes || [];
      const lessonData: any = { 
          title: les.title, 
          quizzes: quizzesToSubmit 
      };
      const videoFileValue = les.video_file;

      if (videoFileValue instanceof File) {
        // Create a unique key for the file
        const uniqueKey = `video_file_m${modIndex}_l${lesIndex}`;
        formData.append(uniqueKey, videoFileValue);
        lessonData.video_file = uniqueKey; // send reference key to backend
      } else if (typeof videoFileValue === "string" && videoFileValue) {
        // Preserve existing URL
        lessonData.video_file = videoFileValue;
      } else {
        lessonData.video_file = null;
      }

      return lessonData;
    }),
  }));


  // Append processed module data
  formData.append("learning_objectives", JSON.stringify(data.learning_objectives));
  formData.append("modules", JSON.stringify(modulesToSubmit));

try {
    const response = isEditMode
      ? await api.put(`/tutor-courses/${courseSlug}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      : await api.post("/tutor-courses/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

    const { title: courseTitle, slug } = response.data;

    let message = "";
    let description = "";
    let toastContent: React.ReactNode;

    if (isEditMode) {
      if (status === "published") {
        message = "✅ Course Updated & Published!";
        description = `Your course "${courseTitle}" changes are live.`;
      } else if (status === "pending_review") {
        message = "🕓 Course Update Submitted for Review!";
        description = `Your updates to "${courseTitle}" have been submitted to admins.`;
      } else {
        message = "💾 Changes Saved!";
        description = `Updates to your course "${courseTitle}" have been saved as a draft.`;
      }

      toastContent = (
        <div className="flex flex-col gap-1">
          <p>{message}</p>
          <p className="text-sm text-gray-600">{description}</p>
          {slug && (
            <a
              href={`/courses/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-600 font-medium"
            >
              🔗 View Course
            </a>
          )}
        </div>
      );
    } else {
      if (status === "published") {
        message = "🎉 Course Published!";
        description = `Your course "${courseTitle}" is now live.`;
      } else if (status === "pending_review") {
        message = "👍 Submitted for Review!";
        description = `Your course "${courseTitle}" has been submitted to admins.`;
      } else {
        message = "💾 Draft Saved!";
        description = `Your course "${courseTitle}" has been saved as a draft.`;
      }

      toastContent = (
        <div className="flex flex-col gap-2">
          <p>{message}</p>
          <p className="text-sm text-gray-600">{description}</p>

          <div className="border-t pt-2 mt-1">
            <p className="font-semibold text-sm">What's next?</p>
            <p className="text-sm text-gray-600 mb-2">
              Do you want to add a live class schedule (e.g., for weekly Q&A) to this course?
            </p>
            <Link href={`/tutor/courses/${slug}/live-classes/create`} passHref>
              <Button className="w-full bg-[#2694C6] hover:bg-[#1f7ba5]">
                <Plus className="mr-2" size={16} /> Add Live Classes
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    toast.success(toastContent, { duration: 10000 });

    // Reset form fields (only on non-edit create success)
    if (!isEditMode && status !== "draft") {
      form.reset({
        title: "",
        short_description: "",
        long_description: "",
        learning_objectives: [{ value: "" }, { value: "" }],
        
        // --- 👇 TAXONOMY RESET UPDATE: ADD PARENT CATEGORY FIELD 👇 ---
        global_category: "", // ✅ NEW: Reset the parent category field
        global_subcategory: "",
        global_level: "",
        org_category: "",
        org_level: "",
        // --- 👆 END TAXONOMY RESET UPDATE ---
        
        status: "draft",
        price: undefined,
        promo_video: null,
        thumbnail: null,
        modules: [{ title: "", description: "", lessons: [{ title: "", video_file: null }] }],
      });
      setCurrentStep(1);
    }

  } catch (error) {
      console.error("Submission failed:", error);
      // Add a generic toast for failure
      toast.error("An error occurred during submission. Please check your network.");
  } finally {
      // This is crucial: always reset loading state
      setIsLoading(false);
  }

};

  const processForm: SubmitHandler<CourseFormValues> = async (data) => {
    await handleFormSubmit(data, data.status, true);
  };

  // ✅ NEW: Draft handler (no validation)
  const onSaveDraft = async () => {
    const data = form.getValues();
    await handleFormSubmit(data, "draft", false);
  };

  // Stepper Logic
  const nextStep = async () => {
    const currentFields = steps[currentStep - 1].fields;
    const fieldsToValidate = activeSlug ? currentFields : currentFields.filter((f) => f !== "org_category" && f !== "org_level");
    const output = await form.trigger(fieldsToValidate as any, { shouldFocus: true });
    if (!output) {
      toast.warning("Please correct the errors before proceeding.");
      return;
    }
    if (currentStep < steps.length) {
      setCurrentStep((step) => step + 1);
    }
  };
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((step) => step - 1);
    }
  };

  // Loading/Error States for Options
  if (isFetchingOptions) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-500">Loading form...</p>
      </div>
    );
  }
  if (!formOptions) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-600 font-medium">Error loading form data. Please refresh the page.</p>
      </div>
    );
  }

  const getAvailableStatusOptions = (): CourseStatus[] => {
    if (activeSlug) {
      return isOrgAdminOrOwner
        ? ["draft", "pending_review", "published"] // Admin can do all
        : ["draft", "pending_review"]; // Tutor can only draft or submit
    }
    return ["draft", "published"]; // Global user can draft or publish
  };
  const availableStatusOptions = getAvailableStatusOptions();

  const watchedStatus = form.watch("status");
    const getSubmitButtonText = (status: CourseStatus) => {
      if (isLoading) return "Submitting...";
      switch (status) {
        case "published":
          return "Publish Course";
        case "pending_review":
          return "Submit for Review";
        case "draft":
        default:
          return "Save as Draft";
      }
    };

  // --- Render ---
  return (
    <Card className="max-w-4xl mx-auto my-8 border border-gray-200 rounded text-black shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">
          {isEditMode ? "Edit Course" : "Create a New Course"} {activeSlug ? "for Organization" : "(Independent)"}
        </CardTitle>
        <CardDescription>
          {isEditMode ? "Update your course details below." : "Fill out the details step-by-step."}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Stepper */}
        <div className="flex items-center mb-8 border-b border-gray-200 pb-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center text-sm transition-colors duration-300 ${
                  currentStep > index + 1 ? "text-blue-600" : currentStep === index + 1 ? "text-blue-600 font-semibold" : "text-gray-400"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full border-2 mr-2 ${
                    currentStep > index + 1 ? "bg-blue-600 border-blue-600 text-white" : currentStep === index + 1 ? "border-blue-600" : "border-gray-300"
                  }`}
                >
                  {currentStep > index + 1 ? <Check size={14} /> : step.id}
                </div>
                {step.name}
              </div>
              {index < steps.length - 1 && <div className="flex-1 border-t-2 border-gray-200 mx-4"></div>}
            </React.Fragment>
          ))}
        </div>

        {/* Form Content */}
        <Form {...form}>
          <form id="course-create-form" onSubmit={form.handleSubmit(processForm)} className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* STEP 1: Basic Info */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        {/* Title, Descriptions, and Objectives fields remain unchanged */}
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Course Title</FormLabel>
                                <FormControl><ShadcnInput placeholder="e.g., The Ultimate Next.js Bootcamp" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="short_description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Short Description (Max 200 chars)</FormLabel>
                                <FormControl><Textarea maxLength={200} placeholder="A brief, catchy summary..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="long_description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Course Description</FormLabel>
                                <FormControl><Textarea rows={5} placeholder="Provide details about what students will learn..." {...field} /></FormControl>
                                <FormDescription>Markdown is supported.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <div>
                            <FormLabel>Learning Objectives (Min 2)</FormLabel>
                            <FormDescription className="mb-2">What will students be able to do after this course?</FormDescription>
                            <div className="space-y-2">
                                {objectives.map((objField, index) => (
                                    <FormField
                                        key={objField.id}
                                        control={form.control}
                                        name={`learning_objectives.${index}.value`}
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-2">
                                                <FormControl><ShadcnInput placeholder={`Objective #${index + 1}`} {...field} /></FormControl>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => objectives.length > 2 && removeObjective(index)} disabled={objectives.length <= 2}>
                                                    <Trash2 size={16} className="text-gray-500 hover:text-red-600"/>
                                                </Button>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" className="mt-2 rounded" onClick={() => appendObjective({ value: "" })}>
                                <Plus className="mr-2" size={16} /> Add Objective
                            </Button>
                            {form.formState.errors.learning_objectives?.message && <FormMessage className="mt-1">{String(form.formState.errors.learning_objectives.message)}</FormMessage>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-4 border-t">
                            {/* --- 1. Global Category (Parent Selector) --- */}
                            <FormField
                              control={form.control}
                              name="global_category"
                              render={({ field }) => (
                                <FormItem className="w-full">
                                  <FormLabel>Marketplace Category</FormLabel>
                                  <Select
                                    onValueChange={(value) => {
                                      // 1. Update the parent category field
                                      field.onChange(value); 
                                      // 2. Reset the child subcategory field to force re-selection
                                      form.setValue("global_subcategory", "", { shouldValidate: false }); // ✅ NEW
                                    }}
                                    value={field.value?.toString() || ""}
                                  >
                                            <FormControl>
                                                <SelectTrigger className="rounded">
                                                    <SelectValue placeholder="Select Category..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {formOptions.globalCategories?.length > 0 ? (
                                                    formOptions.globalCategories.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-sm text-gray-500">No categories found.</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* --- 2. Global Subcategory (Child Selector - FILTERED) --- */}
                            <FormField
                                control={form.control}
                                name="global_subcategory" 
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Marketplace Subcategory</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value?.toString() || ""}
                                            // Disable if no parent category is selected or no children exist
                                            disabled={!watchedGlobalCategoryFromForm || filteredSubCategories.length === 0} 
                                        >
                                            <FormControl>
                                                <SelectTrigger className="rounded">
                                                    <SelectValue placeholder="Select Subcategory..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {filteredSubCategories.length > 0 ? (
                                                    filteredSubCategories.map((subCat) => (
                                                        <SelectItem key={subCat.id} value={subCat.id.toString()}>
                                                            {subCat.name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-sm text-gray-500">
                                                        {watchedGlobalCategoryFromForm 
                                                            ? "No subcategories for this category." 
                                                            : "Select a Category first."
                                                        }
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* --- Global Level --- */}
                            <FormField
                                control={form.control}
                                name="global_level"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Difficulty Level</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                                            <FormControl>
                                                <SelectTrigger className="rounded">
                                                    <SelectValue placeholder="Select Level..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {formOptions.globalLevels?.length > 0 ? (
                                                    formOptions.globalLevels.map((lvl) => (
                                                        <SelectItem key={lvl.id} value={lvl.id.toString()}>
                                                            {lvl.name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-sm text-gray-500">No levels available.</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* --- Organization Fields (Conditional) --- */}
                            {activeSlug && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="org_category"
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel>Organization Category</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded">
                                                            <SelectValue placeholder="Select for organization..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {formOptions.orgCategories?.length > 0 ? (
                                                            formOptions.orgCategories.map((cat) => (
                                                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                                                    {cat.name}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="p-2 text-sm text-gray-500">No org categories found.</div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="org_level"
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel>Organization Level</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded">
                                                            <SelectValue placeholder="Select for organization..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {formOptions.orgLevels?.length > 0 ? (
                                                            formOptions.orgLevels.map((lvl) => (
                                                                <SelectItem key={lvl.id} value={lvl.id.toString()}>
                                                                    {lvl.name}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="p-2 text-sm text-gray-500">No org levels found.</div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 2: Curriculum */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormDescription>Organize your course content into modules and lessons.</FormDescription>
                    {modules.map((moduleField, moduleIndex) => (
                      <Card key={moduleField.id} className="bg-gray-50 border rounded shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between px-4 border-b">
                          <FormField
                            control={form.control}
                            name={`modules.${moduleIndex}.title`}
                            render={({ field }) => (
                              <FormItem className="flex-grow mr-2">
                                <FormControl>
                                  <ShadcnInput
                                    placeholder={`Module ${moduleIndex + 1} Title`}
                                    {...field}
                                    className="text-md font-semibold shadow-none p-2 focus-visible:ring-1 focus-visible:ring-ring h-auto bg-transparent"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => modules.length > 1 && removeModule(moduleIndex)} disabled={modules.length <= 1}>
                            <Trash2 className="text-gray-500 hover:text-red-600" size={18} />
                          </Button>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <ModuleLessons 
                            moduleIndex={moduleIndex} 
                            control={form.control} 
                            watch={form.watch} 
                            setValue={form.setValue} 
                          />
                          <AssignmentBuilder
                                moduleIndex={moduleIndex}
                                control={form.control}
                            />
                        </CardContent>
                      </Card>
                    ))}
                    <Button type="button" variant="outline" className="rounded" onClick={() => appendModule({ title: "", description: "", lessons: [{ title: "", video_file: "" }] })}>
                      <Plus className="mr-2" size={16} /> Add Module
                    </Button>
                    {form.formState.errors.modules?.message && <FormMessage>{String(form.formState.errors.modules.message)}</FormMessage>}
                  </div>
                )}

                {/* STEP 3: Media */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <FormField
                    control={form.control}
                    name="thumbnail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Course Thumbnail (Image)</FormLabel>
                        <FormControl>
                            <ShadcnInput
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                field.onChange(file);
                            }}
                            />
                        </FormControl>

                        {field.value && (
                          <div className="mt-2">
                            <img
                              src={typeof field.value === "string" ? field.value : URL.createObjectURL(field.value)}
                              alt="Preview"
                              className="h-32 w-auto rounded border object-cover"
                            />
                          </div>
                        )}

                        <FormDescription>Recommended: 720x405px.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField control={form.control} name="promo_video" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Promotional Video URL (Optional)</FormLabel>
                        <FormControl>
                          <ShadcnInput
                            className="rounded"
                            placeholder="e.g., https://vimeo.com/123456"
                            {...field}
                            value={field.value || ""} // ✅ This forces null to be an empty string
                          />
                        </FormControl>
                        <FormDescription>Link to Vimeo or YouTube.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}

                {/* STEP 4: Pricing & Publish */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (KES)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">KSh</span>
                            <ShadcnInput
                              type="number"
                              step="1"
                              min="0"
                              placeholder="0 (Free) or e.g., 1500"
                              className="pl-12 rounded"
                              {...field}
                              value={field.value ?? ''}
                              onChange={e => {
                                const val = e.target.value;
                                field.onChange(val === '' ? undefined : Number(val));
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Enter 0 or leave blank for a free course.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded border p-4 bg-gray-50">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Course Status</FormLabel>
                          <FormDescription>
                            {activeSlug && !isOrgAdminOrOwner
                              ? "Save as draft or submit for review."
                              : "Set the course status."}
                          </FormDescription>
                        </div>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-[180px] rounded">
                              <SelectValue placeholder="Select status..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableStatusOptions.map((statusKey) => (
                              <SelectItem key={statusKey} value={statusKey}>
                                {statusOptions[statusKey]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </Form>
      </CardContent>
      {/* Card Footer */}
      <CardFooter className="flex justify-between border-t pt-6">
        <div>
          {currentStep > 1 && (
            <Button onClick={prevStep} variant="outline" disabled={isLoading} className="rounded">
              <ArrowLeft className="mr-2" size={16} /> Previous
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={onSaveDraft} variant="secondary" disabled={isLoading} className="rounded">
            <Save className="mr-2" size={16} /> {isLoading ? "Saving..." : "Save Draft"}
          </Button>

          {currentStep < steps.length && (
            <Button onClick={nextStep} disabled={isLoading} className="rounded bg-[#2694C6] hover:bg-[#1f7ba5]">
              Next <ArrowRight className="ml-2" size={16} />
            </Button>
          )}

          {currentStep === steps.length && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded"><Eye className="mr-2" size={16} /> Preview</Button>
              </DialogTrigger>
              <DialogContent className="rounded">
                <DialogHeader>
                  <DialogTitle>Course Preview (Basic)</DialogTitle>
                  <DialogDescription>Quick look before publishing.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 mt-4">
                  <h3 className="font-bold text-lg">{form.watch("title")}</h3>
                  <p className="text-sm text-muted-foreground">{form.watch("short_description")}</p>
                  <p className="font-bold text-xl">{form.watch("price") != null && Number(form.watch("price")) > 0 ? `KSh ${form.watch("price")}` : "Free"}</p>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {currentStep === steps.length && (
            <Button
              type="submit"
              form="course-create-form"
              disabled={isLoading}
              className="rounded bg-green-600 hover:bg-green-700 w-[180px]"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : watchedStatus === "published" || watchedStatus === "pending_review" ? (
                <Send className="mr-2 h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {getSubmitButtonText(watchedStatus)}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
