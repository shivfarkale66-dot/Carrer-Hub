import { useEffect, useState } from "react";
import { authFetch } from "./Api.js";
import CallButton from "./CallButton.jsx";

export default function JoinCallBanner() {
  const [items, setItems] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    let alive = true;
    const load = async () => {
      try {
        const res = await authFetch("/api/interviews/my");
        if (res.ok && alive) setItems(await res.json());
      } catch {

      }
    };
    load();
    const fetchTimer = setInterval(load, 30000);
    const clockTimer = setInterval(() => setNow(Date.now()), 15000);
    return () => {
      alive = false;
      clearInterval(fetchTimer);
      clearInterval(clockTimer);
    };
  }, []);

  const open = items.find((iv) => {
    if (iv.status !== "SCHEDULED") return false;
    const start = new Date(iv.scheduledAt).getTime();
    const end = start + (iv.durationMinutes || 30) * 60000;
    return now >= start - 10 * 60000 && now <= end + 30 * 60000;
  });

  if (!open) return null;

  const start = new Date(open.scheduledAt).getTime();
  const when =
    now < start
      ? `starts in ${Math.max(1, Math.ceil((start - now) / 60000))} min`
      : "is live now";

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-lg font-semibold text-emerald-200">
          Your {open.mode === "AUDIO" ? "audio" : "video"} interview {when}
        </p>
        <p className="text-sm text-gray-300">
          {open.jobTitle}
          {open.companyName ? ` at ${open.companyName}` : ""}. Keep your camera and microphone ready.
        </p>
      </div>
      <CallButton interview={open} now={now} />
    </div>
  );
}
