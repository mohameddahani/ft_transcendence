"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Clock } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/axios";
import { PlatformPlan, PlanDuration } from "@/types/plan";
import {
  updatePlanDurationSchema,
  UpdatePlanDurationFormValues,
} from "@/schemas/plan.schema";

interface EditDurationModalProps {
  plan: PlatformPlan | null;
  duration: PlanDuration | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditDurationModal({
  plan,
  duration,
  isOpen,
  onClose,
  onSuccess,
}: EditDurationModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePlanDurationFormValues>({
    resolver: zodResolver(updatePlanDurationSchema),
    defaultValues: {
      planId: plan?.id || "",
      durationDays: duration?.durationDays || 30,
      price: duration ? Number(duration.price) : 29.99,
    },
  });

  useEffect(() => {
    if (plan && duration && isOpen) {
      reset({
        planId: plan.id,
        durationDays: duration.durationDays,
        price: Number(duration.price),
      });
    }
  }, [plan, duration, isOpen, reset]);

  if (!isOpen || !plan || !duration) return null;

  const onSubmit = async (data: UpdatePlanDurationFormValues) => {
    try {
      await api.patch(`/api/plans/durations/${duration.id}`, {
        planId: plan.id,
        durationDays: Number(data.durationDays),
        price: Number(data.price),
      });

      toast.success(
        `Duration for "${plan.planName}" updated to ${data.durationDays} days at $${Number(data.price).toFixed(2)}!`
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Failed to update duration:", err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update duration. Please verify input values.";
      toast.error(errorMsg);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-edit-duration-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm px-layout-margin"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-high border border-outline-variant w-full max-w-md overflow-hidden shadow-2xl rounded-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-container-padding border-b border-outline-variant flex justify-between items-center bg-surface-container-highest">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            <h2
              id="modal-edit-duration-title"
              className="font-headline-md text-headline-md text-on-surface font-bold"
            >
              Edit Pricing Duration
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded hover:bg-surface-container-high cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-layout-margin space-y-layout-margin">
            <div>
              <div className="bg-surface-container border border-outline-variant/60 rounded-lg p-3 mb-4">
                <span className="text-body-xs text-on-surface-variant block mb-0.5">
                  Plan Tier
                </span>
                <span className="font-bold text-body-md text-primary">
                  {plan.planName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-container-padding">
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-unit uppercase font-bold tracking-wider">
                    Duration (Days)
                  </label>
                  <div className="relative">
                    <input
                      {...register("durationDays", { valueAsNumber: true })}
                      type="number"
                      placeholder="e.g. 30"
                      className="w-full bg-surface-container border border-outline-variant text-body-md font-body-md p-unit px-3 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface font-mono-data"
                    />
                  </div>
                  {errors.durationDays && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.durationDays.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-unit uppercase font-bold tracking-wider">
                    Price ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-label-caps text-on-surface-variant opacity-60 font-bold">
                      $
                    </span>
                    <input
                      {...register("price", { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      placeholder="49.00"
                      className="w-full bg-surface-container border border-outline-variant text-body-md font-body-md p-unit pl-7 pr-3 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface font-mono-data"
                    />
                  </div>
                  {errors.price && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.price.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-container-padding bg-surface-container-highest border-t border-outline-variant flex justify-end items-center gap-container-padding">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors px-3 py-1.5 rounded hover:bg-surface-container-high cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-on-primary px-layout-margin py-2 rounded-lg font-headline-sm text-headline-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              <span>{isSubmitting ? "Updating..." : "Update Duration"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
