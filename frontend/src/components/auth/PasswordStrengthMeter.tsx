"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

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
      valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
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
    if (score === 0) return "bg-outline-variant/30";
    if (index >= score) return "bg-outline-variant/30";
    if (score === 1) return "bg-rose-500";
    if (score === 2) return "bg-amber-500";
    if (score === 3) return "bg-emerald-500";
    return "bg-primary";
  };

  return (
    <div className="space-y-3 pt-1">
      {/* Strength Bar */}
      {password.length > 0 && (
        <div className="space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-on-surface-variant font-medium">
              {t("passwordStrength", "Password strength")}:
            </span>
            <span
              className={`font-bold ${
                score === 1
                  ? "text-rose-500"
                  : score === 2
                  ? "text-amber-500"
                  : score === 3
                  ? "text-emerald-500"
                  : "text-primary"
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
      <div className="p-3 bg-surface-container-low/60 rounded-xl border border-outline-variant/50 space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
          {t("passwordRequirements", "Password Requirements")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
          {rules.map((rule) => {
            const isMet = rule.valid;
            const hasStarted = password.length > 0;
            return (
              <div
                key={rule.id}
                className={`flex items-center gap-1.5 transition-colors ${
                  isMet
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : hasStarted
                    ? "text-on-surface-variant/70"
                    : "text-on-surface-variant/60"
                }`}
              >
                {isMet ? (
                  <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <X className="w-3.5 h-3.5 shrink-0 text-outline-variant" />
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

