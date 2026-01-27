"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { toast } from "sonner";
import { 
    Loader2, Mail, Send, Check, Inbox, 
    Building2, Eye, RefreshCw, Trash2, ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface OrganizationSimple {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  org_type: string;
}

interface Invitation {
  id: number;
  organization: OrganizationSimple;
  invited_by: {
    full_name: string;
    username: string;
  };
  gov_role: string;
  gov_status: string;
  is_tutor_invite: boolean;
  tutor_commission: number;
  tutor_status: string;
  created_at: string;
}

interface JoinRequest {
  id: number;
  organization: OrganizationSimple;
  status: string;
  created_at: string;
}

export default function RequestsInvitationsList() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvite, setSelectedInvite] = useState<Invitation | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [invitesRes, requestsRes] = await Promise.all([
        api.get("/community/invitations/"),
        api.get("/community/my-join-requests/"),
      ]);
      setInvitations(invitesRes.data.results || invitesRes.data || []);
      setRequests(requestsRes.data.results || requestsRes.data || []);
    } catch (error) {
      toast.error("Failed to load community data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCancelRequest = async (id: number) => {
    try {
      await api.post(`/community/my-join-requests/${id}/cancel/`);
      toast.success("Join request cancelled.");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to cancel request.");
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  if (invitations.length === 0 && requests.length === 0) {
    return (
      <Card className="border-dashed shadow-none bg-muted/5">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted p-4 rounded-full mb-4"><Inbox className="h-8 w-8 text-muted-foreground/60" /></div>
            <h3 className="font-semibold text-lg text-foreground">All Caught Up</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">You have no pending invitations or active join requests.</p>
          </CardContent>
      </Card>
    );
  }

  return (
    <>
        <Tabs defaultValue={invitations.length > 0 ? "invitations" : "requests"} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50 rounded-lg">
            <TabsTrigger value="invitations" className="gap-2 py-2.5">
                <Mail className="h-4 w-4" /> <span>Invitations ({invitations.length})</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2 py-2.5">
                <Send className="h-4 w-4" /> <span>Sent Requests ({requests.length})</span>
            </TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="mt-6 space-y-4">
            {invitations.length > 0 ? invitations.map((inv) => (
            <Card key={inv.id} className="overflow-hidden border shadow-sm">
                <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row gap-4 p-5">
                        <div className="shrink-0">
                            <Avatar className="h-12 w-12 border">
                                <AvatarImage src={inv.organization.logo || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">{inv.organization.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-base">{inv.organization.name}</h3>
                                <Badge variant="outline" className="text-[10px] uppercase">{inv.organization.org_type}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Invited by <span className="font-medium text-foreground">{inv.invited_by?.full_name || inv.invited_by?.username}</span>
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {inv.gov_status !== 'accepted' && (
                                    <Badge variant="secondary" className="px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                                        Role: {inv.gov_role}
                                    </Badge>
                                )}
                                {inv.is_tutor_invite && inv.tutor_status !== 'accepted' && (
                                    <Badge variant="secondary" className="px-2 py-0.5 bg-orange-50 text-orange-700 border-orange-200">
                                        Offer: {inv.tutor_commission}% Comm
                                    </Badge>
                                )}
                                {inv.tutor_status === 'negotiating' && (
                                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">Negotiating</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-muted/30 px-5 py-3 flex justify-end gap-3 border-t">
                        <Button size="sm" onClick={() => setSelectedInvite(inv)} className="gap-2 font-medium">
                            <Eye className="h-4 w-4" /> Review & Respond
                        </Button>
                    </div>
                </CardContent>
            </Card>
            )) : <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">No pending invitations.</div>}
        </TabsContent>

        <TabsContent value="requests" className="mt-6 space-y-4">
            {requests.map((req) => (
            <Card key={req.id} className="border shadow-sm">
                <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h4 className="font-medium text-sm">Request to join {req.organization.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] capitalize">{req.status}</Badge>
                                <span className="text-xs text-muted-foreground">Sent {new Date(req.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Request?</AlertDialogTitle>
                                <AlertDialogDescription>Withdraw request to join <b>{req.organization.name}</b>?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Back</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancelRequest(req.id)} className="bg-destructive hover:bg-destructive/90">Yes, Cancel</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
            ))}
            {requests.length === 0 && <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">No sent requests.</div>}
        </TabsContent>
        </Tabs>

        {selectedInvite && (
            <NegotiationModal 
                invite={selectedInvite} 
                isOpen={!!selectedInvite} 
                onClose={() => setSelectedInvite(null)} 
                onSuccess={() => {
                    setSelectedInvite(null);
                    fetchData();
                }} 
            />
        )}
    </>
  );
}

function NegotiationModal({ invite, isOpen, onClose, onSuccess }: { invite: Invitation, isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
    const { fetchCurrentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'review' | 'counter'>('review');
    const [counterValue, setCounterValue] = useState(invite.tutor_commission.toString());
    const [note, setNote] = useState("");

    const handleAction = async (section: 'governance' | 'teaching', action: 'accept' | 'reject' | 'counter') => {
        setLoading(true);
        try {
            const payload: any = { section, action };
            if (action === 'counter') {
                payload.counter_value = parseFloat(counterValue);
                payload.note = note;
            }

            await api.post(`/community/invitations/${invite.id}/respond/`, payload);
            toast.success(action === 'counter' ? "Counter offer sent!" : `Term ${action}ed.`);
            
            if (action === 'accept') {
                await fetchCurrentUser();
                onSuccess(); 
            } else if (action === 'counter') {
                onSuccess();
            } else {
                onSuccess();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Action failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden">
                <div className="bg-muted/40 p-6 border-b">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Invitation from {invite.organization.name}
                        </DialogTitle>
                        <DialogDescription>
                            Review terms and accept to join the team.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    {invite.gov_status === 'pending' ? (
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-primary" /> Governance Role
                                    </h4>
                                    <p className="text-xs text-muted-foreground max-w-[300px]">
                                        Determines your administrative access level within the dashboard.
                                    </p>
                                </div>
                                <Badge variant="outline" className="h-7 px-3 text-sm uppercase tracking-wide font-semibold">{invite.gov_role}</Badge>
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <Button size="sm" variant="outline" onClick={() => handleAction('governance', 'reject')} disabled={loading} className="text-destructive hover:text-destructive">Decline Role</Button>
                                <Button size="sm" onClick={() => handleAction('governance', 'accept')} disabled={loading} className="bg-green-600 hover:bg-green-700"><Check className="h-3.5 w-3.5 mr-2"/> Accept Role</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-3 bg-muted/20 rounded border">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-muted-foreground">Governance role <b>{invite.gov_role}</b> has been {invite.gov_status}.</span>
                        </div>
                    )}

                    <Separator />

                    {invite.is_tutor_invite ? (
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <RefreshCw className="h-4 w-4 text-orange-600" /> Teaching Commission
                                    </h4>
                                    <p className="text-xs text-muted-foreground max-w-[300px]">
                                        Percentage of course revenue you retain.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-bold font-mono tracking-tight">{invite.tutor_commission}%</span>
                                    {mode === 'review' && <p className="text-[10px] text-muted-foreground uppercase font-medium">Proposed</p>}
                                </div>
                            </div>

                            {mode === 'review' ? (
                                <div className="flex gap-3 justify-end pt-2">
                                    <Button size="sm" variant="outline" onClick={() => handleAction('teaching', 'reject')} disabled={loading} className="text-destructive hover:text-destructive">Decline</Button>
                                    <Button size="sm" variant="outline" onClick={() => setMode('counter')} disabled={loading}><ArrowRightLeft className="h-3.5 w-3.5 mr-2"/> Negotiate</Button>
                                    <Button size="sm" onClick={() => handleAction('teaching', 'accept')} disabled={loading} className="bg-green-600 hover:bg-green-700"><Check className="h-3.5 w-3.5 mr-2"/> Accept Terms</Button>
                                </div>
                            ) : (
                                <div className="bg-muted/30 p-4 rounded-lg space-y-4 border animate-in fade-in zoom-in-95 duration-200">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Your Counter Offer (%)</Label>
                                        <div className="flex gap-3 items-center">
                                            <Input 
                                                type="number" min="10" max="100" 
                                                value={counterValue} 
                                                onChange={(e) => setCounterValue(e.target.value)} 
                                                className="w-28 font-mono text-lg h-10"
                                            />
                                            <span className="text-sm text-muted-foreground">for me</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Note</Label>
                                        <Textarea 
                                            placeholder="Reason for counter offer..." 
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            className="h-20 text-sm resize-none"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <Button size="sm" variant="ghost" onClick={() => setMode('review')}>Cancel</Button>
                                        <Button size="sm" onClick={() => handleAction('teaching', 'counter')} disabled={loading}>
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Send Counter Offer"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-2 text-sm text-muted-foreground italic">No teaching offer included.</div>
                    )}
                </div>
                <DialogFooter className="bg-muted/40 p-4 border-t">
                    <Button variant="ghost" onClick={onClose}>Close Preview</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}