'use client';

// 1. Import your reusable component
import CreateAnnouncementPage from "@/components/announcements/CreateAnnouncementPage";

export default function NewAnnouncementPage() {
  // 2. Render it with no props
  // isEditMode defaults to false and announcementId is undefined
  return <CreateAnnouncementPage />;
}