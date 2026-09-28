import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { requireRunMutationCtx } from "@convex-dev/better-auth/utils";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { emailOTP } from "better-auth/plugins";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";
import { sendOtpEmail } from "./lib/email";
import { rateLimiter } from "./lib/rateLimits";

const DAY = 60 * 60 * 24;

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: process.env.SITE_URL,
    database: authComponent.adapter(ctx),
    // Long rolling session: it only expires after 60 days without using the app.
    session: { expiresIn: 60 * DAY, updateAge: DAY },
    hooks: {
      // Better Auth's built-in limiter keeps counters in memory, which does not
      // persist across Convex requests: enforce limits in the database instead.
      before: createAuthMiddleware(async (authCtx) => {
        if (authCtx.path !== "/email-otp/send-verification-otp") return;
        const email = String(authCtx.body?.email ?? "").trim().toLowerCase();
        const mutationCtx = requireRunMutationCtx(ctx);
        const perEmail = await rateLimiter.limit(mutationCtx, "otpPerEmail", { key: email });
        const global = perEmail.ok
          ? await rateLimiter.limit(mutationCtx, "otpGlobal")
          : perEmail;
        if (!global.ok) {
          throw APIError.from("TOO_MANY_REQUESTS", {
            code: "OTP_RATE_LIMITED",
            message: "Trop de demandes de code. Réessaie dans quelques minutes.",
          });
        }
      }),
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 10 * 60,
        allowedAttempts: 5,
        async sendVerificationOTP({ email, otp }) {
          await sendOtpEmail(requireRunMutationCtx(ctx), email, otp);
        },
      }),
      convex({ authConfig }),
    ],
  });
