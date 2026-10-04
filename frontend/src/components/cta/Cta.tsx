"use client";

import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

import { authRoutes, saasName } from "@/utils/constants";
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
          <div className="relative overflow-hidden rounded-[32px] border border-border bg-gradient-to-b from-card to-muted/40 p-10 sm:p-16 lg:p-20 text-center shadow-lg shadow-slate-900/5">
            {/* Subtle background sport grid line decoration */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[40px_40px] opacity-40 mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,black,transparent)]"
            />

            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
                <ShieldCheck size={13} aria-hidden="true" />
                Get started today
              </span>

              <h2
                id="cta-heading"
                className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.12]"
              >
                Run your club with clarity.
                <br />
                <span className="text-muted-foreground">Give members a better experience.</span>
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
                Join {saasName} to centralize your membership tiers, staff operations, opening schedules, and QR passes in one connected system.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
                <LinkButton
                  href={authRoutes.register}
                  size="lg"
                  variant="primary"
                  className="w-full sm:w-auto group shadow-md"
                >
                  Register your club
                  <ArrowRight
                    size={17}
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </LinkButton>
                <LinkButton
                  href="#product-preview"
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  Explore the platform
                </LinkButton>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-4 border-t border-border/80">
                {benefits.map((benefit) => (
                  <span
                    key={benefit}
                    className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
                  >
                    <CheckCircle2 size={15} className="text-primary shrink-0" aria-hidden="true" />
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

