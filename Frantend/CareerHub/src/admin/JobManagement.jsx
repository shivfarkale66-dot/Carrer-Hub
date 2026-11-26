import { useEffect, useRef, useState } from "react";
import { authFetch } from "../Api.js";
import { cityOptions } from "../JobsCatalog.js";

const PATH = "/api/admin/jobs";
const PER_PAGE = 8;

const CATEGORIES = [
  "Development", "Design", "Marketing", "Human Resource",
  "Data", "Finance", "Support", "Sales"
];

const TYPES = ["Full Time", "Part Time", "Internship", "Freelance"];
const EXPS = ["Fresher", "1–3 Years", "3–5 Years", "5+ Years"];
const MODES = ["On-site", "Remote"];

const emptyForm = {
  title: "",
  companyName: "",
  city: "",
  area: "",
  category: "Development",
  type: "Full Time",
  pay: "",
  exp: "Fresher",
  workMode: "On-site",
  lpa: "",
  description: "",
};

const input =
  "w-full h-12 px-4 rounded-lg bg-white border border-[#D7E3FB] text-[#0B1B4D] placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#0F5CFF]/30 focus:border-[#0F5CFF] transition";

const filterInput =
  "h-11 px-3 rounded-lg bg-white border border-[#D7E3FB] text-sm text-[#0B1B4D] outline-none focus:ring-2 focus:ring-[#0F5CFF]/30";

const statusStyle = {
  Active: "bg-emerald-50 text-emerald-700",
  Closed: "bg-slate-100 text-slate-600",
};

const statusOf = (job) => job.active ? "Active" : "Closed";

const postedOn = (job) => {
  const date = job.createdAt || job.postedAt;
  if (!date) return "—";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

async function readError(res, fallback) {
  try {
    const data = await res.json();
    return data.message || fallback;
  } catch {
    return fallback;
  }
}

function IconBtn({ label, onClick, tone = "blue", children }) {
  const colors = {
    blue: "bg-[#E4EEFF] text-[#0F5CFF] hover:bg-[#D3E2FF]",
    amber: "bg-amber-50 text-amber-600 hover:bg-amber-100",
    red: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`w-9 h-9 grid place-items-center rounded-lg transition active:scale-95 ${colors[tone]}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-[18px] h-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  );
}

export default function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fLocation, setFLocation] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [page, setPage] = useState(1);

  const formRef = useRef(null);
  const titleRef = useRef(null);

  const loadJobs = async () => {
    try {
      const res = await authFetch(PATH);

      if (!res.ok) {
        throw new Error(await readError(res, "Failed to load jobs"));
      }

      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const goToForm = () => {
    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setTimeout(() => titleRef.current?.focus(), 350);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim() || !form.companyName.trim()) {
      setError("Job title and company name are required.");
      return;
    }

    if (form.lpa !== "" && Number(form.lpa) < 0) {
      setError("Salary cannot be negative.");
      return;
    }

    const body = {
      ...form,
      title: form.title.trim(),
      companyName: form.companyName.trim(),
      lpa: form.lpa === "" ? null : Number(form.lpa),
    };

    setSaving(true);

    try {
      const res = await authFetch(
        editingId ? `${PATH}/${editingId}` : PATH,
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        throw new Error(await readError(res, "Failed to save job"));
      }

      setSuccess(editingId ? "Job updated successfully!" : "Job added successfully!");

      resetForm();
      setLoading(true);
      await loadJobs();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (job) => {
    setEditingId(job.id);

    setForm({
      title: job.title || "",
      companyName: job.company || "",
      city: job.city || "",
      area: job.area || "",
      category: job.category || "Development",
      type: job.type || "Full Time",
      pay: job.pay || "",
      exp: job.exp || "Fresher",
      workMode: job.workMode || "On-site",
      lpa: job.lpa ?? "",
      description: job.description || "",
    });

    setError("");
    setSuccess("");
    goToForm();
  };

  const toggleActive = async (job) => {
    setError("");
    setSuccess("");

    try {
      const res = await authFetch(`${PATH}/${job.id}/active`, {
        method: "PUT",
        body: JSON.stringify({ active: !job.active }),
      });

      if (!res.ok) {
        throw new Error(await readError(res, "Could not update job"));
      }

      setSuccess(job.active ? "Job closed successfully!" : "Job reopened successfully!");
      setLoading(true);
      await loadJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (job) => {
    const confirmed = window.confirm(
      `Delete "${job.title}" at ${job.company}? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const res = await authFetch(`${PATH}/${job.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(await readError(res, "Could not delete job"));
      }

      if (editingId === job.id) resetForm();

      setSuccess("Job deleted successfully!");
      setLoading(true);
      await loadJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  const count = (status) =>
    jobs.filter((job) => statusOf(job) === status).length;

  const tabs = [
    { key: "All", label: `All Jobs (${jobs.length})` },
    { key: "Active", label: `Active (${count("Active")})` },
    { key: "Closed", label: `Closed (${count("Closed")})` },
  ];

  const locations = [
    ...new Set(jobs.map((j) => j.city).filter(Boolean)),
  ].sort();

  const keyword = search.trim().toLowerCase();

  const visible = jobs.filter((job) => {
    const status = statusOf(job);

    return (
      (tab === "All" || status === tab) &&
      (!fStatus || status === fStatus) &&
      (!fCategory || job.category === fCategory) &&
      (!fLocation || job.city === fLocation) &&
      (
        !keyword ||
        `${job.title} ${job.company} ${job.city} ${job.category} ${job.type}`
          .toLowerCase()
          .includes(keyword)
      )
    );
  });

  const totalPages = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PER_PAGE;
  const rows = visible.slice(start, start + PER_PAGE);

  const clearFilters = () => {
    setTab("All");
    setSearch("");
    setFCategory("");
    setFLocation("");
    setFStatus("");
    setPage(1);
  };

  const pageBtn =
    "w-9 h-9 rounded-lg font-semibold border transition disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="max-w-[1200px] mx-auto font-sans text-slate-800">

      <h1 className="text-3xl font-extrabold mb-6 text-[#0B1B4D]">
        Job Management
      </h1>

      {error && (
        <p className="mb-4 px-4 py-3 rounded-lg text-sm font-medium border bg-red-50 border-red-200 text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="mb-4 px-4 py-3 rounded-lg text-sm font-medium border bg-emerald-50 border-emerald-200 text-emerald-700">
          {success}
        </p>
      )}


      <section
        ref={formRef}
        className="bg-white border border-[#E1E9FA] rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(15,92,255,0.06)] scroll-mt-28"
      >
        <h2 className="text-xl font-bold mb-5 text-[#0B1B4D]">
          {editingId ? "Edit Job" : "Add New Job"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid md:grid-cols-2 gap-4"
        >
          <input
            ref={titleRef}
            className={input}
            name="title"
            placeholder="Job Title *"
            value={form.title}
            onChange={handleChange}
            required
          />

          <input
            className={input}
            name="companyName"
            placeholder="Company Name *"
            value={form.companyName}
            onChange={handleChange}
            required
          />

          <input
            className={input}
            name="city"
            list="admin-cities"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
          />

          <datalist id="admin-cities">
            {cityOptions.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>

          <input
            className={input}
            name="area"
            placeholder="Area (e.g. Vijay Nagar)"
            value={form.area}
            onChange={handleChange}
          />

          <select className={input} name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>

          <select className={input} name="type" value={form.type} onChange={handleChange}>
            {TYPES.map((c) => <option key={c}>{c}</option>)}
          </select>

          <select className={input} name="exp" value={form.exp} onChange={handleChange}>
            {EXPS.map((c) => <option key={c}>{c}</option>)}
          </select>

          <select className={input} name="workMode" value={form.workMode} onChange={handleChange}>
            {MODES.map((c) => <option key={c}>{c}</option>)}
          </select>

          <input
            className={input}
            name="pay"
            placeholder="Salary shown to users (₹6–10 LPA)"
            value={form.pay}
            onChange={handleChange}
          />

          <input
            className={input}
            name="lpa"
            type="number"
            min="0"
            step="0.1"
            placeholder="Salary in LPA"
            value={form.lpa}
            onChange={handleChange}
          />

          <textarea
            className={`${input} md:col-span-2 h-32 py-3 resize-y`}
            name="description"
            placeholder="Job Description"
            maxLength={2000}
            value={form.description}
            onChange={handleChange}
          />

          <p className="md:col-span-2 text-sm text-slate-500">
            City and area belong to the company. Changing them may affect
            other jobs associated with that company.
          </p>

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="h-12 px-8 rounded-lg bg-[#0F5CFF] text-white font-semibold hover:brightness-110 active:scale-95 disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Add Job"}
            </button>

            {(editingId || form.title || form.companyName) && (
              <button
                type="button"
                onClick={resetForm}
                className="h-12 px-6 rounded-lg bg-white border border-[#D7E3FB] text-[#0B1B4D] font-semibold hover:border-[#0F5CFF]"
              >
                {editingId ? "Cancel Edit" : "Clear Form"}
              </button>
            )}
          </div>
        </form>
      </section>


      <section className="mt-8 bg-white border border-[#E1E9FA] rounded-2xl p-5 shadow-[0_8px_30px_rgba(15,92,255,0.06)]">


        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTab(t.key);
                  setPage(1);
                }}
                className={`h-10 px-5 rounded-full text-sm font-semibold border transition ${
                  tab === t.key
                    ? "bg-[#0F5CFF] border-[#0F5CFF] text-white"
                    : "bg-white border-[#D7E3FB] text-[#0B1B4D] hover:border-[#0F5CFF]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              goToForm();
            }}
            className="h-11 px-5 rounded-lg bg-[#0F5CFF] text-white font-semibold hover:brightness-110"
          >
            + Post New Job
          </button>
        </div>


        <div className="flex flex-wrap gap-3 mt-4">
          <input
            className={`${filterInput} flex-1 min-w-[220px]`}
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <select
            className={filterInput}
            value={fCategory}
            onChange={(e) => {
              setFCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>

          <select
            className={filterInput}
            value={fLocation}
            onChange={(e) => {
              setFLocation(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Locations</option>
            {locations.map((c) => <option key={c}>{c}</option>)}
          </select>

          <select
            className={filterInput}
            value={fStatus}
            onChange={(e) => {
              setFStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
          </select>

          <button
            type="button"
            onClick={clearFilters}
            className="h-11 px-5 rounded-lg bg-white border border-[#0F5CFF] text-[#0F5CFF] text-sm font-semibold hover:bg-[#E4EEFF]"
          >
            Reset
          </button>
        </div>


        <div className="mt-4 rounded-xl border border-[#E1E9FA] overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[950px]">
            <thead className="bg-[#EAF1FF] text-[#0B1B4D]">
              <tr>
                {[
                  "Job Title",
                  "Category",
                  "Location",
                  "Salary",
                  "Status",
                  "Posted On",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} className="px-4 py-3.5 font-bold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Loading jobs...
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No jobs found.
                  </td>
                </tr>
              )}

              {!loading && rows.map((job) => {
                const status = statusOf(job);

                return (
                  <tr
                    key={job.id}
                    className="border-t border-[#E1E9FA] hover:bg-[#F5F8FF]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#F3F6FD] grid place-items-center shrink-0">
                          <span className="w-8 h-8 rounded-full bg-[#0F5CFF] grid place-items-center text-white text-sm font-bold">
                            {(job.company || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <div>
                          <p className="font-bold text-[#0B1B4D]">
                            {job.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {job.company}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-3 py-1 rounded-full bg-[#E4EEFF] text-[#2B4FA8] text-xs font-semibold">
                        {job.category || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {job.area ? `${job.area}, ${job.city}` : job.city || "—"}
                    </td>

                    <td className="px-4 py-3 font-semibold text-[#0B1B4D]">
                      {job.pay || (job.lpa != null ? `${job.lpa} LPA` : "—")}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle[status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${job.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {postedOn(job)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <IconBtn
                          label="Edit job"
                          onClick={() => handleEdit(job)}
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </IconBtn>

                        <IconBtn
                          label={job.active ? "Close job" : "Reopen job"}
                          tone="amber"
                          onClick={() => toggleActive(job)}
                        >
                          {job.active ? (
                            <>
                              <rect x="4" y="11" width="16" height="10" rx="2" />
                              <path d="M8 11V7a4 4 0 018 0v4" />
                            </>
                          ) : (
                            <>
                              <rect x="4" y="11" width="16" height="10" rx="2" />
                              <path d="M8 11V7a4 4 0 017.5-2" />
                            </>
                          )}
                        </IconBtn>

                        <IconBtn
                          label="Delete job"
                          tone="red"
                          onClick={() => handleDelete(job)}
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>


        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <p className="text-sm text-slate-600">
            {visible.length === 0
              ? "Showing 0 jobs"
              : `Showing ${start + 1}–${start + rows.length} of ${visible.length} jobs`}
          </p>

          {totalPages > 1 && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                className={`${pageBtn} bg-white border-[#D7E3FB] text-[#0B1B4D]`}
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setPage(n)}
                  className={`${pageBtn} ${
                    currentPage === n
                      ? "bg-[#0F5CFF] text-white border-[#0F5CFF]"
                      : "bg-white text-[#0B1B4D] border-[#D7E3FB]"
                  }`}
                >
                  {n}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
                className={`${pageBtn} bg-white border-[#D7E3FB] text-[#0B1B4D]`}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
