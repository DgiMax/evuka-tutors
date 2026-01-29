"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";
import { 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp, 
  X, 
  BarChart3, 
  ArrowUpRight, 
  BookOpen, 
  Star,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface AnalyticsData {
  kpis: {
    total_revenue: number;
    total_enrollments: number;
    active_events: number;
    avg_rating: number;
  };
  trends: Array<{ month: string; enrollments: number; revenue: number }>;
  course_breakdown: any[];
}

const KPICard = ({ title, value, icon: Icon, trend }: any) => (
  <div className="rounded-md border border-border bg-card p-4 flex flex-col justify-between space-y-3 shadow-none h-full">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="p-1.5 bg-muted rounded-md">
        <Icon className="h-4 w-4 text-foreground/70" />
      </div>
    </div>
    <div className="space-y-1">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">{value}</h2>
      {trend && (
        <div className="flex items-center text-xs text-emerald-600 font-medium">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          {trend}
          <span className="text-muted-foreground ml-1 font-normal text-[10px]">vs last month</span>
        </div>
      )}
    </div>
  </div>
);

const MobileCourseList = ({ courses, onSelect, formatCurrency }: any) => (
  <div className="grid gap-4 md:hidden">
    {courses.map((course: any) => (
      <Card 
        key={course.id} 
        onClick={() => onSelect(course.id)} 
        className="p-3 active:scale-[0.99] transition-transform border border-border rounded-md shadow-none cursor-pointer"
      >
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-1">
            <p className="font-semibold text-foreground line-clamp-2 leading-snug">
              {course.title}
            </p>
            <Badge 
              variant="secondary" 
              className={`capitalize font-normal text-[10px] px-2 py-0 h-5 rounded-md ${
                course.status === 'published' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}
            >
              {course.status}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-2 mt-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Rating</p>
            <p className="text-sm font-medium font-mono text-muted-foreground flex items-center gap-1">
              <Star size={10} className="fill-amber-400 text-amber-400" /> {course.rating_avg.toFixed(1)}
            </p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Students</p>
            <p className="text-sm font-medium font-mono">{course.student_metrics.total}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Revenue</p>
            <p className="text-sm font-bold font-mono text-emerald-600">{formatCurrency(course.revenue_metrics.total)}</p>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const AnalyticsSkeleton = () => (
  <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 gap-4">
        <div className="space-y-2 w-full sm:w-auto">
          <Skeleton width={200} height={32} />
          <Skeleton width={300} height={20} />
        </div>
        <Skeleton width={140} height={36} className="w-full sm:w-[140px]" />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton height={130} borderRadius={8} />
        <Skeleton height={130} borderRadius={8} />
        <Skeleton height={130} borderRadius={8} />
        <Skeleton height={130} borderRadius={8} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><Skeleton height={400} borderRadius={8} /></div>
        <div className="lg:col-span-1"><Skeleton height={400} borderRadius={8} /></div>
      </div>
    </div>
  </SkeletonTheme>
);

export default function TutorAnalyticsView() {
  const { activeSlug } = useActiveOrg();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeSlug]);

  const fetchData = async () => {
    try {
      const headers = activeSlug ? { "X-Organization-Slug": activeSlug } : {};
      const res = await api.get("/users/dashboard/analytics/", { headers });
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseClick = async (courseId: string) => {
    setIsDetailLoading(true);
    try {
      const res = await api.get(`/users/dashboard/analytics/?course_id=${courseId}`);
      setSelectedCourse(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      height: 350,
      fontFamily: 'inherit',
      toolbar: { show: false }
    },
    colors: ['#10b981', '#3b82f6'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    xaxis: {
      categories: data?.trends.map(d => new Date(d.month).toLocaleString("default", { month: "short" })) || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#64748b', fontSize: '11px' } }
    },
    yaxis: [
      {
        seriesName: 'Revenue',
        labels: {
          style: { colors: '#64748b', fontFamily: 'monospace' },
          formatter: (value) => `${(value / 1000).toFixed(1)}k`
        }
      },
      {
        opposite: true,
        seriesName: 'Enrollments',
        labels: {
          style: { colors: '#64748b', fontFamily: 'monospace' },
          formatter: (value) => value.toLocaleString()
        }
      }
    ],
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
    tooltip: { theme: 'light' }
  };

  const chartSeries = [
    { name: 'Revenue', data: data?.trends.map(d => d.revenue) || [] },
    { name: 'Enrollments', data: data?.trends.map(d => d.enrollments) || [] }
  ];

  if (isLoading) return <AnalyticsSkeleton />;
  if (!data) return null;

  return (
    <div className="container mx-auto px-2 md:px-4 py-6 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Performance Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Growth and engagement metrics for your curriculum.</p>
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-2 w-full sm:w-auto rounded-md">
          <Download className="h-3.5 w-3.5" /> Export Report
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Revenue" value={formatCurrency(data.kpis.total_revenue)} icon={DollarSign} trend="+12%" />
        <KPICard title="Total Students" value={data.kpis.total_enrollments.toLocaleString()} icon={Users} trend="+8%" />
        <KPICard title="Active Events" value={data.kpis.active_events.toLocaleString()} icon={Calendar} />
        <KPICard title="Platform Rating" value={data.kpis.avg_rating.toFixed(1)} icon={Star} trend="+0.2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-md border border-border bg-card shadow-none">
          <div className="p-4 sm:p-6 border-b border-border">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Revenue & Enrollments
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Trends over the last 6 months.</p>
          </div>
          <div className="p-2 sm:p-4">
            <Chart options={chartOptions} series={chartSeries} type="area" height={320} width="100%" />
          </div>
        </div>

        <div className="lg:col-span-1 rounded-md border border-border bg-card flex flex-col h-full shadow-none">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-base">Top Courses</h3>
            <p className="text-xs text-muted-foreground mt-1">Highest grossing content.</p>
          </div>
          <div className="hidden md:block flex-1 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="h-10 text-xs font-medium pl-6">Title</TableHead>
                  <TableHead className="h-10 text-xs font-medium text-right pr-6">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.course_breakdown.slice(0, 5).map((course) => (
                  <TableRow 
                    key={course.id} 
                    className="cursor-pointer hover:bg-muted/50 border-border group transition-colors"
                    onClick={() => handleCourseClick(course.id)}
                  >
                    <TableCell className="pl-6 py-3">
                      <div className="font-medium text-sm truncate max-w-[140px] text-foreground group-hover:text-primary transition-colors">{course.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{course.student_metrics.total} students</div>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-3">
                      <span className="text-sm font-medium font-mono text-emerald-600">{formatCurrency(course.revenue_metrics.total)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden p-4">
            <MobileCourseList courses={data.course_breakdown.slice(0, 5)} onSelect={handleCourseClick} formatCurrency={formatCurrency} />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card shadow-none overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-base">Course Inventory</h3>
          <p className="text-xs text-muted-foreground mt-1">Performance breakdown of all your units.</p>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border bg-muted/30">
                <TableHead className="h-10 text-xs font-medium pl-6 whitespace-nowrap">Course Title</TableHead>
                <TableHead className="h-10 text-xs font-medium">Status</TableHead>
                <TableHead className="h-10 text-xs font-medium text-right font-mono">Price</TableHead>
                <TableHead className="h-10 text-xs font-medium text-right font-mono">Students</TableHead>
                <TableHead className="h-10 text-xs font-medium text-right font-mono pr-6">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.course_breakdown.map((course) => (
                <TableRow key={course.id} className="cursor-pointer hover:bg-muted/50 border-border" onClick={() => handleCourseClick(course.id)}>
                  <TableCell className="font-medium text-sm text-foreground pl-6 py-4 whitespace-nowrap">{course.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`capitalize font-normal text-[10px] px-2 rounded-md ${course.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{course.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-muted-foreground">{formatCurrency(course.revenue_metrics.price)}</TableCell>
                  <TableCell className="text-right text-xs font-mono">{course.student_metrics.total}</TableCell>
                  <TableCell className="text-right text-sm font-mono font-medium text-foreground pr-6">{formatCurrency(course.revenue_metrics.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="md:hidden p-4">
          <MobileCourseList courses={data.course_breakdown} onSelect={handleCourseClick} formatCurrency={formatCurrency} />
        </div>
      </div>

      <Dialog open={!!selectedCourse} onOpenChange={(open: boolean) => !open && setSelectedCourse(null)}>
        <DialogContent className="w-[95%] sm:max-w-[500px] lg:max-w-[600px] p-0 gap-0 max-h-[90vh] md:max-h-[85vh] h-auto flex flex-col border-border/80 shadow-2xl rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[5%] md:top-[10%] translate-y-0">
          {isDetailLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" />
            </div>
          ) : (
            selectedCourse && (
              <>
                <DialogHeader className="px-5 py-4 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-md border border-primary/20 shrink-0">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-sm md:text-base font-bold tracking-tight text-foreground uppercase truncate">
                        Course Analytics
                      </DialogTitle>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.15em] truncate">
                        {selectedCourse.course_info.title}
                      </p>
                    </div>
                  </div>
                  <DialogClose className="rounded-md p-2 hover:bg-muted transition-colors shrink-0" onClick={() => setSelectedCourse(null)}>
                    <X className="h-5 w-5 text-muted-foreground" />
                  </DialogClose>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-5 md:px-8 py-6 space-y-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-none">
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-md border border-border bg-muted/5 transition-colors">
                      <p className="text-[9px] uppercase font-black text-muted-foreground mb-1 tracking-widest">Revenue</p>
                      <p className="text-sm md:text-lg font-black font-mono text-foreground">
                        {formatCurrency(selectedCourse.course_info.revenue_metrics.total)}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-md border border-border bg-muted/5 transition-colors">
                      <p className="text-[9px] uppercase font-black text-muted-foreground mb-1 tracking-widest">Enrolled</p>
                      <p className="text-sm md:text-lg font-black font-mono text-foreground">
                        {selectedCourse.course_info.student_metrics.total}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-md border border-border bg-muted/5 transition-colors">
                      <p className="text-[9px] uppercase font-black text-muted-foreground mb-1 tracking-widest">Completed</p>
                      <p className="text-sm md:text-lg font-black font-mono text-foreground">
                        {selectedCourse.course_info.student_metrics.completed}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[9px]">01</span>
                        Course Retention
                      </h4>
                      <Badge variant="outline" className="rounded-sm uppercase text-[8px] font-black px-2 border-primary/30 text-primary bg-primary/5 shadow-none">
                        {selectedCourse.course_info.student_metrics.completion_rate}% Completion Rate
                      </Badge>
                    </div>

                    <div className="space-y-6 relative">
                      <div className="absolute left-[15px] top-8 bottom-8 w-0.5 bg-border -z-10" />
                      
                      <div className="flex gap-4">
                        <div className="h-8 w-8 rounded-full border border-border bg-background flex items-center justify-center shrink-0 shadow-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-2.5">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                            <span className="text-muted-foreground">Total Learners</span>
                            <span className="text-foreground">{selectedCourse.course_info.student_metrics.total}</span>
                          </div>
                          <Progress value={100} className="h-1.5 bg-muted rounded-none" />
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="h-8 w-8 rounded-full border border-emerald-200 bg-emerald-50 flex items-center justify-center shrink-0 shadow-sm">
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 space-y-2.5">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                            <span className="text-emerald-700">Completions</span>
                            <span className="text-emerald-600 font-mono">
                              {selectedCourse.course_info.student_metrics.completed}
                            </span>
                          </div>
                          <Progress
                            value={selectedCourse.course_info.student_metrics.completion_rate}
                            className="h-1.5 bg-muted rounded-none"
                            indicatorClassName="bg-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-dashed border-border/60">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[9px]">02</span>
                      Associated Events
                    </h4>
                    <div className="grid gap-2">
                      {selectedCourse.related_events.length > 0 ? (
                        selectedCourse.related_events.map((event: any) => (
                          <div
                            key={event.id}
                            className="flex items-center justify-between p-4 border border-border rounded-md bg-muted/10 hover:bg-muted/20 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{event.title}</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">
                                {new Date(event.start_time).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-[9px] font-black h-5 px-2 rounded-sm border-none uppercase shadow-none bg-background">
                              {event.event_status}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 border border-dashed rounded-md bg-muted/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">No linked events found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 border-t bg-muted/20 flex justify-end shrink-0 mt-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedCourse(null)}
                    className="h-10 px-6 rounded-md font-black text-[10px] text-black uppercase tracking-widest shadow-none bg-muted hover:bg-muted/80 active:scale-[0.98] transition-all"
                  >
                    Close Details
                  </Button>
                </div>
              </>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);