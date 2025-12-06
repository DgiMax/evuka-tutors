import CourseManagerDashboard from '@/components/course/dashboard/CourseManagerDashboard';

export default function ManageCoursePage({ params }: { params: { slug: string } }) {
  return (
    <CourseManagerDashboard />
  );
}