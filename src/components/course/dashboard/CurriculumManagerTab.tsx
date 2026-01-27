import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { 
    Plus, Loader2, Trash2, Edit, SaveIcon, 
    Video, FileText, BookOpen, MoreVertical, 
    Eye, HelpCircle, X, Upload, 
    ChevronsUpDown, Link as LinkIcon, Book, File as FileIcon,
    Search, Check, CheckCheck
} from "lucide-react";

import api from "@/lib/api/axios";
import { cn } from "@/lib/utils";
import {
    ModuleDetail, LessonDetail, AssignmentDetail, QuizDetail, ResourceDetail,
    ModuleAddValues, ModuleAddSchema, 
    LessonCreateSchema, LessonCreateValues,
    AssignmentCreateSchema, AssignmentCreateValues,
    QuizCreateSchema, QuizCreateValues,
    ResourceCreateSchema, ResourceCreateValues
} from "./SharedTypes";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const inputStyles = "bg-background shadow-none border border-border focus-visible:ring-0 hover:border-secondary focus-visible:border-secondary transition-colors";

interface CurriculumTabProps {
    courseSlug: string;
    modules: ModuleDetail[];
}

const CurriculumManagerTab: React.FC<CurriculumTabProps> = ({ courseSlug, modules }) => {
    return (
        <Card className="border border-border shadow-none p-3 md:p-6 rounded-t-md rounded-b-lg">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-0 gap-4">
                <div className="space-y-1">
                    <CardTitle>Course Curriculum</CardTitle>
                    <CardDescription>Manage modules, lessons, quizzes, and assignments.</CardDescription>
                </div>
                <ModuleManagerDialog courseSlug={courseSlug} mode="create" />
            </CardHeader>
            
            <CardContent className="px-0">
                {modules.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/50">
                        <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium">No curriculum yet</h3>
                        <div className="mt-4">
                            <ModuleManagerDialog courseSlug={courseSlug} mode="create" trigger={<Button variant="secondary">Add First Module</Button>} />
                        </div>
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {modules.map((mod, modIndex) => (
                            <AccordionItem key={mod.id} value={`module-${mod.id}`} className="border rounded-lg bg-card px-3 sm:px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-start sm:items-center gap-3 text-left w-full overflow-hidden">
                                        <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0 mt-0.5 sm:mt-0">{modIndex + 1}</Badge>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="font-semibold text-base sm:text-lg truncate block">{mod.title}</span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-6 space-y-6">
                                    <div className="flex flex-col gap-4 bg-muted/20 p-4 rounded-md border border-border/50">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Description</h4>
                                                <p className="text-sm text-foreground/80">{mod.description || "No description provided."}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <ModuleManagerDialog courseSlug={courseSlug} mode="edit" existingModule={mod} />
                                                <DeleteButton type="module" id={mod.id} courseSlug={courseSlug} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2"><BookOpen size={14} /> Lessons</h4>
                                            <LessonManagerDialog module={mod} courseSlug={courseSlug} mode="create" />
                                        </div>
                                        {mod.lessons.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic pl-2 border-l-2">No lessons added yet.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {mod.lessons.map((lesson) => (
                                                    <LessonRow key={lesson.id} lesson={lesson} courseSlug={courseSlug} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2"><FileText size={14} /> Assignment</h4>
                                            {mod.assignments.length === 0 && <AssignmentManagerDialog module={mod} courseSlug={courseSlug} mode="create" />}
                                        </div>
                                        {mod.assignments.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic pl-2 border-l-2">No assignment attached to this module.</p>
                                        ) : (
                                            <div className="grid gap-3">
                                                {mod.assignments.map((assignment) => (
                                                    <div key={assignment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border bg-amber-50/50 border-amber-100 gap-3">
                                                        <div className="min-w-0">
                                                            <div className="font-medium flex items-center gap-2 truncate">
                                                                <FileText size={16} className="text-amber-600 shrink-0"/> 
                                                                <span className="truncate">{assignment.title}</span>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1 ml-6">Max Score: {assignment.max_score}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                                            <AssignmentManagerDialog module={mod} courseSlug={courseSlug} mode="edit" existingAssignment={assignment} />
                                                            <DeleteButton type="assignment" id={assignment.id} courseSlug={courseSlug} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
};

export default CurriculumManagerTab;

const ModuleManagerDialog: React.FC<{
    courseSlug: string;
    mode: "create" | "edit";
    existingModule?: ModuleDetail;
    trigger?: React.ReactNode;
}> = ({ courseSlug, mode, existingModule, trigger }) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<ModuleAddValues>({
        resolver: zodResolver(ModuleAddSchema) as any,
        defaultValues: {
            title: existingModule?.title || "",
            description: existingModule?.description || ""
        }
    });

    useEffect(() => {
        if (open && mode === "edit" && existingModule) {
            form.reset({
                title: existingModule.title,
                description: existingModule.description
            });
        } else if (open && mode === "create") {
            form.reset({ title: "", description: "" });
        }
    }, [open, mode, existingModule, form]);

    const mutation = useMutation({
        mutationFn: (data: ModuleAddValues) => {
            const formData = new FormData();
            formData.append("title", data.title);
            formData.append("description", data.description || "");

            if (mode === "create") return api.post(`/manage-course/${courseSlug}/modules/`, formData);
            return api.patch(`/manage-course/${courseSlug}/modules/${existingModule?.id}/`, formData);
        },
        onSuccess: () => {
            toast.success(`Module ${mode === "create" ? "created" : "updated"} successfully.`);
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
            setOpen(false);
        },
        onError: (error: any) => toast.error(`Failed: ${error.response?.data?.title || 'Unknown Error'}`),
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : mode === "create" ? (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 font-medium text-muted-foreground hover:text-foreground shadow-none border-dashed hover:border-solid hover:bg-muted/50"
                    >
                        <Plus className="h-4 w-4 mr-2" /> Add Module
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Edit size={16} />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent 
                className="w-[95%] sm:max-w-[480px] lg:max-w-[600px] p-0 gap-0 max-h-[85vh] h-auto min-h-[300px] flex flex-col border-border/80 shadow-2xl rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[10%] translate-y-0"
            >
                <DialogHeader className="px-4 py-2 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
                    <div className="flex flex-col gap-0.5">
                        <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                            {mode === "create" ? "Create New Module" : "Edit Module"}
                        </DialogTitle>
                    </div>
                    <DialogClose className="rounded-md p-2 hover:bg-muted transition">
                        <X className="h-6 w-6 text-muted-foreground hover:text-foreground" />
                    </DialogClose>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-thumb]:border-x-[1px] [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content">
                    <Form {...form}>
                        <form id="module-form" onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-6">
                            
                            <div className="space-y-2">
                                <FormField 
                                    control={form.control} 
                                    name="title" 
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">
                                                Module Title
                                            </FormLabel>
                                            <FormControl>
                                                <ShadcnInput 
                                                    {...field} 
                                                    className="h-12 px-4 text-base shadow-none" 
                                                    placeholder="e.g. Introduction to Design"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} 
                                />
                            </div>

                            <div className="space-y-2">
                                <FormField 
                                    control={form.control} 
                                    name="description" 
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">
                                                Description
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    {...field} 
                                                    rows={4} 
                                                    className="resize-none text-base shadow-none p-4 min-h-[120px]" 
                                                    placeholder="What will students learn in this module?"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} 
                                />
                            </div>
                        </form>
                    </Form>
                </div>

                <div className="px-4 py-2 border-t bg-background shrink-0 mt-auto">
                    <Button 
                        type="submit" 
                        form="module-form" 
                        disabled={mutation.isPending}
                        className="w-full h-12 text-base font-medium shadow-sm transition-all active:scale-[0.98]"
                    >
                        {mutation.isPending ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <SaveIcon className="mr-2 h-5 w-5" />
                        )} 
                        {mode === "create" ? "Create Module" : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const LessonRow: React.FC<{ lesson: LessonDetail; courseSlug: string }> = ({ lesson, courseSlug }) => {
    const hasQuiz = lesson.quizzes && lesson.quizzes.length > 0;
    const hasResources = lesson.resources && lesson.resources.length > 0;

    return (
        <div className="border rounded-md bg-background overflow-hidden">
            <div className="flex items-center justify-between p-2 sm:p-3 gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3 overflow-hidden flex-1 min-w-0">
                    <div className={cn("p-2 rounded-full shrink-0", lesson.video_file ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500")}>
                        {lesson.video_file ? <Video size={16} /> : <FileText size={16} />}
                    </div>
                    <div className="truncate min-w-0 flex-1">
                        <div className="font-medium truncate text-sm sm:text-base">{lesson.title}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-2 truncate">
                            {lesson.video_file && <span className="shrink-0">Video</span>}
                            {lesson.content && <span className="shrink-0">• Content</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <LessonPreviewDialog lesson={lesson} />
                    <LessonManagerDialog module={{ id: 0, title: "", description: "", lessons: [], assignments: [] }} courseSlug={courseSlug} mode="edit" existingLesson={lesson} />
                    <DeleteButton type="lesson" id={lesson.id} courseSlug={courseSlug} />
                </div>
            </div>

            <div className="bg-muted/10 px-2 sm:px-3 py-2 border-t flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <FileIcon size={12} /> Resources
                    </span>
                    <ResourceManagerDialog lesson={lesson} courseSlug={courseSlug} mode="create" />
                </div>
                {hasResources && (
                    <div className="space-y-1">
                        {lesson.resources.map(res => (
                            <div key={res.id} className="flex items-center justify-between text-xs bg-background border rounded px-2 py-1.5">
                                <div className="flex items-center gap-2 truncate">
                                    {res.resource_type === 'link' ? <LinkIcon size={12} className="text-blue-500" /> : 
                                     res.resource_type === 'book_ref' ? <Book size={12} className="text-purple-500" /> : 
                                     <FileIcon size={12} className="text-orange-500" />}
                                    <span className="truncate">{res.title}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <ResourceManagerDialog lesson={lesson} courseSlug={courseSlug} mode="edit" existingResource={res} />
                                    <DeleteButton type="resource" id={res.id} courseSlug={courseSlug} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-muted/30 px-2 sm:px-3 py-2 border-t flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <HelpCircle size={12} /> Quiz Assessment
                    </span>
                    {/* Hide Add Quiz Button if quiz exists */}
                    {!hasQuiz && <QuizManagerDialog lesson={lesson} courseSlug={courseSlug} mode="create" />}
                </div>
                
                {hasQuiz && (
                    <div className="flex items-center justify-between text-sm bg-background border rounded px-2 sm:px-3 py-2 mt-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="truncate font-medium text-xs sm:text-sm">{lesson.quizzes[0].title}</span>
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">{lesson.quizzes[0].max_score} Pts</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                            <QuizManagerDialog lesson={lesson} courseSlug={courseSlug} mode="edit" existingQuiz={lesson.quizzes[0]} />
                            <DeleteButton type="quiz" id={lesson.quizzes[0].id} courseSlug={courseSlug} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const QuizManagerDialog: React.FC<{ 
    lesson: LessonDetail; 
    courseSlug: string; 
    mode: "create" | "edit"; 
    existingQuiz?: QuizDetail 
}> = ({ lesson, courseSlug, mode, existingQuiz }) => {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("settings");
    const queryClient = useQueryClient();

    const form = useForm<QuizCreateValues>({
        resolver: zodResolver(QuizCreateSchema) as any,
        defaultValues: mode === "edit" && existingQuiz ? {
            title: existingQuiz.title || "",
            description: existingQuiz.description || "",
            max_score: existingQuiz.max_score || 0,
            time_limit_minutes: existingQuiz.time_limit_minutes ?? undefined,
            max_attempts: existingQuiz.max_attempts || 3,
            questions: existingQuiz.questions || []
        } : { 
            title: "", description: "", max_score: 0, time_limit_minutes: 30, max_attempts: 3, questions: [] 
        }
    });

    const { fields: questions, append: addQuestion, remove: removeQuestion } = useFieldArray({
        control: form.control,
        name: "questions"
    });

    const watchedQuestions = form.watch("questions");
    
    useEffect(() => {
        const total = watchedQuestions?.reduce((acc, q) => acc + (Number(q.score_weight) || 0), 0) || 0;
        form.setValue("max_score", total);
    }, [watchedQuestions, form]);

    useEffect(() => {
        if(open) {
            setActiveTab("settings");
            if (mode === "create") form.reset(); 
        }
    }, [open, mode]);

    const mutation = useMutation({
        mutationFn: (data: QuizCreateValues) => {
            const formData = new FormData();
            formData.append("title", data.title);
            formData.append("description", data.description || "");
            formData.append("max_score", data.max_score.toString());
            if (data.time_limit_minutes) formData.append("time_limit_minutes", data.time_limit_minutes.toString());
            formData.append("max_attempts", data.max_attempts.toString());

            if (data.questions) {
                data.questions.forEach((q, qIndex) => {
                    formData.append(`questions[${qIndex}]text`, q.text);
                    formData.append(`questions[${qIndex}]question_type`, q.question_type);
                    formData.append(`questions[${qIndex}]score_weight`, q.score_weight.toString());
                    formData.append(`questions[${qIndex}]order`, qIndex.toString());
                    
                    if (q.id) formData.append(`questions[${qIndex}]id`, q.id.toString());

                    if (q.options) {
                        q.options.forEach((o, oIndex) => {
                            formData.append(`questions[${qIndex}]options[${oIndex}]text`, o.text);
                            formData.append(`questions[${qIndex}]options[${oIndex}]is_correct`, o.is_correct.toString());
                            if (o.id) formData.append(`questions[${qIndex}]options[${oIndex}]id`, o.id.toString());
                        });
                    }
                });
            }

            if (mode === "create") return api.post(`/manage-course/${courseSlug}/lessons/${lesson.id}/quizzes/`, formData);
            return api.patch(`/manage-course/${courseSlug}/quizzes/${existingQuiz?.id}/`, formData);
        },
        onSuccess: () => {
            toast.success(`Quiz ${mode === "create" ? "created" : "updated"}`);
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
            setOpen(false);
        },
        onError: () => toast.error("Failed to save.")
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 font-medium text-muted-foreground hover:text-foreground shadow-none border-dashed hover:border-solid hover:bg-muted/50"
                    >
                        <Plus size={14} className="mr-1" /> Add Quiz
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Edit size={16} />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent 
                className="w-[95%] sm:max-w-[480px] lg:max-w-[800px] p-0 gap-0 max-h-[85vh] h-auto min-h-[300px] flex flex-col border-border/80 shadow-2xl rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[10%] translate-y-0"
            >
                <DialogHeader className="px-4 py-2 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
                    <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                        {mode === "create" ? "Create Quiz" : "Manage Quiz"}
                    </DialogTitle>
                    <DialogClose className="rounded-md p-2 hover:bg-muted transition">
                        <X className="h-6 w-6 text-muted-foreground hover:text-foreground" />
                    </DialogClose>
                </DialogHeader>

                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <Form {...form}>
                        <form id="quiz-form" onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="h-full flex flex-col min-h-0">
                            
                            <div className="px-6 pt-6 pb-2 shrink-0 bg-background z-10">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className="w-full grid grid-cols-2 h-10 p-1 bg-muted/50 rounded-lg">
                                        <TabsTrigger value="settings" className="rounded-md transition-all">Settings</TabsTrigger>
                                        <TabsTrigger value="questions" className="rounded-md transition-all">Questions ({questions.length})</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-thumb]:border-x-[1px] [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content">
                                {activeTab === "settings" && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
                                        <div className="space-y-2">
                                            <FormField control={form.control} name="title" render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Title</FormLabel>
                                                    <FormControl><ShadcnInput {...field} className="h-12 px-4 text-base shadow-none" placeholder="e.g. Final Exam" /></FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="space-y-2">
                                            <FormField control={form.control} name="description" render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Description</FormLabel>
                                                    <FormControl>
                                                        <Textarea 
                                                            rows={3} 
                                                            {...field} 
                                                            className="resize-none text-base shadow-none p-4 min-h-[100px]" 
                                                            placeholder="Instructions for students..."
                                                        />
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <FormField control={form.control} name="max_score" render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Max Score</FormLabel>
                                                        <span className="text-[10px] text-muted-foreground italic">Auto-calculated</span>
                                                    </div>
                                                    <FormControl>
                                                        <ShadcnInput type="number" {...field} disabled className="h-12 px-4 text-base shadow-none bg-muted/50 font-semibold text-primary" />
                                                    </FormControl>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="time_limit_minutes" render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Time (Min)</FormLabel>
                                                    <FormControl>
                                                        <ShadcnInput type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} className="h-12 px-4 text-base shadow-none" />
                                                    </FormControl>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="max_attempts" render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Attempts</FormLabel>
                                                    <FormControl>
                                                        <ShadcnInput type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} className="h-12 px-4 text-base shadow-none" />
                                                    </FormControl>
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "questions" && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                                        {questions.map((qField, qIndex) => (
                                            <Card key={qField.id} className="p-0 border shadow-none bg-muted/20 overflow-hidden">
                                                <div className="flex justify-between items-center px-4 py-3 bg-muted/50 border-b">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question {qIndex + 1}</span>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(qIndex)} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"><Trash2 size={14} /></Button>
                                                </div>
                                                <div className="p-4 space-y-4">
                                                    <FormField control={form.control} name={`questions.${qIndex}.text`} render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <FormControl>
                                                                <Textarea placeholder="Type your question here..." {...field} className="resize-none text-base shadow-none bg-background min-h-[80px]" />
                                                            </FormControl>
                                                        </FormItem>
                                                    )} />
                                                    
                                                    <div className="flex gap-4 items-end">
                                                        <FormField control={form.control} name={`questions.${qIndex}.question_type`} render={({ field }) => (
                                                            <FormItem className="flex-1 space-y-1">
                                                                <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Type</FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <select 
                                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none" 
                                                                            {...field}
                                                                        >
                                                                            <option value="mcq">Multiple Choice</option>
                                                                            <option value="text">Text Answer</option>
                                                                        </select>
                                                                        <ChevronsUpDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
                                                                    </div>
                                                                </FormControl>
                                                            </FormItem>
                                                        )} />
                                                        <FormField control={form.control} name={`questions.${qIndex}.score_weight`} render={({ field }) => (
                                                            <FormItem className="w-24 space-y-1">
                                                                <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Points</FormLabel>
                                                                <FormControl>
                                                                    <ShadcnInput type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} className="h-10 text-base shadow-none bg-background" />
                                                                </FormControl>
                                                            </FormItem>
                                                        )} />
                                                    </div>
                                                    
                                                    {form.watch(`questions.${qIndex}.question_type`) === 'mcq' && (
                                                        <div className="pt-2 border-t border-dashed">
                                                            <QuizOptionsArray nestIndex={qIndex} control={form.control} />
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                        
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            className="w-full h-12 border-dashed border-2 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all" 
                                            onClick={() => addQuestion({ text: "", question_type: "mcq", score_weight: 1, order: questions.length, options: [] })}
                                        >
                                            <Plus size={16} className="mr-2" /> Add Question
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </Form>
                </div>

                <div className="px-4 py-2 border-t bg-background shrink-0 mt-auto">
                    <Button 
                        type="submit" 
                        form="quiz-form" 
                        disabled={mutation.isPending}
                        className="w-full h-12 text-base font-medium shadow-sm transition-all active:scale-[0.98]"
                    >
                        {mutation.isPending ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <SaveIcon className="mr-2 h-5 w-5" />
                        )} 
                        {mode === "create" ? "Create Quiz" : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const QuizOptionsArray = ({ nestIndex, control }: { nestIndex: number, control: any }) => {
    const { fields, append, remove } = useFieldArray({ control, name: `questions.${nestIndex}.options` });
    return (
        <div className="pl-4 border-l-2 space-y-2">
            {fields.map((item, k) => (
                <div key={item.id} className="flex items-center gap-2">
                    <FormField control={control} name={`questions.${nestIndex}.options.${k}.is_correct`} render={({ field }) => (
                        <div 
                            className={`flex items-center justify-center w-5 h-5 rounded-full border cursor-pointer transition-all ${
                                field.value 
                                ? "bg-green-500 border-green-600 text-white" 
                                : "border-muted-foreground/30 hover:border-green-500"
                            }`}
                            onClick={() => field.onChange(!field.value)}
                            title={field.value ? "Correct Answer" : "Mark as Correct"}
                        >
                            {field.value && <CheckCheck size={12} strokeWidth={4} />}
                        </div>
                    )} />
                    <FormField control={control} name={`questions.${nestIndex}.options.${k}.text`} render={({ field }) => (
                        <ShadcnInput placeholder={`Option ${k + 1}`} {...field} className={`h-8 text-sm ${inputStyles}`} />
                    )} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(k)}><Trash2 size={12} /></Button>
                </div>
            ))}
            <Button type="button" variant="link" size="sm" onClick={() => append({ text: "", is_correct: false })}>+ Option</Button>
        </div>
    );
};


const LessonManagerDialog: React.FC<{ 
    module: ModuleDetail; 
    courseSlug: string; 
    mode: "create" | "edit"; 
    existingLesson?: LessonDetail 
}> = ({ module, courseSlug, mode, existingLesson }) => {
    const [open, setOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const queryClient = useQueryClient();
    
    const form = useForm<LessonCreateValues>({
        resolver: zodResolver(LessonCreateSchema) as any,
        defaultValues: {
            title: existingLesson?.title || "",
            content: existingLesson?.content || "",
            video_file: null 
        }
    });

    const watchedVideo = form.watch("video_file");

    useEffect(() => {
        if (watchedVideo instanceof File) {
            const url = URL.createObjectURL(watchedVideo);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [watchedVideo]);

    useEffect(() => {
        if (open && mode === "create") {
            form.reset();
            setPreviewUrl(null);
        }
        if (open && mode === "edit" && existingLesson) {
            form.reset({
                title: existingLesson.title,
                content: existingLesson.content,
                video_file: null
            });
        }
    }, [open, mode, existingLesson]);

    const mutation = useMutation({
        mutationFn: (data: LessonCreateValues) => {
            const formData = new FormData();
            formData.append("title", data.title);
            formData.append("content", data.content || "");
            if (data.video_file instanceof File) formData.append("video_file", data.video_file);
            
            if (mode === "create") {
                formData.append("module", module.id.toString());
                return api.post(`/manage-course/${courseSlug}/lessons/`, formData);
            } else {
                return api.patch(`/manage-course/${courseSlug}/lessons/${existingLesson?.id}/`, formData);
            }
        },
        onSuccess: () => {
            toast.success(`Lesson ${mode === "create" ? "added" : "updated"}`);
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
            setOpen(false);
        },
        onError: () => toast.error("Operation failed"),
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 font-medium text-muted-foreground hover:text-foreground shadow-none border-dashed hover:border-solid hover:bg-muted/50"
                    >
                        <Plus size={14} className="mr-1" /> Add Lesson
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Edit size={16} />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent 
                className="w-[95%] sm:max-w-[480px] lg:max-w-[700px] p-0 gap-0 max-h-[85vh] h-auto min-h-[300px] flex flex-col border-border/80 shadow-2xl rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[10%] translate-y-0"
            >
                <DialogHeader className="px-4 py-2 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
                    <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                        {mode === "create" ? "Add Lesson" : "Edit Lesson"}
                    </DialogTitle>

                    <DialogClose className="rounded-md p-2 hover:bg-muted transition">
                        <X className="h-6 w-6 text-muted-foreground hover:text-foreground" />
                    </DialogClose>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-thumb]:border-x-[1px] [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content">
                    <Form {...form}>
                        <form id="lesson-form" onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-6">
                            <div className="space-y-2">
                                <FormField 
                                    control={form.control} 
                                    name="title" 
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">
                                                Lesson Title
                                            </FormLabel>
                                            <FormControl>
                                                <ShadcnInput 
                                                    {...field} 
                                                    value={field.value ?? ""} 
                                                    className="h-12 px-4 text-base shadow-none" 
                                                    placeholder="e.g. Introduction to React"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} 
                                />
                            </div>

                            <div className="space-y-2">
                                <FormField 
                                    control={form.control} 
                                    name="content" 
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">
                                                Text Content (Markdown)
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    rows={6} 
                                                    {...field} 
                                                    value={field.value ?? ""} 
                                                    className="resize-none text-base shadow-none p-4 min-h-[120px]" 
                                                    placeholder="Write your lesson content here..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} 
                                />
                            </div>

                            <div className="space-y-2">
                                <FormField 
                                    control={form.control} 
                                    name="video_file" 
                                    render={({ field: { onChange, value, ...rest } }) => ( 
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">
                                                Video File
                                            </FormLabel>
                                            <FormControl>
                                                <div className="space-y-3">
                                                    <div className="relative">
                                                        <ShadcnInput 
                                                            type="file" 
                                                            accept="video/*" 
                                                            className="h-12 px-4 py-2.5 text-base shadow-none cursor-pointer file:mr-4 file:py-1 file:px-2 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-muted file:text-foreground hover:file:bg-foreground/10" 
                                                            onChange={(e) => onChange(e.target.files?.[0] || null)} 
                                                            {...rest} 
                                                            value={value?.fileName ?? ""} 
                                                        />
                                                        <Video className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                                                    </div>

                                                    {previewUrl && (
                                                        <div className="relative w-full overflow-hidden rounded-md border bg-black/5 aspect-video animate-in fade-in zoom-in-95 duration-200">
                                                            <video 
                                                                controls
                                                                controlsList="nodownload noremoteplayback"
                                                                src={previewUrl} 
                                                                className="h-full w-full object-contain"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            {mode === "edit" && existingLesson?.video_file && !previewUrl && (
                                                <FormDescription className="text-[11px] text-amber-600 ml-1 flex items-center gap-1">
                                                    Current video exists. Uploading new replaces it.
                                                </FormDescription>
                                            )}
                                        </FormItem>
                                    )} 
                                />
                            </div>
                        </form>
                    </Form>
                </div>

                <div className="px-4 py-2 border-t bg-background shrink-0 mt-auto">
                    <Button 
                        type="submit" 
                        form="lesson-form"
                        disabled={mutation.isPending}
                        className="w-full h-12 text-base font-medium shadow-sm transition-all active:scale-[0.98]"
                    >
                        {mutation.isPending ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <SaveIcon className="mr-2 h-5 w-5" />
                        )} 
                        {mode === "create" ? "Create Lesson" : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};


const BookSearchInput = ({ form }: { form: UseFormReturn<ResourceCreateValues> }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
  
    const selectedBookId = form.watch("book_id");
  
    useEffect(() => {
      const timer = setTimeout(() => {
        if (query.length >= 2) {
          fetchBooks(query);
        } else {
          setResults([]);
          setIsLoading(false);
        }
      }, 500);
  
      return () => clearTimeout(timer);
    }, [query]);
  
    useEffect(() => {
      function handleClickOutside(event: any) {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
  
    const fetchBooks = async (searchTerm: string) => {
      setIsLoading(true);
      setIsOpen(true);
      try {
        const url = `/books/lookup/?search=${encodeURIComponent(searchTerm)}`;
        const { data } = await api.get(url);
        setResults(Array.isArray(data) ? data : data.results || []);
      } catch (error) {
        console.error("Failed to fetch books", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    const handleSelect = (book: any) => {
      form.setValue("book_id", book.id);
      form.setValue("course_book", book.id);
      setQuery(book.title);
      setIsOpen(false);
    };
  
    return (
      <div className="space-y-2 bg-background p-3 rounded-md border border-border/60" ref={wrapperRef}>
        <div className="relative">
           <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
           <ShadcnInput 
              placeholder={selectedBookId ? "Book selected (Type to change...)" : "Search book title..."}
              className={`pl-8 h-9 text-sm ${inputStyles}`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selectedBookId) {
                   form.setValue("book_id", "");
                   form.setValue("course_book", undefined);
                }
              }}
              onFocus={() => {
                if (query.length >= 2) setIsOpen(true);
              }}
           />
           {isLoading && (
              <div className="absolute right-3 top-2.5">
                 <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              </div>
           )}
           {isOpen && results.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md max-h-[200px] overflow-y-auto">
                 <div className="p-1">
                   {results.map((book: any) => (
                     <div
                       key={book.id}
                       className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                       onClick={() => handleSelect(book)}
                     >
                       <div className="flex flex-col items-start gap-0.5">
                         <span className="font-medium truncate">{book.title}</span>
                         <span className="text-[10px] text-muted-foreground truncate">{book.authors || "Unknown Author"}</span>
                       </div>
                       {selectedBookId === book.id && (
                          <Check className="ml-auto h-4 w-4 text-primary" />
                       )}
                     </div>
                   ))}
                 </div>
              </div>
           )}
           {isOpen && !isLoading && results.length === 0 && query.length >= 2 && (
               <div className="absolute z-50 w-full mt-1 bg-popover p-2 text-sm text-muted-foreground text-center border rounded-md shadow-md">
                  No books found.
               </div>
           )}
        </div>
      </div>
    );
  };

const ResourceManagerDialog: React.FC<{ 
    lesson: LessonDetail; 
    courseSlug: string; 
    mode: "create" | "edit"; 
    existingResource?: ResourceDetail 
}> = ({ lesson, courseSlug, mode, existingResource }) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const [resType, setResType] = useState<'file' | 'link' | 'book_ref'>(existingResource?.resource_type || 'file');
    const [previewObj, setPreviewObj] = useState<{ url: string; type: string; name: string; size: number } | null>(null);

    const form = useForm<ResourceCreateValues>({
        resolver: zodResolver(ResourceCreateSchema) as any,
        defaultValues: {
            title: existingResource?.title || "",
            description: existingResource?.description || "",
            resource_type: existingResource?.resource_type || "file",
            external_url: existingResource?.external_url || "",
            book_id: existingResource?.course_book ? existingResource.course_book.toString() : "",
            reading_instructions: existingResource?.reading_instructions || "",
            file: null
        }
    });

    const watchedFile = form.watch("file");

    useEffect(() => {
        if (watchedFile instanceof File) {
            const url = URL.createObjectURL(watchedFile);
            setPreviewObj({
                url,
                type: watchedFile.type,
                name: watchedFile.name,
                size: watchedFile.size
            });
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewObj(null);
        }
    }, [watchedFile]);

    useEffect(() => {
        if (open) {
            if (mode === "create") {
                form.reset();
                setResType("file");
                setPreviewObj(null);
            } else if (existingResource) {
                form.reset({
                    title: existingResource.title,
                    description: existingResource.description,
                    resource_type: existingResource.resource_type,
                    external_url: existingResource.external_url || "",
                    book_id: existingResource.course_book ? existingResource.course_book.toString() : "",
                    reading_instructions: existingResource.reading_instructions || "",
                });
                setResType(existingResource.resource_type);
            }
        }
    }, [open, mode, existingResource]);

    const mutation = useMutation({
        mutationFn: (data: ResourceCreateValues) => {
            const formData = new FormData();
            formData.append("title", data.title);
            formData.append("description", data.description || "");
            formData.append("resource_type", data.resource_type);
            
            if (data.resource_type === 'file' && data.file instanceof File) {
                formData.append("file", data.file);
            } else if (data.resource_type === 'link') {
                formData.append("external_url", data.external_url || "");
            } else if (data.resource_type === 'book_ref') {
                if (data.book_id) formData.append("book_id", data.book_id);
                formData.append("reading_instructions", data.reading_instructions || "");
            }

            if (mode === "create") {
                formData.append("lesson", lesson.id.toString());
                return api.post(`/manage-course/${courseSlug}/resources/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
            } else {
                return api.patch(`/manage-course/${courseSlug}/resources/${existingResource?.id}/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
            }
        },
        onSuccess: () => {
            toast.success(`Resource ${mode === "create" ? "added" : "updated"}`);
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
            setOpen(false);
        },
        onError: () => toast.error("Operation failed"),
    });

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 font-medium text-muted-foreground hover:text-foreground shadow-none border-dashed hover:border-solid hover:bg-muted/50"
                    >
                        <Plus size={14} className="mr-1" /> Add Resource
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Edit size={16} />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent 
                className="w-[95%] sm:max-w-[480px] lg:max-w-[700px] p-0 gap-0 max-h-[85vh] h-auto min-h-[300px] flex flex-col border-border/80 shadow-2xl rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[10%] translate-y-0"
            >
                <DialogHeader className="px-4 py-2 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
                    <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                        {mode === "create" ? "Add Resource" : "Edit Resource"}
                    </DialogTitle>
                    <DialogClose className="rounded-md p-2 hover:bg-muted transition">
                        <X className="h-6 w-6 text-muted-foreground hover:text-foreground" />
                    </DialogClose>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-thumb]:border-x-[1px] [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content">
                    <Form {...form}>
                        <form id="resource-form" onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-6">
                            
                            <div className="space-y-2">
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Resource Title</FormLabel>
                                        <FormControl>
                                            <ShadcnInput {...field} className="h-12 px-4 text-base shadow-none" placeholder="e.g. Lecture Slides" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="space-y-2">
                                <FormField control={form.control} name="resource_type" render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Resource Type</FormLabel>
                                        <Select onValueChange={(val: any) => { field.onChange(val); setResType(val); }} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full h-12 px-4 text-base shadow-none">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="file">File Upload</SelectItem>
                                                <SelectItem value="link">External Link</SelectItem>
                                                <SelectItem value="book_ref">Book Reference</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            {resType === 'file' && (
                                <div className="space-y-2">
                                    <FormField control={form.control} name="file" render={({ field: { onChange, value, ...rest } }) => ( 
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Upload File</FormLabel>
                                            <FormControl>
                                                <div className="space-y-3">
                                                    <div className="relative">
                                                        <ShadcnInput 
                                                            type="file" 
                                                            className="h-12 px-4 py-2.5 text-base shadow-none cursor-pointer file:mr-4 file:py-1 file:px-2 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-muted file:text-foreground hover:file:bg-foreground/10" 
                                                            onChange={(e) => onChange(e.target.files?.[0] || null)} 
                                                            {...rest} 
                                                            value={value?.fileName ?? ""} 
                                                        />
                                                        <Upload className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                                                    </div>

                                                    {previewObj && (
                                                        <div className="flex items-center gap-3 p-3 rounded-md border border-dashed bg-muted/30 animate-in fade-in zoom-in-95 duration-200">
                                                            {previewObj.type.startsWith('image/') ? (
                                                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-white">
                                                                    <img src={previewObj.url} alt="Preview" className="h-full w-full object-cover" />
                                                                </div>
                                                            ) : (
                                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                                                    <FileText className="h-6 w-6" />
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-sm font-medium truncate">{previewObj.name}</span>
                                                                <span className="text-xs text-muted-foreground">{formatFileSize(previewObj.size)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            )}

                            {resType === 'link' && (
                                <div className="space-y-2">
                                    <FormField control={form.control} name="external_url" render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">External URL</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <ShadcnInput {...field} placeholder="https://..." className="h-12 px-4 text-base shadow-none" />
                                                    <LinkIcon className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            )}

                            {resType === 'book_ref' && (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                         <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Select Book</FormLabel>
                                         <BookSearchInput form={form} />
                                    </div>
                                    <FormField control={form.control} name="reading_instructions" render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Reading Instructions</FormLabel>
                                            <FormControl>
                                                <ShadcnInput {...field} placeholder="e.g. Read Chapter 1, pages 10-15" className="h-12 px-4 text-base shadow-none" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            )}

                            <div className="space-y-2">
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Description (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                rows={3} 
                                                {...field} 
                                                className="resize-none text-base shadow-none p-4 min-h-[100px]" 
                                                placeholder="Add a brief description..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </form>
                    </Form>
                </div>

                <div className="px-4 py-2 border-t bg-background shrink-0 mt-auto">
                    <Button 
                        type="submit" 
                        form="resource-form" 
                        disabled={mutation.isPending}
                        className="w-full h-12 text-base font-medium shadow-sm transition-all active:scale-[0.98]"
                    >
                        {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <SaveIcon className="mr-2 h-5 w-5" />} 
                        {mode === "create" ? "Add Resource" : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const AssignmentManagerDialog: React.FC<{ 
    module: ModuleDetail; 
    courseSlug: string; 
    mode: "create" | "edit"; 
    existingAssignment?: AssignmentDetail 
}> = ({ module, courseSlug, mode, existingAssignment }) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<AssignmentCreateValues>({
        resolver: zodResolver(AssignmentCreateSchema) as any,
        defaultValues: mode === "edit" && existingAssignment ? {
            title: existingAssignment.title || "",
            description: existingAssignment.description || "",
            max_score: existingAssignment.max_score || 100,
            due_date: existingAssignment.due_date || ""
        } : { title: "", description: "", max_score: 100, due_date: "" }
    });

    useEffect(() => {
        if (open && mode === "create") form.reset();
        if (open && mode === "edit" && existingAssignment) {
            form.reset({
                title: existingAssignment.title,
                description: existingAssignment.description,
                max_score: existingAssignment.max_score,
                due_date: existingAssignment.due_date
            });
        }
    }, [open, mode, existingAssignment]);

    const mutation = useMutation({
        mutationFn: (data: AssignmentCreateValues) => {
            const formData = new FormData();
            formData.append("title", data.title);
            formData.append("description", data.description);
            formData.append("max_score", data.max_score.toString());
            if (data.due_date) formData.append("due_date", data.due_date);

            if (mode === "create") {
                formData.append("module", module.id.toString());
                return api.post(`/manage-course/${courseSlug}/assignments/`, formData);
            }
            return api.patch(`/manage-course/${courseSlug}/assignments/${existingAssignment?.id}/`, formData);
        },
        onSuccess: () => {
            toast.success("Assignment saved");
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
            setOpen(false);
        },
        onError: () => toast.error("Operation failed"),
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 font-medium text-muted-foreground hover:text-foreground shadow-none border-dashed hover:border-solid hover:bg-muted/50"
                    >
                        <Plus size={14} className="mr-1" /> Add Assignment
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Edit size={16} />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent 
                className="w-[95%] sm:max-w-[480px] lg:max-w-[600px] p-0 gap-0 max-h-[85vh] h-auto min-h-[300px] flex flex-col border-border/80 shadow-2xl rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[10%] translate-y-0"
            >
                <DialogHeader className="px-4 py-2 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
                    <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                        {mode === "create" ? "Create Assignment" : "Edit Assignment"}
                    </DialogTitle>

                    <DialogClose className="rounded-md p-2 hover:bg-muted transition">
                        <X className="h-6 w-6 text-muted-foreground hover:text-foreground" />
                    </DialogClose>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-thumb]:border-x-[1px] [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content">
                    <Form {...form}>
                        <form id="assignment-form" onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-6">
                            
                            <div className="space-y-2">
                                <FormField 
                                    control={form.control} 
                                    name="title" 
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">
                                                Title
                                            </FormLabel>
                                            <FormControl>
                                                <ShadcnInput 
                                                    {...field} 
                                                    className="h-12 px-4 text-base shadow-none" 
                                                    placeholder="e.g. Midterm Project"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} 
                                />
                            </div>

                            <div className="space-y-2">
                                <FormField 
                                    control={form.control} 
                                    name="description" 
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">
                                                Instructions
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    rows={4} 
                                                    {...field} 
                                                    className="resize-none text-base shadow-none p-4 min-h-[120px]" 
                                                    placeholder="Describe the assignment requirements..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <FormField 
                                        control={form.control} 
                                        name="max_score" 
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">
                                                    Max Score
                                                </FormLabel>
                                                <FormControl>
                                                    <ShadcnInput 
                                                        type="number" 
                                                        {...field} 
                                                        onChange={e => field.onChange(Number(e.target.value))} 
                                                        className="h-12 px-4 text-base shadow-none"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} 
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <FormField 
                                        control={form.control} 
                                        name="due_date" 
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">
                                                    Due Date
                                                </FormLabel>
                                                <FormControl>
                                                    <ShadcnInput 
                                                        type="datetime-local" 
                                                        {...field} 
                                                        value={field.value ?? ""} 
                                                        className="h-12 px-4 text-base shadow-none"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} 
                                    />
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>

                <div className="px-4 py-2 border-t bg-background shrink-0 mt-auto">
                    <Button 
                        type="submit" 
                        form="assignment-form" 
                        disabled={mutation.isPending}
                        className="w-full h-12 text-base font-medium shadow-sm transition-all active:scale-[0.98]"
                    >
                        {mutation.isPending ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <SaveIcon className="mr-2 h-5 w-5" />
                        )} 
                        {mode === "create" ? "Create Assignment" : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const DeleteButton: React.FC<{ type: "lesson" | "module" | "resource" | "quiz" | "assignment"; id: number; courseSlug: string }> = ({ type, id, courseSlug }) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: () => {
            const endpointType = type === "quiz" ? "quizzes" : `${type}s`;
            return api.delete(`/manage-course/${courseSlug}/${endpointType}/${id}/`);
        },
        onSuccess: () => {
            toast.success(`${type} deleted successfully`);
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
            setOpen(false);
        },
        onError: () => {
            toast.error(`Failed to delete ${type}`);
            setOpen(false);
        }
    });

    const getWarningMessage = () => {
        switch (type) {
            case "module":
                return "This will permanently delete the module and all lessons, assignments, and quizzes contained within it.";
            case "lesson":
                return "This will delete the lesson content, video, and all attached resources and quizzes.";
            case "quiz":
                return "This will permanently remove the quiz and all associated student grades and attempts.";
            case "assignment":
                return "This will delete the assignment details and remove all student submissions.";
            default:
                return "This will permanently remove this item from your course.";
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary active:text-primary focus:ring-0 border-0">
                        <MoreVertical size={16} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                        onSelect={() => setOpen(true)} 
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete {type}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent 
                    className="w-[95%] sm:max-w-[400px] p-0 gap-0 border-border/80 shadow-2xl rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[10%] translate-y-0"
                >
                    <DialogHeader className="px-6 py-4 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-red-100/50 flex items-center justify-center shrink-0 border border-red-200/60">
                                <Trash2 className="h-4 w-4 text-red-600" />
                            </div>
                            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                                Delete {type}?
                            </DialogTitle>
                        </div>
                        <DialogClose className="rounded-md p-2 hover:bg-muted transition -mr-2">
                            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        </DialogClose>
                    </DialogHeader>

                    <div className="p-6">
                        <div className="space-y-3">
                            <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                Are you sure you want to delete this {type}?
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {getWarningMessage()}
                            </p>
                            <div className="bg-red-50/50 border border-red-100 rounded-md p-3">
                                <p className="text-xs text-red-600 font-medium flex gap-2">
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-3 border-t bg-background flex justify-end gap-2 shrink-0">
                        <Button variant="outline" onClick={() => setOpen(false)} className="h-9">
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => mutate()} 
                            disabled={isPending}
                            className="h-9 shadow-sm"
                        >
                            {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                            Confirm Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

const LessonPreviewDialog: React.FC<{ lesson: LessonDetail }> = ({ lesson }) => {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors">
                    <Eye size={16} />
                </Button>
            </DialogTrigger>

            <DialogContent 
                className="w-[95%] sm:max-w-[480px] lg:max-w-[800px] p-0 gap-0 max-h-[85vh] h-auto min-h-[300px] flex flex-col border-border/80 shadow-2xl rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[10%] translate-y-0"
            >
                <DialogHeader className="px-4 py-2 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
                    <DialogTitle className="text-lg font-semibold tracking-tight text-foreground truncate pr-4">
                        {lesson.title}
                    </DialogTitle>

                    <DialogClose className="rounded-md p-2 hover:bg-muted transition">
                        <X className="h-6 w-6 text-muted-foreground hover:text-foreground" />
                    </DialogClose>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-thumb]:border-x-[1px] [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content">
                    <div className="flex flex-col gap-8">
                        {lesson.video_file && (
                            <div className="space-y-2">
                                <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">
                                    Video Lesson
                                </span>
                                <div className="relative w-full overflow-hidden rounded-md border bg-black/5 aspect-video shadow-sm">
                                    <video 
                                        controls
                                        controlsList="nodownload noremoteplayback"
                                        src={lesson.video_file} 
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">
                                Lesson Content
                            </span>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 p-5 bg-muted/30 rounded-md border border-dashed min-h-[100px]">
                                <div className="whitespace-pre-wrap leading-relaxed">
                                    {lesson.content || "No text content available for this lesson."}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-2 border-t bg-background shrink-0 mt-auto">
                    <Button 
                        variant="secondary" 
                        onClick={() => setOpen(false)}
                        className="w-full h-12 text-base font-medium shadow-sm transition-all active:scale-[0.98]"
                    >
                        Close Preview
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

