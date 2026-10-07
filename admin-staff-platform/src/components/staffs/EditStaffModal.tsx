"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  UserCheck,
  Loader2,
  ShieldCheck,
  Save,
  User,
  Mail,
  Phone,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { updateStaff } from "@/lib/api/staffs";
import { BackendStaff } from "@/types/staff";
import { updateStaffSchema, UpdateStaffFormValues } from "@/schemas/staff";
import { useTranslation } from "react-i18next";

interface EditStaffModalProps {
  staff: BackendStaff | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditStaffModal({
  staff,
  isOpen,
  onClose,
  onSuccess,
}: EditStaffModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateStaffFormValues>({
    resolver: zodResolver(updateStaffSchema),
  });

  useEffect(() => {
    if (staff && isOpen) {
      let formattedBirthDate = "";
      if (staff.birthDate) {
        try {
          const dateObj = new Date(staff.birthDate);
          if (!isNaN(dateObj.getTime())) {
            formattedBirthDate = dateObj.toISOString().split("T")[0];
          }
        } catch {
          // ignore date parse error
        }
      }

      reset({
        firstName: staff.firstName || "",
        lastName: staff.lastName || "",
        gender: (staff.gender as "MALE" | "FEMALE") || "MALE",
        birthDate: formattedBirthDate,
        email: staff.email || "",
        phoneNumber: staff.phoneNumber || "",
      });
    }
  }, [staff, isOpen, reset]);

  if (!isOpen || !staff) return null;

  const onSubmit = async (values: UpdateStaffFormValues) => {
    setIsSubmitting(true);
    try {
      await updateStaff(staff.id, {
        firstName: values.firstName ? values.firstName.trim() : undefined,
        lastName: values.lastName ? values.lastName.trim() : undefined,
        gender: values.gender,
        birthDate: values.birthDate,
        email: values.email ? values.email.trim() : undefined,
        phoneNumber: values.phoneNumber
          ? values.phoneNumber.trim().replace(/\s+/g, "")
          : undefined,
      });

      toast.success(
        `Staff profile "${values.firstName || staff.firstName} ${
          values.lastName || staff.lastName
        }" updated successfully!`
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
        toast.error("Failed to update staff profile.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-surface-bright rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col md:flex-row max-h-[92vh] z-10 animate-in zoom-in-95 duration-200">
        {/* Left Decorative Banner */}
        <div className="hidden md:flex md:w-5/12 primary-gradient p-8 flex-col justify-between relative overflow-hidden text-white select-none">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-xs shadow-inner">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="font-headline text-2xl font-bold leading-tight">
              Edit Staff Profile
            </h2>
            <p className="text-white/80 mt-3 text-sm leading-relaxed">
              Update staff information, contact records, and operational profiles directly in the system.
            </p>
          </div>

          <div className="relative z-10 space-y-4 pt-6 border-t border-white/20">
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Real-Time Sync</span>
            </div>
            <p className="text-[11px] text-white/60">
              Modifications immediately update across all administrative rosters.
            </p>
          </div>

          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Right Form Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-surface-container-lowest custom-scrollbar">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-headline text-xl md:text-2xl font-bold text-on-surface">
                {t("editStaffDetails")}
              </h3>
              <p className="text-on-surface-variant text-xs md:text-sm mt-1">
                {staff.firstName} {staff.lastName} (@{staff.userName || "staff"})
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* First & Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  {t("firstName")} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  <input
                    {...register("firstName")}
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                      errors.firstName
                        ? "border-error focus:ring-2 focus:ring-error/20"
                        : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                    }`}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-xs text-error mt-0.5">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  {t("lastName")} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  <input
                    {...register("lastName")}
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                      errors.lastName
                        ? "border-error focus:ring-2 focus:ring-error/20"
                        : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                    }`}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-xs text-error mt-0.5">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Gender & Birth Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  {t("gender")} *
                </label>
                <select
                  {...register("gender")}
                  className="w-full px-3.5 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary-container"
                >
                  <option value="MALE">{t("male")}</option>
                  <option value="FEMALE">{t("female")}</option>
                </select>
                {errors.gender && (
                  <p className="text-xs text-error mt-0.5">{errors.gender.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  {t("birthDate")} *
                </label>
                <input
                  type="date"
                  {...register("birthDate")}
                  className={`w-full px-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                    errors.birthDate
                      ? "border-error focus:ring-2 focus:ring-error/20"
                      : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                  }`}
                />
                {errors.birthDate && (
                  <p className="text-xs text-error mt-0.5">{errors.birthDate.message}</p>
                )}
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  {t("emailAddress")} *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  <input
                    type="email"
                    {...register("email")}
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                      errors.email
                        ? "border-error focus:ring-2 focus:ring-error/20"
                        : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-error mt-0.5">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  {t("phone")} *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  <input
                    type="tel"
                    {...register("phoneNumber")}
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                      errors.phoneNumber
                        ? "border-error focus:ring-2 focus:ring-error/20"
                        : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                    }`}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-xs text-error mt-0.5">{errors.phoneNumber.message}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 rounded-xl border border-outline-variant font-bold text-sm text-on-surface-variant hover:bg-surface-container-low transition-all cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] primary-gradient text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("savingChanges")}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t("saveChanges")}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
