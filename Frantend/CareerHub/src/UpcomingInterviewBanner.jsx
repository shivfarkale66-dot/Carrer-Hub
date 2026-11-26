import CallButton from "./CallButton.jsx";

const toMs = (v) => (v instanceof Date ? v.getTime() : Number(v) || Date.now());

function formatWhen(date) {
  const day = date.toLocaleDateString("en-IN", { weekday: "short" });
  const month = date.toLocaleDateString("en-IN", { month: "short" });
  const time = date
    .toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();

  return `${day}, ${date.getDate()} ${month}, ${date.getFullYear()}, ${time}`;
}

export default function UpcomingInterviewBanner({
  items = [],
  now = Date.now(),
}) {
  const nowMs = toMs(now);

  const next = items
    .filter((iv) => iv.status === "SCHEDULED")
    .filter((iv) => {
      const start = new Date(iv.scheduledAt).getTime();
      return nowMs <= start + ((iv.durationMinutes || 30) + 30) * 60000;
    })
    .sort(
      (a, b) =>
        new Date(a.scheduledAt) - new Date(b.scheduledAt)
    )[0];

  if (!next) return null;

  const start = new Date(next.scheduledAt);
  const live = nowMs >= start.getTime();
  const type = next.mode === "AUDIO" ? "Audio" : "Video";

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-xl border border-white/10 bg-[#111827] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-300">
          {live ? "Interview in progress" : "Upcoming interview"}
        </p>

        <p className="mt-1 text-xl font-bold text-white">
          {next.jobTitle}
          {next.companyName ? ` at ${next.companyName}` : ""}
        </p>

        <p className="mt-1 text-sm text-gray-400">
          {formatWhen(start)} - {type} interview
        </p>
      </div>

      <CallButton
        interview={next}
        now={nowMs}
        tone="default"
        label="Join Interview"
        className="py-3"
      />
    </div>
  );
}
