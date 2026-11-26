import { Link } from "react-router-dom";

const TONES = {
  green: "bg-emerald-600 hover:bg-emerald-500",
  blue: "bg-[#2F80ED] hover:bg-[#5FA8FF]",
};

export default function CallButton({
  interview,
  now = Date.now(),
  size = "md",
  tone = "green",
  label,
  className = "",
}) {
  if (!interview || interview.status !== "SCHEDULED") return null;

  const nowMs = now instanceof Date ? now.getTime() : Number(now) || Date.now();
  const start = new Date(interview.scheduledAt).getTime();
  const minutes = interview.durationMinutes || 30;
  const opensAt = start - 10 * 60000;
  const closesAt = start + minutes * 60000 + 30 * 60000;
  if (nowMs > closesAt) return null;

  const sizeClass = size === "sm" ? "px-4 py-1.5 text-xs" : "px-5 py-2 text-sm";
  const audioOnly = interview.mode === "AUDIO";

  if (nowMs < opensAt) {
    return (
      <button
        disabled
        className={`cursor-not-allowed rounded-full bg-white/10 ${sizeClass} font-semibold text-white/50 ${className}`}
      >
        Call opens 10 min before start
      </button>
    );
  }

  return (
    <Link
      to={`/interview/${interview.id}/call`}
      className={`inline-block rounded-full ${TONES[tone] || TONES.green} ${sizeClass} font-semibold text-white transition ${className}`}
    >
      {label || (audioOnly ? "Join audio call" : "Join video call")}
    </Link>
  );
}
