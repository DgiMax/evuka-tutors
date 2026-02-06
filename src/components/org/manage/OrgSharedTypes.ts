import { z } from "zod";

export const orgSettingsSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  org_type: z.enum(["school", "homeschool"]),
  // Relaxed for Draft mode
  description: z.string().optional().or(z.literal("")), 
  
  status: z.enum(["draft", "pending_approval", "approved", "suspended", "archived"]),

  membership_price: z.coerce.number().min(0).default(0),
  membership_period: z.enum(["monthly", "yearly", "lifetime", "free"]),
  membership_duration_value: z.coerce.number().min(1).default(1),

  founder_commission_percent: z.coerce.number().min(40).max(100).default(40),
  payout_frequency: z.enum(["weekly", "monthly", "manual"]).default("monthly"),
  payout_anchor_day: z.coerce.number().min(1).max(28).default(1),
  auto_distribute: z.boolean().default(true),

  branding: z.object({
    website: z.string().optional().or(z.literal("")),
    linkedin: z.string().optional().or(z.literal("")),
    facebook: z.string().optional().or(z.literal("")),
    twitter: z.string().optional().or(z.literal("")),
  }).optional(),

  logo: z.any().optional(),

  policies: z.object({
    terms_of_service: z.string().optional().or(z.literal("")),
    privacy_policy: z.string().optional().or(z.literal("")),
    refund_policy: z.string().optional().or(z.literal("")),
  }),

  levels: z.array(z.any()).default([]),
  categories: z.array(z.any()).default([]),
}).refine((data) => {
  if (data.status === "pending_approval") {
    const hasDescription = !!data.description && data.description.length >= 10;
    const hasFinancials = (data.membership_period === "free" || data.membership_price > 0);
    const hasPolicies = !!data.policies.terms_of_service && 
                        !!data.policies.privacy_policy && 
                        !!data.policies.refund_policy;
    
    return hasDescription && hasFinancials && hasPolicies;
  }
  return true;
}, {
  message: "Description (min 10 chars) and all Policies are required to request approval.",
  path: ["status"],
});

export type OrgSettingsValues = z.infer<typeof orgSettingsSchema>;

export interface OrganizationManagementData {
  id: number;
  slug: string;
  name: string;
  org_type: "school" | "homeschool";
  description: string;
  logo: string | null;
  status: "draft" | "pending_approval" | "approved" | "suspended" | "archived";
  approved: boolean;
  membership_price: number;
  membership_period: "monthly" | "yearly" | "lifetime" | "free";
  membership_duration_value: number;
  founder_commission_percent: number;
  payout_frequency: "weekly" | "monthly" | "manual";
  payout_anchor_day: number;
  auto_distribute: boolean;
  branding: { website?: string; linkedin?: string; facebook?: string; twitter?: string; };
  policies: { terms_of_service: string; privacy_policy: string; refund_policy: string; };
  levels: any[];
  categories: any[];
  stats: { students: number; tutors: number; courses: number; upcoming_events: number; };
  created_at: string;
}