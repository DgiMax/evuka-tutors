"use client";

import React, { useEffect, useState, useCallback, ReactNode } from "react";
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

// --- Types (Unchanged) ---
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

// ====================================================================
// Main Dashboard Component (Refactored)
// ====================================================================
export default function TutorDashboardClient() {
  const { activeSlug } = useActiveOrg();
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [sentInvitations, setSentInvitations] = useState<SentInvitation[]>([]);

  // --- Logic & Data Fetching (Unchanged) ---
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
      const [dashboardRes, requestsRes, invitesRes] = await Promise.all([
        api.get("/users/dashboard/tutor/", { headers }),
        isAdmin
          ? api.get("/organizations/api/join-requests/", { headers })
          : Promise.resolve(null),
        isAdmin
          ? api.get("/organizations/api/sent-invitations/", { headers })
          : Promise.resolve(null),
      ]);
      setData(dashboardRes.data);
      if (requestsRes)
        setJoinRequests(requestsRes.data.results || requestsRes.data || []);
      if (invitesRes)
        setSentInvitations(invitesRes.data.results || invitesRes.data || []);
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

  // --- Admin Handlers (Unchanged) ---
  const handleApproveRequest = async (id: number) => {
    try {
      await api.post(
        `/organizations/api/join-requests/${id}/approve/`,
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
        `/organizations/api/join-requests/${id}/reject/`,
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
        `/organizations/api/sent-invitations/${id}/revoke/`,
        {},
        { headers: { "X-Organization-Slug": activeSlug } }
      );
      toast.success("Invitation revoked.");
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to revoke invitation.");
    }
  };

  // --- Loading & Error States (Refactored) ---
  if (isLoading) {
    return <DashboardLoading />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={fetchDashboardData} />;
  }

  // --- Main Render (Refactored) ---
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* 1. Header Buttons */}
      <DashboardHeader
        createCourseHref={createCourseHref}
        createEventHref={createEventHref}
        activeSlug={activeSlug}
        isAdmin={isAdmin}
        isInviteOpen={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        onSuccess={fetchDashboardData}
      />

      {/* 2. Summary Metrics */}
      <MetricsGrid
        context={data?.context}
        metrics={data?.metrics}
        formatCurrency={formatCurrency}
      />

      {/* 3. Admin Request Manager */}
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

      {/* 4. Details Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <UpcomingClassesCard
          classes={data?.upcoming_classes}
          getPath={getPath}
        />
        <TopCoursesCard
          courses={data?.best_performing_courses}
          getPath={getPath}
          formatCurrency={formatCurrency}
        />
      </div>
    </div>
  );
}

// ====================================================================
// Refactored: Loading & Error Components
// ====================================================================
function DashboardLoading() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      {/* STYLED: Uses theme primary color (Purple) */}
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function DashboardError({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
      {/* STYLED: Uses theme destructive color (Red) and muted text */}
      <AlertCircle className="h-12 w-12 text-destructive" />
      <p className="text-muted-foreground">{error}</p>
      <Button variant="outline" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}

// ====================================================================
// Refactored: Dashboard Header
// ====================================================================
function DashboardHeader({
  createCourseHref,
  createEventHref,
  activeSlug,
  isAdmin,
  isInviteOpen,
  onOpenChange,
  onSuccess,
}: {
  createCourseHref: string;
  createEventHref: string;
  activeSlug: string | null;
  isAdmin: boolean;
  isInviteOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  return (
    <div className="mb-8 flex flex-wrap justify-end gap-3">
      {/* STYLED: Removed 'bg-white' as 'outline' handles this */}
      <Button asChild variant="outline">
        <Link href={createCourseHref} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Course
        </Link>
      </Button>

      {activeSlug && isAdmin && (
        <InviteDialog
          isOpen={isInviteOpen}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
          activeSlug={activeSlug}
        />
      )}

      {/* STYLED: Removed 'bg-white' */}
      <Button asChild variant="outline">
        <Link href={createEventHref} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Event
        </Link>
      </Button>
    </div>
  );
}

// ====================================================================
// Refactored: Metrics Grid
// ====================================================================
function MetricsGrid({ metrics, context, formatCurrency }: any) {
  return (
    <div className="mb-10">
      {/* STYLED: Uses theme foreground color (Dark Text) */}
      <h2 className="mb-6 text-xl font-semibold text-foreground">
        {context === "Personal Tutor View"
          ? "Personal Summary"
          : "Organization Summary"}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Total Courses" value={metrics?.total_courses} />
        {(metrics?.active_tutors ?? 0) > 1 && (
          <MetricCard label="Active Tutors" value={metrics?.active_tutors} />
        )}
        <MetricCard label="Active Students" value={metrics?.active_students} />
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(metrics?.total_revenue)}
        />
        <MetricCard
          label="Upcoming Events"
          value={metrics?.upcoming_events_count}
        />
      </div>
    </div>
  );
}

// ====================================================================
// Refactored: Upcoming Classes
// ====================================================================
function UpcomingClassesCard({ classes, getPath }: any) {
  return (
    <DashboardCard
      // STYLED: Uses theme secondary color (Teal)
      icon={<Video className="h-5 w-5 text-secondary" />}
      title="Upcoming Classes"
      viewAllLink={getPath("/live-classes")}
    >
      {classes?.length ? (
        // STYLED: Uses theme border
        <div className="divide-y divide-border">
          {classes.map((lesson: any) => {
            const classStartTime = new Date(
              `${lesson.date}T${lesson.start_time}`
            );
            const now = new Date();
            const joinWindowStart = new Date(
              classStartTime.getTime() - 10 * 60 * 1000
            );
            const joinWindowEnd = new Date(
              classStartTime.getTime() + 60 * 60 * 1000
            );
            const isJoinable = now >= joinWindowStart && now <= joinWindowEnd;
            const hasEnded = now > joinWindowEnd;

            return (
              <div
                key={lesson.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  {/* STYLED: Uses card foreground & muted text */}
                  <p className="font-medium text-card-foreground">
                    {lesson.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lesson.course_title} • {lesson.date} at {lesson.start_time}
                  </p>
                </div>

                {isJoinable ? (
                  <Button
                    asChild
                    size="sm"
                    variant="secondary" // STYLED: This now uses your Teal theme color
                    className="h-8"
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
                  // STYLED: Uses muted text
                  <span className="text-xs text-muted-foreground/80 italic">
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
  );
}

// ====================================================================
// Refactored: Top Courses
// ====================================================================
function TopCoursesCard({ courses, getPath, formatCurrency }: any) {
  return (
    <DashboardCard
      // STYLED: Uses a standard green (theme doesn't have 'success' yet)
      icon={<TrendingUp className="h-5 w-5 text-green-600" />}
      title="Top Performing Courses"
      viewAllLink={getPath("/courses")}
    >
      {courses?.length ? (
        // STYLED: Uses theme border
        <div className="divide-y divide-border">
          {courses.map((course: any) => (
            <div key={course.id} className="flex items-center gap-4 py-3">
              {/* STYLED: Uses theme muted bg */}
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                {course.thumbnail && (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {/* STYLED: Uses card foreground */}
                <Link
                  href={getPath(`/courses/${course.slug}/manage`)}
                  className="block truncate font-medium text-card-foreground hover:underline"
                >
                  {course.title}
                </Link>
                {/* STYLED: Uses muted text */}
                <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
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
  );
}

// ====================================================================
// Child Components (Styling Updated)
// ====================================================================

// --- Request Manager Component ---
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
    return null;
  }

  return (
    // STYLED: Uses theme card and border
    <div className="bg-card rounded-lg border shadow-sm">
      <Tabs defaultValue="join-requests">
        {/* STYLED: Uses theme muted bg and border */}
        <TabsList className="grid w-full grid-cols-2 border-b rounded-t-lg bg-muted/50">
          <TabsTrigger value="join-requests" className="relative">
            Join Requests
            {requests.length > 0 && (
              // STYLED: Uses theme primary (Purple)
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {requests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent-invitations" className="relative">
            Sent Invitations
            {invitations.length > 0 && (
              // STYLED: Uses theme primary (Purple)
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
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
          <InvitationList invitations={invitations} onRevoke={onRevoke} />
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
    // STYLED: Uses theme border
    <ul className="divide-y divide-border">
      {requests.map((req: JoinRequest) => (
        <li
          key={req.id}
          className="py-3 flex flex-col sm:flex-row justify-between gap-3"
        >
          <div>
            {/* STYLED: Uses theme card text and muted text */}
            <p className="font-medium text-card-foreground">
              {req.user.full_name || req.user.username}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({req.user.email})
              </span>
            </p>
            {req.message && (
              // STYLED: Uses theme border and muted text
              <p className="text-sm text-muted-foreground mt-1 border-l-2 border-border pl-2 italic">
                "{req.message}"
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {/* STYLED: Button 'outline' is already themed */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(req.id)}
            >
              <UserX className="h-4 w-4 mr-2" /> Reject
            </Button>
            <Button
              size="sm"
              // STYLED: Using green as 'success'
              className="bg-green-600 text-white hover:bg-green-700"
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
    // STYLED: Uses theme border
    <ul className="divide-y divide-border">
      {invitations.map((inv: SentInvitation) => (
        <li
          key={inv.id}
          className="py-3 flex flex-col sm:flex-row justify-between gap-3"
        >
          <div>
            {/* STYLED: Uses theme card text and muted text */}
            <p className="font-medium text-card-foreground">
              {inv.invited_user.full_name || inv.invited_user.username}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({inv.invited_user.email})
              </span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Invited as{" "}
              {/* STYLED: Using 'muted' badge as 'secondary' is now Teal */}
              <Badge variant="secondary">{inv.role}</Badge> by{" "}
              {inv.invited_by.full_name || inv.invited_by.username}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {/* STYLED: Button 'destructive' is already themed (Red) */}
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
      await api.post(
        "/organizations/api/team/invite/",
        { email, role },
        { headers: { "X-Organization-Slug": activeSlug } }
      );
      toast.success("Invitation sent successfully!");
      onOpenChange(false);
      setEmail("");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {/* STYLED: Button 'outline' is themed, removed 'bg-white' */}
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" /> Invite Tutor
        </Button>
      </DialogTrigger>
      {/* STYLED: Dialog components from shadcn/ui will automatically use theme */}
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
            {/* STYLED: Uses muted text */}
            <p className="text-xs text-muted-foreground">
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
            {/* STYLED: Default button is 'primary' (Purple) */}
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

// --- Smaller UI Components (Styling Updated) ---
function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) {
  return (
    // STYLED: Uses theme card, border
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      {/* STYLED: Uses muted text and card text */}
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className="mt-2 truncate text-3xl font-bold text-foreground"
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
  icon: ReactNode;
  title: string;
  viewAllLink: string;
  children: ReactNode;
}) {
  return (
    // STYLED: Uses theme card, border
    <div className="rounded-lg border bg-card p-6 shadow-sm h-full">
      <div className="mb-6 flex items-center justify-between">
        {/* STYLED: Uses theme foreground text */}
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          {icon}
          {title}
        </h3>
        {/* STYLED: Uses theme primary color (Purple) */}
        <Link
          href={viewAllLink}
          className="group flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
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
  // STYLED: Uses theme muted text
  return (
    <p className="text-sm text-muted-foreground italic py-4 text-center">
      {message}
    </p>
  );
}