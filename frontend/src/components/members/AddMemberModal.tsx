"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  UserPlus,
  Loader2,
  Award,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { createMember } from "@/lib/api/members";
import { fetchMembershipPlans } from "@/lib/api/membership-plans";
import { MembershipPlan } from "@/types/membership-plan";
import { addMemberSchema, AddMemberFormValues } from "@/schemas/member";
import { useTranslation } from "react-i18next";
import { OPEN_ADD_MEMBER_EVENT } from "@/lib/events/modal-events";
import { Button } from "@/components/ui/button";
import CustomSelect from "@/components/ui/CustomSelect";

interface AddMemberModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function AddMemberModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onSuccess,
}: AddMemberModalProps) {
  const { t } = useTranslation();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listen to global open event when uncontrolled
  useEffect(() => {
    if (isControlled) return;
    const handleOpen = () => setInternalIsOpen(true);
    window.addEventListener(OPEN_ADD_MEMBER_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_ADD_MEMBER_EVENT, handleOpen);
  }, [isControlled]);

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

  const handleClose = useCallback(() => {
    reset();
    if (isControlled) {
      controlledOnClose?.();
    } else {
      setInternalIsOpen(false);
    }
  }, [isControlled, controlledOnClose, reset]);

  // Load plans on modal open (runs exactly once per open, with plans in-memory cache)
  useEffect(() => {
    if (!isOpen) {
      reset();
      return;
    }

    let isMounted = true;
    const loadPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const loaded = await fetchMembershipPlans(1, 100);
        if (!isMounted) return;
        setPlans(loaded);

        // Pre-select first active plan by default if not set
        const activePlans = loaded.filter((p) => p.isActive);
        if (activePlans.length > 0) {
          setValue("membershipPlanId", activePlans[0].id);
          if (
            activePlans[0].membershipPlanDurations &&
            activePlans[0].membershipPlanDurations.length > 0
          ) {
            setValue(
              "membershipPlanDurationId",
              activePlans[0].membershipPlanDurations[0].id
            );
          }
        }
      } catch {
        if (isMounted) {
          toast.error(t("plansLoadFailed", "Failed to load available membership plans"));
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlans(false);
        }
      }
    };

    loadPlans();
    return () => {
      isMounted = false;
    };
  }, [isOpen, setValue, reset, t]);

  // Current selected plan and durations
  const selectedGender = watch("gender") || "MALE";
  const selectedPlanId = watch("membershipPlanId");
  const selectedDurationId = watch("membershipPlanDurationId");
  const currentPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId),
    [plans, selectedPlanId]
  );
  const currentDurations = useMemo(
    () => currentPlan?.membershipPlanDurations || [],
    [currentPlan]
  );

  // When selected plan changes, auto-select first available duration without effect loops
  useEffect(() => {
    if (!isOpen || currentDurations.length === 0) return;
    const currentDurationId = watch("membershipPlanDurationId");
    const exists = currentDurations.some((d) => d.id === currentDurationId);
    if (!exists && currentDurations[0]) {
      setValue("membershipPlanDurationId", currentDurations[0].id);
    }
  }, [isOpen, selectedPlanId, currentDurations, setValue, watch]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

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
      handleClose();
      onSuccess?.();
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
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-0 duration-150"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog Card (Toota Card styling with Crisp Border) */}
      <div className="relative w-full max-w-2xl toota-card border border-border/40 p-0 shadow-2xl overflow-hidden max-h-[92vh] z-10 animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Form Area */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-card text-toota-ink custom-scrollbar">
          {/* Header with Baseline Metric */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-semibold tracking-tight text-toota-ink">
                  {t("addNewMember", "Add New Member")}
                </h3>
                <span className="font-mono text-xs text-toota-muted tabular-nums">
                  / {t("newRegistration", "New Registration")}
                </span>
              </div>
              <p className="text-xs text-toota-muted mt-1">
                {t(
                  "membersSubtitle",
                  "Register a new member, assign a membership plan, and initialize facility access."
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-full text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer shrink-0"
              aria-label={t("close", "Close")}
            >
              <X className="size-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-toota-muted">
                {t("personalInformation", "Personal Information")}
              </h4>

              {/* First & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("firstName", "First Name")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...register("firstName")}
                    placeholder="e.g. Ayman"
                    className={`w-full h-10 px-3.5 rounded-xl bg-toota-inner border text-xs font-medium text-toota-ink placeholder:text-toota-muted outline-none focus:ring-1 focus:ring-ring transition-all ${
                      errors.firstName
                        ? "border-rose-500 focus:ring-rose-500/20"
                        : "border-border/40"
                    }`}
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
                    placeholder="e.g. El Jamaaouy"
                    className={`w-full h-10 px-3.5 rounded-xl bg-toota-inner border text-xs font-medium text-toota-ink placeholder:text-toota-muted outline-none focus:ring-1 focus:ring-ring transition-all ${
                      errors.lastName
                        ? "border-rose-500 focus:ring-rose-500/20"
                        : "border-border/40"
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-[11px] text-rose-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Gender & Birth Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("gender", "Gender")} <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={selectedGender}
                    onChange={(val) =>
                      setValue("gender", val as "MALE" | "FEMALE", {
                        shouldValidate: true,
                      })
                    }
                    className="rounded-xl"
                    options={[
                      { value: "MALE", label: t("male", "Male") },
                      { value: "FEMALE", label: t("female", "Female") },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("birthDate", "Birth Date")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("birthDate")}
                    className={`w-full h-10 px-3.5 rounded-xl bg-toota-inner border text-xs font-medium text-toota-ink outline-none focus:ring-1 focus:ring-ring transition-all ${
                      errors.birthDate
                        ? "border-rose-500 focus:ring-rose-500/20"
                        : "border-border/40"
                    }`}
                  />
                  {errors.birthDate && (
                    <p className="text-[11px] text-rose-500">{errors.birthDate.message}</p>
                  )}
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("emailAddress", "Email Address")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="name@example.com"
                    className={`w-full h-10 px-3.5 rounded-xl bg-toota-inner border text-xs font-medium text-toota-ink placeholder:text-toota-muted outline-none focus:ring-1 focus:ring-ring transition-all ${
                      errors.email
                        ? "border-rose-500 focus:ring-rose-500/20"
                        : "border-border/40"
                    }`}
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
                    className={`w-full h-10 px-3.5 rounded-xl bg-toota-inner border text-xs font-medium text-toota-ink placeholder:text-toota-muted outline-none focus:ring-1 focus:ring-ring transition-all ${
                      errors.phoneNumber
                        ? "border-rose-500 focus:ring-rose-500/20"
                        : "border-border/40"
                    }`}
                  />
                  {errors.phoneNumber && (
                    <p className="text-[11px] text-rose-500">{errors.phoneNumber.message}</p>
                  )}
                </div>
              </div>

              {/* Residential Address & Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("residentialAddress", "Residential Address")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("address")}
                    placeholder="Hay Al-Amal, Ben Guerir"
                    className={`w-full h-10 px-3.5 rounded-xl bg-toota-inner border text-xs font-medium text-toota-ink placeholder:text-toota-muted outline-none focus:ring-1 focus:ring-ring transition-all ${
                      errors.address
                        ? "border-rose-500 focus:ring-rose-500/20"
                        : "border-border/40"
                    }`}
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
                    placeholder="+212607080905"
                    className={`w-full h-10 px-3.5 rounded-xl bg-toota-inner border text-xs font-medium text-toota-ink placeholder:text-toota-muted outline-none focus:ring-1 focus:ring-ring transition-all ${
                      errors.emergencyContact
                        ? "border-rose-500 focus:ring-rose-500/20"
                        : "border-border/40"
                    }`}
                  />
                  {errors.emergencyContact && (
                    <p className="text-[11px] text-rose-500">
                      {errors.emergencyContact.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Membership Plan Section (Toota Inner Well) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-toota-inner border border-border/40 space-y-3.5">
              <div className="flex items-center gap-2">
                <Award className="size-4 text-toota-ink" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-toota-ink">
                  {t("assignPlanDuration", "Assign Plan & Duration")}
                </h4>
              </div>

              {isLoadingPlans ? (
                <div className="py-4 text-center text-xs text-toota-muted flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin text-toota-ink" />
                  <span>Loading plans...</span>
                </div>
              ) : plans.length === 0 ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs">
                  {t("noPlansFound", "No membership plans found. Please configure a plan first.")}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Plan */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-toota-ink">
                      {t("selectPlan", "Membership Plan")} <span className="text-rose-500">*</span>
                    </label>
                    <CustomSelect
                      value={selectedPlanId}
                      onChange={(val) =>
                        setValue("membershipPlanId", String(val), {
                          shouldValidate: true,
                        })
                      }
                      className="rounded-xl bg-card"
                      placeholder={t("chooseTier", "Select a membership tier")}
                      options={plans
                        .filter((p) => p.isActive)
                        .map((p) => ({
                          value: p.id,
                          label: `${p.planName} (${p.weeklyVisitLimit} ${t("visitsPerWeek", "visits/wk")})`,
                        }))}
                    />
                    {errors.membershipPlanId && (
                      <p className="text-[11px] text-rose-500">
                        {errors.membershipPlanId.message}
                      </p>
                    )}
                  </div>

                  {/* Select Duration */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-toota-ink">
                      {t("selectDuration", "Plan Duration & Billing")} <span className="text-rose-500">*</span>
                    </label>
                    <CustomSelect
                      value={selectedDurationId}
                      onChange={(val) =>
                        setValue("membershipPlanDurationId", String(val), {
                          shouldValidate: true,
                        })
                      }
                      disabled={currentDurations.length === 0}
                      className="rounded-xl bg-card"
                      placeholder={
                        currentDurations.length === 0
                          ? "No durations available"
                          : t("selectDuration", "Select duration")
                      }
                      options={currentDurations.map((d) => ({
                        value: d.id,
                        label: `${d.durationDays} ${t("days", "days")} — $${Number(d.price).toFixed(2)}`,
                      }))}
                    />
                    {errors.membershipPlanDurationId && (
                      <p className="text-[11px] text-rose-500">
                        {errors.membershipPlanDurationId.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions (Toota Pill Buttons) */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="toota-pill flex-1 h-11 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
              >
                <span>{t("cancel", "Cancel")}</span>
              </Button>
              <Button
                type="submit"
                variant="outline"
                disabled={isSubmitting || plans.length === 0}
                className="toota-pill flex-1 h-11 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin me-1.5" />
                    <span>{t("registeringMember", "Registering Member...")}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="size-3.5 me-1.5" />
                    <span>{t("addNewMember", "Register Member")}</span>
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
