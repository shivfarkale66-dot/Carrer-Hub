import { useMemo, useState } from "react";
import Modal, { inputCls, labelCls } from "./Modal.jsx";
import { authJson } from "../Authfetch.js";

const pad = (n) => String(n).padStart(2, "0");

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function ScheduleInterviewModal({
  candidates,
  onClose,
  onSaved,
}) {
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    userId: "",
    jobTitle: "",
    companyName: "",
    mode: "VIDEO",
    date: "",
    time: "",
    durationMinutes: 30,
    notes: "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return (candidates || []).filter(
      (c) =>
        !q ||
        (c.fullName || "").toLowerCase().includes(q) ||
        (c.gmail || "").toLowerCase().includes(q)
    );
  }, [candidates, search]);

  const selectedCandidate = (candidates || []).find(
    (c) => String(c.id) === form.userId
  );

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.userId) {
      return setError("Please select a candidate.");
    }

    if (!form.jobTitle.trim()) {
      return setError("Job title is required.");
    }

    if (!form.date || !form.time) {
      return setError("Please choose date and time.");
    }

    const scheduledAt = `${form.date}T${form.time}`;

    if (new Date(scheduledAt) <= new Date()) {
      return setError("Interview time must be in the future.");
    }

    setSaving(true);

    try {
      await authJson("/api/admin/interviews", {
        method: "POST",
        body: JSON.stringify({
          userId: Number(form.userId),
          jobTitle: form.jobTitle.trim(),
          companyName: form.companyName.trim() || null,
          mode: form.mode,
          scheduledAt,
          durationMinutes: Number(form.durationMinutes),
          notes: form.notes.trim() || null,
        }),
      });

      onSaved("Interview scheduled and invitation sent.");
    } catch (err) {
      setError(err.message || "Could not schedule the interview.");
      setSaving(false);
    }
  };

  return (
    <Modal title="Schedule Interview" onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">

        <div>
          <label className={labelCls}>
            Select Candidate
          </label>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className={inputCls}
          />

          {selectedCandidate && (
            <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedCandidate.fullName || "User"}
                </p>
                <p className="text-xs text-gray-600">
                  {selectedCandidate.gmail}
                </p>
              </div>

              <button
                type="button"
                onClick={() => set("userId", "")}
                className="text-xs font-semibold text-gray-600 hover:text-black"
              >
                Change
              </button>
            </div>
          )}

          <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-gray-300 bg-white">

            {filtered.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">
                No candidates found.
              </p>
            ) : (
              filtered.map((c) => {
                const isSelected = String(c.id) === form.userId;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => set("userId", String(c.id))}
                    className={`flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-left transition last:border-b-0 ${
                      isSelected
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-semibold ${
                        isSelected ? "text-white" : "text-gray-900"
                      }`}>
                        {c.fullName || "User"}
                      </p>

                      <p className={`mt-1 truncate text-xs ${
                        isSelected ? "text-gray-300" : "text-gray-500"
                      }`}>
                        {c.gmail}
                      </p>
                    </div>

                    {isSelected && (
                      <span className="ml-3 text-sm font-bold text-white">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}

          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div>
            <label className={labelCls}>
              Job Title
            </label>

            <input
              type="text"
              value={form.jobTitle}
              onChange={(e) => set("jobTitle", e.target.value)}
              placeholder="Java Developer"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>
              Company (Optional)
            </label>

            <input
              type="text"
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              placeholder="Company name"
              className={inputCls}
            />
          </div>

        </div>

        <div>
          <label className={labelCls}>
            Interview Type
          </label>

          <div className="grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={() => set("mode", "VIDEO")}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                form.mode === "VIDEO"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="mr-2">📹</span>
              Video Interview
            </button>

            <button
              type="button"
              onClick={() => set("mode", "AUDIO")}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                form.mode === "AUDIO"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="mr-2">🎧</span>
              Audio Interview
            </button>

          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div>
            <label className={labelCls}>
              Date
            </label>

            <input
              type="date"
              min={todayStr()}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>
              Time
            </label>

            <input
              type="time"
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>
              Duration
            </label>

            <select
              value={form.durationMinutes}
              onChange={(e) => set("durationMinutes", e.target.value)}
              className={inputCls}
            >
              {[15, 30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {m} Minutes
                </option>
              ))}
            </select>
          </div>

        </div>

        <div>
          <label className={labelCls}>
            Message for Candidate (Optional)
          </label>

          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Keep your resume ready."
            className={`${inputCls} resize-y`}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-200 pt-5 sm:flex-row">

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            Close
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Sending..."
              : "Schedule & Send Invitation"}
          </button>

        </div>

      </form>
    </Modal>
  );
}
