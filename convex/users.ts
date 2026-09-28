import { query } from "./_generated/server";
import { authComponent } from "./auth";

/** The logged-in user's public profile, or null when logged out. */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    return user ? { id: user._id as string, email: user.email } : null;
  },
});
