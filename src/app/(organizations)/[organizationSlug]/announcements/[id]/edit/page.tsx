'use client';

// 1. Import your reusable component
import CreateAnnouncementPage from "@/components/announcements/CreateAnnouncementPage";
import { useParams } from "next/navigation";

export default function AnnouncementEditPage() {
  const params = useParams();
  
  // 2. Get the 'id' from the URL (from the file name [id])
  const id = params.id as string;

  // 3. Pass the props to the component
  // This tells the component to fetch data and use the PUT method
  return <CreateAnnouncementPage isEditMode={true} announcementId={id} />;
}