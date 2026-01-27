import { z } from "zod";

export const orgSettingsSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  org_type: z.enum(["school", "homeschool"]),
  description: z.string().optional(),
  
  status: z.enum(["draft", "pending_approval", "approved", "suspended", "archived"]),

  membership_price: z.coerce.number().min(0).default(0),
  membership_period: z.enum(["monthly", "yearly", "lifetime", "free"]),
  membership_duration_value: z.coerce.number().optional(),

  // Financial Settings
  payout_frequency: z.enum(["weekly", "monthly", "manual"]).default("monthly"),
  payout_anchor_day: z.coerce.number().min(1).max(28).default(1),
  auto_distribute: z.boolean().default(true),

  branding: z.object({
    website: z.string().optional(),
    linkedin: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
  }).optional(),

  logo: z.any().optional(),

  policies: z.object({
    terms_of_service: z.string().optional(),
    privacy_policy: z.string().optional(),
    refund_policy: z.string().optional(),
  }).optional(),
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

  payout_frequency: "weekly" | "monthly" | "manual";
  payout_anchor_day: number;
  auto_distribute: boolean;

  branding: {
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
  stats: {
    students: number;
    tutors: number;
    courses: number;
    upcoming_events: number;
  };
  created_at: string;
}