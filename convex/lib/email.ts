import type { RunMutationCtx } from "@convex-dev/better-auth/utils";
import { Resend } from "@convex-dev/resend";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";

const resend = new Resend(components.resend, { testMode: false });

export async function sendOtpEmail(
  ctx: RunMutationCtx<DataModel>,
  email: string,
  otp: string,
) {
  // Without a Resend key (local dev), the code is only printed in the Convex logs.
  if (!process.env.RESEND_API_KEY) {
    console.log(`[dev] Login code for ${email}: ${otp}`);
    return;
  }
  await resend.sendEmail(ctx, {
    from: process.env.EMAIL_FROM ?? "Kwittly <onboarding@resend.dev>",
    to: email,
    subject: `${otp} est ton code de connexion Kwittly`,
    html: otpEmailHtml(otp),
    text: `Ton code de connexion Kwittly : ${otp}\n\nIl expire dans 10 minutes. Si tu n'as rien demandé, ignore cet email.`,
  });
}

function otpEmailHtml(otp: string) {
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;background:#f6f4ef;font-family:Inter,Helvetica,Arial,sans-serif;color:#1b1a17">
    <div style="max-width:440px;margin:0 auto;padding:40px 24px">
      <p style="font-size:22px;font-weight:700;margin:0 0 32px">kwitt<span style="color:#2f6b4f">ly</span></p>
      <div style="background:#fff;border:1px solid #e8e4dc;border-radius:16px;padding:28px">
        <p style="margin:0 0 16px;font-size:16px">Voici ton code de connexion :</p>
        <p style="margin:0 0 16px;font-size:34px;font-weight:700;letter-spacing:8px">${otp}</p>
        <p style="margin:0;font-size:14px;color:#75716a">Il expire dans 10 minutes. Si tu n'as rien demandé, ignore cet email.</p>
      </div>
    </div>
  </body>
</html>`;
}
