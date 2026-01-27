"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";
import { toast } from "sonner";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Users,
  Loader2,
  AlertTriangle,
  MoreVertical,
  UserX,
  UserCheck,
  Trash2,
  TrendingUp,
  UserPlus,
  X,
  Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogHeader,
  DialogClose,
} from "@/components/ui/dialog";

interface StudentEnrollment {
  id: string;
  full_name: string;
  email: string;
  course_title: string;
  organization_name: string | null;
  status: string;
  progress_percent: number;
  date_joined: string;
}

const KPICard = ({ title, value, icon: Icon, colorClass }: any) => (
  <div className="rounded-md border border-border bg-card p-4 flex flex-col justify-between space-y-3 shadow-none h-full">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className={cn("p-1.5 rounded-md", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <div className="space-y-1">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">{value}</h2>
    </div>
  </div>
);

const StudentsSkeleton = () => (
  <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <Skeleton width={240} height={32} />
          <Skeleton width={320} height={20} />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={110} borderRadius={8} />
        ))}
      </div>
      <div className="rounded-md border border-border overflow-hidden">
        <div className="p-6 border-b bg-muted/10">
          <Skeleton width={150} height={24} />
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton circle width={40} height={40} />
              <div className="flex-1">
                <Skeleton width="60%" height={16} />
              </div>
              <div className="flex-1">
                <Skeleton width="40%" height={16} />
              </div>
              <Skeleton width={80} height={24} borderRadius={4} />
            </div>
          ))}
        </div>
      </div>
    </div>
  </SkeletonTheme>
);

export default function StudentsViewPage() {
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const { activeSlug } = useActiveOrg();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [enrollmentToRemove, setEnrollmentToRemove] = useState<StudentEnrollment | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/students/");
      setStudents(response.data.students);
      setStats(response.data.stats);
    } catch (err) {
      toast.error("Failed to load students");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeSlug, fetchData]);

  const handleAction = async (id: string, action: string) => {
    setIsSubmitting(id);
    try {
      const res = await api.post(`/students/${id}/manage/`, { action });
      toast.success(res.data.message);
      fetchData();
    } catch (err) {
      toast.error("Action failed");
    } finally {
      setIsSubmitting(null);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "active") return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-md px-2 shadow-none font-medium">Active</Badge>;
    if (s === "suspended") return <Badge className="bg-amber-50 text-amber-700 border-amber-100 rounded-md px-2 shadow-none font-medium">Suspended</Badge>;
    return <Badge className="bg-blue-50 text-blue-700 border-blue-100 rounded-md px-2 shadow-none font-medium">Completed</Badge>;
  };

  if (isLoading) return <StudentsSkeleton />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Student Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor progress and manage course access.</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Students" value={stats?.total || 0} icon={Users} colorClass="bg-muted" />
        <KPICard title="Active Now" value={stats?.active || 0} icon={UserPlus} colorClass="bg-emerald-50 text-emerald-600" />
        <KPICard title="Suspended" value={stats?.suspended || 0} icon={UserX} colorClass="bg-amber-50 text-amber-600" />
        <KPICard title="Graduated" value={stats?.completed || 0} icon={TrendingUp} colorClass="bg-blue-50 text-blue-600" />
      </div>

      <div className="rounded-md border border-border bg-card shadow-none overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/10">
          <h3 className="font-semibold text-base">Enrolled Students</h3>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-border hover:bg-muted/30">
                <TableHead className="pl-6 h-12 text-xs uppercase tracking-wider font-semibold">Student Details</TableHead>
                <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold">Course & Org</TableHead>
                <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-center">Progress</TableHead>
                <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                <TableHead className="pr-6 h-12 text-xs uppercase tracking-wider font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length > 0 ? (
                students.map((s) => (
                  <TableRow key={s.id} className="border-border hover:bg-muted/20 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <p className="font-medium text-foreground text-sm">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm font-medium">{s.course_title}</p>
                      {s.organization_name && <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{s.organization_name}</p>}
                    </TableCell>
                    <TableCell className="py-4 min-w-[140px]">
                      <div className="flex flex-col gap-1.5 px-4">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                          <span>{s.progress_percent}%</span>
                        </div>
                        <Progress value={s.progress_percent} className="h-1.5" indicatorClassName="bg-primary" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">{getStatusBadge(s.status)}</TableCell>
                    <TableCell className="pr-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-md shadow-none">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-md border-border shadow-none">
                          {s.status.toLowerCase() === "active" ? (
                            <DropdownMenuItem onClick={() => handleAction(s.id, "suspend")} className="text-sm cursor-pointer">
                              <UserX className="mr-2 h-4 w-4" /> Suspend Student
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleAction(s.id, "activate")} className="text-sm cursor-pointer">
                              <UserCheck className="mr-2 h-4 w-4" /> Restore Access
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => { setEnrollmentToRemove(s); setIsConfirmOpen(true); }}
                            className="text-sm text-red-600 focus:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Remove Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
                      <div className="p-4 border-2 border-dashed border-border rounded-full bg-muted/20">
                        <Inbox className="h-8 w-8 opacity-20" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">No students enrolled</p>
                        <p className="text-xs">Once students join your courses, they will appear here.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[440px] p-0 gap-0 border-border/80 rounded-md bg-background shadow-none overflow-hidden [&>button]:hidden">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30 flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <div className="p-2 bg-red-50 border border-red-100 rounded-md">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              Confirm Removal
            </DialogTitle>
            <DialogClose className="rounded-md p-1 hover:bg-muted transition-colors"><X className="h-4 w-4 text-muted-foreground" /></DialogClose>
          </DialogHeader>
          <div className="p-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-foreground">{enrollmentToRemove?.full_name}</span>? 
              This will revoke all course access and delete their enrollment record permanently.
            </p>
          </div>
          <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsConfirmOpen(false)} className="rounded-md h-9 shadow-none">Cancel</Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => { 
                if (enrollmentToRemove) handleAction(enrollmentToRemove.id, "remove"); 
                setIsConfirmOpen(false); 
              }} 
              className="rounded-md h-9 shadow-none"
            >
              Confirm Removal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}