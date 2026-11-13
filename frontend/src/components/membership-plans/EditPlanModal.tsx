"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Save,
  Loader2,
  Edit3,
  AlertCircle,
  Zap,
  Check,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { updateMembershipPlan } from "@/lib/api/membership-plans";
import { MembershipPlan } from "@/types/membership-plan";
import {
  updateMembershipPlanSchema,
  UpdateMembershipPlanFormValues,
} from "@/schemas/membership-plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface EditPlanModalProps {
  plan: MembershipPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPlanModal({
  plan,
  isOpen,
  onClose,
  onSuccess,
}: EditPlanModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateMembershipPlanFormValues>({
    resolver: zodResolver(updateMembershipPlanSchema),
    defaultValues: {
      planName: "",
      description: "",
      weeklyVisitLimit: 7,
      isActive: true,
    },
  });

  const weeklyVisitLimit = watch("weeklyVisitLimit");
  const isActive = watch("isActive");

  useEffect(() => {
    if (plan) {
      reset({
        planName: plan.planName || "",
        description: plan.description || "",
        weeklyVisitLimit: plan.weeklyVisitLimit || 7,
        isActive: plan.isActive ?? true,
      });
    }
  }, [plan, reset]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !plan) return null;

  const onSubmit = async (values: UpdateMembershipPlanFormValues) => {
    setIsSubmitting(true);
    try {
      await updateMembershipPlan(plan.id, {
        planName: values.planName.trim(),
        description: values.description ? values.description.trim() : undefined,
        weeklyVisitLimit: Number(values.weeklyVisitLimit),
        isActive: values.isActive,
      });

      toast.success(
        t("planUpdatedSuccess", {
          defaultValue: `Plan "${values.planName}" updated successfully!`,
          name: values.planName,
        })
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        const msg = err.response.data.message;
        if (Array.isArray(msg)) {
          msg.forEach((m) => toast.error(m));
        } else {
          toast.error(msg);
        }
      } else {
        toast.error(
          t("planUpdateFailed", {
            defaultValue: "Failed to update plan details. Please check inputs.",
          })
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const visitPresets = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-plan-title"
    >
      <div
        className="w-full max-w-lg toota-card border-none shadow-2xl overflow-hidden p-6 sm:p-7 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pb-5 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-toota-inner flex items-center justify-center text-toota-ink shrink-0">
              <Edit3 className="size-5" />
            </div>
            <div>
              <h2
                id="edit-plan-title"
                className="text-lg font-semibold text-toota-ink"
              >
                {t("editPlan") || "Edit Membership Plan"}
              </h2>
              <p className="text-xs text-toota-muted mt-0.5">
                {t("plansSubtitle") || "Update plan name, visit limit, and active status."}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="size-8 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner cursor-pointer"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="pt-5 space-y-5">
          {/* Plan Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="editPlanName"
              className="block text-xs font-semibold uppercase tracking-wider text-toota-muted"
            >
              {t("planName") || "Plan Name"} <span className="text-toota-red">*</span>
            </label>
            <Input
              id="editPlanName"
              type="text"
              {...register("planName")}
              className="h-9 rounded-lg bg-toota-inner border-border/40 px-3 text-xs text-toota-ink placeholder:text-toota-muted focus-visible:ring-1 focus-visible:ring-ring"
              disabled={isSubmitting}
            />
            {errors.planName && (
              <p className="flex items-center gap-1 text-xs text-toota-red font-medium mt-1">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{errors.planName.message}</span>
              </p>
            )}
          </div>

          {/* Weekly Visit Limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="editWeeklyVisitLimit"
                className="block text-xs font-semibold uppercase tracking-wider text-toota-muted"
              >
                {t("weeklyVisitLimit") || "Weekly Visit Limit"} <span className="text-toota-red">*</span>
              </label>
              <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-toota-ink bg-toota-inner border-border/50">
                <Zap className="size-3 me-1 text-toota-ink" />
                {weeklyVisitLimit === 7
                  ? (t("unlimitedVisits") || "Unlimited (7/week)")
                  : `${weeklyVisitLimit} ${t("visitsPerWeek") || "Visits/week"}`}
              </Badge>
            </div>

            {/* Quick Preset Buttons 1 to 7 */}
            <div
              role="group"
              aria-label={t("weeklyVisitLimit")}
              className="grid grid-cols-7 gap-1.5"
            >
              {visitPresets.map((limit) => {
                const isSelected = weeklyVisitLimit === limit;
                return (
                  <button
                    key={limit}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setValue("weeklyVisitLimit", limit, { shouldValidate: true })}
                    className={`h-8 sm:h-9 rounded-lg text-xs font-medium cursor-pointer transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-toota-main ${
                      isSelected
                        ? "bg-toota-lime text-toota-side border-toota-lime font-semibold shadow-xs"
                        : "bg-toota-inner text-toota-muted border-border/50 hover:text-toota-ink hover:bg-toota-lime/15 hover:border-toota-lime"
                    }`}
                  >
                    {limit}
                  </button>
                );
              })}
            </div>
            {errors.weeklyVisitLimit && (
              <p className="flex items-center gap-1 text-xs text-toota-red font-medium mt-1">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{errors.weeklyVisitLimit.message}</span>
              </p>
            )}
          </div>

          {/* Active Status Button */}
          <div className="p-3.5 rounded-xl bg-toota-inner border border-border/50 flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-toota-ink">
                {t("planStatus") || "Plan Status"}
              </span>
              <span className="text-xs text-toota-muted">
                {isActive
                  ? (t("planActiveHint") || "Members can currently subscribe to this plan.")
                  : (t("planInactiveHint") || "Hidden from new checkouts and subscription signups.")}
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue("isActive", !isActive, { shouldValidate: true })}
              className={`h-7.5 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors border shrink-0 ${
                isActive
                  ? "bg-toota-card text-toota-ink border-border/60 hover:bg-toota-inner"
                  : "bg-toota-card/50 text-toota-muted border-border/40 hover:bg-toota-card hover:text-toota-ink"
              }`}
            >
              {isActive ? (
                <Check className="size-3.5 me-1.5 text-toota-green" />
              ) : (
                <X className="size-3.5 me-1.5 text-toota-red" />
              )}
              <span>{isActive ? (t("active") || "Active") : (t("inactive") || "Inactive")}</span>
            </Button>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="editDescription"
              className="block text-xs font-semibold uppercase tracking-wider text-toota-muted"
            >
              {t("description") || "Description"}{" "}
              <span className="text-toota-muted font-normal text-[11px] lowercase">
                ({t("optional") || "optional"})
              </span>
            </label>
            <textarea
              id="editDescription"
              rows={3}
              {...register("description")}
              className="w-full px-3.5 py-2.5 rounded-xl bg-toota-inner border border-border/40 text-xs text-toota-ink placeholder:text-toota-muted outline-none focus:ring-1 focus:ring-ring transition-all resize-none"
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="flex items-center gap-1 text-xs text-toota-red font-medium mt-1">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{errors.description.message}</span>
              </p>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-border/40 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-lg text-xs font-medium cursor-pointer border-border/50 hover:bg-toota-inner"
            >
              {t("cancel") || "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-5 rounded-lg text-xs font-semibold cursor-pointer bg-toota-side text-white hover:bg-black"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin me-2" />
                  <span>{t("saving") || "Saving..."}</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5 me-2" />
                  <span>{t("saveChanges") || "Save Changes"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
