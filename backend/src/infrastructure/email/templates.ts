import type { EmailTemplateConfig } from '@/core/types/email-template.config.type';

// ============================================================
// Shared Brand Design Tokens & Helpers
// ============================================================

const FONT_FAMILY =
  "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const HEADING_FONT =
  "'Sora', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// Escape dynamic values before inserting them into HTML
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Convert token expiration from ENV format to readable text
function formatExpiresIn(value: string): string {
  const match = value.match(/^(\d+)(m|h|d)$/);

  if (!match) {
    return value;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (unit === 'm') {
    return `${amount} ${amount === 1 ? 'minute' : 'minutes'}`;
  }

  if (unit === 'h') {
    return `${amount} ${amount === 1 ? 'hour' : 'hours'}`;
  }

  if (unit === 'd') {
    return `${amount} ${amount === 1 ? 'day' : 'days'}`;
  }

  return value;
}

// ============================================================
// Action Button (Sportium Signature Dark Pill with Lime Accent)
// ============================================================

function actionButton(link: string, label: string): string {
  const safeLink = escapeHtml(link);

  return `
    <table
      role="presentation"
      cellpadding="0"
      cellspacing="0"
      border="0"
      align="center"
      style="margin: 32px auto 28px;"
    >
      <tr>
        <td
          align="center"
          bgcolor="#0f1115"
          style="
            border-radius: 9999px;
            box-shadow: 0 4px 14px rgba(15, 17, 21, 0.15);
          "
        >
          <a
            href="${safeLink}"
            target="_blank"
            style="
              display: inline-block;
              padding: 14px 34px;
              font-family: ${FONT_FAMILY};
              font-size: 14px;
              font-weight: 700;
              color: #ffffff;
              text-decoration: none;
              border-radius: 9999px;
              letter-spacing: 0.01em;
            "
          >
            ${label} &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;
}

// ============================================================
// Fallback Link Box
// ============================================================

function fallbackLink(link: string): string {
  const safeLink = escapeHtml(link);

  return `
    <div
      style="
        margin-top: 28px;
        padding: 16px 18px;
        background-color: #f9fafb;
        border: 1px solid #eaecf0;
        border-radius: 12px;
      "
    >
      <p
        style="
          margin: 0 0 6px;
          font-family: ${FONT_FAMILY};
          font-size: 12px;
          font-weight: 600;
          color: #344054;
        "
      >
        Button not working?
      </p>

      <p
        style="
          margin: 0;
          font-family: ${FONT_FAMILY};
          font-size: 12px;
          line-height: 1.6;
          word-break: break-all;
        "
      >
        <a
          href="${safeLink}"
          target="_blank"
          style="
            color: #3525cd;
            text-decoration: underline;
            font-weight: 500;
          "
        >
          ${safeLink}
        </a>
      </p>
    </div>
  `;
}

// ============================================================
// Information Callout (Sportium Lime Alert Surface)
// ============================================================

function infoBox(text: string): string {
  return `
    <div
      style="
        margin: 24px 0 0;
        padding: 14px 18px;
        background-color: #f7fee7;
        border: 1px solid #d9f99d;
        border-left: 4px solid #84cc16;
        border-radius: 12px;
      "
    >
      <p
        style="
          margin: 0;
          font-family: ${FONT_FAMILY};
          font-size: 13px;
          line-height: 1.6;
          color: #365314;
        "
      >
        ${text}
      </p>
    </div>
  `;
}

// ============================================================
// Shared Email Layout (Sportium Modern Toota Canvas)
// ============================================================

function emailLayout(options: {
  appName: string;
  supportEmail: string;

  title: string;
  preheader: string;
  label: string;
  heading: string;
  description: string;
  content: string;
  footerText: string;
}): string {
  const {
    appName,
    supportEmail,
    title,
    preheader,
    label,
    heading,
    description,
    content,
    footerText,
  } = options;

  const safeAppName = escapeHtml(appName);
  const safeSupportEmail = escapeHtml(supportEmail);

  return `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(title)}</title>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background-color: #f4f5f8;
    font-family: ${FONT_FAMILY};
    -webkit-text-size-adjust: 100%;
  "
>

  <!-- Preheader -->
  <div
    style="
      display: none;
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      color: transparent;
    "
  >
    ${escapeHtml(preheader)}
  </div>

  <table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background-color: #f4f5f8;"
  >
    <tr>
      <td
        align="center"
        style="padding: 48px 16px 56px;"
      >

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width: 560px;
            margin: 0 auto;
          "
        >

          <!-- Sportium Brand Header -->
          <tr>
            <td
              align="center"
              style="padding-bottom: 28px;"
            >
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 10px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td
                          bgcolor="#0f1115"
                          style="
                            width: 34px;
                            height: 34px;
                            border-radius: 10px;
                            text-align: center;
                            vertical-align: middle;
                          "
                        >
                          <span
                            style="
                              font-family: ${HEADING_FONT};
                              font-size: 18px;
                              font-weight: 900;
                              color: #a3e635;
                              line-height: 34px;
                              display: inline-block;
                            "
                          >
                            ST
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="vertical-align: middle;">
                    <span
                      style="
                        font-family: ${HEADING_FONT};
                        font-size: 21px;
                        font-weight: 800;
                        color: #0f1115;
                        letter-spacing: -0.5px;
                      "
                    >
                      ${safeAppName}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card Container -->
          <tr>
            <td
              style="
                background-color: #ffffff;
                border: 1px solid #eaecf0;
                border-radius: 24px;
                padding: 44px 36px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
              "
            >

              <!-- Category Badge (Sportium Lime Pill) -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td
                    bgcolor="#f7fee7"
                    style="
                      padding: 5px 14px;
                      border: 1px solid #d9f99d;
                      border-radius: 9999px;
                    "
                  >
                    <span
                      style="
                        font-family: ${FONT_FAMILY};
                        font-size: 11px;
                        font-weight: 700;
                        color: #3f6212;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                        display: inline-block;
                      "
                    >
                      ${escapeHtml(label)}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1
                style="
                  margin: 0 0 14px;
                  font-family: ${HEADING_FONT};
                  font-size: 26px;
                  line-height: 1.3;
                  font-weight: 700;
                  color: #0f1115;
                  letter-spacing: -0.4px;
                "
              >
                ${heading}
              </h1>

              <!-- Description -->
              <p
                style="
                  margin: 0;
                  font-family: ${FONT_FAMILY};
                  font-size: 15px;
                  line-height: 1.65;
                  color: #525866;
                "
              >
                ${description}
              </p>

              ${content}

              <!-- Security Footer Note -->
              <div
                style="
                  margin-top: 32px;
                  padding-top: 20px;
                  border-top: 1px solid #f2f4f7;
                "
              >
                <p
                  style="
                    margin: 0;
                    font-family: ${FONT_FAMILY};
                    font-size: 12px;
                    line-height: 1.6;
                    color: #858d9d;
                  "
                >
                  ${footerText}
                </p>
              </div>

            </td>
          </tr>

          <!-- Global Footer -->
          <tr>
            <td
              align="center"
              style="padding-top: 28px;"
            >

              <p
                style="
                  margin: 0 0 8px;
                  font-family: ${FONT_FAMILY};
                  font-size: 12px;
                  line-height: 1.6;
                  color: #858d9d;
                "
              >
                &copy; ${new Date().getFullYear()} ${safeAppName}. All rights reserved.
              </p>

              <p
                style="
                  margin: 0;
                  font-family: ${FONT_FAMILY};
                  font-size: 12px;
                  line-height: 1.6;
                  color: #858d9d;
                "
              >
                Need help?
                <a
                  href="mailto:${safeSupportEmail}"
                  style="
                    color: #0f1115;
                    font-weight: 600;
                    text-decoration: underline;
                  "
                >
                  ${safeSupportEmail}
                </a>
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

// ============================================================
// 1. Verification Email
// ============================================================

export function verificationEmailTemplate(
  link: string,
  config: EmailTemplateConfig,
): string {
  const safeAppName = escapeHtml(config.appName);
  const expiration = formatExpiresIn(config.verificationExpiresIn);

  const content = `
    ${actionButton(link, 'Verify email address')}

    ${infoBox(
      `<strong>Security notice:</strong> This verification link expires in ${expiration} and can only be used once.`,
    )}

    ${fallbackLink(link)}
  `;

  return emailLayout({
    appName: config.appName,
    supportEmail: config.supportEmail,
    title: `Verify your email | ${config.appName}`,
    preheader: 'Verify your email address to activate your account.',
    label: 'Email verification',
    heading: 'Verify your email address',
    description:
      `Thanks for creating an account with <strong>${safeAppName}</strong>. ` +
      'Please verify your email address to activate your account.',
    content,
    footerText:
      'If you did not create this account, you can safely ignore this email.',
  });
}

// ============================================================
// 2. Reset Password Email
// ============================================================

export function resetPasswordEmailTemplate(
  link: string,
  config: EmailTemplateConfig,
): string {
  const expiration = formatExpiresIn(config.resetPasswordExpiresIn);

  const content = `
    ${actionButton(link, 'Reset password')}

    ${infoBox(
      `<strong>Security notice:</strong> This password reset link expires in ${expiration} and can only be used once.`,
    )}

    ${fallbackLink(link)}
  `;

  return emailLayout({
    appName: config.appName,
    supportEmail: config.supportEmail,
    title: `Reset your password | ${config.appName}`,
    preheader: 'Use this secure link to reset your password.',
    label: 'Password reset',
    heading: 'Reset your password',
    description:
      'We received a request to reset the password for your account. ' +
      'Use the button below to choose a new password.',
    content,
    footerText:
      'If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.',
  });
}

// ============================================================
// 3. Set Password Email (Member / Staff Invitation)
// ============================================================

export function setPasswordEmailTemplate(
  link: string,
  username: string,
  config: EmailTemplateConfig,
): string {
  const safeUsername = escapeHtml(username);
  const safeAppName = escapeHtml(config.appName);
  const expiration = formatExpiresIn(config.setPasswordExpiresIn);

  const content = `
    <div
      style="
        margin-top: 24px;
        padding: 14px 18px;
        background-color: #f9fafb;
        border: 1px solid #eaecf0;
        border-radius: 12px;
      "
    >
      <p
        style="
          margin: 0 0 4px;
          font-family: ${FONT_FAMILY};
          font-size: 11px;
          font-weight: 600;
          color: #667085;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        "
      >
        Assigned Username
      </p>
      <p
        style="
          margin: 0;
          font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 14px;
          font-weight: 700;
          color: #0f1115;
        "
      >
        @${safeUsername}
      </p>
    </div>

    ${actionButton(link, 'Set your password')}

    ${infoBox(
      `<strong>Security notice:</strong> This invitation link expires in ${expiration}, can only be used once, and should not be shared with anyone.`,
    )}

    ${fallbackLink(link)}
  `;

  return emailLayout({
    appName: config.appName,
    supportEmail: config.supportEmail,
    title: `Set your password | ${config.appName}`,
    preheader: 'Your account is ready. Set your password to get started.',
    label: 'Account invitation',
    heading: `Welcome, ${safeUsername}`,
    description:
      `An account has been created for you on <strong>${safeAppName}</strong>. ` +
      'Set your password to activate your account and sign in.',
    content,
    footerText:
      'If you were not expecting this invitation, you can safely ignore this email.',
  });
}

// ============================================================
// 4. Email Change Verification
// ============================================================

export function emailChangeTemplate(
  link: string,
  config: EmailTemplateConfig,
): string {
  const expiration = formatExpiresIn(config.emailChangeExpiresIn);

  const content = `
    ${actionButton(link, 'Verify new email address')}

    ${infoBox(
      `<strong>Security notice:</strong> This email change link expires in ${expiration}, can only be used once, and should not be shared with anyone.`,
    )}

    ${fallbackLink(link)}
  `;

  return emailLayout({
    appName: config.appName,
    supportEmail: config.supportEmail,
    title: `Verify your new email | ${config.appName}`,
    preheader:
      'Verify this email address to complete your email change request.',
    label: 'Email change',
    heading: 'Verify your new email address',
    description:
      'We received a request to use this email address for your account. ' +
      'To complete the change, verify this email address using the button below.',
    content,
    footerText:
      'If you did not request this email change, you can safely ignore this email. Your current email address will remain unchanged.',
  });
}
