"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/axios";
import {
  Loader2,
  Settings,
  Link as LinkIcon,
  Facebook,
  Linkedin,
  Twitter,
  Globe,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  CreditCard,
  Clock,
  Layers,
  Shield,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

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

function PolicyViewer({ content }: { content?: string }) {
  if (!content) return <p className="text-muted-foreground italic text-sm">No policy content available.</p>;

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

export default function OrgProfileClient() {
  const router = useRouter();
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
  const isAdminOrOwner = userRole === "admin" || userRole === "owner";

  const hasPolicies =
    org.policies?.terms_of_service ||
    org.policies?.privacy_policy ||
    org.policies?.refund_policy;

  return (
    <div className="bg-background min-h-screen pb-20">
      
      <div className="relative bg-primary text-primary-foreground px-6 py-12 md:px-12">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative">
            
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

            {isAdminOrOwner && (
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
                <Button
                  onClick={() => router.push(`/${activeSlug}`)}
                  variant="secondary"
                  className="bg-white/10 text-white border-0 hover:bg-white/20 hover:text-white backdrop-blur-sm"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </Button>
                
                <Button
                  onClick={() => router.push(`/organizations/${activeSlug}/manage`)}
                  variant="outline"
                  className="bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white backdrop-blur-sm"
                >
                  <Settings className="mr-2 h-4 w-4" /> Edit Info
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left border-t border-white/20 pt-8 mt-8">
            <StatItem label="Active Students" value={org.stats.students} />
            <StatItem label="Tutors & Staff" value={org.stats.tutors} />
            <StatItem label="Published Courses" value={org.stats.courses} />
            <StatItem label="Upcoming Events" value={org.stats.upcoming_events} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-12 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          
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

          <Card className="shadow-sm border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" /> Membership Structure
                </CardTitle>
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

          {hasPolicies && (
            <Card className="shadow-sm border-muted/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" /> Organization Policies
                  </CardTitle>
                  
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
                  
                  <div className="hidden md:block mb-6">
                    <TabsList className="w-full justify-start bg-muted/50 p-1">
                      {org.policies.terms_of_service && <TabsTrigger value="terms" className="flex-1">Terms of Service</TabsTrigger>}
                      {org.policies.privacy_policy && <TabsTrigger value="privacy" className="flex-1">Privacy Policy</TabsTrigger>}
                      {org.policies.refund_policy && <TabsTrigger value="refund" className="flex-1">Refund Policy</TabsTrigger>}
                    </TabsList>
                  </div>

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

        <div className="space-y-6">
          
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

        </div>

      </div>
    </div>
  );
}

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