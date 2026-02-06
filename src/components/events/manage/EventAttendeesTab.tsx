import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Edit, AlertCircle, Inbox, User, Mail, Ticket, Search, Download, X } from "lucide-react";
import { format, isValid } from "date-fns";

import api from "@/lib/api/axios";
import {
  EventAttendee,
  UpdateAttendeeSchema,
  UpdateAttendeeValues,
} from "./EventSharedTypes";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface EventAttendeesTabProps {
  eventSlug: string;
}

const EmptyState: React.FC<{ message: string; }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg bg-muted/50 p-4">
    <Inbox className="h-8 w-8 text-muted-foreground" />
    <p className="text-muted-foreground mt-2 text-center text-sm">{message}</p>
  </div>
);

const formatDateSafe = (dateStr: string | undefined) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return isValid(date) ? format(date, "MMM d, yyyy") : "N/A";
};

const EventAttendeesTab: React.FC<EventAttendeesTabProps> = ({ eventSlug }) => {
  const queryClient = useQueryClient();
  const [selectedAttendee, setSelectedAttendee] = useState<EventAttendee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: attendees = [], isLoading } = useQuery<EventAttendee[]>({
    queryKey: ["eventAttendees", eventSlug],
    queryFn: async () => {
      const res = await api.get(`/events/tutor-events/${eventSlug}/attendees/`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const { mutate: updateAttendee, isPending: isUpdating } = useMutation({
    mutationFn: (data: UpdateAttendeeValues & { id: number }) =>
      api.patch(`/events/tutor-events/${eventSlug}/attendees/${data.id}/`, data),
    onSuccess: () => {
      toast.success("Attendee status updated.");
      queryClient.invalidateQueries({ queryKey: ["eventAttendees", eventSlug] });
      setSelectedAttendee(null);
    },
    onError: () => toast.error("Failed to update attendee."),
  });

  const filteredAttendees = attendees.filter(a => {
    const name = a.user_name || '';
    const email = a.user_email || '';
    const ticket = a.ticket_id || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ticket.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
        case "attended": return <Badge className="bg-green-600 hover:bg-green-700">Attended</Badge>;
        case "registered": return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Registered</Badge>;
        case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
        default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
        case "paid": return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Paid</Badge>;
        case "free": return <Badge variant="outline">Free</Badge>;
        case "pending": return <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">Pending</Badge>;
        default: return null;
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-6 w-6 text-primary"/></div>;

  return (
    <Card className="p-0">
      <CardHeader className="p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
                <CardTitle>Registered Attendees ({attendees.length})</CardTitle>
                <CardDescription>Manage registrations, check-ins, and cancellations.</CardDescription>
            </div>
            <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="mb-4">
            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by name, email, or ticket ID..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {!filteredAttendees || filteredAttendees.length === 0 ? (
          <EmptyState message="No attendees found matching your search." />
        ) : (
          <>
            <div className="space-y-4 md:hidden">
              {filteredAttendees.map((attendee) => (
                <Card key={attendee.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{attendee.user_name || 'N/A'}</span>
                    </div>
                    {getStatusBadge(attendee.status)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {attendee.user_email || 'N/A'}</div>
                    <div className="flex items-center gap-2">
                      <Ticket className="h-3 w-3" /> 
                      {attendee.ticket_id ? attendee.ticket_id.slice(0, 8).toUpperCase() : 'N/A'}
                    </div>
                  </div>
                  <div className="flex justify-end pt-2 border-t">
                    <Dialog open={selectedAttendee?.id === attendee.id} onOpenChange={(open) => !open && setSelectedAttendee(null)}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedAttendee(attendee)}>
                                <Edit size={14} className="mr-1" /> Edit Status
                            </Button>
                        </DialogTrigger>
                        {selectedAttendee && selectedAttendee.id === attendee.id && (
                            <UpdateAttendeeDialog
                                attendee={selectedAttendee}
                                updateAttendee={updateAttendee}
                                isUpdating={isUpdating}
                            />
                        )}
                    </Dialog>
                  </div>
                </Card>
              ))}
            </div>

            <div className="border rounded-lg overflow-hidden hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attendee</TableHead>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendees.map((attendee) => (
                    <TableRow key={attendee.id}>
                      <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium">{attendee.user_name || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">{attendee.user_email || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                       {attendee.ticket_id ? attendee.ticket_id.slice(0, 8).toUpperCase() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateSafe(attendee.registered_at)}
                      </TableCell>
                      <TableCell>{getPaymentBadge(attendee.payment_status)}</TableCell>
                      <TableCell>{getStatusBadge(attendee.status)}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={selectedAttendee?.id === attendee.id} onOpenChange={(open) => !open && setSelectedAttendee(null)}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="ghost" onClick={() => setSelectedAttendee(attendee)}>
                                    <Edit size={14} className="mr-1" /> Edit
                                </Button>
                            </DialogTrigger>
                            {selectedAttendee && selectedAttendee.id === attendee.id && (
                                <UpdateAttendeeDialog
                                    attendee={selectedAttendee}
                                    updateAttendee={updateAttendee}
                                    isUpdating={isUpdating}
                                />
                            )}
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EventAttendeesTab;

const UpdateAttendeeDialog: React.FC<{
  attendee: EventAttendee;
  updateAttendee: any;
  isUpdating: boolean;
}> = ({ attendee, updateAttendee, isUpdating }) => {
  const form = useForm<UpdateAttendeeValues>({
    resolver: zodResolver(UpdateAttendeeSchema),
    defaultValues: { status: attendee.status },
  });

  const onSubmit: SubmitHandler<UpdateAttendeeValues> = (data) => {
    updateAttendee({ id: attendee.id, ...data });
  };

  return (
    <DialogContent 
      className="w-[95%] sm:max-w-[420px] p-0 gap-0 border-border/80 rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[5%] md:top-[10%] translate-y-0 shadow-none"
    >
      <DialogHeader className="px-4 md:px-6 py-4 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <User className="h-4 w-4 text-primary" />
          </div>
          <DialogTitle className="text-base md:text-lg font-bold tracking-tight text-foreground">
            Update Status
          </DialogTitle>
        </div>
        <DialogClose className="rounded-md p-2 hover:bg-muted transition -mr-2">
          <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </DialogClose>
      </DialogHeader>

      <div className="p-4 md:p-6">
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-sm text-foreground font-bold tracking-tight">
              Attendee Information
            </p>
            <div className="text-xs text-muted-foreground leading-relaxed flex flex-col gap-1 bg-muted/30 p-3 rounded-md border border-border/50">
              <span className="font-bold text-foreground/80 uppercase tracking-wider text-[10px]">Name: {attendee.user_name}</span>
              <span className="opacity-80">Email: {attendee.user_email}</span>
              <span className="opacity-80 font-mono">Ticket: {(attendee.ticket_id ?? 'N/A').toUpperCase()}</span>
            </div>
          </div>

          <Form {...form}>
            <form id="attendee-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      New Attendance State
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 bg-background border-border w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="registered">Registered</SelectItem>
                        <SelectItem value="attended">Attended</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px] uppercase font-bold" />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <div className="bg-primary/5 border border-primary/10 rounded-md p-3 flex gap-3 items-start">
            <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] md:text-[11px] text-primary font-bold uppercase tracking-wider leading-normal">
              Changing status will update the guest list and event analytics in real-time.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-4 border-t bg-muted/20 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0 mt-auto">
        <DialogClose asChild>
          <Button 
            variant="outline" 
            disabled={isUpdating}
            className="h-11 md:h-10 w-full sm:w-auto px-6 rounded-md font-bold text-[11px] md:text-xs uppercase tracking-widest border-border shadow-none bg-background"
          >
            Cancel
          </Button>
        </DialogClose>
        <Button 
          type="submit"
          form="attendee-form"
          disabled={isUpdating}
          className="h-11 md:h-10 w-full sm:w-auto px-6 rounded-md font-bold text-[11px] md:text-xs uppercase tracking-widest shadow-none bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isUpdating ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin h-3 w-3" />
              <span>Saving...</span>
            </div>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </DialogContent>
  );
};