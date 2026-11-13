"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { muted } from "@/components/auth/authStyles";

interface PasswordStrengthMeterProps {
  password: string;
  confirmPassword?: string;
  showConfirmCheck?: boolean;
}

export default function PasswordStrengthMeter({
  password,
  confirmPassword = "",
  showConfirmCheck = true,
}: PasswordStrengthMeterProps) {
  const { t } = useTranslation();

  const rules = [
    {
      id: "length",
      label: t("ruleLength", "Between 8 and 64 characters"),
      valid: password.length >= 8 && password.length <= 64,
    },
    {
      id: "uppercase",
      label: t("ruleUppercase", "At least one uppercase letter (A-Z)"),
      valid: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: t("ruleLowercase", "At least one lowercase letter (a-z)"),
      valid: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: t("ruleNumber", "At least one number (0-9)"),
      valid: /[0-9]/.test(password),
    },
    {
      id: "special",
      label: t("ruleSpecial", "At least one special character (!@#$%^&*)"),
      valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    },
    {
      id: "noSpaces",
      label: t("ruleNoSpaces", "No spaces allowed"),
      valid: password.length > 0 && !/\s/.test(password),
    },
  ];

  if (showConfirmCheck && confirmPassword.length > 0) {
    rules.push({
      id: "match",
      label: t("ruleMatch", "Passwords match"),
      valid: password.length > 0 && password === confirmPassword,
    });
  }

  // Calculate score 0-4
  const passedCount = rules.filter((r) => r.id !== "match" && r.valid).length;
  let score = 0;
  if (passedCount >= 1) score = 1;
  if (passedCount >= 3) score = 2;
  if (passedCount >= 5) score = 3;
  if (passedCount === 6) score = 4;

  const strengthLabels = [
    t("strengthWeak", "Weak"),
    t("strengthFair", "Fair"),
    t("strengthGood", "Good"),
    t("strengthStrong", "Strong"),
  ];

  const getBarColor = (index: number) => {
    if (score === 0) return "bg-black/10 dark:bg-white/10";
    if (index >= score) return "bg-black/10 dark:bg-white/10";
    if (score === 1) return "bg-rose-500";
    if (score === 2) return "bg-amber-500";
    if (score === 3) return "bg-[#84cc16]";
    return "bg-[#a3e635]";
  };

  return (
    <div className="space-y-3 pt-1">
      {/* Strength Bar */}
      {password.length > 0 && (
        <div className="space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium ${muted}`}>
              {t("passwordStrength", "Password strength")}:
            </span>
            <span
              className={`font-bold ${
                score === 1
                  ? "text-rose-500"
                  : score === 2
                  ? "text-amber-500"
                  : score === 3
                  ? "text-[#65a30d] dark:text-[#84cc16]"
                  : "text-[#4d7c0f] dark:text-[#a3e635]"
              }`}
            >
              {score > 0 ? strengthLabels[score - 1] : t("tooShort", "Too Short")}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 h-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-full rounded-full transition-all duration-300 ${getBarColor(
                  i
                )}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rules Checklist */}
      <div className="p-3.5 bg-[var(--toota-pill)] rounded-2xl ring-1 ring-black/5 dark:ring-white/10 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#565c63] dark:text-[#a3a9b1]">
          {t("passwordRequirements", "Password Requirements")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
          {rules.map((rule) => {
            const isMet = rule.valid;
            const hasStarted = password.length > 0;
            return (
              <div
                key={rule.id}
                className={`flex items-center gap-1.5 transition-colors ${
                  isMet
                    ? "text-[#3f6212] dark:text-[#a3e635] font-semibold"
                    : hasStarted
                    ? "text-[#8a9098]"
                    : "text-[#8a9098]/80"
                }`}
              >
                {isMet ? (
                  <Check className="size-3.5 shrink-0 text-[#65a30d] dark:text-[#a3e635]" />
                ) : (
                  <X className="size-3.5 shrink-0 text-[#8a9098]/60" />
                )}
                <span>{rule.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
