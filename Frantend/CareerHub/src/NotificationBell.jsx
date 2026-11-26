import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "./Api.js";

export default function NotificationBell() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const res = await authFetch("/api/notifications/my");

      if (res.ok) {
      const list = await res.json();
     setItems(Array.isArray(list) ? list : []);
        }
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) return;

    load();

    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  const openItem = async (n) => {
    setOpen(false);

    if (!n.read) {
      try {
        await authFetch(`/api/notifications/${n.id}/read`, {
          method: "PUT",
        });
      } catch {

      }

      load();
    }

    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative text-xl text-gray-700 transition hover:text-blue-600"
        aria-label="Notifications"
      >
        🔔

        {unread > 0 && (
          <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 max-h-96 w-80 overflow-y-auto rounded-xl border border-gray-200 bg-white text-gray-900 shadow-xl">

          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
            </h3>

            {unread > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                {unread} New
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <p className="p-5 text-center text-sm text-gray-500">
              No notifications yet.
            </p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => openItem(n)}
                className={`block w-full border-b border-gray-100 p-4 text-left transition hover:bg-gray-50 ${
                  n.read ? "opacity-60" : "bg-blue-50/40"
                }`}
              >
                <div className="flex items-start gap-2">

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {n.title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-600">
                      {n.message}
                    </p>
                  </div>

                  {!n.read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
