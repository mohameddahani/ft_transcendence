"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AtSign, Lock, LogIn, Loader2, AlertCircle } from "lucide-react";

import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      const response = await api.post("/api/login", data);

      toast.success("Login successful! Redirecting...");

      if (response.data?.accessToken) {
        localStorage.setItem("access_token", response.data.accessToken);
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      let message = "Network error. Is the API running?";

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
          message = "Too many attempts. Please wait a minute and try again.";
        } else if (err.response?.data?.message) {
          const apiMessage = err.response.data.message;
          message = Array.isArray(apiMessage)
            ? apiMessage.join(", ")
            : String(apiMessage);
        } else if (err.response?.status) {
          message = `Login failed (${err.response.status})`;
        }
      }

      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Email Field */}
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="block font-label-caps text-label-caps text-on-surface-variant uppercase cursor-pointer"
          >
            Email Address
          </Label>
          <div className="relative group">
            <AtSign
              className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px] text-on-surface-variant group-focus-within:text-primary transition-colors pointer-events-none z-10"
              aria-hidden="true"
            />
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="admin@kinetic.internal"
              disabled={isSubmitting}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={cn(
                "!h-row-height-md pl-10 pr-container-padding bg-[#2a2a2a] border border-outline-variant rounded font-mono-data text-mono-data text-on-surface placeholder:text-outline-variant input-focus-ring transition-all focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary",
                errors.email && "!border-error focus-visible:!border-error focus-visible:!ring-error"
              )}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p
              id="email-error"
              role="alert"
              className="font-body-sm text-body-sm text-error mt-1"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label
              htmlFor="password"
              className="block font-label-caps text-label-caps text-on-surface-variant uppercase cursor-pointer"
            >
              Password
            </Label>
          </div>
          <div className="relative group">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px] text-on-surface-variant group-focus-within:text-primary transition-colors pointer-events-none z-10"
              aria-hidden="true"
            />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={cn(
                "!h-row-height-md pl-10 pr-container-padding bg-[#2a2a2a] border border-outline-variant rounded font-mono-data text-mono-data text-on-surface placeholder:text-outline-variant input-focus-ring transition-all focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary",
                errors.password && "!border-error focus-visible:!border-error focus-visible:!ring-error"
              )}
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p
              id="password-error"
              role="alert"
              className="font-body-sm text-body-sm text-error mt-1"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Server / API Error Message */}
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2 border border-error/40 bg-error-container/20 px-3 py-2 rounded"
          >
            <AlertCircle className="size-4 text-error shrink-0 mt-0.5" aria-hidden="true" />
            <p className="font-body-sm text-body-sm text-error">{serverError}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full !h-row-height-md bg-inverse-primary text-on-primary font-headline-sm text-headline-sm rounded hover:bg-primary transition-colors active:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />
                <span>Validating...</span>
              </>
            ) : (
              <>
                <span>Log In</span>
                <LogIn className="size-[18px]" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  );
}