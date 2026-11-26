import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {
  getLoggedInUser,
  getApplications,
  getSavedJobs,
  removeSavedJob,
} from "./Storage";
import useMyInterviews from "./UseMyInterviews.js";
import InterviewSection from "./InterviewSection.jsx";
import UpcomingInterviewBanner from "./UpcomingInterviewBanner.jsx";
import { getState, isUpcomingState } from "./InterviewUtils.js";

const STATUS_STYLES = {
  Applied: "bg-blue-100 text-blue-700 border-blue-200",
  "In review": "bg-amber-100 text-amber-700 border-amber-200",
  Shortlisted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
};

const readList = (key) => {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const formatDate = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const tabFromParams = (params) => {
  const t = params.get("tab");
  return t === "saved" || t === "interviews" ? t : "applied";
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [saved, setSaved] = useState([]);
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(tabFromParams(searchParams));
  const [filter, setFilter] = useState("All");

  const interviewData = useMyInterviews();
  const upcomingCount = interviewData.items.filter((iv) =>
    isUpcomingState(getState(iv, interviewData.now))
  ).length;

  useEffect(() => {
    setTab(tabFromParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const u = getLoggedInUser();
    if (!u) {
      navigate("/login", { replace: true });
      return;
    }
    setUser(u);
    setApplications(getApplications());
    setSaved(getSavedJobs());
  }, [navigate]);

  const withdraw = (id) => {
    const all = readList("applications").filter((a) => a.id !== id);
    localStorage.setItem("applications", JSON.stringify(all));
    setApplications(all);
  };

  const removeSaved = (id) => {
    removeSavedJob(id);
    setSaved(getSavedJobs());
  };

  const statuses = ["All", "Applied", "In review", "Shortlisted", "Rejected"];
  const visibleApps =
    filter === "All"
      ? applications
      : applications.filter((a) => a.status === filter);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {user.photo ? (
                <img
                  src={user.photo}
                  alt={user.name}
                  className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  Hi, {user.name}
                </h1>
                <p className="mt-1 text-slate-600">
                  {applications.length === 0
                    ? "You have not applied to any job yet."
                    : `You have applied to ${applications.length} job${
                        applications.length > 1 ? "s" : ""
                      }.`}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                to="/jobs"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Find jobs
              </Link>
              <Link
                to="/profile"
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
              >
                Edit profile
              </Link>
            </div>
          </div>

          <UpcomingInterviewBanner
            items={interviewData.items}
            now={interviewData.now}
          />

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Applied", value: applications.length },
              { label: "Interviews", value: upcomingCount },
              {
                label: "Shortlisted",
                value: applications.filter((a) => a.status === "Shortlisted")
                  .length,
              },
              { label: "Saved jobs", value: saved.length },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-slate-200 bg-white p-5"
              >
                <p className="text-3xl font-bold text-blue-600">
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex gap-6 border-b border-slate-200">
            {[
              ["applied", "Applied jobs", 0],
              ["interviews", "Interviews", upcomingCount],
              ["saved", "Saved jobs", 0],
            ].map(([key, label, badge]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`border-b-2 px-1 pb-3 text-sm font-semibold ${
                  tab === key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600"
                }`}
              >
                {label}
                {badge > 0 && (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === "applied" && (
            <section className="mt-6">
              <div className="mb-4 flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      filter === status
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {visibleApps.length === 0 ? (
                <EmptyState
                  text={
                    applications.length === 0
                      ? "Apply to a job and it will show up here."
                      : `No applications with status "${filter}".`
                  }
                  actionLabel="Browse jobs"
                  to="/jobs"
                />
              ) : (
                <ul className="space-y-3">
                  {visibleApps.map((application) => (
                    <li
                      key={application.id}
                      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h3 className="text-lg font-semibold">
                          {application.title}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {application.company}
                          {application.location
                            ? `, ${application.location}`
                            : ""}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Applied on {formatDate(application.appliedOn)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-md border px-3 py-1 text-xs font-medium ${
                            STATUS_STYLES[application.status] ||
                            STATUS_STYLES.Applied
                          }`}
                        >
                          {application.status || "Applied"}
                        </span>
                        <button
                          onClick={() => withdraw(application.id)}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600"
                        >
                          Withdraw
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tab === "interviews" && (
            <section className="mt-6">
              <InterviewSection {...interviewData} />
            </section>
          )}

          {tab === "saved" && (
            <section className="mt-6">
              {saved.length === 0 ? (
                <EmptyState
                  text="Save jobs you like and they will show up here."
                  actionLabel="Browse jobs"
                  to="/jobs"
                />
              ) : (
                <ul className="grid gap-4 md:grid-cols-2">
                  {saved.map((job) => (
                    <li
                      key={job.id}
                      className="rounded-lg border border-slate-200 bg-white p-5"
                    >
                      <h3 className="text-lg font-semibold">{job.title}</h3>
                      <p className="text-sm text-slate-600">
                        {job.company}
                        {job.location ? `, ${job.location}` : ""}
                      </p>
                      {job.salary && (
                        <p className="mt-1 text-sm text-blue-600">
                          {job.salary}
                        </p>
                      )}
                      <div className="mt-4 flex gap-3">
                        <Link
                          to={`/apply/${job.id}`}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Apply now
                        </Link>
                        <button
                          onClick={() => removeSaved(job.id)}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function EmptyState({ text, actionLabel, to }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
      <p className="text-slate-600">{text}</p>
      <Link
        to={to}
        className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
