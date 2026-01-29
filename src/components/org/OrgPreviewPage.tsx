"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/axios";
import {
  Loader2,
  Facebook,
  Linkedin,
  Twitter,
  Globe,
  CreditCard,
  ShieldCheck,
  Eye,
  ArrowLeft,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { toast } from "sonner";

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
  org_type: string;
  description: string;
  membership_price: number;
  membership_period?: string;
  branding: {
    logo_url?: string;
    website?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
  policies: {
    terms_of_service?: string;
    privacy_policy?: string;
    refund_policy?: string;
  };
  stats: OrgStats;
}

function SocialLink({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const href = value.startsWith("http") ? value : `https://${value}`;
  return (
    <div className="flex items-center gap-3 p-2 rounded-md border border-transparent transition-all opacity-70">
      <div className="text-muted-foreground">
        {icon}
      </div>
      <div className="overflow-hidden">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
          {value.replace(/^https?:\/\/(www\.)?/, "").split('/')[0]}
        </p>
      </div>
    </div>
  );
}

export default function OrgPreviewClient() {
  const router = useRouter();
  const params = useParams();
  const currentSlug = params?.slug as string;
  const { user } = useAuth();
  const [org, setOrg] = useState<OrganizationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentMembership = user?.organizations?.find(
    (o: any) => o.organization_slug === currentSlug
  );

  const fetchOrgDetails = async () => {
    if (!currentSlug) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await api.get(`/organizations/${currentSlug}/details/`);
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
  }, [currentSlug]);

  if (isLoading)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  if (!org) return null;

  const hasPolicies =
    org.policies?.terms_of_service ||
    org.policies?.privacy_policy ||
    org.policies?.refund_policy;

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="relative bg-primary text-primary-foreground px-6 pt-12 pb-20 md:px-12">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Button
              onClick={() => router.push('/organizations')}
              variant="ghost"
              className="group flex items-center gap-2 text-primary-foreground/70 hover:text-white p-0 hover:bg-transparent font-black uppercase text-[10px] tracking-widest transition-all w-fit"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Management
            </Button>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-md flex items-center gap-2">
              <Eye size={16} className="text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Preview Mode</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="h-28 w-28 md:h-36 md:w-36 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-none overflow-hidden flex items-center justify-center shrink-0">
              {org.branding?.logo_url ? (
                <Image
                  src={org.branding.logo_url}
                  alt={org.name}
                  width={144}
                  height={144}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-5xl font-extrabold text-white/90">
                  {org.name.charAt(0)}
                </span>
              )}
            </div>

            <div className="flex-1 text-center md:text-left space-y-3">
              <Badge variant="secondary" className="bg-white/20 text-white border-transparent mb-1 font-black uppercase text-[10px] tracking-widest">
                 {org.org_type === 'school' ? 'School' : 'Homeschool Network'}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                {org.name}
              </h1>
              <p className="text-primary-foreground/80 text-lg max-w-2xl leading-relaxed mx-auto md:mx-0 line-clamp-2">
                {org.description || "Empowering minds through practical digital skills."}
              </p>
              
              <div className="pt-4 flex justify-center md:justify-start">
                <Button 
                    className="w-full sm:w-auto text-[12px] font-black uppercase tracking-widest h-12 px-10 shadow-none border-2 border-primary-foreground/30 text-primary-foreground/50 bg-primary-foreground/10 cursor-not-allowed"
                    disabled
                >
                    {org.membership_price > 0 ? `Enroll Now` : "Join for Free"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 -mt-10 relative z-10">
          <div className="bg-card border border-border rounded-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 shadow-sm">
             <div className="text-center">
                 <div className="text-3xl font-black text-primary">{org.stats?.students ?? 0}</div>
                 <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Students</div>
             </div>
             <div className="text-center border-l border-border">
                 <div className="text-3xl font-black text-primary">{org.stats?.tutors ?? 0}</div>
                 <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Tutors</div>
             </div>
             <div className="text-center border-l border-border">
                 <div className="text-3xl font-black text-primary">{org.stats?.courses ?? 0}</div>
                 <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Courses</div>
             </div>
             <div className="text-center border-l border-border">
                 <div className="text-3xl font-black text-primary">{org.stats?.upcoming_events ?? 0}</div>
                 <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Events</div>
             </div>
          </div>
      </div>

      <div className="container mx-auto px-4 md:px-12 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl">
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-4">
              <h2 className="text-xl font-black text-foreground uppercase tracking-widest border-b border-border pb-4">
                  About Us
              </h2>
              <div className="text-muted-foreground leading-relaxed text-sm space-y-4 font-medium">
                {org.description ? (
                  org.description.split("\n").map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))
                ) : (
                  <p className="italic">No detailed description provided.</p>
                )}
              </div>
          </div>

          {hasPolicies && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-foreground uppercase tracking-widest border-b border-border pb-4">
                  Organization Policies
              </h2>
              <Card className="shadow-none border-border">
                <CardContent className="p-5">
                  <Tabs
                    defaultValue={
                      org.policies.terms_of_service
                        ? "terms"
                        : org.policies.privacy_policy
                        ? "privacy"
                        : "refund"
                    }
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1">
                        {org.policies.terms_of_service && (
                            <TabsTrigger value="terms" className="text-[10px] font-black uppercase tracking-widest">Terms</TabsTrigger>
                        )}
                        {org.policies.privacy_policy && (
                            <TabsTrigger value="privacy" className="text-[10px] font-black uppercase tracking-widest">Privacy</TabsTrigger>
                        )}
                        {org.policies.refund_policy && (
                            <TabsTrigger value="refund" className="text-[10px] font-black uppercase tracking-widest">Refunds</TabsTrigger>
                        )}
                    </TabsList>

                    {org.policies.terms_of_service && (
                      <TabsContent value="terms" className="mt-0 prose prose-sm max-w-none text-muted-foreground font-medium whitespace-pre-wrap">
                          {org.policies.terms_of_service}
                      </TabsContent>
                    )}

                    {org.policies.privacy_policy && (
                      <TabsContent value="privacy" className="mt-0 prose prose-sm max-w-none text-muted-foreground font-medium whitespace-pre-wrap">
                          {org.policies.privacy_policy}
                      </TabsContent>
                    )}

                    {org.policies.refund_policy && (
                      <TabsContent value="refund" className="mt-0 prose prose-sm max-w-none text-muted-foreground font-medium whitespace-pre-wrap">
                          {org.policies.refund_policy}
                      </TabsContent>
                    )}
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="space-y-6">
            <h2 className="text-sm font-black text-foreground uppercase tracking-widest border-b border-border pb-4">Connect</h2>
            
            <div className="grid grid-cols-1 gap-1">
              {org.branding?.website && (
                <SocialLink icon={<Globe className="h-4 w-4" />} label="Website" value={org.branding.website} />
              )}
              {org.branding?.linkedin && (
                <SocialLink icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" value={org.branding.linkedin} />
              )}
              {org.branding?.facebook && (
                <SocialLink icon={<Facebook className="h-4 w-4" />} label="Facebook" value={org.branding.facebook} />
              )}
              {org.branding?.twitter && (
                <SocialLink icon={<Twitter className="h-4 w-4" />} label="X (Twitter)" value={org.branding.twitter} />
              )}
              {!org.branding?.website && !org.branding?.linkedin && !org.branding?.facebook && !org.branding?.twitter && (
                  <p className="text-xs text-muted-foreground italic font-medium">No social links provided.</p>
              )}
            </div>

            <div className="bg-muted/30 border border-border rounded-lg p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5" /> Membership Fee
                </h3>
                <p className="text-3xl font-black text-foreground">
                {org.membership_price > 0
                    ? `KES ${org.membership_price.toLocaleString()}`
                    : "Free"}
                </p>
                {org.membership_period && org.membership_price > 0 && (
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                        Per {org.membership_period}
                    </p>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t border-border/50">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-wider">
                      Verified Organization Secure Enrollment
                    </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}