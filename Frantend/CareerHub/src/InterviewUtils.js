export const JOIN_BEFORE_MIN = 10;

export function getTimes(iv) {
  const start = new Date(iv.scheduledAt);
  const end = new Date(start.getTime() + (iv.durationMinutes || 30) * 60000);
  return { start, end };
}

export function getState(iv, now) {
  if (iv.status === "CANCELLED") return "CANCELLED";
  if (iv.status === "COMPLETED") return "COMPLETED";
  const { start, end } = getTimes(iv);
  if (now > end) return "MISSED";
  if (now >= start) return "LIVE";
  if (now.getTime() >= start.getTime() - JOIN_BEFORE_MIN * 60000) return "JOIN_SOON";
  return "UPCOMING";
}

export const isUpcomingState = (s) => ["UPCOMING", "JOIN_SOON", "LIVE"].includes(s);

export function timeUntil(start, now) {
  const mins = Math.max(0, Math.round((start - now) / 60000));
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in ${hours} h ${mins % 60} min`;
  const days = Math.floor(hours / 24);
  return `in ${days} day${days > 1 ? "s" : ""}`;
}

export const fmtDate = (d) =>
  d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export const fmtTime = (d) =>
  d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
