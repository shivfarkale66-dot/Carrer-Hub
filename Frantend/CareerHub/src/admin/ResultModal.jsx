import { useState } from "react";
import Modal, { inputCls, labelCls } from "./Modal.jsx";
import { authJson } from "../Authfetch.js";

const options = [
  ["SELECTED", "Selected"],
  ["REJECTED", "Rejected"],
  ["ON_HOLD", "On hold"],
];

export default function ResultModal({ interview, onClose, onSaved }) {
  const [result, setResult] = useState(interview.result && interview.result !== "PENDING" ? interview.result : "");
  const [feedback, setFeedback] = useState(interview.feedback || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!result) return setError("Please choose a result.");
    setSaving(true);
    try {
      await authJson(`/api/admin/interviews/${interview.id}/result`, {
        method: "PUT",
        body: JSON.stringify({ result, feedback: feedback.trim() || null }),
      });
      onSaved("Result saved. The candidate has been notified.");
    } catch (err) {
      setError(err.message || "Could not save the result.");
      setSaving(false);
    }
  };

  return (
    <Modal title="Update interview result" onClose={onClose}>
      <p className="mb-4 text-sm text-[#D9D9D9]">
        {interview.userName || "Candidate"} - {interview.jobTitle}
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Result</label>
          <div className="grid grid-cols-3 gap-2">
            {options.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => { setResult(value); setError(""); }}
                className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                  result === value
                    ? "border-[#2F80ED] bg-[#2F80ED] text-white"
                    : "border-white/20 text-[#D9D9D9] hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Feedback (private, only you can see it)</label>
          <textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} className={inputCls} />
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-full border border-white/25 px-5 py-2 text-sm font-semibold hover:bg-white/10">
            Close
          </button>
          <button type="submit" disabled={saving} className="rounded-full bg-[#2F80ED] px-5 py-2 text-sm font-semibold hover:bg-[#5FA8FF] disabled:opacity-60">
            {saving ? "Saving..." : "Save result"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
