"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link"; // Import Link
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/axios";
import { 
    Loader2, 
    UserPlus, 
    MoreVertical, 
    Trash2, 
    ExternalLink, // New Icon
    AlertTriangle, 
    Mail, 
    Shield 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// --- Types ---
interface TeamMember {
    id: number;
    user?: {
        id: number;
        username: string;
        email: string;
        full_name?: string;
    };
    role: string;
    is_active: boolean;
    date_joined: string;
}

interface AuthOrg {
    organization_slug: string;
    organization_name?: string;
    role?: string;
}

// --- UTILS ---
const getRoleBadge = (role: string) => {
    switch(role) {
        case 'owner': return <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200">Owner</Badge>;
        case 'admin': return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">Admin</Badge>;
        default: return <Badge variant="outline" className="capitalize">{role}</Badge>;
    }
};

const getStatusBadge = (isActive: boolean) => (
    <Badge className={isActive ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200"}>
        {isActive ? "Active" : "Pending"}
    </Badge>
);

// --- MODALS AND INTERFACES ---
interface InviteDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    activeSlug: string | null;
}

interface ConfirmRemoveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    isLoading: boolean;
}

function ConfirmRemoveModal({ isOpen, onClose, onConfirm, title, description, isLoading }: ConfirmRemoveModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0 top-[15%] translate-y-0 gap-0">
                <div className="p-4 border-b bg-muted/40 rounded-t-lg flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
                        <DialogDescription className="text-xs mt-0.5">This action cannot be undone.</DialogDescription>
                    </div>
                </div>
                <div className="p-6">
                    <p className="text-sm text-foreground/80 leading-relaxed">{description}</p>
                </div>
                <div className="p-4 border-t bg-muted/40 rounded-b-lg flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="h-9">Cancel</Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={isLoading} className="h-9">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm Remove
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- MAIN COMPONENT ---
export default function OrgTeamClient() {
    const { activeSlug } = useActiveOrg();
    const { user: currentUser } = useAuth();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    
    const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    const currentOrgMembership = currentUser?.organizations?.find(
        (org: AuthOrg) => org.organization_slug === activeSlug
    );
    const isAdmin = currentOrgMembership?.role === 'admin' || currentOrgMembership?.role === 'owner';

    const fetchMembers = async () => {
        if (!activeSlug) return;
        try {
            setIsLoading(true);
            const res = await api.get("/organizations/team/", {
                headers: { 'X-Organization-Slug': activeSlug }
            });
            setMembers(Array.isArray(res.data) ? res.data : res.data.results);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load team members.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [activeSlug]);

    const handleRemoveMember = async () => {
        if (!memberToRemove) return;
        setIsRemoving(true);
        try {
             await api.delete(`/organizations/team/${memberToRemove.id}/`, {
                headers: { 'X-Organization-Slug': activeSlug }
            });
            toast.success("Member removed successfully.");
            setMembers(prev => prev.filter(m => m.id !== memberToRemove.id));
            setMemberToRemove(null);
        } catch (error) {
            toast.error("Failed to remove member.");
        } finally {
            setIsRemoving(false);
        }
    }

    // --- Action Menu Component ---
    const ActionMenu = ({ member }: { member: TeamMember }) => {
        const isSelf = member.user?.id === currentUser?.id;
        const isTargetOwner = member.role === 'owner';
        
        // Show menu if:
        // 1. You are Admin/Owner AND target isn't Owner AND target isn't Self (for Remove action)
        // 2. OR if the member has a username (for View Profile action)
        const canRemove = isAdmin && !isTargetOwner && !isSelf;
        const canViewProfile = !!member.user?.username;

        if (!canRemove && !canViewProfile) return null;
        
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0 bg-transparent hover:bg-transparent active:bg-transparent focus-visible:ring-0 border-0 shadow-none data-[state=open]:bg-transparent">
                        <MoreVertical className="h-5 w-5 text-muted-foreground transition-colors mx-auto" />
                    </Button>

                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {canViewProfile && (
                        <DropdownMenuItem asChild>
                            <Link 
                                href={`${process.env.NEXT_PUBLIC_API_URL}/tutor-profile/${member.user?.username}`} 
                                target="_blank" 
                                className="cursor-pointer flex items-center w-full"
                            >
                                <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" /> 
                                View Public Profile
                            </Link>
                        </DropdownMenuItem>
                    )}

                    {canRemove && canViewProfile && <DropdownMenuSeparator />}

                    {canRemove && (
                        <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer" 
                            onClick={() => setMemberToRemove(member)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Remove from Org
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-5xl">
             <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
                    <p className="text-muted-foreground text-sm">Manage access and roles for your organization.</p>
                </div>
                {isAdmin && (
                    <InviteDialog
                        isOpen={isInviteOpen}
                        onOpenChange={setIsInviteOpen}
                        onSuccess={fetchMembers}
                        activeSlug={activeSlug}
                    />
                )}
            </div>

            {/* Mobile Card List */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {members.map(member => (
                    <Card key={member.id} className="p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                                    {member.user?.full_name?.charAt(0) || member.user?.username?.charAt(0) || "?"}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-foreground truncate">{member.user?.full_name || member.user?.username || "Unknown"}</p>
                                    <p className="text-xs text-muted-foreground break-all">{member.user?.email}</p>
                                </div>
                            </div>
                            <ActionMenu member={member} />
                        </div>
                        
                        <div className="mt-4 pt-3 border-t flex justify-between items-center">
                            <div className="flex gap-2">
                                {getRoleBadge(member.role)}
                                {getStatusBadge(member.is_active)}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                Joined {new Date(member.date_joined).toLocaleDateString()}
                            </span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Desktop Table */}
            <div className="rounded-lg border bg-card shadow-sm overflow-hidden hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                            {member.user?.full_name?.charAt(0) || "?"}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">
                                                {member.user?.full_name || member.user?.username || "Unknown"}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {member.user?.email || "No email"}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{getRoleBadge(member.role)}</TableCell>
                                <TableCell>{getStatusBadge(member.is_active)}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {new Date(member.date_joined).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <ActionMenu member={member} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <ConfirmRemoveModal 
                isOpen={!!memberToRemove}
                onClose={() => setMemberToRemove(null)}
                onConfirm={handleRemoveMember}
                title="Remove Team Member"
                description={`Are you sure you want to remove ${memberToRemove?.user?.full_name || 'this user'}? They will lose access immediately.`}
                isLoading={isRemoving}
            />
        </div>
    );
}

// --- INVITE DIALOG ---
function InviteDialog({ isOpen, onOpenChange, onSuccess, activeSlug }: InviteDialogProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("tutor");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!activeSlug) {
             toast.error("No organization selected.");
             setIsSubmitting(false);
             return;
        }

        try {
            await api.post("/organizations/team/invite/", { email, role }, {
                 headers: { 'X-Organization-Slug': activeSlug }
            });
            toast.success("Invitation sent successfully!");
            onOpenChange(false);
            setEmail("");
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to send invitation.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" /> Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 top-[15%] translate-y-0 gap-0">
                <div className="p-4 border-b bg-muted/40 rounded-t-lg shrink-0">
                    <DialogTitle>Invite New Member</DialogTitle>
                    <DialogDescription className="mt-1 text-xs">Send an email invitation to join your team.</DialogDescription>
                </div>
                
                <div className="p-6">
                    <form id="invite-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    className="pl-9"
                                    placeholder="colleague@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tutor">Tutor</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t bg-muted/40 rounded-b-lg flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9">Cancel</Button>
                    <Button type="submit" form="invite-form" disabled={isSubmitting} className="h-9">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Invite
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}