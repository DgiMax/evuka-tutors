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
  Inbox,
  X
} from "lucide-react";

import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
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
  draft: { label: "Draft", icon: FileText, color: "bg-muted text-muted-foreground" },
  pending_approval: { label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  scheduled: { label: "Scheduled", icon: Calendar, color: "bg-blue-100 text-blue-800" },
  published: { label: "Published", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  archived: { label: "Archived", icon: Save, color: "bg-muted text-muted-foreground" },
};

const audienceConfig = {
  all_personal_courses: "All Personal Courses",
  specific_courses: "Specific Courses",
  my_org_courses: "My Organization Courses",
  all_org_courses: "All Organization Courses",
};

// --- Detail Modal Component (Updated Style) ---
interface AnnouncementDetailModalProps {
  announcement: Announcement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AnnouncementDetailModal({
  announcement,
  open,
  onOpenChange,
}: AnnouncementDetailModalProps) {
  const status = statusConfig[announcement.status] || statusConfig.draft;
  const audience = (audienceConfig as any)[announcement.audience_type] || "Unknown Audience";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 top-[10%] translate-y-0 gap-0 max-h-[85vh] flex flex-col">
        
        {/* Gray Header */}
        <div className="p-4 border-b bg-muted/40 rounded-t-lg shrink-0 flex items-start justify-between">
            <div>
                <DialogTitle className="text-xl">{announcement.title}</DialogTitle>
                <DialogDescription className="mt-1">
                    Created {format(new Date(announcement.created_at), "PPP")}
                </DialogDescription>
            </div>
            <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                    <X size={18} />
                </Button>
            </DialogClose>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
            {/* Meta Tags */}
            <div className="flex flex-wrap gap-2">
                <Badge className={cn("hover:bg-none border-0", status.color)}>
                    <status.icon className="mr-1.5" size={14} />
                    {status.label}
                </Badge>
                <Badge variant="outline" className="bg-background">
                    <Users className="mr-1.5" size={14} />
                    {audience}
                </Badge>
                {announcement.organization_name && (
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                        <Building className="mr-1.5" size={14} />
                        {announcement.organization_name}
                    </Badge>
                )}
            </div>

            {/* Content Box */}
            <div className="prose prose-sm dark:prose-invert max-w-full rounded-lg border p-4 bg-muted/20">
                <p className="whitespace-pre-wrap leading-relaxed">{announcement.content}</p>
            </div>

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                {announcement.status === "scheduled" && announcement.publish_at && (
                    <p className="flex items-center gap-2">
                        <Calendar size={12} /> Scheduled: {format(new Date(announcement.publish_at), "PPP 'at' p")}
                    </p>
                )}
                {announcement.status === "published" && announcement.published_at && (
                    <p className="flex items-center gap-2">
                        <CheckCircle size={12} /> Published: {format(new Date(announcement.published_at), "PPP 'at' p")}
                    </p>
                )}
            </div>
        </div>

        {/* Gray Footer */}
        <div className="p-4 border-t bg-muted/40 rounded-b-lg flex justify-end shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}

// --- Delete Confirmation Modal (Updated Style) ---
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
      <DialogContent className="sm:max-w-[425px] p-0 top-[15%] translate-y-0 gap-0">
        
        {/* Gray Header */}
        <div className="p-4 border-b bg-muted/40 rounded-t-lg flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
                <DialogTitle className="text-base font-semibold">Delete Announcement?</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">This action cannot be undone.</DialogDescription>
            </div>
        </div>

        {/* Body */}
        <div className="p-6">
            <p className="text-sm text-foreground/80 leading-relaxed">
                Are you sure you want to permanently delete <span className="font-semibold text-foreground">"{announcement?.title}"</span>?
            </p>
        </div>

        {/* Gray Footer */}
        <div className="p-4 border-t bg-muted/40 rounded-b-lg flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting} className="h-9">
                Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="h-9">
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Forever
            </Button>
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
      <Card className="max-w-5xl mx-4 sm:mx-auto my-8 p-0">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-muted/10 border-b">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Megaphone size={20} className="text-primary" />
              My Announcements
            </CardTitle>
            <CardDescription className="mt-1">
              View, edit, and manage all your created announcements.
            </CardDescription>
          </div>
          <Link href="/announcements/create" passHref className="w-full sm:w-auto mt-4 sm:mt-0">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2" size={16} /> Create New
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground mt-2">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
              <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">No announcements yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mt-1 mb-4">
                You haven't created any announcements. Share updates with your students to keep them engaged.
              </p>
              <Link href="/announcements/create" passHref>
                <Button variant="outline" className="gap-2">
                    <Plus size={14} /> Create your first one
                </Button>
              </Link>
            </div>
          ) : (
            <div className="p-2">
              {announcements.map((ann) => {
                const status = statusConfig[ann.status] || statusConfig.draft;
                
                return (
                  <div
                    key={ann.id}
                    className="group flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/40 transition-all"
                  >
                    <div className="flex flex-1 items-start gap-3 min-w-0 w-full">
                      <div className={cn("mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-opacity-10", status.color)}>
                        <status.icon size={14} className={status.color.split(" ")[1]} />
                      </div>

                      <div className="grid gap-1 min-w-0 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm text-foreground truncate leading-none">
                            {ann.title}
                          </h3>
                          {ann.organization_name && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal text-muted-foreground border-muted-foreground/20">
                              {ann.organization_name}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {ann.content}
                        </p>

                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span className={cn("font-medium", status.color.split(" ")[1])}>
                            {status.label}
                          </span>
                          <span className="text-muted-foreground/30">•</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {format(new Date(ann.created_at), "MMM d")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedAnnouncement(ann)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </Button>

                      <Link href={`/announcements/${ann.id}/edit`} passHref>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Edit">
                          <Pencil size={16} />
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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

      {/* Modals */}
      {selectedAnnouncement && (
        <AnnouncementDetailModal
          announcement={selectedAnnouncement}
          open={!!selectedAnnouncement}
          onOpenChange={(open) => !open && setSelectedAnnouncement(null)}
        />
      )}

      <DeleteAnnouncementDialog
        announcement={announcementToDelete}
        open={!!announcementToDelete}
        onOpenChange={(open) => !open && setAnnouncementToDelete(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}