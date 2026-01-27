"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
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
  Pencil,
  Trash2,
  AlertTriangle,
  Inbox,
  X,
  Send,
  MoreVertical,
  Check,
  ChevronsUpDown
} from "lucide-react";

import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UiCalendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Announcement {
  id: string;
  title: string;
  content: string;
  status: "draft" | "pending_approval" | "scheduled" | "published" | "archived";
  audience_type: string;
  organization_name?: string;
  created_at: string;
  published_at?: string;
  publish_at?: string;
  courses?: string[];
}

interface TargetCourse {
  id: string;
  title: string;
}

const announcementFormSchema = z.object({
  title: z.string().min(5).max(100),
  content: z.string().min(20),
  audience_type: z.string().min(1),
  courses: z.array(z.string()).optional(),
  status: z.enum(["draft", "pending_approval", "scheduled", "published"]).default("draft"),
  publish_at: z.date().optional(),
}).refine(data => data.status !== 'scheduled' || !!data.publish_at, {
  message: "Required for scheduled posts",
  path: ["publish_at"],
}).refine(data => data.audience_type !== 'specific_courses' || (data.courses && data.courses.length > 0), {
  message: "Select at least one course",
  path: ["courses"],
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

const AnnouncementSkeleton = () => (
  <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <div className="flex justify-between items-center border-b pb-6">
        <div className="space-y-2">
          <Skeleton width={200} height={32} />
          <Skeleton width={300} height={20} />
        </div>
        <Skeleton width={120} height={40} borderRadius={6} />
      </div>
      <Skeleton height={500} borderRadius={8} />
    </div>
  </SkeletonTheme>
);

const inputBaseStyles = "rounded-md border-border bg-background transition-colors hover:border-secondary focus-visible:ring-0 focus-visible:border-secondary shadow-none outline-none";

export default function AnnouncementsPage() {
  const { activeSlug } = useActiveOrg();
  const { user } = useAuth();
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetableCourses, setTargetableCourses] = useState<TargetCourse[]>([]);
  
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema) as any,
    defaultValues: { title: "", content: "", audience_type: "", courses: [], status: "draft" }
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [annRes, courseRes] = await Promise.all([
        api.get("/announcements/tutor/manage/"),
        api.get("/announcements/tutor/target-courses/")
      ]);
      setAnnouncements(annRes.data);
      setTargetableCourses(courseRes.data.map((c: any) => ({ id: c.id.toString(), title: c.title })));
    } catch (error) {
      toast.error("Failed to load announcements");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [activeSlug, fetchData]);

  const isOrgAdmin = useMemo(() => {
    const membership = user?.organizations?.find(o => o.organization_slug === activeSlug);
    return membership?.role?.toLowerCase() === "admin" || membership?.role?.toLowerCase() === "owner";
  }, [user, activeSlug]);

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    form.reset({ title: "", content: "", audience_type: "", courses: [], status: "draft" });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    form.reset({
      title: ann.title,
      content: ann.content,
      audience_type: ann.audience_type,
      courses: ann.courses?.map(String) || [],
      status: ann.status as any,
      publish_at: ann.publish_at ? new Date(ann.publish_at) : undefined
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: AnnouncementFormValues) => {
    setIsSubmitting(true);
    const payload = { ...data, publish_at: data.publish_at?.toISOString() || null };
    try {
      if (editingAnnouncement) {
        await api.put(`/announcements/tutor/manage/${editingAnnouncement.id}/`, payload);
        toast.success("Announcement updated");
      } else {
        await api.post("/announcements/tutor/manage/", payload);
        toast.success("Announcement created");
      }
      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!announcementToDelete) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/announcements/tutor/manage/${announcementToDelete.id}/`);
      toast.success("Deleted successfully");
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Delete failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "published") return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-md shadow-none font-medium">Published</Badge>;
    if (s === "pending_approval") return <Badge className="bg-amber-50 text-amber-700 border-amber-100 rounded-md shadow-none font-medium">Pending</Badge>;
    if (s === "scheduled") return <Badge className="bg-blue-50 text-blue-700 border-blue-100 rounded-md shadow-none font-medium">Scheduled</Badge>;
    return <Badge className="bg-muted text-muted-foreground border-transparent rounded-md shadow-none font-medium">Draft</Badge>;
  };

  if (isLoading) return <AnnouncementSkeleton />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and broadcast updates to your students.</p>
        </div>
        <Button onClick={handleOpenCreate} className="rounded-md h-9 px-4 gap-2 shadow-none">
          <Plus size={16} /> Create New
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card shadow-none overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/10">
          <h3 className="font-semibold text-base">History</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-border hover:bg-muted/30">
                <TableHead className="pl-6 h-12 text-xs uppercase tracking-wider font-semibold">Post Details</TableHead>
                <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold">Audience</TableHead>
                <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-center">Status</TableHead>
                <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold">Created</TableHead>
                <TableHead className="pr-6 h-12 text-xs uppercase tracking-wider font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.length > 0 ? announcements.map((ann) => (
                <TableRow key={ann.id} className="border-border hover:bg-muted/20 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <p className="font-medium text-foreground text-sm truncate max-w-[200px]">{ann.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">{ann.content}</p>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-muted-foreground" />
                      <span className="text-xs font-medium capitalize">{ann.audience_type.replace(/_/g, ' ')}</span>
                    </div>
                    {ann.organization_name && <p className="text-[10px] text-primary font-bold uppercase mt-0.5">{ann.organization_name}</p>}
                  </TableCell>
                  <TableCell className="py-4 text-center">{getStatusBadge(ann.status)}</TableCell>
                  <TableCell className="py-4 text-xs text-muted-foreground">{format(new Date(ann.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="pr-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-md shadow-none"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-md border-border shadow-none min-w-[140px]">
                        <DropdownMenuItem onClick={() => setSelectedAnnouncement(ann)} className="text-sm cursor-pointer"><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(ann)} className="text-sm cursor-pointer"><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setAnnouncementToDelete(ann); setIsDeleteOpen(true); }} className="text-sm text-red-600 focus:text-red-600 cursor-pointer"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
                      <div className="p-4 border-2 border-dashed border-border rounded-full bg-muted/20"><Inbox className="h-8 w-8 opacity-20" /></div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">No announcements found</p>
                        <p className="text-xs">Create your first broadcast to engage your students.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selectedAnnouncement} onOpenChange={(open) => !open && setSelectedAnnouncement(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[620px] p-0 gap-0 border-border/80 rounded-md bg-background shadow-none flex flex-col max-h-[90vh] overflow-hidden [&>button]:hidden">
          {selectedAnnouncement && (
            <>
              <DialogHeader className="px-6 py-4 border-b bg-muted/30 flex flex-row items-center justify-between shrink-0">
                <DialogTitle className="flex items-center gap-3 text-lg font-semibold tracking-tight truncate pr-4 text-foreground">
                  <div className="p-2 bg-background border border-border rounded-md shadow-none"><Megaphone className="h-4 w-4 text-primary" /></div>
                  <span className="truncate">{selectedAnnouncement.title}</span>
                </DialogTitle>
                <DialogClose className="rounded-md p-1 hover:bg-muted transition-colors"><X className="h-5 w-5 text-muted-foreground" /></DialogClose>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-thumb]:bg-clip-content">
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(selectedAnnouncement.status)}
                  <Badge variant="outline" className="rounded-md border-border bg-muted/20 text-xs font-medium px-2 py-0.5 capitalize"><Users className="mr-1.5 h-3 w-3" /> {selectedAnnouncement.audience_type.replace(/_/g, ' ')}</Badge>
                  {selectedAnnouncement.organization_name && <Badge variant="outline" className="rounded-md border-primary/20 bg-primary/5 text-primary text-xs font-bold px-2 py-0.5"><Building className="mr-1.5 h-3 w-3" /> {selectedAnnouncement.organization_name}</Badge>}
                </div>
                <div className="prose prose-sm max-w-full bg-muted/10 border border-border rounded-md p-4 leading-relaxed text-foreground/90 whitespace-pre-wrap">{selectedAnnouncement.content}</div>
                <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Created: {format(new Date(selectedAnnouncement.created_at), "PPP")}</div>
                  {selectedAnnouncement.publish_at && <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Scheduled for: {format(new Date(selectedAnnouncement.publish_at), "PPP p")}</div>}
                </div>
              </div>
              <div className="px-4 py-3 border-t bg-muted/30 flex justify-end shrink-0"><Button variant="outline" size="sm" onClick={() => setSelectedAnnouncement(null)} className="h-9 rounded-md px-4 shadow-none">Close View</Button></div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[850px] p-0 gap-0 border-border/80 rounded-md bg-background shadow-none flex flex-col max-h-[90vh] overflow-hidden [&>button]:hidden">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30 flex flex-row items-center justify-between shrink-0">
            <DialogTitle className="flex items-center gap-3 text-lg font-semibold tracking-tight text-foreground">
              <div className="p-2 bg-background border border-border rounded-md shadow-none"><FileText className="h-4 w-4 text-primary" /></div>
              {editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}
            </DialogTitle>
            <DialogClose className="rounded-md p-1 hover:bg-muted transition-colors"><X className="h-5 w-5 text-muted-foreground" /></DialogClose>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-none">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-6">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Headline for your update..." {...field} className={inputBaseStyles} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="content" render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Message Body</FormLabel>
                      <FormControl>
                        <Textarea rows={10} placeholder="Broadcast your message here..." {...field} className={cn(inputBaseStyles, "resize-none")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full items-start">
                    <FormField control={form.control} name="audience_type" render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Target Audience</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!!editingAnnouncement}>
                          <FormControl>
                            <SelectTrigger className={cn(inputBaseStyles, "w-full")}>
                              <SelectValue placeholder="Select audience..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-md border-border shadow-none">
                            {activeSlug ? (
                              isOrgAdmin ? [
                                { id: "all_org_courses", name: "All Organization Students" },
                                { id: "my_org_courses", name: "Students in My Courses" },
                                { id: "specific_courses", name: "Specific Courses" }
                              ].map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>)
                              : [
                                { id: "my_org_courses", name: "Students in My Courses" },
                                { id: "specific_courses", name: "Specific Courses" }
                              ].map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>)
                            ) : [
                              { id: "all_personal_courses", name: "All Enrolled Students" },
                              { id: "specific_courses", name: "Specific Courses" }
                            ].map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Workflow Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={field.value === 'published' && !!editingAnnouncement}>
                          <FormControl>
                            <SelectTrigger className={cn(inputBaseStyles, "w-full")}>
                              <SelectValue placeholder="Status..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-md border-border shadow-none">
                            {["draft", "pending_approval", "scheduled", "published"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full items-start">
                    {form.watch("audience_type") === "specific_courses" && (
                      <FormField control={form.control} name="courses" render={({ field }) => (
                        <FormItem className="flex flex-col w-full">
                          <FormLabel>Course Selection</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" role="combobox" className={cn(inputBaseStyles, "w-full justify-between")}>
                                {field.value?.length ? `${field.value.length} selected` : "Select courses..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-[--radix-popover-trigger-width] min-w-[300px] p-0 rounded-md border-border shadow-none">
                              <Command className="w-full">
                                <CommandInput placeholder="Search courses..." className="w-full" />
                                <CommandEmpty>No courses found.</CommandEmpty>
                                <CommandGroup className="max-h-48 overflow-y-auto w-full">
                                  {targetableCourses.map(course => (
                                    <CommandItem key={course.id} value={course.title} className="w-full" onSelect={() => {
                                      const curr = field.value || [];
                                      field.onChange(curr.includes(course.id) ? curr.filter(id => id !== course.id) : [...curr, course.id]);
                                    }}>
                                      <Check className={cn("mr-2 h-4 w-4", field.value?.includes(course.id) ? "opacity-100" : "opacity-0")} />
                                      {course.title}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    {form.watch("status") === "scheduled" && (
                      <FormField control={form.control} name="publish_at" render={({ field }) => (
                        <FormItem className="flex flex-col w-full">
                          <FormLabel>Launch Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn(inputBaseStyles, "w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-md border-border shadow-none" align="start">
                              <UiCalendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus className="rounded-md" />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </div>
          <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-end gap-3 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="rounded-md h-9 px-4 shadow-none">Cancel</Button>
            <Button disabled={isSubmitting} onClick={form.handleSubmit(onSubmit)} className="rounded-md h-9 min-w-[140px] shadow-none bg-primary hover:bg-primary/90 text-primary-foreground">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {editingAnnouncement ? "Update Details" : "Send Announcement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[420px] p-0 border-border/80 rounded-md bg-background shadow-none overflow-hidden [&>button]:hidden">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30 flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <div className="p-2 bg-red-50 border border-red-100 rounded-md shadow-none"><AlertTriangle className="h-4 w-4 text-red-600" /></div>
              Confirm Deletion
            </DialogTitle>
            <DialogClose className="rounded-md p-1 hover:bg-muted transition-colors"><X className="h-4 w-4 text-muted-foreground" /></DialogClose>
          </DialogHeader>
          <div className="p-6 text-sm text-muted-foreground leading-relaxed">
            Permanent deletion of <span className="font-bold text-foreground">"{announcementToDelete?.title}"</span> cannot be reversed. 
            The post will be instantly removed from all curriculum feeds.
          </div>
          <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)} className="rounded-md h-9 shadow-none px-4">Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isSubmitting} className="rounded-md h-9 shadow-none px-4">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}