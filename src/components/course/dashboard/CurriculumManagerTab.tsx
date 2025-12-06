import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { 
    Plus, Loader2, Trash2, Edit, SaveIcon, 
    Video, FileText, BookOpen, MoreVertical, 
    Eye, HelpCircle, X,
    AlertTriangleIcon
} from "lucide-react";

import api from "@/lib/api/axios";
import { cn } from "@/lib/utils";
import {
    ModuleDetail, LessonDetail, AssignmentDetail, QuizDetail, 
    ModuleAddValues, ModuleAddSchema, 
    LessonCreateSchema, LessonCreateValues,
    AssignmentCreateSchema, AssignmentCreateValues,
    QuizCreateSchema, QuizCreateValues
} from "./SharedTypes";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

interface CurriculumTabProps {
    courseSlug: string;
    modules: ModuleDetail[];
}

const CurriculumManagerTab: React.FC<CurriculumTabProps> = ({ courseSlug, modules }) => {
    const queryClient = useQueryClient();
    const [isModuleDialogOpen, setModuleDialogOpen] = useState(false);

    const { mutate: addModule, isPending: isAddingModule } = useMutation({
        mutationFn: (data: ModuleAddValues) => api.post(`/manage-course/${courseSlug}/modules/`, data),
        onSuccess: () => {
            toast.success("Module added successfully.");
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
            setModuleDialogOpen(false);
        },
        onError: (error: any) => toast.error(`Failed: ${error.response?.data?.title || 'Unknown Error'}`),
    });

    const moduleForm = useForm<ModuleAddValues>({
        resolver: zodResolver(ModuleAddSchema) as any,
        defaultValues: { title: "", description: "" },
    });

    return (
        <Card className="border border-border shadow-none p-4 sm:p-6">
            <CardHeader className="flex flex-row items-center justify-between px-0">
                <div>
                    <CardTitle>Course Curriculum</CardTitle>
                    <CardDescription>Manage modules, lessons, quizzes, and assignments.</CardDescription>
                </div>
                <Dialog open={isModuleDialogOpen} onOpenChange={setModuleDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="h-4 w-4 mr-2" /> Add Module</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg p-0 top-[10%] translate-y-0 max-h-[85vh] flex flex-col gap-0">

                        <div className="p-4 border-b bg-muted/40 rounded-t-lg shrink-0">
                            <DialogTitle>Create New Module</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Add a new module to organize your course content.
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 p-6">
                            <Form {...moduleForm}>
                                <form 
                                    id="create-module-form" 
                                    onSubmit={moduleForm.handleSubmit((data) => addModule(data))} 
                                    className="space-y-4"
                                >
                                    <FormField control={moduleForm.control} name="title" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Module Title</FormLabel>
                                            <FormControl>
                                                <ShadcnInput {...field} value={field.value ?? ""} placeholder="e.g. Introduction" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={moduleForm.control} name="description" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} value={field.value ?? ""} placeholder="What will students learn in this module?" rows={4} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </form>
                            </Form>
                        </div>

                        <div className="p-4 border-t bg-muted/40 rounded-b-lg flex justify-end shrink-0">
                            <Button 
                                type="submit" 
                                form="create-module-form" 
                                disabled={isAddingModule}
                            >
                                {isAddingModule ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                                ) : null}
                                Create Module
                            </Button>
                        </div>

                    </DialogContent>
                </Dialog>
            </CardHeader>
            
            <CardContent className="px-0">
                {modules.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/50">
                        <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium">No curriculum yet</h3>
                        <Button variant="secondary" className="mt-4" onClick={() => setModuleDialogOpen(true)}>Add First Module</Button>
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {modules.map((mod, modIndex) => (
                            <AccordionItem key={mod.id} value={`module-${mod.id}`} className="border rounded-lg bg-card px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3 text-left w-full">
                                        <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">{modIndex + 1}</Badge>
                                        <div className="flex flex-col flex-1">
                                            <span className="font-semibold text-lg">{mod.title}</span>
                                            {mod.description && <span className="text-xs text-muted-foreground font-normal line-clamp-1">{mod.description}</span>}
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-6 space-y-6">
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2"><BookOpen size={14} /> Lessons</h4>
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
                                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2"><FileText size={14} /> Assignment</h4>
                                            {/* STRICT CONSTRAINT: Only Show Add if 0 assignments */}
                                            {mod.assignments.length === 0 && (
                                                <AssignmentManagerDialog module={mod} courseSlug={courseSlug} mode="create" />
                                            )}
                                        </div>
                                        {mod.assignments.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic pl-2 border-l-2">No assignment attached to this module.</p>
                                        ) : (
                                            <div className="grid gap-3">
                                                {mod.assignments.map((assignment) => (
                                                    <div key={assignment.id} className="flex items-center justify-between p-4 rounded-lg border bg-amber-50/50 border-amber-100">
                                                        <div>
                                                            <div className="font-medium flex items-center gap-2">
                                                                <FileText size={16} className="text-amber-600"/> {assignment.title}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">Max Score: {assignment.max_score}</div>
                                                        </div>
                                                        <AssignmentManagerDialog module={mod} courseSlug={courseSlug} mode="edit" existingAssignment={assignment} />
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

const LessonRow: React.FC<{ lesson: LessonDetail; courseSlug: string }> = ({ lesson, courseSlug }) => {
    const hasQuiz = lesson.quizzes && lesson.quizzes.length > 0;

    return (
        <div className="border rounded-md bg-background overflow-hidden">
            <div className="flex items-center justify-between p-3 gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={cn("p-2 rounded-full shrink-0", lesson.video_file ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500")}>
                        {lesson.video_file ? <Video size={16} /> : <FileText size={16} />}
                    </div>
                    <div className="truncate">
                        <div className="font-medium truncate">{lesson.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {lesson.video_file && <span>Video</span>}
                            {lesson.content && <span>• Text Content</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <LessonPreviewDialog lesson={lesson} />
                    <LessonManagerDialog module={{ id: 0, title: "", description: "", lessons: [], assignments: [] }} courseSlug={courseSlug} mode="edit" existingLesson={lesson} />
                    <DeleteButton type="lesson" id={lesson.id} courseSlug={courseSlug} />
                </div>
            </div>

            <div className="bg-muted/30 px-3 py-2 border-t flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <HelpCircle size={12} /> Quiz Assessment
                    </span>
                    {/* STRICT CONSTRAINT: Only Show Add if 0 quizzes */}
                    {!hasQuiz && <QuizManagerDialog lesson={lesson} courseSlug={courseSlug} mode="create" />}
                </div>
                
                {hasQuiz && (
                    <div className="flex items-center justify-between text-sm bg-background border rounded px-3 py-2 mt-1">
                        <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{lesson.quizzes[0].title}</span>
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{lesson.quizzes[0].questions?.length || 0} Questions</Badge>
                        </div>
                        <QuizManagerDialog lesson={lesson} courseSlug={courseSlug} mode="edit" existingQuiz={lesson.quizzes[0]} />
                    </div>
                )}
            </div>
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const queryClient = useQueryClient();
    
    const defaultValues = mode === "edit" && existingLesson ? {
        title: existingLesson.title || "",
        content: existingLesson.content || "",
        video_file: null 
    } : { title: "", content: "", video_file: null };

    const form = useForm<LessonCreateValues>({
        resolver: zodResolver(LessonCreateSchema) as any,
        defaultValues
    });

    // Reset form when modal opens/closes or mode changes
    useEffect(() => {
        if (open) {
            setShowDeleteConfirm(false);
            if (mode === "create") form.reset();
        }
    }, [open, mode]);

    const mutation = useMutation({
        mutationFn: (data: LessonCreateValues) => {
            const formData = new FormData();
            formData.append("title", data.title);
            formData.append("content", data.content || "");
            if (data.video_file instanceof File) {
                formData.append("video_file", data.video_file);
            }
            
            if (mode === "create") {
                formData.append("module", module.id.toString());
                return api.post(`/manage-course/${courseSlug}/lessons/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
            } else {
                return api.patch(`/manage-course/${courseSlug}/lessons/${existingLesson?.id}/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
            }
        },
        onSuccess: () => {
            toast.success(`Lesson ${mode === "create" ? "added" : "updated"}`);
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
            setOpen(false);
            if (mode === "create") form.reset();
        },
        onError: () => toast.error("Operation failed"),
    });

    const handleDelete = async () => {
        if (!existingLesson) return;
        try {
            await api.delete(`/manage-course/${courseSlug}/lessons/${existingLesson.id}/`);
            toast.success("Lesson deleted");
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
            setOpen(false);
        } catch { toast.error("Delete failed"); }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button variant="outline" size="sm" className="h-7"><Plus size={14} className="mr-1" /> Add Lesson</Button>
                ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit size={16} /></Button>
                )}
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-lg p-0 top-[10%] translate-y-0 max-h-[85vh] flex flex-col gap-0">
                
                {/* Header (Gray) */}
                <div className="p-4 border-b bg-muted/40 rounded-t-lg shrink-0">
                    <DialogTitle>{mode === "create" ? "Add Lesson" : "Edit Lesson"}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        {mode === "create" ? `Adding to: ${module.title}` : existingLesson?.title}
                    </p>
                </div>
                
                {/* Scrollable Body: flex-1 + min-h-0 ensures scrolling works! */}
                <div className="flex-1 overflow-y-auto min-h-0 p-6">
                    <Form {...form}>
                        <form id="lesson-form" onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl><ShadcnInput {...field} value={field.value ?? ""} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="content" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Text Content (Markdown)</FormLabel>
                                    <FormControl><Textarea rows={6} {...field} value={field.value ?? ""} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="video_file" render={({ field: { onChange, value, ...rest } }) => ( 
                                <FormItem>
                                    <FormLabel>Video File</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <ShadcnInput 
                                                type="file" 
                                                accept="video/*" 
                                                className="cursor-pointer"
                                                onChange={(e) => onChange(e.target.files?.[0] || null)} 
                                                {...rest} 
                                                value={value?.fileName ?? ""} // File inputs are uncontrolled mostly, but just in case
                                            />
                                        </div>
                                    </FormControl>
                                    {mode === "edit" && existingLesson?.video_file && (
                                        <FormDescription className="text-xs text-amber-600">
                                            ⚠️ Current video exists. Uploading a new one will replace it.
                                        </FormDescription>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </form>
                    </Form>
                </div>

                {/* Footer (Gray) with Delete Confirmation */}
                <div className="p-4 border-t bg-muted/40 rounded-b-lg flex flex-col-reverse sm:flex-row sm:justify-between gap-3 shrink-0 items-center h-auto sm:h-16">
                    {mode === "edit" ? (
                        showDeleteConfirm ? (
                            <div className="flex items-center gap-2 w-full sm:w-auto animate-in slide-in-from-left-2 fade-in">
                                <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">Sure?</span>
                                <Button variant="destructive" size="sm" onClick={handleDelete} type="button" className="h-9 flex-1 sm:flex-none">Yes</Button>
                                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)} type="button" className="h-9 flex-1 sm:flex-none">Cancel</Button>
                            </div>
                        ) : (
                            <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)} type="button" className="w-full sm:w-auto">
                                <Trash2 size={14} className="mr-1"/> Delete
                            </Button>
                        )
                    ) : (
                        <div className="hidden sm:block" /> 
                    )}

                    <Button 
                        type="submit" 
                        form="lesson-form" 
                        className="w-full sm:w-auto" 
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <SaveIcon className="mr-2 h-4 w-4" />} 
                        Save Changes
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
};


const LessonPreviewDialog: React.FC<{ lesson: LessonDetail }> = ({ lesson }) => {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye size={16} className="text-blue-600" />
                </Button>
            </DialogTrigger>

            {/* Layout Container */}
            <DialogContent className="sm:max-w-3xl p-0 top-[10%] translate-y-0 max-h-[85vh] flex flex-col gap-0">
                
                {/* Gray Header (Fixed) */}
                <div className="p-4 border-b bg-muted/40 rounded-t-lg shrink-0">
                    <DialogTitle>{lesson.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">Lesson Preview</p>
                </div>

                {/* Body (Scrollable In-Between) */}
                <div className="flex-1 overflow-y-auto min-h-0 p-6">
                    <div className="space-y-6">
                        {/* Video Section */}
                        {lesson.video_file && (
                            <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center shadow-sm border border-border">
                                <video controls src={lesson.video_file} className="w-full h-full" />
                            </div>
                        )}

                        {/* Content Section */}
                        <div className="prose dark:prose-invert max-w-none">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide border-b pb-2 mb-3">
                                Lesson Notes
                            </h3>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                                {lesson.content || "No text content available."}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gray Footer (Fixed) */}
                <div className="p-4 border-t bg-muted/40 rounded-b-lg flex justify-end shrink-0">
                    <Button variant="secondary" onClick={() => setOpen(false)}>
                        Close Preview
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setShowDeleteConfirm(false);
            if (mode === "create") form.reset();
        }
    }, [open, mode]);

    const mutation = useMutation({
        mutationFn: (data: AssignmentCreateValues) => {
            if (mode === "create") {
                return api.post(`/manage-course/${courseSlug}/assignments/`, { ...data, module: module.id });
            } else {
                return api.patch(`/manage-course/${courseSlug}/assignments/${existingAssignment?.id}/`, data);
            }
        },
        onSuccess: () => {
            toast.success(`Assignment ${mode === "create" ? "created" : "updated"}`);
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
            setOpen(false);
        },
        onError: () => toast.error("Operation failed"),
    });

    const handleDelete = async () => {
        if (!existingAssignment) return;
        try {
            await api.delete(`/manage-course/${courseSlug}/assignments/${existingAssignment.id}/`);
            toast.success("Assignment deleted");
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
            setOpen(false);
        } catch { toast.error("Delete failed"); }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button variant="ghost" size="sm" className="h-7 text-xs border border-dashed"><Plus size={12} className="mr-1" /> Add Assignment</Button>
                ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit size={16} /></Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg p-0 top-[10%] translate-y-0 max-h-[85vh] flex flex-col gap-0">
                
                {/* Gray Header */}
                <div className="p-4 border-b bg-muted/40 rounded-t-lg shrink-0">
                    <DialogTitle>{mode === "create" ? "Create Assignment" : "Edit Assignment"}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        {mode === "create" ? `Adding to: ${module.title}` : existingAssignment?.title}
                    </p>
                </div>

                {/* Scrollable Body: flex-1 + min-h-0 enables the scroll */}
                <div className="flex-1 overflow-y-auto min-h-0 p-6">
                    <Form {...form}>
                        <form id="assignment-form" onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <ShadcnInput {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Instructions</FormLabel>
                                    <FormControl>
                                        <Textarea rows={4} {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="max_score" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Score</FormLabel>
                                        <FormControl>
                                            <ShadcnInput 
                                                type="number" 
                                                {...field} 
                                                onChange={e => field.onChange(Number(e.target.value))} 
                                                value={field.value ?? 100}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="due_date" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Due Date</FormLabel>
                                        <FormControl>
                                            <ShadcnInput 
                                                type="datetime-local" 
                                                {...field} 
                                                value={field.value ?? ""} 
                                            />
                                        </FormControl>
                                    </FormItem>
                                )} />
                            </div>
                        </form>
                    </Form>
                </div>

                {/* Gray Footer with Inline Delete Confirmation */}
                <div className="p-4 border-t bg-muted/40 rounded-b-lg flex flex-col-reverse sm:flex-row sm:justify-between gap-3 shrink-0 items-center h-auto sm:h-16">
                    {mode === "edit" ? (
                        showDeleteConfirm ? (
                            <div className="flex items-center gap-2 w-full sm:w-auto animate-in slide-in-from-left-2 fade-in">
                                <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">Are you sure?</span>
                                <Button variant="destructive" size="sm" onClick={handleDelete} type="button" className="h-9 flex-1 sm:flex-none">Yes</Button>
                                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)} type="button" className="h-9 flex-1 sm:flex-none">Cancel</Button>
                            </div>
                        ) : (
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => setShowDeleteConfirm(true)}
                                type="button"
                                className="w-full sm:w-auto"
                            >
                                <Trash2 size={14} className="mr-1"/> Delete
                            </Button>
                        )
                    ) : (
                        /* Spacer to push Save button to right on desktop */
                        <div className="hidden sm:block" />
                    )}

                    <Button 
                        type="submit" 
                        form="assignment-form" 
                        className="w-full sm:w-auto" 
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : "Save Assignment"}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
};

// -----------------------------------------------------------
// ❓ ROBUST QUIZ MANAGER
// -----------------------------------------------------------

const QuizManagerDialog: React.FC<{ 
    lesson: LessonDetail; 
    courseSlug: string; 
    mode: "create" | "edit"; 
    existingQuiz?: QuizDetail 
}> = ({ lesson, courseSlug, mode, existingQuiz }) => {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("settings");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<QuizCreateValues>({
        resolver: zodResolver(QuizCreateSchema) as any,
        // FIX: Ensure no values are null. Use "" for empty strings and undefined/0 for numbers.
        defaultValues: mode === "edit" && existingQuiz ? {
            title: existingQuiz.title || "",
            description: existingQuiz.description || "",
            max_score: existingQuiz.max_score || 10,
            time_limit_minutes: existingQuiz.time_limit_minutes ?? undefined, // Allow undefined for optional
            max_attempts: existingQuiz.max_attempts || 3,
            questions: existingQuiz.questions || []
        } : { 
            title: "", 
            description: "", 
            max_score: 10, 
            time_limit_minutes: 30, 
            max_attempts: 3, 
            questions: [] 
        }
    });

    const { fields: questions, append: addQuestion, remove: removeQuestion } = useFieldArray({
        control: form.control,
        name: "questions"
    });

    useEffect(() => {
        if(open) {
            setShowDeleteConfirm(false);
            setActiveTab("settings");
            // Only reset if creating, otherwise we lose the edit state passed in props
            if (mode === "create") form.reset(); 
        }
    }, [open, mode]);

    const mutation = useMutation({
        mutationFn: (data: QuizCreateValues) => {
            const payload = {
                ...data,
                time_limit_minutes: data.time_limit_minutes ? Number(data.time_limit_minutes) : null
            };

            if (mode === "create") return api.post(`/manage-course/${courseSlug}/lessons/${lesson.id}/quizzes/`, payload);
            return api.patch(`/manage-course/${courseSlug}/quizzes/${existingQuiz?.id}/`, payload);
        },
        onSuccess: () => {
            toast.success(`Quiz ${mode === "create" ? "created" : "updated"}`);
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
            setOpen(false);
        },
        onError: (err) => {
            console.error(err);
            toast.error("Failed to save. Please check for errors.");
        }
    });

    const handleDeleteQuiz = async () => {
        if (!existingQuiz) return;
        try {
            await api.delete(`/manage-course/${courseSlug}/quizzes/${existingQuiz.id}/`);
            toast.success("Quiz deleted");
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
            setOpen(false);
        } catch { toast.error("Delete failed"); }
    };

    const onInvalid = (errors: any) => {
        const errorKeys = Object.keys(errors);
        if (errorKeys.some(k => ["title", "description", "max_score", "max_attempts"].includes(k))) {
            setActiveTab("settings");
            toast.error("Please fix errors in General Settings");
        } else if (errorKeys.includes("questions")) {
            setActiveTab("questions");
            toast.error("Please fix errors in Questions");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button variant="ghost" size="sm" className="h-7 text-xs border border-dashed"><Plus size={12} className="mr-1" /> Add Quiz</Button>
                ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit size={16} /></Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-4xl p-0 top-[5%] translate-y-0 max-h-[90vh] flex flex-col gap-0">
                <div className="p-4 border-b bg-muted/40 rounded-t-lg shrink-0">
                    <DialogTitle>{mode === "create" ? "Create Quiz" : "Manage Quiz"}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        {mode === "create" ? `Attached to: ${lesson.title}` : existingQuiz?.title}
                    </p>
                </div>

                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <Form {...form}>
                        <form id="quiz-form" onSubmit={form.handleSubmit((d) => mutation.mutate(d), onInvalid)} className="h-full flex flex-col min-h-0">
                            
                            <div className="px-6 pt-4 shrink-0">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className="w-full grid grid-cols-2">
                                        <TabsTrigger value="settings">General Settings</TabsTrigger>
                                        <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                            
                            {activeTab === "settings" && (
                                <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4">
                                    <FormField control={form.control} name="title" render={({ field }) => (
                                        <FormItem><FormLabel>Title</FormLabel><FormControl><ShadcnInput {...field} value={field.value ?? ""} /></FormControl><FormMessage/></FormItem>
                                    )} />
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value ?? ""} /></FormControl><FormMessage/></FormItem>
                                    )} />
                                    <div className="grid grid-cols-3 gap-4 items-start">
                                        <FormField control={form.control} name="max_score" render={({ field }) => (
                                            <FormItem><FormLabel>Max Score</FormLabel><FormControl><ShadcnInput type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} value={field.value ?? 0} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="time_limit_minutes" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Time Limit (Min)</FormLabel>
                                                <FormControl>
                                                    {/* FIX: Handle optional number input correctly */}
                                                    <ShadcnInput 
                                                        type="number" 
                                                        placeholder="Optional" 
                                                        {...field} 
                                                        value={field.value ?? ""} 
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            field.onChange(val === "" ? undefined : Number(val));
                                                        }} 
                                                    />
                                                </FormControl>
                                                <p className="text-[10px] text-muted-foreground">Leave empty for no limit</p>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="max_attempts" render={({ field }) => (
                                            <FormItem><FormLabel>Attempts</FormLabel><FormControl><ShadcnInput type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} value={field.value ?? 1} /></FormControl></FormItem>
                                        )} />
                                    </div>
                                </div>
                            )}

                            {activeTab === "questions" && (
                                <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4 bg-muted/5">
                                    {questions.length === 0 && (
                                        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                            <p>No questions added yet.</p>
                                        </div>
                                    )}
                                    {questions.map((qField, qIndex) => (
                                        <Card key={qField.id} className="p-4 border bg-card shadow-sm">
                                            <div className="flex justify-between items-start mb-3 pb-3 border-b">
                                                <Badge variant="outline" className="h-6 px-2 flex items-center justify-center bg-muted font-mono">
                                                    Q{qIndex + 1}
                                                </Badge>
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-6 text-destructive hover:bg-destructive/10 px-2" 
                                                    onClick={() => removeQuestion(qIndex)}
                                                >
                                                    <Trash2 size={14} className="mr-1" /> <span className="hidden sm:inline">Remove</span>
                                                </Button>
                                            </div>

                                            <div className="space-y-4">
                                                {/* Question Text */}
                                                <FormField control={form.control} name={`questions.${qIndex}.text`} render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Textarea placeholder="Type your question here..." className="bg-background min-h-[60px]" {...field} value={field.value ?? ""} />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )} />
                                                
                                                {/* FIX: Mobile Responsive Layout (Stack on mobile, Row on desktop) */}
                                                <div className="flex flex-col sm:flex-row gap-4 bg-muted/20 p-3 rounded-md">
                                                    <FormField control={form.control} name={`questions.${qIndex}.question_type`} render={({ field }) => (
                                                        <FormItem className="w-full sm:flex-1">
                                                            <FormLabel className="text-xs">Answer Type</FormLabel>
                                                            <FormControl>
                                                                <select 
                                                                    className="flex h-9 w-full rounded-md border bg-background px-3 text-sm focus:ring-1 focus:ring-ring" 
                                                                    {...field}
                                                                    value={field.value ?? "mcq"}
                                                                >
                                                                    <option value="mcq">Multiple Choice</option>
                                                                    <option value="text">Text Answer</option>
                                                                </select>
                                                            </FormControl>
                                                        </FormItem>
                                                    )} />
                                                    <FormField control={form.control} name={`questions.${qIndex}.score_weight`} render={({ field }) => (
                                                        <FormItem className="w-full sm:w-24">
                                                            <FormLabel className="text-xs">Points</FormLabel>
                                                            <FormControl>
                                                                <ShadcnInput 
                                                                    type="number" 
                                                                    {...field} 
                                                                    onChange={e => field.onChange(Number(e.target.value))} 
                                                                    value={field.value ?? 1} 
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )} />
                                                </div>
                                            </div>
                                            
                                            {form.watch(`questions.${qIndex}.question_type`) === 'mcq' && (
                                                <div className="mt-4 pl-0 sm:pl-2 sm:border-l-2 border-primary/20">
                                                    <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Answer Options</p>
                                                    <QuizOptionsArray nestIndex={qIndex} control={form.control} />
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        className="w-full border-dashed py-6" 
                                        onClick={() => addQuestion({ text: "", question_type: "mcq", score_weight: 1, order: questions.length, options: [] })}
                                    >
                                        <Plus className="mr-2 h-4 w-4"/> Add New Question
                                    </Button>
                                </div>
                            )}
                        </form>
                    </Form>
                </div>

                <div className="p-4 border-t bg-muted/40 rounded-b-lg flex flex-col-reverse sm:flex-row sm:justify-between gap-3 shrink-0 items-center h-auto sm:h-16">
                    {mode === "edit" ? (
                        showDeleteConfirm ? (
                            <div className="flex items-center gap-2 w-full sm:w-auto animate-in slide-in-from-left-2 fade-in">
                                <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">Sure?</span>
                                <Button variant="destructive" size="sm" onClick={handleDeleteQuiz} type="button" className="h-9 flex-1 sm:flex-none">Yes</Button>
                                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)} type="button" className="h-9 flex-1 sm:flex-none">Cancel</Button>
                            </div>
                        ) : (
                            <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)} type="button" className="w-full sm:w-auto">
                                <Trash2 size={14} className="mr-1"/> Delete Quiz
                            </Button>
                        )
                    ) : <div className="hidden sm:block" />}

                    <Button type="submit" form="quiz-form" className="w-full sm:w-auto" disabled={mutation.isPending}>
                        {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <SaveIcon className="mr-2 h-4 w-4" />} 
                        Save Entire Quiz
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};


// Sub-component to handle nested options field array properly
const QuizOptionsArray = ({ nestIndex, control }: { nestIndex: number, control: any }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `questions.${nestIndex}.options`
    });

    return (
        <div className="ml-10 border-l-2 pl-4 space-y-2">
            {fields.map((item, k) => (
                <div key={item.id} className="flex items-center gap-2">
                    <FormField control={control} name={`questions.${nestIndex}.options.${k}.is_correct`} render={({ field }) => (
                        <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 accent-green-600" />
                    )} />
                    <FormField control={control} name={`questions.${nestIndex}.options.${k}.text`} render={({ field }) => (
                        <ShadcnInput placeholder={`Option ${k + 1}`} {...field} className="h-8 text-sm" />
                    )} />
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(k)}><Trash2 size={12} /></Button>
                </div>
            ))}
            <Button type="button" variant="link" size="sm" className="h-6 px-0 text-xs" onClick={() => append({ text: "", is_correct: false })}>+ Add Option</Button>
        </div>
    );
};


const DeleteButton: React.FC<{ type: "lesson" | "module"; id: number; courseSlug: string }> = ({
    type,
    id,
    courseSlug,
}) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: () => api.delete(`/manage-course/${courseSlug}/${type}s/${id}/`),
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

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 bg-transparent hover:bg-transparent active:bg-transparent focus-visible:ring-0 border-0 shadow-none" 
                    >
                        <MoreVertical
                            size={16}
                            className="mx-auto text-muted-foreground transition-colors"
                        />
                    </Button>

                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        // Use onSelect to prevent the dropdown from blocking the dialog
                        onSelect={() => setOpen(true)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete {type}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md p-0 top-[15%] translate-y-0 gap-0">
                    <div className="p-4 border-b bg-muted/40 rounded-t-lg flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <AlertTriangleIcon className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold">Delete {type}?</DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                This action cannot be undone.
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="p-6">
                        <p className="text-sm text-foreground/80 leading-relaxed">
                            Are you sure you want to permanently delete this <strong>{type}</strong>? 
                            {type === "module" && " All lessons and assignments inside it will also be removed."}
                        </p>
                    </div>

                    <div className="p-4 border-t bg-muted/40 rounded-b-lg flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                            className="h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => mutate()}
                            disabled={isPending}
                            className="h-9"
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};