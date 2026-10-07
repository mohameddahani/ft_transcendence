"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Zap,
  Quote,
  Building2,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

import { registerSchema, RegisterFormValues } from "@/schemas/auth";
import { registerAdmin } from "@/lib/api/auth";
import { Gender } from "@/types/auth";

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
      countryCode: "+1",
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
  const strengthColors = ["#EF4444", "#F59E0B", "#10B981", "#3525cd"];
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
    <main className="flex min-h-screen w-full">
      {/* Left Side: Brand Visual & Testimonial */}
      <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden kinetic-gradient select-none">
        <div
          className="absolute inset-0 opacity-40 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuADjW5g6JIVJLUCJOCBbNK2CSQPUAvhuWECOkpFe3QEhjVFHqQDDfdMZciV1dLiElAGfRHLTDl2lwMIozeXkK3eqWTW-sJT7zizlUReujS0Vax1n980sRvNOHj8jM594jLW-1UXlUWUbaSEFBD9XQo_V0Lv1ZISeov63A8D4_F_e5eakfo8ypy0YY0QcdVwQfgR2NGiPYKvm4P5_clIAOnnAWsIxA9ur1RpHnGjZtutt0K7K8badFRK')",
          }}
        />
        {/* Atmospheric Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12 lg:p-16 text-white">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Zap className="w-7 h-7 fill-white text-white" />
            </div>
            <h1 className="font-bold text-3xl tracking-tight font-headline">
              {t("brandName", "GymFlow")}
            </h1>
          </div>

          {/* Testimonial */}
          <div className="max-w-md">
            <div className="mb-6">
              <Quote className="w-10 h-10 opacity-60 fill-current mb-3 rtl:scale-x-[-1]" />
              <p className="font-headline text-xl lg:text-2xl italic leading-relaxed mb-4 text-white/95">
                {t(
                  "quote",
                  "GymFlow didn't just organize my members; it revolutionized our entire financial and operational workflow. The data density is a game-changer for enterprise growth."
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/60 relative">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvXNFjyojj_yI0lMjkCyA56T2hlRUutS9qDvaYaBjVfQp729H3qvb5hvD4LFsloWl3NAm_ZwHmQnvBbLJ_E7OdnpzEnbpNWsx9gLueO67jseyCe4Y7KeLK2bXs5lvwPoDTTuFvIgas4jSYmiLPVo4QjlfUBDxHWqXF9zZfinC6U1Ux3FgGTo93RIBMD8DbunbXnPwTFyIy9tIDSfHABXhr3DHzOZ0Y8yTAS4JGgYK1G81SoSe3ybgB"
                  alt="Marcus Sterling"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
              <div>
                <p className="font-semibold text-sm text-white">
                  {t("founderName", "Marcus Sterling")}
                </p>
                <p className="text-xs text-white/80">
                  {t("founderTitle", "Founder, Apex Athletic Clubs")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Side: Registration Form */}
      <section className="w-full lg:w-1/2 bg-[#ffffff] flex justify-center items-center py-12 px-6 sm:px-12 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-xl my-auto">
          <header className="mb-8 pt-8 lg:pt-0">
            <div className="flex items-center gap-2 mb-2 lg:hidden">
              <div className="w-9 h-9 rounded-lg kinetic-gradient flex items-center justify-center">
                <Zap className="w-5 h-5 fill-white text-white" />
              </div>
              <span className="font-bold text-xl text-on-surface font-headline">
                {t("brandName", "GymFlow")}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-on-surface tracking-tight font-headline mb-1">
              {t("adminSignUp", "Admin Sign Up")}
            </h2>
            <p className="text-base text-on-surface-variant">
              {t(
                "adminSignUpDesc",
                "Configure your enterprise dashboard and scale your fitness brand."
              )}
            </p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Name Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  htmlFor="first_name"
                >
                  {t("firstName", "First Name")}
                </label>
                <input
                  id="first_name"
                  type="text"
                  placeholder={t("enterFirstName", "Enter first name")}
                  {...register("firstName")}
                  className={`w-full px-4 py-2.5 rounded-lg bg-surface-bright border ${
                    errors.firstName
                      ? "border-error focus:ring-error"
                      : "border-outline-variant"
                  } form-input-focus transition-all text-sm text-on-surface`}
                />
                {errors.firstName && (
                  <p className="text-xs text-error font-medium mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  htmlFor="last_name"
                >
                  {t("lastName", "Last Name")}
                </label>
                <input
                  id="last_name"
                  type="text"
                  placeholder={t("enterLastName", "Enter last name")}
                  {...register("lastName")}
                  className={`w-full px-4 py-2.5 rounded-lg bg-surface-bright border ${
                    errors.lastName
                      ? "border-error focus:ring-error"
                      : "border-outline-variant"
                  } form-input-focus transition-all text-sm text-on-surface`}
                />
                {errors.lastName && (
                  <p className="text-xs text-error font-medium mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Details Group: Gender & Birth Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  htmlFor="gender"
                >
                  {t("gender", "Gender")}
                </label>
                <select
                  id="gender"
                  defaultValue=""
                  {...register("gender")}
                  className={`w-full px-4 py-2.5 rounded-lg bg-surface-bright border ${
                    errors.gender
                      ? "border-error focus:ring-error"
                      : "border-outline-variant"
                  } form-input-focus transition-all text-sm text-on-surface`}
                >
                  <option disabled value="">
                    {t("selectGender", "Select Gender")}
                  </option>
                  <option value="MALE">{t("male", "Male")}</option>
                  <option value="FEMALE">{t("female", "Female")}</option>
                  <option value="OTHER">{t("other", "Other")}</option>
                  <option value="PREFER_NOT_TO_SAY">
                    {t("preferNotToSay", "Prefer not to say")}
                  </option>
                </select>
                {errors.gender && (
                  <p className="text-xs text-error font-medium mt-1">
                    {errors.gender.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  htmlFor="birth_date"
                >
                  {t("birthDate", "Birth Date")}
                </label>
                <input
                  id="birth_date"
                  type="date"
                  {...register("birthDate")}
                  className={`w-full px-4 py-2.5 rounded-lg bg-surface-bright border ${
                    errors.birthDate
                      ? "border-error focus:ring-error"
                      : "border-outline-variant"
                  } form-input-focus transition-all text-sm text-on-surface`}
                />
                {errors.birthDate && (
                  <p className="text-xs text-error font-medium mt-1">
                    {errors.birthDate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Corporate Identity: Company Name */}
            <div className="space-y-1">
              <label
                className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                htmlFor="company_name"
              >
                {t("companyName", "Company Name")}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-outline">
                  <Building2 className="w-5 h-5" />
                </span>
                <input
                  id="company_name"
                  type="text"
                  placeholder={t(
                    "enterCompanyName",
                    "e.g. Iron Gate Enterprise"
                  )}
                  {...register("companyName")}
                  className={`w-full pl-11 pr-4 rtl:pl-4 rtl:pr-11 py-2.5 rounded-lg bg-surface-bright border ${
                    errors.companyName
                      ? "border-error focus:ring-error"
                      : "border-outline-variant"
                  } form-input-focus transition-all text-sm text-on-surface`}
                />
              </div>
              {errors.companyName && (
                <p className="text-xs text-error font-medium mt-1">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            {/* Contact: Phone Number & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  htmlFor="phone"
                >
                  {t("phone", "Phone Number")}
                </label>
                <div className="flex">
                  <select
                    {...register("countryCode")}
                    className="w-24 px-2 py-2.5 rounded-l-lg rtl:rounded-l-none rtl:rounded-r-lg bg-surface-container border-y border-l rtl:border-l-0 rtl:border-r border-outline-variant text-sm font-medium text-on-surface focus:outline-none"
                  >
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+212">+212 (MA)</option>
                    <option value="+33">+33 (FR)</option>
                    <option value="+49">+49 (DE)</option>
                    <option value="+61">+61 (AU)</option>
                    <option value="+971">+971 (AE)</option>
                    <option value="+966">+966 (SA)</option>
                  </select>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="555-0123"
                    {...register("phone")}
                    className={`w-full px-4 py-2.5 rounded-r-lg rtl:rounded-r-none rtl:rounded-l-lg bg-surface-bright border ${
                      errors.phone
                        ? "border-error focus:ring-error"
                        : "border-outline-variant"
                    } form-input-focus transition-all text-sm text-on-surface`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-error font-medium mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  htmlFor="email"
                >
                  {t("email", "Email Address")}
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder={t("enterEmail", "admin@yourgym.com")}
                  {...register("email")}
                  className={`w-full px-4 py-2.5 rounded-lg bg-surface-bright border ${
                    errors.email
                      ? "border-error focus:ring-error"
                      : "border-outline-variant"
                  } form-input-focus transition-all text-sm text-on-surface`}
                />
                {errors.email && (
                  <p className="text-xs text-error font-medium mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* Security: Password */}
            <div className="space-y-1">
              <label
                className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                htmlFor="password"
              >
                {t("password", "Password")}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-outline">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password", {
                    onChange: (e) => setPasswordValue(e.target.value),
                  })}
                  className={`w-full pl-11 pr-11 rtl:pl-11 rtl:pr-11 py-2.5 rounded-lg bg-surface-bright border ${
                    errors.password
                      ? "border-error focus:ring-error"
                      : "border-outline-variant"
                  } form-input-focus transition-all text-sm text-on-surface`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Strength Meter */}
              <div className="flex gap-1.5 mt-2">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="strength-meter-segment flex-1"
                    style={{
                      backgroundColor:
                        index < strength
                          ? strengthColors[strength - 1]
                          : "#e1e2e4",
                    }}
                  />
                ))}
              </div>
              <p
                className="text-xs mt-1 transition-colors"
                style={{
                  color:
                    strength > 0
                      ? strengthColors[strength - 1]
                      : "#464555",
                }}
              >
                {strength > 0
                  ? `${t("passwordStrengthPrefix", "Password strength:")} ${
                      strengthLabels[strength - 1]
                    }`
                  : t(
                      "passwordFeedbackDefault",
                      "Secure passwords use 8+ characters, with numbers & symbols."
                    )}
              </p>
              {errors.password && (
                <p className="text-xs text-error font-medium mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 pt-1">
              <input
                id="terms"
                type="checkbox"
                {...register("termsAccepted")}
                className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer accent-[#3525cd]"
              />
              <label
                htmlFor="terms"
                className="text-xs sm:text-sm text-on-surface-variant cursor-pointer select-none"
              >
                {t("termsAgreement", "I agree to the")}{" "}
                <Link
                  href="/terms"
                  className="text-primary font-semibold hover:underline"
                >
                  {t("termsOfService", "Terms of Service")}
                </Link>{" "}
                {t("and", "and")}{" "}
                <Link
                  href="/privacy"
                  className="text-primary font-semibold hover:underline"
                >
                  {t("privacyPolicy", "Privacy Policy")}
                </Link>
                .
              </label>
            </div>
            {errors.termsAccepted && (
              <p className="text-xs text-error font-medium -mt-2">
                {errors.termsAccepted.message}
              </p>
            )}

            {/* CTA Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full kinetic-gradient text-white font-semibold py-3.5 px-6 rounded-xl shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t("processing", "Processing...")}</span>
                </>
              ) : (
                <>
                  <span>{t("createAccount", "Create Account")}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <footer className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant">
              {t("alreadyHaveAccount", "Already have an account?")}{" "}
              <Link
                href="/login"
                className="text-primary font-bold hover:underline"
              >
                {t("logIn", "Log in")}
              </Link>
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}
