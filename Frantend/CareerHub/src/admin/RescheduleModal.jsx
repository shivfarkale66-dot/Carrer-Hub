import { useState } from "react";
import Modal, { inputCls, labelCls } from "./Modal.jsx";
import { authJson } from "../Authfetch.js";

const pad = (n) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function RescheduleModal({ interview, onClose, onSaved }) {

  const [date, setDate] = useState((interview.scheduledAt || "").slice(0, 10));
  const [time, setTime] = useState((interview.scheduledAt || "").slice(11, 16));
  const [duration, setDuration] = useState(interview.durationMinutes || 30);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!date || !time) return setError("Please choose date and time.");
    const scheduledAt = `${date}T${time}`;
    if (new Date(scheduledAt) <= new Date()) return setError("Interview time must be in the future.");

    setSaving(true);
    try {
      await authJson(`/api/admin/interviews/${interview.id}/reschedule`, {
        method: "PUT",
        body: JSON.stringify({
          scheduledAt,
          durationMinutes: Number(duration),
          note: note.trim() || null,
        }),
      });
      onSaved("Interview rescheduled. The candidate has been notified.");
    } catch (err) {
      setError(err.message || "Could not reschedule.");
      setSaving(false);
    }
  };

  return (
    <Modal title="Reschedule interview" onClose={onClose}>
      <p className="mb-4 text-sm text-[#D9D9D9]">
        {interview.userName || "Candidate"} - {interview.jobTitle}
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" min={todayStr()} value={date} onChange={(e) => { setDate(e.target.value); setError(""); }} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Time</label>
            <input type="time" value={time} onChange={(e) => { setTime(e.target.value); setError(""); }} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Duration</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls}>
              {[15, 30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Reason for the change (optional)</label>
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-full border border-white/25 px-5 py-2 text-sm font-semibold hover:bg-white/10">
            Close
          </button>
          <button type="submit" disabled={saving} className="rounded-full bg-[#2F80ED] px-5 py-2 text-sm font-semibold hover:bg-[#5FA8FF] disabled:opacity-60">
            {saving ? "Saving..." : "Reschedule"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
