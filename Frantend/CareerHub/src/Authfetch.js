import { API_BASE } from "./Config.js";

export async function authFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    window.dispatchEvent(new Event("auth-change"));
    window.location.href = "/login";
  }

  return res;
}

export async function authJson(path, options = {}) {
  const res = await authFetch(path, options);

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (res.status === 401) {
    const err = new Error("Session expired. Please login again.");
    err.status = 401;
    throw err;
  }
  if (res.status === 403) throw new Error("Access denied.");
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}
