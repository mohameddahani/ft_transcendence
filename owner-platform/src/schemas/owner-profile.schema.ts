import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(30, "First name must not exceed 30 characters")
    .regex(/^[a-zA-Z\- ]+$/, "First name can only contain letters, spaces, and hyphens")
    .transform((v) => v.trim()),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(30, "Last name must not exceed 30 characters")
    .regex(/^[a-zA-Z\- ]+$/, "Last name can only contain letters, spaces, and hyphens")
    .transform((v) => v.trim()),
  gender: z.enum(["MALE", "FEMALE"], {
    message: "Please select MALE or FEMALE",
  }),
  birthDate: z
    .string()
    .min(1, "Birth date is required")
    .refine((v) => !isNaN(Date.parse(v)), { message: "Invalid date format" }),
  email: z
    .string()
    .email("Invalid email address")
    .transform((v) => v.trim()),
  phoneNumber: z
    .string()
    .min(8, "Phone number must be at least 8 digits")
    .max(20, "Phone number must not exceed 20 digits")
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => /^\+?[0-9]{8,20}$/.test(v), {
      message: "Please enter a valid international phone number (e.g. +212607080904)",
    }),
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must not exceed 100 characters")
    .transform((v) => v.trim()),
  password: z
    .string()
    .optional()
    .refine((v) => {
      if (!v || v.trim() === "") return true;
      if (v.length < 8 || v.length > 64) return false;
      if (!/[A-Z]/.test(v)) return false;
      if (!/[a-z]/.test(v)) return false;
      if (!/[0-9]/.test(v)) return false;
      if (!/[^A-Za-z0-9]/.test(v)) return false;
      if (/\s/.test(v)) return false;
      return true;
    }, {
      message:
        "Password must be 8–64 characters, include uppercase, lowercase, digit, symbol, and no spaces",
    }),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
