import { MINUTE, HOUR, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Stops spamming one inbox and brute-forcing codes by requesting new ones.
  otpPerEmail: { kind: "fixed window", rate: 3, period: 15 * MINUTE },
  // Caps total emails sent, whatever the target, to protect the Resend quota
  // and sender reputation. Not per IP: the Convex auth endpoint is publicly
  // reachable, so forwarded IP headers could be spoofed.
  otpGlobal: { kind: "token bucket", rate: 60, period: HOUR, capacity: 20 },
});
