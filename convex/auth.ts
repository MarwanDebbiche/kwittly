import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { requireRunMutationCtx } from "@convex-dev/better-auth/utils";
import { betterAuth } from "better-auth/minimal";
import { emailOTP } from "better-auth/plugins";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";
import { sendOtpEmail } from "./lib/email";

const DAY = 60 * 60 * 24;

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: process.env.SITE_URL,
    database: authComponent.adapter(ctx),
    // Long rolling session: it only expires after 60 days without using the app.
    session: { expiresIn: 60 * DAY, updateAge: DAY },
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
