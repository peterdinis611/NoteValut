import "server-only";

import { escapeEmailHtml } from "@/lib/email/brand";
import {
  emailBodyText,
  emailEyebrow,
  emailHeading,
  emailMonoChip,
  emailMutedNote,
  emailPillButton,
  emailUrlFallback,
  wrapEmailDocument,
} from "@/lib/email/shell";
import { RECOVERY_TTL_MS } from "./recovery";

/** Branded HTML for password-reset emails (Messaging). */
export function buildRecoveryEmailHtml(input: {
  userName: string;
  resetUrl: string;
}): string {
  const name = escapeEmailHtml(input.userName.trim() || "there");
  const url = escapeEmailHtml(input.resetUrl);
  const minutes = Math.round(RECOVERY_TTL_MS / 60_000);

  const bodyRows = `
    <tr>
      <td style="padding:32px 32px 8px;">
        ${emailEyebrow("Password reset")}
        ${emailHeading("Choose a new password")}
        <div style="margin-top:16px;">
          ${emailMonoChip(`${minutes} min · one-time link`)}
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 32px 8px;">
        ${emailBodyText(`
          <p style="margin:0;">Hi ${name},</p>
          <p style="margin:14px 0 0;">
            Someone asked to reset the password for your NoteValut vault.
            Use the button below — the link expires in
            <strong style="color:#2C2620;">${minutes} minutes</strong>
            and works only once.
          </p>
        `)}
      </td>
    </tr>
    <tr>
      <td style="padding:22px 32px 10px;">
        ${emailPillButton(url, "Choose a new password")}
      </td>
    </tr>
    <tr>
      <td style="padding:8px 32px 12px;">
        ${emailMutedNote("Or paste this URL into your browser:")}
        <div style="margin-top:8px;">${emailUrlFallback(url)}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 32px 32px;border-top:1px solid #E5DDD0;">
        <div style="padding-top:18px;">
          ${emailMutedNote(
            "If you didn’t ask for a reset, you can ignore this email — your password stays the same.",
          )}
        </div>
      </td>
    </tr>
  `;

  return wrapEmailDocument({
    title: "Reset your NoteValut password",
    preheader: `Reset link expires in ${minutes} minutes · NoteValut`,
    bodyRows,
  });
}

/**
 * Paste into Appwrite Console → Auth → Templates → Reset password
 * (requires custom SMTP). Uses {{user}}, {{project}}, {{redirect}}.
 * Console recovery links expire in 1 hour; app Messaging flow uses 30 minutes.
 */
export const APPWRITE_CONSOLE_RECOVERY_TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,650;12..96,700&family=Figtree:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background:#F5EFE6;color:#2C2620;font-family:'Figtree',system-ui,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE6;background-image:radial-gradient(ellipse 80% 55% at 50% -10%, #F0E0D2, transparent 58%);padding:40px 16px 48px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;">
            <tr>
              <td align="center" style="padding:0 8px 22px;font-family:'Bricolage Grotesque',Georgia,serif;font-size:22px;font-weight:650;letter-spacing:-0.03em;color:#2C2620;">
                {{project}}
              </td>
            </tr>
            <tr>
              <td style="background:#FFFDF9;border:1px solid #E5DDD0;border-radius:28px;overflow:hidden;box-shadow:0 24px 60px -36px rgba(60,30,10,0.35);">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="height:5px;background:linear-gradient(90deg, #B8956A 0%, #D4B896 45%, #F0E0D2 100%);font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="padding:32px;">
                      <p style="margin:0;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#B8956A;">Password reset</p>
                      <h1 style="margin:12px 0 0;font-family:'Bricolage Grotesque',Georgia,serif;font-size:30px;line-height:1.15;font-weight:650;letter-spacing:-0.03em;color:#2C2620;">Choose a new password</h1>
                      <p style="margin:18px 0 0;font-family:'Figtree',system-ui,sans-serif;font-size:15px;line-height:1.7;color:#4A4036;">
                        Hi {{user}}, follow the link below to choose a new {{project}} password.
                      </p>
                      <p style="margin:24px 0 0;">
                        <a href="{{redirect}}" style="display:inline-block;background:#352E27;color:#F7F4EE;text-decoration:none;padding:14px 24px;border-radius:999px;font-family:'Figtree',system-ui,sans-serif;font-size:14px;font-weight:600;">
                          Choose a new password
                        </a>
                      </p>
                      <p style="margin:18px 0 0;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.6;color:#9A8F80;word-break:break-all;">{{redirect}}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
