import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../Navbar.jsx";
import Footer from "../Footer.jsx";
import { authFetch } from "../Api.js";
import CallButton from "../CallButton.jsx";

const MIN = 60000;

function stateOf(iv, now) {
  const start = new Date(iv.scheduledAt).getTime();
  const end = start + (iv.durationMinutes || 30) * MIN;

  if (now < start - 10 * MIN)
    return ["Upcoming", "bg-gray-100 text-gray-700 border-gray-300"];

  if (now < start)
    return ["Waiting", "bg-orange-100 text-orange-800 border-orange-300"];

  if (now <= end)
    return ["In Progress", "bg-emerald-100 text-emerald-800 border-emerald-300"];

  return ["Overtime", "bg-red-100 text-red-800 border-red-300"];
}

const when = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

export default function LiveInterviews() {
  const [items, setItems] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await authFetch("/api/admin/interviews");

      if (!res.ok) throw new Error("Could not load interviews");

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

    const a = setInterval(load, 30000);
    const b = setInterval(() => setNow(Date.now()), 15000);

    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, []);

  const scheduled = items
    .filter((iv) => iv.status === "SCHEDULED")
    .sort(
      (x, y) =>
        new Date(x.scheduledAt) - new Date(y.scheduledAt)
    );

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <main className="flex-1 bg-white px-4 pb-10 pt-24">
        <div className="mx-auto max-w-5xl text-gray-800">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Live interviews
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage and join your scheduled interviews.
              </p>
            </div>

            <Link
              to="/admin"
              className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              All interviews and results
            </Link>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-gray-500">
              Loading interviews...
            </p>
          ) : scheduled.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <h3 className="font-semibold text-gray-800">
                No scheduled interviews
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                There are no scheduled interviews right now.
              </p>
            </div>
          ) : (

            <ul className="space-y-3">
              {scheduled.map((iv) => {
                const [label, cls] = stateOf(iv, now);

                return (
                  <li
                    key={iv.id}
                    className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${cls}`}
                        >
                          {label}
                        </span>

                        <span className="text-sm text-gray-500">
                          {when(iv.scheduledAt)} •{" "}
                          {iv.durationMinutes || 30} min •{" "}
                          {iv.mode === "AUDIO" ? "Audio" : "Video"}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-gray-900">
                        {iv.userName}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {iv.userGmail} • {iv.jobTitle}
                        {iv.companyName
                          ? ` at ${iv.companyName}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center">
                      <CallButton interview={iv} now={now} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
