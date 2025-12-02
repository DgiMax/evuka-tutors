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
  Video,
  TrendingUp,
  AlertCircle,
  ArrowRight,
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
  best_performing_courses: Array<{
    id: number;
    title: string;
    slug: string;
    thumbnail: string | null;
    student_count: number;
    revenue: number;
   }>;
}

interface JoinRequest {
  id: number;
  user: { id: number; username: string; email: string; full_name?: string };
  message: string;
  created_at: string;
}

interface SentInvitation {
  id: number;
  invited_user: { id: number; username: string; email: string; full_name?: string };
  invited_by: { id: number; username: string; email: string; full_name?: string };
  role: string;
  status: string;
  created_at: string;
}

// ====================================================================
// Main Dashboard Component
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

  // 1. Determine Role Safely
  const currentOrgMembership = currentUser?.organizations?.find(
    (org: any) => org.organization_slug === activeSlug
  );

  const isAdmin =
    currentOrgMembership?.role === "admin" ||
    currentOrgMembership?.role === "owner";

  // 2. Data Fetching (FIXED: Uses allSettled to prevent crashes)
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    // Don't clear data immediately to prevent flashing, just clear admin lists
    setJoinRequests([]);
    setSentInvitations([]);

    try {
      const headers = activeSlug ? { "X-Organization-Slug": activeSlug } : {};

      // ✅ FIX: Use allSettled. If Admin endpoints fail (403), Dashboard still loads.
      const results = await Promise.allSettled([
        api.get("/users/dashboard/tutor/", { headers }), // [0] Main Data
        isAdmin ? api.get("/organizations/join-requests/", { headers }) : Promise.resolve(null), // [1] Requests
        isAdmin ? api.get("/organizations/sent-invitations/", { headers }) : Promise.resolve(null), // [2] Invites
      ]);

      // Handle Main Dashboard Data
      if (results[0].status === "fulfilled") {
        setData(results[0].value.data);
      } else {
        throw new Error("Failed to load dashboard metrics");
      }

      // Handle Requests (Fail silently if 403)
      if (results[1].status === "fulfilled" && results[1].value) {
        setJoinRequests(results[1].value.data.results || results[1].value.data || []);
      }

      // Handle Invites (Fail silently if 403)
      if (results[2].status === "fulfilled" && results[2].value) {
        setSentInvitations(results[2].value.data.results || results[2].value.data || []);
      }

    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [activeSlug, isAdmin]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- Helpers ---
  const formatCurrency = (amount: number | string | undefined) => {
    const val = typeof amount === "string" ? parseFloat(amount) : Number(amount);
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(val || 0);
  };
  
  const getPath = (path: string) => (activeSlug ? `/${activeSlug}${path}` : path);

  const createCourseHref = activeSlug ? `/${activeSlug}/create-course` : "/create-course";
  const createEventHref = activeSlug ? `/${activeSlug}/create-event` : "/create-event";

  // --- Handlers ---
  const handleApproveRequest = async (id: number) => {
    try {
      await api.post(`/organizations/join-requests/${id}/approve/`, {}, { headers: { "X-Organization-Slug": activeSlug } });
      toast.success("Request approved!");
      fetchDashboardData();
    } catch { toast.error("Failed to approve."); }
  };
  const handleRejectRequest = async (id: number) => {
    try {
      await api.post(`/organizations/join-requests/${id}/reject/`, {}, { headers: { "X-Organization-Slug": activeSlug } });
      toast.success("Rejected.");
      fetchDashboardData();
    } catch { toast.error("Failed to reject."); }
  };
  const handleRevokeInvitation = async (id: number) => {
    try {
      await api.post(`/organizations/sent-invitations/${id}/revoke/`, {}, { headers: { "X-Organization-Slug": activeSlug } });
      toast.success("Revoked.");
      fetchDashboardData();
    } catch { toast.error("Failed to revoke."); }
  };

  // --- Render ---
  if (isLoading && !data) return <DashboardLoading />;
  if (error && !data) return <DashboardError error={error} onRetry={fetchDashboardData} />;

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <DashboardHeader
        createCourseHref={createCourseHref}
        createEventHref={createEventHref}
        activeSlug={activeSlug}
        isAdmin={isAdmin}
        isInviteOpen={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        onSuccess={fetchDashboardData}
      />

      {/* Metrics */}
      <MetricsGrid
        context={data?.context}
        metrics={data?.metrics}
        formatCurrency={formatCurrency}
      />

      {/* Admin Section (Only renders if data exists) */}
      {activeSlug && isAdmin && (joinRequests.length > 0 || sentInvitations.length > 0) && (
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

      {/* Lists */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <UpcomingClassesCard classes={data?.upcoming_classes} getPath={getPath} />
        <TopCoursesCard courses={data?.best_performing_courses} getPath={getPath} formatCurrency={formatCurrency} />
      </div>
    </div>
  );
}

// --- Sub Components (Unchanged logic, just ensure they are present) ---

function DashboardLoading() {
  return <div className="flex h-[50vh] w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
}

function DashboardError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <p className="text-muted-foreground">{error}</p>
      <Button variant="outline" onClick={onRetry}>Try Again</Button>
    </div>
  );
}

function DashboardHeader({ createCourseHref, createEventHref, activeSlug, isAdmin, isInviteOpen, onOpenChange, onSuccess }: any) {
  return (
    <div className="mb-8 flex flex-wrap justify-end gap-3">
      <Button asChild variant="outline">
        <Link href={createCourseHref} className="flex items-center gap-2"><Plus className="h-4 w-4" /> New Course</Link>
      </Button>
      {activeSlug && isAdmin && (
        <InviteDialog isOpen={isInviteOpen} onOpenChange={onOpenChange} onSuccess={onSuccess} activeSlug={activeSlug} />
      )}
      <Button asChild variant="outline">
        <Link href={createEventHref} className="flex items-center gap-2"><Plus className="h-4 w-4" /> New Event</Link>
      </Button>
    </div>
  );
}

function MetricsGrid({ metrics, context, formatCurrency }: any) {
  return (
    <div className="mb-10">
      <h2 className="mb-6 text-xl font-semibold text-foreground">
        {context === "Personal Tutor View" ? "Personal Summary" : "Organization Summary"}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Total Courses" value={metrics?.total_courses} />
        {(metrics?.active_tutors ?? 0) > 1 && <MetricCard label="Active Tutors" value={metrics?.active_tutors} />}
        <MetricCard label="Active Students" value={metrics?.active_students} />
        <MetricCard label="Total Revenue" value={formatCurrency(metrics?.total_revenue)} />
        <MetricCard label="Upcoming Events" value={metrics?.upcoming_events_count} />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: any) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 truncate text-3xl font-bold text-foreground">{value ?? "-"}</p>
    </div>
  );
}

// ... Keep your existing UpcomingClassesCard, TopCoursesCard, RequestManager, InviteDialog ...
// (I am omitting them here for brevity as they were correct in your snippet)

function UpcomingClassesCard({ classes, getPath }: any) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm h-full">
        <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold"><Video className="h-5 w-5 text-teal-600"/> Upcoming Classes</h3>
            <Link href={getPath("/live-classes")} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="h-4 w-4"/></Link>
        </div>
        {classes?.length ? (
            <div className="divide-y divide-border">
                {classes.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium">{c.title}</p>
                            <p className="text-xs text-muted-foreground">{c.course_title} • {c.date} {c.start_time}</p>
                        </div>
                        <Button asChild size="sm" variant="secondary" className="h-8"><a href={c.jitsi_meeting_link} target="_blank">Join</a></Button>
                    </div>
                ))}
            </div>
        ) : <p className="text-sm text-muted-foreground italic text-center py-4">No upcoming classes.</p>}
    </div>
  );
}

function TopCoursesCard({ courses, getPath, formatCurrency }: any) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm h-full">
         <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold"><TrendingUp className="h-5 w-5 text-green-600"/> Top Courses</h3>
            <Link href={getPath("/courses")} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="h-4 w-4"/></Link>
        </div>
        {courses?.length ? (
            <div className="divide-y divide-border">
                {courses.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-4 py-3">
                        <div className="h-10 w-10 bg-muted rounded overflow-hidden">
                             {c.thumbnail && <img src={c.thumbnail} className="h-full w-full object-cover"/>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <Link href={getPath(`/courses/${c.slug}`)} className="block truncate font-medium hover:underline">{c.title}</Link>
                            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                <span>👥 {c.student_count}</span>
                                <span>💰 {formatCurrency(c.revenue)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : <p className="text-sm text-muted-foreground italic text-center py-4">No data yet.</p>}
    </div>
  );
}

// ... Keep DashboardRequestManager, RequestList, InvitationList, InviteDialog as you provided ...
// Ensure DashboardRequestManager is properly defined or imported if in separate file.
interface RequestManagerProps { requests: JoinRequest[]; invitations: SentInvitation[]; onApprove: any; onReject: any; onRevoke: any; }
function DashboardRequestManager({ requests, invitations, onApprove, onReject, onRevoke }: RequestManagerProps) {
    if(requests.length === 0 && invitations.length === 0) return null;
    return (
        <div className="bg-card rounded-lg border shadow-sm">
             <Tabs defaultValue="join-requests">
                <TabsList className="grid w-full grid-cols-2 border-b rounded-t-lg bg-muted/50">
                    <TabsTrigger value="join-requests">Join Requests {requests.length > 0 && <Badge className="ml-2">{requests.length}</Badge>}</TabsTrigger>
                    <TabsTrigger value="sent-invitations">Invitations {invitations.length > 0 && <Badge className="ml-2">{invitations.length}</Badge>}</TabsTrigger>
                </TabsList>
                <TabsContent value="join-requests" className="p-4"><RequestList requests={requests} onApprove={onApprove} onReject={onReject}/></TabsContent>
                <TabsContent value="sent-invitations" className="p-4"><InvitationList invitations={invitations} onRevoke={onRevoke}/></TabsContent>
             </Tabs>
        </div>
    )
}

function RequestList({requests, onApprove, onReject}: any) {
    if(!requests.length) return <p className="text-sm text-muted-foreground text-center italic">No requests.</p>
    return (
        <ul className="divide-y">
            {requests.map((r: any) => (
                <li key={r.id} className="py-3 flex justify-between items-center">
                    <div>
                        <p className="font-medium">{r.user.full_name || r.user.username}</p>
                        {r.message && <p className="text-xs text-muted-foreground italic">"{r.message}"</p>}
                    </div>
                    <div className="flex gap-2">
                         <Button size="sm" variant="outline" onClick={()=>onReject(r.id)}><UserX className="h-4 w-4 mr-2"/>Reject</Button>
                         <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={()=>onApprove(r.id)}><UserCheck className="h-4 w-4 mr-2"/>Approve</Button>
                    </div>
                </li>
            ))}
        </ul>
    )
}

function InvitationList({invitations, onRevoke}: any) {
    if(!invitations.length) return <p className="text-sm text-muted-foreground text-center italic">No invitations.</p>
     return (
        <ul className="divide-y">
            {invitations.map((i: any) => (
                <li key={i.id} className="py-3 flex justify-between items-center">
                    <div>
                        <p className="font-medium">{i.invited_user.full_name || i.invited_user.username}</p>
                        <p className="text-xs text-muted-foreground">Role: {i.role}</p>
                    </div>
                     <Button size="sm" variant="destructive" onClick={()=>onRevoke(i.id)}><Trash2 className="h-4 w-4 mr-2"/>Revoke</Button>
                </li>
            ))}
        </ul>
    )
}

function InviteDialog({ isOpen, onOpenChange, onSuccess, activeSlug }: any) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("tutor");
    const [loading, setLoading] = useState(false);
    
    const submit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/organizations/team/invite/", {email, role}, {headers: {"X-Organization-Slug": activeSlug}});
            toast.success("Invited.");
            onOpenChange(false);
            onSuccess();
        } catch(e: any) { toast.error(e.response?.data?.error || "Failed"); }
        finally { setLoading(false); }
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>Invite Member</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div><Label>Email</Label><Input value={email} onChange={e=>setEmail(e.target.value)} required/></div>
                    <div>
                        <Label>Role</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent><SelectItem value="tutor">Tutor</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">{loading ? <Loader2 className="animate-spin"/> : "Send"}</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}