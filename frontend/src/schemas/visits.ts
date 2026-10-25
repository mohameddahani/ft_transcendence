import { z } from "zod";

export const bookVisitSchema = z.object({
  visitDateAndTime: z
    .string()
    .min(1, "Please select visit date and time")
    .refine((val) => {
      const selected = new Date(val);
      return !isNaN(selected.getTime()) && selected > new Date();
    }, "Visit date and time must be scheduled in the future"),
});

export type BookVisitFormValues = z.infer<typeof bookVisitSchema>;
