"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Package } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/axios";
import { addPlanSchema, AddPlanFormValues } from "@/schemas/plan.schema";

interface AddPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPlanModal({ isOpen, onClose, onSuccess }: AddPlanModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddPlanFormValues>({
    resolver: zodResolver(addPlanSchema) as any,
    defaultValues: {
      planName: "",
      maxMembers: 100,
      description: "",
      initialDurationDays: 30,
      initialPrice: 19.99,
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: AddPlanFormValues) => {
    try {
      await api.post("/api/plans", {
        planName: data.planName.trim(),
        maxMembers: Number(data.maxMembers),
        description: data.description ? data.description.trim() : undefined,
        initialDurationDays: data.initialDurationDays && !isNaN(data.initialDurationDays) ? Number(data.initialDurationDays) : undefined,
        initialPrice: data.initialPrice !== undefined && !isNaN(data.initialPrice) ? Number(data.initialPrice) : undefined,
      });

      toast.success(`Plan "${data.planName}" created successfully!`);
      reset();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Failed to create plan:", err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to create plan. Please verify the input values.";
      toast.error(errorMsg);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-add-plan-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm px-layout-margin"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-high border border-outline-variant w-full max-w-lg overflow-hidden shadow-2xl rounded-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-container-padding border-b border-outline-variant flex justify-between items-center bg-surface-container-highest">
          <div className="flex items-center gap-2">
            <Package className="size-5 text-primary" />
            <h2 id="modal-add-plan-title" className="font-headline-md text-headline-md text-on-surface font-bold">
              Create New Platform Plan
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
            {/* Plan Identity: Name & Max Members */}
            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant mb-unit uppercase font-bold tracking-wider">
                Plan Identity
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-container-padding">
                <div>
                  <div className="relative">
                    <input
                      {...register("planName")}
                      type="text"
                      placeholder="Plan Name (e.g. Growth)"
                      className="w-full bg-surface-container border border-outline-variant text-body-md font-body-md p-unit px-3 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface placeholder:text-on-surface-variant/40"
                    />
                  </div>
                  {errors.planName && (
                    <p className="text-red-400 text-xs mt-1">{errors.planName.message}</p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <input
                      {...register("maxMembers", { valueAsNumber: true })}
                      type="number"
                      placeholder="Max Members Count"
                      className="w-full bg-surface-container border border-outline-variant text-body-md font-body-md p-unit px-3 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface placeholder:text-on-surface-variant/40"
                    />
                  </div>
                  {errors.maxMembers && (
                    <p className="text-red-400 text-xs mt-1">{errors.maxMembers.message}</p>
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
                <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Initial Duration & Pricing */}
            <div>
              <div className="flex justify-between items-center mb-unit">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
                  Initial Duration & Pricing (Optional)
                </label>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                  Can add more later
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-container-padding">
                <div className="relative">
                  <input
                    {...register("initialDurationDays", { valueAsNumber: true })}
                    type="number"
                    placeholder="30"
                    className="w-full bg-surface-container border border-outline-variant text-body-md font-body-md p-unit pr-14 pl-3 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface placeholder:text-on-surface-variant/40 font-mono-data"
                  />
                  <span className="absolute right-3 top-2.5 text-label-caps text-on-surface-variant opacity-60 font-bold text-[10px]">
                    DAYS
                  </span>
                  {errors.initialDurationDays && (
                    <p className="text-red-400 text-xs mt-1">{errors.initialDurationDays.message}</p>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-label-caps text-on-surface-variant opacity-60 font-bold">
                    $
                  </span>
                  <input
                    {...register("initialPrice", { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    placeholder="49.00"
                    className="w-full bg-surface-container border border-outline-variant text-body-md font-body-md p-unit pl-7 pr-3 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface placeholder:text-on-surface-variant/40 font-mono-data"
                  />
                  {errors.initialPrice && (
                    <p className="text-red-400 text-xs mt-1">{errors.initialPrice.message}</p>
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
              <span>{isSubmitting ? "Creating..." : "Create Plan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

