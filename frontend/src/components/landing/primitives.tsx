import type { ComponentType, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** One width for all regular page content. */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

type IconType = ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

/** Small label used above headings, matching the carousel category chips. */
export function Pill({
  icon: Icon,
  children,
  className,
}: {
  icon?: IconType;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-3.5 pl-1 text-xs font-medium text-foreground/80 shadow-xs",
        !Icon && "pl-3.5",
        className,
      )}
    >
      {Icon && (
        <span className="flex size-6 items-center justify-center rounded-full bg-selected text-primary">
          <Icon size={13} strokeWidth={2} aria-hidden="true" />
        </span>
      )}
      {children}
    </span>
  );
}

/** Eyebrow + heading + description, aligned left or centered. */
export function SectionHeading({
  eyebrow,
  icon,
  title,
  description,
  align = "left",
  id,
  className,
}: {
  eyebrow: string;
  icon?: IconType;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  id?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <Pill icon={icon}>{eyebrow}</Pill>
      <h2
        id={id}
        className="mt-5 text-3xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance text-foreground sm:text-4xl lg:text-[2.85rem]"
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-base leading-7 text-pretty text-muted-foreground sm:text-lg sm:leading-8",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 " +
  "disabled:pointer-events-none disabled:opacity-50";

const buttonVariants = {
  primary:
    "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary-hover hover:shadow-md hover:shadow-primary/25",
  secondary:
    "border border-border bg-card text-foreground shadow-xs hover:border-foreground/20 hover:bg-muted",
  ghost: "text-foreground/80 hover:bg-muted hover:text-foreground",
  light: "bg-white text-slate-900 shadow-sm hover:bg-slate-100 focus-visible:ring-white focus-visible:ring-offset-slate-900",
  outlineLight:
    "border border-white/30 bg-white/5 text-white hover:border-white/60 hover:bg-white/15 focus-visible:ring-white focus-visible:ring-offset-slate-900",
} as const;

const buttonSizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[0.95rem]",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

/** Next.js link styled as a button. */
export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

