import { z } from "zod";

export const addPlanSchema = z.object({
  planName: z
    .string()
    .min(2, "Plan name must be at least 2 characters")
    .max(30, "Plan name must not exceed 30 characters"),
  maxMembers: z
    .number()
    .int("Max members must be a whole number")
    .positive("Max members must be greater than 0"),
  description: z
    .string()
    .max(200, "Description must not exceed 200 characters")
    .optional(),
  initialDurationDays: z
    .number()
    .int("Days must be a whole number")
    .positive("Days must be greater than 0")
    .optional(),
  initialPrice: z
    .number()
    .min(0, "Price must be 0 or greater")
    .optional(),
});

export type AddPlanFormValues = {
  planName: string;
  maxMembers: number;
  description?: string;
  initialDurationDays?: number;
  initialPrice?: number;
};

export const addDurationSchema = z.object({
  durationDays: z
    .number()
    .int("Duration must be a whole number")
    .positive("Duration must be at least 1 day"),
  price: z
    .number()
    .min(0, "Price cannot be negative"),
});

export type AddDurationFormValues = {
  durationDays: number;
  price: number;
};

