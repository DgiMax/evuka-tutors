"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";
import { useAuth } from "@/context/AuthContext";
import {
  Loader2,
  Plus,
  UserPlus,
  CalendarDays,
  ArrowRight,
  Video,
  Calendar,
  TrendingUp,
  AlertCircle,
  Inbox,
  Send,
  UserCheck,
  UserX,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// --- Types ---
interface DashboardData {
  context: string;
  metrics: {
    total_courses: number;
    active_tutors: number;
    active_students: number;
    total_revenue: number;
    upcoming_events_count: number;
    total_events: number;
  };
  upcoming_classes: Array<{
    id: number;
    title: string;
    course_title: string;
    date: string;
    start_time: string;
    jitsi_meeting_link: string;
  }>;
  upcoming_events: Array<{
    id: number;
    title: string;
    slug: string;
    start_time: string;
    banner_image: string | null;
    event_type: string;
  }>;
  best_performing_courses: Array<{
    id: number;
    title: string;
    slug: string;
    thumbnail: string | null;
    student_count: number;
    revenue: number;
  }>;
}

interface UserSummary {
  id: number;
  username: string;
  email: string;
  full_name?: string;
}
interface JoinRequest {
  id: number;
  user: UserSummary;
  message: string;
  created_at: string;
}
interface SentInvitation {
  id: number;
  invited_user: UserSummary;
  invited_by: UserSummary;
  role: string;
  status: string;
  created_at: string;
}
interface AuthOrg {
  organization_slug: string;
  role?: string;
}

export default function TutorDashboardClient() {
  const { activeSlug } = useActiveOrg();
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [sentInvitations, setSentInvitations] = useState<SentInvitation[]>([]);

  const createCourseHref = activeSlug
    ? `/${activeSlug}/create-course`
    : "/create-course";

  const createEventHref = activeSlug
    ? `/${activeSlug}/create-event`
    : "/create-event";

  const currentOrgMembership = currentUser?.organizations?.find(
    (org: AuthOrg) => org.organization_slug === activeSlug
  );
  const isAdmin =
    currentOrgMembership?.role === "admin" ||
    currentOrgMembership?.role === "owner";

  const getPath = (path: string) => (activeSlug ? `/${activeSlug}${path}` : path);

  const formatCurrency = (amount: number | string | undefined) => {
    const numericAmount =
      typeof amount === "string" ? parseFloat(amount) : Number(amount);
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }).format(numericAmount || 0);
  };

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setJoinRequests([]);
    setSentInvitations([]);

    try {
      const headers = activeSlug ? { "X-Organization-Slug": activeSlug } : {};

      // Fetch all data in parallel
      const [dashboardRes, requestsRes, invitesRes] = await Promise.all([
        // 1. Dashboard data (Corrected)
        api.get("/users/dashboard/tutor/", { headers }),

        // 2. Join requests (Corrected)
        isAdmin
          ? api.get("/organizations/api/join-requests/", { headers })
          : Promise.resolve(null),

        // 3. Sent invitations (Corrected)
        isAdmin
          ? api.get("/organizations/api/sent-invitations/", { headers })
          : Promise.resolve(null),
      ]);

      setData(dashboardRes.data);
      if (requestsRes) {
        setJoinRequests(requestsRes.data.results || requestsRes.data || []);
      }
      if (invitesRes) {
        setSentInvitations(invitesRes.data.results || invitesRes.data || []);
      }
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Failed to load dashboard data.");
      toast.error("Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [activeSlug, isAdmin]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- Handlers for Admin Actions (Corrected) ---
  const handleApproveRequest = async (id: number) => {
    try {
      await api.post(
        `/organizations/api/join-requests/${id}/approve/`, // Corrected
        {},
        { headers: { "X-Organization-Slug": activeSlug } }
      );
      toast.success("Request approved!");
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to approve request.");
    }
  };

  const handleRejectRequest = async (id: number) => {
    try {
      await api.post(
        `/organizations/api/join-requests/${id}/reject/`, // Corrected
        {},
        { headers: { "X-Organization-Slug": activeSlug } }
      );
      toast.success("Request rejected.");
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to reject request.");
    }
  };

  const handleRevokeInvitation = async (id: number) => {
    try {
      await api.post(
        `/organizations/api/sent-invitations/${id}/revoke/`, // Corrected
        {},
        { headers: { "X-Organization-Slug": activeSlug } }
      );
      toast.success("Invitation revoked.");
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to revoke invitation.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-gray-500">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p>{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* --- Header Actions --- */}
      <div className="mb-8 flex flex-wrap justify-end gap-3">
        <Button asChild variant="outline" className="bg-white">
          <Link href={createCourseHref} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Course
            </Link>
        </Button>

        {activeSlug && isAdmin && (
          <InviteDialog
            isOpen={isInviteOpen}
            onOpenChange={setIsInviteOpen}
            onSuccess={fetchDashboardData}
            activeSlug={activeSlug}
          />
        )}

        <Button asChild variant="outline" className="bg-white">
          <Link href={createEventHref} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Event
            </Link>
        </Button>
      </div>

      {/* --- Summary Section --- */}
      <div className="mb-10">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          {data?.context === "Personal Tutor View"
            ? "Personal Summary"
            : "Organization Summary"}
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Total Courses" value={data?.metrics.total_courses} />
          {(data?.metrics.active_tutors ?? 0) > 1 && (
            <MetricCard
              label="Active Tutors"
              value={data?.metrics.active_tutors}
            />
          )}
          <MetricCard
            label="Active Students"
            value={data?.metrics.active_students}
          />
          <MetricCard
            label="Total Revenue"
            value={formatCurrency(data?.metrics.total_revenue)}
          />
          <MetricCard
            label="Upcoming Events"
            value={data?.metrics.upcoming_events_count}
          />
        </div>
      </div>

      {/* --- NEW ADMIN REQUESTS/INVITATIONS SECTION --- */}
      {activeSlug && isAdmin && (
        <div className="mb-10">
          <DashboardRequestManager
            requests={joinRequests}
            invitations={sentInvitations}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
            onRevoke={handleRevokeInvitation}
          />
        </div>
      )}

      {/* --- Details Grid --- */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* 1. Upcoming Live Classes */}
        <DashboardCard
          icon={<Video className="h-5 w-5 text-blue-600" />}
          title="Upcoming Classes"
          viewAllLink={getPath("/live-classes")}
        >
          {data?.upcoming_classes?.length ? (
            <div className="divide-y divide-gray-100">
              {data.upcoming_classes.map((lesson) => {
                // --- 1. Create Date objects for comparison ---
                // Assumes lesson.date and lesson.start_time create a date in the user's local timezone
                const classStartTime = new Date(
                  `${lesson.date}T${lesson.start_time}`
                );
                const now = new Date();

                // --- 2. Define the "joinable" window ---
                const joinWindowStart = new Date(
                  classStartTime.getTime() - 10 * 60 * 1000 // 10 minutes *before* class
                );
                const joinWindowEnd = new Date(
                  classStartTime.getTime() + 60 * 60 * 1000 // 60 minutes *after* class
                );

                // Check if current time is within the window
                const isJoinable =
                  now >= joinWindowStart && now <= joinWindowEnd;
                
                // Check if class has already ended
                const hasEnded = now > joinWindowEnd;

                return (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {lesson.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {lesson.course_title} • {lesson.date} at{" "}
                        {lesson.start_time}
                      </p>
                    </div>

                    {/* --- 3. Conditionally render the button --- */}
                    {isJoinable ? (
                      <Button
                        asChild
                        size="sm"
                        variant="secondary"
                        className="h-8 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        <a
                          href={lesson.jitsi_meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Join
                        </a>
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        {hasEnded ? "Class has ended" : "Not started"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No upcoming classes scheduled." />
          )}
        </DashboardCard>

        {/* 2. Top Courses */}
        <DashboardCard
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          title="Top Performing Courses"
          viewAllLink={getPath("/courses")}
        >
          {data?.best_performing_courses?.length ? (
            <div className="divide-y divide-gray-100">
              {data.best_performing_courses.map((course) => (
                <div key={course.id} className="flex items-center gap-4 py-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-100">
                    {course.thumbnail && (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={getPath(`/courses/${course.slug}/manage`)}
                      className="block truncate font-medium text-gray-900 hover:underline"
                    >
                      {course.title}
                    </Link>
                    <div className="mt-1 flex gap-4 text-xs text-gray-500">
                      <span>👥 {course.student_count} students</span>
                      <span>💰 {formatCurrency(course.revenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No course performance data yet." />
          )}
        </DashboardCard>
      </div>
    </div>
  );
}

// --- NEW Request Manager Component ---
interface RequestManagerProps {
  requests: JoinRequest[];
  invitations: SentInvitation[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onRevoke: (id: number) => void;
}

function DashboardRequestManager({
  requests,
  invitations,
  onApprove,
  onReject,
  onRevoke,
}: RequestManagerProps) {
  if (requests.length === 0 && invitations.length === 0) {
    return null; // Don't show anything if both lists are empty
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <Tabs defaultValue="join-requests">
        <TabsList className="grid w-full grid-cols-2 border-b rounded-t-lg bg-gray-50/50">
          <TabsTrigger value="join-requests" className="relative">
            Join Requests
            {requests.length > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                {requests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent-invitations" className="relative">
            Sent Invitations
            {invitations.length > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                {invitations.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="join-requests" className="p-4">
          <RequestList
            requests={requests}
            onApprove={onApprove}
            onReject={onReject}
          />
        </TabsContent>
        <TabsContent value="sent-invitations" className="p-4">
          <InvitationList
            invitations={invitations}
            onRevoke={onRevoke}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestList({ requests, onApprove, onReject }: any) {
  if (requests.length === 0) {
    return <EmptyState message="No pending join requests." />;
  }
  return (
    <ul className="divide-y divide-gray-100">
      {requests.map((req: JoinRequest) => (
        <li
          key={req.id}
          className="py-3 flex flex-col sm:flex-row justify-between gap-3"
        >
          <div>
            <p className="font-medium text-gray-900">
              {req.user.full_name || req.user.username}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({req.user.email})
              </span>
            </p>
            {req.message && (
              <p className="text-sm text-gray-600 mt-1 border-l-2 border-gray-200 pl-2 italic">
                "{req.message}"
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="bg-white"
              onClick={() => onReject(req.id)}
            >
              <UserX className="h-4 w-4 mr-2" /> Reject
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onApprove(req.id)}
            >
              <UserCheck className="h-4 w-4 mr-2" /> Approve
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function InvitationList({ invitations, onRevoke }: any) {
  if (invitations.length === 0) {
    return <EmptyState message="No pending invitations." />;
  }
  return (
    <ul className="divide-y divide-gray-100">
      {invitations.map((inv: SentInvitation) => (
        <li
          key={inv.id}
          className="py-3 flex flex-col sm:flex-row justify-between gap-3"
        >
          <div>
            <p className="font-medium text-gray-900">
              {inv.invited_user.full_name || inv.invited_user.username}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({inv.invited_user.email})
              </span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Invited as <Badge variant="secondary">{inv.role}</Badge> by{" "}
              {inv.invited_by.full_name || inv.invited_by.username}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onRevoke(inv.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Revoke
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

// --- InviteDialog (Copied from OrgTeamClient) ---
interface InviteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  activeSlug: string | null;
}

function InviteDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  activeSlug,
}: InviteDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("tutor");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!activeSlug) {
      toast.error("No organization selected.");
      setIsSubmitting(false);
      return;
    }

    try {
      // ✅ Corrected: This path matches your organizations/urls.py
      await api.post(
        "/organizations/api/team/invite/",
        { email, role },
        {
          headers: { "X-Organization-Slug": activeSlug },
        }
      );
      toast.success("Invitation sent successfully!");
      onOpenChange(false);
      setEmail("");
      onSuccess(); // This will now call fetchDashboardData()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-white">
          <UserPlus className="mr-2 h-4 w-4" /> Invite Tutor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite New Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              User must already be registered on the platform.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tutor">Tutor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Invite
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Smaller UI Components (Unchanged) ---
function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p
        className="mt-2 truncate text-3xl font-bold text-gray-900"
        title={String(value)}
      >
        {value ?? "-"}
      </p>
    </div>
  );
}

function DashboardCard({
  icon,
  title,
  viewAllLink,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  viewAllLink: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm h-full">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          {icon}
          {title}
        </h3>
        <Link
          href={viewAllLink}
          className="group flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          View all{" "}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-gray-500 italic py-4 text-center">{message}</p>;
}