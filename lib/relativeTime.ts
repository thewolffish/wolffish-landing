const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["week", 7 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
];

export function timeAgo(date: string, locale: string): string {
  const diff = new Date(date).getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar-SA" : "en", {
    numeric: "auto",
  });

  for (const [unit, ms] of UNITS) {
    const value = Math.round(diff / ms);
    if (Math.abs(value) >= 1) return rtf.format(value, unit);
  }

  return rtf.format(0, "second");
}
