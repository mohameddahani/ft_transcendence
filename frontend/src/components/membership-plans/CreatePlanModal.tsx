"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Plus,
  Loader2,
  Layers,
  AlertCircle,
  Zap,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { createMembershipPlan } from "@/lib/api/membership-plans";
import {
  addMembershipPlanSchema,
  AddMembershipPlanFormValues,
} from "@/schemas/membership-plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePlanModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePlanModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddMembershipPlanFormValues>({
    resolver: zodResolver(addMembershipPlanSchema),
    defaultValues: {
      planName: "",
      description: "",
      weeklyVisitLimit: 7,
    },
  });

  const weeklyVisitLimit = watch("weeklyVisitLimit");

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const onSubmit = async (values: AddMembershipPlanFormValues) => {
    setIsSubmitting(true);
    try {
      await createMembershipPlan({
        planName: values.planName.trim(),
        description: values.description ? values.description.trim() : undefined,
        weeklyVisitLimit: Number(values.weeklyVisitLimit),
      });

      toast.success(
        t("planCreatedSuccess", {
          defaultValue: `Membership plan "${values.planName}" created successfully!`,
          name: values.planName,
        })
      );
      reset();
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
          t("planCreateFailed", {
            defaultValue: "Failed to create membership plan. Please verify the inputs.",
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
      aria-labelledby="create-plan-title"
    >
      <div
        className="w-full max-w-lg toota-card border-none shadow-2xl overflow-hidden p-6 sm:p-7 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pb-5 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-toota-inner flex items-center justify-center text-toota-ink shrink-0">
              <Layers className="size-5" />
            </div>
            <div>
              <h2
                id="create-plan-title"
                className="text-lg font-semibold text-toota-ink"
              >
                {t("createNewPlan") || "Create Membership Plan"}
              </h2>
              <p className="text-xs text-toota-muted mt-0.5">
                {t("plansSubtitle") || "Define plan name, visit limit, and access quotas."}
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
              htmlFor="planName"
              className="block text-xs font-semibold uppercase tracking-wider text-toota-muted"
            >
              {t("planName") || "Plan Name"} <span className="text-toota-red">*</span>
            </label>
            <Input
              id="planName"
              type="text"
              placeholder="e.g. Premium All-Access"
              {...register("planName")}
              className="h-9 rounded-lg bg-toota-inner border-border/40 px-3 text-xs text-toota-ink placeholder:text-toota-muted focus-visible:ring-1 focus-visible:ring-ring"
              disabled={isSubmitting}
              autoFocus
            />
            {errors.planName ? (
              <p className="flex items-center gap-1 text-xs text-toota-red font-medium mt-1">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{errors.planName.message}</span>
              </p>
            ) : (
              <p className="text-[11px] text-toota-muted">
                {t("planNameHint") || "Choose a clear, recognizable name for this subscription tier."}
              </p>
            )}
          </div>

          {/* Weekly Visit Limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="weeklyVisitLimit"
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
            <div className="grid grid-cols-7 gap-1.5">
              {visitPresets.map((limit) => {
                const isSelected = weeklyVisitLimit === limit;
                return (
                  <button
                    key={limit}
                    type="button"
                    onClick={() => setValue("weeklyVisitLimit", limit, { shouldValidate: true })}
                    className={`h-8 sm:h-9 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-toota-side text-white border-toota-side font-semibold shadow-xs"
                        : "bg-toota-inner text-toota-muted border-border/50 hover:text-toota-ink hover:bg-toota-card"
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

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="block text-xs font-semibold uppercase tracking-wider text-toota-muted"
            >
              {t("description") || "Description"}{" "}
              <span className="text-toota-muted font-normal text-[11px] lowercase">
                ({t("optional") || "optional"})
              </span>
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Outline included amenities, pool/sauna access, locker room benefits..."
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
                  <span>{t("creating") || "Creating..."}</span>
                </>
              ) : (
                <>
                  <Plus className="size-3.5 me-2" />
                  <span>{t("createPlan") || "Create Plan"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
