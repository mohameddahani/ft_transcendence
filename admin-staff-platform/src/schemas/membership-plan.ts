import { z } from "zod";

export const addMembershipPlanSchema = z.object({
  planName: z
    .string()
    .trim()
    .min(2, "Plan name must be at least 2 characters")
    .max(30, "Plan name cannot exceed 30 characters"),
  description: z
    .string()
    .trim()
    .max(200, "Description cannot exceed 200 characters")
    .optional()
    .or(z.literal("")),
  weeklyVisitLimit: z
    .number()
    .int("Must be a whole number")
    .min(1, "Weekly visits must be at least 1")
    .max(7, "Weekly visits cannot exceed 7"),
});

export type AddMembershipPlanFormValues = z.infer<typeof addMembershipPlanSchema>;

export const updateMembershipPlanSchema = z.object({
  planName: z
    .string()
    .trim()
    .min(2, "Plan name must be at least 2 characters")
    .max(30, "Plan name cannot exceed 30 characters"),
  description: z
    .string()
    .trim()
    .max(200, "Description cannot exceed 200 characters")
    .optional()
    .or(z.literal("")),
  weeklyVisitLimit: z
    .number()
    .int("Must be a whole number")
    .min(1, "Weekly visits must be at least 1")
    .max(7, "Weekly visits cannot exceed 7"),
  isActive: z.boolean(),
});

export type UpdateMembershipPlanFormValues = z.infer<typeof updateMembershipPlanSchema>;

export const durationSchema = z.object({
  durationDays: z
    .number()
    .int("Duration days must be an integer")
    .positive("Duration days must be greater than 0"),
  price: z
    .number()
    .positive("Price must be greater than 0"),
});

export type DurationFormValues = z.infer<typeof durationSchema>;
