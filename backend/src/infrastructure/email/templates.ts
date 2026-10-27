import type { EmailTemplateConfig } from '@/core/types/email-template.config.type';

// ============================================================
// Shared Helpers
// ============================================================

const FONT_FAMILY =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

// * Escape dynamic values before inserting them into HTML
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// * Convert token expiration from ENV format to readable text
// * 15m -> 15 minutes
// * 1h  -> 1 hour
// * 2h  -> 2 hours
// * 1d  -> 1 day
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
// Action Button
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
      style="margin: 32px auto;"
    >
      <tr>
        <td
          align="center"
          bgcolor="#6d5dfc"
          style="
            border-radius: 8px;
          "
        >
          <a
            href="${safeLink}"
            target="_blank"
            style="
              display: inline-block;
              padding: 14px 28px;
              font-family: ${FONT_FAMILY};
              font-size: 15px;
              font-weight: 600;
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
            "
          >
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// ============================================================
// Fallback Link
// ============================================================

function fallbackLink(link: string): string {
  const safeLink = escapeHtml(link);

  return `
    <div
      style="
        margin-top: 28px;
        padding: 16px;
        background-color: #f8f8fb;
        border: 1px solid #e8e8ef;
        border-radius: 8px;
      "
    >
      <p
        style="
          margin: 0 0 8px;
          font-family: ${FONT_FAMILY};
          font-size: 12px;
          font-weight: 600;
          color: #555566;
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
            color: #6d5dfc;
            text-decoration: none;
          "
        >
          ${safeLink}
        </a>
      </p>
    </div>
  `;
}

// ============================================================
// Information Box
// ============================================================

function infoBox(text: string): string {
  return `
    <div
      style="
        margin: 24px 0 0;
        padding: 14px 16px;
        background-color: #f8f8fb;
        border: 1px solid #e8e8ef;
        border-radius: 8px;
      "
    >
      <p
        style="
          margin: 0;
          font-family: ${FONT_FAMILY};
          font-size: 13px;
          line-height: 1.6;
          color: #666676;
        "
      >
        ${text}
      </p>
    </div>
  `;
}

// ============================================================
// Shared Email Layout
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

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <meta
    http-equiv="X-UA-Compatible"
    content="IE=edge"
  />

  <title>${escapeHtml(title)}</title>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background-color: #f5f5f7;
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
    style="
      background-color: #f5f5f7;
    "
  >
    <tr>
      <td
        align="center"
        style="
          padding: 48px 16px;
        "
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

          <!-- Brand -->
          <tr>
            <td
              align="center"
              style="
                padding-bottom: 24px;
              "
            >
              <span
                style="
                  font-family: ${FONT_FAMILY};
                  font-size: 16px;
                  font-weight: 700;
                  color: #18181b;
                  letter-spacing: -0.2px;
                "
              >
                ${safeAppName}
              </span>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td
              style="
                background-color: #ffffff;
                border: 1px solid #e7e7ec;
                border-radius: 12px;
                padding: 40px;
              "
            >

              <!-- Label -->
              <p
                style="
                  margin: 0 0 12px;
                  font-family: ${FONT_FAMILY};
                  font-size: 12px;
                  font-weight: 700;
                  color: #6d5dfc;
                  letter-spacing: 0.08em;
                  text-transform: uppercase;
                "
              >
                ${escapeHtml(label)}
              </p>

              <!-- Heading -->
              <h1
                style="
                  margin: 0 0 16px;
                  font-family: ${FONT_FAMILY};
                  font-size: 28px;
                  line-height: 1.25;
                  font-weight: 700;
                  color: #18181b;
                  letter-spacing: -0.5px;
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
                  line-height: 1.7;
                  color: #66666f;
                "
              >
                ${description}
              </p>

              ${content}

              <!-- Security Footer -->
              <div
                style="
                  margin-top: 32px;
                  padding-top: 24px;
                  border-top: 1px solid #ededf2;
                "
              >
                <p
                  style="
                    margin: 0;
                    font-family: ${FONT_FAMILY};
                    font-size: 12px;
                    line-height: 1.6;
                    color: #92929d;
                  "
                >
                  ${footerText}
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              align="center"
              style="
                padding-top: 24px;
              "
            >

              <p
                style="
                  margin: 0 0 6px;
                  font-family: ${FONT_FAMILY};
                  font-size: 11px;
                  line-height: 1.6;
                  color: #9b9ba5;
                "
              >
                © ${new Date().getFullYear()} ${safeAppName}.
                All rights reserved.
              </p>

              <p
                style="
                  margin: 0;
                  font-family: ${FONT_FAMILY};
                  font-size: 11px;
                  line-height: 1.6;
                  color: #9b9ba5;
                "
              >
                Need help?

                <a
                  href="mailto:${safeSupportEmail}"
                  style="
                    color: #6d5dfc;
                    text-decoration: none;
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
// Verification Email
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
// Reset Password Email
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
// Set Password Email
// Member / Staff
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
        padding: 14px 16px;
        background-color: #f8f8fb;
        border: 1px solid #e8e8ef;
        border-radius: 8px;
      "
    >
      <p
        style="
          margin: 0;
          font-family: ${FONT_FAMILY};
          font-size: 13px;
          line-height: 1.6;
          color: #666676;
        "
      >
        Username:

        <strong
          style="
            color: #18181b;
          "
        >
          ${safeUsername}
        </strong>
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
