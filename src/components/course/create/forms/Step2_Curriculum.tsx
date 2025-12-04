// app/(tutor)/courses/create/forms/Step2_Curriculum.tsx

"use client";

import React from "react";
import {
  useFieldArray,
  Control,
  UseFormWatch,
  SubmitHandler,
  Path,
  UseFormReturn, // ✅ 1. Import UseFormReturn
} from "react-hook-form";
import { Plus, Trash2, BookOpen, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { type CourseFormValues } from "../CourseFormTypes";

// --- Props Type ---
interface Step2Props {
  form: UseFormReturn<CourseFormValues>; // ✅ 2. Add the 'form' prop
  control: Control<CourseFormValues>;
  watch: UseFormWatch<CourseFormValues>;
  setValue: (
    name: Path<CourseFormValues>,
    value: any,
    options?: { shouldValidate?: boolean; shouldDirty?: boolean }
  ) => void;
}

// --- Main Component ---
export default function Step2Curriculum({
  form, // ✅ 3. Destructure 'form' from props
  control,
  watch,
  setValue,
}: Step2Props) {
  const {
    fields: modules,
    append: appendModule,
    remove: removeModule,
  } = useFieldArray({
    control: control,
    name: "modules",
  });

  return (
    <div className="space-y-4">
      <FormDescription>
        Organize your course content into modules and lessons.
      </FormDescription>
      {modules.map((moduleField, moduleIndex) => (
        <Card
          key={moduleField.id}
          className="bg-muted/50 border rounded-md shadow-none p-0"
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border">
            <FormField
              control={control}
              name={`modules.${moduleIndex}.title`}
              render={({ field }) => (
                <FormItem className="flex-grow mr-2">
                  <FormControl>
                    <ShadcnInput
                      placeholder={`Module ${moduleIndex + 1} Title`}
                      {...field}
                      className="text-md font-semibold shadow-none p-2 focus-visible:ring-1 focus-visible:ring-ring h-auto bg-transparent border-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => modules.length > 1 && removeModule(moduleIndex)}
              disabled={modules.length <= 1}
              className="text-destructive/70 hover:text-destructive"
            >
              <Trash2 size={18} />
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <ModuleLessons
              moduleIndex={moduleIndex}
              control={control}
              watch={watch}
              setValue={setValue}
            />
            <AssignmentBuilder moduleIndex={moduleIndex} control={control} />
          </CardContent>
        </Card>
      ))}
      <Button
        type="button"
        variant="outline"
        className="rounded-md"
        onClick={() =>
          appendModule({
            title: `Module ${modules.length + 1}`,
            description: "",
            lessons: [{ title: "New Lesson", video_file: "" }],
            assignments: [],
          })
        }
      >
        <Plus className="mr-2" size={16} /> Add Module
      </Button>
      {/* ✅ 4. This line will now work correctly */}
      {form.formState.errors.modules?.message && (
        <FormMessage>
          {String(form.formState.errors.modules.message)}
        </FormMessage>
      )}
    </div>
  );
}

// --- Child Components (Kept in same file to avoid prop drilling issues) ---

// --- 1. ModuleLessons ---
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
  const {
    fields: lessons,
    append: appendLesson,
    remove: removeLesson,
  } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.lessons`,
  });

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    lessonIndex: number
  ) => {
    const file = event.target.files?.[0] || null;
    const fieldPath =
      `modules.${moduleIndex}.lessons.${lessonIndex}.video_file` as Path<CourseFormValues>;
    setValue(fieldPath, file, { shouldValidate: true });
  };

  return (
    <div className="pl-4 border-l border-border ml-2 space-y-2">
      <h4 className="font-medium text-sm text-foreground">Lessons</h4>

      {lessons.map((lesson, lessonIndex) => {
        const videoFileValue = watch(
          `modules.${moduleIndex}.lessons.${lessonIndex}.video_file`
        );
        const isNewFile = videoFileValue instanceof File;
        const previewUrl = isNewFile
          ? URL.createObjectURL(videoFileValue)
          : typeof videoFileValue === "string"
          ? videoFileValue
          : null;

        return (
          <Accordion
            key={lesson.id}
            type="single"
            collapsible
            className="w-full"
          >
            <AccordionItem
              value={`lesson-${lesson.id}`}
              className="border border-border rounded-md bg-card"
            >
              <AccordionTrigger className="px-4 py-2 text-sm hover:no-underline">
                Lesson {lessonIndex + 1}:{" "}
                {watch(
                  `modules.${moduleIndex}.lessons.${lessonIndex}.title`
                ) || "New Lesson"}
              </AccordionTrigger>

              <AccordionContent className="space-y-4 p-4 border-t border-border">
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

                <FormField
                  control={control}
                  // The name path depends on your map index variable names (e.g., moduleIndex, lessonIndex)
                  name={`modules.${moduleIndex}.lessons.${lessonIndex}.content`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lesson Content (Text)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter lesson text, notes, or article content..." 
                          className="min-h-[150px]"
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
                      className="rounded-md"
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
                  <div className="mt-2 rounded-md overflow-hidden border border-border bg-black">
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
        className="mt-2 rounded-md"
        onClick={() =>
          appendLesson({ title: "", video_file: null, quizzes: [] })
        }
      >
        <Plus className="mr-2" size={16} /> Add Lesson
      </Button>
    </div>
  );
};

// --- 2. AssignmentBuilder ---
type AssignmentBuilderProps = {
  moduleIndex: number;
  control: Control<CourseFormValues>;
};

const AssignmentBuilder = ({
  moduleIndex,
  control,
}: AssignmentBuilderProps) => {
  const {
    fields: assignments,
    append: appendAssignment,
    remove: removeAssignment,
  } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.assignments`,
  });

  return (
    <div className="pt-3 border-t border-border mt-4 space-y-3">
      <h4 className="font-medium text-sm text-foreground flex items-center">
        <Send size={16} className="mr-1" /> Module Assignment (Optional)
      </h4>

      {assignments.map((assignment, index) => (
        <Card key={assignment.id} className="p-3 bg-card border shadow-sm">
          <div className="flex justify-between items-start mb-2 border-b border-border pb-2">
            <h5 className="font-semibold text-sm">
              Assignment {index + 1}: {assignment.title || "New Assignment"}
            </h5>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeAssignment(index)}
              className="text-destructive/70 hover:text-destructive"
            >
              <Trash2 size={14} />
            </Button>
          </div>

          <FormField
            control={control}
            name={`modules.${moduleIndex}.assignments.${index}.title`}
            render={({ field }) => (
              <FormItem className="mb-2">
                <FormLabel className="text-xs">Title</FormLabel>
                <FormControl>
                  <ShadcnInput placeholder="Project Name" {...field} />
                </FormControl>
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
                <FormControl>
                  <Textarea
                    placeholder="Full instructions for the student."
                    {...field}
                    rows={3}
                  />
                </FormControl>
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
        className="rounded-md"
        onClick={() =>
          appendAssignment({ title: "", description: "", max_score: 100 })
        }
        disabled={assignments.length > 0}
      >
        <Plus className="mr-2" size={16} /> Add Module Assignment
      </Button>
    </div>
  );
};

// --- 3. QuizBuilder ---
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
    <div className="pl-4 border-l border-border ml-2 mt-4 space-y-4">
      <h4 className="font-medium text-sm text-foreground flex items-center">
        <BookOpen size={16} className="mr-1" /> Lesson Quiz (Optional)
      </h4>

      {quizzes.map((quizField, quizIndex) => (
        <Card
          key={quizField.id}
          className="bg-card border rounded-md shadow-sm p-4 space-y-3"
        >
          <div className="flex justify-between items-start border-b border-border pb-2 mb-2">
            <FormField
              control={control}
              name={`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.title`}
              render={({ field }) => (
                <FormItem className="flex-grow mr-2">
                  <FormLabel className="text-sm">Quiz Title</FormLabel>
                  <FormControl>
                    <ShadcnInput
                      placeholder="e.g., Chapter 1 Knowledge Check"
                      {...field}
                      className="text-md font-semibold h-auto p-1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeQuiz(quizIndex)}
              className="text-destructive/70 hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name={`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.max_attempts`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Max Attempts</FormLabel>
                  <FormControl>
                    <ShadcnInput
                      type="number"
                      min={1}
                      placeholder="3"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.time_limit_minutes`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">
                    Time Limit (Mins, Optional)
                  </FormLabel>
                  <FormControl>
                    <ShadcnInput
                      type="number"
                      min={1}
                      placeholder="60"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                    />
                  </FormControl>
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
        className="rounded-md"
        onClick={() =>
          appendQuiz({
            title: `New Quiz ${quizzes.length + 1}`,
            max_score: 10,
            max_attempts: 3,
            questions: [
              {
                text: "Sample Question",
                question_type: "mcq",
                score_weight: 1,
                options: [
                  { text: "Option A", is_correct: true },
                  { text: "Option B", is_correct: false },
                ],
              },
            ],
          })
        }
        disabled={quizzes.length > 0}
      >
        <Plus className="mr-2" size={16} /> Add Lesson Quiz
      </Button>
    </div>
  );
};

// --- 4. QuestionBuilder ---
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
    <div className="pt-3 border-t border-border space-y-3">
      <h5 className="font-medium text-sm text-foreground">Questions</h5>

      {questions.map((questionField, questionIndex) => {
        const fieldPath =
          `modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions.${questionIndex}` as Path<CourseFormValues>;
        const watchedType = watch(
          `${fieldPath}.question_type` as Path<CourseFormValues>
        );

        return (
          <Card
            key={questionField.id}
            className="p-3 bg-muted/50 border shadow-none"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-sm">
                Question {questionIndex + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeQuestion(questionIndex)}
                disabled={questions.length <= 1}
                className="text-destructive/70 hover:text-destructive"
              >
                <Trash2 size={14} />
              </Button>
            </div>

            <FormField
              control={control}
              name={`${fieldPath}.text` as Path<CourseFormValues>}
              render={({ field }) => (
                <FormItem className="mb-2">
                  <FormLabel className="text-xs">Question Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What is the main topic of this lesson?"
                      {...field}
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name={`${fieldPath}.question_type` as Path<CourseFormValues>}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                        <SelectItem value="text">
                          Text Answer (Manual Grading)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`${fieldPath}.score_weight` as Path<CourseFormValues>}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Score</FormLabel>
                    <FormControl>
                      <ShadcnInput
                        type="number"
                        min={1}
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
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
              <FormField
                control={control}
                name={`${fieldPath}.instructor_hint` as Path<CourseFormValues>}
                render={({ field }) => (
                  <FormItem className="mt-3">
                    <FormLabel className="text-xs">
                      Instructor Hint (for grading)
                    </FormLabel>
                    <FormControl>
                      <ShadcnInput
                        placeholder="Expected short answer or notes for grader"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </Card>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-md w-full"
        onClick={() =>
          appendQuestion({
            text: `New Question ${questions.length + 1}`,
            question_type: "mcq",
            score_weight: 1,
            options: [
              { text: "Correct Option", is_correct: true },
              { text: "Wrong Option", is_correct: false },
            ],
          })
        }
      >
        <Plus className="mr-2" size={16} /> Add Question
      </Button>
    </div>
  );
};

// --- 5. OptionBuilder ---
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
    options.forEach((_, index) => {
      setValue(
        `modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions.${questionIndex}.options.${index}.is_correct` as Path<CourseFormValues>,
        index === newIndex,
        { shouldValidate: true }
      );
    });
  };

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-2">
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
                <FormControl>
                  <ShadcnInput
                    placeholder={`Option ${optionIndex + 1}`}
                    {...field}
                  />
                </FormControl>
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
            className="text-destructive/70 hover:text-destructive"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 text-xs p-2"
        onClick={() =>
          appendOption({
            text: `Option ${options.length + 1}`,
            is_correct: false,
          })
        }
        disabled={options.length >= 6}
      >
        <Plus size={14} className="mr-1" /> Add Option
      </Button>
    </div>
  );
};