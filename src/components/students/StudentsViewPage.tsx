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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// --- TYPE DEFINITIONS (from your serializers) ---

// From your Enrollment serializer with depth=1
interface EnrolledUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface StudentEnrollment {
  id: string; // This is the Enrollment ID
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
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null); // Stores ID of student being acted on
  const [error, setError] = useState<string | null>(null);

  const { activeSlug } = useActiveOrg();

  // --- Data Fetching ---
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // The API interceptor adds the context header automatically
      const response = await api.get("/students/");
      setStudents(response.data);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError("Could not load student data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on load and when context (activeSlug) changes
  useEffect(() => {
    fetchStudents();
  }, [activeSlug, fetchStudents]);

  // --- Action Handler ---
  const handleStudentAction = async (enrollmentId: string, action: StudentAction) => {
    setIsSubmitting(enrollmentId);
    try {
      const response = await api.post(`/students/${enrollmentId}/manage/`, { action });
      toast.success(response.data.message || "Action successful!");

      // Update state locally instead of re-fetching
      if (action === "remove") {
        setStudents(prev => prev.filter(s => s.id !== enrollmentId));
      } else {
        const newStatus = action === "suspend" ? "dropped" : "active";
        setStudents(prev =>
          prev.map(s =>
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

  // --- Render Functions ---

  const getStatusBadge = (status: StudentEnrollment["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600 text-white">Active</Badge>;
      case "dropped":
        return <Badge variant="destructive">Suspended</Badge>;
      case "completed":
        return <Badge className="bg-blue-600 text-white">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderLoading = () => (
    <div className="flex justify-center items-center h-60">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      <p className="ml-2 text-gray-500">Loading students...</p>
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center h-60 text-red-600">
      <AlertTriangle className="h-8 w-8" />
      <p className="mt-2 font-medium">{error}</p>
      <Button onClick={fetchStudents} variant="outline" className="mt-4">
        Try Again
      </Button>
    </div>
  );

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed rounded-lg bg-gray-50">
      <CircleOff className="h-8 w-8 text-gray-400" />
      <p className="mt-2 text-gray-500">No students found for this context.</p>
    </div>
  );

  const renderTable = () => (
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
                <div className="text-gray-900">
                  {enrollment.user.first_name} {enrollment.user.last_name}
                </div>
                <div className="text-xs text-gray-500">{enrollment.user.email}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{enrollment.course_title}</div>
                {enrollment.organization_name && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {enrollment.organization_name}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {format(new Date(enrollment.date_joined), "dd MMM yyyy")}
              </TableCell>
              <TableCell>
                {getStatusBadge(enrollment.status)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isProcessing}>
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
                      className="text-red-600"
                      onClick={() => {
                        if (confirm("Are you sure you want to remove this student? This action cannot be undone.")) {
                          handleStudentAction(enrollment.id, "remove");
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <Card className="max-w-6xl mx-auto my-8 border border-gray-200 rounded text-black shadow-none">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Users size={20} />
          My Students
        </CardTitle>
        <CardDescription>
          View and manage students enrolled in your courses.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading
          ? renderLoading()
          : error
          ? renderError()
          : students.length === 0
          ? renderEmpty()
          : renderTable()}
      </CardContent>
    </Card>
  );
}
