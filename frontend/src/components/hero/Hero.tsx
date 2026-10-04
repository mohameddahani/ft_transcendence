"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, CalendarCheck, QrCode, ShieldCheck, Sparkles } from "lucide-react";

import { authRoutes } from "@/utils/constants";
import { Container, LinkButton, Pill } from "@/components/landing/primitives";
import { EASE_OUT } from "@/components/landing/motion";

const audiences = [
  "gyms.",
  "dojos.",
  "swim clubs.",
  "yoga studios.",
  "run clubs.",
];

const PHRASE_DURATION_MS = 4000;

const highlights = [
  { icon: QrCode, label: "QR check-in at the front desk" },
  { icon: CalendarCheck, label: "Visit booking within your hours" },
  { icon: ShieldCheck, label: "Separate admin, staff and member access" },
];

/**
 * Every phrase sits in the same grid cell, so the line always reserves the
 * width and height of the longest phrase and never shifts the layout.
 */
function RotatingAudience() {
  const [index, setIndex] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(
      () => setIndex((value) => (value + 1) % audiences.length),
      PHRASE_DURATION_MS,
    );
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  return (
    <span
      aria-hidden="true"
      className="grid justify-items-center md:inline-grid md:justify-items-start md:text-left"
    >
      {audiences.map((phrase) => (
        <span key={phrase} className="invisible col-start-1 row-start-1">
          {phrase}
        </span>
      ))}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={audiences[index]}
          className="col-start-1 row-start-1 text-primary"
          initial={{ opacity: 0, y: "0.25em" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "-0.2em" }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
        >
          {audiences[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE_OUT, delay },
});

const Hero = () => {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      {/* Quiet court-line texture, faded toward the edges. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60 mask-[radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />

      <Container className="pt-14 pb-12 text-center sm:pt-20 sm:pb-16 lg:pt-24">
        <motion.div {...fadeUp(0)}>
          <Pill icon={Sparkles}>Sports club management, in one place</Pill>
        </motion.div>

        <motion.h1
          id="hero-title"
          {...fadeUp(0.06)}
          className="mx-auto mt-7 max-w-5xl text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.045em] text-foreground sm:text-6xl lg:text-7xl xl:text-[5.25rem]"
        >
          <span className="block">Run your club with clarity.</span>
          <span className="block text-muted-foreground">
            <span className="sr-only">
              Built for gyms, dojos, swim clubs, yoga studios, and run clubs.
            </span>
            <span aria-hidden="true" className="block md:inline">
              Built for{" "}
            </span>
            <RotatingAudience />
          </span>
        </motion.h1>

        <motion.p
          {...fadeUp(0.14)}
          className="mx-auto mt-7 max-w-2xl text-base leading-7 text-pretty text-muted-foreground sm:text-lg sm:leading-8"
        >
          Manage members, memberships, opening hours and payment records from
          one dashboard. Your staff check members in with a QR pass, and
          members book their visits from their phone.
        </motion.p>

        <motion.div
          {...fadeUp(0.22)}
          className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
        >
          <LinkButton href={authRoutes.register} size="lg" className="group">
            Register your club
            <ArrowRight
              size={17}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </LinkButton>
          <LinkButton href="#product-preview" variant="secondary" size="lg">
            Explore the platform
          </LinkButton>
        </motion.div>

        <motion.ul
          {...fadeUp(0.3)}
          className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3"
        >
          {highlights.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Icon size={16} aria-hidden="true" className="text-primary" />
              {label}
            </li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
};

export default Hero;
