import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "../Navbar.jsx";
import Footer from "../Footer.jsx";
import { authJson } from "../Authfetch.js";

const POLL_MS = 5000;

const COLORS = [
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

const stamp = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toDateString() === new Date().toDateString()
    ? time
    : `${d.toLocaleDateString([], { day: "numeric", month: "short" })}, ${time}`;
};

const fileSize = (bytes) => `${Math.max(1, Math.round((bytes || 0) / 1024))} KB`;

function saveToDisk(dataUrl, name) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = name || "file";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function AdminMessages() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const boxRef = useRef(null);

  const loadRows = useCallback(async () => {
    try {
      const list = await authJson("/api/admin/chats");
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.message || "Could not load the messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadThread = useCallback(async (sel) => {
    if (!sel) return;
    try {
      const t = await authJson(`/api/admin/chats/${sel.userId}/${sel.companyId}`);
      setThread((old) => {

        const same =
          old &&
          old.userId === t.userId &&
          old.companyId === t.companyId &&
          old.messages.length === t.messages.length &&
          old.messages.at(-1)?.id === t.messages.at(-1)?.id;
        return same ? old : t;
      });
    } catch (e) {
      setError(e.message || "Could not open the conversation.");
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.hidden) return;
      loadRows();
      if (selected) loadThread(selected);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [selected, loadRows, loadThread]);

  const open = (row) => {
    const sel = { userId: row.userId, companyId: row.companyId };
    setSelected(sel);
    setThread(null);
    setError("");
    loadThread(sel).then(loadRows);
  };

  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [thread?.messages.length, thread?.userId]);

  const send = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    try {
      await authJson(`/api/admin/chats/${selected.userId}/${selected.companyId}/messages`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setDraft("");
      setError("");
      await loadThread(selected);
      loadRows();
    } catch (err) {
      setError(err.message || "Could not send the message.");
    } finally {
      setSending(false);
    }
  };

  const download = async (message) => {
    try {
      const d = await authJson(`/api/admin/chats/messages/${message.id}/file`);
      saveToDisk(d.data, d.name || message.name);
    } catch (err) {
      setError(err.message || "Could not download the file.");
    }
  };

  const q = search.trim().toLowerCase();
  const visible = rows.filter(
    (r) =>
      !q ||
      (r.userName || "").toLowerCase().includes(q) ||
      (r.userGmail || "").toLowerCase().includes(q) ||
      (r.companyName || "").toLowerCase().includes(q)
  );
  const totalUnread = rows.reduce((n, r) => n + (r.unread || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <Navbar />

      <main className="flex-1 pt-24 pb-10 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              <p className="text-sm text-gray-500">
                Conversations that candidates started with the companies. New messages appear by themselves.
              </p>
            </div>
            {totalUnread > 0 && (
              <span className="rounded-full bg-orange-500 px-3 py-1 text-sm font-semibold text-white">
                {totalUnread} unread
              </span>
            )}
          </div>

          {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <div className="grid h-[70vh] min-h-[420px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[340px_1fr]">
            <aside className="flex min-h-0 flex-col border-b border-gray-200 lg:border-b-0 lg:border-r">
              <div className="border-b border-gray-200 p-3">
                <input
                  name="chat-search"
                  autoComplete="off"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search candidate or company..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400"
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {loading && <p className="p-5 text-sm text-gray-500">Loading...</p>}
                {!loading && rows.length === 0 && (
                  <p className="p-5 text-sm text-gray-500">No messages yet. When a candidate writes to a company, it shows up here.</p>
                )}
                {!loading && rows.length > 0 && visible.length === 0 && (
                  <p className="p-5 text-sm text-gray-500">No conversation found.</p>
                )}

                {visible.map((r) => {
                  const active = selected && selected.userId === r.userId && selected.companyId === r.companyId;
                  return (
                    <button
                      key={`${r.userId}-${r.companyId}`}
                      type="button"
                      onClick={() => open(r)}
                      className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 ${active ? "bg-orange-50" : ""}`}
                    >
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${COLORS[r.userId % COLORS.length]}`}>
                        {initials(r.userName)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate font-semibold text-gray-900">{r.userName}</span>
                          <span className="shrink-0 text-xs text-gray-400">{stamp(r.lastAt)}</span>
                        </span>
                        <span className="block truncate text-xs text-gray-500">to {r.companyName}</span>
                        <span className="block truncate text-sm text-gray-600">
                          {r.lastFrom === "company" ? "You: " : ""}
                          {r.lastText}
                        </span>
                      </span>
                      {r.unread > 0 && (
                        <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-bold text-white">
                          {r.unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="flex min-h-0 flex-col">
              {!selected && (
                <div className="flex flex-1 items-center justify-center p-8 text-center text-gray-500">
                  Choose a conversation on the left.
                </div>
              )}

              {selected && !thread && <p className="p-6 text-gray-500">Loading conversation...</p>}

              {selected && thread && (
                <>
                  <header className="border-b border-gray-200 px-5 py-3">
                    <p className="font-bold text-gray-900">{thread.userName}</p>
                    <p className="text-xs text-gray-500">
                      {thread.userGmail} &middot; replying as <span className="font-semibold">{thread.companyName}</span>
                    </p>
                  </header>

                  <div ref={boxRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gray-50 p-5">
                    {thread.messages.map((m) => {
                      const mine = m.from === "them";
                      return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              mine ? "rounded-br-sm bg-orange-500 text-white" : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
                            }`}
                          >
                            {m.hasFile ? (
                              <button type="button" onClick={() => download(m)} className="text-left underline">
                                {"\uD83D\uDCCE"} {m.name}
                                <span className="block text-xs opacity-80">{fileSize(m.size)} &bull; Download</span>
                              </button>
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{m.text}</p>
                            )}
                            <p className={`mt-1 text-right text-[11px] ${mine ? "text-orange-100" : "text-gray-400"}`}>
                              {stamp(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={send} className="flex gap-3 border-t border-gray-200 p-3">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      maxLength={2000}
                      placeholder="Write a reply..."
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-400"
                    />
                    <button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                    >
                      Send
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
