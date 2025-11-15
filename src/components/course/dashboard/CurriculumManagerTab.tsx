// src/components/tutor/dashboard/CurriculumManagerTab.tsx

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Edit, SaveIcon, Save } from "lucide-react";

import api from "@/lib/api/axios";
import { cn } from "@/lib/utils";
import {
    ModuleDetail, AssignmentDetail, LessonCreateValues, ModuleAddValues, ModuleAddSchema, 
    LessonCreateSchema, AssignmentCreateSchema, AssignmentCreateValues, LessonDetail
} from "./SharedTypes"; // Ensure SharedTypes is correctly path-resolved

// --- UI Components (Assumed to be imported) ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface CurriculumTabProps {
    courseSlug: string;
    modules: ModuleDetail[];
}

// -----------------------------------------------------------
// 📚 MAIN EXPORT COMPONENT
// -----------------------------------------------------------

const CurriculumManagerTab: React.FC<CurriculumTabProps> = ({ courseSlug, modules }) => {
    const queryClient = useQueryClient();

    // --- Module Mutations (Code remains valid) ---
    const { mutate: addModule, isPending: isAddingModule } = useMutation({
        mutationFn: (data: ModuleAddValues) => 
            api.post(`/manage-course/${courseSlug}/modules/`, data),
        onSuccess: () => {
            toast.success("Module added successfully.");
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
        },
        onError: (error: any) => toast.error(`Failed to add module: ${error.response?.data?.title || 'Unknown Error'}`),
    });

    const moduleForm = useForm<ModuleAddValues>({
        resolver: zodResolver(ModuleAddSchema),
        defaultValues: { title: "", description: "" },
    });

    const handleAddModule: SubmitHandler<ModuleAddValues> = (data) => {
        addModule(data, {
            onSuccess: () => {
                moduleForm.reset();
                setModuleDialogOpen(false);
            }
        });
    };
    const [isModuleDialogOpen, setModuleDialogOpen] = useState(false);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Course Curriculum</CardTitle>
                <Dialog open={isModuleDialogOpen} onOpenChange={setModuleDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Module</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add New Module</DialogTitle></DialogHeader>
                        <Form {...moduleForm}>
                            <form onSubmit={moduleForm.handleSubmit(handleAddModule)} className="space-y-4">
                                <FormField control={moduleForm.control} name="title" render={({ field }) => (
                                    <FormItem><FormLabel>Module Title</FormLabel>
                                        <FormControl><ShadcnInput {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={moduleForm.control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel>Description</FormLabel>
                                        <FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Button type="submit" disabled={moduleForm.formState.isSubmitting || isAddingModule}>
                                    {(moduleForm.formState.isSubmitting || isAddingModule) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Add Module
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                {modules.length === 0 ? (
                    <p className="text-gray-500">No modules defined yet. Start by adding a module.</p>
                ) : (
                    <Accordion type="multiple" className="w-full">
                        {modules.map((mod, modIndex) => (
                            <AccordionItem key={mod.id} value={`module-${mod.id}`}>
                                <AccordionTrigger className="text-lg font-semibold bg-gray-50 hover:bg-gray-100 px-4 rounded-t-md">
                                    Module {modIndex + 1}: {mod.title}
                                </AccordionTrigger>
                                <AccordionContent className="p-4 border border-t-0 space-y-4">
                                    <h4 className="text-md font-semibold text-gray-800">Lessons</h4>
                                    <ul className="space-y-2 pl-4 border-l-2">
                                        {mod.lessons.map((lesson: any) => (
                                            <li key={lesson.id} className="flex justify-between items-center bg-white p-3 border rounded">
                                                <span className="text-sm">{lesson.title}</span>
                                                <LessonActionButtons lesson={lesson} courseSlug={courseSlug} />
                                            </li>
                                        ))}
                                    </ul>
                                    <LessonCreatorDialog module={mod} courseSlug={courseSlug} />

                                    <div className="border-t pt-4">
                                        <h4 className="text-md font-semibold text-gray-800">Assignments</h4>
                                        {mod.assignments.length > 0 ? (
                                            mod.assignments.map((assignment: AssignmentDetail) => (
                                                <div key={assignment.id} className="mt-2 bg-yellow-50/50 p-3 rounded border border-yellow-200 flex justify-between items-center">
                                                    <span className="font-semibold">{assignment.title}</span>
                                                    <AssignmentActionButtons assignment={assignment} courseSlug={courseSlug} />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500 mb-2">No assignment attached to this module.</p>
                                                <AssignmentCreatorDialog module={mod} courseSlug={courseSlug} />
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


// -----------------------------------------------------------
// 🎥 LESSON SUB-COMPONENTS
// -----------------------------------------------------------

const LessonCreatorDialog: React.FC<{ module: ModuleDetail; courseSlug: string }> = ({ module, courseSlug }) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const { mutate: addLesson, isPending: isAddingLesson } = useMutation({
        mutationFn: (data: LessonCreateValues) => {
            const formData = new FormData();
            formData.append("title", data.title);
            formData.append("module", module.id.toString());
            if (data.video_file instanceof File) {
                formData.append("video_file", data.video_file);
            }
            return api.post(`/manage-course/${courseSlug}/lessons/`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
        onSuccess: () => {
            toast.success("Lesson added successfully.");
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
            lessonForm.reset();
            setOpen(false);
        },
        onError: () => toast.error("Failed to add lesson."),
    });

    const lessonForm = useForm<LessonCreateValues>({
        resolver: zodResolver(LessonCreateSchema),
        defaultValues: { title: "", video_file: null },
    });

    const handleAddLesson: SubmitHandler<LessonCreateValues> = (data) => {
        addLesson(data);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Plus size={14} className="mr-1" /> Add Lesson</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Add Lesson to {module.title}</DialogTitle></DialogHeader>
                <Form {...lessonForm}>
                    <form onSubmit={lessonForm.handleSubmit(handleAddLesson)} className="space-y-4">
                        <FormField control={lessonForm.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Lesson Title</FormLabel>
                                <FormControl><ShadcnInput {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                        )} />
                        
                        <FormField control={lessonForm.control} name="video_file" 
                            render={({ field: { onChange: formOnChange, value, ...restField } }) => ( 
                            <FormItem>
                                <FormLabel>Video File</FormLabel>
                                <FormControl>
                                    <ShadcnInput 
                                        type="file" 
                                        accept="video/*" 
                                        onChange={(e) => formOnChange(e.target.files?.[0] || null)} 
                                        {...restField} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        
                        <Button type="submit" disabled={lessonForm.formState.isSubmitting || isAddingLesson}>
                            {(lessonForm.formState.isSubmitting || isAddingLesson) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Save Lesson
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

const LessonActionButtons: React.FC<{ lesson: LessonDetail; courseSlug: string; }> = ({ lesson, courseSlug }) => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false); 
    
    const { mutate: deleteLesson } = useMutation({
        mutationFn: (lessonId: number) => 
            api.delete(`/manage-course/${courseSlug}/lessons/${lessonId}/`),
        onSuccess: () => {
            toast.success("Lesson deleted.");
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
        },
        onError: () => toast.error("Failed to delete lesson."),
    });
    
    return (
        <div className="flex items-center space-x-2">
            <TooltipProvider>
                
                {/* 🟢 FIX 1: Controlled Dialog wrapper */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => setIsDialogOpen(true)} // Manually open Dialog
                            >
                                <Edit size={14} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Lesson/Quizzes</TooltipContent>
                    </Tooltip>
                    
                    {/* 🟢 Pass the setter down */}
                    <LessonEditorDialog lesson={lesson} courseSlug={courseSlug} setOpen={setIsDialogOpen} />
                </Dialog>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => deleteLesson(lesson.id)}><Trash2 size={14} /></Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Lesson</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
};

const LessonEditorDialog: React.FC<{ lesson: LessonDetail; courseSlug: string; setOpen: (open: boolean) => void }> = ({ lesson, courseSlug, setOpen }) => {
    const queryClient = useQueryClient();
    
    // Check if the current video field value is an existing URL string
    const existingVideoUrl = typeof lesson.video_file === 'string' && lesson.video_file.startsWith('http') 
        ? lesson.video_file 
        : null;

    const editForm = useForm<LessonCreateValues>({
        resolver: zodResolver(LessonCreateSchema),
        defaultValues: {
            title: lesson.title,
            // 🟢 FIX 2: Initialize video_file with null for file input safety
            video_file: null, 
        },
    });

    const { mutate: updateLesson, isPending: isUpdatingLesson } = useMutation({
        mutationFn: (data: LessonCreateValues) => {
            const formData = new FormData();
            formData.append("title", data.title);
            
            // Logic to handle video_file state
            if (data.video_file instanceof File) {
                // Case 1: User uploaded a new file
                formData.append("video_file", data.video_file);
            } else if (data.video_file === null && existingVideoUrl) {
                // Case 2: User left file input empty but there was an existing URL. 
                // Preserve existing URL by sending the string back.
                formData.append("video_file", lesson.video_file || ''); 
            } else if (data.video_file === null && !existingVideoUrl) {
                // Case 3: No file ever existed. Send empty string.
                 formData.append("video_file", ""); 
            }
            
            return api.patch(`/manage-course/${courseSlug}/lessons/${lesson.id}/`, formData, {
                 headers: { "Content-Type": "multipart/form-data" },
            });
        },
        onSuccess: () => {
            toast.success("Lesson updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
            setOpen(false); // Close dialog using the prop
        },
        onError: () => toast.error("Failed to update lesson."),
    });

    const handleUpdateLesson: SubmitHandler<LessonCreateValues> = (data) => {
        updateLesson(data);
    };

    return (
        // 🟢 FIX 1: Return only the DialogContent
        <DialogContent>
            <DialogHeader><DialogTitle>Edit Lesson: {lesson.title}</DialogTitle></DialogHeader>
            <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleUpdateLesson)} className="space-y-4">
                    
                    <FormField control={editForm.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Lesson Title</FormLabel>
                            <FormControl>
                                {/* 🟢 FIX 3: Ensure value is never null/undefined */}
                                <ShadcnInput {...field} value={field.value ?? ""} />
                            </FormControl><FormMessage /></FormItem>
                    )} />

                    <FormField control={editForm.control} name="video_file" 
                        render={({ field: { onChange: formOnChange, value, ...restField } }) => ( 
                        <FormItem>
                            <FormLabel>Video File</FormLabel>
                            <FormControl>
                                <ShadcnInput 
                                    type="file" 
                                    accept="video/*" 
                                    onChange={(e) => formOnChange(e.target.files?.[0] || null)} 
                                    {...restField} 
                                />
                            </FormControl>
                            <FormDescription>
                                {existingVideoUrl 
                                    ? "Current video is set. Uploading a new file will replace it." 
                                    : "No video currently uploaded."}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {existingVideoUrl && (
                        <div className="rounded-lg overflow-hidden border">
                            <video controls playsInline src={existingVideoUrl} className="w-full h-auto" />
                        </div>
                    )}

                    <Button type="submit" disabled={isUpdatingLesson}>
                        {isUpdatingLesson ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SaveIcon size={14} className="mr-2" />} Save Changes
                    </Button>
                </form>
            </Form>
        </DialogContent>
    );
};


// -----------------------------------------------------------
// 📝 ASSIGNMENT SUB-COMPONENTS
// -----------------------------------------------------------

const AssignmentCreatorDialog: React.FC<{ module: ModuleDetail; courseSlug: string }> = ({ module, courseSlug }) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    
    const assignmentForm = useForm<AssignmentCreateValues>({
        resolver: zodResolver(AssignmentCreateSchema) as any,
        defaultValues: { title: "", description: "", max_score: 100 },
    });
    
    const { mutate: createAssignment, isPending: isCreatingAssignment } = useMutation({
        mutationFn: (data: AssignmentCreateValues) => 
            api.post(`/manage-course/${courseSlug}/assignments/`, { ...data, module: module.id }),
        onSuccess: () => {
            toast.success("Assignment created.");
            assignmentForm.reset();
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
        },
        onError: () => toast.error("Failed to create assignment."),
    });

    const handleCreateAssignment: SubmitHandler<AssignmentCreateValues> = (data) => {
        createAssignment(data);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm"><Plus size={14} className="mr-1" /> Add Assignment</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Add Assignment to {module.title}</DialogTitle></DialogHeader>
                <Form {...assignmentForm}>
                    <form onSubmit={assignmentForm.handleSubmit(handleCreateAssignment)} className="space-y-4">
                        <FormField control={assignmentForm.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Title</FormLabel>
                                <FormControl><ShadcnInput {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={assignmentForm.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel>
                                <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={assignmentForm.control} name="max_score" render={({ field }) => (
                             <FormItem><FormLabel>Max Score</FormLabel>
                                <FormControl><ShadcnInput type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button type="submit" disabled={isCreatingAssignment}>
                            {isCreatingAssignment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Create Assignment
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

const AssignmentActionButtons: React.FC<{ assignment: AssignmentDetail; courseSlug: string; }> = ({ assignment, courseSlug }) => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const { mutate: deleteAssignment } = useMutation({
        mutationFn: (assignmentId: number) => 
            api.delete(`/manage-course/${courseSlug}/assignments/${assignmentId}/`),
        onSuccess: () => {
            toast.success("Assignment deleted.");
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
        },
        onError: () => toast.error("Failed to delete assignment."),
    });

    return (
        <div className="flex items-center space-x-2">
            <TooltipProvider>
                
                {/* 🟢 FIX 1: Use the controlled Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            {/* 🟢 The Button explicitly opens the Dialog */}
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => setIsDialogOpen(true)} // Manually open Dialog
                            >
                                <Edit size={14} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Assignment</TooltipContent>
                    </Tooltip>
                    
                    {/* 🟢 Pass the setter down */}
                    <AssignmentEditorDialog assignment={assignment} courseSlug={courseSlug} setOpen={setIsDialogOpen} />
                </Dialog>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => deleteAssignment(assignment.id)}><Trash2 size={14} /></Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Assignment</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
};

const AssignmentEditorDialog: React.FC<{ assignment: AssignmentDetail; courseSlug: string; setOpen: (open: boolean) => void }> = ({ assignment, courseSlug, setOpen }) => {
    const queryClient = useQueryClient();

    const editForm = useForm<AssignmentCreateValues>({
        resolver: zodResolver(AssignmentCreateSchema) as any,
        defaultValues: { 
            title: assignment.title, 
            description: assignment.description, 
            max_score: assignment.max_score,
            due_date: assignment.due_date,
        },
    });

    const { mutate: updateAssignment, isPending: isUpdatingAssignment } = useMutation({
        mutationFn: (data: AssignmentCreateValues) => 
            api.patch(`/manage-course/${courseSlug}/assignments/${assignment.id}/`, data),
        onSuccess: () => {
            toast.success("Assignment updated.");
            queryClient.invalidateQueries({ queryKey: ["courseManagement", courseSlug] });
            setOpen(false); // Close dialog on success
        },
        onError: () => toast.error("Failed to update assignment."),
    });

    const handleUpdateAssignment: SubmitHandler<AssignmentCreateValues> = (data) => {
        updateAssignment(data);
    };

    return (
        // 🟢 FIX 1: Return only DialogContent
        <DialogContent>
            <DialogHeader><DialogTitle>Edit Assignment: {assignment.title}</DialogTitle></DialogHeader>
            <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleUpdateAssignment)} className="space-y-4">
                    <FormField control={editForm.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Title</FormLabel>
                            <FormControl>
                                {/* 🟢 FIX 3: Ensure value is never null */}
                                <ShadcnInput {...field} value={field.value ?? ""} />
                            </FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={editForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel>
                            <FormControl>
                                {/* 🟢 FIX 3: Ensure value is never null */}
                                <Textarea {...field} value={field.value ?? ""} />
                            </FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={editForm.control} name="max_score" render={({ field }) => (
                        <FormItem><FormLabel>Max Score</FormLabel>
                            <FormControl><ShadcnInput type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <Button type="submit" disabled={isUpdatingAssignment}>
                        {isUpdatingAssignment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SaveIcon size={14} className="mr-2" />} Save Changes
                    </Button>
                </form>
            </Form>
        </DialogContent>
    );
};