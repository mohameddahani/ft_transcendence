"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  QrCode,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import { Container, SectionHeading } from "@/components/landing/primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion";

const onboardingSteps = [
  {
    step: "01",
    badge: "Admin setup",
    title: "Register your club",
    description:
      "Create your gym administrator account with your organization name, email, phone number, and secure password via public registration.",
    icon: ShieldCheck,
    details: [
      "Sets up your dedicated club workspace",
      "Email verification confirmation upon signup",
      "Full administrative privileges for your facility",
    ],
  },
  {
    step: "02",
    badge: "Schedules & plans",
    title: "Configure hours & tiers",
    description:
      "Set your Monday–Sunday operating hours, add holiday closures, and define membership plans with weekly visit limits.",
    icon: Clock3,
    details: [
      "Opening and closing times per weekday",
      "Full-day or partial-day special closures",
      "Tiered membership plans with duration options",
    ],
  },
  {
    step: "03",
    badge: "Staff & enrollment",
    title: "Onboard staff & members",
    description:
      "Invite front-desk staff employees and enroll members into active membership tiers, generating their records and invitations.",
    icon: UserPlus,
    details: [
      "Staff receive dedicated front-desk credentials",
      "Enroll members with contact details and emergency info",
      "Initial membership and payment record created",
    ],
  },
  {
    step: "04",
    badge: "Daily operations",
    title: "Book visits & scan passes",
    description:
      "Members book upcoming visits within verified open hours; front-desk staff scan QR tokens or check in manually.",
    icon: QrCode,
    details: [
      "Members present pass or book on phone",
      "Camera scan validates active membership",
      "Today's visits logged automatically in the roster",
    ],
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="scroll-mt-20 py-20 sm:py-28"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="how-it-works-title"
            eyebrow="How it works"
            icon={CalendarDays}
            title="From initial setup to front-desk check-in in four steps."
            description="A clear onboarding flow that reflects the real platform architecture and gets your facility running smoothly."
          />
        </Reveal>

        <Stagger
          as="ol"
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 sm:mt-18"
        >
          {onboardingSteps.map((item) => {
            const Icon = item.icon;

            return (
              <StaggerItem
                as="li"
                key={item.step}
                className="group relative flex flex-col justify-between rounded-[24px] border border-border bg-card p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-bold tracking-tight text-primary/40 transition-colors group-hover:text-primary">
                      {item.step}
                    </span>
                    <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted text-primary transition-colors group-hover:border-primary/40 group-hover:bg-selected">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                  </div>

                  <div className="mt-4">
                    <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                <ul className="mt-6 space-y-2.5 border-t border-border pt-4">
                  {item.details.map((detail, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"
                    >
                      <CheckCircle2
                        size={14}
                        className="mt-0.5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Container>
    </section>
  );
}

