// src/components/tutor/dashboard/AssessmentsManagerTab.tsx

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Send, BookOpen, Loader2, Check, FileText, Edit } from "lucide-react";

import api from "@/lib/api/axios";
import { cn } from "@/lib/utils";
import { AssignmentSummary, QuizSummary, GradeSubmissionSchema, GradeSubmissionValues } from "./SharedTypes";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface AssessmentsTabProps {
  courseSlug: string;
  assignmentsSummary: AssignmentSummary[];
  quizzesSummary: QuizSummary[];
}

// Utility component for loading state
const LoaderState: React.FC = () => (
    <div className="flex justify-center items-center h-[300px] bg-white rounded-lg border">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      <p className="ml-2 text-gray-500">Loading assessments...</p>
    </div>
);

const AssessmentsManagerTab: React.FC<AssessmentsTabProps> = ({ courseSlug, assignmentsSummary, quizzesSummary }) => {
  const assignmentsPending = assignmentsSummary.reduce((sum, a) => sum + a.pending_review, 0);
  const quizzesReview = quizzesSummary.reduce((sum, q) => sum + q.requires_review, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessments Management</CardTitle>
        <CardDescription>Review and grade student assignment submissions and quiz attempts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="assignments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assignments">
              <Send className="h-4 w-4 mr-2" /> Assignments (Pending: {assignmentsPending})
            </TabsTrigger>
            <TabsTrigger value="quizzes">
              <BookOpen className="h-4 w-4 mr-2" /> Quiz Review (Required: {quizzesReview})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments">
            <AssignmentSubmissionsList courseSlug={courseSlug} />
          </TabsContent>

          <TabsContent value="quizzes">
            <QuizAttemptsReviewList courseSlug={courseSlug} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
export default AssessmentsManagerTab;


// --- SUBMISSION LIST COMPONENTS ---

const AssignmentSubmissionsList: React.FC<{ courseSlug: string }> = ({ courseSlug }) => {
    const queryClient = useQueryClient();
    const [filterStatus, setFilterStatus] = useState<"pending" | "graded" | "all">("pending");
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

    // Fetch submissions based on filter status
    const { data: submissions, isLoading } = useQuery<any[]>({
        queryKey: ["allSubmissions", courseSlug, filterStatus],
        queryFn: async () => {
            const statusParam = filterStatus !== "all" ? `?status=${filterStatus}` : '';
            
            // 🟢 FIX: Use the simplified URL path and ensure no hardcoded trailing slash.
            const baseUrl = `/manage-course/${courseSlug}/submissions-list`;
            
            const { data } = await api.get(`${baseUrl}${statusParam}`);
            return data;
        },
    });

    const handleGradeUpdate = (updatedSubmission: any) => {
        // Optimistically update the list cache
        queryClient.setQueryData<any[]>(["allSubmissions", courseSlug, filterStatus], old => 
            old ? old.map(sub => sub.id === updatedSubmission.id ? updatedSubmission : sub) : []
        );
        // Invalidate main dashboard data to update the 'pending review' count
        queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
        setSelectedSubmission(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-lg">Submissions requiring action</h4>
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">Pending Review</SelectItem>
                        <SelectItem value="graded">Graded</SelectItem>
                        <SelectItem value="all">All Submissions</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            {isLoading ? <LoaderState /> : (
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
                        {submissions?.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center text-gray-500">No submissions found for this filter.</TableCell></TableRow>
                        ) : (
                            submissions?.map((submission) => (
                                <TableRow key={submission.id}>
                                    <TableCell className="font-medium">{submission.user.full_name}</TableCell>
                                    <TableCell>{submission.assignment_title}</TableCell>
                                    <TableCell>{new Date(submission.submitted_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", {
                                            "bg-yellow-100 text-yellow-800": submission.submission_status === "pending",
                                            "bg-green-100 text-green-800": submission.submission_status === "graded",
                                        })}>{submission.submission_status.replace('_', ' ')}</span>
                                    </TableCell>
                                    <TableCell>{submission.grade !== null ? `${submission.grade}/${submission.assignment.max_score}` : "N/A"}</TableCell>
                                    <TableCell className="text-right">
                                        <Dialog open={selectedSubmission?.id === submission.id} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
                                            <DialogTrigger asChild>
                                                <Button size="sm" onClick={() => setSelectedSubmission(submission)}><FileText size={14} className="mr-1" /> Grade</Button>
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
                            ))
                        )}
                    </TableBody>
                </Table>
            )}
        </div>
    );
};

const GradeSubmissionDialog: React.FC<{ submission: any; courseSlug: string; onGradeUpdate: (s: any) => void; onClose: () => void; }> = ({ submission, courseSlug, onGradeUpdate, onClose }) => {
    const gradeForm = useForm<GradeSubmissionValues>({
        resolver: zodResolver(GradeSubmissionSchema),
        defaultValues: {
            grade: submission.grade || null,
            feedback: submission.feedback || '',
            submission_status: submission.submission_status || 'pending',
        },
    });

    const { mutate: gradeSubmission, isPending } = useMutation({
        mutationFn: (data: GradeSubmissionValues) => 
            api.patch(`/manage-course/${courseSlug}/assignments/grade/${submission.id}/`, data),
        onSuccess: (response) => {
            toast.success(`Submission graded: ${response.data.grade}/${response.data.assignment.max_score}`);
            onGradeUpdate(response.data);
        },
        onError: () => toast.error("Failed to update grade."),
    });

    const handleGradeSubmit: SubmitHandler<GradeSubmissionValues> = (data) => {
        // Ensure grade is set if status is graded
        if (data.submission_status === 'graded' && data.grade === null) {
            gradeForm.setError('grade', { type: 'manual', message: 'Grade is required when status is "Graded".' });
            return;
        }
        gradeSubmission(data);
    };

    return (
        <DialogContent className="sm:max-w-xl">
            <DialogHeader><DialogTitle>Grade Submission by {submission.user.full_name}</DialogTitle>
                <DialogDescription>Assignment: {submission.assignment_title} (Max: {submission.assignment.max_score})</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <p className="text-sm font-medium">Submission Details: 
                    {submission.file ? (
                        <a href={submission.file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">Download Submitted File</a>
                    ) : submission.text_submission ? (
                        <span className="ml-2">Text Provided Below</span>
                    ) : (
                        <span className="text-gray-500 ml-2">No file/text submitted.</span>
                    )}
                </p>
                {submission.text_submission && (
                    <Card><CardContent className="p-4 bg-gray-50 text-sm whitespace-pre-wrap">{submission.text_submission}</CardContent></Card>
                )}
                
                <Form {...gradeForm}>
                    <form onSubmit={gradeForm.handleSubmit(handleGradeSubmit)} className="space-y-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={gradeForm.control} name="grade" render={({ field }) => (
                                <FormItem><FormLabel>Grade Given</FormLabel>
                                    <FormControl><ShadcnInput type="number" min={0} max={submission.assignment.max_score} {...field} 
                                        value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} 
                                    /></FormControl>
                                    <FormDescription>Max: {submission.assignment.max_score}</FormDescription><FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={gradeForm.control} name="submission_status" render={({ field }) => (
                                <FormItem><FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}><FormControl>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                    </FormControl><SelectContent>
                                        <SelectItem value="pending">Pending Review</SelectItem>
                                        <SelectItem value="graded">Graded</SelectItem>
                                        <SelectItem value="resubmit">Request Resubmission</SelectItem>
                                    </SelectContent></Select><FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={gradeForm.control} name="feedback" render={({ field }) => (
                            <FormItem><FormLabel>Feedback</FormLabel>
                                <FormControl><Textarea placeholder="Provide constructive feedback..." rows={4} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button type="submit" disabled={isPending}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />} Save Grade
                        </Button>
                    </form>
                </Form>
            </div>
        </DialogContent>
    );
};

// Quiz Review List
const QuizAttemptsReviewList: React.FC<{ courseSlug: string }> = ({ courseSlug }) => {
    // Fetches attempts that have requires_review=True
    const { data: attempts, isLoading } = useQuery<any[]>({
        queryKey: ["reviewAttempts", courseSlug],
        queryFn: async () => {
            const { data } = await api.get(`/manage-course/${courseSlug}/quizzes/review-attempts/`);
            return data;
        },
    });

    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-lg">Attempts Requiring Manual Review</h4>
            
            {isLoading ? <LoaderState /> : (
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
                        {attempts?.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center text-gray-500">No quiz attempts require manual review.</TableCell></TableRow>
                        ) : (
                            attempts?.map((attempt) => (
                                <TableRow key={attempt.id}>
                                    <TableCell className="font-medium">{attempt.user.full_name}</TableCell>
                                    <TableCell>{attempt.quiz_title}</TableCell>
                                    <TableCell>{attempt.lesson_title}</TableCell>
                                    <TableCell>{attempt.score}/{attempt.max_score}</TableCell>
                                    <TableCell>{new Date(attempt.completed_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        {/* This button would open a dialog to review text answers and manually adjust the score */}
                                        <Button size="sm" variant="outline"><Edit size={14} className="mr-1" /> Review/Adjust</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            )}
        </div>
    );
};