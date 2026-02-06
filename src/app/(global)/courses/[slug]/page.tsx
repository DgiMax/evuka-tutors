import CourseManagerDashboard from '@/components/course/dashboard/CourseManagerDashboard';

export default function GlobalManageCoursePage({ params }: { params: { slug: string } }) {
  return (
    <CourseManagerDashboard />
  );
}