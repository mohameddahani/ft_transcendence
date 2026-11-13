import type { ReactNode } from "react";
import Image from "next/image";
import { Check, Clock, Dumbbell, Flame, QrCode, Sparkles, TrendingUp, Trophy, UserCheck, UserPlus, Waves } from "lucide-react";

// drawings for the sign-in pages: dark cards with lime accents floating over a sports court; decorative only,
// drawn at 540x440 (the page zooms them to fit)
const card = "rounded-[22px] bg-[#20252c]/95 ring-1 ring-white/10 shadow-2xl shadow-black/40 backdrop-blur";
const caption = "text-[10px] font-medium tracking-wide text-white/50 uppercase";

function Stage({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" className="relative h-[440px] w-[540px] shrink-0 select-none">
      {/* the court underneath */}
      <svg viewBox="0 0 500 400" className="absolute inset-0 h-full w-full" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5">
        <rect x="20" y="30" width="460" height="340" rx="28" />
        <line x1="250" y1="30" x2="250" y2="370" />
        <circle cx="250" cy="200" r="70" />
        <circle cx="250" cy="200" r="4" fill="rgba(255,255,255,0.12)" />
        <rect x="20" y="130" width="70" height="140" rx="10" />
        <rect x="410" y="130" width="70" height="140" rx="10" />
      </svg>
      <div className="absolute top-1/2 left-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a3e635]/15 blur-3xl" />
      {children}
    </div>
  );
}

function AssistantBubble({ text }: { text: string }) {
  return (
    <div className="absolute bottom-0 left-0 flex w-[260px] -rotate-[2deg] items-start gap-2.5 rounded-2xl rounded-bl-md bg-white p-3 text-[#0f1115] shadow-2xl shadow-black/40">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#a3e635] text-[#1a2e05]">
        <Sparkles className="size-3.5" />
      </span>
      <p className="text-[12px] leading-snug font-medium">{text}</p>
    </div>
  );
}

function Initials({ children }: { children: ReactNode }) {
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-semibold text-white">
      {children}
    </span>
  );
}

const statusStyle = {
  green: "bg-[#a3e635]/15 text-[#a3e635]",
  amber: "bg-amber-400/15 text-amber-300",
  grey: "bg-white/10 text-white/70",
};

function Status({ tone, children }: { tone: keyof typeof statusStyle; children: ReactNode }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle[tone]}`}>{children}</span>;
}

// ---------------------------------------------------------------- owner: running the club, revenue included
const week = [
  { day: "M", height: 46 },
  { day: "T", height: 62 },
  { day: "W", height: 54 },
  { day: "T", height: 78 },
  { day: "F", height: 92, today: true },
  { day: "S", height: 70 },
  { day: "S", height: 38 },
];

const renewals = [
  { initials: "NZ", name: "Nabil Ziani", plan: "Monthly · 300 MAD", status: "Paid" },
  { initials: "LS", name: "Lamia Skalli", plan: "Student · 200 MAD", status: "Renew" },
  { initials: "RA", name: "Rim Alami", plan: "Annual · 3,000 MAD", status: "Paid" },
];

export function ManagementIllustration() {
  return (
    <Stage>
      {/* revenue: last month's income, rising */}
      <div className={`absolute top-[-6px] left-0 flex w-[268px] -rotate-[2deg] items-center gap-3 p-4 ${card}`}>
        <div className="min-w-0 flex-1">
          <p className={`flex items-center gap-1.5 ${caption}`}>
            <TrendingUp className="size-3 text-[#a3e635]" />
            Revenue · last month
          </p>
          <p className="mt-0.5 font-headline text-[22px] leading-tight font-semibold text-white">54,800 MAD</p>
          <p className="text-[10px] text-white/45">from 185 memberships</p>
        </div>
        <svg viewBox="0 0 80 40" className="h-10 w-20 shrink-0" fill="none">
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a3e635" stopOpacity="0.35" />
              <stop offset="1" stopColor="#a3e635" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M2 32 L15 27 L28 29 L41 19 L54 21 L67 11 L78 6 L78 40 L2 40 Z" fill="url(#revenue-fill)" />
          <polyline points="2,32 15,27 28,29 41,19 54,21 67,11 78,6" stroke="#a3e635" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="78" cy="6" r="3" fill="#a3e635" />
        </svg>
      </div>

      {/* overview: members and this week's visits */}
      <div className={`absolute top-[104px] left-[16px] w-[300px] p-5 ${card}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Club overview</span>
          <span className="rounded-full bg-[#a3e635] px-2.5 py-0.5 text-[11px] font-semibold text-[#1a2e05]">This week</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["Members", "288"],
            ["Active", "208"],
            ["Today", "37"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/5">
              <p className={caption}>{label}</p>
              <p className="font-headline text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex h-28 items-end justify-between gap-2 px-1">
          {week.map(({ day, height, today }, index) => (
            <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <div
                className={`w-full rounded-md ${today ? "bg-[#a3e635] shadow-[0_0_18px_rgba(163,230,53,0.45)]" : "bg-white/15"}`}
                style={{ height: `${height}%` }}
              />
              <span className={`text-[10px] font-medium ${today ? "text-[#a3e635]" : "text-white/40"}`}>{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* a member checked in at the desk */}
      <div className={`absolute top-0 right-[6px] w-[230px] rotate-[3deg] p-3.5 ${card}`}>
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#0f1115]">
            <QrCode className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-white">Checked in</p>
            <p className="truncate text-[11px] text-white/55">Younes B. · 08:42</p>
          </div>
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#a3e635] text-[#1a2e05]">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        </div>
      </div>

      {/* renewals due this week */}
      <div className={`absolute right-0 bottom-[10px] w-[240px] -rotate-[2deg] p-4 ${card}`}>
        <p className="text-[13px] font-semibold text-white">Renewals this week</p>
        <ul className="mt-2.5 space-y-2">
          {renewals.map((member) => (
            <li key={member.initials} className="flex items-center gap-2.5">
              <Initials>{member.initials}</Initials>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium text-white">{member.name}</span>
                <span className="block text-[10px] text-white/45">{member.plan}</span>
              </span>
              <Status tone={member.status === "Paid" ? "green" : "amber"}>{member.status}</Status>
            </li>
          ))}
        </ul>
      </div>

      <AssistantBubble text="42 memberships end this week. Want the list?" />
    </Stage>
  );
}

// ---------------------------------------------------------------- staff: the front desk on a busy day
const visits = [
  { initials: "YB", name: "Younes Benali", time: "10:42", tone: "green", status: "In" },
  { initials: "FT", name: "Fatima Tazi", time: "11:00", tone: "amber", status: "Expected" },
  { initials: "IH", name: "Ismail Haddad", time: "09:15", tone: "green", status: "In" },
  { initials: "SI", name: "Siham Idrissi", time: "18:00", tone: "grey", status: "Booked" },
] as const;

// a small QR code, drawn on a 21x21 grid
const QR =
  "M0 0h7v7H0zM14 0h7v7h-7zM0 14h7v7H0zM8 0h2v2H8zM11 1h2v3h-2zM8 3h2v2H8zM9 6h3v2H9zM0 8h2v2H0zM3 9h3v2H3zM8 9h2v3H8zM12 9h3v2h-3z" +
  "M16 8h2v2h-2zM19 9h2v3h-2zM1 11h2v2H1zM10 12h3v2h-3zM14 12h2v3h-2zM17 12h2v2h-2zM8 14h2v3H8zM11 15h2v2h-2zM15 16h3v2h-3z" +
  "M19 15h2v2h-2zM9 18h3v3H9zM13 18h2v3h-2zM17 19h4v2h-4z";

export function FrontDeskIllustration() {
  return (
    <Stage>
      {/* today's check-ins against the visits booked */}
      <div className={`absolute top-[-6px] left-0 w-[268px] -rotate-[2deg] p-4 ${card}`}>
        <p className={`flex items-center gap-1.5 ${caption}`}>
          <UserCheck className="size-3 text-[#a3e635]" />
          Check-ins today
        </p>
        <p className="mt-0.5 font-headline text-[22px] leading-tight font-semibold text-white">
          37 <span className="text-[13px] font-medium text-white/45">/ 52 expected</span>
        </p>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[71%] rounded-full bg-[#a3e635] shadow-[0_0_12px_rgba(163,230,53,0.5)]" />
        </div>
        <p className="mt-1.5 text-[10px] text-white/45">15 members still expected</p>
      </div>

      {/* the club is open */}
      <div className={`absolute top-[18px] right-[14px] flex rotate-[3deg] items-center gap-2 rounded-full px-3.5 py-2 ${card}`}>
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a3e635] opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2.5 rounded-full bg-[#a3e635]" />
        </span>
        <span className="text-[12px] font-semibold text-white">Open now · until 22:00</span>
      </div>

      {/* scanning a member's pass */}
      <div className={`absolute top-[104px] left-[16px] w-[300px] p-5 ${card}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Scan a pass</span>
          <span className="rounded-full bg-[#a3e635] px-2.5 py-0.5 text-[11px] font-semibold text-[#1a2e05]">Camera on</span>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="relative shrink-0 rounded-2xl bg-white p-3">
            {/* the lime scan frame */}
            <span className="absolute -top-1.5 -left-1.5 size-6 rounded-tl-xl border-t-[3px] border-l-[3px] border-[#a3e635]" />
            <span className="absolute -top-1.5 -right-1.5 size-6 rounded-tr-xl border-t-[3px] border-r-[3px] border-[#a3e635]" />
            <span className="absolute -bottom-1.5 -left-1.5 size-6 rounded-bl-xl border-b-[3px] border-l-[3px] border-[#a3e635]" />
            <span className="absolute -right-1.5 -bottom-1.5 size-6 rounded-br-xl border-r-[3px] border-b-[3px] border-[#a3e635]" />
            <svg viewBox="0 0 21 21" className="size-[80px]" shapeRendering="crispEdges">
              <path fill="#0f1115" d={QR} />
              <path fill="#fff" d="M1 1h5v5H1zM15 1h5v5h-5zM1 15h5v5H1z" />
              <path fill="#0f1115" d="M2 2h3v3H2zM16 2h3v3h-3zM2 16h3v3H2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-white">Younes Benali</p>
            <p className="text-[11px] text-white/50">Monthly · until 30 Nov</p>
            <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#a3e635]/15 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-[#a3e635]">
              <Check className="size-3" strokeWidth={3} />
              Checked in · 10:42
            </p>
          </div>
        </div>
      </div>

      {/* today's visits at the desk */}
      <div className={`absolute top-[168px] right-0 w-[240px] -rotate-[2deg] p-4 ${card}`}>
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-white">Today&apos;s visits</p>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80">52</span>
        </div>
        <ul className="mt-2.5 space-y-2">
          {visits.map((visit) => (
            <li key={visit.initials} className="flex items-center gap-2.5">
              <Initials>{visit.initials}</Initials>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium text-white">{visit.name}</span>
                <span className="block text-[10px] text-white/45">{visit.time}</span>
              </span>
              <Status tone={visit.tone}>{visit.status}</Status>
            </li>
          ))}
        </ul>
      </div>

      <AssistantBubble text="4 members are booked at 18:00. Want their names?" />
    </Stage>
  );
}

// ---------------------------------------------------------------- member: photos of members training
// photos: Unsplash License (free to use, no attribution required); sources in CREDITS.md
function PhotoTile({
  src,
  alt,
  className,
  position,
  icon,
  sport,
  title,
  detail,
  badge,
}: {
  src: string;
  alt: string;
  className: string;
  position: string;
  icon: ReactNode;
  sport: string;
  title: string;
  detail: string;
  badge?: string;
}) {
  return (
    <div className={`absolute overflow-hidden rounded-[22px] bg-[#20252c] shadow-2xl shadow-black/40 ring-1 ring-white/10 ${className}`}>
      <Image src={src} alt={alt} fill sizes="300px" className="object-cover" style={{ objectPosition: position }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      {badge && (
        <span className="absolute top-3 right-3 rounded-full bg-[#a3e635] px-2.5 py-0.5 text-[11px] font-semibold text-[#1a2e05]">{badge}</span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 py-0.5 pr-2.5 pl-1 text-[11px] font-semibold text-white backdrop-blur">
          <span className="grid size-5 place-items-center rounded-full bg-[#a3e635] text-[#1a2e05]">{icon}</span>
          {sport}
        </span>
        <p className="mt-2 font-headline text-[17px] leading-tight font-semibold text-white">{title}</p>
        <p className="text-[11px] text-white/65">{detail}</p>
      </div>
    </div>
  );
}

export function MemberIllustration() {
  return (
    <div aria-hidden="true" className="relative h-[440px] w-[540px] shrink-0 select-none">
      <div className="absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a3e635]/15 blur-3xl" />
      <PhotoTile
        src="/auth/member/strength.jpg"
        alt=""
        className="top-0 left-0 h-[262px] w-[256px]"
        position="78% center"
        icon={<Dumbbell className="size-3" />}
        sport="Strength"
        title="Lift heavier, every week."
        detail="Weights room · open until 22:00"
      />
      <PhotoTile
        src="/auth/member/boxing.jpg"
        alt=""
        className="bottom-0 left-0 h-[166px] w-[256px]"
        position="70% center"
        icon={<Flame className="size-3" />}
        sport="Boxing"
        title="Bag class · 18:30"
        detail="Today · 6 spots left"
      />
      <PhotoTile
        src="/auth/member/swimming.jpg"
        alt=""
        className="top-0 right-0 h-[196px] w-[270px]"
        position="center"
        icon={<Waves className="size-3" />}
        sport="Swimming"
        title="Lane 3 · Saturday 07:00"
        detail="45 minutes · 2 spots left"
        badge="Booked"
      />
      {/* cropped to the player's upper body and racket: the window ends above his legs */}
      <PhotoTile
        src="/auth/member/tennis.jpg"
        alt=""
        className="right-0 bottom-0 h-[232px] w-[270px]"
        position="center 30%"
        icon={<Trophy className="size-3" />}
        sport="Tennis"
        title="Court 2 · Sunday 10:00"
        detail="With your coach · 1 hour"
        badge="Booked"
      />
      {/* the member pass, ready at the door */}
      <div className="absolute top-[-14px] left-[186px] flex -rotate-[4deg] items-center gap-2.5 rounded-2xl bg-[#a3e635] p-2.5 pr-4 text-[#1a2e05] shadow-2xl shadow-black/50">
        <span className="grid size-10 place-items-center rounded-xl bg-white">
          <QrCode className="size-5 text-[#0f1115]" />
        </span>
        <span>
          <span className="block text-[12px] font-bold">Member pass</span>
          <span className="block text-[10px] font-medium opacity-80">Valid until 30 Nov</span>
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- new owner: setting up the club
const setupSteps = [
  { label: "Create your owner account", state: "done" },
  { label: "Set your opening hours", state: "done" },
  { label: "Add membership plans", state: "now" },
  { label: "Invite your front desk", state: "next" },
] as const;

const openingHours = [
  ["Mon – Fri", "06:00 – 22:00"],
  ["Saturday", "08:00 – 20:00"],
  ["Sunday", "Closed"],
];

export function SetupIllustration() {
  return (
    <Stage>
      {/* the setup checklist */}
      <div className={`absolute top-[22px] left-0 w-[290px] -rotate-[1deg] p-5 ${card}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Set up your club</span>
          <span className="text-[11px] font-semibold text-[#a3e635]">2 of 4 done</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 rounded-full bg-[#a3e635]" />
        </div>
        <ul className="mt-4 space-y-3">
          {setupSteps.map((step) => (
            <li key={step.label} className="flex items-center gap-3">
              {step.state === "done" ? (
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#a3e635] text-[#1a2e05]">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              ) : (
                <span
                  className={`size-6 shrink-0 rounded-full ring-2 ${
                    step.state === "now" ? "ring-[#a3e635] shadow-[0_0_12px_rgba(163,230,53,0.45)]" : "ring-white/15"
                  }`}
                />
              )}
              <span className={`text-[12.5px] ${step.state === "next" ? "text-white/45" : "font-medium text-white"}`}>
                {step.label}
              </span>
              {step.state === "now" && <Status tone="green">Now</Status>}
            </li>
          ))}
        </ul>
      </div>

      {/* the plan being added */}
      <div className={`absolute top-0 right-0 w-[220px] rotate-[3deg] p-4 ${card}`}>
        <div className="flex items-center justify-between">
          <p className={caption}>New plan</p>
          <span className="rounded-full bg-[#a3e635] px-2 py-0.5 text-[10px] font-semibold text-[#1a2e05]">Draft</span>
        </div>
        <p className="mt-1 text-[14px] font-semibold text-white">Basic Monthly</p>
        <p className="font-headline text-[22px] leading-tight font-semibold text-white">
          300 MAD <span className="text-[12px] font-medium text-white/45">/ month</span>
        </p>
        <p className="mt-1 text-[11px] text-white/55">3 visits a week · 30 days</p>
      </div>

      {/* the opening hours, already set */}
      <div className={`absolute top-[176px] right-[10px] w-[220px] -rotate-[2deg] p-4 ${card}`}>
        <p className={`flex items-center gap-1.5 ${caption}`}>
          <Clock className="size-3 text-[#a3e635]" />
          Opening hours
        </p>
        <div className="mt-2 space-y-1.5">
          {openingHours.map(([days, hours]) => (
            <div key={days} className="flex items-center justify-between text-[12px]">
              <span className="text-white/60">{days}</span>
              <span className={`font-semibold ${hours === "Closed" ? "text-white/45" : "text-white"}`}>{hours}</span>
            </div>
          ))}
        </div>
      </div>

      {/* the front desk, invited */}
      <div className={`absolute right-[24px] bottom-[6px] flex w-[230px] rotate-[2deg] items-center gap-3 p-3 ${card}`}>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-white">
          <UserPlus className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold text-white">Youssef A.</span>
          <span className="block text-[10px] text-white/45">Front desk</span>
        </span>
        <Status tone="green">Invite sent</Status>
      </div>

      <AssistantBubble text="Your club is ready. Want to add your first members?" />
    </Stage>
  );
}
