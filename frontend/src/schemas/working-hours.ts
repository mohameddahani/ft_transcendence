import { z } from "zod";

const militaryTimeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const addWorkingHourSchema = z
  .object({
    dayOfWeek: z
      .number()
      .int()
      .min(1, "Day must be between 1 (Monday) and 7 (Sunday)")
      .max(7, "Day must be between 1 (Monday) and 7 (Sunday)"),
    startTime: z
      .string()
      .regex(militaryTimeRegex, "Start time must be in HH:mm format (e.g. 09:00)"),
    endTime: z
      .string()
      .regex(militaryTimeRegex, "End time must be in HH:mm format (e.g. 22:00)"),
    isClosed: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.isClosed) return true;
      return data.startTime < data.endTime;
    },
    {
      message: "Start time must be earlier than end time",
      path: ["endTime"],
    }
  );

export type AddWorkingHourFormValues = z.infer<typeof addWorkingHourSchema>;

export const updateWorkingHourSchema = z
  .object({
    dayOfWeek: z.number().int().min(1).max(7).optional(),
    startTime: z
      .string()
      .regex(militaryTimeRegex, "Start time must be in HH:mm format (e.g. 09:00)")
      .optional(),
    endTime: z
      .string()
      .regex(militaryTimeRegex, "End time must be in HH:mm format (e.g. 22:00)")
      .optional(),
    isClosed: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.isClosed) return true;
      if (data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    {
      message: "Start time must be earlier than end time",
      path: ["endTime"],
    }
  );

export type UpdateWorkingHourFormValues = z.infer<typeof updateWorkingHourSchema>;

export const addSpecialHourSchema = z
  .object({
    startDate: z
      .string()
      .min(1, "Start date is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
    endDate: z
      .string()
      .min(1, "End date is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
    isFullDay: z.boolean(),
    startTime: z
      .string()
      .regex(militaryTimeRegex, "Start time must be in HH:mm format")
      .optional()
      .or(z.literal("")),
    endTime: z
      .string()
      .regex(militaryTimeRegex, "End time must be in HH:mm format")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      return data.startDate <= data.endDate;
    },
    {
      message: "Start date cannot be after end date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (data.isFullDay) return true;
      if (!data.startTime && !data.endTime) return true;
      if (data.startTime && !data.endTime) return false;
      if (!data.startTime && data.endTime) return false;
      if (data.startDate === data.endDate && data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    {
      message: "Start time must be earlier than end time for same-day closure",
      path: ["endTime"],
    }
  );

export type AddSpecialHourFormValues = z.infer<typeof addSpecialHourSchema>;

export const updateSpecialHourSchema = z
  .object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
      .optional(),
    isFullDay: z.boolean().default(true),
    startTime: z
      .string()
      .regex(militaryTimeRegex, "Start time must be in HH:mm format")
      .optional()
      .or(z.literal("")),
    endTime: z
      .string()
      .regex(militaryTimeRegex, "End time must be in HH:mm format")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: "Start date cannot be after end date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (data.isFullDay) return true;
      if (!data.startTime && !data.endTime) return true;
      if (data.startDate && data.endDate && data.startDate === data.endDate && data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    {
      message: "Start time must be earlier than end time for same-day closure",
      path: ["endTime"],
    }
  );

export type UpdateSpecialHourFormValues = z.infer<typeof updateSpecialHourSchema>;
