"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Edit3, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/axios";
import { PlatformPlan, UpdatePlanDto } from "@/types/plan";
import { updatePlanSchema, UpdatePlanFormValues } from "@/schemas/plan.schema";
import { cn } from "@/lib/utils";

interface EditPlanModalProps {
  plan: PlatformPlan | null;
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
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePlanFormValues>({
    resolver: zodResolver(updatePlanSchema),
    defaultValues: {
      planName: "",
      maxMembers: 100,
      description: "",
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (plan && isOpen) {
      reset({
        planName: plan.planName,
        maxMembers: plan.maxMembers,
        description: plan.description || "",
        isActive: plan.isActive,
      });
    }
  }, [plan, isOpen, reset]);

  if (!isOpen || !plan) return null;

  const onSubmit = async (data: UpdatePlanFormValues) => {
    try {
      const payload: UpdatePlanDto = {
        planName: data.planName.trim(),
        maxMembers: Number(data.maxMembers),
        description: data.description?.trim() ? data.description.trim() : undefined,
        isActive: data.isActive,
      };

      await api.patch(`/api/plans/${plan.id}`, payload);

      toast.success(`Plan "${data.planName}" updated successfully!`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Failed to update plan:", err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update plan. Please verify input values.";
      toast.error(errorMsg);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-edit-plan-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-3 sm:p-layout-margin"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-high border border-outline-variant w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl rounded-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-3.5 sm:p-container-padding border-b border-outline-variant flex justify-between items-center bg-surface-container-highest shrink-0">
          <div className="flex items-center gap-2">
            <Edit3 className="size-5 text-primary shrink-0" />
            <h2
              id="modal-edit-plan-title"
              className="font-headline-md text-sm sm:text-headline-md text-on-surface font-bold"
            >
              Edit Platform Plan
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1.5 rounded-lg hover:bg-surface-container-high cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-layout-margin space-y-4 sm:space-y-layout-margin overflow-y-auto flex-1">
            {/* Plan Identity: Name & Max Members */}
            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant mb-unit uppercase font-bold tracking-wider">
                Plan Identity
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-container-padding">
                <div>
                  <label className="block text-body-xs text-on-surface-variant mb-1">
                    Plan Name
                  </label>
                  <input
                    {...register("planName")}
                    type="text"
                    placeholder="e.g. Enterprise Tier"
                    className="w-full bg-surface-container border border-outline-variant text-body-md font-body-md p-unit px-3 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface placeholder:text-on-surface-variant/40"
                  />
                  {errors.planName && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.planName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-body-xs text-on-surface-variant mb-1">
                    Max Members Capacity
                  </label>
                  <input
                    {...register("maxMembers", { valueAsNumber: true })}
                    type="number"
                    placeholder="e.g. 500"
                    className="w-full bg-surface-container border border-outline-variant text-body-md font-body-md p-unit px-3 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface placeholder:text-on-surface-variant/40 font-mono-data"
                  />
                  {errors.maxMembers && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.maxMembers.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant mb-unit uppercase font-bold tracking-wider">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Briefly describe target audience, tiers, and primary benefits..."
                className="w-full bg-surface-container border border-outline-variant text-body-md font-body-md p-unit px-3 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface placeholder:text-on-surface-variant/40 resize-none"
              />
              {errors.description && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Status Selection */}
            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant mb-unit uppercase font-bold tracking-wider">
                Plan Availability Status
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-container-padding">
                <button
                  type="button"
                  onClick={() => setValue("isActive", true, { shouldValidate: true })}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer text-left",
                    isActive
                      ? "bg-primary/10 border-primary text-on-surface"
                      : "bg-surface-container border-outline-variant text-on-surface-variant hover:border-outline-variant/80"
                  )}
                >
                  <CheckCircle2
                    className={cn(
                      "size-5 shrink-0",
                      isActive ? "text-primary" : "text-on-surface-variant/40"
                    )}
                  />
                  <div>
                    <div className="font-bold text-body-sm text-on-surface">Active</div>
                    <div className="text-[11px] text-on-surface-variant">
                      Available for subscriptions
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("isActive", false, { shouldValidate: true })}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer text-left",
                    !isActive
                      ? "bg-error/10 border-error text-on-surface"
                      : "bg-surface-container border-outline-variant text-on-surface-variant hover:border-outline-variant/80"
                  )}
                >
                  <XCircle
                    className={cn(
                      "size-5 shrink-0",
                      !isActive ? "text-error" : "text-on-surface-variant/40"
                    )}
                  />
                  <div>
                    <div className="font-bold text-body-sm text-on-surface">Inactive</div>
                    <div className="text-[11px] text-on-surface-variant">
                      Hidden from new plans
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-3 sm:p-container-padding bg-surface-container-highest border-t border-outline-variant flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-container-padding shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors px-4 py-2 rounded-lg hover:bg-surface-container-high cursor-pointer disabled:opacity-50 text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-primary text-on-primary px-layout-margin py-2.5 rounded-lg font-headline-sm text-headline-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
