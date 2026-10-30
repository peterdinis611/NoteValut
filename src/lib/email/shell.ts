import "server-only";

import { emailBrand, emailFontLinks } from "./brand";

const b = emailBrand;

/** Warm paper shell matching NoteValut landing / auth surfaces. */
export function wrapEmailDocument(input: {
  title: string;
  preheader?: string;
  bodyRows: string;
}): string {
  const preheader = input.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${input.preheader}</div>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${input.title}</title>
    ${emailFontLinks}
  </head>
  <body style="margin:0;padding:0;background:${b.paper};color:${b.ink};font-family:${b.sans};-webkit-font-smoothing:antialiased;">
    ${preheader}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${b.paper};background-image:radial-gradient(ellipse 80% 55% at 50% -10%, ${b.accent}, transparent 58%);padding:40px 16px 48px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;border-collapse:separate;">
            <tr>
              <td align="center" style="padding:0 8px 22px;font-family:${b.display};font-size:22px;font-weight:650;letter-spacing:-0.03em;color:${b.ink};">
                NoteValut
              </td>
            </tr>
            <tr>
              <td style="background:${b.card};border:1px solid ${b.border};border-radius:28px;overflow:hidden;box-shadow:0 24px 60px -36px rgba(60,30,10,0.35);">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="height:5px;background:linear-gradient(90deg, ${b.copper} 0%, ${b.copperSoft} 45%, ${b.accent} 100%);font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                  ${input.bodyRows}
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:22px 12px 0;font-family:${b.mono};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${b.mutedSoft};">
                Quiet notes · Appwrite vault
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function emailEyebrow(text: string) {
  return `<p style="margin:0;font-family:${b.mono};font-size:11px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:${b.copper};">${text}</p>`;
}

export function emailHeading(text: string) {
  return `<h1 style="margin:12px 0 0;font-family:${b.display};font-size:30px;line-height:1.15;font-weight:650;letter-spacing:-0.03em;color:${b.ink};">${text}</h1>`;
}

export function emailBodyText(html: string) {
  return `<div style="margin:0;font-family:${b.sans};font-size:15px;line-height:1.7;color:${b.inkSoft};">${html}</div>`;
}

export function emailPillButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:${b.primary};color:${b.primaryFg};text-decoration:none;padding:14px 24px;border-radius:999px;font-family:${b.sans};font-size:14px;font-weight:600;letter-spacing:0.01em;box-shadow:0 12px 28px -14px rgba(40,28,16,0.55);">${label}</a>`;
}

export function emailMonoChip(text: string) {
  return `<span style="display:inline-block;padding:6px 12px;border-radius:999px;border:1px solid ${b.border};background:${b.accent};font-family:${b.mono};font-size:10px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:${b.inkSoft};">${text}</span>`;
}

export function emailMutedNote(html: string) {
  return `<p style="margin:0;font-family:${b.sans};font-size:12px;line-height:1.65;color:${b.muted};">${html}</p>`;
}

export function emailUrlFallback(url: string) {
  return `<p style="margin:0;font-family:${b.mono};font-size:11px;line-height:1.6;color:${b.mutedSoft};word-break:break-all;">${url}</p>`;
}
