// src/components/tutor/dashboard/EnrollmentManagerTab.tsx

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Edit, Save, Inbox, User, Mail, Calendar } from "lucide-react";

import api from "@/lib/api/axios";
import { cn } from "@/lib/utils";
import {
  EnrollmentManager,
  UpdateEnrollmentSchema,
  UpdateEnrollmentValues,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface EnrollmentTabProps {
  courseSlug: string;
  enrollments: EnrollmentManager[];
}

const EmptyState: React.FC<{ message: string; }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg bg-muted/50 p-4">
    <Inbox className="h-8 w-8 text-muted-foreground" />
    <p className="text-muted-foreground mt-2 text-center text-sm">{message}</p>
  </div>
);

const EnrollmentManagerTab: React.FC<EnrollmentTabProps> = ({
  courseSlug,
  enrollments,
}) => {
  const queryClient = useQueryClient();
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentManager | null>(null);

  const { mutate: updateEnrollment, isPending } = useMutation({
    mutationFn: (data: UpdateEnrollmentValues & { id: number }) =>
      api.patch(`/manage-course/${courseSlug}/enrollments/${data.id}/`, data),
    onSuccess: (response) => {
      toast.success("Enrollment updated successfully.");
      queryClient.setQueryData<any>(
        ["courseManagement", courseSlug],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            enrollments: oldData.enrollments.map((e: any) =>
              e.id === response.data.id ? response.data : e
            ),
          };
        }
      );
      setSelectedEnrollment(null);
    },
    onError: () => toast.error("Failed to update enrollment."),
  });

  const statusOptions = [
    { id: "active", name: "Active" },
    { id: "dropped", name: "Dropped" },
    { id: "suspended", name: "Suspended" },
    { id: "completed", name: "Completed" },
  ];
  const roleOptions = [
    { id: "student", name: "Student" },
    { id: "teacher", name: "Teacher" },
    { id: "ta", name: "Teaching Assistant" },
  ];

  const roleMap: Record<string, string> = {
      student: "Student",
      teacher: "Teacher",
      ta: "Teaching Assistant"
  };

  const getStatusBadge = (status: string) => (
    <Badge variant="outline" className={cn("capitalize border-0", {
        "bg-green-100 text-green-800 hover:bg-green-200": status === "active",
        "bg-red-100 text-red-800 hover:bg-red-200": status === "dropped" || status === "suspended",
        "bg-blue-100 text-blue-800 hover:bg-blue-200": status === "completed",
    })}>
        {status}
    </Badge>
  );

  return (
    <Card className="p-0">
      <CardHeader className="p-6">
        <CardTitle>Enrolled Students ({enrollments.length})</CardTitle>
        <CardDescription>
          Manage student roles and enrollment status.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {enrollments.length === 0 ? (
          <EmptyState message="No students are enrolled in this course yet." />
        ) : (
          <>
            {/* --- Mobile View (Cards) --- */}
            <div className="space-y-4 md:hidden">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{enrollment.user_name}</span>
                    </div>
                    {getStatusBadge(enrollment.status)}
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" /> {enrollment.user_email}
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Joined: {new Date(enrollment.date_joined).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Role: {roleMap[enrollment.role]}</span>
                    <Dialog open={selectedEnrollment?.id === enrollment.id} onOpenChange={(open) => !open && setSelectedEnrollment(null)}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedEnrollment(enrollment)}>
                                <Edit size={14} className="mr-1" /> Edit
                            </Button>
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
                  </div>
                </Card>
              ))}
            </div>

            {/* --- Desktop View (Table) --- */}
            <div className="border rounded-lg overflow-hidden hidden md:block">
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
                      <TableCell className="text-muted-foreground">{enrollment.user_email}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{roleMap[enrollment.role]}</TableCell>
                      <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(enrollment.date_joined).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog open={selectedEnrollment?.id === enrollment.id} onOpenChange={(open) => !open && setSelectedEnrollment(null)}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="ghost" onClick={() => setSelectedEnrollment(enrollment)}>
                                    <Edit size={14} className="mr-1" /> Edit
                                </Button>
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
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
export default EnrollmentManagerTab;

// --- SUB-COMPONENT: Update Enrollment Dialog (Styled) ---
const UpdateEnrollmentDialog: React.FC<{
  enrollment: EnrollmentManager;
  roleOptions: any[];
  statusOptions: any[];
  updateEnrollment: any;
  isUpdating: boolean;
}> = ({ enrollment, roleOptions, statusOptions, updateEnrollment, isUpdating }) => {
  const enrollmentForm = useForm<UpdateEnrollmentValues>({
    resolver: zodResolver(UpdateEnrollmentSchema),
    defaultValues: {
      status: enrollment.status,
      role: enrollment.role,
    },
  });

  const handleUpdate: SubmitHandler<UpdateEnrollmentValues> = (data) => {
    updateEnrollment({ id: enrollment.id, ...data });
  };

  return (
    <DialogContent className="sm:max-w-md p-0 top-[10%] translate-y-0 max-h-[85vh] flex flex-col gap-0">
      
      {/* Gray Header */}
      <div className="p-4 border-b bg-muted/40 rounded-t-lg shrink-0">
        <DialogTitle>Update Enrollment</DialogTitle>
        <p className="text-sm text-muted-foreground mt-1">
            Student: <span className="font-medium text-foreground">{enrollment.user_name}</span>
        </p>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto min-h-0 p-6">
        <Form {...enrollmentForm}>
            <form id="enrollment-form" onSubmit={enrollmentForm.handleSubmit(handleUpdate)} className="space-y-4">
            <FormField
                control={enrollmentForm.control}
                name="role"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {roleOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={enrollmentForm.control}
                name="status"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {statusOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            </form>
        </Form>
      </div>

      {/* Gray Footer */}
      <div className="p-4 border-t bg-muted/40 rounded-b-lg flex justify-end shrink-0">
        <Button type="submit" form="enrollment-form" disabled={isUpdating} className="w-full sm:w-auto">
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
        </Button>
      </div>

    </DialogContent>
  );
};