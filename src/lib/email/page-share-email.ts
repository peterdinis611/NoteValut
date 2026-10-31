import "server-only";

import { sanitizeEmailHtml } from "@/lib/editor/sanitize";
import { escapeEmailHtml, emailBrand } from "./brand";
import {
  emailEyebrow,
  emailHeading,
  emailMonoChip,
  emailMutedNote,
  emailPillButton,
  emailUrlFallback,
  wrapEmailDocument,
} from "./shell";

const b = emailBrand;

/** Inline styles for TipTap/sanitized page HTML inside the email card. */
function stylePageBody(html: string): string {
  const safe = sanitizeEmailHtml(html ?? "");
  if (!safe.trim()) {
    return `<p style="margin:0;font-family:${b.sans};font-size:15px;line-height:1.7;color:${b.muted};font-style:italic;">This page has no content yet.</p>`;
  }

  return `
    <div class="nv-page-body" style="font-family:${b.sans};font-size:15px;line-height:1.7;color:${b.inkSoft};">
      ${safe
        .replaceAll(
          /<h1(\s[^>]*)?>/gi,
          `<h1$1 style="margin:0 0 12px;font-family:${b.display};font-size:22px;line-height:1.25;font-weight:650;letter-spacing:-0.02em;color:${b.ink};">`,
        )
        .replaceAll(
          /<h2(\s[^>]*)?>/gi,
          `<h2$1 style="margin:18px 0 8px;font-family:${b.display};font-size:18px;line-height:1.3;font-weight:650;letter-spacing:-0.02em;color:${b.ink};">`,
        )
        .replaceAll(
          /<h3(\s[^>]*)?>/gi,
          `<h3$1 style="margin:16px 0 6px;font-family:${b.display};font-size:16px;line-height:1.35;font-weight:600;color:${b.ink};">`,
        )
        .replaceAll(
          /<p(\s[^>]*)?>/gi,
          `<p$1 style="margin:0 0 12px;font-family:${b.sans};font-size:15px;line-height:1.7;color:${b.inkSoft};">`,
        )
        .replaceAll(
          /<ul(\s[^>]*)?>/gi,
          `<ul$1 style="margin:0 0 12px;padding-left:1.2em;font-family:${b.sans};font-size:15px;line-height:1.7;color:${b.inkSoft};">`,
        )
        .replaceAll(
          /<ol(\s[^>]*)?>/gi,
          `<ol$1 style="margin:0 0 12px;padding-left:1.2em;font-family:${b.sans};font-size:15px;line-height:1.7;color:${b.inkSoft};">`,
        )
        .replaceAll(
          /<blockquote(\s[^>]*)?>/gi,
          `<blockquote$1 style="margin:0 0 12px;padding:10px 14px;border-left:3px solid ${b.copper};background:${b.accent};border-radius:0 12px 12px 0;font-family:${b.sans};font-size:15px;line-height:1.65;color:${b.inkSoft};">`,
        )
        .replaceAll(
          /<a(\s[^>]*)?>/gi,
          `<a$1 style="color:${b.copper};text-decoration:underline;text-underline-offset:2px;">`,
        )
        .replaceAll(
          /<hr(\s[^>]*)?\/?>/gi,
          `<hr style="margin:18px 0;border:none;border-top:1px solid ${b.border};" />`,
        )
        .replaceAll(
          /<code(\s[^>]*)?>/gi,
          `<code$1 style="font-family:${b.mono};font-size:13px;background:${b.accent};padding:1px 6px;border-radius:6px;color:${b.ink};">`,
        )
        .replaceAll(
          /<pre(\s[^>]*)?>/gi,
          `<pre$1 style="margin:0 0 12px;padding:14px 16px;border-radius:14px;background:${b.paperDeep};border:1px solid ${b.border};font-family:${b.mono};font-size:12px;line-height:1.55;color:${b.ink};overflow-x:auto;">`,
        )}
    </div>
  `;
}

/** Branded HTML when emailing a vault page to someone. */
export function buildPageShareEmailHtml(input: {
  title: string;
  bodyHtml: string;
  pageUrl: string;
  fromLabel: string;
}): string {
  const title = escapeEmailHtml(input.title || "Untitled");
  const from = escapeEmailHtml(input.fromLabel);
  const url = escapeEmailHtml(input.pageUrl);
  const body = stylePageBody(input.bodyHtml);

  const bodyRows = `
    <tr>
      <td style="padding:32px 32px 10px;">
        ${emailEyebrow("Shared from NoteValut")}
        ${emailHeading(title)}
        <div style="margin-top:14px;">
          ${emailMonoChip(`From ${from}`)}
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 32px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;">
          <tr>
            <td style="padding:18px 18px 8px;background:${b.paper};border:1px solid ${b.border};border-radius:18px;">
              ${body}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:22px 32px 10px;">
        ${emailPillButton(url, "Open in NoteValut")}
      </td>
    </tr>
    <tr>
      <td style="padding:8px 32px 32px;border-top:1px solid ${b.border};">
        <div style="padding-top:18px;">
          ${emailMutedNote("Or open this link in your browser:")}
          <div style="margin-top:8px;">${emailUrlFallback(url)}</div>
        </div>
      </td>
    </tr>
  `;

  return wrapEmailDocument({
    title: `${input.title || "Untitled"} · NoteValut`,
    preheader: `${input.title || "Untitled"} — shared by ${input.fromLabel || "a NoteValut user"}`,
    bodyRows,
  });
}
