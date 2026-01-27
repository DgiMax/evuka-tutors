"use client";

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
  FileIcon,
  Download,
  Calendar,
  User, X,
} from "lucide-react";
import Link from "next/link";

import api from "@/lib/api/axios";
import { cn } from "@/lib/utils";
import {
  AssignmentSummary,
  QuizSummary,
  GradeSubmissionSchema,
  GradeSubmissionValues,
} from "./SharedTypes";

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
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { Badge } from "@/components/ui/badge";

interface AssessmentsTabProps {
  courseSlug: string;
  assignmentsSummary: AssignmentSummary[];
  quizzesSummary: QuizSummary[];
}

const LoaderState: React.FC = () => (
  <div className="flex flex-col justify-center items-center h-[300px] bg-card rounded-lg border border-border">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="ml-2 text-muted-foreground">Loading...</p>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg bg-muted/50 p-4">
    <Inbox className="h-8 w-8 text-muted-foreground" />
    <p className="text-muted-foreground mt-2 text-center text-sm">{message}</p>
  </div>
);

// --- MAIN TAB COMPONENT ---
const AssessmentsManagerTab: React.FC<AssessmentsTabProps> = ({
  courseSlug,
  assignmentsSummary,
  quizzesSummary,
}) => {
  const [activeTab, setActiveTab] = useState("assignments");
  
  const assignmentsPending = assignmentsSummary.reduce((sum, a) => sum + a.pending_review, 0);
  const quizzesReview = quizzesSummary.reduce((sum, q) => sum + q.requires_review, 0);

  const tabItems = [
    { value: "assignments", label: `Assignments (${assignmentsPending})`, icon: Send },
    { value: "quizzes", label: `Quiz Review (${quizzesReview})`, icon: BookOpen },
  ];

  return (
    <Card className="border border-border shadow-none p-3 md:p-6 rounded-t-md rounded-b-lg">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-0 gap-4">
        <div className="space-y-1">
          <CardTitle>Assessments Management</CardTitle>
          <CardDescription>Review and grade student work.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          
          {/* Mobile Tab Selector */}
          <div className="md:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="Select section..." />
              </SelectTrigger>
              <SelectContent>
                {tabItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Tabs */}
          <TabsList className="hidden md:grid w-full grid-cols-2">
            {tabItems.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                <item.icon className="h-4 w-4 mr-2" /> {item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="assignments" className="mt-2">
            <AssignmentSubmissionsList courseSlug={courseSlug} />
          </TabsContent>

          <TabsContent value="quizzes" className="mt-2">
            <QuizAttemptsReviewList courseSlug={courseSlug} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
export default AssessmentsManagerTab;

// --- ASSIGNMENT LIST COMPONENT ---
const AssignmentSubmissionsList: React.FC<{ courseSlug: string }> = ({ courseSlug }) => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<"pending" | "graded" | "all">("pending");
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  const { data: submissions, isLoading } = useQuery<any[]>({
    queryKey: ["allSubmissions", courseSlug, filterStatus],
    queryFn: async () => {
      const statusParam = filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const { data } = await api.get(`/manage-course/${courseSlug}/submissions-list${statusParam}`);
      return data;
    },
  });

  const handleGradeUpdate = (updatedSubmission: any) => {
    queryClient.setQueryData<any[]>(
      ["allSubmissions", courseSlug, filterStatus],
      (old) => old ? old.map((sub) => sub.id === updatedSubmission.id ? updatedSubmission : sub) : []
    );
    queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
    setSelectedSubmission(null);
  };

  const getStatusBadge = (status: string) => (
    <Badge variant="outline" className={cn("capitalize border-0", {
        "bg-yellow-100 text-yellow-800 hover:bg-yellow-200": status === "pending",
        "bg-green-100 text-green-800 hover:bg-green-200": status === "graded",
        "bg-red-100 text-red-800 hover:bg-red-200": status === "resubmit",
    })}>
        {status.replace("_", " ")}
    </Badge>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h4 className="font-semibold text-lg">Submissions</h4>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
            <SelectItem value="all">All Submissions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <LoaderState /> : submissions?.length === 0 ? <EmptyState message={`No ${filterStatus} submissions.`} /> : (
        <>
          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {submissions?.map((submission) => (
              <Card key={submission.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{submission.user.full_name}</span>
                  </div>
                  {getStatusBadge(submission.submission_status)}
                </div>
                
                <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{submission.assignment_title}</p>
                    <p className="text-xs mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3"/> Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                    </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">
                        Grade: {submission.grade !== null ? `${submission.grade}/${submission.assignment.max_score || 100}` : "N/A"}
                    </span>
                    <Button size="sm" onClick={() => setSelectedSubmission(submission)}>
                        <FileText size={14} className="mr-1" /> Grade
                    </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="border rounded-lg overflow-hidden hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions?.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.user.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{submission.assignment_title}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(submission.submitted_at).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(submission.submission_status)}</TableCell>
                    <TableCell>
                        {submission.grade !== null ? `${submission.grade}/${submission.assignment.max_score || 100}` : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedSubmission(submission)}>
                        <Edit size={14} className="mr-1" /> Grade
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Shared Grade Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        {selectedSubmission && (
            <GradeSubmissionDialog 
                submission={selectedSubmission} 
                courseSlug={courseSlug} 
                onGradeUpdate={handleGradeUpdate} 
                onClose={() => setSelectedSubmission(null)}
            />
        )}
      </Dialog>
    </div>
  );
};

// --- QUIZ REVIEW LIST COMPONENT ---
const QuizAttemptsReviewList: React.FC<{ courseSlug: string }> = ({ courseSlug }) => {
  const { data: attempts, isLoading } = useQuery<any[]>({
    queryKey: ["reviewAttempts", courseSlug],
    queryFn: async () => {
      const { data } = await api.get(`/manage-course/${courseSlug}/quizzes/review-attempts/`);
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-lg">Attempts Requiring Review</h4>
      {isLoading ? <LoaderState /> : attempts?.length === 0 ? <EmptyState message="No attempts require manual review." /> : (
        <>
          {/* Mobile List */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {attempts?.map((attempt) => (
              <Card key={attempt.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="font-medium">{attempt.user.full_name}</div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Needs Review</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                    <p className="text-foreground">{attempt.quiz_title}</p>
                    <p className="text-xs mt-1">Lesson: {attempt.lesson_title}</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm">Score: {attempt.score}/{attempt.max_score}</span>
                    <Button size="sm" variant="outline">Review</Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="border rounded-lg overflow-hidden hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Lesson</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts?.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium">{attempt.user.full_name}</TableCell>
                    <TableCell>{attempt.quiz_title}</TableCell>
                    <TableCell className="text-muted-foreground">{attempt.lesson_title}</TableCell>
                    <TableCell>{attempt.score}/{attempt.max_score}</TableCell>
                    <TableCell>{new Date(attempt.completed_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="secondary">Review</Button>
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
      api.patch(`/manage-course/${courseSlug}/assignments/grade/${submission.id}/`, data),
    onSuccess: (response) => {
      toast.success(`Graded: ${response.data.grade}/${response.data.assignment.max_score}`);
      onGradeUpdate(response.data);
      onClose();
    },
    onError: () => toast.error("Failed to update grade."),
  });

  const handleGradeSubmit: SubmitHandler<GradeSubmissionValues> = (data) => {
    if (data.submission_status === "graded" && data.grade === null) {
      gradeForm.setError("grade", { type: "manual", message: 'Grade required if status is "Graded".' });
      return;
    }
    gradeSubmission(data);
  };

  const getFileName = (url: string) => {
    try { return url.split('/').pop() || "Attached File"; } 
    catch { return "Attached File"; }
  };

  return (
    <DialogContent className="w-[95%] sm:max-w-xl p-0 gap-0 max-h-[85vh] h-auto min-h-[300px] flex flex-col border-border/80 shadow-2xl rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[10%] translate-y-0">
      
      <DialogHeader className="px-6 py-2 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
        <div className="flex flex-col gap-0.5">
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                Grade Submission
            </DialogTitle>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="font-medium text-foreground/80">{submission.user.full_name}</span>
                <span className="text-muted-foreground/30">•</span>
                <span>Max Score: {submission.assignment.max_score || 100}</span>
            </div>
        </div>
        <DialogClose className="rounded-md p-2 hover:bg-muted transition" onClick={onClose}>
            <X className="h-6 w-6 text-muted-foreground hover:text-foreground" />
        </DialogClose>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto min-h-0 px-6 py-6 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-thumb]:border-x-[1px] [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content">
        
        <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Student Work</h4>
            
            {submission.file ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileIcon size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{getFileName(submission.file)}</p>
                            <p className="text-xs text-muted-foreground">Attached Document</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="ml-2 gap-2 h-8">
                        <a href={submission.file} target="_blank" rel="noopener noreferrer">
                            <Download size={14} /> Download
                        </a>
                    </Button>
                </div>
            ) : null}

            {submission.text_submission ? (
                <div className="p-4 border rounded-lg bg-muted/10 text-sm leading-relaxed whitespace-pre-wrap">
                    {submission.text_submission}
                </div>
            ) : null}

            {!submission.file && !submission.text_submission && (
                <div className="p-6 border border-dashed rounded-lg text-center text-muted-foreground text-sm bg-muted/5">
                    No work attached (Empty submission).
                </div>
            )}
        </div>

        <div className="space-y-3 pt-4 border-t">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Instructor Assessment</h4>
            <Form {...gradeForm}>
                <form id="grade-form" onSubmit={gradeForm.handleSubmit(handleGradeSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={gradeForm.control} name="grade" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Grade</FormLabel>
                                <FormControl>
                                    <ShadcnInput 
                                        type="number" 
                                        min={0} 
                                        max={submission.assignment.max_score} 
                                        {...field} 
                                        value={field.value ?? ""} 
                                        onChange={e => field.onChange(e.target.value === "" ? null : Number(e.target.value))} 
                                        className="h-10 text-base shadow-none"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={gradeForm.control} name="submission_status" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-10 text-base shadow-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending Review</SelectItem>
                                        <SelectItem value="graded">Graded (Complete)</SelectItem>
                                        <SelectItem value="resubmit">Request Resubmission</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <FormField control={gradeForm.control} name="feedback" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Feedback</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Provide constructive feedback..." rows={4} {...field} value={field.value ?? ""} className="resize-none text-base shadow-none" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </form>
            </Form>
        </div>
      </div>

      <div className="px-6 py-3 border-t bg-background flex justify-end shrink-0 mt-auto">
        <Button type="submit" form="grade-form" disabled={isPending} className="w-full sm:w-auto h-10 shadow-sm transition-all active:scale-[0.98]">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
            Save Grade & Feedback
        </Button>
      </div>

    </DialogContent>
  );
};
