"use client";

import React, { useEffect, useState } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/axios";
import { Loader2, Edit, BarChart, BookOpen, Layers, Plus, Trash2, MoreVertical, Pencil, Link as LinkIcon, Facebook, Linkedin, Twitter, FileText, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Interfaces ---
interface OrgStats {
    students: number;
    tutors: number;
    courses: number;
    upcoming_events: number;
}

interface OrganizationDetails {
    id: number;
    name: string;
    slug: string;
    description: string;
    branding: {
        logo_url?: string;
        website?: string;
        linkedin?: string;
        facebook?: string;
        twitter?: string;
    };
    // ✅ Added policies interface
    policies: {
        terms_of_service?: string;
        privacy_policy?: string;
        refund_policy?: string;
    };
    stats: OrgStats;
}

interface TaxonomyItem {
    id: number;
    name: string;
    description?: string;
    order?: number;
    created_at: string;
}

export default function OrgProfileClient() {
    const { activeSlug } = useActiveOrg();
    const { user } = useAuth();
    const [org, setOrg] = useState<OrganizationDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const currentMembership = user?.organizations?.find((o: any) => o.organization_slug === activeSlug);
    const isAdmin = currentMembership?.role === 'admin' || currentMembership?.role === 'owner';

    const fetchOrgDetails = async () => {
        if (!activeSlug) return;
        try {
            setIsLoading(true);
            const res = await api.get("/organizations/current/", {
                headers: { 'X-Organization-Slug': activeSlug }
            });
            setOrg(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load organization details.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgDetails();
    }, [activeSlug]);

    if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
    if (!org) return null;

    const hasPolicies = org.policies?.terms_of_service || org.policies?.privacy_policy || org.policies?.refund_policy;

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* === HERO BANNER === */}
            <div className="relative bg-[#0F1116] text-white px-6 py-12 md:px-12">
                <div className="container mx-auto">
                    {/* Stats */}
                    <div className="hidden md:flex justify-end gap-4 text-sm font-medium text-gray-300 mb-16">
                        <span>{org.stats.students.toLocaleString()} Students</span> •
                        <span>{org.stats.tutors.toLocaleString()} Tutors</span> •
                        <span>{org.stats.courses} Published Courses</span> •
                        <span>{org.stats.upcoming_events} Upcoming Events</span>
                    </div>

                    {/* Org Info */}
                    <div className="flex flex-col md:flex-row items-start gap-6 relative mt-8">
                        <div className="h-32 w-32 shrink-0 rounded-md bg-[#1C1F26] border border-gray-800 shadow-xl overflow-hidden flex items-center justify-center">
                             {org.branding?.logo_url ? (
                                <img src={org.branding.logo_url} alt={org.name} className="h-full w-full object-cover" />
                             ) : (
                                <span className="text-4xl font-bold text-gray-700">{org.name.charAt(0)}</span>
                             )}
                        </div>
                        <div className="flex-1 pt-4">
                            <h1 className="text-3xl font-bold text-white">{org.name}</h1>
                            <p className="text-gray-400 mt-2 max-w-2xl">
                                {org.branding?.website || "Empowering minds through practical digital skills."}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {isAdmin && (
                        <div className="flex gap-3 mt-8 md:mt-0 md:absolute md:bottom-0 md:right-0">
                             <EditOrgDialog org={org} onSuccess={fetchOrgDetails} activeSlug={activeSlug} />
                             <Button variant="outline" className="bg-transparent text-white border-gray-700 hover:bg-gray-800 hover:text-white">
                                <BarChart className="mr-2 h-4 w-4" /> View Analytics
                             </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-6 md:px-12 -mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* === LEFT COLUMN (Main Content) === */}
                 <div className="lg:col-span-2 space-y-8">
                    {/* Bio */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">About Us</h2>
                        <div className="prose max-w-none text-gray-600">
                            {org.description ? (
                                org.description.split('\n').map((paragraph, idx) => (
                                    <p key={idx} className="mb-4 last:mb-0">{paragraph}</p>
                                ))
                            ) : (
                                <p className="italic text-gray-400">No description provided.</p>
                            )}
                        </div>
                    </div>

                    {/* ✅ NEW: Policies Display Section */}
                    {hasPolicies && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Organization Policies</h2>
                            <Tabs defaultValue={org.policies.terms_of_service ? "terms" : (org.policies.privacy_policy ? "privacy" : "refund")}>
                                <TabsList className="mb-4">
                                    {org.policies.terms_of_service && <TabsTrigger value="terms">Terms of Service</TabsTrigger>}
                                    {org.policies.privacy_policy && <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>}
                                    {org.policies.refund_policy && <TabsTrigger value="refund">Refund Policy</TabsTrigger>}
                                </TabsList>
                                {org.policies.terms_of_service && (
                                    <TabsContent value="privacy" className="prose max-w-none text-sm text-gray-600 bg-gray-50 p-4 rounded-md max-h-64 overflow-y-auto">
                                        <div className="whitespace-pre-wrap">
                                            {org.policies.terms_of_service}
                                        </div>
                                    </TabsContent>    
                                )}
                                {org.policies.privacy_policy && (
                                     <TabsContent value="privacy" className="prose max-w-none text-sm text-gray-600 bg-gray-50 p-4 rounded-md max-h-64 overflow-y-auto">
                                        <div className="whitespace-pre-wrap">
                                            {org.policies.privacy_policy}
                                        </div>
                                    </TabsContent>
                                )}
                                
                                {org.policies.refund_policy && (
                                    <TabsContent value="privacy" className="prose max-w-none text-sm text-gray-600 bg-gray-50 p-4 rounded-md max-h-64 overflow-y-auto">
                                        <div className="whitespace-pre-wrap">
                                            {org.policies.refund_policy}
                                        </div>
                                    </TabsContent>
                                )}
                            </Tabs>
                        </div>
                    )}
                 </div>

                 {/* === RIGHT COLUMN (Sidebar) === */}
                 <div className="space-y-8">
                     {/* Social Links */}
                     <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Connect</h2>
                        <div className="space-y-3">
                             {org.branding?.website && <SocialLink icon={<LinkIcon className="h-4 w-4" />} label="Website" value={org.branding.website} />}
                             {org.branding?.linkedin && <SocialLink icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" value={org.branding.linkedin} />}
                             {org.branding?.facebook && <SocialLink icon={<Facebook className="h-4 w-4" />} label="Facebook" value={org.branding.facebook} />}
                             {org.branding?.twitter && <SocialLink icon={<Twitter className="h-4 w-4" />} label="X (Twitter)" value={org.branding.twitter} />}
                        </div>
                    </div>

                    {/* Settings (Admin Only) */}
                    {isAdmin && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                 <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
                            </div>
                            <div className="divide-y divide-gray-50">
                                 <TaxonomyManager activeSlug={activeSlug} type="categories" title="Course Categories" description="Manage subjects." icon={<BookOpen className="h-5 w-5 text-blue-500"/>} />
                                 <TaxonomyManager activeSlug={activeSlug} type="levels" title="Organization Levels" description="Manage grade levels." icon={<Layers className="h-5 w-5 text-purple-500"/>} />
                                 <CustomizeBrandingDialog org={org} onSuccess={fetchOrgDetails} activeSlug={activeSlug} />
                                 {/* ✅ NEW: Policies Manager */}
                                 <CustomizePoliciesDialog org={org} onSuccess={fetchOrgDetails} activeSlug={activeSlug} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Social Link Helper ---
function SocialLink({ icon, label, value }: {icon: React.ReactNode, label: string, value: string}) {
    return (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <span className="text-gray-400 group-hover:text-blue-600">{icon}</span>
            <div className="overflow-hidden">
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <p className="text-sm text-gray-900 truncate">{value.replace(/^https?:\/\/(www\.)?/, '')}</p>
            </div>
        </a>
    )
}

// --- ✅ NEW: Customize Policies Dialog ---
function CustomizePoliciesDialog({ org, onSuccess, activeSlug }: { org: OrganizationDetails, onSuccess: () => void, activeSlug: string | null }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [policies, setPolicies] = useState(org.policies || {});

    useEffect(() => { if (open) setPolicies(org.policies || {}); }, [open, org.policies]);

    const handleSubmit = async () => {
        if (!activeSlug) return;
        setLoading(true);
        try {
            await api.patch("/organizations/current/", { policies }, { headers: { 'X-Organization-Slug': activeSlug }});
            toast.success("Policies updated."); onSuccess(); setOpen(false);
        } catch (e) { toast.error("Failed to update policies."); } finally { setLoading(false); }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <div className="flex items-center justify-between p-6 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-gray-100"><Scale className="h-5 w-5 text-gray-600"/></div>
                        <div><span className="font-medium text-gray-900 block">Manage Policies</span><span className="text-sm text-gray-500">Terms, privacy, & refunds.</span></div>
                    </div>
                    <Button variant="ghost" size="sm">Manage</Button>
                </div>
            </SheetTrigger>
            <SheetContent className="sm:max-w-2xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>Organization Policies</SheetTitle>
                    <SheetDescription>Define the legal and operational policies for your organization. These will be visible to your students and tutors.</SheetDescription>
                </SheetHeader>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Terms of Service</Label>
                        <Textarea rows={6} placeholder="Enter your terms of service..." value={policies.terms_of_service || ''} onChange={e => setPolicies({...policies, terms_of_service: e.target.value})} className="font-mono text-sm" />
                    </div>
                    <div className="space-y-2">
                        <Label>Privacy Policy</Label>
                        <Textarea rows={6} placeholder="Enter your privacy policy..." value={policies.privacy_policy || ''} onChange={e => setPolicies({...policies, privacy_policy: e.target.value})} className="font-mono text-sm" />
                    </div>
                    <div className="space-y-2">
                        <Label>Refund Policy</Label>
                        <Textarea rows={4} placeholder="Enter your refund policy..." value={policies.refund_policy || ''} onChange={e => setPolicies({...policies, refund_policy: e.target.value})} className="font-mono text-sm" />
                    </div>
                </div>
                <SheetFooter className="mt-8">
                    <SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose>
                    <Button onClick={handleSubmit} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Policies</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

// --- Other Managers (Taxonomy, Branding, etc. - KEEP AS IS from previous response) ---
// (I'm omitting repeating TaxonomyManager, CustomizeBrandingDialog, EditOrgDialog here for brevity,
// assume they are exactly as provided in the previous response and included in the final file)

// --- ... TaxonomyManager code ...
function TaxonomyManager({ activeSlug, type, title, description, icon }: { activeSlug: string | null, type: 'categories' | 'levels', title: string, description: string, icon: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<TaxonomyItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingItem, setEditingItem] = useState<TaxonomyItem | null>(null);

    const fetchItems = async () => {
        if (!activeSlug) return;
        setLoading(true);
        try {
            const res = await api.get(`/organizations/${type}/`, { headers: { 'X-Organization-Slug': activeSlug }});
            setItems(Array.isArray(res.data) ? res.data : res.data.results);
        } finally { setLoading(false); }
    }

    useEffect(() => { if (open) fetchItems(); }, [open, activeSlug, type]);

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this item?")) return;
        try {
             await api.delete(`/organizations/${type}/${id}/`, { headers: { 'X-Organization-Slug': activeSlug }});
             toast.success("Deleted."); fetchItems();
        } catch (e) { toast.error("Failed delete."); }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <div className="flex items-center justify-between p-6 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-gray-100">{icon}</div>
                        <div><span className="font-medium text-gray-900 block">{title}</span><span className="text-sm text-gray-500">{description}</span></div>
                    </div>
                    <Button variant="ghost" size="sm">Manage</Button>
                </div>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl overflow-y-auto">
                <SheetHeader className="mb-6"><SheetTitle>{title}</SheetTitle><SheetDescription>Manage your organization's {type}.</SheetDescription></SheetHeader>
                <div className="mb-6"><UpsertTaxonomyItem type={type} activeSlug={activeSlug} onSuccess={fetchItems} existingItem={editingItem} onCancel={() => setEditingItem(null)} /></div>
                <div className="space-y-4">
                    {loading ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" /> : items.length > 0 ? (
                        <div className="rounded-md border border-gray-200 divide-y divide-gray-200">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                    <div>
                                        <div className="flex items-center gap-2"><span className="font-medium text-gray-900">{item.name}</span>{type === 'levels' && item.order !== undefined && <Badge variant="secondary" className="text-xs">Order: {item.order}</Badge>}</div>
                                        {item.description && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{item.description}</p>}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setEditingItem(item)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem><DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem></DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">No items yet.</p>}
                </div>
            </SheetContent>
        </Sheet>
    )
}

function UpsertTaxonomyItem({ type, activeSlug, onSuccess, existingItem, onCancel }: any) {
    const [formData, setFormData] = useState({ name: "", description: "", order: "0" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (existingItem) setFormData({ name: existingItem.name, description: existingItem.description || "", order: existingItem.order?.toString() || "0" });
        else setFormData({ name: "", description: "", order: "0" });
    }, [existingItem]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); if (!activeSlug) return; setLoading(true);
        try {
            const payload = { ...formData, order: parseInt(formData.order) || 0 };
            if (existingItem) await api.patch(`/organizations/${type}/${existingItem.id}/`, payload, { headers: { 'X-Organization-Slug': activeSlug }});
            else await api.post(`/organizations/${type}/`, payload, { headers: { 'X-Organization-Slug': activeSlug }});
            toast.success("Saved."); setFormData({ name: "", description: "", order: "0" }); onSuccess(); if (existingItem) onCancel();
        } catch (e) { toast.error("Failed to save."); } finally { setLoading(false); }
    }
    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
            <h4 className="font-medium text-sm">{existingItem ? 'Edit' : 'Add New'}</h4>
            <div className="grid grid-cols-2 gap-4">
                <div className={type==='levels'?"col-span-1":"col-span-2"}><Label className="text-xs">Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="bg-white" /></div>
                {type === 'levels' && <div><Label className="text-xs">Order</Label><Input type="number" value={formData.order} onChange={e => setFormData({...formData, order: e.target.value})} className="bg-white" /></div>}
                <div className="col-span-2"><Label className="text-xs">Description</Label><Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-white" /></div>
            </div>
            <div className="flex justify-end gap-2">{existingItem && <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>}<Button type="submit" size="sm" disabled={loading}>{loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Save</Button></div>
        </form>
    )
}

function EditOrgDialog({ org, onSuccess, activeSlug }: any) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: org.name, description: org.description || '' });

    const handleSubmit = async () => {
        if (!activeSlug) return; setLoading(true);
        try {
            await api.patch("/organizations/current/", formData, { headers: { 'X-Organization-Slug': activeSlug }});
            toast.success("Updated."); onSuccess(); setOpen(false);
        } catch (e) { toast.error("Failed."); } finally { setLoading(false); }
    }
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="outline" className="bg-white text-gray-700 hover:bg-gray-100"><Edit className="mr-2 h-4 w-4" /> Edit Info</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Edit Info</DialogTitle></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div><div className="space-y-2"><Label>Bio</Label><Textarea rows={5} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div></div><DialogFooter><Button onClick={handleSubmit} disabled={loading}>Save</Button></DialogFooter></DialogContent>
        </Dialog>
    );
}

function CustomizeBrandingDialog({ org, onSuccess, activeSlug }: any) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [brandingData, setBrandingData] = useState(org.branding || {});
    useEffect(() => { if (open) setBrandingData(org.branding || {}); }, [open, org.branding]);
    const handleSubmit = async () => {
        if (!activeSlug) return; setLoading(true);
        try {
            await api.patch("/organizations/current/", { branding: brandingData }, { headers: { 'X-Organization-Slug': activeSlug }});
            toast.success("Branding updated."); onSuccess(); setOpen(false);
        } catch (e) { toast.error("Failed."); } finally { setLoading(false); }
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><div className="flex items-center justify-between p-6 hover:bg-gray-50 cursor-pointer transition-colors"><div className="flex items-center gap-4"><div className="p-2 rounded-full bg-gray-100"><PaintbrushIcon className="h-5 w-5 text-orange-500"/></div><div><span className="font-medium text-gray-900 block">Branding</span><span className="text-sm text-gray-500">Logo & social links.</span></div></div><Button variant="ghost" size="sm">Manage</Button></div></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Branding</DialogTitle></DialogHeader><div className="space-y-4 py-4 grid grid-cols-2 gap-4"><div className="col-span-2 space-y-2"><Label>Logo URL</Label><Input value={brandingData.logo_url || ''} onChange={e => setBrandingData({...brandingData, logo_url: e.target.value})} /></div><div className="space-y-2"><Label>Website</Label><Input value={brandingData.website || ''} onChange={e => setBrandingData({...brandingData, website: e.target.value})} /></div><div className="space-y-2"><Label>LinkedIn</Label><Input value={brandingData.linkedin || ''} onChange={e => setBrandingData({...brandingData, linkedin: e.target.value})} /></div><div className="space-y-2"><Label>Facebook</Label><Input value={brandingData.facebook || ''} onChange={e => setBrandingData({...brandingData, facebook: e.target.value})} /></div><div className="space-y-2"><Label>X (Twitter)</Label><Input value={brandingData.twitter || ''} onChange={e => setBrandingData({...brandingData, twitter: e.target.value})} /></div></div><DialogFooter><Button onClick={handleSubmit} disabled={loading}>Save</Button></DialogFooter></DialogContent>
        </Dialog>
    );
}

const PaintbrushIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/><path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/><path d="M14.5 17.5 4.5 15"/></svg>