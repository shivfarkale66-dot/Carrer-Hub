import { useEffect, useState } from "react";
import { authFetch } from "../Api.js";

const STATUSES = [
  "Applied",
  "In review",
  "Shortlisted",
  "Confirmed",
  "Rejected",
  "Cancelled",
];

const BADGE = {
  Applied: "bg-gray-100 text-gray-700 border-gray-300",
  "In review": "bg-slate-100 text-slate-700 border-slate-300",
  Shortlisted: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Confirmed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Rejected: "bg-red-100 text-red-800 border-red-300",
  Cancelled: "bg-gray-100 text-gray-600 border-gray-300",
};

function Detail({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-800 font-medium">
        {value || "-"}
      </p>
    </div>
  );
}

function triggerDownload(dataUrl, name) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = name || "resume";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function ApplicantProfile({ userId }) {
  const [p, setP] = useState(null);
  const [state, setState] = useState("loading");
  const [resumeError, setResumeError] = useState("");

  useEffect(() => {
    let alive = true;

    authFetch(`/api/admin/users/${userId}/profile`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);

        if (!alive) return;

        if (res.ok && data) {
          setP(data);
          setState("ok");
        } else {
          setState("error");
        }
      })
      .catch(() => alive && setState("error"));

    return () => {
      alive = false;
    };
  }, [userId]);

  const downloadResume = async () => {
    try {
      const res = await authFetch(
        `/api/admin/users/${userId}/resume`
      );

      const d = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          d.message || "Could not open the resume."
        );
      }

      triggerDownload(d.data, d.name || p?.resumeName);
      setResumeError("");
    } catch (e) {
      setResumeError(e.message);
    }
  };

  if (state === "loading") {
    return (
      <p className="mt-5 text-sm text-gray-500">
        Loading candidate profile...
      </p>
    );
  }

  if (state === "error") {
    return (
      <p className="mt-5 text-sm text-red-600">
        Could not load the candidate profile.
      </p>
    );
  }

  if (!p.saved) {
    return (
      <p className="mt-5 border-t border-gray-200 pt-4 text-sm text-gray-600">
        This candidate has not filled in a profile yet.
      </p>
    );
  }

  const skills = (p.skills || "")
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);

  const Block = ({ label, text }) =>
    text ? (
      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">
          {text}
        </p>
      </div>
    ) : null;

  return (
    <div className="mt-5 border-t border-gray-200 pt-5">
      <h4 className="mb-4 font-semibold text-gray-900">
        Candidate Profile
      </h4>

      <div className="flex items-start gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
        {p.photo ? (
          <img
            src={p.photo}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gray-200 text-gray-700 text-2xl font-bold">
            {(p.fullName || "?").charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <p className="font-semibold text-gray-900">
            {p.fullName}
          </p>

          {p.title && (
            <p className="text-sm text-gray-600">{p.title}</p>
          )}

          {p.headline && (
            <p className="text-sm text-gray-600">{p.headline}</p>
          )}

          <p className="mt-1 text-xs text-gray-500">
            {[p.location, p.phone, p.gmail]
              .filter(Boolean)
              .join(" • ")}
          </p>

          {p.linkedin && (
            <a
              href={p.linkedin}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-gray-800 underline hover:text-gray-600"
            >
              LinkedIn profile
            </a>
          )}
        </div>
      </div>

      {skills.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-800">
            Skills
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {skills.map((x) => (
              <span
                key={x}
                className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs text-gray-700"
              >
                {x}
              </span>
            ))}
          </div>
        </div>
      )}

      <Block label="About" text={p.about} />
      <Block label="Education" text={p.education} />
      <Block label="Experience" text={p.experience} />

      <div className="mt-4">
        {p.hasResume ? (
          <button
            onClick={downloadResume}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
          >
            Download Profile Resume
            {p.resumeName ? ` (${p.resumeName})` : ""}
          </button>
        ) : (
          <p className="text-sm text-gray-500">
            No resume in the profile.
          </p>
        )}

        {resumeError && (
          <p className="mt-2 text-sm text-red-600">
            {resumeError}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ApplicationManagement() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("All");
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await authFetch("/api/admin/applications");

      if (!res.ok) {
        throw new Error("Failed to load applications");
      }

      setItems(await res.json());
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (a, status) => {
    let note = "";

    if (status === "Rejected") {
      note = window.prompt("Reason (optional):") ?? "";
    }

    try {
      const res = await authFetch(
        `/api/admin/applications/${a.id}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status, note }),
        }
      );

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(
          d.message || "Could not update status"
        );
      }

      setError("");
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const downloadApplicationResume = async (a) => {
    try {
      const res = await authFetch(
        `/api/admin/applications/${a.id}/resume`
      );

      const d = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          d.message || "Could not open the resume."
        );
      }

      triggerDownload(d.data, d.name || a.resumeName);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };

  const shown =
    filter === "All"
      ? items
      : items.filter((a) => a.status === filter);

  const count = (s) =>
    items.filter((a) => a.status === s).length;

  const actionBtn =
    "px-3 py-2 rounded-lg text-sm font-medium transition";

  return (
    <div className="max-w-6xl mx-auto text-gray-800">

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Applications
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage job applications and review candidate details.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {["All", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm border transition ${
              filter === s
                ? "bg-gray-800 border-gray-800 text-white"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {s === "All"
              ? `All (${items.length})`
              : `${s} (${count(s)})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : shown.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600">
            No applications found.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {shown.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {a.fullName}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {a.email}
                  </p>

                  <p className="mt-2 text-sm text-gray-700">
                    Applied for{" "}
                    <span className="font-semibold text-gray-900">
                      {a.jobTitle}
                    </span>{" "}
                    at {a.companyName}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(a.appliedAt).toLocaleString()}
                  </p>

                  {a.note && (
                    <p className="text-xs mt-1 text-gray-600">
                      Note: {a.note}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">

                  <span
                    className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                      BADGE[a.status] || BADGE.Applied
                    }`}
                  >
                    {a.status}
                  </span>

                  {a.status === "Cancelled" ? (
                    <span className="text-xs text-gray-500">
                      Cancelled by the candidate
                    </span>
                  ) : (
                    <>
                      {a.status !== "In review" && (
                        <button
                          onClick={() => setStatus(a, "In review")}
                          className={`${actionBtn} bg-slate-600 text-white hover:bg-slate-700`}
                        >
                          In review
                        </button>
                      )}

                      {a.status !== "Shortlisted" && (
                        <button
                          onClick={() => setStatus(a, "Shortlisted")}
                          className={`${actionBtn} bg-yellow-500 text-white hover:bg-yellow-600`}
                        >
                          Shortlist
                        </button>
                      )}

                      {a.status !== "Confirmed" && (
                        <button
                          onClick={() => setStatus(a, "Confirmed")}
                          className={`${actionBtn} bg-emerald-600 text-white hover:bg-emerald-700`}
                        >
                          Confirm
                        </button>
                      )}

                      {a.status !== "Rejected" && (
                        <button
                          onClick={() => setStatus(a, "Rejected")}
                          className={`${actionBtn} bg-red-600 text-white hover:bg-red-700`}
                        >
                          Reject
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() =>
                      setOpenId(openId === a.id ? null : a.id)
                    }
                    className={`${actionBtn} border border-gray-300 bg-white text-gray-700 hover:bg-gray-100`}
                  >
                    {openId === a.id
                      ? "Hide details"
                      : "View details"}
                  </button>
                </div>
              </div>

              {openId === a.id && (
                <div className="mt-5 border-t border-gray-200 pt-5">

                  <h4 className="mb-4 font-semibold text-gray-900">
                    Application Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <Detail label="Phone" value={a.phone} />
                    <Detail label="Current city" value={a.currentCity} />
                    <Detail label="Can work in job city" value={a.workChoice} />
                    <Detail label="Experience" value={a.experience} />
                    <Detail label="Current company" value={a.currentCompany} />
                    <Detail label="Current package" value={a.currentPackage} />
                    <Detail label="Expected package" value={a.expectedPackage} />
                    <Detail label="Notice period" value={a.noticePeriod} />
                    <Detail label="Resume file name" value={a.resumeName} />
                    <Detail label="Job location" value={a.location} />
                  </div>

                  <div className="mt-4">
                    {a.hasResume ? (
                      <button
                        onClick={() =>
                          downloadApplicationResume(a)
                        }
                        className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                      >
                        Download Resume
                      </button>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No resume file was saved with this application.
                      </p>
                    )}
                  </div>

                  {a.coverLetter && (
                    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-800 mb-1">
                        Cover Letter
                      </p>

                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {a.coverLetter}
                      </p>
                    </div>
                  )}

                  <ApplicantProfile userId={a.userId} />

                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
