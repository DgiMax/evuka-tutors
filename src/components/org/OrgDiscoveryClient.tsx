"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api/axios";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Users,
  UserCheck,
  Clock,
  Building2,
  Send,
  X,
  Percent,
  UserPlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OrgPublic {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  branding: {
    logo_url?: string;
  };
  stats: {
    tutors: number;
    students: number;
  };
  is_member: boolean;
  has_pending_request: boolean;
}

const inputStyles = "h-12 px-4 rounded-md border-border bg-background transition-colors hover:border-primary focus-visible:ring-0 focus-visible:border-primary shadow-none outline-none w-full text-base";
const labelStyles = "text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1";

export default function OrgDiscoveryClient() {
  const [orgs, setOrgs] = useState<OrgPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchOrgs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);

      const res = await api.get(`/community/discover/?${params.toString()}`);
      setOrgs(res.data.results || res.data);
    } catch (error) {
      toast.error("Failed to load organizations.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const handleUpdateLocalStatus = (slug: string) => {
    setOrgs((prev) =>
      prev.map((o) => (o.slug === slug ? { ...o, has_pending_request: true } : o))
    );
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto p-6 md:p-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-4 uppercase tracking-tight">
            Discover Organizations
          </h1>
          <p className="text-muted-foreground font-medium">
            Join professional communities as a Tutor or Administrator.
          </p>
        </div>

        <div className="relative mb-12 max-w-xl mx-auto">
          <Input
            placeholder="SEARCH COMMUNITIES..."
            className="pl-12 h-14 rounded-md border-border bg-white shadow-none focus-visible:ring-0 focus-visible:border-primary uppercase text-xs font-bold tracking-widest"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orgs.map((org) => (
              <OrgCard
                key={org.slug}
                org={org}
                onUpdate={() => handleUpdateLocalStatus(org.slug)}
                isAuth={!!user}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrgCard({ org, onUpdate, isAuth }: { org: OrgPublic; onUpdate: () => void; isAuth: boolean }) {
  const logoUrl = org.logo || org.branding?.logo_url;

  return (
    <Card className="rounded-md overflow-hidden flex flex-col transition-all border border-border hover:border-primary shadow-none p-0 h-full bg-white">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-start gap-4 mb-5">
          <Avatar className="h-16 w-16 rounded-md border border-border shrink-0 shadow-none">
            <AvatarImage src={logoUrl || ""} className="object-cover" />
            <AvatarFallback className="bg-primary/5 text-primary font-black rounded-md text-xl">
              {org.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground truncate uppercase tracking-tight">
              {org.name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <Users className="h-3 w-3" /> {org.stats.tutors} Tutors
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <Users className="h-3 w-3" /> {org.stats.students} Students
              </span>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-xs font-medium leading-relaxed line-clamp-3 mb-4">
          {org.description || "Apply for a professional role within this organization."}
        </p>
      </CardContent>

      <CardFooter className="mt-auto bg-muted/20 p-5 border-t border-border">
        {org.is_member ? (
          <Button variant="outline" className="w-full h-11 rounded-md font-bold text-[10px] uppercase tracking-widest border-border text-emerald-600 bg-white" disabled>
            <UserCheck className="mr-2 h-4 w-4" /> Already Member
          </Button>
        ) : org.has_pending_request ? (
          <Button variant="outline" className="w-full h-11 rounded-md font-bold text-[10px] uppercase tracking-widest border-border text-primary bg-white" disabled>
            <Clock className="mr-2 h-4 w-4" /> Request Pending
          </Button>
        ) : (
          <JoinRequestModal org={org} isAuth={isAuth} onSuccess={onUpdate} />
        )}
      </CardFooter>
    </Card>
  );
}

function JoinRequestModal({ org, isAuth, onSuccess }: { org: OrgPublic; isAuth: boolean; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [desiredRole, setDesiredRole] = useState<string>("tutor");
  const [proposedCommission, setProposedCommission] = useState<string>("40");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (!isAuth) {
      router.push(`/login?next=/discover`);
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        organization: org.slug,
        desired_role: desiredRole,
        proposed_commission: parseFloat(proposedCommission),
        message,
      };
      await api.post("/community/request-join/", payload);
      toast.success("Application submitted successfully");
      onSuccess();
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to send request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)} 
        className="w-full h-11 rounded-md font-bold text-[10px] uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-none"
      >
        Join Community
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95%] sm:max-w-[480px] lg:max-w-[600px] p-0 gap-0 max-h-[90vh] md:max-h-[85vh] h-auto flex flex-col border-border/80 shadow-2xl rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[5%] md:top-[10%] translate-y-0">
          
          <DialogHeader className="px-4 py-3 md:py-4 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
            <DialogTitle className="text-base md:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2 uppercase">
              <UserPlus className="w-5 h-5 text-primary" />
              Membership Request
            </DialogTitle>
            <DialogClose className="rounded-md p-2 hover:bg-muted transition" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </DialogClose>
          </DialogHeader>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-none">
              
              <div className="flex items-center gap-4 p-4 rounded-md border border-border bg-muted/10 mb-2">
                <Avatar className="h-12 w-12 rounded-md border shadow-none shrink-0">
                  <AvatarImage src={org.logo || ""} />
                  <AvatarFallback className="rounded-md bg-primary/10 text-primary font-black text-xs">
                    {org.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm md:text-base truncate text-foreground">{org.name}</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Professional Application</p>
                </div>
              </div>

              {/* Position Selection */}
              <div className="space-y-1">
                <Label className={labelStyles}>Desired Role</Label>
                <Select value={desiredRole} onValueChange={setDesiredRole}>
                  <SelectTrigger className={inputStyles}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border-border shadow-xl">
                    <SelectItem value="tutor" className="text-sm font-medium py-3">Tutor (Teaching Staff)</SelectItem>
                    <SelectItem value="admin" className="text-sm font-medium py-3">Administrator (Staff + Admin Access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Commission Share */}
              <div className="p-5 rounded-md border border-primary/20 bg-primary/[0.02] space-y-4">
                <div className="space-y-1">
                  <Label className={labelStyles}>Proposed Commission (%)</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      min="40" 
                      max="100"
                      value={proposedCommission} 
                      onChange={(e) => setProposedCommission(e.target.value)} 
                      className={inputStyles} 
                    />
                    <Percent className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 italic tracking-tighter">Min: 40% (Shared revenue for classes taught)</p>
                </div>
              </div>

              {/* Introduction */}
              <div className="space-y-1">
                <Label className={labelStyles}>Message to Admins</Label>
                <Textarea 
                  placeholder="Introduce yourself and explain why you'd like to join..."
                  className="resize-none text-base border-border bg-background transition-colors hover:border-primary focus-visible:ring-0 focus-visible:border-primary shadow-none outline-none w-full min-h-[120px] p-4"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="px-4 md:px-6 py-3 md:py-4 border-t bg-background shrink-0 mt-auto">
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="w-full h-12 text-sm md:text-base font-bold shadow-sm transition-all active:scale-[0.98] bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )} 
              Submit Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}