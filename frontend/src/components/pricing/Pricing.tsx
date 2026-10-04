"use client";

import {
  Check,
  CreditCard,
  Info,
  Sparkles,
} from "lucide-react";

import { authRoutes, saasEmail } from "@/utils/constants";
import {
  Container,
  LinkButton,
  SectionHeading,
} from "@/components/landing/primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion";
import { cn } from "@/lib/utils";

const platformPlans = [
  {
    name: "Basic",
    badge: "Essential club operations",
    capacity: "Up to 100 members",
    description:
      "Designed for independent studios, boutique martial arts dojos, and community sports clubs.",
    features: [
      "Up to 100 enrolled members quota",
      "Full member directory & status tracking",
      "Monday–Sunday operating hours editor",
      "Special full-day and partial-day closures",
      "Front-desk camera QR scanning & manual check-in",
      "Read-only member payment ledger",
    ],
    durationNote: "Supported in flexible 30, 90, or 365-day terms",
    popular: false,
    ctaText: "Register your club",
    ctaHref: authRoutes.register,
  },
  {
    name: "Pro",
    badge: "Most popular for growing clubs",
    capacity: "Up to 500 members",
    description:
      "Built for high-volume gyms, swimming clubs, and facilities with dedicated front-desk staff.",
    features: [
      "Up to 500 enrolled members quota",
      "All Basic features included",
      "Multiple staff accounts with operational role access",
      "AI operations assistant for schedules & member queries",
      "Community feedback review & resolution tools",
      "Today's active visits roster for floor staff",
    ],
    durationNote: "Supported in flexible 90, 180, or 365-day terms",
    popular: true,
    ctaText: "Register your club",
    ctaHref: authRoutes.register,
  },
  {
    name: "Enterprise",
    badge: "Multi-facility organizations",
    capacity: "Custom member quota",
    description:
      "Tailored for large sports organizations, multi-facility hubs, and bespoke capacity requirements.",
    features: [
      "Custom member enrollment quota",
      "All Pro platform features included",
      "Multi-facility organizational configuration",
      "Custom platform plan duration agreements",
      "Direct platform operator onboarding assistance",
    ],
    durationNote: "Terms and capacity structured with platform operator",
    popular: false,
    ctaText: "Contact platform operator",
    ctaHref: `mailto:${saasEmail}?subject=Enterprise%20Platform%20Plan%20Inquiry`,
  },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="scroll-mt-20 border-t border-border bg-card/50 py-20 sm:py-28"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="pricing-title"
            eyebrow="Platform plans"
            icon={CreditCard}
            title="Platform subscriptions scaled to your club's capacity."
            description="SaaS plans govern your total member capacity and operational tools. Your gym's own membership tiers and prices are configured independently inside your admin portal."
          />
        </Reveal>

        <Stagger
          as="div"
          className="mt-14 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3 sm:mt-18"
        >
          {platformPlans.map((plan) => {
            const isPopular = plan.popular;

            return (
              <StaggerItem
                as="div"
                key={plan.name}
                className={cn(
                  "relative flex flex-col justify-between rounded-[28px] border bg-card p-7 sm:p-8 shadow-xs transition-all duration-200",
                  isPopular
                    ? "border-primary/50 shadow-lg shadow-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-border/80",
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-8 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                    <Sparkles size={12} aria-hidden="true" />
                    Recommended
                  </div>
                )}

                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-2xl font-bold tracking-tight text-foreground">
                      {plan.name}
                    </h3>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                      {plan.capacity}
                    </span>
                  </div>

                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {plan.badge}
                  </p>

                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {plan.description}
                  </p>

                  <div className="mt-6 border-t border-border pt-6">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Supported platform capabilities
                    </p>
                    <ul className="mt-4 space-y-3">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-sm leading-6 text-foreground/90"
                        >
                          <Check
                            size={16}
                            className="mt-1 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 border-t border-border pt-6">
                  <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">Duration:</span>{" "}
                    {plan.durationNote}
                  </p>

                  <LinkButton
                    href={plan.ctaHref}
                    variant={isPopular ? "primary" : "secondary"}
                    size="lg"
                    className="w-full"
                  >
                    {plan.ctaText}
                  </LinkButton>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        {/* Clear explanation of subscription activation */}
        <Reveal delay={0.12} className="mt-12 sm:mt-16">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-selected text-primary">
                <Info size={20} aria-hidden="true" />
              </span>
              <div className="text-sm leading-relaxed text-muted-foreground">
                <h4 className="font-semibold text-foreground">
                  How platform subscription activation works
                </h4>
                <p className="mt-1">
                  Public registration sets up your dedicated club workspace with full administrator privileges immediately. Platform SaaS subscriptions and terms (e.g. 30, 90, 180, or 365 days) are assigned and managed directly through platform administration. Registration alone does not charge a card or lock you into recurring billing.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-foreground/80">
                  <span className="flex items-center gap-1.5">
                    <Check size={14} className="text-primary" />
                    Separate gym memberships for members
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check size={14} className="text-primary" />
                    Enforced member capacity quotas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check size={14} className="text-primary" />
                    Transparent term options
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}