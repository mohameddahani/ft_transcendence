"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Loader2,
  Sparkles,
  Search,
  User as UserIcon,
  Check,
  ChevronDown,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/axios";
import {
  activeSubscriptionSchema,
  ActiveSubscriptionFormValues,
} from "@/schemas/subscription.schema";
import { PlatformPlan } from "@/types/plan";
import { AdminUser } from "@/types/admin";

interface ActivateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ActivateSubscriptionModal({
  isOpen,
  onClose,
  onSuccess,
}: ActivateSubscriptionModalProps) {
  // Plans & Durations State
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(false);

  // Users State for Autocomplete / Suggestions
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActiveSubscriptionFormValues>({
    resolver: zodResolver(activeSubscriptionSchema) as any,
    defaultValues: {
      userName: "",
      planId: "",
      planDurationId: "",
    },
  });

  const selectedPlanId = watch("planId");
  const currentUserName = watch("userName");

  // Load plans & users when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function loadData() {
      // 1. Fetch Plans
      try {
        setLoadingPlans(true);
        const res = await api.get("/api/plans?limit=100");
        const allPlans: PlatformPlan[] = res.data?.plans || [];
        const activePlans = allPlans.filter((p) => p.isActive);
        if (isMounted) {
          setPlans(activePlans);
          if (activePlans.length > 0) {
            setValue("planId", activePlans[0].id);
            if (activePlans[0].durations && activePlans[0].durations.length > 0) {
              setValue("planDurationId", activePlans[0].durations[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load plans:", err);
        toast.error("Could not fetch available plans");
      } finally {
        if (isMounted) setLoadingPlans(false);
      }

      // 2. Fetch Users (Gym Owners)
      try {
        setLoadingUsers(true);
        const res = await api.get("/api/admins?limit=100");
        const allUsers: AdminUser[] = res.data?.users || [];
        if (isMounted) {
          setUsers(allUsers);
        }
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        if (isMounted) setLoadingUsers(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, setValue]);

  // Durations for currently selected plan
  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId);
  }, [plans, selectedPlanId]);

  const availableDurations = useMemo(() => {
    return selectedPlan?.durations || [];
  }, [selectedPlan]);

  // Whenever selected plan changes, ensure duration is valid
  useEffect(() => {
    if (availableDurations.length > 0) {
      const currentDurationId = watch("planDurationId");
      const exists = availableDurations.some((d) => d.id === currentDurationId);
      if (!exists) {
        setValue("planDurationId", availableDurations[0].id);
      }
    } else {
      setValue("planDurationId", "");
    }
  }, [selectedPlanId, availableDurations, setValue, watch]);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm.trim()) {
      return users;
    }
    const q = userSearchTerm.toLowerCase().trim();
    return users.filter((u) => {
      const uName = u.userName?.toLowerCase() || "";
      const cName = u.companyName?.toLowerCase() || "";
      const fName = u.firstName?.toLowerCase() || "";
      const lName = u.lastName?.toLowerCase() || "";
      const email = u.email?.toLowerCase() || "";
      return (
        uName.includes(q) ||
        cName.includes(q) ||
        fName.includes(q) ||
        lName.includes(q) ||
        email.includes(q)
      );
    });
  }, [users, userSearchTerm]);

  // Handle outside clicks to close user dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Close modal on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isUserDropdownOpen) {
          setIsUserDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isUserDropdownOpen, onClose]);

  // Select user helper
  const handleSelectUser = (user: AdminUser) => {
    setSelectedUser(user);
    setUserSearchTerm(user.userName);
    setValue("userName", user.userName, { shouldValidate: true });
    setIsUserDropdownOpen(false);
  };

  // Clear selected user
  const handleClearUser = () => {
    setSelectedUser(null);
    setUserSearchTerm("");
    setValue("userName", "", { shouldValidate: true });
    setIsUserDropdownOpen(true);
  };

  if (!isOpen) return null;

  const onSubmit = async (data: ActiveSubscriptionFormValues) => {
    try {
      await api.post("/api/subscriptions", {
        planId: data.planId,
        planDurationId: data.planDurationId,
        userName: data.userName.trim(),
      });

      toast.success(`Subscription activated successfully for @${data.userName.trim()}!`);
      reset();
      setSelectedUser(null);
      setUserSearchTerm("");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Failed to activate subscription:", err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to activate subscription. Please check if the username exists and is active.";
      toast.error(errorMsg);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-activate-sub-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-layout-margin"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-surface-container-high border border-outline-variant w-full max-w-lg shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-layout-margin border-b border-outline-variant flex justify-between items-center bg-surface-container-highest">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h3
              id="modal-activate-sub-title"
              className="font-headline-md text-headline-md text-on-surface font-semibold"
            >
              Activate Subscription
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded hover:bg-surface-container cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-layout-margin space-y-layout-margin">
          {/* Target User Autocomplete / Searchable Dropdown */}
          <div className="space-y-unit relative" ref={dropdownRef}>
            <div className="flex justify-between items-center">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
                Target User / Gym Owner
              </label>
              {users.length > 0 && (
                <span className="font-body-sm text-[11px] text-on-surface-variant">
                  {users.length} owners available
                </span>
              )}
            </div>

            {/* Input with Search & Suggestions */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
                {loadingUsers ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : (
                  <Search className="size-4" />
                )}
              </div>

              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => {
                  const val = e.target.value;
                  setUserSearchTerm(val);
                  setValue("userName", val, { shouldValidate: true });
                  if (!isUserDropdownOpen) setIsUserDropdownOpen(true);

                  // Update selected user object if exact match
                  const matched = users.find(
                    (u) => u.userName.toLowerCase() === val.trim().toLowerCase()
                  );
                  setSelectedUser(matched || null);
                }}
                onFocus={() => setIsUserDropdownOpen(true)}
                placeholder="Search by username, company, or name..."
                className="w-full bg-surface-container border border-outline-variant rounded pl-9 pr-20 py-element-gap font-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/40"
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {userSearchTerm && (
                  <button
                    type="button"
                    onClick={handleClearUser}
                    className="p-1 text-on-surface-variant hover:text-on-surface rounded cursor-pointer"
                    title="Clear"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                  className="p-1 text-on-surface-variant hover:text-on-surface rounded cursor-pointer"
                  title="Toggle user list"
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
            </div>

            {/* Autocomplete Dropdown List */}
            {isUserDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-surface-container-high border border-outline-variant rounded-md shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-outline-variant/50">
                {loadingUsers ? (
                  <div className="p-4 text-center text-sm text-on-surface-variant flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span>Loading gym owners...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-on-surface-variant">
                    No matching gym owners found.
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected =
                      selectedUser?.id === user.id ||
                      currentUserName?.toLowerCase() === user.userName.toLowerCase();
                    const isActive = user.accountStatus === "ACTIVE";

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className={`w-full text-left p-2.5 px-3 flex items-center justify-between gap-3 hover:bg-surface-container transition-colors cursor-pointer ${
                          isSelected ? "bg-primary/10 border-l-2 border-primary" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0 text-on-surface-variant">
                            <Building2 className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-on-surface truncate">
                                {user.companyName || `${user.firstName} ${user.lastName}`}
                              </span>
                              <span className="font-mono-data text-xs text-primary font-medium">
                                @{user.userName}
                              </span>
                            </div>
                            <div className="text-xs text-on-surface-variant truncate">
                              {user.firstName} {user.lastName} · {user.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-label-caps font-bold px-1.5 py-0.5 rounded ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {user.accountStatus}
                          </span>
                          {isSelected && <Check className="size-4 text-primary shrink-0" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Selected User Summary Badge */}
            {selectedUser && (
              <div className="mt-2 p-2 px-3 rounded bg-surface-container border border-outline-variant/70 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <UserIcon className="size-3.5 text-primary" />
                  <span className="text-on-surface">
                    Selected: <strong>{selectedUser.companyName}</strong> (@{selectedUser.userName})
                  </span>
                </div>
                {selectedUser.accountStatus !== "ACTIVE" && (
                  <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                    <AlertTriangle className="size-3" />
                    Account is {selectedUser.accountStatus}
                  </span>
                )}
              </div>
            )}

            {errors.userName ? (
              <p className="text-red-400 text-xs mt-1">{errors.userName.message}</p>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px] mt-1">
                Type or select a gym owner account from the suggestions list above.
              </p>
            )}
          </div>

          {/* Plan Selection */}
          <div className="space-y-unit">
            <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
              Plan Selection
            </label>
            {loadingPlans ? (
              <div className="flex items-center gap-2 text-on-surface-variant py-2 text-sm">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Loading available plans...</span>
              </div>
            ) : plans.length === 0 ? (
              <p className="text-sm text-yellow-400 py-1">
                No active plans available. Please create a plan first.
              </p>
            ) : (
              <div className="relative">
                <select
                  {...register("planId")}
                  className="w-full bg-surface-container border border-outline-variant rounded px-container-padding py-element-gap font-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                >
                  {plans.map((plan) => (
                    <option
                      key={plan.id}
                      value={plan.id}
                      className="bg-surface-container text-on-surface"
                    >
                      {plan.planName} (Max {plan.maxMembers} members)
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                  <ChevronDown className="size-4" />
                </div>
              </div>
            )}
            {errors.planId && (
              <p className="text-red-400 text-xs mt-1">{errors.planId.message}</p>
            )}
          </div>

          {/* Plan Duration Selection */}
          <div className="space-y-unit">
            <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
              Billing Duration & Price
            </label>
            {availableDurations.length === 0 ? (
              <p className="text-sm text-yellow-400 py-1">
                This plan currently has no configured durations.
              </p>
            ) : (
              <div className="relative">
                <select
                  {...register("planDurationId")}
                  className="w-full bg-surface-container border border-outline-variant rounded px-container-padding py-element-gap font-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                >
                  {availableDurations.map((duration) => (
                    <option
                      key={duration.id}
                      value={duration.id}
                      className="bg-surface-container text-on-surface"
                    >
                      {duration.durationDays} Days — ${Number(duration.price).toFixed(2)}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                  <ChevronDown className="size-4" />
                </div>
              </div>
            )}
            {errors.planDurationId && (
              <p className="text-red-400 text-xs mt-1">{errors.planDurationId.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-container-padding pt-container-padding border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-layout-margin py-unit font-headline-sm text-headline-sm text-on-surface-variant hover:bg-surface-container rounded transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                plans.length === 0 ||
                availableDurations.length === 0 ||
                !currentUserName
              }
              className="bg-primary text-on-primary px-layout-margin py-unit font-headline-sm text-headline-sm rounded hover:brightness-110 active:opacity-80 transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              <span>{isSubmitting ? "Activating..." : "Confirm Activation"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
