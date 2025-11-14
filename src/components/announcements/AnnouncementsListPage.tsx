// app/(tutor)/announcements/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";

// Context and API
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

// --- Detail Modal Component (Unchanged) ---
// ... (Keep your existing AnnouncementDetailModal here) ...
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
            <p className="whitespace-pre-wrap">{announcement.content}</p>
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

// --- NEW: Delete Confirmation Modal ---
interface DeleteAnnouncementDialogProps {
  announcement: Announcement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

function DeleteAnnouncementDialog({
  announcement,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteAnnouncementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded">
        <DialogHeader>
          <div className="flex items-center gap-3 text-red-500 mb-2">
            <AlertTriangle size={24} />
            <DialogTitle className="text-xl">Delete Announcement?</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete <strong>"{announcement?.title}"</strong>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting} className="rounded">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="rounded bg-red-600 hover:bg-red-700">
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
              </>
            ) : (
              "Delete Forever"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// --- Main List Page Component ---
export default function AnnouncementsListPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  
  // Delete state
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { activeSlug } = useActiveOrg();

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/announcements/tutor/manage/");
      setAnnouncements(response.data);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      toast.error("Could not load your announcements.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [activeSlug]);

  const handleDelete = async () => {
    if (!announcementToDelete) return;
    setIsDeleting(true);
    try {
        await api.delete(`/announcements/tutor/manage/${announcementToDelete.id}/`);
        toast.success("Announcement deleted successfully.");
        // Refresh list locally
        setAnnouncements((prev) => prev.filter((a) => a.id !== announcementToDelete.id));
        setAnnouncementToDelete(null);
    } catch (error: any) {
        console.error("Delete failed:", error);
        toast.error(error.response?.data?.detail || "Failed to delete announcement.");
    } finally {
        setIsDeleting(false);
    }
  };

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
                // Optional: Disable edit/delete for certain statuses if your backend requires it
                // const canEdit = ann.status === 'draft' || ann.status === 'scheduled'; 
                const canEdit = true; // Assuming tutors can always edit their own, even if it triggers re-approval

                return (
                  <div key={ann.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 mb-3 md:mb-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className={cn("h-2.5 w-2.5 rounded-full", status.color)} title={status.label}></span>
                            <h3 className="font-semibold text-gray-900 line-clamp-1">{ann.title}</h3>
                            {ann.organization_name && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-gray-500">
                                    {ann.organization_name}
                                </Badge>
                            )}
                        </div>
                      
                      <div className="flex items-center text-sm text-gray-500 gap-3">
                        <span className={cn("flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100", status.color.replace("bg-", "text-").replace("500", "700").replace("600", "800"))}>
                            {status.label}
                        </span>
                        <span>•</span>
                        <span>{format(new Date(ann.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-gray-500 hover:text-[#2694C6] hover:bg-blue-50 rounded"
                            onClick={() => setSelectedAnnouncement(ann)}
                            title="View Details"
                        >
                            <Eye size={16} />
                        </Button>

                        <Link href={`/announcements/${ann.id}/edit`} passHref>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                                disabled={!canEdit}
                                title="Edit"
                            >
                                <Pencil size={16} />
                            </Button>
                        </Link>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                            onClick={() => setAnnouncementToDelete(ann)}
                            title="Delete"
                        >
                            <Trash2 size={16} />
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
          onOpenChange={(open) => { if (!open) setSelectedAnnouncement(null); }}
        />
      )}

      {/* --- Delete Modal --- */}
      <DeleteAnnouncementDialog 
        announcement={announcementToDelete}
        open={!!announcementToDelete}
        onOpenChange={(open) => { if (!open) setAnnouncementToDelete(null); }}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}