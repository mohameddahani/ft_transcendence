"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bot,
  CheckCircle2,
  ImageOff,
  LayoutDashboard,
  MonitorSmartphone,
  QrCode,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Container, SectionHeading } from "@/components/landing/primitives";
import { EASE_OUT, Reveal } from "@/components/landing/motion";

const previewTabs = [
  {
    id: "admin",
    label: "Admin dashboard",
    icon: LayoutDashboard,
    portal: "Admin portal",
    title: "See your club's day at a glance",
    description:
      "Review today's visits, your member directory, membership plans and the weekly schedule from one place.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCkZD5RMCf5Yk5nyeMtB1sfcbYwN-LhgJIhFBokM8BU20Rcfvcu8WJFDMJXEZd_4P8I6ZgpiFjW-OYVWQ1_Ur3TF965nmrspgwNdjgR99oUzLEBScJEG9DaauCf954aa2iNdWTqsQj4KCyfCpZQXs024Iox5GZwQwZmajCChkRWP7dD1zqsRKI2tzZ3mFi6cr-NN-TlVZS1PwnpvnNc5dVOG3TPBimwUdAxV_zfkYyISKQTICzzNpE_",
    alt: "Admin dashboard showing today's visits, members and schedule",
    highlights: [
      "Member directory with account status",
      "Monday–Sunday opening hours editor",
      "Payment records for every membership",
    ],
  },
  {
    id: "desk",
    label: "Front-desk check-in",
    icon: QrCode,
    portal: "Staff portal",
    title: "Check members in with a QR scan",
    description:
      "Staff scan a member's pass with any camera-equipped device, or check them in manually when a camera isn't available.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBlRUpge1GPJgffqE4RvvwrF02yVB2r3xK6x_lnPFL2-y97nGHW_9zYFWkPZxQ1nYhd4BLT8T2jRU1jT2NcWzeOxPHc2AyCUDe-sjSEfCs5C6QJJg648Fu5C_tqqq373nAa2cQndkjpd2oln8bVTl39YaZfmzBfIPNvQBqVi0iCN_PTo3fNwKcUHEK_5fxMPqQsQtHwzitZASuAHCUVng6jH-tyAQUD7ZhC51RwKptEzu0qtZRwtwcc",
    alt: "Front-desk check-in screen with a QR scanner",
    highlights: [
      "Camera QR scanning in the browser",
      "Manual check-in by member",
      "Today's visits list for the front desk",
    ],
  },
  {
    id: "ai",
    label: "AI assistant",
    icon: Bot,
    portal: "Admin portal",
    title: "Ask questions about your club",
    description:
      "Get quick answers from your club's own data instead of digging through lists and filters.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD_NRbJFp-0nBQM1v4WKzeiyXHMQFawaI79Mdm5ycSDr-JZpeOpZ55HrJemmFr8By-xGk-UGTiVhOU7HH3k-DuEwBq3omg9JD06xRmdzPSQqdnN2r28I6XdQZjQq75UiHepz-cfo0mj3mjKynK7dKfQM95Clcu4dKSzQOhD7qJ_bSLmUy7tqRB_u8pVXMDB6RYjsRxFQaFvt3tNZwcb0yo9gGLMOXn9Ti2tn8mjQlI5KgbbvX8qZE2W",
    alt: "AI assistant conversation answering a question about the club",
    highlights: [
      "Memberships expiring soon",
      "Members who haven't visited recently",
      "Recorded payments and recent feedback",
    ],
  },
] as const;

type TabId = (typeof previewTabs)[number]["id"];

export default function ProductPreview() {
  const [activeId, setActiveId] = useState<TabId>("admin");
  const [failedImages, setFailedImages] = useState<ReadonlySet<TabId>>(
    () => new Set(),
  );
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = previewTabs.findIndex((tab) => tab.id === activeId);
  const activeTab = previewTabs[activeIndex];

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = previewTabs.length - 1;
    let next: number | null = null;

    if (event.key === "ArrowRight") next = activeIndex === last ? 0 : activeIndex + 1;
    if (event.key === "ArrowLeft") next = activeIndex === 0 ? last : activeIndex - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = last;
    if (next === null) return;

    event.preventDefault();
    setActiveId(previewTabs[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section
      id="product-preview"
      aria-labelledby="product-preview-title"
      className="scroll-mt-20 pb-16 sm:pb-24"
    >
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <SectionHeading
              id="product-preview-title"
              eyebrow="Product preview"
              icon={MonitorSmartphone}
              title="Designed around how your club runs every day."
              description="Administrators run the business, staff handle the front desk, and members manage their own visits."
            />
          </Reveal>

          <Reveal delay={0.08}>
            <div
              role="tablist"
              aria-label="Product areas"
              className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 shadow-xs"
            >
              {previewTabs.map((tab, index) => {
                const Icon = tab.icon;
                const selected = tab.id === activeId;

                return (
                  <button
                    key={tab.id}
                    ref={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    type="button"
                    role="tab"
                    id={`preview-tab-${tab.id}`}
                    aria-selected={selected}
                    aria-controls="preview-panel"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActiveId(tab.id)}
                    onKeyDown={onTabKeyDown}
                    className={cn(
                      "relative inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                      selected
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {selected && (
                      <motion.span
                        layoutId="preview-tab-indicator"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full bg-primary"
                        transition={{ duration: 0.3, ease: EASE_OUT }}
                      />
                    )}
                    <Icon size={16} aria-hidden="true" className="relative" />
                    <span className="relative">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-10">
          <div
            id="preview-panel"
            role="tabpanel"
            aria-labelledby={`preview-tab-${activeTab.id}`}
            className="overflow-hidden rounded-[24px] border border-border bg-card shadow-xl shadow-slate-900/5 dark:shadow-black/30"
          >
            {/* Window bar */}
            <div className="flex items-center gap-4 border-b border-border bg-muted/60 px-4 py-3 sm:px-5">
              <div aria-hidden="true" className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-foreground/15" />
                <span className="size-2.5 rounded-full bg-foreground/15" />
                <span className="size-2.5 rounded-full bg-foreground/15" />
              </div>
              <span className="truncate text-xs font-medium text-muted-foreground">
                {activeTab.portal}
              </span>
            </div>

            {/* Screenshot */}
            <div className="relative aspect-4/3 w-full overflow-hidden bg-muted sm:aspect-16/9">
              <AnimatePresence initial={false}>
                <motion.div
                  key={activeTab.id}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.01 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT }}
                >
                  {failedImages.has(activeTab.id) ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                      <ImageOff size={28} aria-hidden="true" />
                      <p className="text-sm">Preview image couldn&apos;t be loaded.</p>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeTab.image}
                      alt={activeTab.alt}
                      loading="lazy"
                      decoding="async"
                      onError={() =>
                        setFailedImages((current) => new Set(current).add(activeTab.id))
                      }
                      className="h-full w-full object-cover object-top"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Notes */}
            <div className="grid gap-6 border-t border-border p-6 sm:p-8 md:grid-cols-5 md:gap-10">
              <div className="md:col-span-2">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  {activeTab.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {activeTab.description}
                </p>
              </div>
              <ul className="grid content-center gap-3 sm:grid-cols-3 md:col-span-3 md:grid-cols-1 lg:grid-cols-3">
                {activeTab.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="flex items-start gap-2.5 text-sm leading-6 text-foreground/90"
                  >
                    <CheckCircle2
                      size={16}
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-primary"
                    />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

