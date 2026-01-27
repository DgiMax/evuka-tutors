'use client';

// 1. Import your main student list component
import StudentsViewPage from "@/components/students/StudentsViewPage";

export default function MyStudentsPage() {
  // 2. Render it.
  // It's fully context-aware and fetches its own data.
  return <StudentsViewPage />;
}