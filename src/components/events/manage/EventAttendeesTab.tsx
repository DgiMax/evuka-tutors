import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Edit, Save, Inbox, User, Mail, Ticket, Search, Download } from "lucide-react";
import { format } from "date-fns";

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

const EventAttendeesTab: React.FC<EventAttendeesTabProps> = ({ eventSlug }) => {
  const queryClient = useQueryClient();
  const [selectedAttendee, setSelectedAttendee] = useState<EventAttendee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: attendees, isLoading } = useQuery<EventAttendee[]>({
    queryKey: ["eventAttendees", eventSlug],
    queryFn: async () => {
      const res = await api.get(`/events/tutor-events/${eventSlug}/attendees/`);
      return res.data;
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

  const filteredAttendees = attendees?.filter(a => 
    a.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.ticket_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <CardTitle>Registered Attendees ({attendees?.length || 0})</CardTitle>
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
                        <span className="font-semibold">{attendee.user_name}</span>
                    </div>
                    {getStatusBadge(attendee.status)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {attendee.user_email}</div>
                    <div className="flex items-center gap-2"><Ticket className="h-3 w-3" /> {attendee.ticket_id.slice(0,8).toUpperCase()}</div>
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
                            <span className="font-medium">{attendee.user_name}</span>
                            <span className="text-xs text-muted-foreground">{attendee.user_email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {attendee.ticket_id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(attendee.registered_at), "MMM d, yyyy")}
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
    <DialogContent className="sm:max-w-md p-0 top-[10%] translate-y-0 max-h-[85vh] flex flex-col gap-0">
      <div className="p-4 border-b bg-muted/40 rounded-t-lg shrink-0">
        <DialogTitle>Update Attendee Status</DialogTitle>
        <p className="text-sm text-muted-foreground mt-1">
            Attendee: <span className="font-medium text-foreground">{attendee.user_name}</span>
        </p>
      </div>
      <div className="p-6">
        <Form {...form}>
            <form id="attendee-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Attendance Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="registered">Registered</SelectItem>
                        <SelectItem value="attended">Attended</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            </form>
        </Form>
      </div>
      <div className="p-4 border-t bg-muted/40 rounded-b-lg flex justify-end shrink-0">
        <Button type="submit" form="attendee-form" disabled={isUpdating} className="w-full sm:w-auto">
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
        </Button>
      </div>
    </DialogContent>
  );
};