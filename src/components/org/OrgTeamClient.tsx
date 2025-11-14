"use client";

import React, { useEffect, useState } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/axios";
import { Loader2, UserPlus, MoreVertical, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// --- Types ---
interface TeamMember {
    id: number;
    // Make user optional or properties optional to handle missing data gracefully
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

export default function OrgTeamClient() {
    const { activeSlug } = useActiveOrg();
    const { user: currentUser } = useAuth();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    const currentOrgMembership = currentUser?.organizations?.find(
        (org: AuthOrg) => org.organization_slug === activeSlug
    );
    const isAdmin = currentOrgMembership?.role === 'admin' || currentOrgMembership?.role === 'owner';

    const fetchMembers = async () => {
        if (!activeSlug) return;
        try {
            setIsLoading(true);
            const res = await api.get("/organizations/api/team/", {
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

    const handleRemoveMember = async (id: number) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        try {
             await api.delete(`/organizations/api/team/${id}/`, {
                headers: { 'X-Organization-Slug': activeSlug }
            });
            toast.success("Member removed successfully.");
            fetchMembers();
        } catch (error) {
            toast.error("Failed to remove member.");
        }
    }

    if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

    return (
        <div className="container mx-auto p-6">
             <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                    <p className="text-gray-500">View and manage organization members.</p>
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

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3 font-semibold">User</th>
                            <th className="px-6 py-3 font-semibold">Role</th>
                            <th className="px-6 py-3 font-semibold">Status</th>
                            <th className="px-6 py-3 font-semibold">Joined</th>
                            {isAdmin && <th className="px-6 py-3 text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {members.map((member) => {
                            // ✅ Defensive check: Ensure user object exists
                            if (!member.user) {
                                return (
                                    <tr key={member.id} className="bg-red-50">
                                        <td colSpan={isAdmin ? 5 : 4} className="px-6 py-4 text-red-500 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            Error: Invalid member data (ID: {member.id})
                                        </td>
                                    </tr>
                                );
                            }

                            return (
                                <tr key={member.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            {/* ✅ Safe access with optional chaining and fallbacks */}
                                            <span className="font-medium text-gray-900">
                                                {member.user.full_name || member.user.username || "Unknown User"}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {member.user.email || "No email"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 capitalize">
                                        <Badge variant="outline" className={member.role === 'owner' || member.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}>
                                            {member.role}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge className={member.is_active ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'}>
                                            {member.is_active ? 'Active' : 'Pending'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(member.date_joined).toLocaleDateString()}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4 text-right">
                                            {(member.user.id !== currentUser?.id && member.role !== 'owner') && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleRemoveMember(member.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Remove from Org
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

interface InviteDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    activeSlug: string | null;
}

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
            await api.post("/organizations/api/team/invite/", { email, role }, {
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite New Team Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="colleague@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <p className="text-xs text-gray-500">User must already be registered on the platform.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tutor">Tutor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Invite
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}