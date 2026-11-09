"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import {
  requestEmailChangeSchema,
  RequestEmailChangeFormValues,
} from "@/schemas/owner-profile.schema";
import { requestEmailChangeOwner } from "@/lib/api/auth";

interface EmailChangeSectionProps {
  currentEmail: string;
}

export default function EmailChangeSection({ currentEmail }: EmailChangeSectionProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendMessage, setBackendMessage] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RequestEmailChangeFormValues>({
    resolver: zodResolver(requestEmailChangeSchema),
    defaultValues: {
      email: "",
      currentPassword: "",
    },
  });

  const onSubmit = async (data: RequestEmailChangeFormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const res = await requestEmailChangeOwner(data);
      const msg =
        res.message ||
        "A verification email has been sent to your new email address. Please click the link in that email to confirm your new address.";
      setBackendMessage(msg);
      setPendingEmail(data.email.trim());
      toast.success(msg);
      reset();
    } catch (err: unknown) {
      let msg = "Failed to request email change. Please check your credentials and try again.";
      if (err instanceof AxiosError && err.response?.data) {
        const errorData = err.response.data as {
          message?: string | string[];
          error?: string;
        };
        msg = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message || errorData.error || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setApiError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl p-4 sm:p-layout-margin shadow-sm space-y-5">
      <div className="border-b border-outline-variant/60 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            Change Email Address
          </h3>
        </div>
        <span className="text-xs text-on-surface-variant font-mono-data hidden sm:inline">
          Two-step verification protocol
        </span>
      </div>

      <p className="text-body-sm text-on-surface-variant leading-relaxed">
        To update your platform owner email address, enter your new email and current password.
        A verification link will be sent to the new email address for confirmation.
      </p>

      {/* Dispatched Confirmation Notice */}
      {backendMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
            <span>Verification Link Dispatched</span>
          </div>
          <p className="text-xs text-on-surface leading-relaxed">
            {backendMessage}
          </p>
          {pendingEmail && (
            <div className="pt-1 flex items-center gap-1.5 text-xs font-mono-data">
              <span className="text-on-surface-variant">Destination:</span>
              <span className="font-bold text-on-surface bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant">
                {pendingEmail}
              </span>
            </div>
          )}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setBackendMessage(null);
                setPendingEmail("");
              }}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="size-3" />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      )}

      {/* Inline Error Notice */}
      {apiError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
          <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-400" />
          <div className="flex-1">
            <p className="font-semibold">Unable to request email change</p>
            <p className="mt-0.5 opacity-90">{apiError}</p>
          </div>
        </div>
      )}

      {/* Request Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* New Email Address */}
          <div className="space-y-1">
            <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
              New Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant/50" />
              <input
                type="email"
                placeholder="new.owner@company.com"
                {...register("email")}
                className="w-full bg-surface-container-high border border-outline-variant rounded pl-9 pr-3 py-2 font-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/40"
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
            )}
            <p className="text-[11px] text-on-surface-variant">
              Must be different from your current email (<span className="font-mono-data text-on-surface">{currentEmail}</span>).
            </p>
          </div>

          {/* Current Password */}
          <div className="space-y-1">
            <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant/50" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter current password to verify identity"
                {...register("currentPassword")}
                className="w-full bg-surface-container-high border border-outline-variant rounded pl-9 pr-10 py-2 font-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-400 text-xs mt-1">{errors.currentPassword.message}</p>
            )}
            <p className="text-[11px] text-on-surface-variant">
              Your security credential is required before any email dispatch.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-primary text-on-primary px-5 py-2.5 rounded-lg font-headline-sm text-sm hover:brightness-110 active:opacity-80 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Sending Verification Link...</span>
              </>
            ) : (
              <>
                <span>Request Email Change</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

