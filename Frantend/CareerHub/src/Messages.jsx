import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import { authJson } from "./Authfetch.js";

const MAX_FILE_SIZE = 1024 * 1024;

const COLORS = [
  "bg-orange-500", "bg-sky-500", "bg-purple-500", "bg-red-500", "bg-emerald-500",
  "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-rose-500", "bg-blue-500",
];

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("loggedInUser"));
  } catch {
    return null;
  }
};

const fileSize = (bytes) =>
  `${Math.max(1, Math.round((bytes || 0) / 1024))} KB`;

const stamp = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toDateString() === new Date().toDateString()
    ? time
    : `${d.toLocaleDateString([], { day: "numeric", month: "short" })}, ${time}`;
};

const toMessage = (m) => ({ ...m, stamp: stamp(m.createdAt) });

const withFlags = (chat) => {
  const request = chat.messages.find((m) => m.type === "resume-request");
  return {
    ...chat,
    resumeAsked: !!request,
    resumeSent: !!request && chat.messages.some((m) => m.from === "me" && m.hasFile && m.id > request.id),
  };
};

const toChat = (c) =>
  withFlags({
    id: c.id,
    name: c.name,
    role: c.role,
    color: COLORS[c.id % COLORS.length],
    messages: c.messages.map(toMessage),
  });

function saveToDisk(dataUrl, name) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = name || "file";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function Messages() {
  const [user] = useState(getUser);
  const [searchParams] = useSearchParams();
  const wanted = Number(searchParams.get("company")) || null;

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(wanted);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [typingId, setTypingId] = useState(null);
  const [sending, setSending] = useState(false);

  const messagesRef = useRef(null);
  const fileRef = useRef(null);
  const timers = useRef([]);

  const active = chats.find((chat) => chat.id === activeId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    authJson(`/api/chats${wanted ? `?include=${wanted}` : ""}`)
      .then((list) => {
        if (!alive) return;
        const mapped = (list || []).map(toChat);
        setChats(mapped);
        setActiveId((current) => current ?? mapped[0]?.id ?? null);
      })
      .catch((e) => alive && setError(e.message || "Could not load your messages."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [user, wanted]);

  useEffect(() => {
    if (!user) return;
    const signature = (list) => JSON.stringify(list.map((c) => [c.id, c.messages.length, c.messages.at(-1)?.id]));
    const timer = setInterval(async () => {
      if (document.hidden || typingId || sending) return;
      try {
        const list = await authJson(`/api/chats${wanted ? `?include=${wanted}` : ""}`);
        const mapped = (list || []).map(toChat);
        setChats((current) => (signature(current) === signature(mapped) ? current : mapped));
      } catch {

      }
    }, 5000);
    return () => clearInterval(timer);
  }, [user, wanted, typingId, sending]);

  useEffect(() => {
    const box = messagesRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [activeId, active?.messages.length, typingId]);

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const pushMessage = (chatId, message) => {
    setChats((current) => {
      const target = current.find((c) => c.id === chatId);
      if (!target) return current;
      if (target.messages.some((m) => m.id === message.id)) return current;
      const updated = withFlags({ ...target, messages: [...target.messages, toMessage(message)] });
      return [updated, ...current.filter((c) => c.id !== chatId)];
    });
  };

  const companyReply = (chatId, reply) => {
    if (!reply) return;
    setTypingId(chatId);
    const timer = setTimeout(() => {
      setTypingId((current) => (current === chatId ? null : current));
      pushMessage(chatId, reply);
    }, 1200);
    timers.current.push(timer);
  };

  const handleSend = async (e) => {
    e.preventDefault();

    const text = draft.trim();
    if (!text || !active || sending) return;

    setSending(true);
    try {
      const res = await authJson(`/api/chats/${activeId}/messages`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      pushMessage(activeId, res.message);
      setDraft("");
      setError("");
      companyReply(activeId, res.reply);
    } catch (err) {
      setError(err.message || "Could not send the message.");
    } finally {
      setSending(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file || !active) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("Please choose a file under 1 MB.");
      return;
    }

    const chatId = activeId;
    const reader = new FileReader();

    reader.onerror = () => {
      setError("Could not read this file.");
    };

    reader.onload = async () => {
      setSending(true);
      try {
        const res = await authJson(`/api/chats/${chatId}/files`, {
          method: "POST",
          body: JSON.stringify({ name: file.name, size: file.size, data: reader.result }),
        });
        pushMessage(chatId, res.message);
        setError("");
        companyReply(chatId, res.reply);
      } catch (err) {
        setError(err.message || "Could not send the file.");
      } finally {
        setSending(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const downloadFile = async (message) => {
    try {
      const d = await authJson(`/api/chats/messages/${message.id}/file`);
      saveToDisk(d.data, d.name || message.name);
      setError("");
    } catch (err) {
      setError(err.message || "Could not download the file.");
    }
  };

  const visibleChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <Navbar />

      <main className="flex-1 px-4 md:px-10 py-8">
        <div className="max-w-7xl mx-auto">

          <h1 className="text-3xl font-bold mb-2">
            Messages
          </h1>

          <p className="text-gray-500 mb-6">
            Connect with recruiters and companies.
          </p>

          <div className="grid lg:grid-cols-[320px_1fr] gap-5">

            <aside className="bg-white rounded-xl border border-gray-200 overflow-hidden">

              <div className="p-5 border-b">
                <h2 className="text-xl font-semibold mb-4">
                  Chats
                </h2>

                <input
                  type="text"
                  name="chat-search"
                  autoComplete="off"
                  placeholder="Search messages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-orange-500"
                />
              </div>

              <div className="max-h-[520px] overflow-y-auto">

                {loading && (
                  <p className="p-5 text-gray-500 text-sm">Loading chats...</p>
                )}

                {!loading && chats.length === 0 && (
                  <p className="p-5 text-gray-500 text-sm">
                    No conversations yet. Apply for a job, or open a{" "}
                    <Link to="/companies" className="text-orange-600 underline">company</Link>{" "}
                    and press Message.
                  </p>
                )}

                {!loading && chats.length > 0 && visibleChats.length === 0 && (
                  <p className="p-5 text-gray-500 text-sm">
                    No chats found.
                  </p>
                )}

                {visibleChats.map((chat) => {
                  const last =
                    chat.messages[chat.messages.length - 1];

                  return (
                    <button
                      key={chat.id}
                      onClick={() => {
                        setActiveId(chat.id);
                        setError("");
                      }}
                      className={`w-full flex items-center gap-3 p-4 text-left border-b hover:bg-orange-50 transition ${
                        activeId === chat.id
                          ? "bg-orange-50 border-l-4 border-l-orange-500"
                          : ""
                      }`}
                    >
                      <div
                        className={`${chat.color} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg`}
                      >
                        {chat.name[0]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <h3 className="font-semibold truncate">
                            {chat.name}
                          </h3>
                          <span className="text-xs text-gray-400">
                            {last?.stamp}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 truncate">
                          {typingId === chat.id
                            ? "Typing..."
                            : last?.type === "file"
                            ? `📎 ${last.name}`
                            : last?.text}
                        </p>
                      </div>
                    </button>
                  );
                })}

              </div>
            </aside>

            <section className="bg-white rounded-xl border border-gray-200 flex flex-col h-[600px]">

              {active ? (
                <>
                  <div className="p-5 border-b flex items-center gap-3">

                    <div
                      className={`${active.color} w-11 h-11 rounded-full flex items-center justify-center text-white font-bold`}
                    >
                      {active.name[0]}
                    </div>

                    <div>
                      <h3 className="font-semibold">
                        {active.name}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {active.role}
                      </p>
                    </div>

                  </div>

                  <div
                    ref={messagesRef}
                    className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50"
                  >

                    {active.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.from === "me"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-3 rounded-xl ${
                            message.from === "me"
                              ? "bg-orange-500 text-white rounded-br-none"
                              : "bg-white border text-gray-700 rounded-bl-none"
                          }`}
                        >
                          {message.type === "file" ? (
                            <button
                              type="button"
                              onClick={() => downloadFile(message)}
                              className="underline text-left"
                            >
                              📎 {message.name}
                              <span className="block text-xs">
                                {fileSize(message.size)} • Download
                              </span>
                            </button>
                          ) : (
                            <p>{message.text}</p>
                          )}

                          {message.type === "resume-request" && (
                            active.resumeSent ? (
                              <p className="text-xs mt-2">
                                ✓ Resume sent
                              </p>
                            ) : (
                              <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm"
                              >
                                📎 Send Resume
                              </button>
                            )
                          )}

                          <p
                            className={`text-xs mt-2 ${
                              message.from === "me"
                                ? "text-orange-100"
                                : "text-gray-400"
                            }`}
                          >
                            {message.stamp}
                          </p>
                        </div>
                      </div>
                    ))}

                    {typingId === active.id && (
                      <p className="text-sm text-gray-400">
                        Typing...
                      </p>
                    )}

                  </div>

                  {error && (
                    <p className="text-red-500 text-sm px-4 pt-2">
                      {error}
                    </p>
                  )}

                  <form
                    onSubmit={handleSend}
                    className="p-4 border-t flex gap-3 items-center"
                  >

                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                      onChange={handleFile}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="text-2xl text-gray-500 hover:text-orange-500"
                    >
                      📎
                    </button>

                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      maxLength={2000}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-orange-500"
                    />

                    <button
                      type="submit"
                      disabled={sending}
                      className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-60"
                    >
                      Send
                    </button>

                  </form>
                </>
              ) : (
                <p className="m-auto text-gray-500">
                  Select a chat to start messaging.
                </p>
              )}

            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
