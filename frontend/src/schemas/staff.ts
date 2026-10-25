import { z } from "zod";

export const StaffGenderEnum = z.enum(["MALE", "FEMALE"]);

export const addStaffSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(30, "First name cannot exceed 30 characters")
    .regex(/^[A-Za-z]+$/, "First name must contain only letters"),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(30, "Last name cannot exceed 30 characters")
    .regex(/^[A-Za-z]+$/, "Last name must contain only letters"),
  gender: StaffGenderEnum,
  birthDate: z
    .string()
    .min(1, "Birth date is required")
    .refine((val) => !isNaN(Date.parse(val)), "Please enter a valid birth date"),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .transform((val) => val.replace(/\s+/g, ""))
    .refine((val) => /^\+?[1-9]\d{7,14}$/.test(val), {
      message: "Please enter a valid international phone number (e.g. +212607080904)",
    }),
});

export const updateStaffSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(30, "First name cannot exceed 30 characters")
    .regex(/^[A-Za-z]+$/, "First name must contain only letters")
    .optional(),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(30, "Last name cannot exceed 30 characters")
    .regex(/^[A-Za-z]+$/, "Last name must contain only letters")
    .optional(),
  gender: StaffGenderEnum.optional(),
  birthDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Please enter a valid birth date")
    .optional(),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .optional(),
  phoneNumber: z
    .string()
    .transform((val) => val.replace(/\s+/g, ""))
    .refine((val) => /^\+?[1-9]\d{7,14}$/.test(val), {
      message: "Please enter a valid international phone number",
    })
    .optional(),
});

export type AddStaffFormValues = z.infer<typeof addStaffSchema>;
export type UpdateStaffFormValues = z.infer<typeof updateStaffSchema>;
