// ============================================================
// Shared design tokens
// ============================================================
const FONT_SANS = `-apple-system,'SF Pro Text','Helvetica Neue',Arial,sans-serif`;
const FONT_DISPLAY = `-apple-system,'SF Pro Display','Helvetica Neue',Arial,sans-serif`;
const FONT_MONO = `'SF Mono','Fira Code','Courier New',monospace`;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type Accent = {
  topBar: string;
  eyebrow: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  button: string;
  buttonBright: string;
};

const ACCENTS: Record<'purple' | 'amber', Accent> = {
  purple: {
    topBar: `linear-gradient(90deg,transparent 0%,#7c5cfc 30%,#a78bfa 50%,#7c5cfc 70%,transparent 100%)`,
    eyebrow: '#7c5cfc',
    badgeBg: '#13111f',
    badgeBorder: '#2a2240',
    badgeText: '#7c5cfc',
    button: `linear-gradient(135deg,#7c5cfc,#5b3ff8)`,
    buttonBright: `linear-gradient(135deg,#8b6dfc,#6b4ef8)`,
  },
  amber: {
    topBar: `linear-gradient(90deg,transparent 0%,#d97316 30%,#f59e0b 50%,#d97316 70%,transparent 100%)`,
    eyebrow: '#d97316',
    badgeBg: '#110f07',
    badgeBorder: '#2a2010',
    badgeText: '#d97316',
    button: `linear-gradient(135deg,#d97316,#b45309)`,
    buttonBright: `linear-gradient(135deg,#ea8020,#c45f10)`,
  },
};

// ============================================================
// Shared chrome — logo header + footer links, used by every
// "detailed" (hero + card) template
// ============================================================
function brandHeader(): string {
  return `
    <tr>
      <td style="padding-bottom:40px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background-color:#0d0d10;border:1px solid #1e1e26;border-radius:12px;padding:8px 18px 8px 12px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:28px;height:28px;background:linear-gradient(145deg,#9b7cff,#5b3ff8);border-radius:7px;text-align:center;vertical-align:middle;line-height:28px;font-family:${FONT_SANS};font-size:13px;font-weight:700;color:#ffffff;">F</td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-family:${FONT_DISPLAY};font-size:13px;font-weight:600;color:#e0ddf7;letter-spacing:0.12em;text-transform:uppercase;">ft_transcendence</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function brandFooter(): string {
  return `
    <tr>
      <td style="padding:28px 0 0;" align="center">
        <p style="margin:0;font-family:${FONT_SANS};font-size:11px;color:#282830;line-height:1.8;text-align:center;">
          © ${new Date().getFullYear()} ft_transcendence &nbsp;·&nbsp;
          <a href="#" style="color:#313140;text-decoration:none;">Privacy Policy</a>
          &nbsp;·&nbsp;
          <a href="#" style="color:#313140;text-decoration:none;">Terms of Service</a>
        </p>
      </td>
    </tr>`;
}

function expiryBadge(accent: Accent, text: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 28px;">
      <tr>
        <td style="background-color:${accent.badgeBg};border:1px solid ${accent.badgeBorder};border-radius:8px;padding:8px 16px;">
          <span style="font-family:${FONT_SANS};font-size:12px;color:${accent.badgeText};font-weight:500;letter-spacing:0.02em;">${text}</span>
        </td>
      </tr>
    </table>`;
}

function fallbackLinkBlock(link: string, linkColor: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
      <tr>
        <td style="background-color:#0a0a0f;border:1px solid #18181f;border-radius:10px;padding:16px 20px;">
          <p style="margin:0 0 6px;font-family:${FONT_SANS};font-size:11px;color:#3a3a52;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">Button not working?</p>
          <p style="margin:0;font-family:${FONT_MONO};font-size:11px;line-height:1.6;color:#4a4a66;word-break:break-all;">
            <a href="${link}" style="color:${linkColor};text-decoration:none;">${link}</a>
          </p>
        </td>
      </tr>
    </table>`;
}

// A plain <a href> CTA button — every email action is a navigation
// to a frontend route, never a state-changing form submission.
function ctaButton(accent: Accent, href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
      <tr>
        <td style="background:${accent.button};border-radius:12px;padding:1px;">
          <a href="${href}" style="display:block;background:${accent.buttonBright};border-radius:11px;padding:16px 44px;font-family:${FONT_SANS};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.01em;white-space:nowrap;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

// ============================================================
// Shell #1 — hero + card, used by verification / reset / set-password
// ============================================================
function detailedEmailShell(opts: {
  title: string;
  accent: Accent;
  icon: string;
  eyebrow: string;
  headline: string;
  subtext: string;
  body: string; // CTA section, injected as-is
  footnote: string;
}): string {
  const { title, accent, icon, eyebrow, headline, subtext, body, footnote } =
    opts;
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="color-scheme" content="dark" />
<meta name="supported-color-schemes" content="dark" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#060608;-webkit-text-size-adjust:100%;mso-line-height-rule:exactly;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#060608;">
    <tr>
      <td align="center" style="padding:48px 16px 64px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
          ${brandHeader()}
          <tr>
            <td style="background-color:#0d0d10;border:1px solid #1e1e26;border-radius:20px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="height:2px;background:${accent.topBar};"></td></tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(180deg,#0f0f18 0%,#0d0d10 100%);padding:52px 52px 0;text-align:center;">
                    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 32px;">
                      <tr><td style="width:72px;height:72px;background:linear-gradient(145deg,#1a1a28,#141420);border:1px solid #2a2a3d;border-radius:18px;text-align:center;vertical-align:middle;line-height:72px;font-size:30px;">${icon}</td></tr>
                    </table>
                    <p style="margin:0 0 14px;font-family:${FONT_SANS};font-size:11px;font-weight:600;color:${accent.eyebrow};letter-spacing:0.18em;text-transform:uppercase;">${eyebrow}</p>
                    <h1 style="margin:0 0 20px;font-family:${FONT_DISPLAY};font-size:30px;font-weight:700;color:#f0eeff;line-height:1.2;letter-spacing:-0.03em;">${headline}</h1>
                    <p style="margin:0;font-family:${FONT_SANS};font-size:15px;line-height:1.75;color:#7a7a96;max-width:380px;margin-left:auto;margin-right:auto;">${subtext}</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:40px 52px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:1px;background:linear-gradient(90deg,transparent,#1e1e2e 20%,#1e1e2e 80%,transparent);"></td></tr></table>
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:40px 52px;">
                  ${body}
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:0 52px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:1px;background:#141418;"></td></tr></table>
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:24px 52px 36px;">
                  <p style="margin:0;font-family:${FONT_SANS};font-size:12px;line-height:1.7;color:#2e2e40;text-align:center;">${footnote}</p>
                </td></tr>
              </table>
            </td>
          </tr>
          ${brandFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================
// Shell #2 — simple status card, used by activated / already-activated
// ============================================================
// function statusEmailShell(opts: {
//   title: string;
//   topBarGradient: string;
//   icon: string;
//   headline: string;
//   text: string;
//   buttonHref: string;
//   buttonLabel: string;
// }): string {
//   const {
//     title,
//     topBarGradient,
//     icon,
//     headline,
//     text,
//     buttonHref,
//     buttonLabel,
//   } = opts;
//   return `<!DOCTYPE html>
// <html lang="en">
// <head>
// <meta charset="UTF-8" />
// <meta name="viewport" content="width=device-width, initial-scale=1.0" />
// <title>${title}</title>
// </head>
// <body style="margin:0;padding:0;background-color:#060608;font-family:${FONT_DISPLAY};">
//   <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
//     <tr>
//       <td align="center" style="padding:80px 20px;">
//         <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;background:#0d0d10;border:1px solid #1e1e26;border-radius:20px;overflow:hidden;">
//           <tr><td style="height:3px;background:${topBarGradient};"></td></tr>
//           <tr>
//             <td align="center" style="padding:50px 20px 20px;">
//               <div style="width:80px;height:80px;border-radius:18px;background:linear-gradient(145deg,#1a1a28,#141420);border:1px solid #2a2a3d;display:flex;align-items:center;justify-content:center;font-size:34px;">${icon}</div>
//             </td>
//           </tr>
//           <tr>
//             <td align="center" style="padding:10px 40px;">
//               <h1 style="margin:0;font-size:28px;color:#f0eeff;letter-spacing:-0.5px;">${headline}</h1>
//             </td>
//           </tr>
//           <tr>
//             <td align="center" style="padding:10px 50px 30px;">
//               <p style="margin:0;color:#8a8aa3;font-size:15px;line-height:1.6;">${text}</p>
//             </td>
//           </tr>
//           <tr>
//             <td align="center" style="padding-bottom:50px;">
//               <a href="${buttonHref}" style="display:inline-block;padding:14px 36px;border-radius:12px;background:linear-gradient(135deg,#7c5cfc,#5b3ff8);color:#fff;text-decoration:none;font-weight:600;font-size:15px;">${buttonLabel}</a>
//             </td>
//           </tr>
//         </table>
//         <p style="margin-top:20px;font-size:12px;color:#2e2e40;">© ${new Date().getFullYear()} ft_transcendence</p>
//       </td>
//     </tr>
//   </table>
// </body>
// </html>`;
// }

// ============================================================
// Templates
// ============================================================
export function verificationEmailTemplate(link: string): string {
  const accent = ACCENTS.purple;
  const body = `
    ${expiryBadge(accent, '⏱ &nbsp;This link expires in 24 hours')}
    ${ctaButton(accent, link, 'Activate My Account →')}
    ${fallbackLinkBlock(link, '#5a4af0')}`;
  return detailedEmailShell({
    title: 'Activate your account — ft_transcendence',
    accent,
    icon: '✦',
    eyebrow: 'Account Activation',
    headline: 'Activate your account',
    subtext:
      'One click away. Verify your email address to activate your ft_transcendence account and get started.',
    body,
    footnote: `If you did not create this account, you can safely ignore this email.`,
  });
}

export function resetPasswordEmailTemplate(link: string): string {
  const accent = ACCENTS.amber;
  const body = `
    ${expiryBadge(accent, '⏱ &nbsp;This link expires in 15 minutes · Single use only')}
    ${ctaButton(accent, link, 'Reset My Password')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr>
        <td style="background-color:#0f0c07;border:1px solid #1e1a0a;border-left:3px solid #d97316;border-radius:0 10px 10px 0;padding:16px 20px;">
          <p style="margin:0 0 4px;font-family:${FONT_SANS};font-size:12px;font-weight:600;color:#d97316;letter-spacing:0.04em;">Didn't request this?</p>
          <p style="margin:0;font-family:${FONT_SANS};font-size:12px;line-height:1.6;color:#4a4030;">If you did not request a password reset, your password will remain unchanged. If you're concerned about unauthorized access, contact support.</p>
        </td>
      </tr>
    </table>`;
  return detailedEmailShell({
    title: 'Reset your password — ft_transcendence',
    accent,
    icon: '🔐',
    eyebrow: 'Security Request',
    headline: 'Reset your password',
    subtext:
      'We received a request to reset the password for your ft_transcendence account. Click the button below to choose a new one.',
    body,
    footnote:
      'For your security, this link is valid for 15 minutes and can only be used once.',
  });
}

export function setPasswordEmailTemplate(
  link: string,
  username: string,
): string {
  const accent = ACCENTS.purple;
  const safeUsername = escapeHtml(username);

  const body = `
    ${expiryBadge(accent, `👤 &nbsp;Account: <b style="color:#f0eeff;">${safeUsername}</b>`)}
    ${ctaButton(accent, link, 'Set Password →')}
    ${fallbackLinkBlock(link, '#5a4af0')}`;

  return detailedEmailShell({
    title: 'Set your password — ft_transcendence',
    accent,
    icon: '🔑',
    eyebrow: 'Welcome to the team',
    headline: `Welcome, ${safeUsername}`,
    subtext: `An account was created for you on <b style="color:#c9bcff;">ft_transcendence</b>. Set your password to activate your account.`,
    body,
    footnote: `If you were not expecting this invitation, you can safely ignore this email.`,
  });
}

// export function accountActivatedTemplate(domain: string): string {
//   return statusEmailShell({
//     title: 'Account Activated',
//     topBarGradient: 'linear-gradient(90deg,#7c5cfc,#22c55e,#7c5cfc)',
//     icon: '🎉',
//     headline: 'Account Activated',
//     text: `Your account has been successfully verified. You can now access all features of <b style="color:#7c5cfc;">ft_transcendence</b>.`,
//     buttonHref: `${domain}/login`,
//     buttonLabel: 'Go to Login',
//   });
// }

// export function accountAlreadyActivatedTemplate(domain: string): string {
//   return statusEmailShell({
//     title: 'Account Already Activated',
//     topBarGradient: 'linear-gradient(90deg,#f59e0b,#ef4444,#f59e0b)',
//     icon: '⚠️',
//     headline: 'Account Already Activated',
//     text: `Your account is already active. You can log in and start using <b style="color:#7c5cfc;">ft_transcendence</b> without any further steps.`,
//     buttonHref: `${domain}/login`,
//     buttonLabel: 'Go to Login',
//   });
// }
