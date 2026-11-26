import { API_BASE as BACKEND } from "./Config.js";
const API_BASE = BACKEND + "/api";

const read = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const TOKEN_KEYS = ["token", "jwt", "authToken", "accessToken"];

function getToken() {
  for (const key of TOKEN_KEYS) {
    let v = localStorage.getItem(key);
    if (!v) continue;
    if (v.startsWith('"')) {
      try {
        v = JSON.parse(v);
      } catch {

      }
    }
    if (v) return v;
  }
  const u = read("loggedInUser", null);
  return u?.token || u?.jwt || null;
}

async function api(path, { method = "GET", body } = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {

  }

  if (!res.ok) {
    const err = new Error((data && data.message) || "Something went wrong. Please try again.");
    err.status = res.status;
    throw err;
  }
  return data;
}

export function getLoggedInUser() {
  const raw = read("loggedInUser", null);
  if (!raw) return null;
  return {
    ...raw,
    name: raw.fullName || raw.name || raw.username || "User",
    email: raw.gmail || raw.email || "",
  };
}

export const isLoggedIn = () => getLoggedInUser() !== null;

export async function syncFromServer() {
  const user = getLoggedInUser();
  if (!user || !getToken()) return false;

  try {
    const [apps, saved] = await Promise.all([api("/applications/me"), api("/saved-jobs")]);

    const otherApps = read("applications", []).filter((a) => a.userEmail !== user.email);
    write("applications", [
      ...otherApps,
      ...apps.map((a) => ({ ...a, userEmail: user.email })),
    ]);

    const otherSaved = read("savedJobs", []).filter((j) => j.userEmail !== user.email);
    write("savedJobs", [
      ...otherSaved,
      ...saved.map((j) => ({ ...j, userEmail: user.email })),
    ]);
    return true;
  } catch {
    return false;
  }
}

export function getApplications() {
  const user = getLoggedInUser();
  if (!user) return [];
  return read("applications", []).filter((a) => a.userEmail === user.email);
}

export function hasApplied(jobId) {
  return getApplications().some(
    (a) => String(a.jobId) === String(jobId) && a.status !== "Cancelled"
  );
}

export async function addApplication(job, extra = {}) {
  const user = getLoggedInUser();
  if (!user) return { ok: false, reason: "not-logged-in" };
  if (hasApplied(job.id)) return { ok: false, reason: "already-applied" };

  try {
    const created = await api("/applications", {
      method: "POST",
      body: { jobId: job.id, ...extra },
    });

    const all = read("applications", []);
    all.push({ ...created, userEmail: user.email });
    write("applications", all);
    return { ok: true };
  } catch (err) {
    if (err.status === 401) return { ok: false, reason: "not-logged-in" };
    if (err.status === 409) return { ok: false, reason: "already-applied" };
    return { ok: false, reason: "error", message: err.message };
  }
}

export async function removeApplication(id) {
  let gone = false;
  try {
    await api(`/applications/${id}`, { method: "DELETE" });
  } catch (err) {
    if (err.status === 404) gone = true;
    else return false;
  }
  const all = read("applications", []);
  write(
    "applications",
    gone
      ? all.filter((a) => a.id !== id)
      : all.map((a) => (a.id === id ? { ...a, status: "Cancelled" } : a))
  );
  return true;
}

export const cancelApplication = removeApplication;

export function getSavedJobs() {
  const user = getLoggedInUser();
  if (!user) return [];
  return read("savedJobs", []).filter((j) => j.userEmail === user.email);
}

export function isJobSaved(jobId) {
  return getSavedJobs().some((j) => String(j.id) === String(jobId));
}

export function toggleSavedJob(job) {
  const user = getLoggedInUser();
  if (!user) return false;

  const all = read("savedJobs", []);
  const exists = all.some(
    (j) => String(j.id) === String(job.id) && j.userEmail === user.email
  );

  if (exists) {
    write(
      "savedJobs",
      all.filter((j) => !(String(j.id) === String(job.id) && j.userEmail === user.email))
    );
    api(`/saved-jobs/${job.id}`, { method: "DELETE" }).catch(() => {});
    return false;
  }

  all.push({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location || "",
    salary: job.salary || "",
    userEmail: user.email,
  });
  write("savedJobs", all);
  api(`/saved-jobs/${job.id}`, { method: "PUT" }).catch(() => {});
  return true;
}

export function removeSavedJob(id) {
  const user = getLoggedInUser();
  if (!user) return;
  write(
    "savedJobs",
    read("savedJobs", []).filter(
      (j) => !(String(j.id) === String(id) && j.userEmail === user.email)
    )
  );
  api(`/saved-jobs/${id}`, { method: "DELETE" }).catch(() => {});
}
