import { z } from "zod";

export type EventStatus = "draft" | "pending_approval" | "approved" | "scheduled" | "ongoing" | "completed" | "cancelled" | "postponed";

export interface EventAttendee {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  ticket_id: string;
  status: "registered" | "attended" | "cancelled";
  payment_status: "paid" | "pending" | "free";
  registered_at: string;
  checked_in_at?: string;
}

export interface EventAgendaItem {
  id?: number;
  time: string;
  title: string;
  description?: string;
}

export interface EventRuleItem {
  id?: number;
  title: string;
  text: string;
}

export interface EventObjectiveItem {
  id?: number;
  text: string;
}

export interface EventManagementData {
  id: number;
  slug: string;
  title: string;
  overview: string;
  description: string;
  event_type: "online" | "physical" | "hybrid";
  event_status: EventStatus;
  start_time: string;
  end_time: string;
  timezone: string;
  location?: string;
  meeting_link?: string;
  is_paid: boolean;
  price?: number;
  currency?: string;
  max_attendees: number;
  registrations_count: number;
  banner_image?: string;
  registration_open: boolean;
  registration_deadline?: string;
  learning_objectives: EventObjectiveItem[];
  agenda: EventAgendaItem[];
  rules: EventRuleItem[];
  course: {
    id: number;
    title: string;
  };
  who_can_join: "course_students" | "org_students" | "anyone";
}

export const EssentialsSchema = z.object({
  title: z.string().min(3, "Title is required"),
  course: z.string().min(1, "Course association is required"),
  event_type: z.enum(["online", "physical", "hybrid"]),
  who_can_join: z.enum(["course_students", "org_students", "anyone"]),
  overview: z.string().optional(),
  description: z.string().optional(),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  timezone: z.string().min(1),
  location: z.string().optional(),
  meeting_link: z.string().optional(),
  banner_image: z.any().optional(),
});

export const ProgramSchema = z.object({
  learning_objectives: z.array(z.object({ text: z.string().min(1, "Required") })),
  agenda: z.array(z.object({ 
    time: z.string().min(1, "Time required"), 
    title: z.string().min(1, "Title required"), 
    description: z.string().optional() 
  })),
  rules: z.array(z.object({ 
    title: z.string().min(1, "Title required"), 
    text: z.string().min(1, "Text required") 
  })),
});

export const SettingsSchema = z.object({
  event_status: z.string(),
  registration_open: z.boolean(),
  max_attendees: z.number().min(1),
  registration_deadline: z.string().optional(),
  is_paid: z.boolean(),
  price: z.number().optional(),
  currency: z.string().optional(),
});

export const UpdateAttendeeSchema = z.object({
  status: z.enum(["registered", "attended", "cancelled"]),
});

export type EssentialsValues = z.infer<typeof EssentialsSchema>;
export type ProgramValues = z.infer<typeof ProgramSchema>;
export type SettingsValues = z.infer<typeof SettingsSchema>;
export type UpdateAttendeeValues = z.infer<typeof UpdateAttendeeSchema>;