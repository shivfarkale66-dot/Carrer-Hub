import { API_BASE as BASE } from "./Config.js";

export async function authFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error("Session expired or no access. Please login again.");
  }
  return res;
}

export async function getMyApplications() {
  const res = await authFetch("/api/applications/me");
  if (!res.ok) return [];
  return res.json();
}

export async function withdrawApplication(id) {
  const res = await authFetch(`/api/applications/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.message || "Could not cancel the application.");
  }
}
