import { useEffect, useState } from "react";
import Navbar from "../Navbar.jsx";
import Footer from "../Footer.jsx";
import { authJson } from "../Authfetch.js";

const formatDate = (iso) => {
  const d = new Date(iso);
  return isNaN(d)
    ? "-"
    : d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function AdminContact() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setItems((await authJson("/api/admin/contact-messages")) || []);
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

  const remove = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await authJson(`/api/admin/contact-messages/${id}`, { method: "DELETE" });
      setItems((list) => list.filter((m) => m.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 pt-24 pb-10 px-4">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold text-slate-800">Contact messages</h1>
          <p className="mt-1 text-gray-500">Messages sent from the Contact Us page.</p>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {loading && <p className="mt-6 text-gray-500">Loading...</p>}
          {!loading && !items.length && !error && (
            <p className="mt-6 text-gray-500">No messages yet.</p>
          )}

          <div className="mt-6 space-y-4">
            {items.map((m) => (
              <article key={m.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{m.name}</p>
                    <a href={`mailto:${m.email}`} className="text-sm text-orange-600 hover:underline">
                      {m.email}
                    </a>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{formatDate(m.createdAt)}</p>
                    <p className="mt-1 inline-block rounded-full bg-orange-50 px-3 py-0.5 text-orange-700">
                      {m.subject}
                    </p>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-slate-700">{m.message}</p>
                <button
                  onClick={() => remove(m.id)}
                  className="mt-4 text-sm font-semibold text-red-600 hover:underline"
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
