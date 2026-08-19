export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export const formatDateTime = (date: string, withYear = true) =>
  new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    ...(withYear ? { year: "numeric" as const } : {}),
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatRate = (rate: number, digits = 4) =>
  rate < 0.001 ? rate.toExponential(3) : rate.toFixed(digits);
