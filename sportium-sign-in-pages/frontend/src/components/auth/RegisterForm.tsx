"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { Building2, ChevronDown, Lock, Mail, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

import { registerSchema, RegisterFormValues } from "@/schemas/auth";
import { registerAdmin } from "@/lib/api/auth";
import { Gender } from "@/types/auth";
import AuthShell, { PortalBadge } from "@/components/auth/AuthShell";
import { SetupIllustration } from "@/components/auth/illustrations";
import {
  eyeButton,
  fieldError,
  fieldIcon,
  fieldLabel,
  inputBase,
  inputPlain,
  inputRing,
  limeUnderline,
  muted,
  selectBase,
  submitArrow,
  submitButton,
} from "@/components/auth/authStyles";

// the strength meter in the platform's colours: red, amber, green, then lime for a strong password
const strengthColors = ["#ef4444", "#f59e0b", "#22c55e", "#a3e635"];

export default function RegisterForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: undefined,
      birthDate: "",
      companyName: "",
      countryCode: "+212",
      phone: "",
      email: "",
      password: "",
      termsAccepted: false,
    },
  });

  // Calculate password strength
  const getPasswordStrength = (val: string) => {
    let score = 0;
    if (val.length > 0) score = 1;
    if (val.length >= 8) score = 2;
    if (val.length >= 8 && /[A-Z]/.test(val) && /[0-9]/.test(val)) score = 3;
    if (val.length >= 12 && /[!@#$%^&*]/.test(val)) score = 4;
    return score;
  };

  const strength = getPasswordStrength(passwordValue);
  const strengthLabels = [
    t("weak", "Weak"),
    t("fair", "Fair"),
    t("good", "Good"),
    t("strong", "Strong"),
  ];

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      const formattedPhone = `${data.countryCode}${data.phone.replace(/\s+/g, "")}`;

      const payload = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        gender: data.gender as Gender,
        birthDate: data.birthDate,
        email: data.email.trim(),
        password: data.password.trim(),
        phoneNumber: formattedPhone,
        companyName: data.companyName.trim(),
        termsAccepted: data.termsAccepted,
      };

      const response = await registerAdmin(payload);

      // Display the backend activation message in green toastify notification
      const activationMessage =
        response.message ||
        "Please activate your account through the email we sent.";

      toast.success(activationMessage, {
        autoClose: 5000,
      });

      setTimeout(() => {
        router.push("/login?registered=true");
      }, 2500);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.data) {
        const errorData = err.response.data as {
          message?: string | string[];
          error?: string;
        };
        const message = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message || errorData.error || "Registration failed";
        toast.error(message);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to connect to the backend server. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      panelTitle={t("registerPanelTitle", "Bring your club into one place.")}
      illustration={<SetupIllustration />}
      wide
    >
      {/* Form Header */}
      <PortalBadge icon={<Building2 className="size-3.5" aria-hidden="true" />} label={t("registerBadge", "For club owners")} />
      <h1 className="mt-5 font-headline text-3xl font-semibold tracking-[-0.03em]">{t("adminSignUp", "Admin Sign Up")}</h1>
      <p className={`mt-2 text-sm leading-6 ${muted}`}>
        {t("adminSignUpDesc", "Configure your enterprise dashboard and scale your fitness brand.")}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate>
        {/* Name Group */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={fieldLabel} htmlFor="first_name">
              {t("firstName", "First Name")}
            </label>
            <input
              id="first_name"
              type="text"
              autoComplete="given-name"
              placeholder={t("enterFirstName", "Enter first name")}
              aria-invalid={errors.firstName ? true : undefined}
              {...register("firstName")}
              className={`${inputPlain} ${inputRing(!!errors.firstName)}`}
            />
            {errors.firstName && <p className={fieldError}>{errors.firstName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={fieldLabel} htmlFor="last_name">
              {t("lastName", "Last Name")}
            </label>
            <input
              id="last_name"
              type="text"
              autoComplete="family-name"
              placeholder={t("enterLastName", "Enter last name")}
              aria-invalid={errors.lastName ? true : undefined}
              {...register("lastName")}
              className={`${inputPlain} ${inputRing(!!errors.lastName)}`}
            />
            {errors.lastName && <p className={fieldError}>{errors.lastName.message}</p>}
          </div>
        </div>

        {/* Details Group: Gender & Birth Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={fieldLabel} htmlFor="gender">
              {t("gender", "Gender")}
            </label>
            <div className="relative">
              <select
                id="gender"
                defaultValue=""
                aria-invalid={errors.gender ? true : undefined}
                {...register("gender")}
                className={`${selectBase} ${inputRing(!!errors.gender)}`}
              >
                <option disabled value="">
                  {t("selectGender", "Select Gender")}
                </option>
                <option value="MALE">{t("male", "Male")}</option>
                <option value="FEMALE">{t("female", "Female")}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-[#8a9098] rtl:right-auto rtl:left-4" aria-hidden="true" />
            </div>
            {errors.gender && <p className={fieldError}>{errors.gender.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={fieldLabel} htmlFor="birth_date">
              {t("birthDate", "Birth Date")}
            </label>
            <input
              id="birth_date"
              type="date"
              autoComplete="bday"
              aria-invalid={errors.birthDate ? true : undefined}
              {...register("birthDate")}
              className={`${inputPlain} ${inputRing(!!errors.birthDate)}`}
            />
            {errors.birthDate && <p className={fieldError}>{errors.birthDate.message}</p>}
          </div>
        </div>

        {/* Corporate Identity: Company Name */}
        <div className="space-y-1.5">
          <label className={fieldLabel} htmlFor="company_name">
            {t("companyName", "Company Name")}
          </label>
          <div className="group relative">
            <Building2 className={`size-[18px] ${fieldIcon}`} aria-hidden="true" />
            <input
              id="company_name"
              type="text"
              autoComplete="organization"
              placeholder={t("enterCompanyName", "e.g. Iron Gate Enterprise")}
              aria-invalid={errors.companyName ? true : undefined}
              {...register("companyName")}
              className={`${inputBase} ${inputRing(!!errors.companyName)}`}
            />
          </div>
          {errors.companyName && <p className={fieldError}>{errors.companyName.message}</p>}
        </div>

        {/* Contact: Phone Number & Email */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={fieldLabel} htmlFor="phone">
              {t("phone", "Phone Number")}
            </label>
            <div className="flex gap-2">
              <div className="relative w-[128px] shrink-0">
                <select
                  aria-label={t("countryCode", "Country code")}
                  {...register("countryCode")}
                  className={`${selectBase} ${inputRing(false)} pr-8 rtl:pl-8`}
                >
                  <option value="+212">+212 (MA)</option>
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+33">+33 (FR)</option>
                  <option value="+49">+49 (DE)</option>
                  <option value="+61">+61 (AU)</option>
                  <option value="+971">+971 (AE)</option>
                  <option value="+966">+966 (SA)</option>
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#8a9098] rtl:right-auto rtl:left-3" aria-hidden="true" />
              </div>
              <input
                id="phone"
                type="tel"
                autoComplete="tel-national"
                placeholder="555-0123"
                aria-invalid={errors.phone ? true : undefined}
                {...register("phone")}
                className={`${inputPlain} ${inputRing(!!errors.phone)}`}
              />
            </div>
            {errors.phone && <p className={fieldError}>{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={fieldLabel} htmlFor="email">
              {t("email", "Email Address")}
            </label>
            <div className="group relative">
              <Mail className={`size-[18px] ${fieldIcon}`} aria-hidden="true" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t("enterEmail", "admin@yourgym.com")}
                aria-invalid={errors.email ? true : undefined}
                {...register("email")}
                className={`${inputBase} ${inputRing(!!errors.email)}`}
              />
            </div>
            {errors.email && <p className={fieldError}>{errors.email.message}</p>}
          </div>
        </div>

        {/* Security: Password */}
        <div className="space-y-1.5">
          <label className={fieldLabel} htmlFor="password">
            {t("password", "Password")}
          </label>
          <div className="group relative">
            <Lock className={`size-[18px] ${fieldIcon}`} aria-hidden="true" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={errors.password ? true : undefined}
              {...register("password", {
                onChange: (e) => setPasswordValue(e.target.value),
              })}
              className={`${inputBase} pr-12 rtl:pl-12 ${inputRing(!!errors.password)}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={eyeButton}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          </div>

          {/* Strength Meter */}
          <div className="flex gap-1.5 pt-1" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="h-1.5 flex-1 rounded-full bg-black/10 transition-colors dark:bg-white/10"
                style={{ backgroundColor: index < strength ? strengthColors[strength - 1] : undefined }}
              />
            ))}
          </div>
          <p className={`flex items-center gap-1.5 text-xs ${muted}`}>
            {strength > 0 ? (
              <>
                <span className="size-2 rounded-full" style={{ backgroundColor: strengthColors[strength - 1] }} />
                {t("passwordStrengthPrefix", "Password strength:")}{" "}
                <span className="font-semibold text-[var(--toota-ink)]">{strengthLabels[strength - 1]}</span>
              </>
            ) : (
              t("passwordFeedbackDefault", "Secure passwords use 8+ characters, with numbers & symbols.")
            )}
          </p>
          {errors.password && <p className={fieldError}>{errors.password.message}</p>}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3 pt-1">
          <input
            id="terms"
            type="checkbox"
            {...register("termsAccepted")}
            className="mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-[#65a30d]"
          />
          <label htmlFor="terms" className={`cursor-pointer text-xs leading-5 select-none sm:text-sm ${muted}`}>
            {t("termsAgreement", "I agree to the")}{" "}
            <Link href="/terms" className={`font-semibold text-[var(--toota-ink)] ${limeUnderline}`}>
              {t("termsOfService", "Terms of Service")}
            </Link>{" "}
            {t("and", "and")}{" "}
            <Link href="/privacy" className={`font-semibold text-[var(--toota-ink)] ${limeUnderline}`}>
              {t("privacyPolicy", "Privacy Policy")}
            </Link>
            .
          </label>
        </div>
        {errors.termsAccepted && <p className={`${fieldError} -mt-2`}>{errors.termsAccepted.message}</p>}

        {/* CTA Submit Button: the platform's dark pill, with the lime arrow */}
        <button type="submit" disabled={isSubmitting} className={submitButton}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              <span>{t("processing", "Processing...")}</span>
            </>
          ) : (
            <>
              <span>{t("createAccount", "Create Account")}</span>
              <span className={submitArrow}>
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </span>
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <p className={`mt-6 text-center text-sm ${muted}`}>
        {t("alreadyHaveAccount", "Already have an account?")}{" "}
        <Link href="/login" className={`font-semibold text-[var(--toota-ink)] ${limeUnderline} transition-[text-decoration-thickness] hover:decoration-[3px]`}>
          {t("logIn", "Log in")}
        </Link>
      </p>
    </AuthShell>
  );
}
