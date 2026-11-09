"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  UserPlus,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { createStaff } from "@/lib/api/staffs";
import { addStaffSchema, AddStaffFormValues } from "@/schemas/staff";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddStaffModal({
  isOpen,
  onClose,
  onSuccess,
}: AddStaffModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddStaffFormValues>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "MALE",
      birthDate: "",
      email: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (values: AddStaffFormValues) => {
    setIsSubmitting(true);
    try {
      await createStaff({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        gender: values.gender,
        birthDate: values.birthDate,
        email: values.email.trim(),
        phoneNumber: values.phoneNumber.trim().replace(/\s+/g, ""),
      });

      toast.success(
        `Staff member "${values.firstName} ${values.lastName}" added successfully!`
      );
      reset();
      onSuccess?.();
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
        toast.error("Failed to register staff member. Please check all fields.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-0 duration-150"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl toota-card border border-border/40 p-0 shadow-2xl overflow-hidden max-h-[92vh] z-10 animate-in zoom-in-95 duration-150 flex flex-col bg-card text-toota-ink">
        {/* Form Area */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto custom-scrollbar">
          {/* Header with Baseline Metric */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-semibold tracking-tight text-toota-ink">
                  {t("addNewStaff", "Add New Staff")}
                </h3>
                <span className="font-mono text-xs text-toota-muted tabular-nums">
                  / {t("staffRegistration", "Staff Registration")}
                </span>
              </div>
              <p className="text-xs text-toota-muted mt-1">
                {t("staffSubtitle", "Register a new staff member and assign operational duties.")}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* First & Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("firstName", "First Name")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...register("firstName")}
                    placeholder="e.g. Karim"
                    className="w-full h-10 px-3.5 rounded-xl bg-card border border-border/40 text-xs font-medium text-toota-ink outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                  {errors.firstName && (
                    <p className="text-[11px] text-rose-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("lastName", "Last Name")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...register("lastName")}
                    placeholder="e.g. Bennani"
                    className="w-full h-10 px-3.5 rounded-xl bg-card border border-border/40 text-xs font-medium text-toota-ink outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                  {errors.lastName && (
                    <p className="text-[11px] text-rose-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Gender & Birth Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("gender", "Gender")} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("gender")}
                    className="w-full h-10 px-3.5 rounded-xl bg-card border border-border/40 text-xs font-medium text-toota-ink outline-none focus:ring-1 focus:ring-ring transition-all cursor-pointer"
                  >
                    <option value="MALE">{t("male", "Male")}</option>
                    <option value="FEMALE">{t("female", "Female")}</option>
                  </select>
                  {errors.gender && (
                    <p className="text-[11px] text-rose-500">{errors.gender.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("birthDate", "Birth Date")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("birthDate")}
                    className="w-full h-10 px-3.5 rounded-xl bg-card border border-border/40 text-xs font-medium text-toota-ink outline-none focus:ring-1 focus:ring-ring transition-all cursor-pointer"
                  />
                  {errors.birthDate && (
                    <p className="text-[11px] text-rose-500">{errors.birthDate.message}</p>
                  )}
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("emailAddress", "Email Address")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="karim@enterprise.com"
                    className="w-full h-10 px-3.5 rounded-xl bg-card border border-border/40 text-xs font-medium text-toota-ink outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                  {errors.email && (
                    <p className="text-[11px] text-rose-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("phone", "Phone Number")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register("phoneNumber")}
                    placeholder="+212607080904"
                    className="w-full h-10 px-3.5 rounded-xl bg-card border border-border/40 text-xs font-medium text-toota-ink outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                  {errors.phoneNumber && (
                    <p className="text-[11px] text-rose-500">{errors.phoneNumber.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions (Unified Toota Pill Outline Buttons) */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="toota-pill flex-1 h-11 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
              >
                <span>{t("cancel", "Cancel")}</span>
              </Button>
              <Button
                type="submit"
                variant="outline"
                disabled={isSubmitting}
                className="toota-pill flex-1 h-11 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin me-1.5" />
                    <span>{t("registeringStaff", "Registering Staff...")}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="size-3.5 me-1.5" />
                    <span>{t("addNewStaff", "Register Staff")}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
