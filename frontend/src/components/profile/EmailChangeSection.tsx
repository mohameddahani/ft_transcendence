"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
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
  Sparkles,
  RotateCcw,
} from "lucide-react";
import {
  requestEmailChangeSchema,
  RequestEmailChangeFormValues,
} from "@/schemas/profile";
import {
  requestEmailChangeAdmin,
  requestEmailChangeStaff,
  requestEmailChangeMember,
} from "@/lib/api/profile";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EmailChangeSectionProps {
  role: "admin" | "staff" | "member";
  currentEmail: string;
}

export default function EmailChangeSection({
  role,
  currentEmail,
}: EmailChangeSectionProps) {
  const { t } = useTranslation();
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
      let res: { message: string };
      if (role === "admin") {
        res = await requestEmailChangeAdmin(data);
      } else if (role === "staff") {
        res = await requestEmailChangeStaff(data);
      } else {
        res = await requestEmailChangeMember(data);
      }

      const msg =
        res.message ||
        t(
          "emailVerificationDispatched",
          "A verification email has been sent to your new email address."
        );
      setBackendMessage(msg);
      setPendingEmail(data.email.trim());
      toast.success(msg);
      reset();
    } catch (err: unknown) {
      let msg = t(
        "requestEmailChangeFailed",
        "Failed to request email change. Please check your credentials and try again."
      );
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

  const handleReset = () => {
    setBackendMessage(null);
    setPendingEmail("");
    setApiError(null);
    reset();
  };

  return (
    <Card className="toota-card border-none">
      <CardHeader className="p-6 pb-4 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Mail className="size-4 text-toota-ink" />
            <div>
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("changeEmailTitle", "Change Email Address")}
              </CardTitle>
              <p className="text-xs text-toota-muted mt-0.5">
                {t(
                  "changeEmailSubtitle",
                  "A confirmation email will be sent to your new email address to complete the update."
                )}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs self-start sm:self-auto">
            <ShieldCheck className="size-3 text-emerald-500 shrink-0" />
            <span>{t("securityProtected", "Requires Re-authentication")}</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Current Email Display */}
        <div className="p-3.5 bg-toota-inner rounded-xl border border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-toota-muted font-medium">
              {t("currentActiveEmail", "Current Active Email")}:
            </span>
            <span className="font-semibold text-toota-ink font-mono">
              {currentEmail || "—"}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs self-start sm:self-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>{t("active", "Active")}</span>
          </span>
        </div>

        {/* Success Notification State */}
        {backendMessage ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="size-3.5 text-emerald-500" />
                  <span>{t("verificationSentBadge", "Verification Link Sent")}</span>
                </div>
                <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
                  {backendMessage}
                </p>
                <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                  {t(
                    "pendingEmailInstruction",
                    "We dispatched a verification email to {{email}}. Open the email and click the confirmation button to activate your new email address. Your current email remains active until confirmed.",
                    { email: pendingEmail }
                  )}
                </p>
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="toota-pill h-8 text-xs font-semibold border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 cursor-pointer"
              >
                <RotateCcw className="size-3.5 me-1.5" />
                <span>{t("sendAnotherEmailChange", "Change to a Different Email")}</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* API Error Alert */}
            {apiError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p className="font-medium">{apiError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* New Email Input */}
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-medium text-toota-ink"
                  htmlFor="new-email-field"
                >
                  {t("newEmailAddress", "New Email Address")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="size-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-toota-muted pointer-events-none" />
                  <Input
                    id="new-email-field"
                    type="email"
                    placeholder="e.g. new.email@sportium.com"
                    autoComplete="email"
                    {...register("email")}
                    className={`pl-10 rtl:pl-3.5 rtl:pr-10 h-10 bg-toota-inner text-xs text-toota-ink rounded-xl ${
                      errors.email
                        ? "border-rose-500 focus-visible:ring-rose-500"
                        : "border-border/40 focus-visible:ring-zinc-400"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>{errors.email.message}</span>
                  </p>
                )}
              </div>

              {/* Current Password Input */}
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-medium text-toota-ink"
                  htmlFor="current-password-field"
                >
                  {t("currentPassword", "Current Password")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="size-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-toota-muted pointer-events-none" />
                  <Input
                    id="current-password-field"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register("currentPassword")}
                    className={`pl-10 pr-10 rtl:pl-10 rtl:pr-10 h-10 bg-toota-inner text-xs text-toota-ink rounded-xl ${
                      errors.currentPassword
                        ? "border-rose-500 focus-visible:ring-rose-500"
                        : "border-border/40 focus-visible:ring-zinc-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-toota-muted hover:text-toota-ink transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>{errors.currentPassword.message}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-[11px] text-toota-muted">
                {t(
                  "emailChangeNotice",
                  "You will receive a confirmation link with an action button to verify your new email address."
                )}
              </p>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin me-2" />
                    <span>{t("sendingRequest", "Sending...")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("requestEmailChangeBtn", "Send Verification Email")}</span>
                    <ArrowRight className="size-3.5 ms-2 rtl:rotate-180" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
