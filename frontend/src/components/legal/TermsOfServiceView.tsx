"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Shield,
  ArrowLeft,
  Info,
  Scale,
} from "lucide-react";
import { SportiumLogo } from "@/components/brand/SportiumLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function TermsOfServiceView() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-[#a3e635]/20 selection:text-foreground">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group" title="Sportium Home">
              <SportiumLogo className="h-6 sm:h-7 text-foreground group-hover:opacity-85 transition-opacity" />
            </Link>
            <span className="hidden sm:inline-block w-px h-4 bg-border/60" />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#a3e635]/10 text-emerald-600 dark:text-[#a3e635] border border-[#a3e635]/20">
              <FileText className="size-3" />
              <span>Terms of Service</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border/60"
            >
              <Shield className="size-3.5" />
              <span>Privacy Policy</span>
            </Link>

            <Link
              href="/register"
              className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition-colors border border-border/60"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back</span>
            </Link>

            <LanguageSwitcher />

            <div className="p-1 rounded-xl bg-card border border-border/60 shadow-2xs flex items-center justify-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        {/* Header Hero Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#a3e635]/10 text-emerald-600 dark:text-[#a3e635] border border-[#a3e635]/25">
            <Scale className="size-3.5" />
            <span>Contractual Agreement</span>
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            These terms define the contractual conditions, account responsibilities, membership rules,
            and operational parameters governing access to the Sportium platform.
          </p>
        </div>

        {/* Metadata Summary Card */}
        <div className="bg-card border border-border/60 rounded-2xl p-5 sm:p-6 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Effective Date
            </span>
            <span className="text-sm font-semibold text-foreground mt-0.5 block">
              [TO CONFIRM: date]
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Service
            </span>
            <span className="text-sm font-semibold text-foreground mt-0.5 block truncate">
              [TO CONFIRM: service]
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Contracting Operator
            </span>
            <span className="text-sm font-semibold text-foreground mt-0.5 block truncate">
              [TO CONFIRM: operator]
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Notices Contact
            </span>
            <span className="text-sm font-semibold text-foreground mt-0.5 block truncate">
              [TO CONFIRM: contact]
            </span>
          </div>
        </div>

        {/* Intro Callout Banner */}
        <div className="bg-muted/30 border border-border/60 border-l-4 border-l-[#a3e635] rounded-2xl p-5 text-sm sm:text-[15px] leading-relaxed text-foreground">
          The service provides club administration and member features, including accounts,
          club plans, memberships, platform subscriptions, payment records, opening hours,
          visit bookings, attendance, feedback, and notifications. Available functions depend
          on the account role and access requirements.
        </div>

        {/* SECTION 2.1 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              2.1
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Service and Agreement
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            The service provides club administration and member features, including
            accounts, club plans, memberships, platform subscriptions, payment records,
            opening hours, visit bookings, attendance, feedback, and notifications.
            Available functions depend on the account role and access requirements.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Administrator registration requires a terms acceptance value and email
            verification before normal login. Members and staff receive accounts created
            by authorized club users and use emailed links to set their passwords.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: how these Terms are presented and accepted by every account type, which version applies, and the relationship to separate club contracts.]
            </div>
          </div>
        </section>

        {/* SECTION 2.2 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              2.2
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Accounts and Responsibilities
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Provide accurate information and keep account contact details current. Keep
            passwords, account action links, access tokens, refresh tokens, and visit QR
            tokens private. Use only accounts and records you are authorized to access.
            Report suspected unauthorized account use to [TO CONFIRM: support or security reporting contact].
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            The current age checks require administrators and staff to be at least 18
            and members to be at least 13.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: final age eligibility rules, contracting capacity, and any parent or guardian approval process.]
            </div>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Administrator and platform owner accounts log in with email and password.
            Staff and members log in with username and password. The service supports
            email-based password recovery and verification of self-service email changes.
            Pending or banned accounts are refused normal login and token refresh.
          </p>
        </section>

        {/* SECTION 2.3 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              2.3
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Permitted Use
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Use the service for authorized club administration and member activities.
            Do not impersonate another person, access another club&apos;s records without
            authorization, bypass access restrictions, falsify attendance or payment
            information, misuse another person&apos;s QR token, disrupt the service, or submit
            unlawful or abusive content. Upload and submit only information and images
            you are entitled to use and share.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: approval of these conduct rules, content reporting and moderation procedures, and the contractual consequences of violations.]
            </div>
          </div>
        </section>

        {/* SECTION 2.4 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              2.4
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Club Administration and Roles
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Platform owner accounts manage platform plans, administrator subscriptions,
            and administrator account status. Club administrators manage their club&apos;s
            staff, members, membership plans, operating hours, and special closures.
            Staff can manage members and operational records within their associated
            club. This includes members added by other staff in that club.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Administrators should assign staff access only to appropriate people and
            check the accuracy of club records. Administrators and staff should have
            authority to enter member information, including emergency contacts and
            wallet addresses.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: the allocation of responsibilities between the operator and clubs, including club services and data handling.]
            </div>
          </div>
        </section>

        {/* SECTION 2.5 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              2.5
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Platform Subscriptions
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            A club administrator&apos;s platform subscription has a plan, duration, amount,
            start date, expiry date, and status. Plans include a maximum member count.
            An active account, subscription, and platform plan are required for many
            club operations. Subscription changes that exceed the selected plan&apos;s
            member capacity are refused.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            The implemented platform owner functions activate, replace, or cancel
            administrator subscriptions. Cancellation changes the subscription status
            immediately. Administrator subscription endpoints provide viewing functions,
            without a self-service cancellation action. A replacement subscription
            starts from the change time and marks the previous active subscription as
            expired. Scheduled processing marks expired subscriptions accordingly.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            The reviewed backend does not implement automatic renewal or recurring
            payment collection.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: ordering, renewal, payment, cancellation request procedures, price and currency disclosures, and treatment of unused time when changing or cancelling a subscription.]
            </div>
          </div>
        </section>

        {/* SECTION 2.6 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              2.6
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Club Memberships and Visits
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Club memberships are separate from the club&apos;s platform subscription.
            Administrators and staff create memberships when adding members and can
            assign replacement memberships. Each membership uses a plan and duration
            with an expiry date. A replacement starts from the change time and marks
            the previous active membership as expired. The backend has no member
            self-service membership purchase or membership cancellation function.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: club membership ordering, renewal, cancellation, and change policies, including any treatment of unused time.]
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Booking Limits and Check-in Window
            </h3>
            <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
              Visit booking requires active member and club access covering the requested
              visit date. Bookings must be in the future and fit the club&apos;s recorded hours
              and closures. The system applies one non-cancelled visit per day and the
              membership plan&apos;s weekly visit limit. Missed or expired visits can still
              count toward those booking limits.
            </p>
            <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
              Administrators and staff confirm attendance manually or by QR code against
              a visit for that day. <strong>The current check-in window begins 10 minutes before
              the booked time and ends 30 minutes after it.</strong> Daily and weekly attendance
              checks also apply. An eligible member can cancel their own visit while its
              status is READY. This changes the booking status and keeps the record.
              Cancelling a visit does not cancel a membership or platform subscription.
            </p>
          </div>
        </section>

        {/* SECTION 2.7 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              2.7
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Prices and Payment Records
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            The service stores plan prices and payment records. Creating or replacing
            a member&apos;s membership automatically creates a payment record using the
            selected duration&apos;s price and the membership start time. This record alone
            does not establish that a payment was independently collected or verified.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            The reviewed backend does not provide a payment gateway, payment card
            processing, refund processing, or automatic recurring billing.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: who receives payment, supported payment methods, currency, taxes, invoicing, payment confirmation, corrections, refunds, credits, proration, and any cancellation charges or rights.]
            </div>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            This draft does not set a non-refundable payment rule or promise a refund.
            Any applicable payment and cancellation terms must be confirmed and disclosed
            before publication and before a user agrees to a purchase.
          </p>
        </section>

        {/* SECTION 2.8 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              2.8
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Wallets and Rewards
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Administrator and member accounts can store an optional Ethereum-compatible
            wallet address. Membership creation and replacement trigger a request to
            the configured reward service containing the membership identifier and the
            member wallet address, if present. The request can fail independently of
            the membership operation. A submitted request is not proof of a completed
            blockchain transaction or a reward being received.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            No reward amount, value, availability, redemption, or transfer is promised
            by this draft.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: reward eligibility, calculation, delivery, network, fees, failures, disputes, wallet responsibilities, and the meaning and use of any reward-related price shown in the service.]
            </div>
          </div>
        </section>

        {/* SECTION 2.9 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              2.9
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Feedback and Notifications
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Members with the required access can submit feedback, like feedback,
            remove their own likes, and delete their own feedback. Feedback and
            resolution notes are visible to eligible members of the same club with
            associated profile information. Administrators and staff can review and
            change feedback status. Feedback text is sent for sentiment analysis as
            described in the Privacy Policy.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            The service creates in-service membership and subscription expiry reminders
            for the corresponding recipients. Account verification, password setup,
            recovery, and email change messages are sent by email. This draft does not
            promise delivery or a particular reminder time.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: communication policies and any content licence needed to operate the feedback and profile features.]
            </div>
          </div>
        </section>

        {/* SECTION 2.10 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              2.10
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Restrictions, Cancellation, and Ending Use
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Platform owner accounts can set administrator accounts to active, pending,
            or banned. Club administrators can do the same for staff. Administrators
            and staff can change member account status within their club. These are
            technical controls; the reasons, notice, review, and appeal procedures
            require confirmation.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Expiry, cancellation, inactive plans, or account restrictions can prevent
            many club and member operations, including access to some historical
            records. Losing club platform access can affect staff and members even
            where a member&apos;s own membership has time remaining. Account restrictions
            do not establish immediate invalidation of every existing access token.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Logging out ends use of the submitted refresh session; it does not close
            the account. There is no general self-service account deletion function.
            To request closure or discuss cancellation, contact [TO CONFIRM: contact and process].
            Such a request is subject to the confirmed policy and applicable law, and
            is not an automatic deletion or refund operation. Retention is addressed
            in the Privacy Policy.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: grounds and procedures for suspension and termination, notice, appeals, data access after termination, account closure, and any financial consequences.]
            </div>
          </div>
        </section>

        {/* SECTION 2.11 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              2.11
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Availability, Disputes, and Changes
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Email, image, sentiment, and reward functions depend on configured external
            services.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: any availability commitments, maintenance notices, warranties, liability terms, and remedies after legal and business review.]
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: governing law and jurisdiction, dispute handling, contractual notice methods, and any mandatory protections under applicable law.]
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: how changes to these Terms are notified, accepted, and dated.]
            </div>
          </div>
        </section>
      </main>

      {/* Modern Minimalist Footer */}
      <footer className="border-t border-border/40 py-8 px-4 sm:px-6 bg-card">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <SportiumLogo className="h-5 text-foreground" />
            <span>&copy; {new Date().getFullYear()} Sportium. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-foreground transition-colors font-medium">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-foreground font-semibold">
              Terms of Service
            </Link>
            <Link href="/" className="hover:text-foreground transition-colors">
              Platform Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
