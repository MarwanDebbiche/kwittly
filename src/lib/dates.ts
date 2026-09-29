/** Calendar day of a timestamp in the browser's time zone, as YYYY-MM-DD (toISOString would give the UTC day). */
export function localDay(timestamp: number) {
  return new Intl.DateTimeFormat('en-CA').format(new Date(timestamp))
}
