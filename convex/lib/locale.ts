// Shared by the app (server rendering) and Convex (login emails).

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** Value of a cookie from a `Cookie` header. */
export function readCookie(cookieHeader: string | null | undefined, name: string) {
  for (const part of (cookieHeader ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

/** Best supported locale from an `Accept-Language` header, by quality. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | undefined {
  const ranked = (header ?? "")
    .split(",")
    .map((entry) => {
      const [tag, ...params] = entry.trim().toLowerCase().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { lang: tag.split("-")[0], q: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((e) => e.lang && !Number.isNaN(e.q))
    .sort((a, b) => b.q - a.q);
  return ranked.map((e) => e.lang).find(isLocale);
}

/** Explicit choice (cookie) first, then the browser language, then English. */
export function resolveLocale(headers: { get(name: string): string | null } | undefined): Locale {
  const chosen = readCookie(headers?.get("cookie"), LOCALE_COOKIE);
  if (isLocale(chosen)) return chosen;
  return localeFromAcceptLanguage(headers?.get("accept-language")) ?? DEFAULT_LOCALE;
}
