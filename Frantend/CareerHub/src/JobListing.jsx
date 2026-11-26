import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import { cityOptions } from "./JobsCatalog.js";
import useJobs from "./UseJobs.js";
import { getMyApplications } from "./Api.js";
import { getLoggedInUser, getSavedJobs, toggleSavedJob } from "./Storage.js";

const navy = "text-[#0B1B4D]";
const blueBtn = "bg-[#0F5CFF] text-white font-semibold";

const PER_PAGE = 9;

const typeOptions = ["Full Time", "Part Time", "Internship", "Freelance", "Remote"];
const expOptions = ["Fresher", "1–3 Years", "3–5 Years", "5+ Years"];
const salaryOptions = [
  { label: "Under ₹3 LPA", test: (n) => n < 3 },
  { label: "₹3–6 LPA", test: (n) => n >= 3 && n < 6 },
  { label: "₹6–12 LPA", test: (n) => n >= 6 && n < 12 },
  { label: "₹12+ LPA", test: (n) => n >= 12 },
];
const sortOptions = [
  { value: "recent", label: "Most Recent" },
  { value: "salaryHigh", label: "Salary: High to Low" },
  { value: "salaryLow", label: "Salary: Low to High" },
];
const popularSearches = ["React Developer", "Full Stack Developer", "Java Developer", "Frontend Developer"];
const locationOptions = [...cityOptions, "Remote"];

const field =
  "w-full h-11 px-3 rounded-lg bg-white border border-[#D7E3FB] text-sm text-[#0B1B4D] outline-none focus:ring-2 focus:ring-[#0F5CFF]/30 focus:border-[#0F5CFF] transition";

const animations = `
  @keyframes cardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .card-in { animation: cardIn 0.35s ease both; }
  @media (prefers-reduced-motion: reduce) { .card-in { animation: none; } }
`;

function timeAgo(value) {
  if (!value) return "";
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return "";
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  if (days < 30) return `Posted ${days} days ago`;
  const months = Math.floor(days / 30);
  return `Posted ${months} month${months > 1 ? "s" : ""} ago`;
}

function VerifiedIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-5 h-5 shrink-0" aria-label="Verified company" role="img">
      <circle cx="10" cy="10" r="10" fill="#0F5CFF" />
      <path d="M5.5 10.3l3 3 6-6.3" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FilterGroup({ title, options, selected, onToggle }) {
  return (
    <div className="mt-6 first:mt-4">
      <h4 className={`font-bold mb-3 ${navy}`}>{title}</h4>
      {options.map((o) => (
        <label key={o} className="flex items-center gap-3 mb-2.5 text-sm text-slate-600 cursor-pointer hover:text-[#0F5CFF]">
          <input
            type="checkbox"
            checked={selected.includes(o)}
            onChange={() => onToggle(o)}
            className="w-4 h-4 accent-[#0F5CFF]"
          />
          {o}
        </label>
      ))}
    </div>
  );
}

function JobBadge({ job }) {
  if (job.featured) return <span className="bg-[#E4EEFF] text-[#0F5CFF] text-xs font-semibold px-3 py-1.5 rounded-full">★ Featured</span>;
  if (job.workMode === "Remote") return <span className="bg-[#DDF7E8] text-[#12804A] text-xs font-semibold px-3 py-1.5 rounded-full">Remote</span>;
  if (job.topJob) return <span className="bg-[#EFE5FF] text-[#6B2FD6] text-xs font-semibold px-3 py-1.5 rounded-full">★ Top Job</span>;
  return null;
}

export default function JobListing({ search = true }) {
  const navigate = useNavigate();

  const { jobs, loading, error: jobsError } = useJobs();

  const [params] = useSearchParams();
  const typeFromUrl = params.get("type");

  const [filters, setFilters] = useState({
    type: typeOptions.includes(typeFromUrl) ? [typeFromUrl] : [],
    exp: [],
    salary: "",
  });
  const [sort, setSort] = useState("recent");
  const [view, setView] = useState("list");
  const [page, setPage] = useState(1);

  const [savedIds, setSavedIds] = useState(() => getSavedJobs().map((s) => Number(s.id)));

  const emptyQuery = { keyword: "", location: "", category: params.get("category") || "" };
  const [query, setQuery] = useState({
    keyword: params.get("keyword") || "",
    location: params.get("location") || "",
    category: params.get("category") || "",
  });

  const [appliedIds, setAppliedIds] = useState([]);
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    getMyApplications()
      .then((list) =>
        setAppliedIds(list.filter((a) => a.status !== "Cancelled").map((a) => Number(a.jobId)))
      )
      .catch(() => setAppliedIds([]));
  }, []);

  const updateQuery = (patch) => {
    setQuery((q) => ({ ...q, ...patch }));
    setPage(1);
  };

  const toggle = (group, value) => {
    setFilters((f) => ({
      ...f,
      [group]: f[group].includes(value) ? f[group].filter((v) => v !== value) : [...f[group], value],
    }));
    setPage(1);
  };

  const clearAll = () => {
    setFilters({ type: [], exp: [], salary: "" });
    setQuery({ keyword: "", location: "", category: "" });
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const matching = jobs.filter((j) => {
    const text = `${j.title} ${j.company}`.toLowerCase();
    const keywordOk = !query.keyword.trim() || text.includes(query.keyword.trim().toLowerCase());

    const loc = query.location.trim().toLowerCase();
    const place = `${j.city} ${j.area || ""} ${j.workMode === "Remote" ? "remote" : ""}`.toLowerCase();
    const locationOk = !loc || place.includes(loc);

    const categoryOk = !query.category || j.category === query.category;

    const typeOk =
      !filters.type.length ||
      filters.type.some((t) => (t === "Remote" ? j.workMode === "Remote" : j.type === t));
    const expOk = !filters.exp.length || filters.exp.includes(j.exp);
    const salaryRule = salaryOptions.find((s) => s.label === filters.salary);
    const salaryOk = !salaryRule || salaryRule.test(j.lpa);

    return keywordOk && locationOk && categoryOk && typeOk && expOk && salaryOk;
  });

  const stamp = (j) => new Date(j.createdAt || j.postedAt || 0).getTime() || 0;
  const visibleJobs = [...matching].sort((a, b) => {
    if (sort === "salaryHigh") return (b.lpa || 0) - (a.lpa || 0);
    if (sort === "salaryLow") return (a.lpa || 0) - (b.lpa || 0);
    return stamp(b) - stamp(a) || Number(b.id) - Number(a.id);
  });

  const totalPages = Math.max(1, Math.ceil(visibleJobs.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PER_PAGE;
  const pageJobs = visibleJobs.slice(start, start + PER_PAGE);

  const goToPage = (n) => {
    if (n < 1 || n > totalPages || n === currentPage) return;
    setPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApply = (id) => {
    if (!getLoggedInUser()) {
      navigate("/login", { state: { from: `/apply/${id}` } });
      return;
    }
    navigate(`/apply/${id}`);
  };

  const handleSave = (j) => {
    if (!getLoggedInUser()) {
      navigate("/login");
      return;
    }
    const nowSaved = toggleSavedJob({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.area ? `${j.area}, ${j.city}` : j.city,
      salary: j.pay,
    });
    setSavedIds((ids) => (nowSaved ? [...ids, j.id] : ids.filter((x) => x !== j.id)));
  };

  const isGrid = view === "grid";
  const viewBtn = (active) =>
    `w-10 h-10 grid place-items-center rounded-lg border transition ${
      active ? "bg-[#0F5CFF] border-[#0F5CFF] text-white" : "bg-white border-[#D7E3FB] text-slate-500 hover:text-[#0F5CFF]"
    }`;
  const pageBtn =
    "w-10 h-10 rounded-lg font-semibold border transition disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="font-sans text-slate-800 min-h-screen flex flex-col bg-[#F5F8FF]">
      <style>{animations}</style>

      <Navbar />

      <main className="flex-1">
        {search && (
          <section className="bg-gradient-to-br from-[#E6EFFF] via-[#EEF4FF] to-[#DCE8FF] px-6 md:px-16 lg:px-28 py-10 md:py-14">
            <div className="max-w-[1300px] mx-auto grid lg:grid-cols-[1fr_1.15fr] gap-10 items-center">
              <div>
                <h1 className={`text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight ${navy}`}>
                  Find Your
                  <br />
                  <span className="text-[#0F5CFF]">Dream Job</span>
                </h1>
                <p className="mt-5 text-slate-700 max-w-sm">
                  Explore thousands of job opportunities and start your career journey today.
                </p>
              </div>

              <form
                onSubmit={handleSearch}
                className="bg-white/80 backdrop-blur border border-white rounded-2xl p-4 shadow-[0_10px_40px_rgba(15,92,255,0.12)]"
              >
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    className={`${field} md:flex-[1.3] h-12`}
                    placeholder="Search job title, keywords..."
                    aria-label="Job title or keyword"
                    value={query.keyword}
                    onChange={(e) => updateQuery({ keyword: e.target.value })}
                  />
                  <input
                    className={`${field} md:flex-1 h-12`}
                    list="job-cities"
                    placeholder="Location"
                    aria-label="Location"
                    value={query.location}
                    onChange={(e) => updateQuery({ location: e.target.value })}
                  />
                  <datalist id="job-cities">
                    {locationOptions.map((c) => <option key={c} value={c} />)}
                  </datalist>
                  <button type="submit" className={`${blueBtn} h-12 px-6 rounded-lg transition hover:brightness-110 active:scale-95`}>
                    Search Jobs
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="text-sm font-semibold text-slate-700 mr-1">Popular searches:</span>
                  {popularSearches.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateQuery({ keyword: p })}
                      className="text-sm px-3 py-1 rounded-full bg-[#E4EEFF] text-[#2B4FA8] transition hover:bg-[#0F5CFF] hover:text-white"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </form>
            </div>
          </section>
        )}

        <div className="px-6 md:px-16 lg:px-28 py-10">
          <div className="max-w-[1300px] mx-auto grid lg:grid-cols-[280px_1fr] gap-8 items-start">
            <aside className="bg-white border border-[#E1E9FA] rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-bold ${navy}`}>Filter Jobs</h3>
                <button onClick={clearAll} className="text-sm text-[#0F5CFF] font-semibold hover:underline">
                  Clear
                </button>
              </div>

              <FilterGroup title="Job Type" options={typeOptions} selected={filters.type} onToggle={(v) => toggle("type", v)} />
              <FilterGroup title="Experience Level" options={expOptions} selected={filters.exp} onToggle={(v) => toggle("exp", v)} />

              <div className="mt-6">
                <label htmlFor="f-location" className={`block font-bold mb-2 ${navy}`}>Location</label>
                <select
                  id="f-location"
                  className={field}
                  value={query.location}
                  onChange={(e) => updateQuery({ location: e.target.value })}
                >
                  <option value="">Select Location</option>
                  {locationOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="mt-5">
                <label htmlFor="f-salary" className={`block font-bold mb-2 ${navy}`}>Salary Range</label>
                <select
                  id="f-salary"
                  className={field}
                  value={filters.salary}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, salary: e.target.value }));
                    setPage(1);
                  }}
                >
                  <option value="">Select Salary</option>
                  {salaryOptions.map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
                </select>
              </div>

              <button
                onClick={clearAll}
                className={`${blueBtn} w-full h-11 rounded-lg mt-6 transition hover:brightness-110 active:scale-95`}
              >
                Clear all filters
              </button>
            </aside>

            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <p className="text-slate-600">
                  {loading
                    ? "Loading jobs..."
                    : visibleJobs.length === 0
                    ? `Showing 0 of ${jobs.length} jobs`
                    : `Showing ${start + 1}–${start + pageJobs.length} of ${visibleJobs.length} jobs`}
                </p>
                <div className="flex items-center gap-3">
                  <label htmlFor="sort" className="text-sm text-slate-600">Sort by:</label>
                  <select
                    id="sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-white border border-[#D7E3FB] text-sm text-[#0B1B4D] outline-none focus:ring-2 focus:ring-[#0F5CFF]/30"
                  >
                    {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <button onClick={() => setView("grid")} className={viewBtn(isGrid)} aria-label="Grid view" aria-pressed={isGrid}>
                    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor"><rect x="2" y="2" width="7" height="7" rx="1.5" /><rect x="11" y="2" width="7" height="7" rx="1.5" /><rect x="2" y="11" width="7" height="7" rx="1.5" /><rect x="11" y="11" width="7" height="7" rx="1.5" /></svg>
                  </button>
                  <button onClick={() => setView("list")} className={viewBtn(!isGrid)} aria-label="List view" aria-pressed={!isGrid}>
                    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor"><rect x="2" y="3" width="16" height="3" rx="1.5" /><rect x="2" y="8.5" width="16" height="3" rx="1.5" /><rect x="2" y="14" width="16" height="3" rx="1.5" /></svg>
                  </button>
                </div>
              </div>

              {jobsError && <p className="text-red-600 mb-4">{jobsError}</p>}

              {!loading && !jobsError && visibleJobs.length === 0 && (
                <div className="bg-white border border-[#E1E9FA] rounded-2xl p-10 text-center">
                  <p className="text-slate-600">No jobs match your search. Try removing a filter.</p>
                  <button onClick={clearAll} className={`${blueBtn} px-6 py-2 rounded-lg mt-4 transition hover:brightness-110 active:scale-95`}>
                    Clear all
                  </button>
                </div>
              )}

              <div
                key={`${currentPage}-${visibleJobs.length}-${view}`}
                className={isGrid ? "grid md:grid-cols-2 gap-4" : "space-y-4"}
              >
                {pageJobs.map((j, i) => {
                  const isApplied = appliedIds.includes(j.id);
                  const isSaved = savedIds.includes(j.id);
                  const posted = timeAgo(j.createdAt || j.postedAt);
                  const where = j.area ? `${j.area}, ${j.city}` : j.city;

                  return (
                    <article
                      key={j.id}
                      style={{ animationDelay: `${i * 40}ms` }}
                      className={`card-in bg-white border border-[#E1E9FA] rounded-2xl p-5 transition hover:border-[#0F5CFF]/40 hover:shadow-[0_8px_28px_rgba(15,92,255,0.10)] flex gap-4 ${
                        isGrid ? "flex-col" : "flex-col sm:flex-row sm:items-center"
                      }`}
                    >
                      <div className="w-[72px] h-[72px] rounded-2xl bg-[#F3F6FD] grid place-items-center shrink-0">
                        <div className={`${j.color} w-12 h-12 rounded-full grid place-items-center text-white text-2xl font-bold`}>
                          {j.company[0]}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={`text-xl font-bold flex items-center gap-2 ${navy}`}>
                          <span className="truncate">{j.title}</span>
                          <VerifiedIcon />
                        </h3>
                        <p className="text-sm text-slate-700 mt-1">
                          {j.company} • {j.type} • {j.workMode === "Remote" ? "Remote" : "On-site"}
                        </p>
                        <p className="text-sm text-slate-600 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>📍 {where}</span>
                          <span className="font-semibold text-[#0B1B4D]">{j.pay}</span>
                          <span>{j.exp}</span>
                        </p>
                        {j.description && (
                          <p className="text-sm text-slate-500 mt-2 line-clamp-1">{j.description}</p>
                        )}
                      </div>

                      <div className={`flex gap-3 ${isGrid ? "items-center justify-between" : "sm:flex-col sm:items-end items-center justify-between"}`}>
                        <div className="flex flex-col items-start sm:items-end gap-2">
                          <JobBadge job={j} />
                          {posted && <span className="text-xs text-slate-500">🕒 {posted}</span>}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSave(j)}
                            aria-label={isSaved ? "Remove from saved jobs" : "Save job"}
                            aria-pressed={isSaved}
                            className={`w-11 h-11 rounded-full border text-xl transition active:scale-95 ${
                              isSaved
                                ? "border-[#0F5CFF] text-[#0F5CFF] bg-[#E4EEFF]"
                                : "border-[#D7E3FB] text-slate-400 hover:text-[#0F5CFF] hover:border-[#0F5CFF]"
                            }`}
                          >
                            {isSaved ? "★" : "☆"}
                          </button>

                          {isApplied ? (
                            <Link
                              to="/dashboard"
                              className="h-11 px-6 grid place-items-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold transition hover:bg-emerald-100"
                            >
                              Applied ✓
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleApply(j.id)}
                              className={`${blueBtn} h-11 px-6 rounded-lg transition hover:brightness-110 active:scale-95`}
                            >
                              Apply Now
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {visibleJobs.length > 0 && totalPages > 1 && (
                <div className="flex flex-wrap gap-2 mt-8">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`${pageBtn} bg-white border-[#D7E3FB] text-[#0B1B4D] hover:border-[#0F5CFF]`}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => goToPage(n)}
                      aria-current={currentPage === n ? "page" : undefined}
                      className={`${pageBtn} ${
                        currentPage === n
                          ? "bg-[#0F5CFF] text-white border-[#0F5CFF]"
                          : "bg-white text-[#0B1B4D] border-[#D7E3FB] hover:border-[#0F5CFF]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`${pageBtn} bg-white border-[#D7E3FB] text-[#0B1B4D] hover:border-[#0F5CFF]`}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
