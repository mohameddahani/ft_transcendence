import type { ReactNode } from "react";
import {
  BadgeCheck,
  Bot,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardList,
  CreditCard,
  LayoutGrid,
  MessageSquareText,
  QrCode,
  ScanLine,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Container, SectionHeading } from "@/components/landing/primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion";

/* ------------------------------------------------------------------ */
/* Illustrative UI snippets (decorative, sample values only)          */
/* ------------------------------------------------------------------ */

function SnippetCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "w-64 rounded-2xl border border-border bg-card p-4 text-left shadow-xl shadow-slate-900/10 sm:w-72 dark:shadow-black/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

function HoursSnippet() {
  const rows = [
    { day: "Mon – Fri", hours: "06:00 – 22:00" },
    { day: "Saturday", hours: "08:00 – 20:00" },
    { day: "Sunday", hours: "Closed", closed: true },
  ];

  return (
    <SnippetCard>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Clock3 size={15} className="text-primary" />
          Opening hours
        </p>
        <span className="text-[11px] text-muted-foreground">Example</span>
      </div>
      <ul className="mt-3 divide-y divide-border text-sm">
        {rows.map((row) => (
          <li key={row.day} className="flex justify-between py-2">
            <span className="text-muted-foreground">{row.day}</span>
            <span
              className={cn(
                "font-medium tabular-nums",
                row.closed ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {row.hours}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 rounded-lg bg-warning-surface px-2.5 py-1.5 text-xs font-medium text-warning">
        Special closure added for a holiday
      </p>
    </SnippetCard>
  );
}

function CheckInSnippet() {
  return (
    <SnippetCard>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-selected text-primary">
          <ScanLine size={20} />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">QR check-in</p>
          <p className="text-xs text-muted-foreground">Pass scanned at the desk</p>
        </div>
      </div>
      <p className="mt-4 flex items-center gap-2 rounded-lg bg-success-surface px-2.5 py-2 text-xs font-medium text-success">
        <BadgeCheck size={15} />
        Checked in
      </p>
      <p className="mt-2 flex items-center gap-2 px-1 text-xs text-muted-foreground">
        <ClipboardList size={14} />
        Manual check-in available as a fallback
      </p>
    </SnippetCard>
  );
}

function BookingSnippet() {
  return (
    <SnippetCard>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarDays size={15} className="text-primary" />
          Upcoming visit
        </p>
        <span className="rounded-full bg-info-surface px-2 py-0.5 text-[11px] font-medium text-info">
          Ready
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        Thu · 18:30
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Within opening hours and your weekly plan limit
      </p>
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-border p-2.5">
        <QrCode size={28} className="text-foreground" />
        <p className="text-xs text-muted-foreground">
          Show this pass at the front desk
        </p>
      </div>
    </SnippetCard>
  );
}

/* ------------------------------------------------------------------ */
/* Audience rows                                                       */
/* ------------------------------------------------------------------ */

const audiences = [
  {
    id: "admins",
    role: "For club administrators",
    roleIcon: UserCog,
    accent: "text-[#2563EB] dark:text-[#93C5FD]",
    title: "Set up your club once, then run it with confidence.",
    description:
      "Define how your club works — plans, hours and team — and keep an eye on members, visits and payment records.",
    points: [
      "Create membership plans with durations, prices and weekly visit limits",
      "Set Monday–Sunday hours and add full or partial-day closures",
      "Invite staff and manage their access",
      "Review payment records and member feedback",
    ],
    image: "/aquatic.jpg",
    alt: "Swimmer training in a pool lane",
    snippet: <HoursSnippet />,
  },
  {
    id: "staff",
    role: "For front-desk staff",
    roleIcon: Users,
    accent: "text-[#0F766E] dark:text-[#5EEAD4]",
    title: "Keep the front desk moving.",
    description:
      "Staff get the tools they need for daily operations, without access to club settings.",
    points: [
      "Scan member QR passes, or check members in manually",
      "See today's visits as members arrive",
      "Look up and enroll members",
      "Respond to and resolve member feedback",
    ],
    image: "/martialArts.jpg",
    alt: "Martial arts students practicing in a dojo",
    snippet: <CheckInSnippet />,
  },
  {
    id: "members",
    role: "For members",
    roleIcon: CalendarClock,
    accent: "text-[#C2410C] dark:text-[#FDBA74]",
    title: "A simple portal members can use from their phone.",
    description:
      "Members book visits, show their pass at the desk and keep track of their membership on their own.",
    points: [
      "Book visits when the club is open, within their plan's limits",
      "Show a QR pass for a booked visit",
      "View membership details, payments and attendance history",
      "Share feedback and like other members' posts",
    ],
    image: "/runClub.jpg",
    alt: "Running club members on a group run",
    snippet: <BookingSnippet />,
  },
];

function AudienceRow({
  audience,
  reverse,
}: {
  audience: (typeof audiences)[number];
  reverse: boolean;
}) {
  const RoleIcon = audience.roleIcon;

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <Reveal className={cn(reverse && "lg:order-2")}>
        <p
          className={cn(
            "flex items-center gap-2 text-sm font-semibold",
            audience.accent,
          )}
        >
          <RoleIcon size={16} aria-hidden="true" />
          {audience.role}
        </p>
        <h3 className="mt-4 max-w-lg text-2xl leading-tight font-semibold tracking-[-0.025em] text-balance text-foreground sm:text-3xl">
          {audience.title}
        </h3>
        <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
          {audience.description}
        </p>
        <ul className="mt-7 grid max-w-lg gap-3.5">
          {audience.points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 text-[0.95rem] leading-6 text-foreground/90"
            >
              <CheckCircle2
                size={18}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-primary"
              />
              {point}
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={0.08} className={cn("relative", reverse && "lg:order-1")}>
        <div className="group relative aspect-4/3 overflow-hidden rounded-[24px] bg-neutral-900 shadow-lg shadow-slate-900/10 ring-1 ring-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={audience.image}
            alt={audience.alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-black/45 via-black/5 to-transparent"
          />
        </div>
        <div
          className={cn(
            "relative -mt-20 flex px-4 sm:absolute sm:bottom-6 sm:mt-0 sm:px-0",
            reverse ? "justify-start sm:left-6" : "justify-end sm:right-6",
          )}
        >
          {audience.snippet}
        </div>
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Capability index                                                    */
/* ------------------------------------------------------------------ */

const capabilities = [
  {
    icon: UserPlus,
    title: "Members & enrollment",
    text: "Enrolling a member creates their account, first membership and payment record, and emails them an invitation.",
  },
  {
    icon: LayoutGrid,
    title: "Membership plans",
    text: "Plans with several duration options, prices and a weekly visit limit.",
  },
  {
    icon: CalendarClock,
    title: "Visit booking rules",
    text: "Bookings must be in the future, inside opening hours and within daily and weekly limits.",
  },
  {
    icon: Clock3,
    title: "Hours & closures",
    text: "Weekly opening hours plus special closures that take priority over the regular schedule.",
  },
  {
    icon: QrCode,
    title: "QR check-in",
    text: "Members show a pass for their visit; staff scan it or check the member in manually.",
  },
  {
    icon: CreditCard,
    title: "Payment records",
    text: "A clear history of membership payments and their status. Payments are recorded, not collected online.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    text: "Separate sign-in and permissions for admins, staff and members, with each club's data kept apart.",
  },
  {
    icon: MessageSquareText,
    title: "Member feedback",
    text: "Members rate and comment; your team reviews, resolves or dismisses each item.",
  },
];

const assistantQuestions = [
  "Which memberships expire in the next 7 days?",
  "Who hasn't visited in the last three weeks?",
  "How much did we record in payments this month?",
  "Summarize negative feedback from the last 30 days.",
];

export default function Features() {
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="scroll-mt-20 border-y border-border bg-card py-20 sm:py-28"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="features-title"
            eyebrow="Features"
            icon={LayoutGrid}
            title="One platform for the people who keep your club running."
            description="Each role gets its own portal, focused on the work that role actually does."
          />
        </Reveal>

        <div className="mt-16 grid gap-20 sm:mt-20 sm:gap-28">
          {audiences.map((audience, index) => (
            <AudienceRow
              key={audience.id}
              audience={audience}
              reverse={index % 2 === 1}
            />
          ))}
        </div>

        {/* Capability index */}
        <div className="mt-24 sm:mt-32">
          <Reveal>
            <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              The essentials, built in
            </h3>
          </Reveal>
          <Stagger
            as="ul"
            className="mt-8 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-4"
          >
            {capabilities.map(({ icon: Icon, title, text }) => (
              <StaggerItem
                as="li"
                key={title}
                className="border-t border-border py-6"
              >
                <Icon size={20} aria-hidden="true" className="text-primary" />
                <p className="mt-4 font-semibold text-foreground">{title}</p>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {text}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        {/* AI assistant */}
        <Reveal className="mt-20 sm:mt-24">
          <div className="grid gap-10 overflow-hidden rounded-[28px] bg-slate-950 p-8 text-white ring-1 ring-white/10 sm:p-12 lg:grid-cols-5 lg:gap-14">
            <div className="lg:col-span-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pr-3.5 pl-1 text-xs font-medium text-white/85">
                <span className="flex size-6 items-center justify-center rounded-full bg-white/10">
                  <Bot size={13} aria-hidden="true" />
                </span>
                AI assistant
              </span>
              <h3 className="mt-5 text-2xl leading-tight font-semibold tracking-[-0.025em] text-balance sm:text-3xl">
                Ask about your club in plain language.
              </h3>
              <p className="mt-4 text-base leading-7 text-slate-300">
                The assistant answers from your own club&apos;s data. Members
                can also ask about their membership, payments and attendance.
              </p>
            </div>
            <div className="lg:col-span-3">
              <p className="text-sm font-medium text-slate-400">
                Questions administrators can ask
              </p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {assistantQuestions.map((question) => (
                  <li
                    key={question}
                    className="rounded-2xl border border-white/10 bg-white/4 p-4 text-[0.95rem] leading-6 text-slate-100"
                  >
                    &ldquo;{question}&rdquo;
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

