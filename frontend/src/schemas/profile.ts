import { z } from "zod";

export const updateProfileSchema = z.object({
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
  gender: z.enum(["MALE", "FEMALE"], {
    message: "Please select a valid gender",
  }),
  birthDate: z
    .string()
    .min(1, "Birth date is required")
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date < new Date();
    }, "Birth date must be a valid date in the past"),
  companyName: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(
      /^\+[1-9]\d{6,14}$/,
      "Please enter a valid international phone number (e.g. +14155552671 or +212607080904)"
    ),
  password: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim().length === 0) return true;
        return (
          val.length >= 8 &&
          /[A-Z]/.test(val) &&
          /[a-z]/.test(val) &&
          /[0-9]/.test(val) &&
          /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)
        );
      },
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
    ),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
