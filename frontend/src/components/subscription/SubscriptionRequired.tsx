"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { Check, Crown, Loader2, Sparkles, X } from "lucide-react";

import { fetchMySubscription, fetchPlatformPlans } from "@/lib/api/subscriptions";
import type { PlatformPlanWithDurations } from "@/types/subscription";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { platformPlans } from "@/components/landing/pricing/Pricing";
import { WhatsappIcon, whatsappLink } from "@/components/landing/whatsapp";

// the backend answers this 403 to every request once the gym's platform subscription has ended
const NO_SUBSCRIPTION = "active admin subscription";
const ANIMATION_MS = 300;

// the plans the owner can buy: active ones, with their active durations, smallest first
function activePlans(plans: PlatformPlanWithDurations[]) {
  return plans
    .filter((plan) => plan.isActive)
    .map((plan) => ({
      ...plan,
      durations: plan.durations.filter((d) => d.isActive !== false).sort((a, b) => a.durationDays - b.durationDays),
    }))
    .sort((a, b) => a.maxMembers - b.maxMembers);
}

// the landing page's text for a plan of the same name (features, badge), when there is one
function landingDetails(planName: string) {
  return platformPlans.find((p) => p.name.toLowerCase() === planName.trim().toLowerCase());
}

function formatMad(price: string | number) {
  return `${Number(price).toLocaleString("fr-MA", { maximumFractionDigits: 2 })} MAD`;
}

// for a gym owner without an active platform subscription: the plans, opened on the dashboard, then a floating button
export default function SubscriptionRequired() {
  const { t } = useTranslation();
  const { companyName } = useCurrentUser();
  const pathname = usePathname();
  const [missing, setMissing] = useState(false);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false); // drives the open/close animation
  const [plans, setPlans] = useState<PlatformPlanWithDurations[] | null>(null); // null while loading
  const [plansFailed, setPlansFailed] = useState(false);
  const autoOpened = useRef(false);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    fetchMySubscription()
      .then((subscription) => active && setMissing(!subscription))
      .catch((err: unknown) => {
        const message = err instanceof AxiosError ? String(err.response?.data?.message ?? "") : "";
        if (active && err instanceof AxiosError && err.response?.status === 403 && message.includes(NO_SUBSCRIPTION)) {
          setMissing(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // the plans come from the backend (GET /api/plans), loaded once we know they are needed
  useEffect(() => {
    if (!missing) return;
    fetchPlatformPlans()
      .then((all) => setPlans(activePlans(all)))
      .catch(() => {
        setPlans([]);
        setPlansFailed(true);
      });
  }, [missing]);

  const openPopup = useCallback(() => {
    setOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
  }, []);

  const closePopup = useCallback(() => {
    setShown(false);
    window.setTimeout(() => setOpen(false), ANIMATION_MS);
  }, []);

  // opens by itself once, the first time the owner lands on the dashboard after signing in
  useEffect(() => {
    if (missing && pathname === "/dashboard" && !autoOpened.current) {
      autoOpened.current = true;
      openPopup();
    }
  }, [missing, pathname, openPopup]);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePopup();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closePopup]);

  if (!missing) return null;

  const club = companyName || t("myClub", "my club");

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
          {/* the page behind, dimmed */}
          <div
            aria-hidden="true"
            onClick={closePopup}
            className={`absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${
              shown ? "opacity-100" : "opacity-0"
            }`}
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-title"
            className={`relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-[28px] bg-toota-main p-5 sm:p-8 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 ease-out motion-reduce:transition-none origin-bottom-right rtl:origin-bottom-left ${
              shown
                ? "opacity-100 scale-100 translate-x-0 translate-y-0"
                : "opacity-0 scale-50 translate-x-1/3 translate-y-1/3 rtl:-translate-x-1/3"
            }`}
          >
            <button
              ref={closeButton}
              type="button"
              onClick={closePopup}
              aria-label={t("close", "Close")}
              className="toota-pill !h-10 !w-10 !p-0 absolute top-4 end-4 justify-center cursor-pointer hover:ring-2 hover:ring-[#a3e635] focus-visible:ring-2 focus-visible:ring-[#a3e635]"
            >
              <X className="size-4" />
            </button>

            {/* why the dashboard is paused */}
            <div className="pe-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-toota-pill py-1 ps-1 pe-3.5 text-xs font-semibold shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                <span className="grid size-6 place-items-center rounded-full bg-[#a3e635] text-[#1a2e05]">
                  <Crown className="size-3.5" />
                </span>
                {t("subscriptionRequiredBadge", "Subscription required")}
              </span>
              <h2 id="subscription-title" className="font-headline mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-toota-ink">
                {t("subscriptionRequiredTitle", "Your Sportium subscription isn't active")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-toota-muted leading-relaxed">
                {t(
                  "subscriptionRequiredText",
                  "Your club's dashboard, members, check-in and AI assistant are paused until a subscription is active. Choose a plan and message us on WhatsApp: we activate it for you."
                )}
              </p>
            </div>

            {/* the platform's plans, from the backend */}
            {plans === null ? (
              <div className="mt-10 mb-6 flex items-center justify-center gap-2 text-sm text-toota-muted">
                <Loader2 className="size-4 animate-spin" />
                {t("loadingPlans", "Loading the plans...")}
              </div>
            ) : plans.length === 0 ? (
              <div className="mt-7 rounded-3xl bg-toota-pill p-6 text-center ring-1 ring-black/5 dark:ring-white/10">
                <p className="text-sm text-toota-muted">
                  {plansFailed
                    ? t("plansUnavailable", "The plans couldn't be loaded right now.")
                    : t("noPlansYet", "No plan is available online yet.")}{" "}
                  {t("plansAskUs", "Message us and we'll set up the right plan for your club.")}
                </p>
                <a
                  href={whatsappLink(`Hello Sportium, I'd like to activate a subscription for ${club}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full ps-1.5 pe-5 text-sm font-semibold bg-[#1b1f23] text-white hover:bg-[#2b3036] dark:bg-white dark:text-[#0f1115] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635]"
                >
                  <span className="grid size-8 place-items-center rounded-full bg-[#a3e635] text-[#1a2e05]">
                    <WhatsappIcon className="size-4" />
                  </span>
                  {t("contactPlatformOperator", "Contact platform operator")}
                </a>
              </div>
            ) : (
            <div className={`mt-7 grid grid-cols-1 gap-4 ${plans.length >= 3 ? "lg:grid-cols-3" : plans.length === 2 ? "md:grid-cols-2" : "max-w-md"}`}>
              {plans.map((plan) => {
                const details = landingDetails(plan.planName);
                const popular = details?.popular ?? false;
                return (
                <article
                  key={plan.id}
                  className={`relative flex flex-col rounded-3xl bg-toota-pill p-6 shadow-sm ring-1 transition-shadow ${
                    popular ? "ring-2 ring-[#a3e635]" : "ring-black/5 dark:ring-white/10 hover:ring-[#a3e635]/70"
                  }`}
                >
                  {popular && (
                    <span className="absolute -top-3 start-6 inline-flex items-center gap-1.5 rounded-full bg-[#1b1f23] px-3 py-1 text-[11px] font-semibold text-white shadow-sm dark:bg-white dark:text-[#0f1115]">
                      <Sparkles className="size-3 text-[#a3e635] dark:text-[#65a30d]" />
                      {t("recommended", "Recommended")}
                    </span>
                  )}

                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-headline text-xl font-semibold text-toota-ink">{plan.planName}</h3>
                    <span className="text-xs font-semibold text-toota-muted">
                      {t("upToMembers", "Up to {{count}} members", { count: plan.maxMembers })}
                    </span>
                  </div>
                  {details && <p className="mt-1 text-xs font-semibold text-[#4d7c0f] dark:text-[#a3e635]">{details.badge}</p>}
                  {(plan.description || details?.description) && (
                    <p className="mt-3 text-sm text-toota-muted leading-relaxed">{plan.description || details?.description}</p>
                  )}

                  {details && (
                    <>
                      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-toota-muted">
                        {t("platformCapabilities", "Supported platform capabilities")}
                      </p>
                      <ul className="mt-3 space-y-2.5">
                        {details.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5 text-sm text-toota-ink">
                            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[#a3e635] text-[#1a2e05]">
                              <Check className="size-2.5" strokeWidth={3} />
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {/* the durations and prices set by the platform owner */}
                  <div className="mt-5 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-toota-muted">
                      {t("durationsAndPrices", "Durations and prices")}
                    </p>
                    {plan.durations.length > 0 ? (
                      <ul className="mt-2.5 space-y-2">
                        {plan.durations.map((d) => (
                          <li key={d.id} className="flex items-center justify-between gap-3 rounded-2xl bg-toota-inner px-3.5 py-2.5 text-sm">
                            <span className="text-toota-muted">{t("daysCount", "{{count}} days", { count: d.durationDays })}</span>
                            <span className="font-semibold text-toota-ink tabular-nums">{formatMad(d.price)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2.5 rounded-2xl bg-toota-inner px-3.5 py-2.5 text-xs text-toota-muted">
                        {details?.durationNote || t("durationOnRequest", "Duration and price on request")}
                      </p>
                    )}
                  </div>

                  <a
                    href={whatsappLink(`Hello Sportium, I'd like to activate the ${plan.planName} plan for ${club}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full ps-1.5 pe-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635] ${
                      popular || plans.length === 1
                        ? "bg-[#1b1f23] text-white hover:bg-[#2b3036] dark:bg-white dark:text-[#0f1115] dark:hover:bg-white/90"
                        : "bg-toota-inner text-toota-ink ring-1 ring-black/5 hover:ring-2 hover:ring-[#a3e635] dark:ring-white/10"
                    }`}
                  >
                    <span className="grid size-8 place-items-center rounded-full bg-[#a3e635] text-[#1a2e05]">
                      <WhatsappIcon className="size-4" />
                    </span>
                    {t("contactPlatformOperator", "Contact platform operator")}
                  </a>
                </article>
                );
              })}
            </div>
            )}
          </section>
        </div>
      )}

      {/* once closed, the popup waits in the corner; above the phone "+" button */}
      {!open && (
        <button
          type="button"
          onClick={openPopup}
          aria-label={t("subscriptionRequiredBadge", "Subscription required")}
          className="group fixed bottom-24 end-4 lg:bottom-6 lg:end-6 z-50 inline-flex h-14 items-center gap-2.5 rounded-full bg-[#1b1f23] ps-2 pe-2 sm:pe-5 text-sm font-semibold text-white shadow-xl ring-1 ring-white/15 cursor-pointer animate-in zoom-in-50 fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none hover:-translate-y-0.5 transition-transform dark:bg-white dark:text-[#0f1115]"
        >
          <span className="relative grid size-10 place-items-center rounded-full bg-[#a3e635] text-[#1a2e05]">
            <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[#a3e635] opacity-60 animate-ping motion-reduce:animate-none" />
            <Crown className="relative size-5" />
          </span>
          <span className="hidden sm:inline">{t("activateSubscription", "Activate your subscription")}</span>
        </button>
      )}
    </>
  );
}
