import * as z from "zod";

const baseSchema = z.object({
  title: z.string().min(3, "Title is required (min 3 chars)."),
  course: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(1, "You must select a course.")
  ),
  event_status: z.string().default("draft"),
  overview: z.string().optional(),
  description: z.string().optional(),
  event_type: z.string().optional(),
  who_can_join: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  timezone: z.string().default("Africa/Nairobi"),
  location: z.string().optional(),
  meeting_link: z.string().optional(),
  max_attendees: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  registration_open: z.boolean().default(true),
  registration_deadline: z.string().optional(),
  is_paid: z.boolean().default(false),
  price: z.preprocess(
    (val) => (val === "" || val === undefined ? 0 : Number(val)),
    z.number().optional()
  ),
  currency: z.string().default("KES"),
  banner_image: z.any().optional(),
  agenda: z.array(z.object({
    time: z.string().min(1, "Required"),
    title: z.string().min(1, "Required"),
    description: z.string().optional()
  })).optional(),
  learning_objectives: z.array(z.object({ 
    text: z.string().min(1, "Required") 
  })).optional(),
  rules: z.array(z.object({ 
    title: z.string().min(1, "Required"), 
    text: z.string().min(1, "Required") 
  })).optional(),
  attachments: z.array(z.any()).optional(),
});

export const eventSchema = baseSchema.superRefine((data, ctx) => {
  if (data.event_status === 'draft') {
    return;
  }

  if (!data.overview || data.overview.length < 5) {
    ctx.addIssue({ path: ['overview'], code: z.ZodIssueCode.custom, message: "Overview is required (min 5 chars)." });
  }
  if (!data.description || data.description.length < 10) {
    ctx.addIssue({ path: ['description'], code: z.ZodIssueCode.custom, message: "Description is required (min 10 chars)." });
  }
  if (!data.event_type) {
    ctx.addIssue({ path: ['event_type'], code: z.ZodIssueCode.custom, message: "Event type is required." });
  }
  if (!data.start_time) {
    ctx.addIssue({ path: ['start_time'], code: z.ZodIssueCode.custom, message: "Start time is required." });
  }
  if (!data.end_time) {
    ctx.addIssue({ path: ['end_time'], code: z.ZodIssueCode.custom, message: "End time is required." });
  }
  
  if (data.event_type === 'physical' || data.event_type === 'hybrid') {
     if (!data.location) ctx.addIssue({ path: ['location'], code: z.ZodIssueCode.custom, message: "Location is required for physical events." });
  }
  
  if (data.is_paid) {
    if (data.price === undefined || data.price <= 0) {
        ctx.addIssue({ path: ['price'], code: z.ZodIssueCode.custom, message: "Price must be greater than 0." });
    }
  }

  if (!data.registration_deadline) {
    ctx.addIssue({ path: ['registration_deadline'], code: z.ZodIssueCode.custom, message: "Registration deadline is required." });
  }
});

export type EventFormData = z.infer<typeof eventSchema>;