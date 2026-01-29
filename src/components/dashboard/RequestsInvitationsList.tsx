"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/api/axios";
import { toast } from "sonner";
import { 
    Loader2, Mail, Send, Check, Inbox, 
    Building2, RefreshCw, Trash2, X,
    DollarSign, UserCog, CalendarPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

const inputStyles = "h-12 px-4 rounded-md border-border bg-background transition-colors hover:border-secondary focus-visible:ring-0 focus-visible:border-secondary shadow-none outline-none w-full text-base";
const labelStyles = "text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1";

export default function RequestsInvitationsList() {
  const { activeSlug } = useActiveOrg();
  const { user: currentUser } = useAuth();
  
  const [invitations, setInvitations] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvite, setSelectedInvite] = useState<any | null>(null);

  const isAdmin = useMemo(() => {
    if (!activeSlug) return false;
    const membership = currentUser?.organizations?.find((o: any) => o.organization_slug === activeSlug);
    return membership?.role === "admin" || membership?.role === "owner";
  }, [currentUser, activeSlug]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = activeSlug ? { "X-Organization-Slug": activeSlug } : {};
      const [invitesRes, requestsRes] = await Promise.all([
        api.get("/community/invitations/", { headers }),
        api.get("/community/requests/", { headers }),
      ]);
      setInvitations(invitesRes.data.results || invitesRes.data || []);
      setRequests(requestsRes.data.results || requestsRes.data || []);
    } catch (error) {
      setInvitations([]);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (id: number, type: 'invitation' | 'request') => {
    try {
      const headers = activeSlug ? { "X-Organization-Slug": activeSlug } : {};
      let url = "";
      if (type === 'invitation') {
        url = activeSlug ? `/community/invitations/${id}/revoke/` : `/community/invitations/${id}/`;
      } else {
        url = activeSlug ? `/community/requests/${id}/reject/` : `/community/requests/${id}/cancel/`;
      }
      await api.post(url, {}, { headers });
      toast.success("Action completed successfully");
      fetchData();
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  if (activeSlug && !isAdmin) return null;
  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <Card className="border border-border shadow-none rounded-md overflow-hidden bg-white">
      <Tabs defaultValue="invitations" className="w-full">
        <div className="px-4 md:px-6 pt-4 md:pt-4 bg-muted/20">
          <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 rounded-md gap-1">
            <TabsTrigger 
              value="invitations" 
              className="rounded-md transition-all text-[10px] md:text-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground"
            >
              <Mail className="h-4 w-4 mr-2" /> 
              Invites ({invitations.length})
            </TabsTrigger>
            <TabsTrigger 
              value="requests" 
              className="rounded-md transition-all text-[10px] md:text-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground"
            >
              <Send className="h-4 w-4 mr-2" /> 
              Requests ({requests.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="max-h-[600px] overflow-y-auto custom-scrollbar border-t border-border">
          <TabsContent value="invitations" className="outline-none m-0">
            {invitations.length > 0 ? (
              <div className="divide-y divide-border">
                {invitations.map((inv) => (
                  <div key={inv.id}>
                    <div className="hidden sm:flex items-center justify-between p-5 gap-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <Avatar className="h-12 w-12 rounded-md border shrink-0">
                          <AvatarImage src={inv.organization?.logo || ""} />
                          <AvatarFallback className="bg-primary/5 text-primary font-black rounded-md text-xs">
                            {activeSlug ? (inv.email?.[0]?.toUpperCase() || "U") : (inv.organization?.name?.substring(0, 2).toUpperCase() || "O")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-foreground truncate">{activeSlug ? inv.email : inv.organization?.name}</h3>
                            <Badge variant="outline" className="text-[9px] font-black uppercase h-5 px-1.5 rounded-sm border-border bg-background">{inv.gov_role}</Badge>
                          </div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            {activeSlug ? `Status: ${inv.gov_status}` : `By ${inv.invited_by_name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {inv.is_tutor_invite && (
                          <div className="flex flex-col items-end mr-2">
                            <span className="text-[10px] font-black text-primary uppercase">{inv.tutor_commission}% Share</span>
                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Teaching Terms</span>
                          </div>
                        )}
                        {!activeSlug ? (
                          <Button size="sm" onClick={() => setSelectedInvite(inv)} className="h-10 px-5 rounded-md font-bold text-[10px] uppercase tracking-widest shadow-none bg-primary hover:bg-primary/90">
                            Review
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-10 px-5 rounded-md font-bold text-[10px] uppercase text-muted-foreground hover:text-destructive tracking-widest border-border shadow-none" onClick={() => handleAction(inv.id, 'invitation')}>
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:hidden flex-col p-4 gap-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-md border shrink-0">
                          <AvatarFallback className="bg-primary/5 text-primary font-black rounded-md text-[10px]">
                            {activeSlug ? (inv.email?.[0]?.toUpperCase() || "U") : (inv.organization?.name?.substring(0, 2).toUpperCase() || "O")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm text-foreground truncate">{activeSlug ? inv.email : inv.organization?.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                             <Badge variant="outline" className="text-[8px] font-black uppercase h-4 px-1 rounded-sm border-border">{inv.gov_role}</Badge>
                             <span className="text-[9px] font-bold text-muted-foreground uppercase">{inv.gov_status}</span>
                          </div>
                        </div>
                      </div>
                      {!activeSlug ? (
                        <Button size="sm" onClick={() => setSelectedInvite(inv)} className="h-11 w-full rounded-md font-bold text-[10px] uppercase tracking-widest shadow-none bg-primary">
                          Review Invitation
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-11 w-full rounded-md font-bold text-[10px] uppercase text-destructive tracking-widest border-border" onClick={() => handleAction(inv.id, 'invitation')}>
                          Revoke Access
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center">
                <Inbox className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">No pending invitations</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="outline-none m-0">
            {requests.length > 0 ? (
              <div className="divide-y divide-border">
                {requests.map((req) => (
                  <div key={req.id}>
                    <div className="hidden sm:flex items-center justify-between p-5 gap-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-12 w-12 rounded-md border border-border bg-muted/30 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">
                            {activeSlug ? (req.user?.full_name || req.user?.username) : req.organization?.name}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-[9px] font-black uppercase h-5 px-1.5 rounded-sm border-border bg-background">{req.status}</Badge>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                              <UserCog size={12} /> {req.desired_role}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeSlug ? (
                          <Button size="sm" asChild variant="secondary" className="h-10 px-5 rounded-md font-bold text-[10px] uppercase tracking-widest bg-muted border-none shadow-none">
                            <Link href={`/${activeSlug}/community/requests`}>Manage</Link>
                          </Button>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="h-10 px-5 rounded-md font-bold text-[10px] uppercase text-muted-foreground hover:text-destructive tracking-widest border-border shadow-none">
                                <Trash2 className="h-4 w-4 mr-2" /> Withdraw
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="w-[95%] sm:max-w-[420px] p-0 gap-0 border-border rounded-md bg-background overflow-hidden shadow-none top-[10%] translate-y-0">
                              <AlertDialogHeader className="px-6 py-4 border-b bg-muted/50 flex flex-row items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-red-100/50 flex items-center justify-center border border-red-200/60">
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </div>
                                <AlertDialogTitle className="text-base font-bold tracking-tight">Withdraw Request?</AlertDialogTitle>
                              </AlertDialogHeader>
                              <div className="p-6">
                                <AlertDialogDescription className="text-sm text-foreground/70">
                                  Are you sure you want to cancel your application to join <b>{req.organization?.name}</b>?
                                </AlertDialogDescription>
                              </div>
                              <AlertDialogFooter className="px-6 py-4 border-t bg-muted/20 flex flex-col-reverse sm:flex-row gap-3">
                                <AlertDialogCancel className="h-11 w-full sm:w-auto px-6 rounded-md font-bold text-[10px] uppercase tracking-widest border-border bg-background m-0">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleAction(req.id, 'request')} className="h-11 w-full sm:w-auto px-6 rounded-md font-bold text-[10px] uppercase tracking-widest bg-red-600 hover:bg-red-700 m-0">Withdraw</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:hidden flex-col p-4 gap-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md border border-border bg-muted/20 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm truncate">{activeSlug ? req.user?.username : req.organization?.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[8px] font-black uppercase h-4 px-1 rounded-sm">{req.desired_role}</Badge>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{req.status}</span>
                          </div>
                        </div>
                      </div>
                      {activeSlug ? (
                         <Button size="sm" asChild className="h-11 w-full rounded-md font-bold text-[10px] uppercase tracking-widest bg-muted text-foreground">
                            <Link href={`/${activeSlug}/community/requests`}>Manage Request</Link>
                         </Button>
                      ) : (
                         <Button size="sm" variant="outline" className="h-11 w-full rounded-md font-bold text-[10px] uppercase text-destructive border-border">
                            Withdraw Application
                         </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center">
                <Inbox className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">No pending join requests</p>
              </div>
            )}
          </TabsContent>
        </div>
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
    </Card>
  );
}

function NegotiationModal({ invite, isOpen, onClose, onSuccess }: { invite: any, isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const { fetchCurrentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'review' | 'counter'>('review');
  const [counterValue, setCounterValue] = useState(invite.tutor_commission?.toString() || "10");
  const [note, setNote] = useState("");

  const isFinalized = invite.gov_status !== 'pending' && (invite.is_tutor_invite ? (invite.tutor_status !== 'pending' && invite.tutor_status !== 'negotiating') : true);
  const isRejected = invite.gov_status === 'rejected' || invite.tutor_status === 'rejected';

  const handleAction = async (section: 'governance' | 'teaching', action: 'accept' | 'reject' | 'counter') => {
    setLoading(true);
    try {
      const payload: any = { section, action };
      if (action === 'counter') {
        payload.counter_value = parseFloat(counterValue);
        payload.note = note;
      }
      await api.post(`/community/invitations/${invite.id}/respond/`, payload);
      toast.success("Response sent successfully");
      if (action === 'accept') await fetchCurrentUser();
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95%] sm:max-w-[500px] lg:max-w-[600px] p-0 gap-0 max-h-[90vh] md:max-h-[85vh] h-auto flex flex-col border-border/80 shadow-2xl rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[5%] md:top-[10%] translate-y-0">
        
        <DialogHeader className="px-5 py-4 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-md border border-primary/20 shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm md:text-base font-bold tracking-tight text-foreground uppercase truncate">
                Invitation Review
              </DialogTitle>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.15em]">Ref: INV-{invite.id.toString().padStart(4, '0')}</p>
            </div>
          </div>
          <DialogClose className="rounded-md p-2 hover:bg-muted transition-colors shrink-0" onClick={onClose}>
            <X className="h-5 w-5 text-muted-foreground" />
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 md:px-8 py-6 space-y-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-none">
          
          <div className="flex items-center gap-4 p-4 rounded-md border border-border bg-muted/10">
            <Avatar className="h-12 w-12 rounded-md border shadow-none shrink-0">
              <AvatarImage src={invite.organization?.logo} />
              <AvatarFallback className="rounded-md bg-primary/10 text-primary font-black text-xs">
                {invite.organization?.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm md:text-base truncate text-foreground">{invite.organization?.name}</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Organization Invitation</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[9px]">01</span>
                  Governance & Access
                </h4>
                <Badge variant={invite.gov_status === 'pending' ? "outline" : "secondary"} className="rounded-sm uppercase text-[8px] font-black px-2 border-border shadow-none">
                  {invite.gov_status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-md border border-border bg-background transition-colors hover:border-secondary/30">
                  <p className="text-[9px] uppercase font-black text-muted-foreground mb-1 tracking-widest">Target Role</p>
                  <p className="text-xs md:text-sm font-bold flex items-center gap-2 capitalize text-foreground">
                    <UserCog className="w-3.5 h-3.5 text-primary" /> {invite.gov_role}
                  </p>
                </div>
                <div className="p-3.5 rounded-md border border-border bg-background transition-colors hover:border-secondary/30">
                  <p className="text-[9px] uppercase font-black text-muted-foreground mb-1 tracking-widest">Scope</p>
                  <p className="text-xs md:text-sm font-bold flex items-center gap-2 text-foreground">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Administrative
                  </p>
                </div>
              </div>

              {invite.gov_status === 'pending' && (
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button variant="outline" onClick={() => handleAction('governance', 'reject')} disabled={loading} className="flex-1 h-11 text-[10px] font-black uppercase border-border hover:bg-destructive hover:text-white transition-all shadow-none">
                    Reject Access
                  </Button>
                  <Button onClick={() => handleAction('governance', 'accept')} disabled={loading} className="flex-1 h-11 text-[10px] font-black uppercase bg-primary hover:bg-primary/90 shadow-none">
                    Accept Access
                  </Button>
                </div>
              )}
            </div>

            {invite.is_tutor_invite && (
              <div className="space-y-4 pt-6 border-t border-dashed border-border/60">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[9px]">02</span>
                    Teaching Agreement
                  </h4>
                  <Badge variant="outline" className="rounded-sm uppercase text-[8px] font-black px-2 border-primary/30 text-primary bg-primary/5 shadow-none">
                    {invite.tutor_status}
                  </Badge>
                </div>

                {mode === 'review' ? (
                  <div className="p-5 rounded-md border border-primary/20 bg-primary/[0.02] flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase font-black text-primary/70 mb-1 tracking-widest">Proposed Revenue Share</p>
                      <p className="text-3xl font-black font-mono tracking-tighter text-foreground">{invite.tutor_commission}%</p>
                    </div>
                    {invite.tutor_status === 'pending' || invite.tutor_status === 'negotiating' ? (
                      <div className="flex flex-col gap-2 shrink-0">
                         <Button size="sm" onClick={() => handleAction('teaching', 'accept')} disabled={loading} className="h-9 px-4 text-[9px] font-black uppercase bg-primary shadow-none">Accept</Button>
                         <Button size="sm" variant="ghost" onClick={() => setMode('counter')} className="h-9 px-4 text-[9px] font-black uppercase text-primary hover:bg-primary/5">Negotiate</Button>
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <Check className="w-5 h-5 text-emerald-600" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-muted/30 p-5 rounded-md space-y-5 border border-border animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Counter Proposal (%)</Label>
                      <div className="relative">
                        <Input type="number" value={counterValue} onChange={(e) => setCounterValue(e.target.value)} className="h-12 pl-4 pr-10 font-mono text-lg font-black border-border bg-background focus-visible:ring-0 focus-visible:border-primary shadow-none" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Proposal Context</Label>
                      <Textarea placeholder="Explain your requirements..." value={note} onChange={(e) => setNote(e.target.value)} className="h-24 resize-none p-4 text-sm border-border bg-background focus-visible:ring-0 focus-visible:border-primary shadow-none" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="ghost" onClick={() => setMode('review')} className="flex-1 text-[10px] font-black uppercase h-11">Cancel</Button>
                      <Button onClick={() => handleAction('teaching', 'counter')} disabled={loading || !counterValue} className="flex-1 text-[10px] font-black uppercase h-11 bg-primary shadow-none">
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Send Counter"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t bg-muted/20 shrink-0 mt-auto">
          {mode === 'counter' ? (
            <p className="text-[9px] text-center text-muted-foreground font-black uppercase tracking-[0.2em] py-2">
              Reviewing Counter Proposal Mode
            </p>
          ) : (
            <Button 
              variant={isRejected ? "destructive" : "secondary"} 
              onClick={onClose} 
              disabled={loading}
              className="w-full h-12 text-xs font-black uppercase tracking-[0.15em] shadow-none rounded-md transition-all active:scale-[0.98]"
            >
              {isFinalized ? "Close Summary" : isRejected ? "Invitation Rejected" : "Finish Review Later"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}