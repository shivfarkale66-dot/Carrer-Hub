import { useState } from "react";
import Modal, { inputCls, labelCls } from "./Modal.jsx";
import { authJson } from "../Authfetch.js";

export default function CancelModal({ interview, onClose, onSaved }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    setSaving(true);

    try {
      await authJson(`/api/admin/interviews/${interview.id}/cancel`, {
        method: "PUT",
        body: JSON.stringify({ reason: reason.trim() || null }),
      });

      onSaved("Interview cancelled. The candidate has been notified.");
    } catch (err) {
      setError(err.message || "Could not cancel.");
      setSaving(false);
    }
  };

  return (
    <Modal title="Cancel interview" onClose={onClose}>
      <p className="mb-4 text-sm text-gray-600">
        Cancel the interview with{" "}
        {interview.userName || "the candidate"} for{" "}
        {interview.jobTitle}? They will get a notification.
      </p>

      <label className={labelCls}>
        Reason (private, only you can see it)
      </label>

      <textarea
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className={`${inputCls} bg-white text-gray-800 border-gray-300`}
      />

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
        >
          Keep interview
        </button>

        <button
          type="button"
          onClick={confirm}
          disabled={saving}
          className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {saving ? "Cancelling..." : "Cancel interview"}
        </button>
      </div>
    </Modal>
  );
}
