import * as z from "zod";

const baseSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  status: z.enum(["draft", "pending_approval", "approved", "suspended", "archived"]).default("draft"),
  
  org_type: z.enum(["school", "homeschool"]).or(z.literal("")), 
  
  description: z.string().optional(),

  membership_price: z.coerce.number().min(0).default(0),
  membership_period: z.enum(["monthly", "yearly", "lifetime", "free"]).or(z.literal("")),
  membership_duration_value: z.coerce.number().optional(),

  founder_commission_percent: z.coerce.number().min(40, "Founder commission must be at least 40%").max(100, "Cannot exceed 100%").default(90),
  payout_frequency: z.enum(["weekly", "monthly", "manual"]).default("monthly"),
  payout_anchor_day: z.coerce.number().min(1).max(28).default(1),
  auto_distribute: z.boolean().default(true),

  levels: z.array(z.object({
    name: z.string().min(1, "Level name required"),
    order: z.number().default(0)
  })).optional(),
  
  categories: z.array(z.object({
    name: z.string().min(1, "Category name required")
  })).optional(),

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

export const orgFormSchema = baseSchema.superRefine((data, ctx) => {
  if (data.status === 'draft') {
    return;
  }

  if (!data.org_type) {
    ctx.addIssue({ path: ['org_type'], code: z.ZodIssueCode.custom, message: "Organization Type is required." });
  }

  if (!data.description || data.description.length < 10) {
    ctx.addIssue({ path: ['description'], code: z.ZodIssueCode.custom, message: "Description is required (min 10 chars)." });
  }

  if (data.membership_period !== 'free' && (!data.membership_price || data.membership_price <= 0)) {
    ctx.addIssue({ path: ['membership_price'], code: z.ZodIssueCode.custom, message: "Price is required for paid memberships." });
  }

  if (!data.levels || data.levels.length === 0) {
    ctx.addIssue({ path: ['levels'], code: z.ZodIssueCode.custom, message: "At least one Level is required." });
  }

  if (!data.categories || data.categories.length === 0) {
    ctx.addIssue({ path: ['categories'], code: z.ZodIssueCode.custom, message: "At least one Category/Subject is required." });
  }

  if (!data.policies?.terms_of_service || data.policies.terms_of_service.length < 10) {
    ctx.addIssue({ path: ['policies', 'terms_of_service'], code: z.ZodIssueCode.custom, message: "Terms of Service are required." });
  }

  if (!data.policies?.privacy_policy || data.policies.privacy_policy.length < 10) {
    ctx.addIssue({ path: ['policies', 'privacy_policy'], code: z.ZodIssueCode.custom, message: "Privacy Policy is required." });
  }

  if (data.branding?.website && !data.branding.website.startsWith('http')) {
     ctx.addIssue({ path: ['branding', 'website'], code: z.ZodIssueCode.custom, message: "Invalid URL" });
  }

  if (data.payout_frequency === 'monthly' && (!data.payout_anchor_day || data.payout_anchor_day < 1 || data.payout_anchor_day > 28)) {
    ctx.addIssue({ path: ['payout_anchor_day'], code: z.ZodIssueCode.custom, message: "Monthly payouts require a valid day (1-28)." });
  }
});

export type OrgFormValues = z.infer<typeof orgFormSchema>;

export const statusOptions: Record<string, string> = {
    draft: "Draft",
    pending_approval: "Pending Approval",
    approved: "Approved",
    suspended: "Suspended",
    archived: "Archived",
};