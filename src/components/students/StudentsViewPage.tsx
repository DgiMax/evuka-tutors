"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Users,
  Loader2,
  AlertTriangle,
  MoreHorizontal,
  UserX,
  UserCheck,
  Trash2,
  CircleOff,
} from "lucide-react";
import { cn } from "@/lib/utils"; // Make sure you have this utility

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// NEW: Imports for the confirmation modal
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

// --- TYPE DEFINITIONS (Unchanged) ---
interface EnrolledUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}
interface StudentEnrollment {
  id: string; // Enrollment ID
  user: EnrolledUser;
  course_title: string;
  course_slug: string;
  organization_name: string | null;
  instructor_name: string;
  status: "active" | "dropped" | "completed";
  date_joined: string;
}
type StudentAction = "suspend" | "activate" | "remove";

// --- MAIN STUDENT PAGE COMPONENT ---
export default function StudentsViewPage() {
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { activeSlug } = useActiveOrg();

  // NEW: State for the confirmation modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [enrollmentToRemove, setEnrollmentToRemove] =
    useState<StudentEnrollment | null>(null);

  // --- Data Fetching (Unchanged) ---
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/students/");
      setStudents(response.data);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError("Could not load student data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [activeSlug, fetchStudents]);

  // --- Action Handler (Unchanged) ---
  const handleStudentAction = async (
    enrollmentId: string,
    action: StudentAction
  ) => {
    setIsSubmitting(enrollmentId);
    try {
      const response = await api.post(`/students/${enrollmentId}/manage/`, {
        action,
      });
      toast.success(response.data.message || "Action successful!");

      if (action === "remove") {
        setStudents((prev) => prev.filter((s) => s.id !== enrollmentId));
      } else {
        const newStatus = action === "suspend" ? "dropped" : "active";
        setStudents((prev) =>
          prev.map((s) =>
            s.id === enrollmentId ? { ...s, status: newStatus } : s
          )
        );
      }
    } catch (err: any) {
      console.error("Failed to manage student:", err);
      const message = err.response?.data?.error || "An error occurred.";
      toast.error("Action Failed", { description: message });
    } finally {
      setIsSubmitting(null);
    }
  };

  // --- NEW: Modal Handlers ---
  const openConfirmModal = (enrollment: StudentEnrollment) => {
    setEnrollmentToRemove(enrollment);
    setIsConfirmOpen(true);
  };

  const onConfirmRemove = () => {
    if (enrollmentToRemove) {
      handleStudentAction(enrollmentToRemove.id, "remove");
      setEnrollmentToRemove(null);
      setIsConfirmOpen(false);
    }
  };

  // --- Render Functions (Themed) ---

  const getStatusBadge = (status: StudentEnrollment["status"]) => {
    switch (status) {
      case "active":
        // Using green, as 'success' is not in the theme
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        );
      case "dropped":
        // 'destructive' is in the theme (red)
        return <Badge variant="destructive">Suspended</Badge>;
      case "completed":
        // Using blue, as 'info' is not in the theme
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Completed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderLoading = () => (
    <div className="flex justify-center items-center h-60">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2 text-muted-foreground">Loading students...</p>
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center h-60 text-destructive">
      <AlertTriangle className="h-8 w-8" />
      <p className="mt-2 font-medium">{error}</p>
      <Button onClick={fetchStudents} variant="outline" className="mt-4">
        Try Again
      </Button>
    </div>
  );

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-border rounded-lg bg-muted/50">
      <CircleOff className="h-8 w-8 text-muted-foreground" />
      <p className="mt-2 text-muted-foreground">
        No students found for this context.
      </p>
    </div>
  );

  // Reusable component for the actions dropdown
  const StudentActionsDropdown: React.FC<{
    enrollment: StudentEnrollment;
    isProcessing: boolean;
  }> = ({ enrollment, isProcessing }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isProcessing}
          className="h-8 w-8 bg-transparent hover:bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-muted-foreground hover:text-foreground"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {enrollment.status === "active" && (
          <DropdownMenuItem
            onClick={() => handleStudentAction(enrollment.id, "suspend")}
          >
            <UserX className="mr-2 h-4 w-4" /> Suspend
          </DropdownMenuItem>
        )}
        {enrollment.status === "dropped" && (
          <DropdownMenuItem
            onClick={() => handleStudentAction(enrollment.id, "activate")}
          >
            <UserCheck className="mr-2 h-4 w-4" /> Activate
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          // UPDATED: Uses theme destructive color and new modal
          className="text-destructive"
          onClick={() => openConfirmModal(enrollment)}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // --- NEW: Mobile Card List Component ---
  const MobileStudentList = () => (
    <div className="space-y-4 md:hidden">
      {students.map((enrollment) => {
        const isProcessing = isSubmitting === enrollment.id;
        return (
          <Card key={enrollment.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-foreground">
                  {enrollment.user.first_name} {enrollment.user.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {enrollment.user.email}
                </p>
              </div>
              {getStatusBadge(enrollment.status)}
            </div>
            <div className="flex justify-between items-end mt-4">
              <div className="text-sm">
                <p className="text-muted-foreground">
                  {enrollment.course_title}
                </p>
                {enrollment.organization_name && (
                  <Badge variant="outline" className="text-xs font-normal mt-1">
                    {enrollment.organization_name}
                  </Badge>
                )}
              </div>
              <StudentActionsDropdown
                enrollment={enrollment}
                isProcessing={isProcessing}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );

  // --- UPDATED: Desktop Table (now hidden on mobile) ---
  const renderTable = () => (
    <div className="border rounded-lg overflow-hidden hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Date Joined</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((enrollment) => {
            const isProcessing = isSubmitting === enrollment.id;
            return (
              <TableRow key={enrollment.id}>
                <TableCell className="font-medium">
                  <div className="text-foreground">
                    {enrollment.user.first_name} {enrollment.user.last_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {enrollment.user.email}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {enrollment.course_title}
                  </div>
                  {enrollment.organization_name && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {enrollment.organization_name}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(enrollment.date_joined), "dd MMM yyyy")}
                </TableCell>
                <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                <TableCell className="text-right">
                  <StudentActionsDropdown
                    enrollment={enrollment}
                    isProcessing={isProcessing}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <Card className="max-w-6xl mx-4 sm:mx-auto my-8 p-0">
        <CardHeader className="p-6">
          <CardTitle className="text-xl flex items-center gap-2">
            <Users size={20} />
            My Students
          </CardTitle>
          <CardDescription>
            View and manage students enrolled in your courses.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          {isLoading
            ? renderLoading()
            : error
            ? renderError()
            : students.length === 0
            ? renderEmpty()
            : (
              <>
                <MobileStudentList />
                {renderTable()}
              </>
            )
          }
        </CardContent>
      </Card>

      {/* --- NEW: Confirmation Modal --- */}
      <ConfirmDeleteModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onConfirmRemove}
        isLoading={!!isSubmitting}
        title="Remove Student"
        description={`Are you sure you want to remove ${
          enrollmentToRemove?.user.first_name || "this student"
        } from the course? This action cannot be undone.`}
      />
    </>
  );
}

// --- NEW: Local Confirmation Modal Component ---
// (You can move this to a shared file if you prefer)
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading: boolean;
}

function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading,
}: ConfirmDeleteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}