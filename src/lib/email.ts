import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  ...(process.env.SMTP_USER && process.env.SMTP_PASS
    ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
    : {}),
});

const FROM = process.env.SMTP_FROM || "noreply@fhongxxx.com";
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "FhongXXX";

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#e8e8e8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8e8e8;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;">

          <!-- White card -->
          <tr>
            <td style="background:#ffffff;padding:48px 48px 40px;text-align:center;">
              ${content}
            </td>
          </tr>

          <!-- Footer outside card -->
          <tr>
            <td style="padding:28px 16px 8px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#6b7280;line-height:1.7;">
                If you have any questions, reply to this email or contact us at<br/>
                <a href="mailto:${FROM}" style="color:#e11d48;text-decoration:none;">${FROM}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 16px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
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

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${BASE_URL}/api/auth/verify-email?token=${token}`;

  const content = `
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr>
        <td align="center" valign="middle" style="background:#e11d48;width:90px;height:90px;border-radius:45px;padding:0;">
          <svg fill="white" width="48" height="48" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
            <path d="M1920 428.266v1189.54l-464.16-580.146-88.203 70.585 468.679 585.904H83.684l468.679-585.904-88.202-70.585L0 1617.805V428.265l959.944 832.441L1920 428.266ZM1919.932 226v52.627l-959.943 832.44L.045 278.628V226h1919.887Z" fill-rule="evenodd"/>
          </svg>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;">Confirm Your Email</h1>
    <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.8;max-width:380px;margin-left:auto;margin-right:auto;">
      Verifying your email gives you full access to your account. Click the button below to confirm your email address.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <a href="${url}"
             style="display:block;padding:16px 0;font-size:16px;font-weight:700;color:#fff;text-decoration:none;border-radius:6px;background:#e11d48;letter-spacing:0.3px;max-width:360px;margin:0 auto;">
            Confirm Email
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px;font-size:13px;color:#9ca3af;background:#fafafa;border:1px solid #f0f0f0;border-radius:6px;padding:12px 16px;">
      &#x26A0;&#xFE0F; &nbsp;This link expires in <strong style="color:#374151;">15 minutes</strong>. If you didn't sign up, safely ignore this email.
    </p>

    <p style="margin:0;font-size:12px;color:#9ca3af;">
      Can't click the button? Copy this link:<br/>
      <a href="${url}" style="color:#e11d48;text-decoration:none;word-break:break-all;font-size:11px;">${url}</a>
    </p>
  `;

  await transporter.sendMail({
    from: `${APP_NAME} <${FROM}>`,
    to: email,
    subject: `Verify your ${APP_NAME} account`,
    html: baseTemplate(content),
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${BASE_URL}/reset-password?token=${token}`;

  const content = `
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr>
        <td align="center" valign="middle" style="background:#e11d48;width:90px;height:90px;border-radius:45px;padding:0;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
            <path d="M15.75 2C15.75 1.58579 15.4142 1.25 15 1.25C14.5858 1.25 14.25 1.58579 14.25 2V22C14.25 22.4142 14.5858 22.75 15 22.75C15.4142 22.75 15.75 22.4142 15.75 22V19.9944C18.3859 19.9668 19.8541 19.8028 20.8284 18.8284C22 17.6569 22 15.7712 22 12C22 8.22876 22 6.34315 20.8284 5.17157C19.8541 4.19724 18.3859 4.03321 15.75 4.00559V2Z" fill="white"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3.17157 18.8284C4.34315 20 6.22876 20 10 20H13V12V4H10C6.22876 4 4.34315 4 3.17157 5.17157C2 6.34315 2 8.22876 2 12C2 15.7712 2 17.6569 3.17157 18.8284ZM13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13C12.5523 13 13 12.5523 13 12ZM9 12C9 12.5523 8.55228 13 8 13C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11C8.55228 11 9 11.4477 9 12Z" fill="white"/>
          </svg>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;">Reset Your Password</h1>
    <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.8;max-width:380px;margin-left:auto;margin-right:auto;">
      We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong style="color:#374151;">30 minutes</strong>.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <a href="${url}"
             style="display:block;padding:16px 0;font-size:16px;font-weight:700;color:#fff;text-decoration:none;border-radius:6px;background:#e11d48;letter-spacing:0.3px;max-width:360px;margin:0 auto;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px;font-size:13px;color:#9ca3af;background:#fafafa;border:1px solid #f0f0f0;border-radius:6px;padding:12px 16px;">
      &#x26A0;&#xFE0F; &nbsp;Didn't request this? Your password won't change — safely ignore this email.
    </p>

    <p style="margin:0;font-size:12px;color:#9ca3af;">
      Can't click the button? Copy this link:<br/>
      <a href="${url}" style="color:#e11d48;text-decoration:none;word-break:break-all;font-size:11px;">${url}</a>
    </p>
  `;

  await transporter.sendMail({
    from: `${APP_NAME} <${FROM}>`,
    to: email,
    subject: `Reset your ${APP_NAME} password`,
    html: baseTemplate(content),
  });
}
