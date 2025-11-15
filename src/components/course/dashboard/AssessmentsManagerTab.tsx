// src/components/tutor/dashboard/AssessmentsManagerTab.tsx

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Send,
  BookOpen,
  Loader2,
  Check,
  FileText,
  Edit,
  Inbox,
} from "lucide-react";

import api from "@/lib/api/axios";
import { cn } from "@/lib/utils";
import {
  AssignmentSummary,
  QuizSummary,
  GradeSubmissionSchema,
  GradeSubmissionValues,
} from "./SharedTypes";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import Link from "next/link"; // Import Link for the empty state

interface AssessmentsTabProps {
  courseSlug: string;
  assignmentsSummary: AssignmentSummary[];
  quizzesSummary: QuizSummary[];
}

// --- Utility Components (Themed) ---
const LoaderState: React.FC = () => (
  <div className="flex flex-col justify-center items-center h-[300px] bg-card rounded-lg border border-border">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="ml-2 text-muted-foreground">Loading...</p>
  </div>
);

// NEW: Reusable Empty State component (themed)
const EmptyState: React.FC<{ message: string; linkPath?: string; linkText?: string; }> = ({ message, linkPath, linkText }) => (
  <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg bg-muted/50 p-4">
    <Inbox className="h-8 w-8 text-muted-foreground" />
    <p className="text-muted-foreground mt-2 text-center">{message}</p>
    {linkPath && linkText && (
      <Button asChild variant="link" className="text-primary">
        <Link href={linkPath}>
          {linkText}
        </Link>
      </Button>
    )}
  </div>
);


const AssessmentsManagerTab: React.FC<AssessmentsTabProps> = ({
  courseSlug,
  assignmentsSummary,
  quizzesSummary,
}) => {
  const [activeTab, setActiveTab] = useState("assignments");
  const assignmentsPending = assignmentsSummary.reduce(
    (sum, a) => sum + a.pending_review,
    0
  );
  const quizzesReview = quizzesSummary.reduce(
    (sum, q) => sum + q.requires_review,
    0
  );

  // For the responsive Select dropdown
  const tabItems = [
    {
      value: "assignments",
      label: `Assignments (Pending: ${assignmentsPending})`,
      icon: Send,
    },
    {
      value: "quizzes",
      label: `Quiz Review (Required: ${quizzesReview})`,
      icon: BookOpen,
    },
  ];

  return (
    // Card now uses theme colors
    <Card className="p-0">
      <CardHeader className="p-6">
        <CardTitle>Assessments Management</CardTitle>
        <CardDescription>
          Review and grade student assignment submissions and quiz attempts.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          
          {/* NEW: Mobile Select (Dropdown) Navigation */}
          <div className="md:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full h-12 px-4 py-3 text-base">
                <SelectValue placeholder="Select a section..." />
              </SelectTrigger>
              <SelectContent className="w-[--radix-select-trigger-width]">
                {tabItems.map((item) => (
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

          {/* UPDATED: Desktop Tabs Navigation (Hidden on mobile) */}
          <TabsList className="hidden md:grid w-full grid-cols-2">
            {tabItems.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="assignments" className="mt-0 md:mt-6">
            <AssignmentSubmissionsList courseSlug={courseSlug} />
          </TabsContent>

          <TabsContent value="quizzes" className="mt-0 md:mt-6">
            <QuizAttemptsReviewList courseSlug={courseSlug} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
export default AssessmentsManagerTab;

// --- SUBMISSION LIST COMPONENTS ---

const AssignmentSubmissionsList: React.FC<{ courseSlug: string }> = ({
  courseSlug,
}) => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<"pending" | "graded" | "all">(
    "pending"
  );
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  const { data: submissions, isLoading } = useQuery<any[]>({
    queryKey: ["allSubmissions", courseSlug, filterStatus],
    queryFn: async () => {
      const statusParam =
        filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const baseUrl = `/manage-course/${courseSlug}/submissions-list`;
      const { data } = await api.get(`${baseUrl}${statusParam}`);
      return data;
    },
  });

  const handleGradeUpdate = (updatedSubmission: any) => {
    queryClient.setQueryData<any[]>(
      ["allSubmissions", courseSlug, filterStatus],
      (old) =>
        old
          ? old.map((sub) =>
              sub.id === updatedSubmission.id ? updatedSubmission : sub
            )
          : []
    );
    queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
    setSelectedSubmission(null);
  };

  // NEW: Mobile Card List Component
  const MobileSubmissionList = () => (
    <div className="space-y-4 md:hidden">
      {submissions?.map((submission) => (
        <Card key={submission.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-foreground">
                {submission.user.full_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {submission.assignment_title}
              </p>
            </div>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium capitalize flex-shrink-0",
                {
                  "bg-yellow-100 text-yellow-800":
                    submission.submission_status === "pending",
                  "bg-green-100 text-green-800":
                    submission.submission_status === "graded",
                }
              )}
            >
              {submission.submission_status.replace("_", " ")}
            </span>
          </div>
          <div className="flex justify-between items-end mt-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Grade: </span>
              <span className="font-medium text-foreground">
                {submission.grade !== null
                  ? `${submission.grade}/${submission.assignment.max_score}`
                  : "N/A"}
              </span>
            </div>
            
            <Dialog open={selectedSubmission?.id === submission.id} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setSelectedSubmission(submission)}>
                  <FileText size={14} className="mr-1" /> Grade
                </Button>
              </DialogTrigger>
              {selectedSubmission && selectedSubmission.id === submission.id && (
                  <GradeSubmissionDialog 
                    submission={selectedSubmission} 
                    courseSlug={courseSlug} 
                    onGradeUpdate={handleGradeUpdate} 
                    onClose={() => setSelectedSubmission(null)}
                  />
              )}
            </Dialog>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h4 className="font-semibold text-lg text-foreground">Submissions</h4>
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as any)}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
            <SelectItem value="all">All Submissions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoaderState />
      ) : submissions?.length === 0 ? (
        // UPDATED: Using new EmptyState component
        <EmptyState message={`No ${filterStatus} submissions found.`} />
      ) : (
        <>
          {/* NEW: Mobile Card View (hidden on desktop) */}
          <MobileSubmissionList />
          
          {/* UPDATED: Desktop Table View (hidden on mobile) */}
          <div className="border rounded-lg overflow-hidden hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions?.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium text-foreground">{submission.user.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{submission.assignment_title}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(submission.submitted_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                          {
                            "bg-yellow-100 text-yellow-800":
                              submission.submission_status === "pending",
                            "bg-green-100 text-green-800":
                              submission.submission_status === "graded",
                          }
                        )}
                      >
                        {submission.submission_status.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {submission.grade !== null
                        ? `${submission.grade}/${submission.assignment.max_score}`
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={selectedSubmission?.id === submission.id} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedSubmission(submission)}>
                            <FileText size={14} className="mr-1" /> Grade
                          </Button>
                        </DialogTrigger>
                        {selectedSubmission && selectedSubmission.id === submission.id && (
                            <GradeSubmissionDialog 
                              submission={selectedSubmission} 
                              courseSlug={courseSlug} 
                              onGradeUpdate={handleGradeUpdate} 
                              onClose={() => setSelectedSubmission(null)}
                            />
                        )}
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};

const GradeSubmissionDialog: React.FC<{
  submission: any;
  courseSlug: string;
  onGradeUpdate: (s: any) => void;
  onClose: () => void;
}> = ({ submission, courseSlug, onGradeUpdate, onClose }) => {
  const gradeForm = useForm<GradeSubmissionValues>({
    resolver: zodResolver(GradeSubmissionSchema),
    defaultValues: {
      grade: submission.grade || null,
      feedback: submission.feedback || "",
      submission_status: submission.submission_status || "pending",
    },
  });

  const { mutate: gradeSubmission, isPending } = useMutation({
    mutationFn: (data: GradeSubmissionValues) =>
      api.patch(
        `/manage-course/${courseSlug}/assignments/grade/${submission.id}/`,
        data
      ),
    onSuccess: (response) => {
      toast.success(
        `Submission graded: ${response.data.grade}/${response.data.assignment.max_score}`
      );
      onGradeUpdate(response.data);
    },
    onError: () => toast.error("Failed to update grade."),
  });

  const handleGradeSubmit: SubmitHandler<GradeSubmissionValues> = (data) => {
    if (data.submission_status === "graded" && data.grade === null) {
      gradeForm.setError("grade", {
        type: "manual",
        message: 'Grade is required when status is "Graded".',
      });
      return;
    }
    gradeSubmission(data);
  };

  return (
    // DialogContent will use theme bg-card
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Grade Submission by {submission.user.full_name}</DialogTitle>
        <DialogDescription>
          Assignment: {submission.assignment_title} (Max:{" "}
          {submission.assignment.max_score})
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <p className="text-sm font-medium text-foreground">
          Submission Details:
          {submission.file ? (
            // UPDATED: Uses theme primary color
            <a
              href={submission.file}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline ml-2"
            >
              Download Submitted File
            </a>
          ) : submission.text_submission ? (
            <span className="ml-2 text-muted-foreground">Text Provided Below</span>
          ) : (
            <span className="text-muted-foreground ml-2">
              No file/text submitted.
            </span>
          )}
        </p>
        {submission.text_submission && (
          // UPDATED: Uses theme muted bg
          <Card>
            <CardContent className="p-4 bg-muted text-sm whitespace-pre-wrap">
              {submission.text_submission}
            </CardContent>
          </Card>
        )}

        <Form {...gradeForm}>
          <form
            onSubmit={gradeForm.handleSubmit(handleGradeSubmit)}
            // UPDATED: Uses theme border
            className="space-y-4 pt-4 border-t"
          >
            {/* UPDATED: Responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={gradeForm.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Given</FormLabel>
                    <FormControl>
                      <ShadcnInput
                        type="number"
                        min={0}
                        max={submission.assignment.max_score}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? null : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Max: {submission.assignment.max_score}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={gradeForm.control}
                name="submission_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending Review</SelectItem>
                        <SelectItem value="graded">Graded</SelectItem>
                        <SelectItem value="resubmit">
                          Request Resubmission
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={gradeForm.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide constructive feedback..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* UPDATED: Button uses theme primary color */}
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Save Grade
            </Button>
          </form>
        </Form>
      </div>
    </DialogContent>
  );
};

// --- Quiz Review List (Responsive + Themed) ---
const QuizAttemptsReviewList: React.FC<{ courseSlug: string }> = ({
  courseSlug,
}) => {
  const { data: attempts, isLoading } = useQuery<any[]>({
    queryKey: ["reviewAttempts", courseSlug],
    queryFn: async () => {
      const { data } = await api.get(
        `/manage-course/${courseSlug}/quizzes/review-attempts/`
      );
      return data;
    },
  });

  // NEW: Mobile Card List Component
  const MobileQuizList = () => (
    <div className="space-y-4 md:hidden">
      {attempts?.map((attempt) => (
        <Card key={attempt.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-foreground">
                {attempt.user.full_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {attempt.quiz_title}
              </p>
            </div>
             <p className="text-sm font-medium text-foreground">
                {attempt.score}/{attempt.max_score}
              </p>
          </div>
          <div className="flex justify-between items-end mt-4">
             <p className="text-xs text-muted-foreground">
                Lesson: {attempt.lesson_title}
              </p>
            {/* UPDATED: Button uses theme secondary color (Teal) */}
            <Button size="sm" variant="secondary">
              <Edit size={14} className="mr-1" /> Review/Adjust
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-lg text-foreground">
        Attempts Requiring Manual Review
      </h4>

      {isLoading ? (
        <LoaderState />
      ) : attempts?.length === 0 ? (
        // UPDATED: Using new EmptyState component
        <EmptyState message="No quiz attempts require manual review." />
      ) : (
        <>
          {/* NEW: Mobile Card View (hidden on desktop) */}
          <MobileQuizList />
          
          {/* UPDATED: Desktop Table View (hidden on mobile) */}
          <div className="border rounded-lg overflow-hidden hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Lesson</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts?.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium text-foreground">{attempt.user.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{attempt.quiz_title}</TableCell>
                    <TableCell className="text-muted-foreground">{attempt.lesson_title}</TableCell>
                    <TableCell className="text-foreground">{attempt.score}/{attempt.max_score}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(attempt.completed_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {/* UPDATED: Button uses theme secondary color (Teal) */}
                      <Button size="sm" variant="secondary">
                        <Edit size={14} className="mr-1" /> Review/Adjust
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};