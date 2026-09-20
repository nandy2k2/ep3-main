const uniqueSorted = (values = []) => [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

export const browserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  } catch (error) {
    return "Asia/Kolkata";
  }
};

export const timezoneOptions = uniqueSorted([
  "Asia/Kolkata",
  "UTC",
  ...(typeof Intl !== "undefined" && Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : [])
]);

export const timezoneOffsetLabel = (timezone = "Asia/Kolkata") => {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(now).reduce((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});
    const localAsUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second || 0));
    const offsetMinutes = Math.round((localAsUtc - now.getTime()) / 60000);
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const abs = Math.abs(offsetMinutes);
    return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
  } catch (error) {
    return "UTC+00:00";
  }
};

export const classDisplayDate = (row = {}) => row.localclassdate || row.displayclassdate || row.classdate || "";
export const classDisplayTime = (row = {}) => row.localclasstime || row.displayclasstime || row.classtime || "";
export const classTimezone = (row = {}) => row.timezone || "UTC";

export const classDisplayLabel = (row = {}) => {
  const date = classDisplayDate(row);
  const time = classDisplayTime(row);
  const zone = row.timezone ? ` (${row.timezone})` : "";
  return `${date || ""} ${time || ""}${zone}`;
};

export const classCalendarSortKey = (row = {}) => `${classDisplayDate(row)} ${classDisplayTime(row)}`;
