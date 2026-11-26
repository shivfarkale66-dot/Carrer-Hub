import { useEffect, useMemo, useState } from "react";
import {
  FaBriefcase,
  FaCalendarCheck,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaPhoneAlt,
  FaPlus,
  FaRegCalendarAlt,
  FaRegClock,
  FaSearch,
  FaTimes,
  FaVideo,
} from "react-icons/fa";
import { authJson } from "../Authfetch.js";
import { getState, getTimes } from "../InterviewUtils.js";

import ScheduleInterviewModal from "./ScheduleInterviewModal.jsx";
import RescheduleModal from "./RescheduleModal.jsx";
import CancelModal from "./CancelModal.jsx";
import ResultModal from "./ResultModal.jsx";
import CallButton from "../CallButton.jsx";

const PAGE_SIZE = 5;

const STATE = {
  UPCOMING: { label: "Upcoming", cls: "bg-green-100 text-green-700" },
  JOIN_SOON: { label: "Starting soon", cls: "bg-amber-100 text-amber-700" },
  LIVE: { label: "In progress", cls: "bg-teal-100 text-teal-700" },
  MISSED: { label: "Awaiting result", cls: "bg-yellow-100 text-yellow-800" },
  COMPLETED: { label: "Completed", cls: "bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-50 text-red-600" },
};

const RESULT = {
  SELECTED: { label: "Selected", cls: "bg-green-100 text-green-700" },
  REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-600" },
  ON_HOLD: { label: "On hold", cls: "bg-amber-100 text-amber-700" },
};

const MODE = {
  VIDEO: { label: "Video Call", cls: "bg-blue-50 text-blue-600", icon: <FaVideo className="h-3 w-3" /> },
  AUDIO: { label: "Audio Call", cls: "bg-purple-50 text-purple-600", icon: <FaPhoneAlt className="h-3 w-3" /> },
};

const TABS = [
  ["ALL", "All Interviews"],
  ["UPCOMING", "Upcoming"],
  ["AWAITING", "Awaiting result"],
  ["COMPLETED", "Completed"],
  ["CANCELLED", "Cancelled"],
];

const isUpcoming = (s) => ["UPCOMING", "JOIN_SOON", "LIVE"].includes(s);

const tabMatches = (state, tab) => {
  if (tab === "ALL") return true;
  if (tab === "UPCOMING") return isUpcoming(state);
  if (tab === "AWAITING") return state === "MISSED";
  return state === tab;
};

const AVATAR_COLORS = [
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
];

const initials = (name) =>
  (name || "U")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const fmtDay = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtClock = (d) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const EMPTY_FILTERS = { q: "", job: "", status: "", from: "", to: "" };

const btn = "rounded-md border bg-white px-3.5 py-1.5 text-xs font-semibold transition";

function StatCard({ title, value, icon, tone }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl ${tone}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold leading-none text-gray-900">{value}</p>
        <p className="mt-1.5 text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
}

function Badge({ className, children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function ViewModal({ interview, onClose }) {
  const { start } = getTimes(interview);
  const state = STATE[interview.state] || STATE.UPCOMING;
  const result = RESULT[interview.result];
  const mode = MODE[interview.mode] || MODE.VIDEO;

  const Row = ({ label, children }) => (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-3 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{children || "-"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{interview.userName || "Candidate"}</h3>
            <p className="text-sm text-gray-500">{interview.userGmail}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <Row label="Job position">{interview.jobTitle}</Row>
        <Row label="Company">{interview.companyName}</Row>
        <Row label="Date">{fmtDay(start)}</Row>
        <Row label="Time">{fmtClock(start)}</Row>
        <Row label="Duration">{interview.durationMinutes || 30} minutes</Row>
        <Row label="Type">{mode.label}</Row>
        <Row label="Status">
          <Badge className={state.cls}>{state.label}</Badge>
        </Row>
        {result && (
          <Row label="Result">
            <Badge className={result.cls}>{result.label}</Badge>
          </Row>
        )}
        {interview.notes && <Row label="Notes">{interview.notes}</Row>}

        {interview.feedback && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Feedback</p>
            <p className="mt-2 text-sm leading-6 text-gray-700">{interview.feedback}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function InterviewManagement() {
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);
  const [now, setNow] = useState(new Date());

  const [tab, setTab] = useState("ALL");
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      const [u, i] = await Promise.all([authJson("/api/admin/users"), authJson("/api/admin/interviews")]);
      setCandidates(Array.isArray(u) ? u : []);
      setInterviews(Array.isArray(i) ? i : []);
      setError("");
    } catch (e) {
      setError(e.message || "Could not load interviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const saved = (message) => {
    setModal(null);
    setToast(message);
    load();
  };

  const all = useMemo(
    () =>
      interviews
        .map((iv) => ({ ...iv, state: getState(iv, now) }))
        .sort((a, b) => String(b.scheduledAt).localeCompare(String(a.scheduledAt))),
    [interviews, now]
  );

  const counts = useMemo(
    () => ({
      total: all.length,
      upcoming: all.filter((iv) => isUpcoming(iv.state)).length,
      completed: all.filter((iv) => iv.state === "COMPLETED").length,
      cancelled: all.filter((iv) => iv.state === "CANCELLED").length,
      awaiting: all.filter((iv) => iv.state === "MISSED").length,
    }),
    [all]
  );

  const jobOptions = useMemo(
    () => [...new Set(all.map((iv) => iv.jobTitle).filter(Boolean))].sort(),
    [all]
  );

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return all.filter((iv) => {
      const day = String(iv.scheduledAt).slice(0, 10);
      return (
        tabMatches(iv.state, tab) &&
        (!q ||
          (iv.userName || "").toLowerCase().includes(q) ||
          (iv.userGmail || "").toLowerCase().includes(q) ||
          (iv.jobTitle || "").toLowerCase().includes(q) ||
          (iv.companyName || "").toLowerCase().includes(q)) &&
        (!filters.job || iv.jobTitle === filters.job) &&
        (!filters.status || iv.state === filters.status) &&
        (!filters.from || day >= filters.from) &&
        (!filters.to || day <= filters.to)
      );
    });
  }, [all, tab, filters]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const first = (current - 1) * PAGE_SIZE;
  const visible = rows.slice(first, first + PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(current - 2, pages - 4));
    const end = Math.min(pages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, k) => start + k);
  }, [current, pages]);

  const applyFilters = () => {
    setFilters(draft);
    setPage(1);
  };

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const hasFilters = Object.values(filters).some(Boolean);
  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));
  const field =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-orange-400";

  return (
    <section className="min-h-screen w-full bg-gray-50 p-4 text-gray-800 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-xl text-white">
              <FaRegCalendarAlt />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Interview Management</h1>
              <p className="text-sm text-gray-500">Schedule, manage and track candidate interviews</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModal({ type: "schedule" })}
            className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            <FaPlus className="h-3.5 w-3.5" />
            Schedule Interview
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Interviews" value={counts.total} icon={<FaBriefcase />} tone="bg-blue-100 text-blue-600" />
          <StatCard title="Upcoming" value={counts.upcoming} icon={<FaCalendarCheck />} tone="bg-green-100 text-green-600" />
          <StatCard title="Completed" value={counts.completed} icon={<FaCheck />} tone="bg-purple-100 text-purple-600" />
          <StatCard title="Cancelled" value={counts.cancelled} icon={<FaTimes />} tone="bg-red-100 text-red-500" />
        </div>

        <div className="mt-6 flex gap-6 overflow-x-auto border-b border-gray-200">
          {TABS.filter(([key]) => key !== "AWAITING" || counts.awaiting > 0 || tab === "AWAITING").map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                setPage(1);
              }}
              className={`-mb-px whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-semibold transition ${
                tab === key
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {label}
              {key === "AWAITING" && counts.awaiting > 0 && (
                <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                  {counts.awaiting}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1.5fr_auto]">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={draft.q}
              onChange={set("q")}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="Search by candidate..."
              className={`${field} pl-11`}
            />
          </div>

          <select value={draft.job} onChange={set("job")} className={field} aria-label="Job">
            <option value="">All Jobs</option>
            {jobOptions.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>

          <select value={draft.status} onChange={set("status")} className={field} aria-label="Status">
            <option value="">All Status</option>
            {Object.entries(STATE).map(([key, s]) => (
              <option key={key} value={key}>
                {s.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2">
            <FaRegCalendarAlt className="shrink-0 text-gray-400" />
            <input
              type="date"
              value={draft.from}
              onChange={set("from")}
              aria-label="From date"
              className="min-w-0 flex-1 bg-transparent py-1 text-sm text-gray-700 outline-none"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={draft.to}
              min={draft.from || undefined}
              onChange={set("to")}
              aria-label="To date"
              className="min-w-0 flex-1 bg-transparent py-1 text-sm text-gray-700 outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyFilters}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <FaFilter className="h-3.5 w-3.5" />
              Filter
            </button>
            {(hasFilters || Object.values(draft).some(Boolean)) && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {toast && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            ✓ {toast}
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading && <p className="p-12 text-center font-medium text-gray-600">Loading interviews...</p>}

          {!loading && error && (
            <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
              <button type="button" onClick={load} className="ml-3 font-bold underline">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && rows.length === 0 && (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl text-gray-400">
                <FaRegCalendarAlt />
              </div>
              <h3 className="mt-4 font-bold text-gray-900">No interviews found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {interviews.length === 0
                  ? "Schedule your first interview to get started."
                  : "Try changing the tab or the filters."}
              </p>
            </div>
          )}

          {!loading && !error && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Job Position</th>
                    <th className="px-4 py-3">Date &amp; Time</th>
                    <th className="px-4 py-3">Interview Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {visible.map((iv, index) => {
                    const { start } = getTimes(iv);
                    const state = STATE[iv.state] || STATE.UPCOMING;
                    const mode = MODE[iv.mode] || MODE.VIDEO;
                    const result = RESULT[iv.result];
                    const canChange = ["UPCOMING", "JOIN_SOON"].includes(iv.state);
                    const canCall = ["JOIN_SOON", "LIVE", "MISSED"].includes(iv.state);

                    return (
                      <tr key={iv.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-4 text-gray-500">{first + index + 1}</td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                AVATAR_COLORS[(iv.userId || 0) % AVATAR_COLORS.length]
                              }`}
                            >
                              {initials(iv.userName)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-gray-900">{iv.userName || "Candidate"}</p>
                              <p className="truncate text-xs text-gray-500">{iv.userGmail}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-semibold text-gray-900">{iv.jobTitle || "-"}</p>
                          {iv.companyName && <p className="text-xs text-gray-500">{iv.companyName}</p>}
                        </td>

                        <td className="px-4 py-4 text-gray-700">
                          <p className="flex items-center gap-2">
                            <FaRegCalendarAlt className="text-gray-400" /> {fmtDay(start)}
                          </p>
                          <p className="mt-1 flex items-center gap-2 text-gray-500">
                            <FaRegClock className="text-gray-400" /> {fmtClock(start)}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <Badge className={mode.cls}>
                            {mode.icon}
                            {mode.label}
                          </Badge>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-col items-start gap-1.5">
                            <Badge className={state.cls}>{state.label}</Badge>
                            {result && <Badge className={result.cls}>{result.label}</Badge>}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {canCall && <CallButton interview={iv} now={now} size="sm" />}

                            <button
                              type="button"
                              onClick={() => setModal({ type: "view", interview: iv })}
                              className={`${btn} border-blue-500 text-blue-600 hover:bg-blue-50`}
                            >
                              View
                            </button>

                            {canChange && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setModal({ type: "reschedule", interview: iv })}
                                  className={`${btn} border-orange-400 text-orange-500 hover:bg-orange-50`}
                                >
                                  Reschedule
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setModal({ type: "cancel", interview: iv })}
                                  className={`${btn} border-red-500 text-red-500 hover:bg-red-50`}
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {iv.state === "MISSED" && (
                              <button
                                type="button"
                                onClick={() => setModal({ type: "result", interview: iv })}
                                className={`${btn} border-green-500 text-green-600 hover:bg-green-50`}
                              >
                                Update Result
                              </button>
                            )}

                            {iv.state === "COMPLETED" && (
                              <button
                                type="button"
                                onClick={() => setModal({ type: "result", interview: iv })}
                                className={`${btn} border-green-500 text-green-600 hover:bg-green-50`}
                              >
                                View Result
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && rows.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                Showing {first + 1} to {Math.min(first + PAGE_SIZE, rows.length)} of {rows.length} interviews
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage(current - 1)}
                  disabled={current === 1}
                  aria-label="Previous page"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <FaChevronLeft className="h-3 w-3" />
                </button>

                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`h-9 w-9 rounded-md border text-sm font-semibold ${
                      n === current
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {n}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage(current + 1)}
                  disabled={current === pages}
                  aria-label="Next page"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <FaChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal?.type === "view" && <ViewModal interview={modal.interview} onClose={() => setModal(null)} />}

      {modal?.type === "schedule" && (
        <ScheduleInterviewModal candidates={candidates} onClose={() => setModal(null)} onSaved={saved} />
      )}

      {modal?.type === "reschedule" && (
        <RescheduleModal interview={modal.interview} onClose={() => setModal(null)} onSaved={saved} />
      )}

      {modal?.type === "cancel" && (
        <CancelModal interview={modal.interview} onClose={() => setModal(null)} onSaved={saved} />
      )}

      {modal?.type === "result" && (
        <ResultModal interview={modal.interview} onClose={() => setModal(null)} onSaved={saved} />
      )}
    </section>
  );
}
