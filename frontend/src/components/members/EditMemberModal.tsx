"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Loader2,
  Save,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { updateMember } from "@/lib/api/members";
import { BackendMember } from "@/types/member";
import { updateMemberSchema, UpdateMemberFormValues } from "@/schemas/member";
import { Button } from "@/components/ui/button";

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
      <div className="relative w-full max-w-2xl toota-card border border-border/40 p-0 shadow-2xl overflow-hidden max-h-[92vh] z-10 animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Form Area */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-card text-toota-ink custom-scrollbar">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-semibold tracking-tight text-toota-ink">
                  {t("editMemberProfile", "Edit Member Profile")}
                </h3>
                <span className="font-mono text-xs text-toota-muted tabular-nums">
                  / @{member.userName || "member"}
                </span>
              </div>
              <p className="text-xs text-toota-muted mt-1">
                {member.firstName} {member.lastName}
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
            {/* Basic Information Section */}
            <div className="space-y-4">
              {/* First & Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("firstName", "First Name")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...register("firstName")}
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
                    className="w-full h-10 px-3.5 rounded-xl bg-card border border-border/40 text-xs font-medium text-toota-ink outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                  {errors.phoneNumber && (
                    <p className="text-[11px] text-rose-500">{errors.phoneNumber.message}</p>
                  )}
                </div>
              </div>

              {/* Residential Address & Emergency Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("residentialAddress", "Residential Address")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("address")}
                    className="w-full h-10 px-3.5 rounded-xl bg-card border border-border/40 text-xs font-medium text-toota-ink outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                  {errors.address && (
                    <p className="text-[11px] text-rose-500">{errors.address.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("emergencyContact", "Emergency Contact")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register("emergencyContact")}
                    className="w-full h-10 px-3.5 rounded-xl bg-card border border-border/40 text-xs font-medium text-toota-ink outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                  {errors.emergencyContact && (
                    <p className="text-[11px] text-rose-500">
                      {errors.emergencyContact.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions (Toota Pill Buttons) */}
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
                    <span>{t("savingChanges", "Saving Changes...")}</span>
                  </>
                ) : (
                  <>
                    <Save className="size-3.5 me-1.5" />
                    <span>{t("saveChanges", "Save Changes")}</span>
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
