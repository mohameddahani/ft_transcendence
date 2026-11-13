"use client";

import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

import { authRoutes, saasName } from "@/components/landing/constants";
import { Container, LinkButton } from "@/components/landing/primitives";
import { Reveal } from "@/components/landing/motion";

const benefits = [
  "Dedicated club tenant workspace",
  "Browser-based camera QR check-in",
  "Dedicated admin, staff, and member portals",
];

export default function Cta() {
  return (
    <section aria-labelledby="cta-heading" className="py-16 sm:py-24">
      <Container>
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[32px] bg-[#1b1f23] p-10 text-center text-white shadow-lg shadow-black/10 sm:p-16 lg:p-20 dark:bg-[#0f1114] dark:ring-1 dark:ring-white/10">
            {/* Subtle background sport grid line decoration */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,black,transparent)]"
            />

            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-selected px-3.5 py-1 text-xs font-semibold tracking-wider text-selected-foreground uppercase">
                <ShieldCheck size={13} aria-hidden="true" />
                Get started today
              </span>

              <h2
                id="cta-heading"
                className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.12]"
              >
                Run your club with clarity.
                <br />
                <span className="text-white/60">Give members a better experience.</span>
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-white/70">
                Join {saasName} to centralize your membership tiers, staff operations, opening schedules, and QR passes in one connected system.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
                <LinkButton
                  href={authRoutes.register}
                  size="lg"
                  variant="light"
                  className="w-full sm:w-auto group gap-3 pr-2"
                >
                  Register your club
                  <span className="grid size-8 place-items-center rounded-full bg-selected text-selected-foreground">
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </span>
                </LinkButton>
                <LinkButton
                  href="#product-preview"
                  size="lg"
                  variant="outlineLight"
                  className="w-full sm:w-auto"
                >
                  Explore the platform
                </LinkButton>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-4 border-t border-white/10">
                {benefits.map((benefit) => (
                  <span
                    key={benefit}
                    className="flex items-center gap-2 text-xs sm:text-sm text-white/70"
                  >
                    <CheckCircle2 size={15} className="text-[#a3e635] shrink-0" aria-hidden="true" />
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

