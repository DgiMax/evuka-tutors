"use client";

import Link from "next/link";
import { Plus, UserPlus, CalendarDays } from "lucide-react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";

export default function DashboardPage() {
  const { activeSlug } = useActiveOrg();

  // ✅ compute path dynamically based on org context
  const createCourseHref = activeSlug ? `/${activeSlug}/create-course` : "/create-course";

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section: Buttons */}
      <div className="mb-8 flex justify-end space-x-3">
        <Link
          href={createCourseHref}
          className="flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
          New Course
        </Link>

        <button className="flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
          <UserPlus className="h-4 w-4" />
          Invite Tutor
        </button>

        <button className="flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
          <CalendarDays className="h-4 w-4" />
          Schedule Event
        </button>
      </div>

      {/* Organization Summary Section */}
      <h2 className="mb-6 text-xl font-semibold text-gray-800">Organization summary</h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {/* Metric Card: Total Courses */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-md font-medium text-gray-600">Total Courses</p>
          <p className="mt-2 text-5xl font-bold text-blue-600">5</p>
        </div>

        {/* Metric Card: Active Tutors */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-md font-medium text-gray-600">Active Tutors</p>
          <p className="mt-2 text-5xl font-bold text-blue-600">267</p>
        </div>

        {/* Metric Card: Active Students */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-md font-medium text-gray-600">Active Students</p>
          <p className="mt-2 text-5xl font-bold text-blue-600">23K</p>
        </div>

        {/* Metric Card: Total Revenue */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-md font-medium text-gray-600">Total Revenue</p>
          <p className="mt-2 text-5xl font-bold text-blue-600">19M</p>
        </div>

        {/* Metric Card: Upcoming Events */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-md font-medium text-gray-600">Upcoming Events</p>
          <p className="mt-2 text-5xl font-bold text-blue-600">42</p>
        </div>
      </div>
    </div>
  );
}
