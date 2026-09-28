/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as balances from "../balances.js";
import type * as expenses from "../expenses.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as lib_categories from "../lib/categories.js";
import type * as lib_email from "../lib/email.js";
import type * as lib_locale from "../lib/locale.js";
import type * as lib_money from "../lib/money.js";
import type * as lib_rateLimits from "../lib/rateLimits.js";
import type * as memberships from "../memberships.js";
import type * as migrations from "../migrations.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  balances: typeof balances;
  expenses: typeof expenses;
  groups: typeof groups;
  http: typeof http;
  "lib/categories": typeof lib_categories;
  "lib/email": typeof lib_email;
  "lib/locale": typeof lib_locale;
  "lib/money": typeof lib_money;
  "lib/rateLimits": typeof lib_rateLimits;
  memberships: typeof memberships;
  migrations: typeof migrations;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
