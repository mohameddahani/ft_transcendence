"use client";

import { HelpCircle } from "lucide-react";

import { saasName } from "@/utils/constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Container, SectionHeading } from "@/components/landing/primitives";
import { Reveal } from "@/components/landing/motion";

const faqItems = [
  {
    value: "who-is-it-for",
    question: `Which sports organizations can use ${saasName}?`,
    answer: `${saasName} serves gyms, martial arts schools, swimming clubs, yoga studios, running clubs, and other sports facilities. It brings together member management, membership plans, schedules, QR check-ins, payment records, staff access, and an AI assistant in one platform.`,
  },
  {
    value: "qr-checkin",
    question: "How do QR passes and front-desk check-ins work?",
    answer: "Members book upcoming visits on their phone within verified gym opening hours and display their pass. At the front desk, staff scan the QR code using any camera-enabled device (phone, tablet, or laptop). If camera access is unavailable, staff can execute a manual check-in by member ID.",
  },
  {
    value: "subscriptions-vs-memberships",
    question: "What is the difference between platform subscriptions and gym memberships?",
    answer: "Platform subscriptions are SaaS plans that your sports organization subscribes to, covering your software access and total member capacity. Gym memberships are the plans you create for your members (such as monthly or quarterly packages with specific weekly visit allowances).",
  },
  {
    value: "hours-and-closures",
    question: "How are opening hours and holiday closures managed?",
    answer: "Club administrators configure standard Monday through Sunday operating hours with precise opening and closing times. When unexpected holidays or maintenance periods occur, administrators can add full-day or partial-day special closures, which automatically prevent member bookings during those times.",
  },
  {
    value: "role-permissions",
    question: "Can front-desk staff modify club settings or billing?",
    answer: "No. Role boundaries are strictly enforced. Administrators manage staff invitations, operating hours, membership tiers, and platform settings. Staff handle day-to-day operations: enrolling members, scanning QR passes, viewing today's visits roster, and resolving member feedback.",
  },
  {
    value: "ai-assistant",
    question: "What questions can the AI assistant answer?",
    answer: "The AI assistant operates directly on your club's data to help administrators quickly find information. You can ask for memberships expiring in the next 7 days, members who haven't visited in several weeks, recent payment ledger totals, or summaries of member feedback in plain language.",
  },
  {
    value: "hardware-requirements",
    question: "Do I need special turnstiles or proprietary barcode scanners?",
    answer: "No dedicated hardware is needed. Athlevaro runs in any modern web browser. The front-desk scanner operates through your device's built-in web camera, and members access their passes directly through their mobile web browser.",
  },
];

export default function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="scroll-mt-20 py-20 sm:py-28"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="faq-title"
            eyebrow="Frequently asked questions"
            icon={HelpCircle}
            title="Practical answers to common operational questions."
            description="Everything you need to know about setting up your club, managing front-desk access, and booking visits."
          />
        </Reveal>

        <Reveal delay={0.08} className="mt-12 sm:mt-16 max-w-4xl">
          <div className="rounded-[28px] border border-border bg-card p-6 sm:p-10 shadow-xs">
            <Accordion multiple defaultValue={["who-is-it-for"]}>
              {faqItems.map((item) => (
                <AccordionItem
                  key={item.value}
                  value={item.value}
                  className="border-border py-2 first:pt-0 last:border-b-0"
                >
                  <AccordionTrigger className="text-base sm:text-lg font-semibold text-foreground hover:text-primary transition-colors hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm sm:text-base leading-7 text-muted-foreground pt-1 pb-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

