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
  MoreVertical, // Changed from MoreHorizontal
  UserX,
  UserCheck,
  Trash2,
  CircleOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// --- TYPE DEFINITIONS ---
interface EnrolledUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}
interface StudentEnrollment {
  id: string; 
  user: EnrolledUser;
  course_title: string;
  course_slug: string;
  organization_name: string | null;
  instructor_name: string;
  status: "active" | "dropped" | "completed";
  date_joined: string;
}
type StudentAction = "suspend" | "activate" | "remove";

// --- CONFIRMATION MODAL ---
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
      <DialogContent className="sm:max-w-md p-0 top-[15%] translate-y-0 gap-0">
        <div className="p-4 border-b bg-muted/40 rounded-t-lg flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
                <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">This action cannot be undone.</DialogDescription>
            </div>
        </div>
        <div className="p-6">
            <p className="text-sm text-foreground/80 leading-relaxed">
                {description}
            </p>
        </div>
        <div className="p-4 border-t bg-muted/40 rounded-b-lg flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="h-9">
                Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={isLoading} className="h-9">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Remove
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function StudentsViewPage() {
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { activeSlug } = useActiveOrg();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [enrollmentToRemove, setEnrollmentToRemove] = useState<StudentEnrollment | null>(null);

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

  const handleStudentAction = async (enrollmentId: string, action: StudentAction) => {
    setIsSubmitting(enrollmentId);
    try {
      const response = await api.post(`/students/${enrollmentId}/manage/`, { action });
      toast.success(response.data.message || "Action successful!");

      if (action === "remove") {
        setStudents((prev) => prev.filter((s) => s.id !== enrollmentId));
      } else {
        const newStatus = action === "suspend" ? "dropped" : "active";
        setStudents((prev) =>
          prev.map((s) => (s.id === enrollmentId ? { ...s, status: newStatus } : s))
        );
      }
    } catch (err: any) {
      console.error("Failed to manage student:", err);
      toast.error("Action Failed", { description: err.response?.data?.error || "An error occurred." });
    } finally {
      setIsSubmitting(null);
    }
  };

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

  const getStatusBadge = (status: StudentEnrollment["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0">Active</Badge>;
      case "dropped":
        return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-0">Suspended</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-0">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const StudentActionsDropdown: React.FC<{ enrollment: StudentEnrollment; isProcessing: boolean }> = ({ enrollment, isProcessing }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"  disabled={isProcessing} 
          className=" h-8 w-8 p-0 bg-transparent hover:bg-transparent active:bg-transparent focus-visible:ring-0 shadow-none border-0
        " 
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : (
            <MoreVertical className="h-5 w-5 text-muted-foreground transition-colors mx-auto" />
          )}
        </Button>

      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {enrollment.status === "active" && (
          <DropdownMenuItem onClick={() => handleStudentAction(enrollment.id, "suspend")}>
            <UserX className="mr-2 h-4 w-4" /> Suspend
          </DropdownMenuItem>
        )}
        {enrollment.status === "dropped" && (
          <DropdownMenuItem onClick={() => handleStudentAction(enrollment.id, "activate")}>
            <UserCheck className="mr-2 h-4 w-4" /> Activate
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openConfirmModal(enrollment)}>
          <Trash2 className="mr-2 h-4 w-4" /> Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // --- IMPROVED MOBILE CARD LIST ---
  const MobileStudentList = () => (
    <div className="space-y-4 md:hidden">
      {students.map((enrollment) => (
        <Card key={enrollment.id} className="p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <p className="font-semibold text-foreground text-base">
                {enrollment.user.first_name} {enrollment.user.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{enrollment.user.email}</p>
            </div>
            {/* Action button aligned top-right, stripped styling */}
            <StudentActionsDropdown enrollment={enrollment} isProcessing={isSubmitting === enrollment.id} />
          </div>
          
          {/* Course Info in the middle - Highlighted */}
          <div className="pt-3 border-t border-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Enrolled Course</p>
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">{enrollment.course_title}</span>
                {enrollment.organization_name && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal border-muted-foreground/30 text-muted-foreground">
                        {enrollment.organization_name}
                    </Badge>
                )}
            </div>
          </div>

          {/* Footer: Date & Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
                Joined: {format(new Date(enrollment.date_joined), "MMM d, yyyy")}
            </span>
            {getStatusBadge(enrollment.status)}
          </div>
        </Card>
      ))}
    </div>
  );

  // --- DESKTOP TABLE (Unchanged) ---
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
          {students.map((enrollment) => (
            <TableRow key={enrollment.id}>
              <TableCell>
                <div className="font-medium text-foreground">
                  {enrollment.user.first_name} {enrollment.user.last_name}
                </div>
                <div className="text-xs text-muted-foreground">{enrollment.user.email}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-foreground mb-1">{enrollment.course_title}</div>
                {enrollment.organization_name && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                    {enrollment.organization_name}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(enrollment.date_joined), "MMM d, yyyy")}
              </TableCell>
              <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
              <TableCell className="text-right">
                <StudentActionsDropdown enrollment={enrollment} isProcessing={isSubmitting === enrollment.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <Card className="max-w-6xl mx-4 sm:mx-auto my-8 p-0">
        <CardHeader className="p-6 bg-muted/10 border-b">
          <CardTitle className="text-xl flex items-center gap-2">
            <Users size={20} className="text-primary"/>
            My Students
          </CardTitle>
          <CardDescription>
            View and manage students enrolled in your courses.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading students...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 text-destructive">
              <AlertTriangle className="h-8 w-8" />
              <p className="mt-2 font-medium">{error}</p>
              <Button onClick={fetchStudents} variant="outline" className="mt-4">Try Again</Button>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg bg-muted/50">
              <CircleOff className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No students found for this context.</p>
            </div>
          ) : (
            <>
              <MobileStudentList />
              {renderTable()}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDeleteModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onConfirmRemove}
        isLoading={!!isSubmitting}
        title="Remove Student"
        description={`Are you sure you want to remove ${enrollmentToRemove?.user.first_name || "this student"} from the course? This action cannot be undone.`}
      />
    </>
  );
}