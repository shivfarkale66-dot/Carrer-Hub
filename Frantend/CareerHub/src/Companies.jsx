import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "./Config.js";
import { authFetch } from "./Authfetch.js";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

const navy = "text-[#0B1B4D]";
const blueBtn = "bg-[#0F5CFF] text-white font-semibold";
const PER_PAGE = 6;

const COLORS = [
  "bg-emerald-500", "bg-[#0F5CFF]", "bg-violet-500", "bg-sky-500", "bg-red-500",
  "bg-teal-500", "bg-pink-500", "bg-indigo-500", "bg-rose-500", "bg-orange-500",
];

function sizeNumber(text) {
  const nums = String(text || "").match(/\d+/g);
  if (!nums) return 0;
  const last = Number(nums[nums.length - 1]);
  return /\+/.test(text) ? last + 1 : last;
}

function toCard(c) {
  const about = c.about || "";
  return {
    id: c.id,
    name: c.name,
    industry: c.industry || "Other",
    city: c.city,
    jobs: c.openJobs ?? 0,
    employees: sizeNumber(c.size),
    sizeText: c.size || "",
    color: COLORS[c.id % COLORS.length],
    tagline: about.split(". ")[0] || "",
    tags: [c.industry, c.area].filter(Boolean),
    about,
  };
}

const sizeOptions = [
  { label: "1–50 Employees", test: (n) => n <= 50 },
  { label: "51–200 Employees", test: (n) => n > 50 && n <= 200 },
  { label: "201–1000 Employees", test: (n) => n > 200 && n <= 1000 },
  { label: "1000+ Employees", test: (n) => n > 1000 },
];
const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "name", label: "Name (A–Z)" },
];

const animations = `
  @keyframes cardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .card-in { animation: cardIn 0.35s ease both; }
  @media (prefers-reduced-motion: reduce) { .card-in { animation: none; } }
`;

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
          <input type="checkbox" checked={selected.includes(o)} onChange={() => onToggle(o)} className="w-4 h-4 accent-[#0F5CFF]" />
          {o}
        </label>
      ))}
    </div>
  );
}

export default function Companies() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ industry: [], size: [], location: [] });
  const [sort, setSort] = useState("popular");
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [followed, setFollowed] = useState([]);
  const loggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/companies`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((list) => alive && setCompanies(list.map(toCard)))
      .catch(() => alive && setLoadError("Could not load companies. Please try again later."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    let alive = true;
    authFetch("/api/follows")
      .then((r) => (r.ok ? r.json() : []))
      .then((ids) => alive && Array.isArray(ids) && setFollowed(ids))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [loggedIn]);

  const industries = useMemo(() => [...new Set(companies.map((c) => c.industry))].sort(), [companies]);
  const locations = useMemo(() => [...new Set(companies.map((c) => c.city))].sort(), [companies]);

  const toggle = (group, value) => {
    setFilters((f) => ({
      ...f,
      [group]: f[group].includes(value) ? f[group].filter((v) => v !== value) : [...f[group], value],
    }));
    setPage(1);
  };

  const clearAll = () => {
    setSearch("");
    setFilters({ industry: [], size: [], location: [] });
    setPage(1);
  };

  const toggleFollow = (id) => {
    if (!loggedIn) {
      navigate("/login", { state: { from: { pathname: "/companies" } } });
      return;
    }
    const was = followed.includes(id);
    setFollowed(was ? followed.filter((x) => x !== id) : [...followed, id]);
    authFetch(`/api/follows/${id}`, { method: was ? "DELETE" : "PUT" })
      .then((r) => {
        if (!r.ok) throw new Error();
      })
      .catch(() => setFollowed(followed));
  };

  const text = search.trim().toLowerCase();
  const matching = companies.filter((c) => {
    const textOk =
      !text || `${c.name} ${c.industry} ${c.city}`.toLowerCase().includes(text);
    const industryOk = !filters.industry.length || filters.industry.includes(c.industry);
    const sizeOk = !filters.size.length || sizeOptions.some((s) => filters.size.includes(s.label) && s.test(c.employees));
    const locationOk = !filters.location.length || filters.location.includes(c.city);
    return textOk && industryOk && sizeOk && locationOk;
  });

  const visible = [...matching].sort((a, b) =>
    sort === "name" ? a.name.localeCompare(b.name) : b.jobs - a.jobs
  );

  const totalPages = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PER_PAGE;
  const pageItems = visible.slice(start, start + PER_PAGE);

  const goToPage = (n) => {
    if (n < 1 || n > totalPages || n === currentPage) return;
    setPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isGrid = view === "grid";
  const viewBtn = (active) =>
    `w-10 h-10 grid place-items-center rounded-lg border transition ${
      active ? "bg-[#0F5CFF] border-[#0F5CFF] text-white" : "bg-white border-[#D7E3FB] text-slate-500 hover:text-[#0F5CFF]"
    }`;
  const pageBtn = "w-10 h-10 rounded-lg font-semibold border transition disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="font-sans text-slate-800 min-h-screen flex flex-col bg-[#F5F8FF]">
      <style>{animations}</style>

      <Navbar />

      <main className="flex-1 px-6 md:px-16 lg:px-28 py-8">
        <div className="max-w-[1300px] mx-auto">
          <section className="rounded-3xl bg-gradient-to-br from-[#E6EFFF] via-[#EEF4FF] to-[#DCE8FF] border border-[#D7E3FB] px-8 md:px-12 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-[#0F5CFF] font-bold">Top companies</p>
              <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight mt-1 ${navy}`}>
                Explore Leading Companies
              </h1>
              <p className="mt-3 text-slate-700 max-w-xl">
                Discover top companies, learn about their culture, and find your dream workplace.
              </p>
            </div>
            <p className={`text-2xl font-semibold italic md:text-right ${navy}`}>
              Great Companies,
              <br />
              Better Careers
            </p>
          </section>

          <form
            onSubmit={(e) => { e.preventDefault(); setPage(1); }}
            className="bg-white border border-[#E1E9FA] rounded-2xl p-3 mt-5 flex gap-3"
          >
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search companies..."
              aria-label="Search companies"
              className="flex-1 h-12 px-4 rounded-lg bg-white border border-[#D7E3FB] text-[#0B1B4D] outline-none focus:ring-2 focus:ring-[#0F5CFF]/30 focus:border-[#0F5CFF] transition"
            />
            <button type="submit" className={`${blueBtn} h-12 px-8 rounded-lg transition hover:brightness-110 active:scale-95`}>
              Search
            </button>
          </form>

          <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start mt-6">
            <aside className="bg-white border border-[#E1E9FA] rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-bold ${navy}`}>Filters</h3>
                <button onClick={clearAll} className="text-sm text-[#0F5CFF] font-semibold hover:underline">Clear All</button>
              </div>
              <FilterGroup title="Industry" options={industries} selected={filters.industry} onToggle={(v) => toggle("industry", v)} />
              <FilterGroup title="Company Size" options={sizeOptions.map((s) => s.label)} selected={filters.size} onToggle={(v) => toggle("size", v)} />
              <FilterGroup title="Location" options={locations} selected={filters.location} onToggle={(v) => toggle("location", v)} />
            </aside>

            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <p className="text-slate-600">
                  {visible.length === 0
                    ? `Showing 0 of ${companies.length} companies`
                    : `Showing ${start + 1}–${start + pageItems.length} of ${visible.length} companies`}
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

              {loading && <p className="text-slate-600">Loading companies...</p>}
              {loadError && <p className="text-red-600">{loadError}</p>}

              {!loading && !loadError && visible.length === 0 && (
                <div className="bg-white border border-[#E1E9FA] rounded-2xl p-10 text-center">
                  <p className="text-slate-600">No companies found. Try removing a filter.</p>
                  <button onClick={clearAll} className={`${blueBtn} px-6 py-2 rounded-lg mt-4 transition hover:brightness-110 active:scale-95`}>
                    Clear filters
                  </button>
                </div>
              )}

              <div
                key={`${text}-${currentPage}-${visible.length}-${view}-${sort}`}
                className={isGrid ? "grid sm:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-4"}
              >
                {pageItems.map((c, i) => {
                  const isFollowed = followed.includes(c.id);
                  return (
                    <article
                      key={c.id}
                      style={{ animationDelay: `${i * 40}ms` }}
                      className={`card-in bg-white border border-[#E1E9FA] rounded-2xl p-5 flex gap-4 transition hover:border-[#0F5CFF]/40 hover:shadow-[0_8px_28px_rgba(15,92,255,0.10)] ${
                        isGrid ? "flex-col" : "flex-col sm:flex-row sm:items-center"
                      }`}
                    >
                      <div className="flex gap-4 flex-1 min-w-0">
                        <div className="w-[72px] h-[72px] rounded-2xl bg-[#F3F6FD] grid place-items-center shrink-0">
                          <div className={`${c.color} w-12 h-12 rounded-full grid place-items-center text-white text-2xl font-bold`}>
                            {c.name[0]}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h3 className={`text-lg font-bold flex items-center gap-2 ${navy}`}>
                            <span className="truncate">{c.name}</span>
                            <VerifiedIcon />
                          </h3>
                          <p className="text-sm text-slate-700 mt-0.5">{c.tagline}</p>
                          <p className="text-xs text-slate-500 mt-2">
                            {c.sizeText ? `${c.sizeText} • ` : ""}{c.city}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {c.tags.map((t) => (
                              <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-[#E4EEFF] text-[#2B4FA8]">{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className={`flex items-center justify-between gap-3 ${isGrid ? "" : "sm:flex-col sm:items-end"}`}>
                        <Link
                          to={`/companies/${c.id}`}
                          className="text-sm font-semibold text-[#0F5CFF] hover:underline"
                        >
                          View {c.jobs} jobs →
                        </Link>
                        <button
                          onClick={() => toggleFollow(c.id)}
                          aria-pressed={isFollowed}
                          className={`h-10 px-5 rounded-lg border font-semibold text-sm transition active:scale-95 ${
                            isFollowed
                              ? "bg-[#0F5CFF] border-[#0F5CFF] text-white"
                              : "bg-white border-[#0F5CFF] text-[#0F5CFF] hover:bg-[#E4EEFF]"
                          }`}
                        >
                          {isFollowed ? "Following ✓" : "Follow"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {visible.length > 0 && totalPages > 1 && (
                <div className="flex flex-wrap justify-center gap-2 mt-8">
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
