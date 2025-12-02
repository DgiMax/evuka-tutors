// app/(tutor)/onboarding/TutorFormTypes.ts

import { z } from "zod";

export const tutorSchema = z.object({
  profileImage: z.any().nullable().optional(),
  displayName: z.string().min(3, "Display name is required (min 3 characters)."),
  headline: z.string().min(10, "Headline must be at least 10 characters."),
  bio: z.string().min(20, "Bio must be at least 20 characters."),
  introVideoFile: z.any().nullable().optional(),
  subjects: z
    .array(z.object({ name: z.string().min(1) }))
    .min(1, "You must list at least one subject."),
  education: z.string().min(5, "Education details must be at least 5 characters."),
});

export type TutorOnboardingFormData = z.infer<typeof tutorSchema>;

export const steps = [
  { id: 1, title: "Profile Basics", fields: ["displayName", "headline"] as const },
  { id: 2, title: "Details & Video", fields: ["bio", "introVideoFile"] as const },
  { id: 3, title: "Expertise & Education", fields: ["subjects", "education"] as const },
];