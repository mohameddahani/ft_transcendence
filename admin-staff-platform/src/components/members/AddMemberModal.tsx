"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  UserPlus,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  Home,
  AlertCircle,
  Award,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { createMember } from "@/lib/api/members";
import { fetchMembershipPlans } from "@/lib/api/membership-plans";
import { MembershipPlan } from "@/types/membership-plan";
import { addMemberSchema, AddMemberFormValues } from "@/schemas/member";
import { useTranslation } from "react-i18next";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddMemberModal({
  isOpen,
  onClose,
  onSuccess,
}: AddMemberModalProps) {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "MALE",
      birthDate: "",
      email: "",
      phoneNumber: "",
      address: "",
      emergencyContact: "",
      membershipPlanId: "",
      membershipPlanDurationId: "",
    },
  });

  const selectedPlanId = watch("membershipPlanId");

  // Load plans on modal open
  useEffect(() => {
    if (isOpen) {
      const loadPlans = async () => {
        setIsLoadingPlans(true);
        try {
          const loaded = await fetchMembershipPlans(1, 100);
          setPlans(loaded);
          // If a plan exists, select the first active plan by default
          const activePlans = loaded.filter((p) => p.isActive);
          if (activePlans.length > 0 && !selectedPlanId) {
            setValue("membershipPlanId", activePlans[0].id);
            if (activePlans[0].membershipPlanDurations?.length > 0) {
              setValue(
                "membershipPlanDurationId",
                activePlans[0].membershipPlanDurations[0].id
              );
            }
          }
        } catch {
          toast.error("Failed to load available membership plans");
        } finally {
          setIsLoadingPlans(false);
        }
      };
      loadPlans();
    } else {
      reset();
    }
  }, [isOpen, setValue, reset, selectedPlanId]);

  // When selected plan changes, auto-select first available duration
  const currentPlan = plans.find((p) => p.id === selectedPlanId);
  const currentDurations = currentPlan?.membershipPlanDurations || [];

  useEffect(() => {
    if (currentDurations.length > 0) {
      const currentDurationId = watch("membershipPlanDurationId");
      const exists = currentDurations.some((d) => d.id === currentDurationId);
      if (!exists) {
        setValue("membershipPlanDurationId", currentDurations[0].id);
      }
    } else {
      setValue("membershipPlanDurationId", "");
    }
  }, [selectedPlanId, currentDurations, setValue, watch]);

  if (!isOpen) return null;

  const onSubmit = async (values: AddMemberFormValues) => {
    setIsSubmitting(true);
    try {
      await createMember({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        gender: values.gender,
        birthDate: values.birthDate,
        email: values.email.trim(),
        phoneNumber: values.phoneNumber.trim().replace(/\s+/g, ""),
        address: values.address.trim(),
        emergencyContact: values.emergencyContact.trim().replace(/\s+/g, ""),
        membershipPlanId: values.membershipPlanId,
        membershipPlanDurationId: values.membershipPlanDurationId,
      });

      toast.success(
        `Member "${values.firstName} ${values.lastName}" added successfully!`
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
        toast.error("Failed to register member. Please check all fields.");
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
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <h2 className="font-headline text-2xl font-bold leading-tight">
              Empower New Potential
            </h2>
            <p className="text-white/80 mt-3 text-sm leading-relaxed">
              Every new member is a story of growth. Add their details to the Kinetic
              Ecosystem to begin their fitness journey.
            </p>
          </div>

          <div className="relative z-10 space-y-4 pt-6 border-t border-white/20">
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Secure Enterprise Data Entry</span>
            </div>
            <p className="text-[11px] text-white/60">
              Kinetic ID, memberships, and billing are auto-provisioned upon registration.
            </p>
          </div>

          {/* Abstract ambient glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Right Form Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-surface-container-lowest custom-scrollbar">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-headline text-xl md:text-2xl font-bold text-on-surface">
                {t("addNewMember")}
              </h3>
              <p className="text-on-surface-variant text-xs md:text-sm mt-1">
                {t("membersSubtitle")}
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
              <h4 className="font-label-sm text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                {t("personalInformation")}
              </h4>

              {/* First & Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                    {t("firstName")} *
                  </label>
                  <input
                    {...register("firstName")}
                    placeholder="e.g. Ayman"
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
                    placeholder="e.g. El Jamaaouy"
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
                  <div className="relative">
                    <input
                      type="date"
                      {...register("birthDate")}
                      className={`w-full px-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                        errors.birthDate
                          ? "border-error focus:ring-2 focus:ring-error/20"
                          : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                      }`}
                    />
                  </div>
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
                    placeholder="name@enterprise.com"
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
                    placeholder="+212607080904"
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
                    placeholder="Hay almal Bengurir"
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
                    placeholder="+212607080905"
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

            {/* Membership Plan Section */}
            <div className="p-5 bg-surface-container rounded-2xl border border-outline-variant/60 space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  {t("assignPlanDuration")}
                </h4>
              </div>

              {isLoadingPlans ? (
                <div className="py-4 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Loading plans from server...</span>
                </div>
              ) : plans.length === 0 ? (
                <div className="p-3 bg-error-container/20 border border-error-container text-error rounded-xl text-xs">
                  {t("noPlansFound")}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Plan */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                      {t("selectPlan")} *
                    </label>
                    <select
                      {...register("membershipPlanId")}
                      className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary-container"
                    >
                      <option value="" disabled>
                        {t("chooseTier")}
                      </option>
                      {plans
                        .filter((p) => p.isActive)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.planName} ({p.weeklyVisitLimit} {t("visitsPerWeek")})
                          </option>
                        ))}
                    </select>
                    {errors.membershipPlanId && (
                      <p className="text-xs text-error mt-0.5">
                        {errors.membershipPlanId.message}
                      </p>
                    )}
                  </div>

                  {/* Select Duration */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                      {t("selectDuration")} *
                    </label>
                    <select
                      {...register("membershipPlanDurationId")}
                      disabled={currentDurations.length === 0}
                      className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary-container disabled:opacity-50"
                    >
                      {currentDurations.length === 0 ? (
                        <option value="">No durations available</option>
                      ) : (
                        currentDurations.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.durationDays} {t("days")} — ${Number(d.price).toFixed(2)}
                          </option>
                        ))
                      )}
                    </select>
                    {errors.membershipPlanDurationId && (
                      <p className="text-xs text-error mt-0.5">
                        {errors.membershipPlanDurationId.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
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
                disabled={isSubmitting || plans.length === 0}
                className="flex-[2] primary-gradient text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("registeringMember")}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{t("addNewMember")}</span>
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
