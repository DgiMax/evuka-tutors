"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Loader2,
  Plus,
  UserPlus,
  Video,
  TrendingUp,
  ArrowRight,
  UserCheck,
  UserX,
  Trash2,
  Calendar,
  Building2,
  User,
  Mail,
  Send,
  Inbox,
  Users,
  DollarSign,
  ChevronRight,
  X,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
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
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DashboardData {
  metrics: {
    total_courses: number;
    active_students: number;
    total_revenue: number;
    upcoming_events: number;
    active_tutors: number;
  };
  upcoming_classes: Array<{
    id: string;
    title: string;
    course_title: string;
    date: string;
    start_time: string;
    end_datetime: string;
    status: string;
    chat_room_id: string;
  }>;
  upcoming_events: Array<{
    id: string;
    title: string;
    slug: string;
    start_time: string;
    banner_image: string | null;
    event_type: string;
  }>;
  best_performing_courses: Array<{
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    student_count: number;
    revenue: number;
    rating_avg: number;
  }>;
}

const inputStyles = "rounded-md border-border bg-background transition-colors hover:border-secondary focus-visible:ring-0 focus-visible:border-secondary shadow-none outline-none w-full";

const KPICard = ({ title, value, icon: Icon, color }: any) => (
  <div className="rounded-md border border-border bg-card p-5 flex flex-col justify-between space-y-4 shadow-none h-full transition-colors hover:border-muted-foreground/30">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className={cn("p-1.5 rounded-md", color)}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <h2 className="text-2xl font-bold tracking-tight text-foreground">{value}</h2>
  </div>
);

const DashboardSkeleton = () => (
  <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <div className="flex justify-between items-center border-b pb-6">
        <div className="space-y-2">
          <Skeleton width={200} height={32} />
          <Skeleton width={300} height={20} />
        </div>
        <div className="flex gap-2">
          <Skeleton width={120} height={40} borderRadius={6} />
          <Skeleton width={120} height={40} borderRadius={6} />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={110} borderRadius={8} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton height={400} borderRadius={8} />
        <Skeleton height={400} borderRadius={8} />
      </div>
    </div>
  </SkeletonTheme>
);

export default function TutorDashboardClient() {
  const { activeSlug } = useActiveOrg();
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);

  const isAdmin = useMemo(() => {
    const membership = currentUser?.organizations?.find((o: any) => o.organization_slug === activeSlug);
    return membership?.role === "admin" || membership?.role === "owner";
  }, [currentUser, activeSlug]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = activeSlug ? { "X-Organization-Slug": activeSlug } : {};
      const [dashRes, reqRes, invRes] = await Promise.allSettled([
        api.get("/users/dashboard/tutor/", { headers }),
        !activeSlug ? api.get("/community/my-join-requests/") : isAdmin ? api.get("/community/manage/requests/", { headers }) : Promise.resolve(null),
        !activeSlug ? api.get("/community/my-invitations/") : isAdmin ? api.get("/community/manage/invitations/", { headers }) : Promise.resolve(null),
      ]);

      if (dashRes.status === "fulfilled") setData(dashRes.value.data);
      if (reqRes.status === "fulfilled" && reqRes.value) setRequests(reqRes.value.data.results || reqRes.value.data || []);
      if (invRes.status === "fulfilled" && invRes.value) setInvitations(invRes.value.data.results || invRes.value.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [activeSlug, isAdmin]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(val || 0);

  const getJoinStatus = (dateStr: string, startTimeStr: string, endDatetimeStr: string) => {
    const now = new Date();
    const start = new Date(`${dateStr}T${startTimeStr}`);
    const end = new Date(endDatetimeStr);
    const buffer = new Date(start.getTime() - 20 * 60 * 1000);

    return {
      canJoin: now >= buffer && now < end,
      isExpired: now >= end
    };
  };

  const handleInviteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post("/organizations/team/invite/", 
        { email: formData.get('email'), role: formData.get('role') }, 
        { headers: { "X-Organization-Slug": activeSlug } }
      );
      toast.success("Invitation sent");
      setIsInviteOpen(false);
      fetchAll();
    } catch (err) { 
      toast.error("Failed to send invite"); 
    }
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {activeSlug ? "Organization Overview" : "Personal Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Growth and scheduling insights at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-md shadow-none h-9">
            <Link href={activeSlug ? `/${activeSlug}/courses/create` : "/courses/create"}>
              <Plus size={16} className="mr-2" /> Course
            </Link>
          </Button>
          {activeSlug && isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setIsInviteOpen(true)} className="rounded-md shadow-none h-9">
              <UserPlus size={16} className="mr-2" /> Invite
            </Button>
          )}
          <Button size="sm" asChild className="rounded-md shadow-none h-9">
            <Link href={activeSlug ? `/${activeSlug}/events/create` : "/events/create"}>
              <Plus size={16} className="mr-2" /> New Event
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Revenue" value={formatCurrency(data?.metrics.total_revenue || 0)} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
        <KPICard title="Active Students" value={data?.metrics.active_students || 0} icon={Users} color="bg-blue-50 text-blue-600" />
        <KPICard title="Live Classes" value={data?.upcoming_classes.length || 0} icon={Video} color="bg-amber-50 text-amber-600" />
        <KPICard title="Upcoming Events" value={data?.metrics.upcoming_events || 0} icon={Calendar} color="bg-purple-50 text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" /> Live Sessions
            </h3>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7 rounded-md">
              <Link href={activeSlug ? `/${activeSlug}/live-classes` : "/live-classes"}>See All</Link>
            </Button>
          </div>
          <div className="rounded-md border border-border bg-card shadow-none overflow-hidden divide-y divide-border">
            {data?.upcoming_classes.filter(c => !getJoinStatus(c.date, c.start_time, c.end_datetime).isExpired).length ? (
              data.upcoming_classes.map((cls) => {
                const { canJoin, isExpired } = getJoinStatus(cls.date, cls.start_time, cls.end_datetime);
                if (isExpired) return null;
                return (
                  <div key={cls.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium text-sm text-foreground">{cls.title}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{cls.course_title}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1"><Calendar size={12}/> {format(new Date(cls.date), "MMM d")}</span>
                        <span className="flex items-center gap-1">🕒 {cls.start_time}</span>
                      </div>
                    </div>
                    {canJoin && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md h-8 text-xs shadow-none px-4" onClick={() => router.push(`/live-session/${cls.id}`)}>
                        Join Now
                      </Button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-10 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                <Inbox size={24} className="opacity-20"/>
                No active classes today.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Upcoming Events
            </h3>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7 rounded-md">
              <Link href={activeSlug ? `/${activeSlug}/events` : "/events"}>View All</Link>
            </Button>
          </div>
          <div className="rounded-md border border-border bg-card shadow-none overflow-hidden divide-y divide-border">
            {data?.upcoming_events.length ? (
              data.upcoming_events.map((ev) => (
                <Link key={ev.id} href={activeSlug ? `/${activeSlug}/events/${ev.slug}` : `/events/${ev.slug}`} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className="h-10 w-10 bg-muted rounded-md overflow-hidden flex-shrink-0 border border-border">
                    {ev.banner_image && <img src={ev.banner_image} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{ev.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 h-4 rounded-sm border-border bg-muted/20">{ev.event_type}</Badge>
                      <span className="text-[11px] text-muted-foreground font-medium">{format(new Date(ev.start_time), "MMM d, h:mm a")}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground opacity-50" />
                </Link>
              ))
            ) : (
              <div className="p-10 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                <Inbox size={24} className="opacity-20"/>
                No scheduled events.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <h3 className="font-semibold text-lg px-1 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> Top Curriculums
        </h3>
        <div className="rounded-md border border-border bg-card shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-muted/10">
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-muted-foreground">Course Details</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-muted-foreground text-center">Enrolled</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-muted-foreground text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.best_performing_courses.length ? data.best_performing_courses.map((course) => (
                  <tr key={course.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={activeSlug ? `/${activeSlug}/courses/${course.slug}` : `/courses/${course.slug}`} className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-md overflow-hidden border border-border flex-shrink-0">
                          {course.thumbnail && <img src={course.thumbnail} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{course.title}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-amber-500 text-[10px] font-bold">
                            <Star size={10} className="fill-amber-500" /> {course.rating_avg.toFixed(1)}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium">{course.student_count}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600 font-mono">{formatCurrency(course.revenue)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-20 text-center text-muted-foreground text-sm">No course performance data available yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[450px] p-0 gap-0 border-border/80 rounded-md bg-background shadow-none overflow-hidden [&>button]:hidden">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30 flex flex-row items-center justify-between shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <div className="p-2 bg-background border border-border rounded-md shadow-none">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              Invite Team Member
            </DialogTitle>
            <DialogClose className="rounded-md p-1 hover:bg-muted transition-colors">
              <X size={16} className="text-muted-foreground" />
            </DialogClose>
          </DialogHeader>
          <form className="p-6 space-y-6" onSubmit={handleInviteSubmit}>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">Email Address</Label>
              <Input name="email" type="email" placeholder="tutor@example.com" required className={inputStyles} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-0.5">Assigned Role</Label>
              <Select name="role" defaultValue="tutor">
                <SelectTrigger className={inputStyles}><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-md border-border shadow-none">
                  <SelectItem value="tutor" className="text-sm">Tutor (Course Management)</SelectItem>
                  <SelectItem value="admin" className="text-sm">Admin (Full Control)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2 border-t border-border pt-6 flex justify-end gap-3">
               <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen(false)} className="rounded-md h-9 px-4">Cancel</Button>
               <Button type="submit" size="sm" className="bg-primary text-primary-foreground rounded-md shadow-none h-9 px-4 font-bold">
                Send Invite
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}