"use client";

import React, { useEffect, useState } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";
import { Loader2, TrendingUp, Users, Inbox, DollarSign, Star } from "lucide-react";
import {
  Card,
  CardContent,
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
import { cn } from "@/lib/utils";

interface TopCourseDetailed {
  title: string;
  total_students: number;
  active_students: number;
  total_revenue: number;
  rating_avg: number;
}

const LoaderState: React.FC = () => (
  <div className="flex flex-col h-[50vh] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="mt-2 text-muted-foreground">Loading analytics...</p>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg bg-muted/50 p-4">
    <Inbox className="h-8 w-8 text-muted-foreground" />
    <p className="text-muted-foreground mt-2 text-center">{message}</p>
  </div>
);

export default function TutorAnalyticsClient() {
  const { activeSlug } = useActiveOrg();
  const [data, setData] = useState<{ top_courses_detailed: TopCourseDetailed[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const headers = activeSlug ? { "X-Organization-Slug": activeSlug } : {};
        const res = await api.get("/users/dashboard/analytics/", { headers });
        setData(res.data);
      } catch (error) {
        console.error("Analytics fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeSlug]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }).format(amount);

  const getRatingClass = (rating: number) => {
    return rating >= 4.5
      ? "bg-green-100 text-green-800 border-green-200"
      : rating >= 3.5
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  if (isLoading) return <LoaderState />;
  if (!data) return <EmptyState message="No analytics data found." />;

  const RatingBadge: React.FC<{ rating: number }> = ({ rating }) => (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border", getRatingClass(rating))}>
      <Star size={10} className="fill-current" /> {rating.toFixed(1)}
    </span>
  );

  const MobileAnalyticsList = () => (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {data.top_courses_detailed.map((course, idx) => (
        <Card key={idx} className="p-4">
          <div className="flex justify-between items-start gap-4">
            <h3 className="font-semibold text-foreground leading-tight">{course.title}</h3>
            <RatingBadge rating={course.rating_avg} />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Students</p>
                <div className="flex items-center gap-2 text-sm text-foreground">
                    <Users size={14} className="text-primary" />
                    <span className="font-medium">{course.total_students}</span>
                    <span className="text-muted-foreground text-xs">({course.active_students} active)</span>
                </div>
            </div>
            <div className="space-y-1 text-right">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Revenue</p>
                <div className="flex items-center justify-end gap-1 text-sm font-bold text-green-700">
                    {formatCurrency(course.total_revenue)}
                </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  // --- DESKTOP TABLE (Unchanged logic, just layout) ---
  const DesktopAnalyticsTable = () => (
    <div className="border rounded-lg overflow-hidden hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course Title</TableHead>
            <TableHead>Total Enrolled</TableHead>
            <TableHead>Active Learners</TableHead>
            <TableHead>Avg. Rating</TableHead>
            <TableHead className="text-right">Total Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.top_courses_detailed.map((course, idx) => (
            <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium text-foreground">{course.title}</TableCell>
              <TableCell className="text-muted-foreground">{course.total_students}</TableCell>
              <TableCell className="text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  {course.active_students}
                </div>
              </TableCell>
              <TableCell><RatingBadge rating={course.rating_avg} /></TableCell>
              <TableCell className="text-right font-medium text-foreground">{formatCurrency(course.total_revenue)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
        Performance Analytics
      </h1>

      <Card className="p-0">
        <CardHeader className="p-6 border-b bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Course Performance Deep Dive
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!data.top_courses_detailed || data.top_courses_detailed.length === 0 ? (
            <EmptyState message="No performance data available yet." />
          ) : (
            <>
              <MobileAnalyticsList />
              <DesktopAnalyticsTable />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}