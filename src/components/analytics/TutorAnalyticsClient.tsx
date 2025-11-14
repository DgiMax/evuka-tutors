"use client";

import React, { useEffect, useState } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";
import { Loader2, BarChart3, TrendingUp, Users } from "lucide-react";

// Types matching the (simplified) analytics view
interface TopCourseDetailed {
  title: string;
  total_students: number;
  active_students: number;
  total_revenue: number;
  rating_avg: number;
}

export default function TutorAnalyticsClient() {
  const { activeSlug } = useActiveOrg();
  const [data, setData] = useState<{ top_courses_detailed: TopCourseDetailed[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const headers = activeSlug ? { 'X-Organization-Slug': activeSlug } : {};
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

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          Performance Analytics
      </h1>

      {/* Course Performance Table */}
      <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
             <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                 <TrendingUp className="h-5 w-5 text-green-600"/> Course Performance Deep Dive
             </h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                        <th className="px-6 py-4 font-semibold">Course Title</th>
                        <th className="px-6 py-4 font-semibold">Total Enrolled</th>
                        <th className="px-6 py-4 font-semibold">Active Learners</th>
                        <th className="px-6 py-4 font-semibold">Avg. Rating</th>
                        <th className="px-6 py-4 font-semibold text-right">Total Revenue</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data?.top_courses_detailed.map((course, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">{course.title}</td>
                            <td className="px-6 py-4">{course.total_students}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                     <Users className="h-4 w-4 text-blue-500" />
                                     {course.active_students}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${course.rating_avg >= 4.5 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                    ★ {course.rating_avg.toFixed(1)}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                                {formatCurrency(course.total_revenue)}
                            </td>
                        </tr>
                    ))}
                    {(!data?.top_courses_detailed || data.top_courses_detailed.length === 0) && (
                        <tr><td colSpan={5} className="px-6 py-8 text-center italic text-gray-400">No performance data available yet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}