"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface LegalViewProps {
  initialTab?: "privacy" | "terms";
}

export default function LegalView({ initialTab = "privacy" }: LegalViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"privacy" | "terms">(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabSwitch = (tab: "privacy" | "terms") => {
    setActiveTab(tab);
    if (tab === "privacy") {
      router.push("/privacy");
    } else {
      router.push("/terms");
    }
  };

  return (
    <div className="legal-wrapper">
      {/* Google Fonts import */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap"
      />

      <style jsx global>{`
        .legal-wrapper {
          --legal-bg: #f7f6f3;
          --legal-surface: #ffffff;
          --legal-border: #e2dfd8;
          --legal-fg: #1a1916;
          --legal-fg-muted: #6b6860;
          --legal-accent: #2d6a4f;
          --legal-accent-lt: #d8ede4;
          --legal-danger: #c0392b;

          --f-display: "DM Serif Display", Georgia, serif;
          --f-body: "DM Sans", system-ui, sans-serif;

          min-height: 100vh;
          background: var(--legal-bg);
          color: var(--legal-fg);
          font-family: var(--f-body);
          font-size: 15px;
          line-height: 1.7;
          box-sizing: border-box;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        :root[data-theme="dark"] .legal-wrapper,
        .dark .legal-wrapper,
        :is(.dark) .legal-wrapper {
          --legal-bg: #141412;
          --legal-surface: #1e1d1a;
          --legal-border: #2e2d29;
          --legal-fg: #f0ede6;
          --legal-fg-muted: #8a8880;
          --legal-accent: #52b788;
          --legal-accent-lt: #1a3329;
          --legal-danger: #e05a4b;
        }

        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .legal-wrapper {
            --legal-bg: #141412;
            --legal-surface: #1e1d1a;
            --legal-border: #2e2d29;
            --legal-fg: #f0ede6;
            --legal-fg-muted: #8a8880;
            --legal-accent: #52b788;
            --legal-accent-lt: #1a3329;
            --legal-danger: #e05a4b;
          }
        }

        .legal-topbar {
          max-width: 820px;
          margin-inline: auto;
          padding: 20px 16px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .legal-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: var(--legal-fg-muted);
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid var(--legal-border);
          background: var(--legal-surface);
          transition: color 0.15s, border-color 0.15s;
        }

        .legal-back-link:hover {
          color: var(--legal-accent);
          border-color: var(--legal-accent);
        }

        .legal-page {
          max-width: 760px;
          margin-inline: auto;
          padding: 24px 16px 80px;
        }

        .legal-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 40px;
          text-decoration: none;
        }

        .legal-brand-mark {
          width: 36px;
          height: 36px;
          background: var(--legal-accent);
          border-radius: 8px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .legal-brand-mark svg {
          display: block;
        }

        .legal-brand-name {
          font-family: var(--f-display);
          font-size: 22px;
          letter-spacing: -0.02em;
          color: var(--legal-fg);
        }

        .legal-page-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--legal-accent);
          margin-bottom: 8px;
        }

        .legal-page-title {
          font-family: var(--f-display);
          font-size: clamp(28px, 5vw, 42px);
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin: 0 0 6px;
          color: var(--legal-fg);
        }

        .legal-page-meta {
          font-size: 13px;
          color: var(--legal-fg-muted);
          margin-bottom: 32px;
        }

        .legal-tabs {
          display: flex;
          gap: 4px;
          border-bottom: 1.5px solid var(--legal-border);
          margin-bottom: 40px;
        }

        .legal-tab-btn {
          font-family: var(--f-body);
          font-size: 14px;
          font-weight: 500;
          color: var(--legal-fg-muted);
          background: none;
          border: none;
          padding: 10px 18px;
          cursor: pointer;
          position: relative;
          bottom: -1.5px;
          border-bottom: 2px solid transparent;
          border-radius: 4px 4px 0 0;
          transition: color 0.15s, background 0.15s, border-bottom-color 0.15s;
        }

        .legal-tab-btn:hover {
          color: var(--legal-fg);
          background: var(--legal-accent-lt);
        }

        .legal-tab-btn.active {
          color: var(--legal-accent);
          border-bottom-color: var(--legal-accent);
          font-weight: 600;
        }

        .legal-tab-panel {
          display: none;
        }

        .legal-tab-panel.active {
          display: block;
        }

        .legal-doc-intro {
          background: var(--legal-accent-lt);
          border-left: 3px solid var(--legal-accent);
          padding: 14px 18px;
          border-radius: 0 6px 6px 0;
          font-size: 14px;
          color: var(--legal-fg);
          margin-bottom: 36px;
          line-height: 1.6;
        }

        .legal-doc-intro strong {
          color: var(--legal-accent);
        }

        .legal-section {
          margin-bottom: 36px;
        }

        .legal-section-num {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--legal-accent);
          margin-bottom: 4px;
        }

        .legal-h2 {
          font-family: var(--f-display);
          font-size: 22px;
          letter-spacing: -0.01em;
          margin: 0 0 12px;
          line-height: 1.25;
          color: var(--legal-fg);
        }

        .legal-h3 {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--legal-fg-muted);
          margin: 24px 0 8px;
        }

        .legal-p {
          margin: 0 0 14px;
          color: var(--legal-fg);
          max-width: 66ch;
        }

        .legal-ul {
          margin: 0 0 14px;
          padding-left: 22px;
          max-width: 66ch;
          color: var(--legal-fg);
        }

        .legal-li {
          margin-bottom: 6px;
        }

        .legal-divider {
          border: none;
          border-top: 1px solid var(--legal-border);
          margin: 36px 0;
        }

        .legal-data-table-wrap {
          overflow-x: auto;
          margin-bottom: 14px;
          border: 1px solid var(--legal-border);
          border-radius: 8px;
          background: var(--legal-surface);
        }

        .legal-data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
          min-width: 480px;
        }

        .legal-data-table th {
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--legal-fg-muted);
          padding: 10px 14px;
          border-bottom: 1.5px solid var(--legal-border);
          background: var(--legal-surface);
        }

        .legal-data-table td {
          padding: 11px 14px;
          border-bottom: 1px solid var(--legal-border);
          vertical-align: top;
          color: var(--legal-fg);
        }

        .legal-data-table tr:last-child td {
          border-bottom: none;
        }

        .legal-data-table tr:hover td {
          background: var(--legal-accent-lt);
        }

        .legal-rights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }

        .legal-right-card {
          background: var(--legal-surface);
          border: 1px solid var(--legal-border);
          border-radius: 8px;
          padding: 14px 16px;
        }

        .legal-right-card-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--legal-fg);
          margin-bottom: 4px;
        }

        .legal-right-card-desc {
          font-size: 12.5px;
          color: var(--legal-fg-muted);
          line-height: 1.5;
        }

        .legal-contact-block {
          background: var(--legal-surface);
          border: 1px solid var(--legal-border);
          border-radius: 10px;
          padding: 20px 24px;
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          align-items: flex-start;
        }

        .legal-contact-block .label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--legal-fg-muted);
          margin-bottom: 4px;
        }

        .legal-contact-block .value {
          font-size: 14px;
          color: var(--legal-fg);
          font-weight: 500;
        }

        .legal-doc-footer {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid var(--legal-border);
          font-size: 12.5px;
          color: var(--legal-fg-muted);
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: space-between;
          align-items: center;
        }

        @media (max-width: 480px) {
          .legal-tab-btn {
            padding: 10px 12px;
            font-size: 13px;
          }
          .legal-rights-grid {
            grid-template-columns: 1fr 1fr;
          }
          .legal-contact-block {
            flex-direction: column;
            gap: 14px;
          }
        }
      `}</style>

      {/* Top Quick Action Bar */}
      <div className="legal-topbar">
        <Link href="/register" className="legal-back-link">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Registration</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-[var(--legal-surface)] border border-[var(--legal-border)] shadow-xs flex items-center justify-center">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="legal-page">
        {/* Brand header */}
        <Link href="/login" className="legal-brand">
          <div className="legal-brand-mark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="8" width="3" height="8" rx="1" fill="white" />
              <rect x="15" y="8" width="3" height="8" rx="1" fill="white" />
              <rect x="5" y="5" width="10" height="3" rx="1" fill="white" />
              <rect x="5" y="12" width="10" height="3" rx="1" fill="white" />
              <rect
                x="8.5"
                y="3"
                width="3"
                height="14"
                rx="1.5"
                fill="white"
                opacity="0.6"
              />
            </svg>
          </div>
          <span className="legal-brand-name">GymFlow</span>
        </Link>

        <p className="legal-page-eyebrow">Legal Documents</p>
        <h1 className="legal-page-title">Privacy &amp; Terms</h1>
        <p className="legal-page-meta">
          Effective date: October 9, 2026 &nbsp;·&nbsp; Version 1.0
        </p>

        {/* Tab navigation */}
        <div className="legal-tabs" role="tablist">
          <button
            className={`legal-tab-btn ${activeTab === "privacy" ? "active" : ""}`}
            role="tab"
            aria-selected={activeTab === "privacy"}
            aria-controls="panel-privacy"
            id="tab-privacy"
            onClick={() => handleTabSwitch("privacy")}
          >
            Privacy Policy
          </button>
          <button
            className={`legal-tab-btn ${activeTab === "terms" ? "active" : ""}`}
            role="tab"
            aria-selected={activeTab === "terms"}
            aria-controls="panel-terms"
            id="tab-terms"
            onClick={() => handleTabSwitch("terms")}
          >
            Terms &amp; Conditions
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════
             PRIVACY POLICY
        ════════════════════════════════════════════════════════ */}
        <div
          className={`legal-tab-panel ${activeTab === "privacy" ? "active" : ""}`}
          id="panel-privacy"
          role="tabpanel"
          aria-labelledby="tab-privacy"
        >
          <div className="legal-doc-intro">
            GymFlow is committed to protecting your personal data. This policy
            explains what we collect, why we collect it, and how you can
            control it. <strong>We never sell personal data to third parties.</strong>
          </div>

          {/* 1 */}
          <div className="legal-section">
            <p className="legal-section-num">01</p>
            <h2 className="legal-h2">Who We Are</h2>
            <p className="legal-p">
              GymFlow is a gym management platform that connects gym owners,
              staff, and members in a single system. The platform is operated by
              the GymFlow team (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
              For the purposes of this policy, GymFlow acts as the{" "}
              <strong>data controller</strong> for super-admin and gym-admin
              account data, and as a <strong>data processor</strong> on behalf
              of gym administrators for member data they manage.
            </p>
            <p className="legal-p">
              Contact us at any time regarding privacy matters using the details
              in Section 9.
            </p>
          </div>

          <hr className="legal-divider" />

          {/* 2 */}
          <div className="legal-section">
            <p className="legal-section-num">02</p>
            <h2 className="legal-h2">Data We Collect</h2>
            <p className="legal-p">
              The data we collect depends on your role on the platform:
            </p>

            <div className="legal-data-table-wrap">
              <table className="legal-data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Data fields</th>
                    <th>Applies to</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Identity</strong>
                    </td>
                    <td>Full name, date of birth, gender</td>
                    <td>All users</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Contact</strong>
                    </td>
                    <td>Email address, phone number, postal address</td>
                    <td>All users</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Profile image</strong>
                    </td>
                    <td>
                      Photo uploaded by the user or uploaded on their behalf by
                      gym staff
                    </td>
                    <td>All users</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Membership</strong>
                    </td>
                    <td>Plan type, start/expiry dates, payment status</td>
                    <td>Members</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Attendance</strong>
                    </td>
                    <td>
                      Check-in timestamps, class bookings, attendance history
                    </td>
                    <td>Members</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Account credentials</strong>
                    </td>
                    <td>Email, hashed password (never stored in plain text)</td>
                    <td>All users</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Usage data</strong>
                    </td>
                    <td>Login timestamps, IP address, browser type</td>
                    <td>All users</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="legal-p">
              We do not collect payment card numbers or banking details
              directly. Any payment processing is handled by the gym
              administrator through their own payment methods.
            </p>
          </div>

          <hr className="legal-divider" />

          {/* 3 */}
          <div className="legal-section">
            <p className="legal-section-num">03</p>
            <h2 className="legal-h2">How We Use Your Data</h2>
            <p className="legal-p">
              We use personal data only for the following purposes:
            </p>
            <ul className="legal-ul">
              <li className="legal-li">
                <strong>Platform operation</strong> — creating and managing your
                account, processing check-ins, managing class bookings and
                membership records.
              </li>
              <li className="legal-li">
                <strong>Authentication &amp; security</strong> — verifying your
                identity at login, detecting suspicious activity, and
                protecting accounts.
              </li>
              <li className="legal-li">
                <strong>Communication</strong> — sending you service
                notifications such as membership expiry reminders or booking
                confirmations.
              </li>
              <li className="legal-li">
                <strong>Platform improvement</strong> — analysing anonymised,
                aggregated usage patterns to improve the service. This data
                cannot be traced back to any individual.
              </li>
              <li className="legal-li">
                <strong>Legal compliance</strong> — meeting any obligations
                required by applicable law.
              </li>
            </ul>
            <p className="legal-p">
              We do not use your data for automated decision-making that
              produces legal or similarly significant effects on you.
            </p>
          </div>

          <hr className="legal-divider" />

          {/* 4 */}
          <div className="legal-section">
            <p className="legal-section-num">04</p>
            <h2 className="legal-h2">Legal Basis for Processing</h2>
            <p className="legal-p">
              We process your data on the following legal grounds:
            </p>
            <ul className="legal-ul">
              <li className="legal-li">
                <strong>Contract performance</strong> — to provide the gym
                management service you or your gym have subscribed to.
              </li>
              <li className="legal-li">
                <strong>Legitimate interest</strong> — to secure the platform,
                prevent fraud, and improve the service.
              </li>
              <li className="legal-li">
                <strong>Consent</strong> — for optional features such as
                promotional communications. You may withdraw consent at any
                time.
              </li>
              <li className="legal-li">
                <strong>Legal obligation</strong> — where processing is
                required by applicable law.
              </li>
            </ul>
          </div>

          <hr className="legal-divider" />

          {/* 5 */}
          <div className="legal-section">
            <p className="legal-section-num">05</p>
            <h2 className="legal-h2">Data Sharing</h2>
            <p className="legal-p">
              We share personal data only in the following limited circumstances:
            </p>
            <ul className="legal-ul">
              <li className="legal-li">
                <strong>Within your gym</strong> — gym administrators and
                authorised staff can access member data that belongs to their
                gym. They cannot access data belonging to another gym.
              </li>
              <li className="legal-li">
                <strong>GymFlow super-admins</strong> — may access any data on
                the platform for support, compliance, and operational purposes.
              </li>
              <li className="legal-li">
                <strong>Service providers</strong> — we may engage trusted
                sub-processors (such as cloud hosting providers) who are bound
                by data processing agreements and may not use your data for
                their own purposes.
              </li>
              <li className="legal-li">
                <strong>Legal requirements</strong> — we may disclose data if
                required to do so by law or in response to a valid legal request.
              </li>
            </ul>
            <p className="legal-p">
              We never sell, rent, or trade personal data with any third party
              for marketing purposes.
            </p>
          </div>

          <hr className="legal-divider" />

          {/* 6 */}
          <div className="legal-section">
            <p className="legal-section-num">06</p>
            <h2 className="legal-h2">Data Retention</h2>
            <p className="legal-p">
              We retain personal data for as long as your account is active or
              as needed to provide the service. Specifically:
            </p>
            <ul className="legal-ul">
              <li className="legal-li">
                Active member and account data is retained for the duration of
                the membership plus 12 months.
              </li>
              <li className="legal-li">
                Attendance and booking history is retained for 24 months from
                the date of the event.
              </li>
              <li className="legal-li">
                Account data for deactivated accounts is deleted within 90 days
                of deactivation, unless retention is required by law.
              </li>
              <li className="legal-li">
                Backups may retain data for up to 30 additional days after
                deletion.
              </li>
            </ul>
          </div>

          <hr className="legal-divider" />

          {/* 7 */}
          <div className="legal-section">
            <p className="legal-section-num">07</p>
            <h2 className="legal-h2">Your Rights</h2>
            <p className="legal-p">
              Depending on your location, you may have the following rights
              regarding your personal data:
            </p>
            <div className="legal-rights-grid">
              <div className="legal-right-card">
                <div className="legal-right-card-title">Access</div>
                <div className="legal-right-card-desc">
                  Request a copy of the personal data we hold about you.
                </div>
              </div>
              <div className="legal-right-card">
                <div className="legal-right-card-title">Correction</div>
                <div className="legal-right-card-desc">
                  Ask us to correct inaccurate or incomplete data.
                </div>
              </div>
              <div className="legal-right-card">
                <div className="legal-right-card-title">Deletion</div>
                <div className="legal-right-card-desc">
                  Request erasure of your data where there is no lawful reason
                  to keep it.
                </div>
              </div>
              <div className="legal-right-card">
                <div className="legal-right-card-title">Portability</div>
                <div className="legal-right-card-desc">
                  Receive your data in a structured, machine-readable format.
                </div>
              </div>
              <div className="legal-right-card">
                <div className="legal-right-card-title">Objection</div>
                <div className="legal-right-card-desc">
                  Object to processing based on legitimate interest.
                </div>
              </div>
              <div className="legal-right-card">
                <div className="legal-right-card-title">Restriction</div>
                <div className="legal-right-card-desc">
                  Ask us to limit how we use your data while a dispute is
                  resolved.
                </div>
              </div>
            </div>
            <p className="legal-p">
              To exercise any of these rights, contact us using the details in
              Section 9. We will respond within 30 days.
            </p>
          </div>

          <hr className="legal-divider" />

          {/* 8 */}
          <div className="legal-section">
            <p className="legal-section-num">08</p>
            <h2 className="legal-h2">Security</h2>
            <p className="legal-p">
              We implement appropriate technical and organisational measures to
              protect your data, including:
            </p>
            <ul className="legal-ul">
              <li className="legal-li">
                All data in transit is encrypted using TLS 1.2 or higher.
              </li>
              <li className="legal-li">
                Passwords are hashed using a strong one-way algorithm and never
                stored in plain text.
              </li>
              <li className="legal-li">
                Access to production data is restricted to authorised personnel
                only.
              </li>
              <li className="legal-li">
                Regular security reviews are carried out on our infrastructure.
              </li>
            </ul>
            <p className="legal-p">
              No system is completely secure. If you believe your account has
              been compromised, contact us immediately.
            </p>
          </div>

          <hr className="legal-divider" />

          {/* 9 */}
          <div className="legal-section">
            <p className="legal-section-num">09</p>
            <h2 className="legal-h2">Contact &amp; Updates</h2>
            <p className="legal-p">
              For any privacy-related question, data request, or concern, reach
              us at:
            </p>
            <div className="legal-contact-block">
              <div>
                <div className="label">Platform</div>
                <div className="value">GymFlow</div>
              </div>
              <div>
                <div className="label">Email</div>
                <div className="value">privacy@gymflow.app</div>
              </div>
              <div>
                <div className="label">Subject line</div>
                <div className="value">Privacy Request</div>
              </div>
            </div>
            <p className="legal-p" style={{ marginTop: "16px" }}>
              We may update this policy from time to time. When we do, we will
              revise the effective date at the top of this page and, where the
              changes are significant, notify you by email or through the
              platform.
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
             TERMS & CONDITIONS
        ════════════════════════════════════════════════════════ */}
        <div
          className={`legal-tab-panel ${activeTab === "terms" ? "active" : ""}`}
          id="panel-terms"
          role="tabpanel"
          aria-labelledby="tab-terms"
        >
          <div className="legal-doc-intro">
            These terms govern your use of GymFlow. By accessing or using the
            platform you agree to them.{" "}
            <strong>If you do not agree, do not use the platform.</strong>
          </div>

          {/* 1 */}
          <div className="legal-section">
            <p className="legal-section-num">01</p>
            <h2 className="legal-h2">Definitions</h2>
            <ul className="legal-ul">
              <li className="legal-li">
                <strong>&quot;Platform&quot;</strong> — the GymFlow web
                application and all associated services.
              </li>
              <li className="legal-li">
                <strong>&quot;GymFlow&quot; / &quot;we&quot;</strong> — the team
                that operates and maintains the platform.
              </li>
              <li className="legal-li">
                <strong>&quot;Gym Admin&quot;</strong> — a gym owner or manager
                who registers a gym on the platform.
              </li>
              <li className="legal-li">
                <strong>&quot;Staff&quot;</strong> — employees or instructors
                added to the platform by a Gym Admin.
              </li>
              <li className="legal-li">
                <strong>&quot;Member&quot;</strong> — an individual subscribed to
                a gym managed on the platform.
              </li>
              <li className="legal-li">
                <strong>&quot;Super-Admin&quot;</strong> — GymFlow team members
                with full administrative access.
              </li>
              <li className="legal-li">
                <strong>&quot;Content&quot;</strong> — any data, text, images, or
                other material uploaded to the platform.
              </li>
            </ul>
          </div>

          <hr className="legal-divider" />

          {/* 2 */}
          <div className="legal-section">
            <p className="legal-section-num">02</p>
            <h2 className="legal-h2">Eligibility &amp; Accounts</h2>
            <p className="legal-p">
              You must be at least 16 years old to create an account. By
              registering, you confirm that the information you provide is
              accurate and that you will keep it up to date.
            </p>
            <h3 className="legal-h3">Account security</h3>
            <p className="legal-p">
              You are responsible for keeping your login credentials
              confidential. You must notify us immediately at the contact
              address in Section 9 if you suspect unauthorised access to your
              account. GymFlow will not be liable for any loss arising from
              unauthorised use of your account where you have failed to keep your
              credentials secure.
            </p>
            <h3 className="legal-h3">Gym Admin responsibilities</h3>
            <p className="legal-p">
              By registering a gym, the Gym Admin accepts responsibility for:
            </p>
            <ul className="legal-ul">
              <li className="legal-li">
                The accuracy of gym and membership information entered into the
                platform.
              </li>
              <li className="legal-li">
                Ensuring that member data is collected with appropriate consent.
              </li>
              <li className="legal-li">
                Managing staff access rights appropriately.
              </li>
              <li className="legal-li">
                Complying with applicable data protection laws in relation to
                member data.
              </li>
            </ul>
          </div>

          <hr className="legal-divider" />

          {/* 3 */}
          <div className="legal-section">
            <p className="legal-section-num">03</p>
            <h2 className="legal-h2">Acceptable Use</h2>
            <p className="legal-p">
              You may use the platform only for its intended purpose — managing
              gym operations, memberships, attendance, and class schedules. You
              must not:
            </p>
            <ul className="legal-ul">
              <li className="legal-li">
                Use the platform to store, share, or distribute unlawful,
                harmful, or offensive content.
              </li>
              <li className="legal-li">
                Attempt to gain unauthorised access to any part of the platform
                or to another user&apos;s account.
              </li>
              <li className="legal-li">
                Interfere with or disrupt the platform&apos;s infrastructure.
              </li>
              <li className="legal-li">
                Reverse-engineer, decompile, or copy any part of the platform.
              </li>
              <li className="legal-li">
                Use the platform to send unsolicited communications to members.
              </li>
              <li className="legal-li">
                Misrepresent your identity or affiliation.
              </li>
            </ul>
            <p className="legal-p">
              We reserve the right to suspend or terminate any account that
              violates these rules without prior notice.
            </p>
          </div>

          <hr className="legal-divider" />

          {/* 4 */}
          <div className="legal-section">
            <p className="legal-section-num">04</p>
            <h2 className="legal-h2">Membership &amp; Payments</h2>
            <p className="legal-p">
              Gym memberships and their associated fees are set by the Gym
              Admin, not by GymFlow. GymFlow is not a party to the financial
              relationship between a gym and its members. Payment disputes,
              refunds, and billing inquiries must be addressed directly with the
              relevant gym.
            </p>
            <p className="legal-p">
              GymFlow does not process, store, or have access to any payment
              card data. Any payment processing is handled outside the platform
              by the gym.
            </p>
          </div>

          <hr className="legal-divider" />

          {/* 5 */}
          <div className="legal-section">
            <p className="legal-section-num">05</p>
            <h2 className="legal-h2">Content &amp; Data Ownership</h2>
            <p className="legal-p">
              You retain ownership of any content you upload to the platform,
              including profile images and gym information. By uploading
              content, you grant GymFlow a limited, non-exclusive licence to
              store, display, and process that content solely to provide the
              service.
            </p>
            <p className="legal-p">
              GymFlow does not claim ownership of member data entered by gym
              administrators. Gym admins are responsible for ensuring they have
              the right to upload and process the data of their members.
            </p>
          </div>

          <hr className="legal-divider" />

          {/* 6 */}
          <div className="legal-section">
            <p className="legal-section-num">06</p>
            <h2 className="legal-h2">Service Availability</h2>
            <p className="legal-p">
              We aim to keep the platform available at all times but we do not
              guarantee uninterrupted access. The platform may be unavailable
              due to scheduled maintenance, technical issues, or circumstances
              beyond our control.
            </p>
            <p className="legal-p">
              We will make reasonable efforts to notify Gym Admins of planned
              maintenance in advance.
            </p>
          </div>

          <hr className="legal-divider" />

          {/* 7 */}
          <div className="legal-section">
            <p className="legal-section-num">07</p>
            <h2 className="legal-h2">Limitation of Liability</h2>
            <p className="legal-p">
              To the extent permitted by applicable law, GymFlow is not liable
              for:
            </p>
            <ul className="legal-ul">
              <li className="legal-li">
                Any indirect, incidental, or consequential loss arising from
                your use of the platform.
              </li>
              <li className="legal-li">
                Loss of data caused by circumstances outside our reasonable
                control.
              </li>
              <li className="legal-li">
                Disputes between a gym and its members regarding memberships,
                payments, or attendance.
              </li>
              <li className="legal-li">Any content uploaded by users.</li>
            </ul>
            <p className="legal-p">
              Nothing in these terms limits liability for fraud, death, or
              personal injury caused by our negligence.
            </p>
          </div>

          <hr className="legal-divider" />

          {/* 8 */}
          <div className="legal-section">
            <p className="legal-section-num">08</p>
            <h2 className="legal-h2">Termination</h2>
            <p className="legal-p">
              Either party may terminate the use of the platform at any time.
            </p>
            <h3 className="legal-h3">By you</h3>
            <p className="legal-p">
              Gym Admins may close their gym account by contacting us. Upon
              closure, member data associated with that gym will be deleted in
              accordance with the retention schedule in the Privacy Policy.
            </p>
            <h3 className="legal-h3">By us</h3>
            <p className="legal-p">
              We may suspend or permanently terminate an account if we
              determine, at our reasonable discretion, that these terms have
              been violated, or that continued use poses a risk to the platform
              or other users. We will provide notice where it is practical and
              safe to do so.
            </p>
          </div>

          <hr className="legal-divider" />

          {/* 9 */}
          <div className="legal-section">
            <p className="legal-section-num">09</p>
            <h2 className="legal-h2">Changes &amp; Contact</h2>
            <p className="legal-p">
              We may update these terms from time to time. Continued use of the
              platform after an update constitutes acceptance of the revised
              terms. We will notify Gym Admins of significant changes by email.
            </p>
            <p className="legal-p">
              For any questions about these terms, reach us at:
            </p>
            <div className="legal-contact-block">
              <div>
                <div className="label">Platform</div>
                <div className="value">GymFlow</div>
              </div>
              <div>
                <div className="label">Email</div>
                <div className="value">legal@gymflow.app</div>
              </div>
              <div>
                <div className="label">Subject line</div>
                <div className="value">Terms Inquiry</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="legal-doc-footer">
          <span>&copy; 2026 GymFlow. All rights reserved.</span>
          <span>Version 1.0 &nbsp;·&nbsp; Effective October 9, 2026</span>
        </div>
      </div>
    </div>
  );
}

