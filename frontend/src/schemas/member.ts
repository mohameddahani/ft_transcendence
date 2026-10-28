import { z } from "zod";

export const GenderEnum = z.enum(["MALE", "FEMALE"]);

export const addMemberSchema = z.object({
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
  gender: GenderEnum,
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
  address: z
    .string()
    .trim()
    .min(2, "Address must be at least 2 characters")
    .max(30, "Address cannot exceed 30 characters"),
  emergencyContact: z
    .string()
    .min(1, "Emergency contact is required")
    .transform((val) => val.replace(/\s+/g, ""))
    .refine((val) => /^\+?[1-9]\d{7,14}$/.test(val), {
      message: "Please enter a valid international emergency phone number (e.g. +212607080905)",
    }),
  membershipPlanId: z.string().uuid("Please select a membership plan"),
  membershipPlanDurationId: z.string().uuid("Please select a duration"),
});

export const updateMemberSchema = z.object({
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
  gender: GenderEnum.optional(),
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
  address: z
    .string()
    .trim()
    .min(2, "Address must be at least 2 characters")
    .max(30, "Address cannot exceed 30 characters")
    .optional(),
  emergencyContact: z
    .string()
    .transform((val) => val.replace(/\s+/g, ""))
    .refine((val) => /^\+?[1-9]\d{7,14}$/.test(val), {
      message: "Please enter a valid international emergency phone number",
    })
    .optional(),
  membershipPlanId: z.string().uuid().optional(),
  membershipPlanDurationId: z.string().uuid().optional(),
});

export type AddMemberFormValues = z.infer<typeof addMemberSchema>;
export type UpdateMemberFormValues = z.infer<typeof updateMemberSchema>;
