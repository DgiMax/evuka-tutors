"use client";

import React, { useEffect, useState } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";
import { Loader2, BarChart3, TrendingUp, Users, Inbox } from "lucide-react"; // Added Inbox
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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

// Types matching the (simplified) analytics view
interface TopCourseDetailed {
  title: string;
  total_students: number;
  active_students: number;
  total_revenue: number;
  rating_avg: number;
}

// --- NEW: Themed Utility Components ---
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
  const [data, setData] =
    useState<{ top_courses_detailed: TopCourseDetailed[] } | null>(null);
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
      ? "bg-green-100 text-green-800"
      : rating >= 3.5
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";
  };

  if (isLoading) return <LoaderState />;
  if (!data) return <EmptyState message="No analytics data found." />;

  // Reusable component for the rating badge
  const RatingBadge: React.FC<{ rating: number }> = ({ rating }) => (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        getRatingClass(rating)
      )}
    >
      ★ {rating.toFixed(1)}
    </span>
  );

  // --- NEW: Mobile Card List Component ---
  const MobileAnalyticsList = () => (
    <div className="space-y-4 md:hidden">
      {data.top_courses_detailed.map((course, idx) => (
        <Card key={idx} className="p-4">
          <div className="flex justify-between items-start">
            <p className="font-semibold text-foreground pr-4">{course.title}</p>
            <RatingBadge rating={course.rating_avg} />
          </div>

          <div className="flex justify-between items-end mt-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Enrolled: {course.total_students}
              </p>
              <p className="text-sm text-muted-foreground">
                Active: {course.active_students}
              </p>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(course.total_revenue)}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );

  // --- UPDATED: Desktop Table (now hidden on mobile) ---
  const DesktopAnalyticsTable = () => (
    <div className="border rounded-lg overflow-hidden hidden md:block">
      <Table>
        {/* UPDATED: Themed header */}
        <TableHeader>
          <TableRow>
            <TableHead>Course Title</TableHead>
            <TableHead>Total Enrolled</TableHead>
            <TableHead>Active Learners</TableHead>
            <TableHead>Avg. Rating</TableHead>
            <TableHead className="text-right">Total Revenue</TableHead>
          </TableRow>
        </TableHeader>
        {/* UPDATED: Themed body */}
        <TableBody>
          {data.top_courses_detailed.map((course, idx) => (
            <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium text-foreground">
                {course.title}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {course.total_students}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <div className="flex items-center gap-2">
                  {/* UPDATED: Themed icon */}
                  <Users className="h-4 w-4 text-primary" />
                  {course.active_students}
                </div>
              </TableCell>
              <TableCell>
                <RatingBadge rating={course.rating_avg} />
              </TableCell>
              <TableCell className="text-right font-medium text-foreground">
                {formatCurrency(course.total_revenue)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    // UPDATED: Standardized padding
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* UPDATED: Themed title */}
      <h1 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
        Performance Analytics
      </h1>

      {/* UPDATED: Main content wrapped in themed card */}
      <Card className="p-0">
        <CardHeader className="p-6">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Course Performance Deep Dive
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {!data.top_courses_detailed ||
          data.top_courses_detailed.length === 0 ? (
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