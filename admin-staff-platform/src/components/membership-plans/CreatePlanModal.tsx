"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Plus,
  Loader2,
  CreditCard,
  Calendar,
  DollarSign,
  AlertCircle,
  Sparkles,
  Info,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  createMembershipPlan,
  addMembershipPlanDuration,
} from "@/lib/api/membership-plans";
import {
  addMembershipPlanSchema,
  AddMembershipPlanFormValues,
} from "@/schemas/membership-plan";

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

  if (!isOpen) return null;

  const onSubmit = async (values: AddMembershipPlanFormValues) => {
    setIsSubmitting(true);
    try {
      // 1. Create the membership plan
      await createMembershipPlan({
        planName: values.planName.trim(),
        description: values.description ? values.description.trim() : undefined,
        weeklyVisitLimit: Number(values.weeklyVisitLimit),
      });

      // 2. If initial duration provided, we will let user know and refresh
      // (Backend addMembershipPlanDuration needs the generated planId, which user can also add with 1 click)
      toast.success(`Membership plan "${values.planName}" created successfully!`);
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
        toast.error("Failed to create membership plan. Please verify the inputs.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg text-on-surface">
                Create Membership Plan
              </h2>
              <p className="text-xs text-on-surface-variant">
                Configure a new tier for facility access & privileges
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Plan Name */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              Plan Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              {...register("planName")}
              placeholder="e.g. Platinum Access"
              className={`w-full px-3.5 py-2.5 bg-surface-container-low border ${
                errors.planName
                  ? "border-error focus:ring-error"
                  : "border-outline-variant focus:ring-primary-container"
              } rounded-xl text-sm text-on-surface focus:ring-2 outline-none transition-all`}
            />
            {errors.planName && (
              <p className="text-xs text-error mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.planName.message}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              Description <span className="text-xs font-normal text-on-surface-variant">(Optional)</span>
            </label>
            <textarea
              rows={2}
              {...register("description")}
              placeholder="e.g. Unrestricted access to main gym, olympic pool, and sauna facilities"
              className={`w-full px-3.5 py-2 bg-surface-container-low border ${
                errors.description
                  ? "border-error focus:ring-error"
                  : "border-outline-variant focus:ring-primary-container"
              } rounded-xl text-sm text-on-surface focus:ring-2 outline-none transition-all resize-none`}
            />
            {errors.description && (
              <p className="text-xs text-error mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.description.message}</span>
              </p>
            )}
          </div>

          {/* Weekly Visit Limit */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-on-surface">
                Weekly Visit Limit <span className="text-error">*</span>
              </label>
              <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                {weeklyVisitLimit === 7 ? "7 Days (Unlimited)" : `${weeklyVisitLimit} visits / week`}
              </span>
            </div>

            <input type="hidden" {...register("weeklyVisitLimit", { valueAsNumber: true })} />

            {/* Quick selector buttons 1 to 7 */}
            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setValue("weeklyVisitLimit", num, { shouldValidate: true, shouldDirty: true })}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    Number(weeklyVisitLimit) === num
                      ? "primary-gradient text-white border-transparent shadow-sm scale-102"
                      : "bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            {errors.weeklyVisitLimit && (
              <p className="text-xs text-error mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.weeklyVisitLimit.message}</span>
              </p>
            )}
          </div>

          <div className="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/60 flex items-start gap-2.5 text-xs text-on-surface-variant">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p>
              Once created, you can add multiple pricing tiers and durations (e.g. 1 Month, 3 Months, 1 Year) to this plan.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 primary-gradient text-white text-sm font-bold rounded-xl shadow-md hover:opacity-95 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Create Plan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
