import { useNavigate } from "react-router-dom";
import {
  JOIN_BEFORE_MIN,
  fmtDate,
  fmtTime,
  getState,
  getTimes,
  isUpcomingState,
  timeUntil,
} from "./InterviewUtils.js";

const typeLabel = { VIDEO: "Video", AUDIO: "Audio" };

const typeStyle = {
  VIDEO: "bg-purple-100 text-purple-700 border-purple-200",
  AUDIO: "bg-teal-100 text-teal-700 border-teal-200",
};

const stateInfo = {
  UPCOMING: {
    label: "Scheduled",
    style: "bg-blue-100 text-blue-700 border-blue-200",
  },
  JOIN_SOON: {
    label: "Starting soon",
    style: "bg-amber-100 text-amber-700 border-amber-200",
  },
  LIVE: {
    label: "Live now",
    style: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  COMPLETED: {
    label: "Completed",
    style: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  CANCELLED: {
    label: "Cancelled",
    style: "bg-red-100 text-red-700 border-red-200",
  },
  MISSED: {
    label: "Missed",
    style: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

function Badge({ className, children }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

function CompanyLogo({ name }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-lg font-bold text-blue-700">
      {(name || "C").trim().charAt(0).toUpperCase()}
    </div>
  );
}

function EmptyBox({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
      {text}
    </div>
  );
}

export default function InterviewSection({ items, loading, error, now }) {
  const navigate = useNavigate();

  const withState = items.map((iv) => ({
    ...iv,
    state: getState(iv, now),
  }));

  const upcoming = withState
    .filter((iv) => isUpcomingState(iv.state))
    .sort(
      (a, b) =>
        new Date(a.scheduledAt) - new Date(b.scheduledAt)
    );

  const history = withState
    .filter((iv) => !isUpcomingState(iv.state))
    .sort(
      (a, b) =>
        new Date(b.scheduledAt) - new Date(a.scheduledAt)
    );

  if (loading)
    return <p className="text-gray-600">Loading interviews...</p>;

  if (error)
    return <p className="text-red-600">{error}</p>;

  return (
    <div className="bg-white text-gray-900">


      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Upcoming interviews
      </h3>

      {upcoming.length === 0 ? (
        <EmptyBox text="No upcoming interviews. When a company schedules one, it will show up here." />
      ) : (
        <ul className="space-y-3">
          {upcoming.map((iv) => {
            const { start } = getTimes(iv);
            const info = stateInfo[iv.state];
            const canJoin =
              iv.state === "JOIN_SOON" || iv.state === "LIVE";

            return (
              <li
                key={iv.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center">

                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <CompanyLogo name={iv.companyName} />

                    <div className="min-w-0">
                      <h4 className="truncate text-lg font-semibold text-gray-900">
                        {iv.jobTitle}
                      </h4>

                      <p className="text-sm text-gray-500">
                        {iv.companyName || "Company"}
                      </p>

                      <p className="mt-2 text-sm text-gray-600">
                        {fmtDate(start)}, {fmtTime(start)} -{" "}
                        {iv.durationMinutes || 30} min
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge className={typeStyle[iv.mode]}>
                          {typeLabel[iv.mode]} interview
                        </Badge>

                        <Badge className={info.style}>
                          {info.label}
                        </Badge>

                        {iv.state === "UPCOMING" && (
                          <span className="text-xs text-gray-500">
                            {timeUntil(start, now)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 md:text-right">
                    <button
                      type="button"
                      disabled={!canJoin}
                      onClick={() =>
                        navigate(`/interview/${iv.id}`)
                      }
                      className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Join Interview
                    </button>

                    {!canJoin && (
                      <p className="mt-2 text-xs text-gray-500">
                        Opens {JOIN_BEFORE_MIN} minutes before start
                      </p>
                    )}
                  </div>
                </div>

                {iv.notes && (
                  <p className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
                    {iv.notes}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}


      <h3 className="mb-4 mt-10 text-lg font-semibold text-gray-900">
        Interview history
      </h3>

      {history.length === 0 ? (
        <EmptyBox text="Your completed and cancelled interviews will appear here." />
      ) : (
        <ul className="space-y-3">
          {history.map((iv) => {
            const { start } = getTimes(iv);
            const info = stateInfo[iv.state];

            return (
              <li
                key={iv.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <CompanyLogo name={iv.companyName} />

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">
                      {iv.jobTitle}
                    </p>

                    <p className="truncate text-sm text-gray-500">
                      {iv.companyName || "Company"}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 sm:w-52">
                  {fmtDate(start)}, {fmtTime(start)}
                </p>

                <div className="flex items-center gap-2 sm:w-52 sm:justify-end">
                  <Badge className={typeStyle[iv.mode]}>
                    {typeLabel[iv.mode]}
                  </Badge>

                  <Badge className={info.style}>
                    {info.label}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
