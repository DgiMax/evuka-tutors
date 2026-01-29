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
  Plus,
  UserPlus,
  Video,
  TrendingUp,
  ArrowLeft,
  Calendar,
  Inbox,
  Users,
  DollarSign,
  ChevronRight,
  X,
  Star,
  ExternalLink,
  Users2,
  Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import RequestsInvitationsList from "./RequestsInvitationsList";

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

const inputStyles = "h-12 px-4 rounded-md border-border bg-background transition-colors hover:border-secondary focus-visible:ring-0 focus-visible:border-secondary shadow-none outline-none w-full text-base";

const KPICard = ({ title, value, icon: Icon, color }: any) => (
  <div className="rounded-md border border-border bg-card p-4 md:p-5 flex flex-col justify-between space-y-4 shadow-none h-full transition-colors hover:border-muted-foreground/30">
    <div className="flex items-center justify-between">
      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className={cn("p-1.5 rounded-md", color)}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{value}</h2>
  </div>
);

const DashboardSkeleton = () => (
  <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div className="space-y-2">
          <Skeleton width={180} height={28} />
          <Skeleton width={240} height={16} />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Skeleton width={100} height={36} className="flex-1 md:flex-none" />
          <Skeleton width={100} height={36} className="flex-1 md:flex-none" />
        </div>
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={100} borderRadius={8} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton height={300} borderRadius={8} />
        <Skeleton height={300} borderRadius={8} />
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
  
  const [isTutorInvite, setIsTutorInvite] = useState(true);
  const [commission, setCommission] = useState("70");

  const isAdmin = useMemo(() => {
    const membership = currentUser?.organizations?.find((o: any) => o.organization_slug === activeSlug);
    return membership?.role === "admin" || membership?.role === "owner";
  }, [currentUser, activeSlug]);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = activeSlug ? { "X-Organization-Slug": activeSlug } : {};
      const res = await api.get("/users/dashboard/tutor/", { headers });
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [activeSlug]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

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
      await api.post("/community/invitations/", 
        { 
          email: formData.get('email'), 
          gov_role: formData.get('gov_role'),
          is_tutor_invite: isTutorInvite,
          tutor_commission: isTutorInvite ? parseFloat(commission) : 0
        }, 
        { headers: { "X-Organization-Slug": activeSlug } }
      );
      toast.success("Invitation sent successfully");
      setIsInviteOpen(false);
    } catch (err: any) { 
      const errorMsg = err.response?.data?.detail || err.response?.data?.tutor_commission || "Failed to send invite";
      toast.error(typeof errorMsg === 'string' ? errorMsg : "Check commission limits"); 
    }
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl space-y-10 md:space-y-14">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {activeSlug ? "Organization Overview" : "Personal Dashboard"}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 uppercase font-bold tracking-wider opacity-60">Control Console & Insights</p>
        </div>
        <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" asChild className="rounded-md shadow-none h-9 text-[11px] font-bold uppercase tracking-wider">
            <Link href={activeSlug ? `/${activeSlug}/courses/create` : "/courses/create"}>
              <Plus size={14} className="mr-1.5" /> Course
            </Link>
          </Button>
          {activeSlug && isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setIsInviteOpen(true)} className="rounded-md shadow-none h-9 text-[11px] font-bold uppercase tracking-wider">
              <UserPlus size={14} className="mr-1.5" /> Invite
            </Button>
          )}
          <Button size="sm" asChild className="col-span-2 md:col-span-1 rounded-md shadow-none h-9 text-[11px] font-bold uppercase tracking-wider bg-primary text-primary-foreground">
            <Link href={activeSlug ? `/${activeSlug}/events/create` : "/events/create"}>
              <Plus size={14} className="mr-1.5" /> New Event
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard title="Revenue" value={formatCurrency(data?.metrics.total_revenue || 0)} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
        <KPICard title="Students" value={data?.metrics.active_students || 0} icon={Users} color="bg-blue-50 text-blue-600" />
        <KPICard title="Classes" value={data?.upcoming_classes.length || 0} icon={Video} color="bg-amber-50 text-amber-600" />
        <KPICard title="Events" value={data?.metrics.upcoming_events || 0} icon={Calendar} color="bg-purple-50 text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Video className="h-3.5 w-3.5" /> Live Sessions
            </h3>
            <Button variant="ghost" size="sm" asChild className="text-[10px] font-bold uppercase h-7 rounded-md tracking-tighter hover:bg-muted">
              <Link href={activeSlug ? `/${activeSlug}/live-classes` : "/live-classes"}>Manage</Link>
            </Button>
          </div>
          <div className="rounded-md border border-border bg-card shadow-none overflow-hidden divide-y divide-border">
            {data?.upcoming_classes.filter(c => !getJoinStatus(c.date, c.start_time, c.end_datetime).isExpired).length ? (
              data.upcoming_classes.map((cls) => {
                const { canJoin, isExpired } = getJoinStatus(cls.date, cls.start_time, cls.end_datetime);
                if (isExpired) return null;
                return (
                  <div key={cls.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors group">
                    <div className="space-y-1.5 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate leading-tight group-hover:text-primary transition-colors">{cls.title}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{cls.course_title}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground font-bold uppercase">
                        <span className="flex items-center gap-1"><Calendar size={11} className="opacity-50"/> {format(new Date(cls.date), "MMM d")}</span>
                        <span className="opacity-30">•</span>
                        <span className="flex items-center gap-1">🕒 {cls.start_time}</span>
                      </div>
                    </div>
                    {canJoin && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md h-8 text-[10px] font-black uppercase tracking-widest shadow-none w-full sm:w-auto px-4" onClick={() => router.push(`/live-session/${cls.id}`)}>
                        Join Now
                      </Button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Inbox size={24} className="opacity-20"/>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">No classes today</p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" /> Upcoming Events
            </h3>
            <Button variant="ghost" size="sm" asChild className="text-[10px] font-bold uppercase h-7 rounded-md tracking-tighter hover:bg-muted">
              <Link href={activeSlug ? `/${activeSlug}/events` : "/events"}>Browse</Link>
            </Button>
          </div>
          <div className="rounded-md border border-border bg-card shadow-none overflow-hidden divide-y divide-border">
            {data?.upcoming_events.length ? (
              data.upcoming_events.map((ev) => (
                <Link key={ev.id} href={activeSlug ? `/${activeSlug}/events/${ev.slug}` : `/events/${ev.slug}`} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors group">
                  <div className="h-10 w-10 md:h-12 md:w-12 bg-muted rounded flex-shrink-0 overflow-hidden border border-border bg-background">
                    {ev.banner_image ? <img src={ev.banner_image} className="w-full h-full object-cover" /> : <div className="h-full w-full flex items-center justify-center opacity-10"><Calendar size={18} /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">{ev.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[8px] font-black uppercase px-1.5 h-4 rounded-sm border-border bg-muted/20 tracking-wider shrink-0">{ev.event_type}</Badge>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight truncate">{format(new Date(ev.start_time), "MMM d, h:mm a")}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground opacity-30 shrink-0" />
                </Link>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Inbox size={24} className="opacity-20"/>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">No events</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Users2 className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground">Inbox & Community</h3>
        </div>
        <RequestsInvitationsList />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground">Performance Leaders</h3>
        </div>
        
        <div className="hidden md:block rounded-md border border-border bg-card shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">Curriculum</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground text-center">Students</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.best_performing_courses.length ? data.best_performing_courses.map((course) => (
                  <tr key={course.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={activeSlug ? `/${activeSlug}/courses/${course.slug}` : `/courses/${course.slug}`} className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded overflow-hidden border border-border flex-shrink-0">
                          {course.thumbnail && <img src={course.thumbnail} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{course.title}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-amber-500 text-[10px] font-black">
                            <Star size={10} className="fill-amber-500" /> {course.rating_avg.toFixed(1)}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-foreground/80">{course.student_count}</td>
                    <td className="px-6 py-4 text-right text-sm font-black text-emerald-600">{formatCurrency(course.revenue)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-20 text-center text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-50">No data yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="block md:hidden space-y-4">
            {data?.best_performing_courses.length ? data.best_performing_courses.map((course) => (
                <div key={course.id} className="border border-border bg-card rounded-md overflow-hidden flex flex-col">
                    <div className="p-4 flex items-center gap-3 border-b border-border bg-muted/10">
                        <div className="h-10 w-10 bg-background rounded border border-border shrink-0 overflow-hidden">
                            {course.thumbnail && <img src={course.thumbnail} className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-[13px] truncate text-foreground">{course.title}</h4>
                            <div className="flex items-center gap-1 text-amber-500 text-[9px] font-black">
                                <Star size={10} className="fill-amber-500" /> {course.rating_avg.toFixed(1)}
                            </div>
                        </div>
                        <Link href={activeSlug ? `/${activeSlug}/courses/${course.slug}` : `/courses/${course.slug}`} className="p-2 hover:bg-muted rounded-md text-muted-foreground">
                            <ExternalLink size={14} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-border">
                        <div className="p-3 text-center">
                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Students</p>
                            <p className="text-sm font-black text-foreground">{course.student_count}</p>
                        </div>
                        <div className="p-3 text-center">
                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Revenue</p>
                            <p className="text-sm font-black text-emerald-600">{formatCurrency(course.revenue)}</p>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="p-10 border border-dashed rounded-md text-center opacity-40">
                    <p className="text-[10px] font-bold uppercase tracking-widest">No activity available</p>
                </div>
            )}
        </div>
      </section>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="w-[95%] sm:max-w-[500px] p-0 gap-0 border-border/80 rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[5%] md:top-[10%] translate-y-0 shadow-none">
          <DialogHeader className="px-4 md:px-6 py-4 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <DialogTitle className="text-base md:text-lg font-bold tracking-tight text-foreground">
                Invite Team Member
              </DialogTitle>
            </div>
            <DialogClose className="rounded-md p-2 hover:bg-muted transition -mr-2">
              <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </DialogClose>
          </DialogHeader>

          <form onSubmit={handleInviteSubmit} className="flex flex-col min-h-0">
            <div className="p-4 md:p-6 space-y-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Email Address</Label>
                <Input name="email" type="email" placeholder="tutor@example.com" required className={inputStyles} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Assigned Governance Role</Label>
                <Select name="gov_role" defaultValue="member">
                  <SelectTrigger className={inputStyles}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border-border shadow-none">
                    <SelectItem value="member" className="text-sm font-bold py-3">Member (Standard Access)</SelectItem>
                    <SelectItem value="admin" className="text-sm font-bold py-3">Admin (Management)</SelectItem>
                    <SelectItem value="owner" className="text-sm font-bold py-3">Owner (Full Control)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                  <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-md">
                      <div className="space-y-0.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest">Teaching Offer</Label>
                          <p className="text-[10px] text-muted-foreground font-medium">Include a revenue share agreement</p>
                      </div>
                      <Switch checked={isTutorInvite} onCheckedChange={setIsTutorInvite} />
                  </div>
                  
                  {isTutorInvite && (
                      <div className="mt-4 p-4 border border-dashed border-primary/30 bg-primary/5 rounded-md space-y-4 animate-in fade-in duration-200">
                          <div className="space-y-1.5">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                                  <Percent size={12} /> Proposed Commission Share
                              </Label>
                              <div className="flex items-center gap-4">
                                  <Input 
                                      type="number" min="10" max="100" 
                                      value={commission} 
                                      onChange={(e) => setCommission(e.target.value)}
                                      className="w-24 h-10 text-lg font-mono rounded-md border-primary/20 focus-visible:ring-primary"
                                  />
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Share to retain (%)</span>
                              </div>
                              <p className="text-[9px] text-muted-foreground/60 italic leading-tight mt-1">Minimum allowable commission for tutors in this organization is 10%.</p>
                          </div>
                      </div>
                  )}
              </div>
            </div>
            
            <div className="px-4 md:px-6 py-4 border-t bg-muted/20 flex flex-col-reverse sm:flex-row justify-end gap-3 mt-auto">
              <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)} className="h-11 md:h-10 w-full sm:w-auto px-6 rounded-md font-bold text-[11px] md:text-xs uppercase tracking-widest border-border shadow-none bg-background">
                Cancel
              </Button>
              <Button type="submit" className="h-11 md:h-10 w-full sm:w-auto px-6 rounded-md font-black text-[11px] md:text-xs uppercase tracking-widest shadow-none bg-primary text-primary-foreground hover:bg-primary/90">
                Send Invitation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}