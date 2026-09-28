import type { RunMutationCtx } from "@convex-dev/better-auth/utils";
import { Resend } from "@convex-dev/resend";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import type { Locale } from "./locale";

const resend = new Resend(components.resend, { testMode: false });

// Convex functions are not built with the app's Lingui setup: the few email
// strings are translated here.
const COPY: Record<Locale, { subject: (otp: string) => string; intro: string; expiry: string }> = {
  en: {
    subject: (otp) => `${otp} is your Kwittly login code`,
    intro: "Here is your login code:",
    expiry: "It expires in 10 minutes. If you didn't ask for it, you can ignore this email.",
  },
  fr: {
    subject: (otp) => `${otp} est ton code de connexion Kwittly`,
    intro: "Voici ton code de connexion :",
    expiry: "Il expire dans 10 minutes. Si tu n'as rien demandé, ignore cet email.",
  },
};

export async function sendOtpEmail(
  ctx: RunMutationCtx<DataModel>,
  email: string,
  otp: string,
  locale: Locale,
) {
  // Without a Resend key (local dev), the code is only printed in the Convex logs.
  if (!process.env.RESEND_API_KEY) {
    console.log(`[dev] Login code for ${email}: ${otp}`);
    return;
  }
  const copy = COPY[locale];
  await resend.sendEmail(ctx, {
    from: process.env.EMAIL_FROM ?? "Kwittly <onboarding@resend.dev>",
    to: email,
    subject: copy.subject(otp),
    html: otpEmailHtml(otp, copy, locale),
    text: `${copy.intro} ${otp}\n\n${copy.expiry}`,
  });
}

function otpEmailHtml(otp: string, copy: (typeof COPY)[Locale], locale: Locale) {
  return `<!doctype html>
<html lang="${locale}">
  <body style="margin:0;background:#f6f4ef;font-family:Inter,Helvetica,Arial,sans-serif;color:#1b1a17">
    <div style="max-width:440px;margin:0 auto;padding:40px 24px">
      <p style="font-size:22px;font-weight:700;margin:0 0 32px">kwitt<span style="color:#2f6b4f">ly</span></p>
      <div style="background:#fff;border:1px solid #e8e4dc;border-radius:16px;padding:28px">
        <p style="margin:0 0 16px;font-size:16px">${copy.intro}</p>
        <p style="margin:0 0 16px;font-size:34px;font-weight:700;letter-spacing:8px">${otp}</p>
        <p style="margin:0;font-size:14px;color:#75716a">${copy.expiry}</p>
      </div>
    </div>
  </body>
</html>`;
}
