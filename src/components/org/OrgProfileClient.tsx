"use client";

import React, { useEffect, useState } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/axios";
import {
  Loader2,
  Edit,
  BarChart,
  BookOpen,
  Layers,
  Link as LinkIcon,
  Facebook,
  Linkedin,
  Twitter,
  Scale,
  Paintbrush,
  Globe,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  DollarSign,
  CreditCard,
  Clock,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

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
  approved: boolean;
  logo: string | null;
  // --- Membership Fields Added ---
  membership_price: number;
  membership_period: 'monthly' | 'yearly' | 'lifetime' | 'free';
  membership_duration_value?: number;
  
  branding: {
    website?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    primary_color?: string;
  };
  policies: {
    terms_of_service?: string;
    privacy_policy?: string;
    refund_policy?: string;
  };
  stats: OrgStats;
  current_user_membership?: {
      role: 'owner' | 'admin' | 'tutor' | 'student';
      is_active: boolean;
  } | null;
}

interface TaxonomyItem {
  id: number;
  name: string;
  description?: string;
  order?: number;
  created_at: string;
}

function PolicyViewer({ content }: { content?: string }) {
  if (!content) return <p className="text-muted-foreground italic">No policy content.</p>;

  // Split by double newline to separate clauses
  const clauses = content.split("\n\n").filter((c) => c.trim().length > 0);

  return (
    <ol className="list-decimal list-outside space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground">
      {clauses.map((clause, index) => (
        <li key={index} className="pl-2">
          <span className="text-foreground">{clause}</span>
        </li>
      ))}
    </ol>
  );
}

// --- Main Component ---

export default function OrgProfileClient() {
  const { activeSlug } = useActiveOrg();
  const { user } = useAuth();
  const [org, setOrg] = useState<OrganizationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("terms");

  const fetchOrgDetails = async () => {
    if (!activeSlug) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/organizations/${activeSlug}/`);
      console.log(res.data)
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

  useEffect(() => {
    if (org && !isLoading) {
      if (org.policies.terms_of_service) setActiveTab("terms");
      else if (org.policies.privacy_policy) setActiveTab("privacy");
      else if (org.policies.refund_policy) setActiveTab("refund");
    }
  }, [org, isLoading]);

  if (isLoading)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (!org) return null;

  const userRole = org.current_user_membership?.role;
  const isAdmin = userRole === "admin" || userRole === "owner";

  const hasPolicies =
    org.policies?.terms_of_service ||
    org.policies?.privacy_policy ||
    org.policies?.refund_policy;

  return (
    <div className="bg-background min-h-screen pb-20">
      
      {/* === HERO BANNER === */}
      <div className="relative bg-primary text-primary-foreground px-6 py-12 md:px-12">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative">
            
            {/* Logo Box */}
            <div className="h-28 w-28 md:h-36 md:w-36 shrink-0 rounded-xl bg-background border-4 border-white/10 shadow-2xl overflow-hidden flex items-center justify-center relative">
              {org.logo ? (
                <Image
                  src={org.logo}
                  alt={org.name}
                  width={144}
                  height={144}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-5xl font-bold text-primary">
                  {org.name.charAt(0)}
                </span>
              )}
            </div>
            
            {/* Text Info */}
            <div className="flex-1 pt-2 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {org.name}
                  </h1>
                  {org.approved ? (
                      <Badge className="bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 border-emerald-500/50 backdrop-blur-md">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Verified
                      </Badge>
                  ) : (
                      <Badge variant="destructive" className="bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 border-amber-500/50 backdrop-blur-md">
                          <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Pending Approval
                      </Badge>
                  )}
              </div>

              <p className="text-primary-foreground/80 max-w-2xl text-sm md:text-base">
                {org.branding?.website ? (
                    <a href={org.branding.website} target="_blank" rel="noreferrer" className="hover:underline flex items-center justify-center md:justify-start gap-2">
                        <Globe className="h-4 w-4"/> {org.branding.website.replace(/^https?:\/\//, '')}
                    </a>
                ) : (
                    "Empowering minds through education."
                )}
              </p>
            </div>

            {/* Admin Buttons */}
            {isAdmin && (
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
                <EditOrgDialog
                  org={org}
                  onSuccess={fetchOrgDetails}
                  activeSlug={activeSlug}
                />
                <Button
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white backdrop-blur-sm"
                >
                  <BarChart className="mr-2 h-4 w-4" /> Analytics
                </Button>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left border-t border-white/20 pt-8 mt-8">
            <StatItem label="Active Students" value={org.stats.students} />
            <StatItem label="Tutors & Staff" value={org.stats.tutors} />
            <StatItem label="Published Courses" value={org.stats.courses} />
            <StatItem label="Upcoming Events" value={org.stats.upcoming_events} />
          </div>
        </div>
      </div>

      {/* === MAIN CONTENT GRID === */}
      <div className="container mx-auto px-4 md:px-12 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT COLUMN (2/3 width) --- */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Bio Section */}
          <Card className="shadow-sm border-muted/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">About Us</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                {org.description ? (
                  org.description.split("\n").map((p, i) => (
                    <p key={i} className="mb-4 last:mb-0">{p}</p>
                  ))
                ) : (
                  <p className="italic text-muted-foreground/60">No description provided yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* NEW: Membership Structure Card */}
          <Card className="shadow-sm border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" /> Membership Structure
                </CardTitle>
                {isAdmin && (
                    <EditMembershipDialog 
                        org={org} 
                        activeSlug={activeSlug} 
                        onSuccess={fetchOrgDetails} 
                    />
                )}
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-muted/30 rounded-lg border border-border">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <DollarSign className="h-4 w-4" /> Price
                          </div>
                          <div className="text-2xl font-bold">
                              {Number(org.membership_price) === 0 ? "Free" : `KES ${Number(org.membership_price).toLocaleString()}`}
                          </div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg border border-border">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <Clock className="h-4 w-4" /> Billing Period
                          </div>
                          <div className="text-2xl font-bold capitalize">
                              {org.membership_period}
                          </div>
                      </div>
                      {org.membership_period !== 'free' && org.membership_period !== 'lifetime' && (
                        <div className="p-4 bg-muted/30 rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Layers className="h-4 w-4" /> Duration
                            </div>
                            <div className="text-2xl font-bold">
                                {org.membership_duration_value} {org.membership_period === 'monthly' ? 'Months' : 'Years'}
                            </div>
                        </div>
                      )}
                  </div>
              </CardContent>
          </Card>

          {/* Policies Section */}
          {hasPolicies && (
            <Card className="shadow-sm border-muted/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Organization Policies</CardTitle>
                  
                  {/* MOBILE NAVIGATION: Dropdown (Visible on small screens) */}
                  <div className="md:hidden w-[160px]">
                    <Select value={activeTab} onValueChange={setActiveTab}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {org.policies.terms_of_service && <SelectItem value="terms">Terms of Service</SelectItem>}
                        {org.policies.privacy_policy && <SelectItem value="privacy">Privacy Policy</SelectItem>}
                        {org.policies.refund_policy && <SelectItem value="refund">Refund Policy</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  
                  {/* DESKTOP NAVIGATION: Tabs (Hidden on mobile) */}
                  <div className="hidden md:block mb-6">
                    <TabsList className="w-full justify-start bg-muted/50 p-1">
                      {org.policies.terms_of_service && <TabsTrigger value="terms" className="flex-1">Terms of Service</TabsTrigger>}
                      {org.policies.privacy_policy && <TabsTrigger value="privacy" className="flex-1">Privacy Policy</TabsTrigger>}
                      {org.policies.refund_policy && <TabsTrigger value="refund" className="flex-1">Refund Policy</TabsTrigger>}
                    </TabsList>
                  </div>

                  {/* CONTENT AREA (Shared) */}
                  <div className="bg-muted/10 rounded-lg border border-border p-4 md:p-6 min-h-[200px] max-h-[500px] overflow-y-auto">
                    
                    <TabsContent value="terms" className="mt-0 focus-visible:ring-0">
                      <div className="mb-4 md:hidden font-semibold text-lg">Terms of Service</div>
                      <PolicyViewer content={org.policies.terms_of_service} />
                    </TabsContent>

                    <TabsContent value="privacy" className="mt-0 focus-visible:ring-0">
                      <div className="mb-4 md:hidden font-semibold text-lg">Privacy Policy</div>
                      <PolicyViewer content={org.policies.privacy_policy} />
                    </TabsContent>

                    <TabsContent value="refund" className="mt-0 focus-visible:ring-0">
                      <div className="mb-4 md:hidden font-semibold text-lg">Refund Policy</div>
                      <PolicyViewer content={org.policies.refund_policy} />
                    </TabsContent>

                  </div>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        {/* --- RIGHT COLUMN (Sidebar 1/3 width) --- */}
        <div className="space-y-6">
          
          {/* Social Connect */}
          <Card className="shadow-sm border-muted/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Connect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {org.branding?.website && <SocialLink icon={<LinkIcon className="h-4 w-4" />} label="Website" value={org.branding.website} />}
              {org.branding?.linkedin && <SocialLink icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" value={org.branding.linkedin} />}
              {org.branding?.facebook && <SocialLink icon={<Facebook className="h-4 w-4" />} label="Facebook" value={org.branding.facebook} />}
              {org.branding?.twitter && <SocialLink icon={<Twitter className="h-4 w-4" />} label="X (Twitter)" value={org.branding.twitter} />}
              
              {!org.branding?.website && !org.branding?.linkedin && !org.branding?.facebook && !org.branding?.twitter && (
                 <p className="text-sm text-muted-foreground italic px-2">No social links added.</p>
              )}
            </CardContent>
          </Card>

          {/* Admin Management Panel */}
          {isAdmin && (
            <Card className="shadow-sm border-primary/20 overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-primary/10 py-4">
                <CardTitle className="text-base font-semibold text-primary">Administration</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  
                  <TaxonomyManager
                    activeSlug={activeSlug}
                    type="categories"
                    title="Course Categories"
                    description="Manage subject areas."
                    icon={<BookOpen className="h-4 w-4 text-blue-500" />}
                  />
                  
                  <TaxonomyManager
                    activeSlug={activeSlug}
                    type="levels"
                    title="Organization Levels"
                    description="Manage grade structures."
                    icon={<Layers className="h-4 w-4 text-amber-500" />}
                  />
                  
                  <CustomizeBrandingDialog
                    org={org}
                    onSuccess={fetchOrgDetails}
                    activeSlug={activeSlug}
                  />
                  
                  <CustomizePoliciesDialog
                    org={org}
                    onSuccess={fetchOrgDetails}
                    activeSlug={activeSlug}
                  />

                </div>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}

// --- Helper UI Components ---

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-3xl font-bold text-white tracking-tight">
        {value.toLocaleString()}
      </p>
      <p className="text-xs md:text-sm text-white/70 font-medium uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}

function SocialLink({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const safeUrl = value.startsWith("http") ? value : `https://${value}`;
  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted transition-colors group border border-transparent hover:border-border"
    >
      <span className="text-muted-foreground group-hover:text-primary transition-colors">{icon}</span>
      <div className="overflow-hidden">
        <p className="text-sm font-medium text-foreground truncate">{label}</p>
        <p className="text-xs text-muted-foreground truncate opacity-70">{value.replace(/^https?:\/\/(www\.)?/, '')}</p>
      </div>
    </a>
  );
}

// --- Policy Builder Component ---
const PolicyBuilder = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder: string }) => {
    const [input, setInput] = useState("");
  
    // Split by double newline to match backend storage
    const items = typeof value === 'string' && value.trim() !== "" ? value.split('\n\n') : [];
  
    const handleAdd = () => {
      if (!input.trim()) return;
      const newItems = [...items, input.trim()];
      onChange(newItems.join('\n\n')); 
      setInput("");
    };
  
    const handleRemove = (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      onChange(newItems.join('\n\n'));
    };
  
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button 
            type="button" 
            onClick={handleAdd} 
            variant="secondary"
            className="shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Clause
          </Button>
        </div>
  
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground italic border border-dashed rounded-lg p-4 text-center">
              No policies added yet. Type above to add one.
            </div>
          )}
          {items.map((item, idx) => (
            <div key={idx} className="group flex items-start justify-between gap-3 bg-card border p-3 rounded-md text-sm shadow-sm">
              <div className="flex gap-3">
                <span className="text-muted-foreground font-mono bg-muted w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="whitespace-pre-wrap leading-relaxed">{item}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(idx)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
};

// --- Dialogs & Sheets ---

// 1. Membership Edit (NEW)
function EditMembershipDialog({ org, onSuccess, activeSlug }: any) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // We update all membership fields at once
    const [data, setData] = useState({
        membership_price: org.membership_price,
        membership_period: org.membership_period,
        membership_duration_value: org.membership_duration_value || 1
    });

    const handleSubmit = async () => {
        if (!activeSlug) return;
        setLoading(true);
        const formPayload = new FormData();
        formPayload.append('membership_price', data.membership_price);
        formPayload.append('membership_period', data.membership_period);
        formPayload.append('membership_duration_value', data.membership_duration_value);

        try {
            await api.patch(`/organizations/${activeSlug}/`, formPayload, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast.success("Membership updated.");
            onSuccess();
            setOpen(false);
        } catch (e) {
            toast.error("Failed to update membership.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm"><Edit className="h-4 w-4 mr-2"/> Edit</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Membership Structure</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Billing Period</Label>
                        <Select 
                            value={data.membership_period} 
                            onValueChange={(val) => setData({...data, membership_period: val as any})}
                        >
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="free">Free Access</SelectItem>
                                <SelectItem value="monthly">Monthly Subscription</SelectItem>
                                <SelectItem value="yearly">Yearly Subscription</SelectItem>
                                <SelectItem value="lifetime">Lifetime Access</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {data.membership_period !== 'free' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Price (KES)</Label>
                                <Input 
                                    type="number" 
                                    value={data.membership_price} 
                                    onChange={(e) => setData({...data, membership_price: Number(e.target.value)})}
                                />
                            </div>
                            {data.membership_period !== 'lifetime' && (
                                <div className="space-y-2">
                                    <Label>Duration ({data.membership_period === 'monthly' ? 'Months' : 'Years'})</Label>
                                    <Input 
                                        type="number" 
                                        value={data.membership_duration_value} 
                                        onChange={(e) => setData({...data, membership_duration_value: Number(e.target.value)})}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// 2. Simple Edit (Name & Bio)
function EditOrgDialog({ org, onSuccess, activeSlug }: any) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: org.name,
    description: org.description || "",
  });

  const handleSubmit = async () => {
    if (!activeSlug) return;
    setLoading(true);
    const formPayload = new FormData();
    formPayload.append('name', formData.name);
    formPayload.append('description', formData.description);

    try {
      await api.patch(`/organizations/${activeSlug}/`, formPayload, {
         headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Organization info updated.");
      onSuccess();
      setOpen(false);
    } catch (e) {
      toast.error("Failed to update info.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm">
          <Edit className="mr-2 h-4 w-4" /> Edit Info
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Organization Info</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={5} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
        </div>
        <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 3. Branding (File Upload + Links)
function CustomizeBrandingDialog({ org, onSuccess, activeSlug }: any) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [brandingData, setBrandingData] = useState(org.branding || {});
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
        setBrandingData(org.branding || {});
        setLogoFile(null);
    }
  }, [open, org.branding]);

  const handleSubmit = async () => {
    if (!activeSlug) return;
    setLoading(true);
    
    // Use FormData for file upload
    const formData = new FormData();

    formData.append("branding", JSON.stringify(brandingData));
    
    if (logoFile) {
        formData.append("logo", logoFile);
    }

    try {
      await api.patch(`/organizations/${activeSlug}/`, formData, {
         headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Branding updated successfully.");
      onSuccess();
      setOpen(false);
    } catch (e) {
      toast.error("Failed to update branding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="flex items-center justify-between p-4 px-6 hover:bg-muted/50 cursor-pointer transition-colors group">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
              <Paintbrush className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <span className="font-medium text-foreground block text-sm">Branding</span>
              <span className="text-xs text-muted-foreground">Logo & Social Links</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Manage</Button>
        </div>
      </SheetTrigger>
      
      <SheetContent className="sm:max-w-md w-full">
        <SheetHeader>
          <SheetTitle>Customize Branding</SheetTitle>
          <SheetDescription>Update your logo and social media presence.</SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-6 space-y-6 px-1">
          {/* Logo Upload */}
          <div className="space-y-3">
             <Label>Organization Logo</Label>
             <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                {org.logo && !logoFile && (
                    <div className="h-16 w-16 rounded border bg-background flex items-center justify-center overflow-hidden shrink-0">
                         <Image src={org.logo} alt="Current" width={64} height={64} className="object-cover h-full w-full" />
                    </div>
                )}
                <div className="flex-1 space-y-2">
                    <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => e.target.files && setLogoFile(e.target.files[0])}
                        className="cursor-pointer file:text-primary file:font-semibold text-sm" 
                    />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Max 2MB. PNG or JPG recommended.
                    </p>
                </div>
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <Label>Social Links</Label>
            <div className="space-y-3">
                <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                    <Input className="pl-9" placeholder="Website URL" value={brandingData.website || ""} onChange={(e) => setBrandingData({ ...brandingData, website: e.target.value })} />
                </div>
                <div className="relative">
                    <Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                    <Input className="pl-9" placeholder="LinkedIn URL" value={brandingData.linkedin || ""} onChange={(e) => setBrandingData({ ...brandingData, linkedin: e.target.value })} />
                </div>
                <div className="relative">
                    <Facebook className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                    <Input className="pl-9" placeholder="Facebook URL" value={brandingData.facebook || ""} onChange={(e) => setBrandingData({ ...brandingData, facebook: e.target.value })} />
                </div>
                <div className="relative">
                    <Twitter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                    <Input className="pl-9" placeholder="X (Twitter) URL" value={brandingData.twitter || ""} onChange={(e) => setBrandingData({ ...brandingData, twitter: e.target.value })} />
                </div>
            </div>
          </div>
        </div>

        <SheetFooter>
          <SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose>
          <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// 4. Policies (FIXED: State Sync + Padded Container)
function CustomizePoliciesDialog({ org, onSuccess, activeSlug }: any) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Use a fallback for null policies
  const [policies, setPolicies] = useState({
      terms_of_service: org.policies?.terms_of_service || "",
      privacy_policy: org.policies?.privacy_policy || "",
      refund_policy: org.policies?.refund_policy || ""
  });

  // Re-sync state when opening or when org changes
  useEffect(() => {
    if (open) {
        setPolicies({
            terms_of_service: org.policies?.terms_of_service || "",
            privacy_policy: org.policies?.privacy_policy || "",
            refund_policy: org.policies?.refund_policy || ""
        });
    }
  }, [open, org.policies]);

  const handleSubmit = async () => {
    if (!activeSlug) return;
    setLoading(true);
    
    const formData = new FormData();

    formData.append("policies", JSON.stringify(policies));

    try {
      await api.patch(`/organizations/${activeSlug}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Policies updated.");
      onSuccess();
      setOpen(false);
    } catch (e) {
      toast.error("Failed update.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="flex items-center justify-between p-4 px-6 hover:bg-muted/50 cursor-pointer transition-colors group">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
              <Scale className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="font-medium text-foreground block text-sm">Policies</span>
              <span className="text-xs text-muted-foreground">Terms & Conditions</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Manage</Button>
        </div>
      </SheetTrigger>
      
      <SheetContent className="sm:max-w-xl w-full flex flex-col">
        <SheetHeader>
            <SheetTitle>Organization Policies</SheetTitle>
            <SheetDescription>Define clear rules for your students and staff.</SheetDescription>
        </SheetHeader>
        
        {/* ADDED PADDING CONTAINER */}
        <div className="flex-1 overflow-y-auto py-6 px-1">
            <Tabs defaultValue="terms" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="terms">Terms</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy</TabsTrigger>
                    <TabsTrigger value="refund">Refunds</TabsTrigger>
                </TabsList>

                <TabsContent value="terms" className="space-y-4 mt-4">
                   <Label>Terms of Service</Label>
                   <PolicyBuilder 
                        value={policies.terms_of_service} 
                        onChange={(val) => setPolicies({...policies, terms_of_service: val})}
                        placeholder="Add a term..."
                   />
                </TabsContent>

                <TabsContent value="privacy" className="space-y-4 mt-4">
                   <Label>Privacy Policy</Label>
                   <PolicyBuilder 
                        value={policies.privacy_policy} 
                        onChange={(val) => setPolicies({...policies, privacy_policy: val})}
                        placeholder="Add a privacy statement..."
                   />
                </TabsContent>

                <TabsContent value="refund" className="space-y-4 mt-4">
                   <Label>Refund Policy</Label>
                   <PolicyBuilder 
                        value={policies.refund_policy} 
                        onChange={(val) => setPolicies({...policies, refund_policy: val})}
                        placeholder="Add a refund condition..."
                   />
                </TabsContent>
            </Tabs>
        </div>
        
        <SheetFooter>
            <Button onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : "Save Policies"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// 5. Taxonomy (Levels/Categories)
function TaxonomyManager({ activeSlug, type, title, description, icon }: any) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<TaxonomyItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [newItemName, setNewItemName] = useState("");

    const fetchItems = async () => {
        if (!activeSlug) return;
        setLoading(true);
        try {
            const res = await api.get(`/organizations/${activeSlug}/${type}/`);
            setItems(Array.isArray(res.data) ? res.data : res.data.results || []);
        } finally { setLoading(false); }
    };

    useEffect(() => { if (open) fetchItems(); }, [open, activeSlug]);

    const handleCreate = async () => {
        if(!newItemName.trim()) return;
        try {
            await api.post(`/organizations/${activeSlug}/${type}/`, { name: newItemName });
            setNewItemName("");
            fetchItems();
            toast.success("Added.");
        } catch(e) { toast.error("Failed to add item."); }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/organizations/${activeSlug}/${type}/${id}/`);
            fetchItems();
            toast.success("Deleted.");
        } catch(e) { toast.error("Failed to delete."); }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <div className="flex items-center justify-between p-4 px-6 hover:bg-muted/50 cursor-pointer transition-colors group">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-muted group-hover:bg-muted/80 transition-colors">{icon}</div>
                    <div>
                    <span className="font-medium text-foreground block text-sm">{title}</span>
                    <span className="text-xs text-muted-foreground">{description}</span>
                    </div>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Manage</Button>
                </div>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md w-full">
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                    <SheetDescription>Add or remove items from your {title.toLowerCase()}.</SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6 px-1">
                    {/* Add New Input */}
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Add new item..." 
                            value={newItemName} 
                            onChange={(e) => setNewItemName(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                        <Button onClick={handleCreate} size="icon"><Plus className="h-4 w-4"/></Button>
                    </div>
                    
                    {/* List */}
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                        {loading ? <Loader2 className="mx-auto animate-spin h-6 w-6 text-muted-foreground"/> : (
                            <>
                                {items.map(item => (
                                    <div key={item.id} className="group flex items-center justify-between p-3 border rounded-md bg-card hover:border-primary/50 transition-colors">
                                        <span className="text-sm font-medium">{item.name}</span>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ))}
                                {items.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                        <p className="text-sm">No items yet.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}