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
  ChevronsUpDown,
  Save
} from "lucide-react";

import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="grid grid-cols-1 md:hidden gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} height={140} borderRadius={6} />)}
      </div>
      <div className="hidden md:block">
        <Skeleton height={400} borderRadius={6} />
      </div>
    </div>
  </SkeletonTheme>
);

const inputBaseStyles = "h-12 px-4 rounded-md border-border bg-background transition-colors hover:border-secondary focus-visible:ring-0 focus-visible:border-secondary shadow-none outline-none w-full text-base";

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
    if (s === "published") return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-md shadow-none font-medium text-[10px] md:text-xs">Published</Badge>;
    if (s === "pending_approval") return <Badge className="bg-amber-50 text-amber-700 border-amber-100 rounded-md shadow-none font-medium text-[10px] md:text-xs">Pending</Badge>;
    if (s === "scheduled") return <Badge className="bg-blue-50 text-blue-700 border-blue-100 rounded-md shadow-none font-medium text-[10px] md:text-xs">Scheduled</Badge>;
    return <Badge className="bg-muted text-muted-foreground border-transparent rounded-md shadow-none font-medium text-[10px] md:text-xs">Draft</Badge>;
  };

  if (isLoading) return <AnnouncementSkeleton />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">Broadcast updates to your students.</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full md:w-auto rounded-md h-12 px-6 gap-2 shadow-none font-bold active:scale-[0.98]">
          <Plus size={20} /> Create Announcement
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card shadow-none overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border bg-muted/10">
          <h3 className="font-semibold text-base">History</h3>
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-border hover:bg-muted/30">
                <TableHead className="pl-6 h-12 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Post Details</TableHead>
                <TableHead className="h-12 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Audience</TableHead>
                <TableHead className="h-12 text-[10px] uppercase tracking-widest font-bold text-muted-foreground text-center">Status</TableHead>
                <TableHead className="h-12 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Created</TableHead>
                <TableHead className="pr-6 h-12 w-[60px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.length > 0 ? announcements.map((ann) => (
                <TableRow key={ann.id} className="border-border hover:bg-muted/10 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <p className="font-semibold text-foreground text-sm truncate max-w-[240px]">{ann.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-[340px] mt-0.5">{ann.content}</p>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-primary" />
                      <span className="text-xs font-medium capitalize">{ann.audience_type.replace(/_/g, ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-center">{getStatusBadge(ann.status)}</TableCell>
                  <TableCell className="py-4 text-xs text-muted-foreground">{format(new Date(ann.created_at), "MMM d, y")}</TableCell>
                  <TableCell className="pr-6 py-4 text-right w-[60px]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 border-none bg-transparent hover:bg-muted rounded-md shadow-none p-0 transition-none"><MoreVertical size={16} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-md border-border shadow-none min-w-[160px]">
                        <DropdownMenuItem onClick={() => setSelectedAnnouncement(ann)} className="text-sm py-2 cursor-pointer"><Eye className="mr-2 h-4 w-4" /> View Post</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(ann)} className="text-sm py-2 cursor-pointer"><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setAnnouncementToDelete(ann); setIsDeleteOpen(true); }} className="text-sm py-2 text-red-600 focus:text-red-600 cursor-pointer"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="h-48 text-center opacity-50">No announcements found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="lg:hidden p-3 space-y-3 bg-muted/5">
          {announcements.length > 0 ? announcements.map((ann) => (
            <Card key={ann.id} className="border-border shadow-none rounded-md bg-background p-0">
              <CardContent className="p-3.5 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1 overflow-hidden">
                    {getStatusBadge(ann.status)}
                    <h4 className="font-bold text-sm text-foreground pt-0.5 leading-tight truncate">{ann.title}</h4>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1 border-none bg-transparent hover:bg-muted rounded-md shadow-none p-0 transition-none"><MoreVertical size={14} /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="shadow-none rounded-md">
                      <DropdownMenuItem onClick={() => handleOpenEdit(ann)} className="text-xs"><Pencil className="mr-2 h-3 w-3" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setAnnouncementToDelete(ann); setIsDeleteOpen(true); }} className="text-xs text-red-600"><Trash2 className="mr-2 h-3 w-3" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">{ann.content}</p>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tight"><Users size={11} className="text-primary" /> {ann.audience_type.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] text-muted-foreground">{format(new Date(ann.created_at), "MMM d")}</span>
                </div>

                <Button variant="outline" onClick={() => setSelectedAnnouncement(ann)} className="w-full h-9 font-bold text-[11px] uppercase tracking-wider rounded-md shadow-none">View Details</Button>
              </CardContent>
            </Card>
          )) : <div className="py-12 text-center text-xs opacity-40">No entries</div>}
        </div>
      </div>

      <Dialog open={!!selectedAnnouncement} onOpenChange={(open) => !open && setSelectedAnnouncement(null)}>
        <DialogContent className="w-[95%] sm:max-w-[480px] lg:max-w-[650px] p-0 gap-0 max-h-[90vh] md:max-h-[85vh] h-auto flex flex-col border-border/80 rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[5%] md:top-[10%] translate-y-0 shadow-none">
          {selectedAnnouncement && (
            <>
              <DialogHeader className="px-4 md:px-6 py-3 md:py-4 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
                <DialogTitle className="text-base md:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2 truncate pr-4">
                  <Megaphone className="w-5 h-5 text-primary" />
                  <span className="truncate">Post Insight</span>
                </DialogTitle>
                <DialogClose className="rounded-md p-2 hover:bg-muted transition shadow-none"><X className="h-5 w-5 text-muted-foreground" /></DialogClose>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20">
                <div className="space-y-4">
                  <h2 className="text-lg md:text-xl font-bold leading-tight">{selectedAnnouncement.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(selectedAnnouncement.status)}
                    <Badge variant="outline" className="rounded-md border-border bg-muted/10 text-[10px] md:text-xs font-bold px-3 py-1 uppercase tracking-widest">{selectedAnnouncement.audience_type.replace(/_/g, ' ')}</Badge>
                  </div>
                </div>

                <div className="bg-muted/5 border border-border rounded-md p-5 text-sm md:text-base leading-relaxed text-foreground/80 whitespace-pre-wrap">{selectedAnnouncement.content}</div>

                <div className="pt-6 border-t border-border grid grid-cols-2 gap-4 text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  <div className="space-y-1"><span>Created</span><p className="text-foreground">{format(new Date(selectedAnnouncement.created_at), "PPP")}</p></div>
                  {selectedAnnouncement.organization_name && <div className="space-y-1"><span>Organization</span><p className="text-primary">{selectedAnnouncement.organization_name}</p></div>}
                </div>
              </div>

              <div className="px-4 md:px-6 py-3 md:py-4 border-t bg-background shrink-0 mt-auto">
                <Button variant="outline" onClick={() => setSelectedAnnouncement(null)} className="w-full h-12 text-sm md:text-base font-bold rounded-md shadow-none active:scale-[0.98]">Close Details</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[95%] sm:max-w-[480px] lg:max-w-[700px] p-0 gap-0 max-h-[90vh] md:max-h-[85vh] h-auto flex flex-col border-border/80 rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[5%] md:top-[10%] translate-y-0 shadow-none">
          <DialogHeader className="px-4 md:px-6 py-3 md:py-4 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 z-10">
            <DialogTitle className="text-base md:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {editingAnnouncement ? "Refine Announcement" : "Draft Broadcast"}
            </DialogTitle>
            <DialogClose className="rounded-md p-2 hover:bg-muted transition shadow-none"><X className="h-5 w-5 text-muted-foreground" /></DialogClose>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20">
            <Form {...form}>
              <form id="announcement-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Subject Headline</FormLabel>
                    <FormControl><Input {...field} className={inputBaseStyles} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Message Body</FormLabel>
                    <FormControl><Textarea {...field} className="min-h-[140px] md:min-h-[200px] rounded-md resize-none border-border focus-visible:ring-0 focus-visible:border-secondary p-4 text-base shadow-none outline-none" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <FormField control={form.control} name="audience_type" render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Audience Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!!editingAnnouncement}>
                        <FormControl><SelectTrigger className={inputBaseStyles}><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent className="rounded-md shadow-none border-border">
                          {activeSlug ? (
                            isOrgAdmin ? [
                              { id: "all_org_courses", name: "All Org Students" },
                              { id: "my_org_courses", name: "My Courses" },
                              { id: "specific_courses", name: "Specific Pick" }
                            ].map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>)
                            : [
                              { id: "my_org_courses", name: "My Courses" },
                              { id: "specific_courses", name: "Specific Pick" }
                            ].map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>)
                          ) : [
                            { id: "all_personal_courses", name: "All Students" },
                            { id: "specific_courses", name: "Specific Pick" }
                          ].map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Post Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={field.value === 'published' && !!editingAnnouncement}>
                        <FormControl><SelectTrigger className={inputBaseStyles}><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                        <SelectContent className="rounded-md shadow-none border-border">
                          {["draft", "pending_approval", "scheduled", "published"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  {form.watch("audience_type") === "specific_courses" && (
                    <FormField control={form.control} name="courses" render={({ field }) => (
                      <FormItem className="flex flex-col space-y-1">
                        <FormLabel className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Choose Curriculum</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn(inputBaseStyles, "justify-between font-normal shadow-none")}>
                              {field.value?.length ? `${field.value.length} selected` : "Select..."}
                              <ChevronsUpDown size={14} className="opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-[--radix-popover-trigger-width] min-w-[280px] p-0 border-border shadow-none rounded-md">
                            <Command>
                              <CommandInput placeholder="Search..." className="h-12" />
                              <CommandEmpty className="p-4 text-center text-xs">None</CommandEmpty>
                              <CommandGroup className="max-h-60 overflow-y-auto">
                                {targetableCourses.map(course => (
                                  <CommandItem key={course.id} value={course.title} onSelect={() => {
                                    const curr = field.value || [];
                                    field.onChange(curr.includes(course.id) ? curr.filter(id => id !== course.id) : [...curr, course.id]);
                                  }} className="flex items-center gap-2 py-3 px-4">
                                    <Check className={cn("h-4 w-4 text-primary", field.value?.includes(course.id) ? "opacity-100" : "opacity-0")} />
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
                      <FormItem className="flex flex-col space-y-1">
                        <FormLabel className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Schedule At</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn(inputBaseStyles, "justify-between font-normal shadow-none", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Set date</span>}
                              <Calendar size={14} className="opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-border rounded-md shadow-none" align="start">
                            <UiCalendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </div>
              </form>
            </Form>
          </div>

          <div className="px-4 md:px-6 py-3 md:py-4 border-t bg-background shrink-0 mt-auto">
            <Button type="submit" form="announcement-form" disabled={isSubmitting} className="w-full h-12 text-sm md:text-base font-bold rounded-md shadow-none transition-all active:scale-[0.98]">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />} 
              {editingAnnouncement ? "Save Changes" : "Broadcast Now"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="w-[95%] sm:max-w-[420px] p-0 border-border/80 rounded-md bg-background overflow-hidden top-[5%] md:top-[20%] translate-y-0 shadow-none [&>button]:hidden">
          <DialogHeader className="px-6 py-4 border-b bg-red-50/50 flex flex-row items-center justify-between shadow-none">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Remove Broadcast
            </DialogTitle>
            <DialogClose className="p-2 hover:bg-muted rounded-md transition shadow-none"><X className="h-4 w-4" /></DialogClose>
          </DialogHeader>
          <div className="p-6 text-sm text-muted-foreground leading-relaxed">
            Permanent removal of <span className="font-bold text-foreground">"{announcementToDelete?.title}"</span> cannot be undone. 
            The broadcast will disappear from student feeds immediately.
          </div>
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3 mt-auto">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="w-full h-11 font-bold rounded-md shadow-none">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting} className="w-full h-11 font-bold rounded-md shadow-none">
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Delete Permanently"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}