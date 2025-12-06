"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  Calendar,
  Building2,
  User,
  Mail,
  Send,
  Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DashboardData {
  context: string;
  currency: string;
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
    end_time: string;
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

interface RequestItem {
  id: number;
  created_at: string;
  message?: string;
  status: string;
  user?: { id: number; username: string; email: string; full_name?: string };
  organization?: { id: number; name: string; slug: string };
}

interface InvitationItem {
  id: number;
  created_at: string;
  role: string;
  status: string;
  invited_user?: { id: number; username: string; email: string; full_name?: string };
  organization?: { id: number; name: string; slug: string };
  invited_by?: { id: number; username: string; email: string; full_name?: string };
}

export default function TutorDashboardClient() {
  const { activeSlug } = useActiveOrg();
  const { user: currentUser } = useAuth();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);

  const currentOrgMembership = currentUser?.organizations?.find(
    (org: any) => org.organization_slug === activeSlug
  );

  const isAdmin =
    currentOrgMembership?.role === "admin" ||
    currentOrgMembership?.role === "owner";

  const isPersonalContext = !activeSlug;

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setRequests([]);
    setInvitations([]);

    try {
      const headers = activeSlug ? { "X-Organization-Slug": activeSlug } : {};

      const dashboardPromise = api.get("/users/dashboard/tutor/", { headers });

      let requestsPromise: Promise<any> = Promise.resolve(null);
      let invitationsPromise: Promise<any> = Promise.resolve(null);

      if (isPersonalContext) {
        requestsPromise = api.get("/community/my-join-requests/");
        invitationsPromise = api.get("/community/my-invitations/");
      } else if (isAdmin) {
        requestsPromise = api.get("/community/manage/requests/", { headers });
        invitationsPromise = api.get("/community/manage/invitations/", { headers });
      }

      const results = await Promise.allSettled([
        dashboardPromise,
        requestsPromise,
        invitationsPromise,
      ]);

      if (results[0].status === "fulfilled") {
        setData(results[0].value.data);
      } else {
        throw new Error("Failed to load dashboard metrics");
      }

      if (results[1].status === "fulfilled" && results[1].value) {
        const res = results[1].value as any; 
        setRequests(res.data.results || res.data || []);
      }

      if (results[2].status === "fulfilled" && results[2].value) {
        const res = results[2].value as any;
        setInvitations(res.data.results || res.data || []);
      }

    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [activeSlug, isAdmin, isPersonalContext]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleOrgApproveRequest = async (id: number) => {
    try {
      await api.post(`/community/manage/requests/${id}/approve/`, {}, { headers: { "X-Organization-Slug": activeSlug } });
      toast.success("Request approved!");
      fetchDashboardData();
    } catch { toast.error("Failed to approve."); }
  };
  const handleOrgRejectRequest = async (id: number) => {
    try {
      await api.post(`/community/manage/requests/${id}/reject/`, {}, { headers: { "X-Organization-Slug": activeSlug } });
      toast.success("Rejected.");
      fetchDashboardData();
    } catch { toast.error("Failed to reject."); }
  };
  const handleOrgRevokeInvitation = async (id: number) => {
    try {
      await api.post(`/community/manage/invitations/${id}/revoke/`, {}, { headers: { "X-Organization-Slug": activeSlug } });
      toast.success("Revoked.");
      fetchDashboardData();
    } catch { toast.error("Failed to revoke."); }
  };

  const handleUserAcceptInvite = async (id: number) => {
    try {
      await api.post(`/community/my-invitations/${id}/accept/`);
      toast.success("Invitation Accepted!");
      fetchDashboardData();
    } catch (e: any) { toast.error(e.response?.data?.error || "Failed to accept."); }
  };
  const handleUserRejectInvite = async (id: number) => {
    try {
      await api.post(`/community/my-invitations/${id}/reject/`);
      toast.success("Invitation Rejected.");
      fetchDashboardData();
    } catch { toast.error("Failed to reject."); }
  };
  const handleUserCancelRequest = async (id: number) => {
    try {
      await api.post(`/community/my-join-requests/${id}/cancel/`);
      toast.success("Request cancelled.");
      fetchDashboardData();
    } catch { toast.error("Failed to cancel."); }
  };

  const formatCurrency = (amount: number | string | undefined) => {
    const val = typeof amount === "string" ? parseFloat(amount) : Number(amount);
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: data?.currency || "KES", maximumFractionDigits: 0 }).format(val || 0);
  };
  
  const getPath = (path: string) => (activeSlug ? `/${activeSlug}${path}` : path);
  const createCourseHref = activeSlug ? `/${activeSlug}/create-course` : "/create-course";
  const createEventHref = activeSlug ? `/${activeSlug}/create-event` : "/create-event";

  if (isLoading && !data) return <DashboardLoading />;
  if (error && !data) return <DashboardError error={error} onRetry={fetchDashboardData} />;

  const showCommunitySection = (requests.length > 0 || invitations.length > 0) && (isPersonalContext || isAdmin);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <DashboardHeader
        createCourseHref={createCourseHref}
        createEventHref={createEventHref}
        activeSlug={activeSlug}
        isAdmin={isAdmin}
        isInviteOpen={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        onSuccess={fetchDashboardData}
      />

      <MetricsGrid
        context={data?.context}
        metrics={data?.metrics}
        formatCurrency={formatCurrency}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-10">
        <UpcomingClassesCard classes={data?.upcoming_classes} getPath={getPath} />
        <TopCoursesCard courses={data?.best_performing_courses} getPath={getPath} formatCurrency={formatCurrency} />
      </div>

      {showCommunitySection && (
        <div className="mt-8">
          <DashboardRequestManager
            mode={isPersonalContext ? "personal" : "org"}
            requests={requests}
            invitations={invitations}
            onApprove={handleOrgApproveRequest}
            onReject={handleOrgRejectRequest}
            onRevoke={handleOrgRevokeInvitation}
            onAccept={handleUserAcceptInvite}
            onDecline={handleUserRejectInvite}
            onCancel={handleUserCancelRequest}
          />
        </div>
      )}
    </div>
  );
}

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
        <>
            <Button variant="outline" onClick={() => onOpenChange(true)} className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Invite Member
            </Button>
            <InviteDialog isOpen={isInviteOpen} onOpenChange={onOpenChange} onSuccess={onSuccess} activeSlug={activeSlug} />
        </>
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

function UpcomingClassesCard({ classes, getPath }: any) {
  const router = useRouter();

  const isJoinable = (dateStr: string, startTimeStr: string, endTimeStr: string) => {
    const now = new Date();
    
    const start = new Date(`${dateStr}T${startTimeStr}`);
    const end = new Date(`${dateStr}T${endTimeStr}`);

    if (end < start) {
        end.setDate(end.getDate() + 1);
    }

    const tenMinutesBeforeStart = new Date(start.getTime() - 10 * 60 * 1000);

    return now >= tenMinutesBeforeStart && now < end;
  };

  const handleJoin = (lessonId: number) => {
    router.push(`/live-session/${lessonId}`); 
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm h-full">
        <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold"><Video className="h-5 w-5 text-teal-600"/> Upcoming Classes</h3>
            <Link href={getPath("/live-classes")} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="h-4 w-4"/></Link>
        </div>
        {classes?.length ? (
            <div className="divide-y divide-border">
                {classes.map((c: any) => {
                    const canJoin = isJoinable(c.date, c.start_time, c.end_time);
                    return (
                      <div
                        key={c.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-3 border-b border-border/50 last:border-0"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">{c.title}</p>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs font-normal text-muted-foreground border-border bg-background/50"
                            >
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(c.date).toLocaleDateString()}
                            </Badge>
                            <span className="text-xs font-medium text-muted-foreground">
                              {c.start_time}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground/80">{c.course_title}</p>
                        </div>

                        {/* Button Section */}
                        {canJoin && (
                          <Button
                            size="sm"
                            className="w-fit shrink-0 bg-green-600 hover:bg-green-700 text-white shadow-sm transition-colors"
                            onClick={() => handleJoin(c.id)}
                          >
                            <Video size={14} className="mr-2" /> Join Now
                          </Button>
                        )}
                      </div>
                    );
                })}
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
                        <div className="h-10 w-10 bg-muted rounded overflow-hidden flex-shrink-0">
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

interface RequestManagerProps { 
    mode: "personal" | "org";
    requests: RequestItem[]; 
    invitations: InvitationItem[]; 
    onApprove?: any; onReject?: any; onRevoke?: any;
    onAccept?: any; onDecline?: any; onCancel?: any;
}

function DashboardRequestManager({ mode, requests, invitations, onApprove, onReject, onRevoke, onAccept, onDecline, onCancel }: RequestManagerProps) {
    if(requests.length === 0 && invitations.length === 0) return null;
    
    return (
        <Tabs defaultValue={invitations.length > 0 ? "invitations" : "requests"} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted rounded-lg">
                <TabsTrigger 
                    value="invitations" 
                    className="flex items-center justify-center gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
                >
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                        {mode === "personal" ? "My Invitations" : "Sent Invitations"} 
                        {invitations.length > 0 && ` (${invitations.length})`}
                    </span>
                </TabsTrigger>
                <TabsTrigger 
                    value="requests" 
                    className="flex items-center justify-center gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
                >
                    <Send className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                        {mode === "personal" ? "My Sent Requests" : "Join Requests"}
                        {requests.length > 0 && ` (${requests.length})`}
                    </span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="invitations" className="mt-6">
                <InvitationList mode={mode} invitations={invitations} onRevoke={onRevoke} onAccept={onAccept} onDecline={onDecline} />
            </TabsContent>

            <TabsContent value="requests" className="mt-6">
                <RequestList mode={mode} requests={requests} onApprove={onApprove} onReject={onReject} onCancel={onCancel} />
            </TabsContent>
        </Tabs>
    )
}

function RequestList({ mode, requests, onApprove, onReject, onCancel }: any) {
    if(!requests.length) return <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/50"><Inbox className="h-8 w-8 mx-auto mb-2 text-muted-foreground"/><p>No requests found.</p></div>
    
    return (
        <div className="space-y-4">
            {requests.map((r: RequestItem) => (
                <div key={r.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        {mode === "org" ? (
                            <>
                                <p className="font-medium flex items-center gap-2 text-gray-900">
                                    <User className="w-4 h-4 text-muted-foreground"/> 
                                    {r.user?.full_name || r.user?.username} 
                                </p>
                                <p className="text-sm text-gray-500">{r.user?.email}</p>
                                {r.message && <p className="text-sm text-muted-foreground mt-1 italic">"{r.message}"</p>}
                            </>
                        ) : (
                            <>
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-muted-foreground"/> 
                                    Request to join {r.organization?.name}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">Status: <Badge variant="secondary" className="capitalize">{r.status}</Badge></p>
                            </>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">Date: {new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex gap-2 shrink-0">
                        {mode === "org" ? (
                            <>
                                <Button size="sm" variant="outline" onClick={()=>onReject(r.id)}><UserX className="h-4 w-4 mr-2"/>Reject</Button>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={()=>onApprove(r.id)}><UserCheck className="h-4 w-4 mr-2"/>Approve</Button>
                            </>
                        ) : (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-2"/>Cancel Request</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Cancel Join Request?</AlertDialogTitle>
                                        <AlertDialogDescription>Are you sure you want to cancel this request?</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Back</AlertDialogCancel>
                                        <AlertDialogAction onClick={()=>onCancel(r.id)}>Yes, Cancel</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

function InvitationList({ mode, invitations, onRevoke, onAccept, onDecline }: any) {
    if(!invitations.length) return <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/50"><Inbox className="h-8 w-8 mx-auto mb-2 text-muted-foreground"/><p>No invitations found.</p></div>
    
    return (
        <div className="space-y-4">
            {invitations.map((i: InvitationItem) => (
                <div key={i.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        {mode === "org" ? (
                            <>
                                <p className="font-medium flex items-center gap-2 text-gray-900">
                                    <User className="w-4 h-4 text-muted-foreground"/> 
                                    {i.invited_user?.full_name || i.invited_user?.username} 
                                </p>
                                <p className="text-sm text-gray-500">{i.invited_user?.email}</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-gray-500">From {i.invited_by?.username || "Admin"}</p>
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-muted-foreground"/> 
                                    Join {i.organization?.name}
                                </h3>
                            </>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="capitalize">{i.role}</Badge>
                            <span className="text-xs text-muted-foreground">Sent: {new Date(i.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        {mode === "org" ? (
                            <Button size="sm" variant="destructive" onClick={()=>onRevoke(i.id)}><Trash2 className="h-4 w-4 mr-2"/>Revoke</Button>
                        ) : (
                            <>
                                <Button size="sm" variant="outline" onClick={()=>onDecline(i.id)}><UserX className="h-4 w-4 mr-2"/>Decline</Button>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={()=>onAccept(i.id)}><UserCheck className="h-4 w-4 mr-2"/>Accept</Button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
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
            toast.success("Invitation sent successfully.");
            setEmail("");
            onOpenChange(false);
            onSuccess();
        } catch(e: any) { 
            toast.error(e.response?.data?.error || "Failed to send invitation."); 
        } finally { 
            setLoading(false); 
        }
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite New Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="user@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
                    </div>
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tutor">Tutor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full mt-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <UserPlus className="h-4 w-4 mr-2"/>}
                        {loading ? "Sending..." : "Send Invitation"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}