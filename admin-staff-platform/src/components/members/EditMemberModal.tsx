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
  CheckCircle2,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { updateMember } from "@/lib/api/members";
import { BackendMember } from "@/types/member";
import { updateMemberSchema, UpdateMemberFormValues } from "@/schemas/member";

interface EditMemberModalProps {
  member: BackendMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditMemberModal({
  member,
  isOpen,
  onClose,
  onSuccess,
}: EditMemberModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateMemberFormValues>({
    resolver: zodResolver(updateMemberSchema),
  });

  useEffect(() => {
    if (member && isOpen) {
      let formattedBirthDate = "";
      if (member.birthDate) {
        try {
          const dateObj = new Date(member.birthDate);
          if (!isNaN(dateObj.getTime())) {
            formattedBirthDate = dateObj.toISOString().split("T")[0];
          }
        } catch {
          // ignore
        }
      }

      reset({
        firstName: member.firstName || "",
        lastName: member.lastName || "",
        gender: (member.gender as "MALE" | "FEMALE") || "MALE",
        birthDate: formattedBirthDate,
        email: member.email || "",
        phoneNumber: member.phoneNumber || "",
        address: member.address || "",
        emergencyContact: member.emergencyContact || "",
      });
    }
  }, [member, isOpen, reset]);

  if (!isOpen || !member) return null;

  const onSubmit = async (values: UpdateMemberFormValues) => {
    setIsSubmitting(true);
    try {
      await updateMember(member.id, {
        firstName: values.firstName ? values.firstName.trim() : undefined,
        lastName: values.lastName ? values.lastName.trim() : undefined,
        gender: values.gender,
        birthDate: values.birthDate,
        email: values.email ? values.email.trim() : undefined,
        phoneNumber: values.phoneNumber ? values.phoneNumber.trim().replace(/\s+/g, "") : undefined,
        address: values.address ? values.address.trim() : undefined,
        emergencyContact: values.emergencyContact ? values.emergencyContact.trim().replace(/\s+/g, "") : undefined,
      });

      toast.success(
        `Member "${values.firstName || member.firstName} ${values.lastName || member.lastName}" updated successfully!`
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
        toast.error("Failed to update member profile.");
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
      <div className="relative w-full max-w-4xl bg-surface-bright rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col md:flex-row max-h-[92vh] z-10 animate-in zoom-in-95 duration-200">
        {/* Left Decorative Banner */}
        <div className="hidden md:flex md:w-5/12 primary-gradient p-8 flex-col justify-between relative overflow-hidden text-white select-none">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-xs shadow-inner">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="font-headline text-2xl font-bold leading-tight">
              {t("editMemberProfile")}
            </h2>
            <p className="text-white/80 mt-3 text-sm leading-relaxed">
              {t("membersSubtitle")}
            </p>
          </div>

          <div className="relative z-10 space-y-4 pt-6 border-t border-white/20">
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>{t("verified")}</span>
            </div>
            <p className="text-[11px] text-white/60">
              {t("accountStatusSecurity")}
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
                {t("editMemberProfile")}
              </h3>
              <p className="text-on-surface-variant text-xs md:text-sm mt-1">
                {member.firstName} {member.lastName} (@{member.userName || "member"})
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              {/* First & Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                    {t("firstName")} *
                  </label>
                  <input
                    {...register("firstName")}
                    className={`w-full px-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                      errors.firstName
                        ? "border-error focus:ring-2 focus:ring-error/20"
                        : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-error mt-0.5">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                    {t("lastName")} *
                  </label>
                  <input
                    {...register("lastName")}
                    className={`w-full px-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                      errors.lastName
                        ? "border-error focus:ring-2 focus:ring-error/20"
                        : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                    }`}
                  />
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
                  <input
                    type="email"
                    {...register("email")}
                    className={`w-full px-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                      errors.email
                        ? "border-error focus:ring-2 focus:ring-error/20"
                        : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-error mt-0.5">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                    {t("phone")} *
                  </label>
                  <input
                    type="tel"
                    {...register("phoneNumber")}
                    className={`w-full px-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                      errors.phoneNumber
                        ? "border-error focus:ring-2 focus:ring-error/20"
                        : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                    }`}
                  />
                  {errors.phoneNumber && (
                    <p className="text-xs text-error mt-0.5">{errors.phoneNumber.message}</p>
                  )}
                </div>
              </div>

              {/* Residential Address & Emergency Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                    {t("residentialAddress")} *
                  </label>
                  <input
                    type="text"
                    {...register("address")}
                    className={`w-full px-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                      errors.address
                        ? "border-error focus:ring-2 focus:ring-error/20"
                        : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                    }`}
                  />
                  {errors.address && (
                    <p className="text-xs text-error mt-0.5">{errors.address.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                    {t("emergencyContact")} *
                  </label>
                  <input
                    type="tel"
                    {...register("emergencyContact")}
                    className={`w-full px-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                      errors.emergencyContact
                        ? "border-error focus:ring-2 focus:ring-error/20"
                        : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                    }`}
                  />
                  {errors.emergencyContact && (
                    <p className="text-xs text-error mt-0.5">
                      {errors.emergencyContact.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-2">
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
