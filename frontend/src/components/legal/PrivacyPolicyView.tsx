"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  FileText,
  ArrowLeft,
  Info,
  CheckCircle2,
  Server,
  Lock,
  Clock,
  Mail,
} from "lucide-react";
import { SportiumLogo } from "@/components/brand/SportiumLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function PrivacyPolicyView() {
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
              <Shield className="size-3" />
              <span>Privacy Standard</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/terms"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border/60"
            >
              <FileText className="size-3.5" />
              <span>Terms of Service</span>
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
            <Shield className="size-3.5" />
            <span>Official Policy Specification</span>
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            This policy outlines how the Sportium club management platform processes personal,
            operational, authentication, and attendance records across all account tiers.
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
              Service Name
            </span>
            <span className="text-sm font-semibold text-foreground mt-0.5 block truncate">
              [TO CONFIRM: service]
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Operator
            </span>
            <span className="text-sm font-semibold text-foreground mt-0.5 block truncate">
              [TO CONFIRM: operator]
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Privacy Contact
            </span>
            <span className="text-sm font-semibold text-foreground mt-0.5 block truncate">
              [TO CONFIRM: email]
            </span>
          </div>
        </div>

        {/* Intro Callout Banner */}
        <div className="bg-muted/30 border border-border/60 border-l-4 border-l-[#a3e635] rounded-2xl p-5 text-sm sm:text-[15px] leading-relaxed text-foreground">
          This policy explains how we process information through our club management
          service. The service supports club administration, staff and member accounts,
          membership records, visit bookings, attendance, payment records, and feedback.
          Clubs use a separate platform subscription to access management features.
        </div>

        {/* SECTION 1.1 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              1.1
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              About This Policy
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            This policy explains how we process information through our club management
            service. The service supports club administration, staff and member accounts,
            membership records, visit bookings, attendance, payment records, and feedback.
            Clubs use a separate platform subscription to access management features.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            In this policy, &quot;we&quot; means the operator identified above. A platform owner
            account is an administrative role in the service; that role does not by itself
            identify the legal operator.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: the privacy responsibilities of the operator and each club, including who handles requests about club records.]
            </div>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            This draft is based on a backend review only. Website analytics, browser
            storage, tracking, additional cookies, third-party scripts, and other frontend
            data collection are unverified.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: complete those disclosures after a separate website and deployment review.]
            </div>
          </div>
        </section>

        {/* SECTION 1.2 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              1.2
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Information We Process
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Depending on your role and the features used, the service processes the following categories of records:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                Account Information
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                First and last name, date of birth, gender, generated username, email address, telephone number, company or club name, account identifier, role, account status, profile image URL and image identifier, and account creation and update dates. Administrator records also include email verification status and a terms acceptance value.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                Member Information
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Address, emergency contact telephone number, club administrator association, and the staff association recorded when relevant. Club administrators and staff can enter and update member information. Club administrators can enter and update staff information.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Lock className="size-3.5 text-emerald-500" />
                Authentication Information
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Password hashes; session identifiers and refresh token hashes; token expiry and revocation dates; verification, password setup, password reset, and email change token hashes; token use dates; and proposed new email addresses while an email change is pending.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Server className="size-3.5 text-emerald-500" />
                Session and Request Information
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                IP address, browser user-agent information, an inferred device description, and session creation and update dates. Request logs include the request method, requested URL, IP address, user-agent, and response status. URLs may include query information.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                Membership and Subscription Data
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Selected plans and durations, prices, start and expiry dates, status, club and member associations, and expiry notification dates. Platform subscriptions also store an amount.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                Payment Records
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Member, club administrator and, where recorded, staff associations, amount, payment date, and record creation and update dates. The reviewed backend has no payment card or bank account fields and no integrated payment checkout.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-emerald-500" />
                Visits and Attendance
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Booked date and time, booking expiry, booking status, a hashed QR check-in token, related membership, attendance method, actual check-in time, and relevant member, club and staff identifiers.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                Feedback &amp; Sentiment Labels
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Text, rating, author and club associations, staff association, likes linked to members, status, resolution notes, resolver identifier, resolution date, and creation and update dates. Automated analysis can add a positive, neutral, or negative sentiment label and a numerical score.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-1.5 md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Mail className="size-3.5 text-emerald-500" />
                Notifications and Wallet Addresses
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Notifications: recipient identifier, type, title, message, read status, and creation date. Wallet information: an optional Ethereum-compatible wallet address for administrator and member accounts, where supplied.
              </p>
            </div>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Some information comes directly from you. Some is entered by your club&apos;s
            administrator or staff, generated during service use, or returned by the
            sentiment analysis service. Emergency contacts may be people who do not hold
            an account.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: any separate payment collection methods and providers, and how emergency contacts receive privacy information.]
            </div>
          </div>
        </section>

        {/* SECTION 1.3 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              1.3
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Why We Process Information
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            We use this information to create and manage accounts; verify email addresses;
            set, reset, and change passwords; confirm requested email changes; authenticate
            sessions; and apply role, account, and club access restrictions.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            We also use it to maintain club and emergency-contact records, administer
            memberships and platform subscriptions, record payments, apply member and
            weekly visit limits, manage opening hours and closures, book visits, and
            confirm attendance manually or using QR codes.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Feedback information supports club discussions, likes, review and resolution
            of feedback, sentiment analysis, and summary statistics. Membership and
            subscription dates support in-service expiry reminders. Request and session
            information supports service operation, troubleshooting, and authentication.
            Club dashboards summarize account, membership, payment, attendance, visit,
            and feedback information where those statistics are available.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Wallet information supports the reward integration described below.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: the applicable legal grounds for each processing purpose after the operator, operating locations, and relevant laws are established.]
            </div>
          </div>
        </section>

        {/* SECTION 1.4 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              1.4
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Who Can Access Information
            </h2>
          </div>

          <div className="border border-border/60 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/60">
                    <th className="py-3 px-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider w-1/4">
                      Role
                    </th>
                    <th className="py-3 px-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">
                      Authorized Data Access &amp; Scope
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-foreground align-top">
                      Platform Owner
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground leading-relaxed">
                      Can view administrator account details and platform subscription records, manage platform plans and subscriptions, and change administrator account status.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-foreground align-top">
                      Club Administrator
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground leading-relaxed">
                      Can manage their club&apos;s staff and members and access club membership, payment, visit, and feedback records and statistics. They can confirm attendance and manage club plans and operating hours.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-foreground align-top">
                      Club Staff
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground leading-relaxed">
                      Can view and update members across their own club, including member contact details, addresses, emergency contacts, and wallet addresses. Their access is not limited to members they personally added. Staff can manage member account status and memberships, view club payment records, review feedback, view visits, and confirm attendance. Staff do not have the administrator&apos;s staff-management or club-plan editing functions.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-foreground align-top">
                      Members
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground leading-relaxed">
                      Can view their own profile and supported membership, payment, attendance, visit, and notification records, subject to access checks. Available profile changes depend on the account role.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Club management operations are scoped to the associated club administrator.
            Platform owner functions provide separate platform-level access. This does
            not establish the access available to database or hosting personnel.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: authorized operational personnel and their access procedures.]
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Feedback Sharing and Sentiment Visibility
            </h3>
            <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
              Feedback is shared within the club. Eligible members can read feedback from
              other members of the same club, including the author&apos;s identifier, name,
              username, profile image, and role. Related administrator and staff profile
              details, ratings, status, resolution notes, resolver identifiers, and dates
              are also returned. Members see like counts and whether they liked a post.
              Administrators and staff can also see sentiment labels and scores. Do not
              include confidential information in feedback or resolution notes.
            </p>
            <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
              The club administrator&apos;s wallet address is also returned to a member when
              that member logs in.
            </p>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: the intended disclosure and its explanation to administrators.]
            </div>
          </div>
        </section>

        {/* SECTION 1.5 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              1.5
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Service Providers and Other Services
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            The backend is configured to use the following services:
          </p>

          <div className="border border-border/60 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/60">
                    <th className="py-3 px-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider w-1/3">
                      Provider &amp; Channel
                    </th>
                    <th className="py-3 px-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">
                      Data Processed &amp; Operational Purpose
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-foreground align-top">
                      Email delivery (Resend / Nodemailer)
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground leading-relaxed">
                      Resend in production and Gmail through Nodemailer in other environments. The selected provider receives the recipient email address, subject, sender details, and message content, including account action links and the username in password setup messages.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-foreground align-top">
                      Profile images (Cloudinary)
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground leading-relaxed">
                      Cloudinary receives uploaded image files. The service stores the returned image URL and identifier and uses Cloudinary-hosted default avatars. Image URLs are included in profile information shared through the service.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-foreground align-top">
                      Sentiment analysis
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground leading-relaxed">
                      The configured sentiment service receives the full text of submitted feedback. The request body contains the text, without separate account identifiers or the rating. Personal information included in the text is therefore included in the request. The backend saves returned sentiment results and can retry analysis later when results are missing.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-foreground align-top">
                      Reward integration
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground leading-relaxed">
                      When a member&apos;s membership is created or replaced, the backend sends a membership identifier and the member&apos;s wallet address, if present, to the configured blockchain reward service.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-foreground align-top">
                      Storage and hosting
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground leading-relaxed">
                      Account and operational records are stored in a PostgreSQL database. Redis caches selected plan and club-hours information, including related identifiers.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: production hosting, database, cache, backup, and logging providers; their access; storage locations; actual provider deployments; identities of the sentiment and reward service operators; service agreements; provider retention; any further recipients; and any processing or transfers between countries.]
            </div>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            The reward request alone does not show what is written to a blockchain. This
            backend review does not establish the network, public transaction details,
            which identifiers or addresses are published, or how the reward service
            stores, shares, or deletes information.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: these facts by reviewing the reward service before publishing a blockchain privacy disclosure.]
            </div>
          </div>
        </section>

        {/* SECTION 1.6 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              1.6
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Authentication Cookies and Tokens
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            The backend sets a cookie named &quot;refresh_token&quot; at login and replaces it when
            a session is refreshed. It supports authentication. The cookie is configured
            as HttpOnly, SameSite=Strict, and restricted to the /api/auth path. Its Secure
            flag is enabled when the backend runs in production mode. Its lifetime follows
            the configured refresh token lifetime for the account role.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: deployed cookie lifetimes for each role and production settings.]
            </div>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            The backend returns an access token to the client for authenticated requests.
            Where the website stores or handles that token was not reviewed. Blocking or
            removing the refresh cookie can prevent session refresh. The logout endpoint
            clears this cookie and revokes the submitted refresh token record. Password
            changes and password resets revoke existing refresh token sessions; these
            actions do not prove immediate invalidation of every existing access token.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            These statements describe the backend authentication cookie only. They do not
            establish whether other parts of the website use analytics, advertising,
            tracking, additional cookies, or browser storage.
          </p>
        </section>

        {/* SECTION 1.7 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              1.7
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Retention and Deletion
            </h2>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: retention periods and reasons for account, member, financial, attendance, visit, feedback, notification, authentication, log, backup, cache, and provider-held data, including records after service use ends.]
            </div>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Expiry or cancellation changes a membership, subscription, or visit status;
            it does not erase the record. Marking a notification as read also keeps the
            record. Token expiry or revocation does not by itself delete token records.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            A daily process attempts to remove unverified administrator accounts created
            at least seven days earlier. Related records can prevent deletion, so this
            is not a guaranteed deletion deadline or a general inactivity policy.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            The supported controls include removing or replacing a profile image and,
            for an eligible member, deleting that member&apos;s own feedback or removing a
            like. Deleting feedback also deletes its related likes from the service
            database. Image removal requests deletion from Cloudinary and restores a
            default avatar. These operations do not establish removal from backups,
            logs, caches, or other providers&apos; systems.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            The reviewed backend has no general account deletion or complete personal
            data export function.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: the manual closure, export, and deletion process, including exceptions and provider follow-up.]
            </div>
          </div>
        </section>

        {/* SECTION 1.8 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              1.8
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Your Information and Privacy Requests
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Accounts have supported profile viewing and editing functions. Password
            changes require the current password. Self-service email changes require the
            current password and verification of the new email address. Members can edit
            their telephone number, address, emergency contact, and optional wallet
            address through their profile; other corrections may require club assistance.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Many member records and actions require an active member account and
            membership, as well as an active club administrator account and platform
            subscription. Access to those features may be unavailable after expiry or
            restriction. A missing self-service feature does not determine any rights
            you may have under applicable law.
          </p>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            For questions or requests about your information, contact [TO CONFIRM: privacy contact and how to submit a request].
            Identify the account and club concerned and describe the request. Do not send passwords,
            session tokens, wallet private keys, or recovery phrases.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: identity verification, request routing, response process and timelines, and rights or complaint routes under the laws that apply.]
            </div>
          </div>
        </section>

        {/* SECTION 1.9 */}
        <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-muted text-muted-foreground border border-border/40">
              1.9
            </span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-foreground">
              Age Information and Policy Updates
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
            Administrator registration and staff creation enforce a minimum age of 18.
            Member creation enforces a minimum age of 13. These checks do not establish
            a complete policy for minors or any required parent or guardian involvement.
          </p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: permitted ages and the handling of minors&apos; information.]
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> [TO CONFIRM: how policy changes will be dated and communicated.]
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
            <Link href="/terms" className="hover:text-foreground transition-colors font-medium">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-foreground font-semibold">
              Privacy Policy
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
