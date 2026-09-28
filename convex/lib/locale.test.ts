import { describe, expect, test } from "vitest";
import { localeFromAcceptLanguage, readCookie, resolveLocale } from "./locale";

const headers = (values: Record<string, string>) => new Headers(values);

describe("localeFromAcceptLanguage", () => {
  test("picks the best supported language by quality", () => {
    expect(localeFromAcceptLanguage("fr-FR,fr;q=0.9,en;q=0.8")).toBe("fr");
    expect(localeFromAcceptLanguage("de-DE,de;q=0.9,en;q=0.8,fr;q=0.7")).toBe("en");
    expect(localeFromAcceptLanguage("en;q=0.5,fr;q=0.9")).toBe("fr");
  });

  test("returns undefined when nothing is supported", () => {
    expect(localeFromAcceptLanguage("de-DE,es;q=0.8")).toBeUndefined();
    expect(localeFromAcceptLanguage("")).toBeUndefined();
    expect(localeFromAcceptLanguage(null)).toBeUndefined();
  });
});

describe("readCookie", () => {
  test("reads and decodes a cookie", () => {
    expect(readCookie("a=1; tz=Europe%2FParis; locale=fr", "tz")).toBe("Europe/Paris");
    expect(readCookie("a=1", "locale")).toBeUndefined();
    expect(readCookie(undefined, "locale")).toBeUndefined();
  });
});

describe("resolveLocale", () => {
  test("an explicit choice (cookie) wins over the browser language", () => {
    expect(resolveLocale(headers({ cookie: "locale=en", "accept-language": "fr" }))).toBe("en");
  });

  test("falls back to the browser language, then English", () => {
    expect(resolveLocale(headers({ "accept-language": "fr-FR" }))).toBe("fr");
    expect(resolveLocale(headers({ cookie: "locale=xx", "accept-language": "de" }))).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
  });
});
