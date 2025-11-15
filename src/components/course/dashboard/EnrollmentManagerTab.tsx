// src/components/tutor/dashboard/EnrollmentManagerTab.tsx

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Users, Loader2, Edit, Save, Inbox } from "lucide-react";

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
import Link from "next/link"; // Import Link

interface EnrollmentTabProps {
  courseSlug: string;
  enrollments: EnrollmentManager[];
}

// --- Utility Components (Themed) ---
const LoaderState: React.FC = () => (
  <div className="flex justify-center items-center h-[300px] bg-card rounded-lg border border-border">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="ml-2 text-muted-foreground">Loading enrollments...</p>
  </div>
);

// NEW: Reusable Empty State component (themed)
const EmptyState: React.FC<{ message: string; }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg bg-muted/50 p-4">
    <Inbox className="h-8 w-8 text-muted-foreground" />
    <p className="text-muted-foreground mt-2 text-center">{message}</p>
    {/* You can add a link here if needed */}
  </div>
);

const EnrollmentManagerTab: React.FC<EnrollmentTabProps> = ({
  courseSlug,
  enrollments,
}) => {
  const queryClient = useQueryClient();
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<EnrollmentManager | null>(null);

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

  const statusMap: Record<EnrollmentManager["status"], string> =
    statusOptions.reduce(
      (acc, opt) => ({ ...acc, [opt.id]: opt.name }),
      {} as Record<EnrollmentManager["status"], string>
    );
  const roleMap: Record<EnrollmentManager["role"], string> = roleOptions.reduce(
    (acc, opt) => ({ ...acc, [opt.id]: opt.name }),
    {} as Record<EnrollmentManager["role"], string>
  );

  // Reusable function to render the 'Edit' dialog trigger
  const renderEditDialog = (enrollment: EnrollmentManager) => (
    <Dialog
      open={selectedEnrollment?.id === enrollment.id}
      onOpenChange={(open) => !open && setSelectedEnrollment(null)}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedEnrollment(enrollment)}
        >
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
  );

  // Reusable function to render the status badge
  const renderStatusBadge = (status: EnrollmentManager["status"]) => (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
        {
          "bg-green-100 text-green-800": status === "active",
          "bg-red-100 text-red-800":
            status === "dropped" || status === "suspended",
          "bg-blue-100 text-blue-800": status === "completed",
        }
      )}
    >
      {statusMap[status]}
    </span>
  );

  return (
    // UPDATED: Card uses theme colors and flush padding
    <Card className="p-0">
      <CardHeader className="p-6">
        <CardTitle>Enrolled Students ({enrollments.length})</CardTitle>
        <CardDescription>
          Manage student roles and enrollment status.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {enrollments.length === 0 ? (
          // UPDATED: Using new EmptyState component
          <EmptyState message="No students are enrolled in this course yet." />
        ) : (
          <>
            {/* --- NEW: Mobile Card List (Visible on mobile) --- */}
            <div className="space-y-4 md:hidden">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-foreground">
                        {enrollment.user_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {enrollment.user_email}
                      </p>
                    </div>
                    {renderStatusBadge(enrollment.status)}
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Role: </span>
                      <span className="font-medium text-foreground capitalize">
                        {roleMap[enrollment.role]}
                      </span>
                    </div>
                    {renderEditDialog(enrollment)}
                  </div>
                </Card>
              ))}
            </div>

            {/* --- UPDATED: Desktop Table (Hidden on mobile) --- */}
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
                      <TableCell className="font-medium text-foreground">
                        {enrollment.user_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {enrollment.user_email}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {roleMap[enrollment.role]}
                      </TableCell>
                      <TableCell>
                        {renderStatusBadge(enrollment.status)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(enrollment.date_joined).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderEditDialog(enrollment)}
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

// --- SUB-COMPONENT: Update Enrollment Dialog (Themed) ---
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
    // DialogContent will use theme bg-card
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Update Enrollment for {enrollment.user_name}</DialogTitle>
      </DialogHeader>
      <Form {...enrollmentForm}>
        <form
          onSubmit={enrollmentForm.handleSubmit(handleUpdate)}
          className="space-y-4"
        >
          <FormField
            control={enrollmentForm.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roleOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.name}
                      </SelectItem>
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* UPDATED: Button will use theme primary color (purple) */}
          <Button type="submit" disabled={isUpdating} className="w-full">
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}{" "}
            Save Changes
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
};