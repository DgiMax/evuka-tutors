"use client";

import React, { useEffect, useState } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/axios";
import { 
    Loader2, 
    UserPlus, 
    MoreHorizontal, 
    Trash2, 
    Check,
    X,
    Clock,
    Users,
    Mail,
    AlertCircle,
    Shield,
    Ban
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- Types ---

interface TeamMember {
    id: number;
    user: {
        id: number;
        username: string;
        email: string;
        full_name?: string;
    };
    role: string;
    is_active: boolean;
    date_joined: string;
}

interface JoinRequest {
    id: number;
    user: {
        id: number;
        username: string;
        email: string;
        full_name?: string;
    };
    desired_role: string;
    proposed_commission: number;
    status: string;
    created_at: string;
}

interface SentInvitation {
    id: number;
    email: string;
    gov_role: string;
    gov_status: string;
    is_tutor_invite: boolean;
    tutor_commission: number;
    tutor_status: string;
    created_at: string;
}

// --- Helper Components ---

const RoleBadge = ({ role }: { role: string }) => {
    const styles: Record<string, string> = {
        owner: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100",
        admin: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
        tutor: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50",
        member: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
    };
    return (
        <Badge variant="outline" className={`capitalize font-medium shadow-none ${styles[role] || ""}`}>
            {role}
        </Badge>
    );
};

const StatusBadge = ({ status, active }: { status?: string; active?: boolean }) => {
    if (active !== undefined) {
        return active ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shadow-none gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-600" /> Active
            </Badge>
        ) : (
            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 shadow-none">
                Inactive
            </Badge>
        );
    }
    
    // String status
    const s = status?.toLowerCase();
    let style = "bg-slate-50 text-slate-600 border-slate-200";
    if (s === 'pending') style = "bg-amber-50 text-amber-700 border-amber-200";
    if (s === 'rejected' || s === 'revoked') style = "bg-red-50 text-red-700 border-red-200";
    if (s === 'accepted' || s === 'approved') style = "bg-green-50 text-green-700 border-green-200";

    return <Badge variant="outline" className={`capitalize shadow-none ${style}`}>{status}</Badge>;
};

const EmptyState = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-muted/50 p-4 rounded-full mb-4">
            <Icon className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>
    </div>
);

// --- Main Page Component ---

export default function OrgTeamClient() {
    const { activeSlug, activeRole } = useActiveOrg();
    const isAdmin = activeRole === 'owner' || activeRole === 'admin';

    // Prevent rendering without context
    if (!activeSlug) return null; 

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Team & Access</h1>
                    <p className="text-muted-foreground mt-1">Manage team members, roles, and pending invitations.</p>
                </div>
                {isAdmin && (
                    <InviteMemberModal activeSlug={activeSlug} onSuccess={() => window.location.reload()} />
                )}
            </div>

            {/* Tabs & Content */}
            <Tabs defaultValue="members" className="w-full space-y-6">
                <div className="w-full overflow-x-auto pb-2">
                    <TabsList className="h-auto p-1 bg-muted/50 rounded-lg inline-flex">
                        <TabsTrigger value="members" className="px-4 py-2 text-sm font-medium gap-2">
                            <Users className="h-4 w-4" /> Active Team
                        </TabsTrigger>
                        {isAdmin && (
                            <>
                                <TabsTrigger value="requests" className="px-4 py-2 text-sm font-medium gap-2">
                                    <Clock className="h-4 w-4" /> Join Requests
                                </TabsTrigger>
                                <TabsTrigger value="invitations" className="px-4 py-2 text-sm font-medium gap-2">
                                    <Mail className="h-4 w-4" /> Sent Invitations
                                </TabsTrigger>
                            </>
                        )}
                    </TabsList>
                </div>

                <TabsContent value="members" className="mt-0">
                    <MembersTab activeSlug={activeSlug} isAdmin={isAdmin} />
                </TabsContent>

                {isAdmin && (
                    <>
                        <TabsContent value="requests" className="mt-0">
                            <RequestsTab activeSlug={activeSlug} />
                        </TabsContent>
                        <TabsContent value="invitations" className="mt-0">
                            <InvitationsTab activeSlug={activeSlug} />
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
}

// --- Tab Components ---

function MembersTab({ activeSlug, isAdmin }: { activeSlug: string, isAdmin: boolean }) {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/organizations/team/", { 
                headers: { 'X-Organization-Slug': activeSlug } 
            });
            setMembers(Array.isArray(data) ? data : data.results);
        } catch (e) {
            toast.error("Failed to load members.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMembers(); }, [activeSlug]);

    const handleRemove = async (id: number) => {
        try {
            await api.delete(`/organizations/team/${id}/`, { 
                headers: { 'X-Organization-Slug': activeSlug } 
            });
            toast.success("Member removed successfully.");
            setMembers(prev => prev.filter(m => m.id !== id));
        } catch (e) {
            toast.error("Failed to remove member.");
        }
    };

    if (loading) {
        return (
            <Card className="border shadow-sm min-h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </Card>
        );
    }

    if (members.length === 0) {
        return (
            <Card className="border shadow-sm">
                <CardContent className="pt-6">
                    <EmptyState icon={Users} title="No Active Members" description="You haven't added anyone to your team yet." />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border shadow-sm bg-card">
            <CardHeader className="border-b px-6 py-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" /> Active Personnel
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="pl-6 w-[350px]">User Details</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date Joined</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map((m) => (
                            <TableRow key={m.id} className="hover:bg-muted/5">
                                <TableCell className="pl-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border">
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                                {m.user?.username?.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm text-foreground">
                                                {m.user?.full_name || m.user?.username}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{m.user?.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell><RoleBadge role={m.role} /></TableCell>
                                <TableCell><StatusBadge active={m.is_active} /></TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {new Date(m.date_joined).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    {(isAdmin && m.user?.id !== currentUser?.id && m.role !== 'owner') ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                    <MoreHorizontal className="h-4 w-4"/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleRemove(m.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4"/> Remove Access
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic px-2">No actions</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function RequestsTab({ activeSlug }: { activeSlug: string }) {
    const [requests, setRequests] = useState<JoinRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<number | null>(null);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/community/manage/requests/", { headers: { 'X-Organization-Slug': activeSlug } });
            setRequests(data.results || data);
        } catch { toast.error("Error loading requests"); } finally { setLoading(false); }
    };

    useEffect(() => { fetchRequests(); }, [activeSlug]);

    const handleAction = async (id: number, type: 'approve' | 'reject') => {
        setActionId(id);
        try {
            await api.post(`/community/manage/requests/${id}/${type}/`, {}, { headers: { 'X-Organization-Slug': activeSlug } });
            toast.success(`Request ${type}ed successfully.`);
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch {
            toast.error("Action failed.");
        } finally {
            setActionId(null);
        }
    };

    if (loading) return <Card className="border shadow-sm min-h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></Card>;
    
    if (requests.length === 0) {
        return (
            <Card className="border shadow-sm">
                <CardContent className="pt-6">
                    <EmptyState icon={Clock} title="No Pending Requests" description="There are no pending join requests at the moment." />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border shadow-sm">
            <CardHeader className="border-b px-6 py-4">
                <CardTitle className="text-base font-semibold">Incoming Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="pl-6">Applicant</TableHead>
                            <TableHead>Desired Role</TableHead>
                            <TableHead>Proposed Rate</TableHead>
                            <TableHead>Requested On</TableHead>
                            <TableHead className="text-right pr-6">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell className="pl-6 py-4 font-medium">
                                    <div className="flex flex-col">
                                        <span>{r.user.full_name || r.user.username}</span>
                                        <span className="text-xs text-muted-foreground">{r.user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell><RoleBadge role={r.desired_role} /></TableCell>
                                <TableCell>
                                    {r.desired_role === 'tutor' ? (
                                        <Badge variant="secondary" className="font-mono bg-muted">{r.proposed_commission}% Comm</Badge>
                                    ) : <span className="text-muted-foreground">-</span>}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right pr-6">
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-8 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleAction(r.id, 'reject')} disabled={!!actionId}>
                                            Reject
                                        </Button>
                                        <Button size="sm" className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction(r.id, 'approve')} disabled={!!actionId}>
                                            {actionId === r.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Check className="h-3 w-3"/>}
                                            Approve
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function InvitationsTab({ activeSlug }: { activeSlug: string }) {
    const [invites, setInvites] = useState<SentInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState<number | null>(null);

    const fetchInvites = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/community/manage/invitations/", { headers: { 'X-Organization-Slug': activeSlug } });
            setInvites(data.results || data);
        } catch { toast.error("Error loading invitations"); } finally { setLoading(false); }
    };

    useEffect(() => { fetchInvites(); }, [activeSlug]);

    const handleRevoke = async (id: number) => {
        setRevoking(id);
        try {
            await api.post(`/community/manage/invitations/${id}/revoke/`, {}, { headers: { 'X-Organization-Slug': activeSlug } });
            toast.success("Invitation revoked");
            setInvites(prev => prev.filter(i => i.id !== id));
        } catch { toast.error("Failed to revoke"); } finally { setRevoking(null); }
    };

    if (loading) return <Card className="border shadow-sm min-h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></Card>;
    
    if (invites.length === 0) {
        return (
            <Card className="border shadow-sm">
                <CardContent className="pt-6">
                    <EmptyState icon={Mail} title="No Sent Invitations" description="You haven't sent any invitations recently." />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border shadow-sm">
            <CardHeader className="border-b px-6 py-4">
                <CardTitle className="text-base font-semibold">Sent Invitations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="pl-6">Invited Email</TableHead>
                            <TableHead>Configured Roles</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right pr-6">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invites.map((inv) => (
                            <TableRow key={inv.id}>
                                <TableCell className="pl-6 font-medium text-foreground">{inv.email}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary" className="text-[10px] uppercase">
                                            {inv.gov_role}
                                        </Badge>
                                        {inv.is_tutor_invite && (
                                            <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200">
                                                TUTOR ({inv.tutor_commission}%)
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={inv.gov_status} />
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <Button size="sm" variant="ghost" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRevoke(inv.id)} disabled={!!revoking}>
                                        {revoking === inv.id ? <Loader2 className="h-3 w-3 animate-spin"/> : "Revoke"}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// --- Invite Modal ---

function InviteMemberModal({ activeSlug, onSuccess }: { activeSlug: string, onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [govRole, setGovRole] = useState("member");
    const [isTutor, setIsTutor] = useState(true);
    const [commission, setCommission] = useState([70]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/community/invitations/", {
                email,
                gov_role: govRole,
                is_tutor_invite: isTutor,
                tutor_commission: isTutor ? commission[0] : null
            }, { headers: { 'X-Organization-Slug': activeSlug } });
            
            toast.success("Invitation sent successfully");
            setOpen(false);
            onSuccess();
            setEmail("");
            setIsTutor(true);
            setCommission([70]);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to invite user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="shadow-sm">
                    <UserPlus className="h-4 w-4 mr-2" /> Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-border shadow-lg">
                <DialogHeader>
                    <DialogTitle>Invite New Team Member</DialogTitle>
                    <DialogDescription>
                        Configure role access and financial terms for the new member.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input 
                            required 
                            type="email" 
                            placeholder="colleague@example.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-background"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Governance Role</Label>
                            <Select value={govRole} onValueChange={setGovRole}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="member">Member (Read Only)</SelectItem>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground">Admin access level.</p>
                        </div>

                        <div className="space-y-2 border rounded-md p-3 bg-muted/20">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="tutor-switch" className="cursor-pointer font-medium">Teaching Access</Label>
                                <Switch id="tutor-switch" checked={isTutor} onCheckedChange={setIsTutor} />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Can create courses?</p>
                        </div>
                    </div>

                    {isTutor && (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Tutor Commission Rate</Label>
                                <Badge variant="secondary" className="text-base font-mono">{commission[0]}%</Badge>
                            </div>
                            <Slider 
                                value={commission} 
                                onValueChange={setCommission} 
                                max={100} 
                                min={10} 
                                step={5} 
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                                <span>Org keeps: <b>{100 - commission[0]}%</b></span>
                                <span>Tutor gets: <b>{commission[0]}%</b></span>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Mail className="mr-2 h-4 w-4" />}
                            Send Invitation
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}