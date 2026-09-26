import { z } from "zod";

export const activeSubscriptionSchema = z.object({
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters")
    // .max(20, "Username must not exceed 20 characters")
    .transform((val) => val.trim()),
  planId: z
    .string()
    .uuid("Please select a valid plan"),
  planDurationId: z
    .string()
    .uuid("Please select a valid duration"),
});

export type ActiveSubscriptionFormValues = {
  userName: string;
  planId: string;
  planDurationId: string;
};

export const cancelSubscriptionSchema = z.object({
  adminId: z.string().uuid("Invalid Admin ID"),
});

export type CancelSubscriptionFormValues = z.infer<typeof cancelSubscriptionSchema>;

