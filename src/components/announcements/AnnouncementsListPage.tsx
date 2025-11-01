// app/(tutor)/announcements/page.tsx (or similar path)

"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  Megaphone,
  Loader2,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  Calendar,
  FileText,
  Users,
  Building,
  Save,
} from "lucide-react";

// Context and API
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

// --- TYPE DEFINITIONS ---
interface Announcement {
  id: string;
  title: string;
  content: string;
  status: "draft" | "pending_approval" | "scheduled" | "published" | "archived";
  audience_type: string;
  organization_name?: string;
  created_at: string;
  published_at?: string;
  approver?: string;
  publish_at?: string;
}

const statusConfig = {
  draft: { label: "Draft", icon: FileText, color: "bg-gray-500" },
  pending_approval: { label: "Pending", icon: Clock, color: "bg-yellow-500" },
  scheduled: { label: "Scheduled", icon: Calendar, color: "bg-blue-500" },
  published: { label: "Published", icon: CheckCircle, color: "bg-green-600" },
  archived: { label: "Archived", icon: Save, color: "bg-gray-700" },
};

const audienceConfig = {
  all_personal_courses: "All Personal Courses",
  specific_courses: "Specific Courses",
  my_org_courses: "My Organization Courses",
  all_org_courses: "All Organization Courses",
};

// --- Detail Modal Component ---
interface AnnouncementDetailModalProps {
  announcement: Announcement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AnnouncementDetailModal({ announcement, open, onOpenChange }: AnnouncementDetailModalProps) {
    const status = statusConfig[announcement.status] || statusConfig.draft;
    const audience = (audienceConfig as any)[announcement.audience_type] || "Unknown Audience";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded">
        <DialogHeader>
          <DialogTitle className="text-xl">{announcement.title}</DialogTitle>
          <DialogDescription>
            Created {format(new Date(announcement.created_at), "PPP")}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge className={cn("text-white", status.color)}>
              <status.icon className="mr-1.5" size={14} />
              {status.label}
            </Badge>
            <Badge variant="outline">
              <Users className="mr-1.5" size={14} />
              {audience}
            </Badge>
            {announcement.organization_name && (
                <Badge variant="outline" className="border-blue-500 text-blue-600">
                    <Building className="mr-1.5" size={14} />
                    {announcement.organization_name}
                </Badge>
            )}
          </div>
          
          <div className="prose prose-sm dark:prose-invert max-w-full max-h-[300px] overflow-y-auto rounded border p-3 bg-gray-50">
            {/* We'd use a Markdown renderer here in a real app */}
            <p>{announcement.content}</p>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
             {announcement.status === 'scheduled' && announcement.publish_at && (
                <p>Scheduled to publish on: {format(new Date(announcement.publish_at), "PPP 'at' p")}</p>
             )}
             {announcement.status === 'published' && announcement.published_at && (
                <p>Published on: {format(new Date(announcement.published_at), "PPP 'at' p")}</p>
             )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


// --- Main List Page Component ---
export default function AnnouncementsListPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const { activeSlug } = useActiveOrg();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setIsLoading(true);
      try {
        // This endpoint is context-aware and role-aware
        const response = await api.get("/announcements/tutor/manage/");
        setAnnouncements(response.data);
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
        toast.error("Could not load your announcements.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [activeSlug]); // Refetch when context changes

  return (
    <>
      <Card className="max-w-5xl mx-auto my-8 border border-gray-200 rounded text-black shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Megaphone size={20} />
                    My Announcements
                </CardTitle>
                <CardDescription>
                    View, edit, and manage all your created announcements.
                </CardDescription>
            </div>
            <Link href="/announcements/create" passHref>
                <Button className="rounded bg-[#2694C6] hover:bg-[#1f7ba5]">
                    <Plus className="mr-2" size={16} />
                    Create New
                </Button>
            </Link>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <p className="ml-2 text-gray-500">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg bg-gray-50">
              <p className="text-gray-500">You haven't created any announcements yet.</p>
              <Link href="/announcements/create" passHref>
                <Button variant="link" className="text-blue-600">
                    Create your first one
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 border rounded-lg overflow-hidden">
              {announcements.map((ann) => {
                const status = statusConfig[ann.status] || statusConfig.draft;
                return (
                  <div key={ann.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-gray-50/50">
                    <div className="flex-1 mb-2 md:mb-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn("h-2 w-2 rounded-full", status.color)}></span>
                            <h3 className="font-semibold text-gray-900">{ann.title}</h3>
                            {ann.organization_name && (
                                <Badge variant="outline" className="text-xs font-normal">
                                    {ann.organization_name}
                                </Badge>
                            )}
                        </div>
                      
                      <p className="text-sm text-gray-500">
                        Status: <span className="font-medium">{status.label}</span>
                        <span className="mx-2">|</span>
                        Created: {format(new Date(ann.created_at), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                        {/* TODO: Add 'Edit' button
                          <Button variant="outline" size="sm" className="rounded" disabled>
                            <Edit2 className="mr-1.5" size={14} />
                            Edit
                          </Button> 
                        */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded"
                            onClick={() => setSelectedAnnouncement(ann)}
                        >
                            <Eye className="mr-1.5" size={14} />
                            View
                        </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Detail Modal --- */}
      {selectedAnnouncement && (
        <AnnouncementDetailModal
          announcement={selectedAnnouncement}
          open={!!selectedAnnouncement}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedAnnouncement(null);
            }
          }}
        />
      )}
    </>
  );
}