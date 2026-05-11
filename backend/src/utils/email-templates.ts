const appName = 'ft_transcendence';

export function verificationTemplate(link: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Verify your account</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;min-height:100vh;">
    <tr>
      <td align="center" style="padding:60px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
 
          <!-- Brand -->
          <tr>
            <td style="padding-bottom:48px;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:36px;height:36px;background:linear-gradient(135deg,#e8d5b0,#c9a96e);border-radius:8px;text-align:center;font-family:Georgia,serif;font-size:18px;font-weight:bold;color:#0a0a0a;line-height:36px;">${appName.charAt(0)}</td>
                <td style="padding-left:12px;vertical-align:middle;"><span style="font-family:Georgia,serif;font-size:15px;font-weight:bold;color:#e8d5b0;letter-spacing:0.08em;">${appName.toUpperCase()}</span></td>
              </tr></table>
            </td>
          </tr>
 
          <!-- Card -->
          <tr>
            <td style="background-color:#111111;border:1px solid #222222;border-radius:16px;overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="height:3px;background:linear-gradient(90deg,#c9a96e,#e8d5b0,#c9a96e);"></td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:52px 48px 40px;">
 
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                      <tr><td style="width:56px;height:56px;background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:14px;text-align:center;vertical-align:middle;font-size:26px;line-height:56px;">✉</td></tr>
                    </table>
 
                    <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:26px;font-weight:normal;color:#f0ece4;line-height:1.3;letter-spacing:-0.01em;">Confirm your email address</h1>
 
                    <p style="margin:0 0 36px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#888888;">
                      You're almost there. Click the button below to verify your email address and activate your account. This link expires in <span style="color:#c9a96e;">24 hours</span>.
                    </p>
 
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#c9a96e,#e8d5b0);border-radius:10px;padding:1px;">
                          <table cellpadding="0" cellspacing="0"><tr>
                            <td><a href="${link}" style="display:block;background:linear-gradient(135deg,#c9a96e,#dfc088);border-radius:9px;padding:15px 36px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#0a0a0a;text-decoration:none;letter-spacing:0.04em;text-transform:uppercase;">Verify My Account</a></td>
                          </tr></table>
                        </td>
                      </tr>
                    </table>
 
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr><td style="height:1px;background-color:#1e1e1e;"></td></tr>
                    </table>
 
                    <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.7;color:#555555;">
                      Button not working? Copy and paste this link into your browser:<br/>
                      <a href="${link}" style="color:#c9a96e;text-decoration:none;word-break:break-all;">${link}</a>
                    </p>
 
                  </td>
                </tr>
              </table>
            </td>
          </tr>
 
          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0;">
              <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#3a3a3a;line-height:1.7;text-align:center;">
                If you didn't create an account, you can safely ignore this email.<br/>
                © ${new Date().getFullYear()} ${appName} · <a href="#" style="color:#555555;text-decoration:none;">Privacy Policy</a> · <a href="#" style="color:#555555;text-decoration:none;">Terms</a>
              </p>
            </td>
          </tr>
 
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function resetPasswordTemplate(link: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;min-height:100vh;">
    <tr>
      <td align="center" style="padding:60px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Brand -->
          <tr>
            <td style="padding-bottom:48px;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:36px;height:36px;background:linear-gradient(135deg,#e8d5b0,#c9a96e);border-radius:8px;text-align:center;font-family:Georgia,serif;font-size:18px;font-weight:bold;color:#0a0a0a;line-height:36px;">${appName.charAt(0)}</td>
                <td style="padding-left:12px;vertical-align:middle;"><span style="font-family:Georgia,serif;font-size:15px;font-weight:bold;color:#e8d5b0;letter-spacing:0.08em;">${appName.toUpperCase()}</span></td>
              </tr></table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#111111;border:1px solid #222222;border-radius:16px;overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="height:3px;background:linear-gradient(90deg,#b85c38,#e07a5f,#b85c38);"></td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:52px 48px 40px;">

                    <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                      <tr><td style="width:56px;height:56px;background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:14px;text-align:center;vertical-align:middle;font-size:26px;line-height:56px;">🔑</td></tr>
                    </table>

                    <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:26px;font-weight:normal;color:#f0ece4;line-height:1.3;letter-spacing:-0.01em;">Reset your password</h1>

                    <p style="margin:0 0 36px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#888888;">
                      We received a request to reset your password. Click the button below to choose a new one. This link expires in <span style="color:#e07a5f;">15 minutes</span> and can only be used once.
                    </p>

                    <table cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#b85c38,#e07a5f);border-radius:10px;padding:1px;">
                          <table cellpadding="0" cellspacing="0"><tr>
                            <td><a href="${link}" style="display:block;background:linear-gradient(135deg,#c4623d,#e07a5f);border-radius:9px;padding:15px 36px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.04em;text-transform:uppercase;">Reset My Password</a></td>
                          </tr></table>
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background-color:#1a1210;border:1px solid #2e1a14;border-left:3px solid #b85c38;border-radius:0 8px 8px 0;padding:14px 16px;">
                          <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#888888;">
                            <strong style="color:#e07a5f;">Didn't request this?</strong><br/>
                            Your password has not been changed. If you're concerned, contact support immediately.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr><td style="height:1px;background-color:#1e1e1e;"></td></tr>
                    </table>

                    <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.7;color:#555555;">
                      Button not working? Copy and paste this link into your browser:<br/>
                      <a href="${link}" style="color:#e07a5f;text-decoration:none;word-break:break-all;">${link}</a>
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0;">
              <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#3a3a3a;line-height:1.7;text-align:center;">
                For security, this link expires in 15 minutes.<br/>
                © ${new Date().getFullYear()} ${appName} · <a href="#" style="color:#555555;text-decoration:none;">Privacy Policy</a> · <a href="#" style="color:#555555;text-decoration:none;">Terms</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
