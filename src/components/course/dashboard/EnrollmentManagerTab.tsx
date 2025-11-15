// src/components/tutor/dashboard/EnrollmentManagerTab.tsx

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Users, Loader2, Edit, Save } from "lucide-react";

import api from "@/lib/api/axios";
import { cn } from "@/lib/utils";
import { EnrollmentManager, UpdateEnrollmentSchema, UpdateEnrollmentValues } from "./SharedTypes";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormItem, FormLabel, FormMessage, FormField } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface EnrollmentTabProps {
  courseSlug: string;
  enrollments: EnrollmentManager[];
}

// Utility component for loading state
const LoaderState: React.FC = () => (
    <div className="flex justify-center items-center h-[300px] bg-white rounded-lg border">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      <p className="ml-2 text-gray-500">Loading enrollments...</p>
    </div>
);


const EnrollmentManagerTab: React.FC<EnrollmentTabProps> = ({ courseSlug, enrollments }) => {
    const queryClient = useQueryClient();
    const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentManager | null>(null);

    const { mutate: updateEnrollment, isPending } = useMutation({
        mutationFn: (data: UpdateEnrollmentValues & { id: number }) => 
            api.patch(`/manage-course/${courseSlug}/enrollments/${data.id}/`, data),
        onSuccess: (response) => {
            toast.success("Enrollment updated successfully.");
            // Update cache directly to avoid full dashboard refetch
            queryClient.setQueryData<any>(["courseManagement", courseSlug], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    enrollments: oldData.enrollments.map((e: any) => e.id === response.data.id ? response.data : e)
                };
            });
            setSelectedEnrollment(null);
        },
        onError: () => toast.error("Failed to update enrollment."),
    });

    const statusOptions = [{ id: 'active', name: 'Active' }, { id: 'dropped', name: 'Dropped' }, { id: 'suspended', name: 'Suspended' }, { id: 'completed', name: 'Completed' }];
    const roleOptions = [{ id: 'student', name: 'Student' }, { id: 'teacher', name: 'Teacher' }, { id: 'ta', name: 'Teaching Assistant' }];
    
    // Convert status and role options for display
    const statusMap: Record<EnrollmentManager['status'], string> = statusOptions.reduce((acc, opt) => ({ ...acc, [opt.id]: opt.name }), {} as Record<EnrollmentManager['status'], string>);
    const roleMap: Record<EnrollmentManager['role'], string> = roleOptions.reduce((acc, opt) => ({ ...acc, [opt.id]: opt.name }), {} as Record<EnrollmentManager['role'], string>);
    
    return (
        <Card>
            <CardHeader><CardTitle>Enrolled Students ({enrollments.length})</CardTitle>
                <CardDescription>Manage student roles and enrollment status.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {enrollments.map((enrollment) => (
                            <TableRow key={enrollment.id}>
                                <TableCell className="font-medium">{enrollment.user_name}</TableCell>
                                <TableCell>{enrollment.user_email}</TableCell>
                                <TableCell className="capitalize">{roleMap[enrollment.role]}</TableCell>
                                <TableCell>
                                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", {
                                        "bg-green-100 text-green-800": enrollment.status === "active",
                                        "bg-red-100 text-red-800": enrollment.status === "dropped" || enrollment.status === "suspended",
                                        "bg-blue-100 text-blue-800": enrollment.status === "completed",
                                    })}>{statusMap[enrollment.status]}</span>
                                </TableCell>
                                <TableCell>{new Date(enrollment.date_joined).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <Dialog open={selectedEnrollment?.id === enrollment.id} onOpenChange={(open) => !open && setSelectedEnrollment(null)}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="outline" onClick={() => setSelectedEnrollment(enrollment)}><Edit size={14} className="mr-1" /> Edit</Button>
                                        </DialogTrigger>
                                        {selectedEnrollment && selectedEnrollment.id === enrollment.id && (
                                            <UpdateEnrollmentDialog
                                                enrollment={selectedEnrollment}
                                                roleOptions={roleOptions}
                                                statusOptions={statusOptions}
                                                updateEnrollment={updateEnrollment}
                                                isUpdating={isPending}
                                            />
                                        )}
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
export default EnrollmentManagerTab;


// SUB-COMPONENT: Update Enrollment Dialog
const UpdateEnrollmentDialog: React.FC<{ enrollment: EnrollmentManager; roleOptions: any[]; statusOptions: any[]; updateEnrollment: any; isUpdating: boolean }> = ({ enrollment, roleOptions, statusOptions, updateEnrollment, isUpdating }) => {
    const enrollmentForm = useForm<UpdateEnrollmentValues>({
        resolver: zodResolver(UpdateEnrollmentSchema),
        defaultValues: { status: enrollment.status, role: enrollment.role },
    });

    const handleUpdate: SubmitHandler<UpdateEnrollmentValues> = (data) => {
        updateEnrollment({ id: enrollment.id, ...data });
    };

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Update Enrollment for {enrollment.user_name}</DialogTitle></DialogHeader>
            <Form {...enrollmentForm}>
                <form onSubmit={enrollmentForm.handleSubmit(handleUpdate)} className="space-y-4">
                    <FormField control={enrollmentForm.control} name="role" render={({ field }) => (
                        <FormItem><FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}><FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl><SelectContent>
                                {roleOptions.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>)}
                            </SelectContent></Select><FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={enrollmentForm.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}><FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl><SelectContent>
                                {statusOptions.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>)}
                            </SelectContent></Select><FormMessage />
                        </FormItem>
                    )} />
                    <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save Changes
                    </Button>
                </form>
            </Form>
        </DialogContent>
    );
};