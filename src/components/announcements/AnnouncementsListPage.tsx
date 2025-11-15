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
  Inbox, // NEW: For empty state
} from "lucide-react";

// Context and API
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";

// Shadcn UI Components
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // NEW: Import DialogClose
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

// UPDATED: Remapped status colors to be theme-friendly where possible
const statusConfig = {
  draft: { label: "Draft", icon: FileText, color: "bg-muted text-muted-foreground" },
  pending_approval: {
    label: "Pending",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
  },
  scheduled: {
    label: "Scheduled",
    icon: Calendar,
    color: "bg-blue-100 text-blue-800",
  },
  published: {
    label: "Published",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
  },
  archived: {
    label: "Archived",
    icon: Save,
    color: "bg-muted text-muted-foreground",
  },
};

const audienceConfig = {
  all_personal_courses: "All Personal Courses",
  specific_courses: "Specific Courses",
  my_org_courses: "My Organization Courses",
  all_org_courses: "All Organization Courses",
};

// --- Detail Modal Component (Themed) ---
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
  const audience =
    (audienceConfig as any)[announcement.audience_type] || "Unknown Audience";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{announcement.title}</DialogTitle>
          <DialogDescription>
            Created {format(new Date(announcement.created_at), "PPP")}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {/* UPDATED: Badge now uses the themed color from config */}
            <Badge className={cn("hover:bg-none", status.color)}>
              <status.icon className="mr-1.5" size={14} />
              {status.label}
            </Badge>
            <Badge variant="outline">
              <Users className="mr-1.5" size={14} />
              {audience}
            </Badge>
            {announcement.organization_name && (
              // UPDATED: Uses theme primary color
              <Badge
                variant="outline"
                className="border-primary/50 text-primary"
              >
                <Building className="mr-1.5" size={14} />
                {announcement.organization_name}
              </Badge>
            )}
          </div>

          {/* UPDATED: Uses theme muted bg */}
          <div className="prose prose-sm dark:prose-invert max-w-full max-h-[300px] overflow-y-auto rounded border p-3 bg-muted/50">
            <p className="whitespace-pre-wrap">{announcement.content}</p>
          </div>

          {/* UPDATED: Uses theme muted text */}
          <div className="text-xs text-muted-foreground space-y-1">
            {announcement.status === "scheduled" && announcement.publish_at && (
              <p>
                Scheduled to publish on:{" "}
                {format(new Date(announcement.publish_at), "PPP 'at' p")}
              </p>
            )}
            {announcement.status === "published" &&
              announcement.published_at && (
                <p>
                  Published on:{" "}
                  {format(new Date(announcement.published_at), "PPP 'at' p")}
                </p>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Delete Confirmation Modal (Themed) ---
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {/* UPDATED: Uses theme destructive color */}
          <div className="flex items-center gap-3 text-destructive mb-2">
            <AlertTriangle size={24} />
            <DialogTitle className="text-xl">Delete Announcement?</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <strong className="text-foreground">
              "{announcement?.title}"
            </strong>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
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

// --- Main List Page Component (Themed & Responsive) ---
export default function AnnouncementsListPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  // Delete state
  const [announcementToDelete, setAnnouncementToDelete] =
    useState<Announcement | null>(null);
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
      await api.delete(
        `/announcements/tutor/manage/${announcementToDelete.id}/`
      );
      toast.success("Announcement deleted successfully.");
      setAnnouncements((prev) =>
        prev.filter((a) => a.id !== announcementToDelete.id)
      );
      setAnnouncementToDelete(null);
    } catch (error: any) {
      console.error("Delete failed:", error);
      toast.error(
        error.response?.data?.detail || "Failed to delete announcement."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* UPDATED: Responsive card, themed, and flush padding */}
      <Card className="max-w-5xl mx-4 sm:mx-auto my-8 p-0">
        {/* UPDATED: Responsive header (stacks on mobile) and themed padding */}
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Megaphone size={20} />
              My Announcements
            </CardTitle>
            <CardDescription>
              View, edit, and manage all your created announcements.
            </CardDescription>
          </div>
          {/* UPDATED: Button uses theme primary color */}
          <Link href="/announcements/create" passHref>
            <Button className="w-full sm:w-auto mt-2 sm:mt-0">
              <Plus className="mr-2" size={16} />
              Create New
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          {isLoading ? (
            // UPDATED: Themed loader
            <div className="flex flex-col justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">
                Loading announcements...
              </p>
            </div>
          ) : announcements.length === 0 ? (
            // UPDATED: Themed empty state
            <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg bg-muted/50">
              <Inbox className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">
                You haven't created any announcements yet.
              </p>
              <Link href="/announcements/create" passHref>
                <Button variant="link" className="text-primary">
                  Create your first one
                </Button>
              </Link>
            </div>
          ) : (
            // UPDATED: Themed list
            <div className="divide-y divide-border border rounded-lg overflow-hidden">
              {announcements.map((ann) => {
                const status = statusConfig[ann.status] || statusConfig.draft;
                const canEdit = true;

                return (
                  <div
                    key={ann.id}
                    className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 mb-3 md:mb-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full flex-shrink-0",
                            status.color
                          )}
                          title={status.label}
                        ></span>
                        <h3 className="font-semibold text-foreground line-clamp-1">
                          {ann.title}
                        </h3>
                        {ann.organization_name && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 font-normal"
                          >
                            {ann.organization_name}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground gap-3">
                        <span
                          className={cn(
                            "flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
                            status.color
                          )}
                        >
                          {status.label}
                        </span>
                        <span>•</span>
                        <span>
                          {format(new Date(ann.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 w-full md:w-auto mt-2 md:mt-0">
                      {/* UPDATED: Themed ghost button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10 flex-1 md:flex-none"
                        onClick={() => setSelectedAnnouncement(ann)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </Button>
                      {/* UPDATED: Themed ghost button (Secondary) */}
                      <Link href={`/announcements/${ann.id}/edit`} passHref>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-secondary hover:bg-secondary/10 flex-1 md:flex-none"
                          disabled={!canEdit}
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </Button>
                      </Link>
                      {/* UPDATED: Themed ghost button (Destructive) */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-1 md:flex-none"
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
          onOpenChange={(open) => {
            if (!open) setSelectedAnnouncement(null);
          }}
        />
      )}

      {/* --- Delete Modal --- */}
      <DeleteAnnouncementDialog
        announcement={announcementToDelete}
        open={!!announcementToDelete}
        onOpenChange={(open) => {
          if (!open) setAnnouncementToDelete(null);
        }}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}