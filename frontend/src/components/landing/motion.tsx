"use client";

import type { ReactNode } from "react";
import { motion, MotionConfig, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

/** Shared easing: quick start, soft landing, no bounce. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT, delay },
  }),
};

/**
 * Applies the visitor's reduced-motion preference to every motion
 * component below it: transforms are skipped, opacity fades remain.
 */
export function LandingMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "header";
};

/** Fades and lifts content once, the first time it enters the viewport. */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: RevealProps) {
  const Component = motion[as];

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={itemVariants}
      custom={delay}
    >
      {children}
    </Component>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol";
  stagger?: number;
};

/** Reveals related children in a light sequence. Pair with `StaggerItem`. */
export function Stagger({
  children,
  className,
  as = "div",
  stagger = 0.07,
}: StaggerProps) {
  const Component = motion[as];

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Component = motion[as];

  return (
    <Component className={cn(className)} variants={itemVariants}>
      {children}
    </Component>
  );
}
