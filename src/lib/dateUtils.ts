export const PKT_TIMEZONE = "Asia/Karachi";

export function formatDatePKT(
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(dateString).toLocaleDateString("en-PK", {
    timeZone: PKT_TIMEZONE,
    ...options,
  });
}

export function formatTimePKT(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-PK", {
    timeZone: PKT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateTimePKT(dateString: string): string {
  return new Date(dateString).toLocaleString("en-PK", {
    timeZone: PKT_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatBookingDatePKT(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-PK", {
    timeZone: PKT_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}