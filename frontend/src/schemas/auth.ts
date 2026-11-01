import { z } from "zod";

export const registerSchema = z.object({
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
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"], {
    message: "Please select a gender",
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
  countryCode: z.string().min(1, "Country code is required"),
  phone: z
    .string()
    .trim()
    .min(6, "Phone number must be at least 6 digits")
    .max(15, "Phone number cannot exceed 15 digits")
    .regex(/^[0-9\s\-()]+$/, "Phone number can only contain digits"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[0-9]/, "Password must include at least one number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must include at least one special character"),
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, "You must accept the Terms of Service and Privacy Policy"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .trim()
    .min(1, "Password is required"),
});

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

// Backward compatibility alias
export const loginSchema = adminLoginSchema;
export type LoginFormValues = AdminLoginFormValues;

export const staffLoginSchema = z.object({
  userName: z
    .string()
    .trim()
    .min(1, "Username is required")
    .min(2, "Username must be at least 2 characters"),
  password: z
    .string()
    .trim()
    .min(1, "Password is required"),
});

export type StaffLoginFormValues = z.infer<typeof staffLoginSchema>;

export const memberLoginSchema = z.object({
  userName: z
    .string()
    .trim()
    .min(1, "Username is required")
    .min(2, "Username must be at least 2 characters"),
  password: z
    .string()
    .trim()
    .min(1, "Password is required"),
});

export type MemberLoginFormValues = z.infer<typeof memberLoginSchema>;

// Password rule that matches the Register and Backend validation rules
export const passwordRule = z
  .string()
  .trim()
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password cannot exceed 64 characters")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/[0-9]/, "Password must include at least one number")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    "Password must include at least one special character"
  )
  .refine((val) => !/\s/.test(val), "Password cannot contain spaces");

// Set Password Schema (Password + Confirmation)
export const setPasswordSchema = z
  .object({
    password: passwordRule,
    confirmPassword: z.string().trim().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;

// Reset Password Schema (Identical structure for password reset)
export const resetPasswordSchema = setPasswordSchema;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// Forgot Password Schemas
export const forgotPasswordAdminSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});
export type ForgotPasswordAdminFormValues = z.infer<typeof forgotPasswordAdminSchema>;

export const forgotPasswordUsernameSchema = z.object({
  userName: z
    .string()
    .trim()
    .min(1, "Username is required")
    .min(2, "Username must be at least 2 characters"),
});
export type ForgotPasswordUsernameFormValues = z.infer<typeof forgotPasswordUsernameSchema>;


